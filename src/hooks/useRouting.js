import { useState, useCallback } from 'react';

// Haversine distance helper (km)
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export function useRouting(hazards) {
  const [routes, setRoutes] = useState([]);
  const [destination, setDestination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const calculate = useCallback(async (start, end) => {
    if (!start || !end) {
      if (!start && !end) {
        setRoutes([]);
        setDestination(null);
      }
      return;
    }
    setLoading(true);
    setDestination(end);
    
    try {
      const resp = await fetch(`https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&alternatives=true`);
      const data = await resp.json();
      
      if (data.routes) {
        const processedRoutes = data.routes.map((r, i) => {
          let modHazCount = 0;
          let highHazCount = 0;
          let critHazCount = 0;
          
          const coords = r.geometry.coordinates;
          
          // Sample coordinates to avoid heavy perf hit on long routes
          const sampleStep = Math.max(1, Math.floor(coords.length / 50));
          
          for (let j = 0; j < coords.length; j += sampleStep) {
            const [pLng, pLat] = coords[j];
            hazards.forEach(h => {
              const [hLng, hLat] = h.coords;
              const dist = getDistance(pLat, pLng, hLat, hLng);
              if (dist < 0.8) {
                if (h.severity === 'CRITICAL') critHazCount++;
                else if (h.severity === 'HIGH') highHazCount++;
                else modHazCount++;
              }
            });
          }

          // Generate segments for differentiated map coloring
          const dangerSegments = [];
          if (coords.length > 0) {
            let currentSegment = { points: [coords[0]], isDanger: false };
            
            for (let j = 1; j < coords.length; j++) {
              const [pLng, pLat] = coords[j];
              const isInDanger = hazards.some(h => {
                const [hLng, hLat] = h.coords;
                return getDistance(pLat, pLng, hLat, hLng) < 0.8;
              });

              if (isInDanger === currentSegment.isDanger) {
                currentSegment.points.push(coords[j]);
              } else {
                dangerSegments.push(currentSegment);
                // Duplicate last point to avoid gaps
                currentSegment = { points: [coords[j-1], coords[j]], isDanger: isInDanger };
              }
            }
            dangerSegments.push(currentSegment);
          }

          const distanceKm = r.distance / 1000;
          return {
            ...r,
            id: `route-${i}`,
            distanceKm: distanceKm.toFixed(1),
            durationMin: Math.round(r.duration / 60),
            modHazCount,
            highHazCount,
            critHazCount,
            rawDistance: distanceKm,
            dangerSegments
          };
        });

        // 2. Transmit batch to the highly-optimized Python API for ML Analytics
        try {
          const payload = {
            routes: processedRoutes.map(r => ({
              id: r.id,
              distance_km: r.rawDistance,
              mod_haz: r.modHazCount,
              high_haz: r.highHazCount,
              crit_haz: r.critHazCount
            }))
          };

          const mlResp = await fetch('http://127.0.0.1:5000/predict_safety', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          
          if (!mlResp.ok) throw new Error("Python Pipeline Error");
          const aiData = await mlResp.json();

          // Map the Python AI scores back to the UI state
          const fullyScoredRoutes = processedRoutes.map(r => ({
            ...r,
            safetyScore: aiData.predictions[r.id] || 50
          }));

          // Sort strictly by Python's predictive algorithm
          setRoutes(fullyScoredRoutes.sort((a, b) => b.safetyScore - a.safetyScore));
          setSelectedIndex(0);

        } catch (apiError) {
          console.error("Python Server offline or failed:", apiError);
          // Fallback to purely mechanical scoring if the Python AI cluster spins down
          const fallbackRoutes = processedRoutes.map(r => ({
            ...r,
            safetyScore: Math.max(15, 95 - (r.critHazCount * 25) - (r.highHazCount * 10) - (r.modHazCount * 2))
          }));
          setRoutes(fallbackRoutes.sort((a, b) => b.safetyScore - a.safetyScore));
          setSelectedIndex(0);
        }
      }
    } catch (err) {
      console.error('Routing failure:', err);
    } finally {
      setLoading(false);
    }
  }, [hazards]);

  return { routes, destination, loading, selectedIndex, setSelectedIndex, calculate };
}

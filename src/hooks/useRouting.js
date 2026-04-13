import { useState, useCallback } from 'react';
import { getRoutes } from '../services/mapbox';

/**
 * Calculate safety score for a route based on proximity to hazards.
 */
function calcSafetyScore(routeCoords, hazards) {
  if (!hazards || hazards.length === 0) return { score: 98, nearbyHazards: [] };
  let penalty = 0;
  const encountered = new Set();
  
  routeCoords.forEach(([lng, lat]) => {
    hazards.forEach(h => {
      const dlng = lng - h.coords[0];
      const dlat = lat - h.coords[1];
      const distDeg = Math.sqrt(dlng * dlng + dlat * dlat);
      const distKm = distDeg * 111;
      
      if (distKm < 0.6) {
        encountered.add(h.id);
        penalty += h.severity === 'EXTREME' ? 25 : h.severity === 'HIGH' ? 15 : 8;
      } else if (distKm < 1.2) {
        penalty += h.severity === 'EXTREME' ? 10 : 5;
      }
    });
  });

  const nearbyHazards = hazards.filter(h => encountered.has(h.id));
  return { 
    score: Math.max(5, Math.min(99, 98 - penalty)), 
    nearbyHazards 
  };
}

/**
 * Hook for calculating real routes between two points, scored by safety.
 */
export function useRouting(hazards = []) {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [destination, setDestination] = useState(null);

  const calculate = useCallback(async (origin, dest) => {
    console.log('[Routing] Starting calculation for destination:', dest.place_name);
    setLoading(true);
    setError(null);
    setDestination(dest);
    try {
      console.log('[Routing] Requesting Mapbox Directions...');
      const rawRoutes = await getRoutes(
        [origin.lng, origin.lat],
        [dest.coords[0], dest.coords[1]]
      );
      console.log(`[Routing] Found ${rawRoutes.length} raw routes.`);
      const scored = rawRoutes.map(r => {
        const { score, nearbyHazards } = calcSafetyScore(r.geometry.coordinates, hazards);
        return {
          ...r,
          safetyScore: score,
          nearbyHazards,
          label: `ROUTE ${r.index + 1}`,
        };
      });
      // Sort by safety score descending
      scored.sort((a, b) => b.safetyScore - a.safetyScore);
      scored[0].label = 'SAFETY OPTIMIZED';
      if (scored[1]) {
        // If the second one is faster but less safe, label it FASTEST
        const isFaster = scored[1].duration < scored[0].duration;
        scored[1].label = isFaster ? 'FASTEST ALT.' : 'ALTERNATE ROUTE';
      }
      console.log('[Routing] Routes scored and sorted successfully.');
      setRoutes(scored);
      setSelectedIndex(0);
    } catch (e) {
      console.error('[Routing] Error:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [hazards]);

  const clear = useCallback(() => {
    setRoutes([]);
    setDestination(null);
    setError(null);
  }, []);

  return { routes, loading, error, selectedIndex, setSelectedIndex, calculate, clear, destination };
}

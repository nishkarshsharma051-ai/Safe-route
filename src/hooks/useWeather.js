import { useState, useEffect, useCallback } from 'react';

const OWM_KEY = import.meta.env.VITE_OWM_KEY;

export function useWeather(coords) {
  const [weather, setWeather] = useState(null);
  const [hazards, setHazards] = useState([]);

  const refresh = useCallback(async () => {
    if (!coords || !OWM_KEY) return;
    try {
      const resp = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lng}&appid=${OWM_KEY}&units=metric`);
      const data = await resp.json();
      
      const newHazards = [];

      if (data && data.main && data.weather && data.weather[0]) {
        setWeather({
          temp: Math.round(data.main.temp),
          condition: data.weather[0].main,
          icon: data.weather[0].icon
        });

        const wId = data.weather[0].id;

        // Map exact OWM Condition IDs to Standard Meteorological Warnings
        if (wId >= 200 && wId <= 232) {
          newHazards.push({ id: `ts-${Date.now()}`, type: 'storm', name: 'Severe Thunderstorm Warning', severity: 'HIGH', coords: [coords.lng, coords.lat] });
        } else if (wId === 504 || wId === 503) {
          newHazards.push({ id: `rn-${Date.now()}`, type: 'flood', name: 'Flash Flood Watch', severity: 'MODERATE', coords: [coords.lng, coords.lat] });
        } else if (wId === 781) {
          newHazards.push({ id: `tor-${Date.now()}`, type: 'tornado', name: 'Tornado Warning', severity: 'CRITICAL', coords: [coords.lng, coords.lat] });
        } else if (wId === 771) {
          newHazards.push({ id: `sq-${Date.now()}`, type: 'wind', name: 'Squall Line Advisory', severity: 'HIGH', coords: [coords.lng, coords.lat] });
        } else if (wId === 762 || wId === 721) {
          newHazards.push({ id: `sm-${Date.now()}`, type: 'smoke', name: 'Air Quality: Hazardous (Ash/Smoke)', severity: 'MODERATE', coords: [coords.lng, coords.lat] });
        } else if (data.main.temp > 39) {
          newHazards.push({ id: 'heat', type: 'heat', name: 'Extreme Heat Advisory', severity: 'HIGH', coords: [coords.lng, coords.lat] });
        } else if (data.main.temp < -10) {
          newHazards.push({ id: 'freeze', type: 'freeze', name: 'Hard Freeze Warning', severity: 'MODERATE', coords: [coords.lng, coords.lat] });
        }

        if (data.wind && data.wind.speed > 18) {
          newHazards.push({ id: 'gale', type: 'wind', name: 'Gale Warning', severity: 'HIGH', coords: [coords.lng, coords.lat] });
        }
      }

      // Live Seismic Data from U.S. Geological Survey (USGS)
      try {
        const usgsResp = await fetch(`https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=${coords.lat}&longitude=${coords.lng}&maxradiuskm=1000&minmagnitude=4.0&limit=3&orderby=time`);
        const usgsData = await usgsResp.json();
        
        if (usgsData && usgsData.features) {
          usgsData.features.forEach((feature) => {
            const mag = feature.properties.mag;
            const place = feature.properties.place;
            const eqLng = feature.geometry.coordinates[0];
            const eqLat = feature.geometry.coordinates[1];
            
            newHazards.push({
              id: feature.id,
              type: 'earthquake',
              name: `M${mag.toFixed(1)} Earthquake: ${place}`,
              severity: mag >= 6.0 ? 'CRITICAL' : 'HIGH',
              coords: [eqLng, eqLat]
            });
          });
        }
      } catch (eqErr) {
        console.error('USGS API Error:', eqErr);
      }

      setHazards(newHazards);
    } catch (err) {
      console.error('Meteorological Sync Error:', err);
    }
  }, [coords]);

  useEffect(() => {
    refresh();
    const inv = setInterval(refresh, 600000); // 10 min refresh
    return () => clearInterval(inv);
  }, [refresh]);

  return { weather, hazards, refresh };
}

import { useState, useEffect, useCallback } from 'react';
import { fetchWeatherHazards } from '../services/weather';

/**
 * Fetches live weather + derived hazards for given coordinates.
 * Auto-refreshes every 5 minutes.
 */
export function useWeather(coords) {
  const [weather, setWeather] = useState(null);
  const [hazards, setHazards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    if (!coords) return;
    setLoading(true);
    try {
      const result = await fetchWeatherHazards(coords.lat, coords.lng);
      setWeather(result.weather);
      setHazards(result.hazards);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [coords?.lat, coords?.lng]);

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 5 * 60 * 1000); // Refresh every 5 min
    return () => clearInterval(interval);
  }, [fetch]);

  return { weather, hazards, loading, error, refresh: fetch };
}

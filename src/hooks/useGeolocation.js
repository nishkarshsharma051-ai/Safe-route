import { useState, useEffect, useRef } from 'react';

/**
 * Real browser GPS geolocation hook.
 * Returns live user position, loading state, and errors.
 */
export function useGeolocation() {
  const [coords, setCoords] = useState(null);       // { lat, lng }
  const [accuracy, setAccuracy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const watchIdRef = useRef(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported by this browser.');
      setLoading(false);
      return;
    }

    const onSuccess = (position) => {
      setCoords({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
      setAccuracy(position.coords.accuracy);
      setLoading(false);
      setError(null);
    };

    const onError = (err) => {
      setError(err.message);
      setLoading(false);
      // Fall back to a default location (New York City) if denied
      setCoords({ lat: 40.7484, lng: -73.9857 });
    };

    const options = { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 };

    // Get initial position quickly
    navigator.geolocation.getCurrentPosition(onSuccess, onError, options);

    // Watch for live updates
    watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, () => {}, options);

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return { coords, accuracy, loading, error };
}

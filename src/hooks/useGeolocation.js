import { useState, useEffect, useRef } from 'react';

/**
 * Real browser GPS geolocation hook for Aegis Sentinel.
 */
export function useGeolocation() {
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const watchIdRef = useRef(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported.');
      setLoading(false);
      return;
    }

    const onSuccess = (pos) => {
      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setLoading(false);
    };

    const onError = (err) => {
      setError(err.message);
      setLoading(false);
      // Fallback to NYC
      setCoords({ lat: 40.7484, lng: -73.9857 });
    };

    const options = { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 };
    navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
    watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, options);

    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  return { coords, loading, error };
}

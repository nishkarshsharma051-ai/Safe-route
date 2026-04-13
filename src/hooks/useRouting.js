import { useState, useCallback } from 'react';
import { getRoutes } from '../services/mapbox';

/**
 * Calculate safety score for a route based on proximity to hazards.
 * Deducts points for hazards within 500m of any route coordinate.
 */
function calcSafetyScore(routeCoords, hazards) {
  if (!hazards || hazards.length === 0) return 98;
  let penalty = 0;
  routeCoords.forEach(([lng, lat]) => {
    hazards.forEach(h => {
      const dlng = lng - h.coords[0];
      const dlat = lat - h.coords[1];
      const distDeg = Math.sqrt(dlng * dlng + dlat * dlat);
      const distKm = distDeg * 111;
      if (distKm < 0.5) {
        penalty += h.severity === 'EXTREME' ? 20 : h.severity === 'HIGH' ? 12 : 6;
      } else if (distKm < 1.0) {
        penalty += h.severity === 'EXTREME' ? 8 : 4;
      }
    });
  });
  return Math.max(10, Math.min(99, 98 - penalty));
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
    setLoading(true);
    setError(null);
    setDestination(dest);
    try {
      const rawRoutes = await getRoutes(
        [origin.lng, origin.lat],
        [dest.coords[0], dest.coords[1]]
      );
      const scored = rawRoutes.map(r => ({
        ...r,
        safetyScore: calcSafetyScore(r.geometry.coordinates, hazards),
        label: r.index === 0 ? 'SAFETY OPTIMIZED' : `ROUTE ${r.index + 1}`,
      }));
      // Sort by safety score descending
      scored.sort((a, b) => b.safetyScore - a.safetyScore);
      scored[0].label = 'SAFETY OPTIMIZED';
      if (scored[1]) scored[1].label = 'FASTEST ALT.';
      setRoutes(scored);
      setSelectedIndex(0);
    } catch (e) {
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

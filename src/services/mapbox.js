// Mapbox API calls — Geocoding & Directions
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4M29iazA2Z3gycXA4N2pmbDZmangifQ.-g_vE53SD2WrJ6tFX7QHmA';

/**
 * Geocode a text query to coordinates using Mapbox Geocoding API
 * @param {string} query - Address or place name
 * @param {[number, number]} proximity - [lng, lat] for proximity bias
 * @returns {Promise<Array>} - Array of place suggestions
 */
export async function geocodeSearch(query, proximity) {
  if (!query || query.length < 2) return [];
  const prox = proximity ? `&proximity=${proximity[0]},${proximity[1]}` : '';
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&limit=5&types=address,place,poi${prox}`;
  const res = await fetch(url);
  const data = await res.json();
  return (data.features || []).map(f => ({
    id: f.id,
    name: f.text,
    place_name: f.place_name,
    coords: f.center, // [lng, lat]
  }));
}

/**
 * Get driving/walking routes between two points
 * @param {[number,number]} origin - [lng, lat]
 * @param {[number,number]} destination - [lng, lat]
 * @returns {Promise<Array>} - Array of route objects with geometry + stats
 */
export async function getRoutes(origin, destination) {
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?alternatives=true&geometries=geojson&overview=full&steps=false&access_token=${MAPBOX_TOKEN}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.routes || data.routes.length === 0) throw new Error('No routes found');
  return data.routes.map((r, i) => ({
    index: i,
    distance: r.distance,          // meters
    duration: r.duration,          // seconds
    geometry: r.geometry,          // GeoJSON LineString
    distanceKm: (r.distance / 1000).toFixed(1),
    durationMin: Math.round(r.duration / 60),
  }));
}

export { MAPBOX_TOKEN };

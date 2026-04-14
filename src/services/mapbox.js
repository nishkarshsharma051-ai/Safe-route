// Search + routing providers for SafeRoute
import { getGoogleRoutes, isGoogleMapsConfigured } from './googleMaps';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4M29iazA2Z3gycXA4N2pmbDZmangifQ.-g_vE53SD2WrJ6tFX7QHmA';
const PHOTON_ENDPOINT = 'https://photon.komoot.io/api/';
const OSRM_ENDPOINT = 'https://router.project-osrm.org/route/v1/driving';
const GEOCODE_TYPES = [
  'country',
  'region',
  'postcode',
  'district',
  'place',
  'locality',
  'neighborhood',
  'address',
  'poi',
].join(',');

function parseCoordinateQuery(query) {
  const match = query.trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) return null;

  const lat = Number(match[1]);
  const lng = Number(match[2]);

  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  return {
    id: `coords-${lat}-${lng}`,
    name: `Dropped pin (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
    place_name: `Coordinates ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    coords: [lng, lat],
    provider: 'coordinates',
  };
}

function formatPhotonFeature(feature, index) {
  const props = feature.properties || {};
  const [lng, lat] = feature.geometry?.coordinates || [];
  const parts = [
    props.name,
    props.street,
    props.housenumber,
    props.city || props.town || props.village,
    props.state,
    props.country,
  ].filter(Boolean);

  const uniqueParts = [...new Set(parts)];
  const displayName = props.name || props.city || props.state || props.country || 'Selected location';

  return {
    id: props.osm_id ? `photon-${props.osm_type || 'node'}-${props.osm_id}` : `photon-${index}-${displayName}`,
    name: displayName,
    place_name: uniqueParts.join(', ') || displayName,
    coords: [lng, lat],
    category: props.type || props.osm_key || 'location',
    provider: 'photon',
  };
}

function formatOsrmStep(step, stepIndex) {
  const modifier = step.maneuver?.modifier ? ` ${step.maneuver.modifier}` : '';
  const maneuver = step.maneuver?.type ? `${step.maneuver.type}${modifier}` : 'Continue';
  const street = step.name ? ` onto ${step.name}` : '';
  const rawInstruction = step.maneuver?.instruction || `${maneuver}${street}`;

  return {
    id: `osrm-step-${stepIndex}`,
    instruction: rawInstruction,
    distanceText: step.distance >= 1000 ? `${(step.distance / 1000).toFixed(1)} km` : `${Math.round(step.distance)} m`,
    durationText: step.duration ? `${Math.max(1, Math.round(step.duration / 60))} min` : '',
  };
}

async function photonSearch(query, proximity) {
  const params = new URLSearchParams({
    q: query.trim(),
    limit: '8',
    lang: 'en',
    osm_tag: '!railway',
  });

  if (proximity) {
    params.set('lon', String(proximity[0]));
    params.set('lat', String(proximity[1]));
    params.set('location_bias_scale', '0.75');
  }

  const res = await fetch(`${PHOTON_ENDPOINT}?${params.toString()}`);
  if (!res.ok) throw new Error('Location search is unavailable right now.');

  const data = await res.json();
  return (data.features || [])
    .filter((feature) => Array.isArray(feature.geometry?.coordinates))
    .map(formatPhotonFeature);
}

async function osrmRoute(origin, destination) {
  const coordinates = `${origin[0]},${origin[1]};${destination[0]},${destination[1]}`;
  const params = new URLSearchParams({
    alternatives: '3',
    steps: 'true',
    geometries: 'geojson',
    overview: 'full',
    annotations: 'false',
  });

  const res = await fetch(`${OSRM_ENDPOINT}/${coordinates}?${params.toString()}`);
  if (!res.ok) throw new Error('Route service is unavailable right now.');

  const data = await res.json();
  if (data.code !== 'Ok' || !data.routes?.length) {
    throw new Error(data.code === 'NoRoute' ? 'No drivable route found for that destination.' : 'No routes found');
  }

  return data.routes.map((route, index) => ({
    index,
    distance: route.distance,
    duration: route.duration,
    geometry: route.geometry,
    distanceKm: (route.distance / 1000).toFixed(1),
    durationMin: Math.max(1, Math.round(route.duration / 60)),
    steps: (route.legs?.[0]?.steps || []).map(formatOsrmStep),
  }));
}

/**
 * Geocode a text query to coordinates using Photon first, with Mapbox fallback.
 * @param {string} query - Address or place name
 * @param {[number, number]} proximity - [lng, lat] for proximity bias
 * @returns {Promise<Array>} - Array of place suggestions
 */
export async function geocodeSearch(query, proximity) {
  if (!query || query.length < 2) return [];

  const parsedCoords = parseCoordinateQuery(query);
  if (parsedCoords) return [parsedCoords];

  try {
    const photonResults = await photonSearch(query, proximity);
    if (photonResults.length > 0) return photonResults;
  } catch (error) {
    console.warn('Falling back to Mapbox geocoding:', error);
  }

  const params = new URLSearchParams({
    access_token: MAPBOX_TOKEN,
    autocomplete: 'true',
    limit: '8',
    language: 'en',
    types: GEOCODE_TYPES,
    worldview: 'us',
    fuzzyMatch: 'true',
  });

  if (proximity) {
    params.set('proximity', `${proximity[0]},${proximity[1]}`);
  }

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Location search is unavailable right now.');
  const data = await res.json();
  return (data.features || []).map((f, index) => ({
    id: f.id || `${f.place_name}-${index}`,
    name: f.text || f.place_name,
    place_name: f.place_name,
    coords: f.center, // [lng, lat]
    category: f.properties?.category || f.place_type?.[0] || 'location',
  }));
}

/**
 * Get driving/walking routes between two points
 * @param {[number,number]} origin - [lng, lat]
 * @param {[number,number]} destination - [lng, lat]
 * @returns {Promise<Array>} - Array of route objects with geometry + stats
 */
export async function getRoutes(origin, destination) {
  if (isGoogleMapsConfigured()) {
    try {
      return await getGoogleRoutes(origin, destination);
    } catch (error) {
      console.warn('Falling back to OSRM routing:', error);
    }
  }

  try {
    return await osrmRoute(origin, destination);
  } catch (error) {
    console.warn('Falling back to Mapbox routing:', error);
  }

  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?alternatives=true&geometries=geojson&overview=full&steps=true&access_token=${MAPBOX_TOKEN}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Route calculation failed.');
  const data = await res.json();
  if (!data.routes || data.routes.length === 0) throw new Error('No routes found');
  return data.routes.map((route, index) => ({
    index,
    distance: route.distance,
    duration: route.duration,
    geometry: route.geometry,
    distanceKm: (route.distance / 1000).toFixed(1),
    durationMin: Math.max(1, Math.round(route.duration / 60)),
    steps: (route.legs?.[0]?.steps || []).map((step, stepIndex) => ({
      id: `mapbox-step-${index}-${stepIndex}`,
      instruction: step.maneuver?.instruction || 'Continue',
      distanceText: step.distance >= 1000 ? `${(step.distance / 1000).toFixed(1)} km` : `${Math.round(step.distance)} m`,
      durationText: step.duration ? `${Math.max(1, Math.round(step.duration / 60))} min` : '',
    })),
  }));
}

export { MAPBOX_TOKEN };

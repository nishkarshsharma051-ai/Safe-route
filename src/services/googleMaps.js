const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const GOOGLE_MAPS_LIBRARIES = ['places'];

let googleMapsPromise = null;
let placesService = null;

function stripHtml(html = '') {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function isGoogleMapsConfigured() {
  return Boolean(GOOGLE_MAPS_API_KEY && GOOGLE_MAPS_API_KEY !== 'your_google_maps_api_key_here');
}

export async function loadGoogleMapsApi() {
  if (!isGoogleMapsConfigured()) {
    throw new Error('Google Maps is not configured.');
  }

  if (window.google?.maps?.Map) {
    return window.google;
  }

  if (!googleMapsPromise) {
    googleMapsPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-google-maps-loader="true"]');
      if (existing) {
        existing.addEventListener('load', () => resolve(window.google), { once: true });
        existing.addEventListener('error', () => reject(new Error('Google Maps failed to load.')), { once: true });
        return;
      }

      const script = document.createElement('script');
      const params = new URLSearchParams({
        key: GOOGLE_MAPS_API_KEY,
        libraries: GOOGLE_MAPS_LIBRARIES.join(','),
        loading: 'async',
      });

      script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
      script.async = true;
      script.defer = true;
      script.dataset.googleMapsLoader = 'true';
      script.onload = () => resolve(window.google);
      script.onerror = () => reject(new Error('Google Maps failed to load.'));
      document.head.appendChild(script);
    });
  }

  return googleMapsPromise;
}

async function getPlacesService() {
  await loadGoogleMapsApi();

  if (!placesService) {
    placesService = new window.google.maps.places.PlacesService(document.createElement('div'));
  }

  return placesService;
}

function getPlaceDetails(service, placeId) {
  return new Promise((resolve, reject) => {
    service.getDetails(
      {
        placeId,
        fields: ['place_id', 'name', 'formatted_address', 'geometry.location', 'types'],
      },
      (result, status) => {
        if (status !== window.google.maps.places.PlacesServiceStatus.OK || !result?.geometry?.location) {
          reject(new Error(`Place details unavailable for ${placeId}`));
          return;
        }

        resolve({
          id: result.place_id || placeId,
          name: result.name || result.formatted_address || 'Selected location',
          place_name: result.formatted_address || result.name || 'Selected location',
          coords: [result.geometry.location.lng(), result.geometry.location.lat()],
          category: result.types?.[0] || 'location',
        });
      }
    );
  });
}

export async function googleAutocompleteSearch(query, proximity) {
  if (!query || query.trim().length < 2) return [];

  await loadGoogleMapsApi();
  const autocomplete = new window.google.maps.places.AutocompleteService();
  const sessionToken = new window.google.maps.places.AutocompleteSessionToken();

  const request = {
    input: query.trim(),
    sessionToken,
  };

  if (proximity) {
    request.locationBias = new window.google.maps.Circle({
      center: { lat: proximity[1], lng: proximity[0] },
      radius: 50000,
    });
  }

  const predictions = await new Promise((resolve, reject) => {
    autocomplete.getPlacePredictions(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
        resolve([]);
        return;
      }

      if (status !== window.google.maps.places.PlacesServiceStatus.OK) {
        reject(new Error('Google location search is unavailable right now.'));
        return;
      }

      resolve(results || []);
    });
  });

  if (predictions.length === 0) return [];

  const service = await getPlacesService();
  const detailedResults = await Promise.allSettled(
    predictions.slice(0, 6).map((prediction) => getPlaceDetails(service, prediction.place_id))
  );

  return detailedResults
    .filter((result) => result.status === 'fulfilled')
    .map((result) => result.value);
}

export async function getGoogleRoutes(origin, destination) {
  await loadGoogleMapsApi();

  const directionsService = new window.google.maps.DirectionsService();
  const response = await directionsService.route({
    origin: { lat: origin[1], lng: origin[0] },
    destination: { lat: destination[1], lng: destination[0] },
    travelMode: window.google.maps.TravelMode.DRIVING,
    provideRouteAlternatives: true,
    optimizeWaypoints: false,
  });

  if (!response?.routes?.length) {
    throw new Error('No routes found');
  }

  return response.routes.map((route, index) => {
    const leg = route.legs?.[0];
    const coordinates = (route.overview_path || []).map((point) => [point.lng(), point.lat()]);
    const steps = (leg?.steps || []).map((step, stepIndex) => ({
      id: `google-step-${index}-${stepIndex}`,
      instruction: stripHtml(step.instructions || ''),
      distanceText: step.distance?.text || '',
      durationText: step.duration?.text || '',
    }));

    return {
      index,
      distance: leg?.distance?.value || 0,
      duration: leg?.duration?.value || 0,
      geometry: {
        type: 'LineString',
        coordinates,
      },
      distanceKm: ((leg?.distance?.value || 0) / 1000).toFixed(1),
      durationMin: Math.max(1, Math.round((leg?.duration?.value || 0) / 60)),
      summary: route.summary || `Route ${index + 1}`,
      steps,
      viewport: route.bounds
        ? {
            north: route.bounds.getNorthEast().lat(),
            east: route.bounds.getNorthEast().lng(),
            south: route.bounds.getSouthWest().lat(),
            west: route.bounds.getSouthWest().lng(),
          }
        : null,
    };
  });
}

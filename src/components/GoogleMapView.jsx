import { useEffect, useRef, useState } from 'react';
import { isGoogleMapsConfigured, loadGoogleMapsApi } from '../services/googleMaps';
import styles from './Map.module.css';

const HAZARD_COLORS = {
  flood: '#3b82f6',
  fire: '#ef4444',
  wind: '#f59e0b',
  storm: '#8b5cf6',
  snow: '#94a3b8',
  visibility: '#64748b',
  default: '#ef4444',
};

const GOOGLE_DARK_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#0e1016' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0e1016' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8b93ad' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#1b2031' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#141926' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#0f1c1b' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#202534' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#101520' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#081826' }] },
];

export default function GoogleMapView({ userCoords, hazards, routes, selectedRouteIndex, resources, destination }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const infoWindowRef = useRef(null);
  const markersRef = useRef({ user: [], hazards: [], resources: [], destination: [] });
  const routeLinesRef = useRef([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      if (!isGoogleMapsConfigured()) {
        setMapError('Add `VITE_GOOGLE_MAPS_API_KEY` to use the embedded Google map.');
        setMapLoaded(true);
        return;
      }

      try {
        await loadGoogleMapsApi();
        if (cancelled || !mapContainer.current || mapRef.current) return;

        const map = new window.google.maps.Map(mapContainer.current, {
          center: userCoords || { lat: 40.7484, lng: -73.9857 },
          zoom: 12,
          disableDefaultUI: true,
          zoomControl: true,
          fullscreenControl: false,
          mapTypeControl: false,
          streetViewControl: false,
          styles: GOOGLE_DARK_STYLES,
        });

        mapRef.current = map;
        infoWindowRef.current = new window.google.maps.InfoWindow();
        setMapError('');
        setMapLoaded(true);
      } catch (error) {
        console.error('Google Maps init failed:', error);
        if (!cancelled) {
          setMapError('Google Maps could not be loaded. Check your API key and enabled APIs.');
          setMapLoaded(true);
        }
      }
    }

    initMap();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !userCoords || !window.google?.maps) return;

    markersRef.current.user.forEach((marker) => marker.setMap(null));
    markersRef.current.user = [];

    const halo = new window.google.maps.Circle({
      map: mapRef.current,
      center: userCoords,
      radius: 220,
      strokeOpacity: 0,
      fillColor: '#10b981',
      fillOpacity: 0.18,
    });

    const dot = new window.google.maps.Marker({
      map: mapRef.current,
      position: userCoords,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 7,
        fillColor: '#10b981',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2.5,
      },
      zIndex: 40,
    });

    markersRef.current.user = [halo, dot];
    mapRef.current.panTo(userCoords);

    return () => {
      halo.setMap(null);
      dot.setMap(null);
    };
  }, [userCoords]);

  useEffect(() => {
    if (!mapRef.current || !window.google?.maps) return;

    markersRef.current.hazards.forEach(({ marker, glow }) => {
      marker.setMap(null);
      glow.setMap(null);
    });
    markersRef.current.hazards = [];

    hazards.forEach((hazard) => {
      const color = HAZARD_COLORS[hazard.type] || HAZARD_COLORS.default;
      const position = { lat: hazard.coords[1], lng: hazard.coords[0] };

      const glow = new window.google.maps.Circle({
        map: mapRef.current,
        center: position,
        radius: hazard.severity === 'EXTREME' ? 900 : hazard.severity === 'HIGH' ? 650 : 420,
        strokeOpacity: 0,
        fillColor: color,
        fillOpacity: 0.12,
      });

      const marker = new window.google.maps.Marker({
        map: mapRef.current,
        position,
        icon: {
          path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 1.5,
        },
        title: hazard.name,
        zIndex: 30,
      });

      marker.addListener('click', () => {
        infoWindowRef.current?.setContent(`
          <div class="${styles.hazardPopup}">
            <div style="color:${color};font-weight:800;font-size:10px;letter-spacing:.08em;margin-bottom:4px">${hazard.severity} ALERT</div>
            <div style="font-weight:700;font-size:14px;margin-bottom:4px">${hazard.name}</div>
            <div style="font-size:12px;color:#9090a0;line-height:1.4">${hazard.recommendation || hazard.description}</div>
          </div>
        `);
        infoWindowRef.current?.open({ anchor: marker, map: mapRef.current });
      });

      markersRef.current.hazards.push({ marker, glow });
    });
  }, [hazards]);

  useEffect(() => {
    if (!mapRef.current || !window.google?.maps) return;

    routeLinesRef.current.forEach((line) => line.setMap(null));
    routeLinesRef.current = [];

    if (!routes.length) return;

    const bounds = new window.google.maps.LatLngBounds();

    routes.forEach((route, index) => {
      const isSelected = index === selectedRouteIndex;
      const path = route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng }));
      path.forEach((point) => bounds.extend(point));

      const polyline = new window.google.maps.Polyline({
        map: mapRef.current,
        path,
        strokeColor: isSelected ? '#10b981' : '#3a3a4a',
        strokeOpacity: isSelected ? 0.95 : 0.55,
        strokeWeight: isSelected ? 6 : 4,
        zIndex: isSelected ? 20 : 10,
      });

      polyline.addListener('click', () => {
        if (!path[0]) return;
        infoWindowRef.current?.setContent(`
          <div class="${styles.hazardPopup}">
            <div style="font-weight:800;font-size:10px;letter-spacing:.08em;margin-bottom:4px;color:${isSelected ? '#10b981' : '#a1a1aa'}">${route.label}</div>
            <div style="font-weight:700;font-size:14px;margin-bottom:4px">${route.distanceKm} km · ${route.durationMin} min</div>
            <div style="font-size:12px;color:#9090a0;line-height:1.4">${route.nearbyHazards?.length ? `Avoids ${route.nearbyHazards.length} nearby hazard zones better than the alternatives.` : 'Currently clear of major hazard penalties.'}</div>
          </div>
        `);
        infoWindowRef.current?.setPosition(path[0]);
        infoWindowRef.current?.open({ map: mapRef.current });
      });

      routeLinesRef.current.push(polyline);
    });

    if (!bounds.isEmpty()) {
      mapRef.current.fitBounds(bounds, 80);
    }
  }, [routes, selectedRouteIndex]);

  useEffect(() => {
    if (!mapRef.current || !window.google?.maps) return;

    markersRef.current.resources.forEach((marker) => marker.setMap(null));
    markersRef.current.resources = [];

    resources.forEach((resource) => {
      const marker = new window.google.maps.Marker({
        map: mapRef.current,
        position: { lat: resource.coords[1], lng: resource.coords[0] },
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 6,
          fillColor: '#10b981',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        title: resource.name,
        zIndex: 25,
      });

      marker.addListener('click', () => {
        infoWindowRef.current?.setContent(`
          <div style="padding:8px 4px">
            <div style="font-weight:700;font-size:14px;margin-bottom:4px">${resource.name}</div>
            <div style="font-size:12px;color:#9090a0">${resource.type}</div>
            ${resource.phone ? `<div style="font-size:12px;margin-top:4px">📞 ${resource.phone}</div>` : ''}
          </div>
        `);
        infoWindowRef.current?.open({ anchor: marker, map: mapRef.current });
      });

      markersRef.current.resources.push(marker);
    });
  }, [resources]);

  useEffect(() => {
    if (!mapRef.current || !window.google?.maps) return;

    markersRef.current.destination.forEach((marker) => marker.setMap(null));
    markersRef.current.destination = [];

    if (!destination?.coords) return;

    const marker = new window.google.maps.Marker({
      map: mapRef.current,
      position: { lat: destination.coords[1], lng: destination.coords[0] },
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#f97316',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2.5,
      },
      title: destination.name || 'Destination',
      zIndex: 35,
    });

    marker.addListener('click', () => {
      infoWindowRef.current?.setContent(`
        <div style="padding:8px 4px">
          <div style="font-weight:700;font-size:14px;margin-bottom:4px">${destination.name || 'Destination'}</div>
          <div style="font-size:12px;color:#9090a0">${destination.place_name || ''}</div>
        </div>
      `);
      infoWindowRef.current?.open({ anchor: marker, map: mapRef.current });
    });

    markersRef.current.destination.push(marker);
  }, [destination]);

  const handleRecenter = () => {
    if (!mapRef.current || !userCoords || !window.google?.maps) return;
    mapRef.current.panTo(userCoords);
    mapRef.current.setZoom(14);
  };

  return (
    <div className={styles.mapWrapper}>
      {!mapLoaded && (
        <div className={styles.mapLoader}>
          <div className={styles.spinner} />
          <span>Loading Google Maps...</span>
        </div>
      )}
      <div ref={mapContainer} className={styles.map} />
      {mapError && <div className={styles.mapError}>{mapError}</div>}

      {mapLoaded && userCoords && (
        <button className={styles.recenterBtn} onClick={handleRecenter} title="Recenter to location">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
          </svg>
        </button>
      )}
    </div>
  );
}

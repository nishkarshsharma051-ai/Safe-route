import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
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

const BASEMAP_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'osm',
      type: 'raster',
      source: 'osm',
    },
  ],
};

export default function MapLibreMap({ userCoords, hazards, routes, selectedRouteIndex, resources, destination }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const routeRenderTick = useRef(0);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState('');
  const markersRef = useRef({ hazards: [], resources: [], destination: [] });

  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return;

    const initMap = () => {
      try {
        if (!mapContainer.current) return;

        const map = new maplibregl.Map({
          container: mapContainer.current,
          style: BASEMAP_STYLE,
          center: [-73.9857, 40.7484],
          zoom: 12,
          pitch: 30,
          attributionControl: false,
          antialias: true,
          fadeDuration: 0,
        });

        mapRef.current = map;

        map.addControl(new maplibregl.AttributionControl({ compact: true }));
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');

        map.once('load', () => {
          setMapError('');
          setMapLoaded(true);
          setupUserLayers(map);
          map.resize();
        });

        map.on('error', () => {
          setMapError('The fallback map could not be loaded. Add a Google Maps API key to use the embedded Google map.');
          setMapLoaded(true);
        });

        const handleResize = () => map.resize();
        window.addEventListener('resize', handleResize);

        return () => {
          window.removeEventListener('resize', handleResize);
          map.remove();
        };
      } catch (error) {
        console.error('MapLibre initialization failed:', error);
        setMapError('This browser could not initialize the map canvas.');
        setMapLoaded(true);
      }
    };

    const timer = setTimeout(initMap, 50);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !userCoords) return;
    const coords = [userCoords.lng, userCoords.lat];
    const map = mapRef.current;

    const updateSource = () => {
      if (map.getSource('user')) {
        map.getSource('user').setData({ type: 'Feature', geometry: { type: 'Point', coordinates: coords } });
        if (!routes?.length) {
          map.flyTo({ center: coords, zoom: 13, speed: 0.8 });
        }
      } else {
        setupUserLayers(map, coords);
      }
    };

    if (map.loaded()) updateSource();
    else map.on('load', updateSource);
  }, [userCoords, routes]);

  useEffect(() => {
    if (!mapRef.current || !hazards) return;
    markersRef.current.hazards.forEach((marker) => marker.remove());
    markersRef.current.hazards = [];

    hazards.forEach((hazard) => {
      const color = HAZARD_COLORS[hazard.type] || HAZARD_COLORS.default;

      if (mapRef.current.loaded()) {
        const sourceId = `glow-src-${hazard.id}`;
        if (!mapRef.current.getSource(sourceId)) {
          mapRef.current.addSource(sourceId, {
            type: 'geojson',
            data: { type: 'Feature', geometry: { type: 'Point', coordinates: hazard.coords } },
          });
          mapRef.current.addLayer({
            id: `glow-layer-${hazard.id}`,
            type: 'circle',
            source: sourceId,
            paint: {
              'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 50, 15, 200],
              'circle-color': color,
              'circle-opacity': 0.1,
              'circle-blur': 0.8,
            },
          });
        }
      }

      const el = document.createElement('div');
      el.className = styles.hazardMarker;
      el.style.setProperty('--color', color);
      el.innerHTML = `
        <div class="${styles.hazardPulse}"></div>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="${color}" opacity="0.9">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13" stroke="white" stroke-width="2"/>
          <circle cx="12" cy="17" r="1" fill="white"/>
        </svg>`;

      const popup = new maplibregl.Popup({ closeButton: false, offset: 15 }).setHTML(`
        <div class="${styles.hazardPopup}">
          <div style="color:${color};font-weight:800;font-size:10px;letter-spacing:.08em;margin-bottom:4px">${hazard.severity} ALERT</div>
          <div style="font-weight:700;font-size:14px;margin-bottom:4px">${hazard.name}</div>
          <div style="font-size:12px;color:#9090a0;line-height:1.4">${hazard.recommendation || hazard.description}</div>
        </div>`);

      el.addEventListener('mouseenter', () => popup.setLngLat(hazard.coords).addTo(mapRef.current));
      el.addEventListener('mouseleave', () => popup.remove());

      const marker = new maplibregl.Marker(el).setLngLat(hazard.coords).addTo(mapRef.current);
      markersRef.current.hazards.push(marker);
    });

    return () => {
      if (mapRef.current) {
        hazards.forEach((hazard) => {
          const layerId = `glow-layer-${hazard.id}`;
          const sourceId = `glow-src-${hazard.id}`;
          if (mapRef.current.getLayer(layerId)) mapRef.current.removeLayer(layerId);
          if (mapRef.current.getSource(sourceId)) mapRef.current.removeSource(sourceId);
        });
      }
    };
  }, [hazards]);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    const update = () => {
      const maxRoutes = Math.max(5, routes.length);
      Array.from({ length: maxRoutes }).forEach((_, index) => {
        [`route-${index}`, `route-casing-${index}`].forEach((id) => {
          if (map.getLayer(id)) map.removeLayer(id);
        });
        if (map.getSource(`route-${index}`)) map.removeSource(`route-${index}`);
      });

      if (!routes || routes.length === 0) return;

      const bounds = new maplibregl.LngLatBounds();

      routes.forEach((route, index) => {
        const isSelected = index === selectedRouteIndex;
        if (!route.geometry?.coordinates?.length) return;
        route.geometry.coordinates.forEach((point) => bounds.extend(point));
        map.addSource(`route-${index}`, {
          type: 'geojson',
          data: { type: 'Feature', properties: {}, geometry: route.geometry },
        });
        map.addLayer({
          id: `route-casing-${index}`,
          type: 'line',
          source: `route-${index}`,
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': isSelected ? 'rgba(6, 8, 12, 0.8)' : 'rgba(255,255,255,0.22)',
            'line-width': isSelected ? 10 : 6,
            'line-opacity': 0.8,
          },
        });
        map.addLayer({
          id: `route-${index}`,
          type: 'line',
          source: `route-${index}`,
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': isSelected ? '#10b981' : '#3a3a4a',
            'line-width': isSelected ? 6 : 3,
            'line-opacity': isSelected ? 0.9 : 0.5,
          },
        });
      });

      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: { top: 120, right: 80, bottom: 120, left: 80 }, duration: 800 });
      }
    };

    const runUpdate = () => {
      routeRenderTick.current += 1;
      update();
    };

    if (map.loaded() || map.isStyleLoaded?.()) {
      requestAnimationFrame(runUpdate);
    } else {
      map.once('load', runUpdate);
    }
  }, [routes, selectedRouteIndex, mapLoaded]);

  useEffect(() => {
    if (!mapRef.current) return;
    markersRef.current.destination.forEach((marker) => marker.remove());
    markersRef.current.destination = [];

    if (!destination?.coords) return;

    const el = document.createElement('div');
    el.className = styles.destinationMarker;
    el.innerHTML = '<div class="' + styles.destinationInner + '"></div>';

    const marker = new maplibregl.Marker(el)
      .setLngLat(destination.coords)
      .setPopup(new maplibregl.Popup({ closeButton: false, offset: 14 }).setHTML(
        `<div style="padding:8px 4px"><div style="font-weight:700;font-size:14px;margin-bottom:4px">${destination.name || 'Destination'}</div><div style="font-size:12px;color:#9090a0">${destination.place_name || ''}</div></div>`
      ))
      .addTo(mapRef.current);

    markersRef.current.destination.push(marker);
  }, [destination]);

  useEffect(() => {
    if (!mapRef.current) return;
    markersRef.current.resources.forEach((marker) => marker.remove());
    markersRef.current.resources = [];

    if (!resources) return;

    resources.forEach((resource) => {
      const el = document.createElement('div');
      el.className = styles.resourceMarker;
      const marker = new maplibregl.Marker(el)
        .setLngLat(resource.coords)
        .setPopup(new maplibregl.Popup({ closeButton: true }).setHTML(
          `<div style="padding:8px 4px"><div style="font-weight:700;font-size:14px;margin-bottom:4px">${resource.name}</div>
           <div style="font-size:12px;color:#9090a0">${resource.type}</div>
           ${resource.phone ? `<div style="font-size:12px;margin-top:4px">📞 ${resource.phone}</div>` : ''}
          </div>`
        ))
        .addTo(mapRef.current);
      markersRef.current.resources.push(marker);
    });
  }, [resources]);

  const handleRecenter = () => {
    if (!mapRef.current || !userCoords) return;
    mapRef.current.flyTo({
      center: [userCoords.lng, userCoords.lat],
      zoom: 14,
      speed: 1.5,
      curve: 1
    });
  };

  return (
    <div className={styles.mapWrapper}>
      {!mapLoaded && (
        <div className={styles.mapLoader}>
          <div className={styles.spinner} />
          <span>Loading fallback map...</span>
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

function setupUserLayers(map, coords = [-73.9857, 40.7484]) {
  if (map.getSource('user')) return;
  map.addSource('user', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'Point', coordinates: coords } } });
  map.addLayer({ id: 'user-halo', type: 'circle', source: 'user', paint: { 'circle-radius': 16, 'circle-color': '#10b981', 'circle-opacity': 0.15 } });
  map.addLayer({ id: 'user-dot', type: 'circle', source: 'user', paint: { 'circle-radius': 7, 'circle-color': '#10b981', 'circle-stroke-width': 2.5, 'circle-stroke-color': '#fff' } });
}

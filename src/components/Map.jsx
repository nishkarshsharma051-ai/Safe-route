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

export default function Map({ userCoords, hazards, routes, selectedRouteIndex, resources }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState('');
  const markersRef = useRef({ hazards: [], resources: [], popups: [] });

  // Init map
  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return;

    const initMap = () => {
      try {
        if (!mapContainer.current) return;
        
        // Final sanity check for WebGL support to prevent browser-level crashes
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) {
          console.error('WebGL not supported');
          setMapError('This browser does not support WebGL, so the map cannot be displayed.');
          setMapLoaded(true);
          return;
        }

        const map = new maplibregl.Map({
          container: mapContainer.current,
          style: BASEMAP_STYLE,
          center: [-73.9857, 40.7484],
          zoom: 12,
          pitch: 30,
          attributionControl: false,
          antialias: true,
          fadeDuration: 0
        });

        mapRef.current = map;

        map.addControl(new maplibregl.AttributionControl({ compact: true }));
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');

        map.on('style.load', () => {
          map.resize();
        });

        map.once('load', () => {
          setMapError('');
          setMapLoaded(true);
          setupUserLayers(map);
          map.resize();
        });

        map.on('error', (e) => {
          console.error('Mapbox Error:', e);
          if (!mapLoaded) {
            setMapError('The map could not be loaded. The rest of the safety tools are still available.');
            setMapLoaded(true);
          }
        });

        const handleResize = () => map.resize();
        window.addEventListener('resize', handleResize);
        
        return () => {
          window.removeEventListener('resize', handleResize);
          map.remove();
        };
      } catch (err) {
        console.error('Failed to initialize Mapbox context:', err);
        setMapError('This browser could not initialize the map canvas.');
        setMapLoaded(true);
      }
    };

    // Small delay to ensure React has fully committed the DOM ref
    const timer = setTimeout(initMap, 50);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update user location
  useEffect(() => {
    if (!mapRef.current || !userCoords) return;
    const coords = [userCoords.lng, userCoords.lat];
    const map = mapRef.current;

    const updateSource = () => {
      if (map.getSource('user')) {
        map.getSource('user').setData({ type: 'Feature', geometry: { type: 'Point', coordinates: coords } });
        map.flyTo({ center: coords, zoom: 13, speed: 0.8 });
      } else {
        setupUserLayers(map, coords);
      }
    };

    if (map.loaded()) updateSource();
    else map.on('load', updateSource);
  }, [userCoords]);

  // Render hazards
  useEffect(() => {
    if (!mapRef.current || !hazards) return;
    markersRef.current.hazards.forEach(m => m.remove());
    markersRef.current.hazards = [];

    hazards.forEach(h => {
      const color = HAZARD_COLORS[h.type] || HAZARD_COLORS.default;
      
      // Add hazard glow layers to map
      if (mapRef.current.loaded()) {
        const sourceId = `glow-src-${h.id}`;
        if (!mapRef.current.getSource(sourceId)) {
          mapRef.current.addSource(sourceId, {
            type: 'geojson',
            data: { type: 'Feature', geometry: { type: 'Point', coordinates: h.coords } }
          });
          mapRef.current.addLayer({
            id: `glow-layer-${h.id}`,
            type: 'circle',
            source: sourceId,
            paint: {
              'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 50, 15, 200],
              'circle-color': color,
              'circle-opacity': 0.1,
              'circle-blur': 0.8
            }
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

      const popup = new maplibregl.Popup({ closeButton: false, offset: 15 })
        .setHTML(`
          <div class="${styles.hazardPopup}">
            <div style="color:${color};font-weight:800;font-size:10px;letter-spacing:.08em;margin-bottom:4px">${h.severity} ALERT</div>
            <div style="font-weight:700;font-size:14px;margin-bottom:4px">${h.name}</div>
            <div style="font-size:12px;color:#9090a0;line-height:1.4">${h.recommendation || h.description}</div>
          </div>`);

      el.addEventListener('mouseenter', () => popup.setLngLat(h.coords).addTo(mapRef.current));
      el.addEventListener('mouseleave', () => popup.remove());

      const marker = new maplibregl.Marker(el).setLngLat(h.coords).addTo(mapRef.current);
      markersRef.current.hazards.push(marker);
    });

    // Cleanup glow layers on hazard change
    return () => {
      if (mapRef.current) {
        hazards.forEach(h => {
          const id = `glow-layer-${h.id}`;
          const sid = `glow-src-${h.id}`;
          if (mapRef.current.getLayer(id)) mapRef.current.removeLayer(id);
          if (mapRef.current.getSource(sid)) mapRef.current.removeSource(sid);
        });
      }
    };
  }, [hazards]);

  // Render routes
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const update = () => {
      // Remove old route layers
      ['route-0', 'route-1', 'route-2'].forEach(id => {
        if (map.getLayer(id)) map.removeLayer(id);
        if (map.getSource(id)) map.removeSource(id);
      });

      if (!routes || routes.length === 0) return;

      routes.forEach((route, i) => {
        const isSelected = i === selectedRouteIndex;
        map.addSource(`route-${i}`, { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: route.geometry } });
        map.addLayer({
          id: `route-${i}`,
          type: 'line',
          source: `route-${i}`,
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': isSelected ? '#10b981' : '#3a3a4a',
            'line-width': isSelected ? 6 : 3,
            'line-opacity': isSelected ? 0.9 : 0.5,
          },
        });
      });
    };
    if (map.loaded()) update();
    else map.on('load', update);
  }, [routes, selectedRouteIndex]);

  // Render resource markers
  useEffect(() => {
    if (!mapRef.current) return;
    markersRef.current.resources.forEach(m => m.remove());
    markersRef.current.resources = [];

    if (!resources) return;
    resources.forEach(r => {
      const el = document.createElement('div');
      el.className = styles.resourceMarker;
      const marker = new maplibregl.Marker(el)
        .setLngLat(r.coords)
        .setPopup(new maplibregl.Popup({ closeButton: true }).setHTML(
          `<div style="padding:8px 4px"><div style="font-weight:700;font-size:14px;margin-bottom:4px">${r.name}</div>
           <div style="font-size:12px;color:#9090a0">${r.type}</div>
           ${r.phone ? `<div style="font-size:12px;margin-top:4px">📞 ${r.phone}</div>` : ''}
          </div>`))
        .addTo(mapRef.current);
      markersRef.current.resources.push(marker);
    });
  }, [resources]);

  return (
    <div className={styles.mapWrapper}>
      {!mapLoaded && (
        <div className={styles.mapLoader}>
          <div className={styles.spinner} />
          <span>Loading live map...</span>
        </div>
      )}
      <div ref={mapContainer} className={styles.map} />
      {mapError && <div className={styles.mapError}>{mapError}</div>}
    </div>
  );
}

function setupUserLayers(map, coords = [-73.9857, 40.7484]) {
  if (map.getSource('user')) return;
  map.addSource('user', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'Point', coordinates: coords } } });
  map.addLayer({ id: 'user-halo', type: 'circle', source: 'user', paint: { 'circle-radius': 16, 'circle-color': '#10b981', 'circle-opacity': 0.15 } });
  map.addLayer({ id: 'user-dot', type: 'circle', source: 'user', paint: { 'circle-radius': 7, 'circle-color': '#10b981', 'circle-stroke-width': 2.5, 'circle-stroke-color': '#fff' } });
}

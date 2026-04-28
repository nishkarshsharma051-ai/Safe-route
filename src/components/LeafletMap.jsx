import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, ZoomControl, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TriangleAlert } from 'lucide-react';

// Fix for default marker icons in Leaflet + React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function RecenterMap({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.setView([coords.lat, coords.lng], 14, { animate: true });
  }, [coords, map]);
  return null;
}

export default function LeafletMap({ userCoords, hazards = [], places = [], destination, routes = [], selectedRouteIndex = 0 }) {
  const [mapLoaded, setMapLoaded] = useState(false);

  // Custom tactical icons for Aegis Sentinel
  const userIcon = useMemo(() => L.divIcon({
    className: 'user-icon-container',
    html: '<div class="user-ping"></div>',
    iconSize: [20, 20],
  }), []);

  const hazardIcon = useMemo(() => L.divIcon({
    className: 'hazard-icon-container',
    html: `<div class="aegis-hazard-marker">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-triangle-alert"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
    </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  }), []);

  const placeIcon = useMemo(() => L.divIcon({
    className: 'place-icon-container',
    html: `<div class="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white border-2 border-white shadow-md">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-plus"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path><path d="M8 11h8"></path><path d="M12 7v8"></path></svg>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  }), []);

  const medicalIcon = useMemo(() => L.divIcon({
    className: 'medical-icon-container',
    html: `<div class="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white border-2 border-white shadow-md">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-hospital"><path d="M12 6v4"></path><path d="M14 14h-4"></path><path d="M14 18h-4"></path><path d="M14 8h-4"></path><path d="M18 12h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h2"></path><path d="M18 22V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v18"></path></svg>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  }), []);

  const destinationIcon = useMemo(() => L.divIcon({
    className: 'destination-icon-container',
    html: `<div class="w-10 h-10 -mt-5 -ml-5 flex items-center justify-center">
      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="#ba1a1a" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="drop-shadow-lg"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3" fill="white"/></svg>
    </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  }), []);

  const center = userCoords || { lat: 40.7484, lng: -73.9857 };

  return (
    <div className="w-full h-full relative bg-surface-container-low z-0">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={13}
        minZoom={3}
        maxBounds={[[-90, -180], [90, 180]]}
        maxBoundsViscosity={1.0}
        className="w-full h-full"
        zoomControl={false}
        whenReady={() => setMapLoaded(true)}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          noWrap={true}
        />
        
        <ZoomControl position="bottomright" />
        <RecenterMap coords={userCoords} />

        {userCoords && typeof userCoords.lat === 'number' && typeof userCoords.lng === 'number' && (
          <Marker position={[userCoords.lat, userCoords.lng]} icon={userIcon}>
            <Popup>
              <div className="font-headline font-semibold text-primary">Your Location</div>
              <div className="text-xs text-secondary mt-0.5">Tracking active</div>
            </Popup>
          </Marker>
        )}

        {hazards.map((h, i) => (
          h.coords && typeof h.coords[0] === 'number' && typeof h.coords[1] === 'number' && (
            <React.Fragment key={h.id || i}>
              {/* Tactical Proximity Buffer */}
              <Circle 
                center={[h.coords[1], h.coords[0]]}
                radius={800} // match the 0.8km in useRouting
                pathOptions={{
                  color: '#ba1a1a',
                  fillColor: '#ba1a1a',
                  fillOpacity: 0.1,
                  weight: 1,
                  dashArray: '5, 5'
                }}
              />
              <Marker position={[h.coords[1], h.coords[0]]} icon={hazardIcon}>
                <Popup>
                  <div className="font-headline font-semibold text-error mb-1">{h.name}</div>
                  <div className="text-xs font-medium text-secondary">Intensity: {h.severity}</div>
                  <div className="text-xs text-secondary opacity-80 mt-1">Caution area identified. Routing will avoid this sector.</div>
                </Popup>
              </Marker>
            </React.Fragment>
          )
        ))}

        {places.map((p, i) => (
          p.coords && typeof p.coords.lat === 'number' && typeof p.coords.lng === 'number' && (
            <Marker key={p.id || i} position={[p.coords.lat, p.coords.lng]} icon={p.color === 'emerald' ? medicalIcon : placeIcon}>
              <Popup>
                <div className="font-headline font-semibold text-primary mb-1">{p.name}</div>
                <div className="text-xs font-medium text-secondary">{p.dist} away</div>
                <div className={`mt-2 inline-block px-2 py-1 text-[10px] font-bold rounded-full uppercase tracking-tighter ${
                    p.status === 'Available' ? 'bg-emerald-500 text-white' : 
                    p.status === 'Limited' ? 'bg-amber-500 text-white' : 'bg-primary text-white'
                  }`}>
                  {p.status}
                </div>
              </Popup>
            </Marker>
          )
        ))}

        {/* Global Destination Pin (Google Maps Style) */}
        {destination && typeof destination.lat === 'number' && typeof destination.lng === 'number' && (
          <Marker position={[destination.lat, destination.lng]} icon={destinationIcon}>
            <Popup>
              <div className="font-headline font-semibold text-on-surface mb-0.5">{destination.name || 'Destination'}</div>
              <div className="text-xs text-secondary">Target Acquired</div>
            </Popup>
          </Marker>
        )}

        {/* Tactical Segmented Routing */}
        {routes[selectedRouteIndex]?.dangerSegments?.map((segment, idx) => (
          <Polyline 
            key={`${routes[selectedRouteIndex].id}-seg-${idx}`}
            positions={segment.points.map(c => [c[1], c[0]])}
            pathOptions={{
              color: segment.isDanger ? '#ba1a1a' : '#004b87',
              weight: 6,
              opacity: segment.isDanger ? 1 : 0.6,
              dashArray: segment.isDanger ? '0' : '1, 10',
              lineCap: 'round',
              lineJoin: 'round'
            }}
          >
            <Popup>
              <div className="text-sm font-semibold">
                {segment.isDanger ? (
                  <span className="text-error flex items-center gap-1.5">
                    <TriangleAlert className="w-4 h-4" />
                    Cautionary Route Segment
                  </span>
                ) : (
                  <span className="text-primary">Optimized Route Segment</span>
                )}
              </div>
            </Popup>
          </Polyline>
        ))}
      </MapContainer>

      {!mapLoaded && (
        <div className="absolute inset-0 z-[1000] flex flex-col items-center justify-center bg-surface-container-low gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-primary ml-2">Loading Map Data...</span>
        </div>
      )}

      {/* Coordinates HUD Overlay */}
      <div className="absolute top-8 right-8 z-[1000] glass-panel px-5 py-3 rounded-2xl border border-outline-variant/10 shadow-sm pointer-events-none transition-all duration-300">
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="text-xs font-semibold text-secondary">GPS Connected</span>
          </div>
          <span className="text-sm font-headline font-semibold text-on-surface tabular-nums">
            {userCoords ? `${userCoords.lat.toFixed(4)}°, ${userCoords.lng.toFixed(4)}°` : 'Acquiring Signal...'}
          </span>
        </div>
      </div>
    </div>
  );
}


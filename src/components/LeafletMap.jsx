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

export default function LeafletMap({ userCoords, hazards = [], destination, routes = [], selectedRouteIndex = 0 }) {
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

  const center = userCoords || { lat: 40.7484, lng: -73.9857 };

  return (
    <div className="w-full h-full relative bg-[#0b0c0d] z-0">
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
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          noWrap={true}
        />
        
        <ZoomControl position="bottomright" />
        <RecenterMap coords={userCoords} />

        {userCoords && typeof userCoords.lat === 'number' && typeof userCoords.lng === 'number' && (
          <Marker position={[userCoords.lat, userCoords.lng]} icon={userIcon}>
            <Popup>
              <div className="font-headline font-bold text-primary dark:text-[#cfe6f2]">CURRENT POSITION</div>
              <div className="text-[10px] opacity-70">Sector 7G Monitoring Active</div>
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
                  <div className="font-headline font-bold text-error">{h.name}</div>
                  <div className="text-[10px]">SEVERITY: <span className="font-bold">{h.severity}</span></div>
                  <div className="text-[10px] opacity-70 mt-1">Hazard node identified in perimeter. Avoid intersection.</div>
                </Popup>
              </Marker>
            </React.Fragment>
          )
        ))}

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
              <div className="text-[10px] font-bold uppercase tracking-widest">
                {segment.isDanger ? (
                  <span className="text-error flex items-center gap-1">
                    <TriangleAlert className="w-3.5 h-3.5" />
                    DANGER ZONE INTERSECTION
                  </span>
                ) : (
                  <span className="text-secondary">Secured Vector Segment</span>
                )}
              </div>
            </Popup>
          </Polyline>
        ))}
      </MapContainer>

      {!mapLoaded && (
        <div className="absolute inset-0 z-[1000] flex flex-col items-center justify-center bg-[#0b0c0d] gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-[10px] font-headline font-bold text-primary tracking-widest uppercase">Initializing Tactical Feed...</span>
        </div>
      )}

      {/* Coordinates HUD Overlay */}
      <div className="absolute top-8 right-8 z-[1000] glass-panel px-5 py-3 rounded-2xl border border-white/20 shadow-2xl pointer-events-none transition-all duration-300">
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2 opacity-60">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            <span className="text-[9px] font-bold text-primary tracking-[0.2em] uppercase">Tactical Feed Active</span>
          </div>
          <span className="text-[14px] font-headline font-bold text-primary tabular-nums tracking-tight">
            {userCoords ? `${userCoords.lat.toFixed(4)}°N, ${userCoords.lng.toFixed(4)}°W` : 'SCANNING...'}
          </span>
        </div>
      </div>
    </div>
  );
}


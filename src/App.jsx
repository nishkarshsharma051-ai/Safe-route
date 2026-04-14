import { useState, useCallback, useEffect } from 'react';
import Map from './components/Map';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import SOSModal from './components/SOSModal';
import SettingsModal from './components/SettingsModal';
import PredictionSlider from './components/PredictionSlider';
import { useGeolocation } from './hooks/useGeolocation';
import { useWeather } from './hooks/useWeather';
import { useRouting } from './hooks/useRouting';
import styles from './App.module.css';

const DEFAULT_COORDS = { lat: 40.7484, lng: -73.9857 };

function distanceKm(a, b) {
  const dx = (a.lng - b.lng) * 111 * Math.cos(((a.lat + b.lat) / 2) * (Math.PI / 180));
  const dy = (a.lat - b.lat) * 111;
  return Math.sqrt(dx * dx + dy * dy);
}

function getNavigationSnapshot(route, coords, hazards) {
  if (!route?.geometry?.coordinates?.length || !coords) return null;

  const points = route.geometry.coordinates;
  let nearestIndex = 0;
  let nearestDistance = Infinity;

  points.forEach(([lng, lat], index) => {
    const dist = distanceKm(coords, { lat, lng });
    if (dist < nearestDistance) {
      nearestDistance = dist;
      nearestIndex = index;
    }
  });

  let remainingDistanceKm = 0;
  for (let index = nearestIndex; index < points.length - 1; index += 1) {
    const current = { lng: points[index][0], lat: points[index][1] };
    const next = { lng: points[index + 1][0], lat: points[index + 1][1] };
    remainingDistanceKm += distanceKm(current, next);
  }

  const progress = Math.max(0, Math.min(100, (1 - (remainingDistanceKm / Math.max(Number(route.distanceKm), 0.1))) * 100));
  const etaMin = Math.max(1, Math.round((route.durationMin || 1) * (remainingDistanceKm / Math.max(Number(route.distanceKm), 0.1))));
  const alertsAhead = (hazards || []).filter((hazard) =>
    points.slice(nearestIndex).some(([lng, lat]) => distanceKm({ lat, lng }, { lat: hazard.coords[1], lng: hazard.coords[0] }) < 0.8)
  );

  return {
    remainingDistanceKm: remainingDistanceKm.toFixed(1),
    etaMin,
    progress: Number(progress.toFixed(0)),
    offRoute: nearestDistance > 0.18,
    nearestDistanceKm: nearestDistance,
    alertsAhead: alertsAhead.slice(0, 3),
  };
}

export default function App() {
  // Core state
  const { coords: userCoords, loading: gpsLoading } = useGeolocation();

  // UI state
  const [sosOpen, setSosOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [mapResources, setMapResources] = useState([]);
  const [predictionTime, setPredictionTime] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineRegions, setOfflineRegions] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sr_offline') || '{}'); }
    catch { return {}; }
  });
  const [gpsToast, setGpsToast] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [navSnapshot, setNavSnapshot] = useState(null);

  // Online/offline detection
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  // Auto-hide GPS loading if it takes too long (e.g. 5s) to prevent black screen
  useEffect(() => {
    if (gpsLoading && !userCoords) {
      const timer = setTimeout(() => {
        setUseFallback(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [gpsLoading, userCoords]);

  // Derived Effective Coords
  const effectiveCoords = userCoords || (useFallback ? DEFAULT_COORDS : null);
  const { weather, hazards, refresh: refreshWeather } = useWeather(effectiveCoords);
  const routing = useRouting(hazards);

  // Show GPS acquired toast once
  useEffect(() => {
    if (userCoords && !gpsLoading && !gpsToast) {
      setGpsToast(true);
      setTimeout(() => setGpsToast(false), 3000);
    }
  }, [userCoords, gpsLoading]);

  // Auto-refresh weather every 5 mins is handled in useWeather, but also on tab focus
  useEffect(() => {
    const onFocus = () => refreshWeather();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refreshWeather]);

  const handleDestinationSelect = useCallback(async (place) => {
    const startCoords = effectiveCoords || DEFAULT_COORDS;
    routing.calculate(startCoords, place);
  }, [effectiveCoords, routing.calculate]);

  const handleSelectRoute = useCallback((i) => {
    setSelectedRouteIndex(i);
    routing.setSelectedIndex(i);
  }, [routing.setSelectedIndex]);

  const handleStartNavigation = useCallback((routeIndex = selectedRouteIndex) => {
    if (!routing.routes[routeIndex]) return;
    setSelectedRouteIndex(routeIndex);
    routing.setSelectedIndex(routeIndex);
    setIsNavigating(true);
  }, [routing.routes, routing.setSelectedIndex, selectedRouteIndex]);

  const handleStopNavigation = useCallback(() => {
    setIsNavigating(false);
    setNavSnapshot(null);
  }, []);

  const handleSOS = () => setSosOpen(true);
  const handleSOSConfirm = (data) => {
    console.log('SOS ACTIVATED:', data);
    // In production, this would POST to an emergency backend
  };

  const handleDownload = useCallback((regionId) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 12) + 4;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setOfflineRegions(prev => {
          const updated = { ...prev, [regionId]: 'saved' };
          localStorage.setItem('sr_offline', JSON.stringify(updated));
          return updated;
        });
      } else {
        setOfflineRegions(prev => ({ ...prev, [regionId]: progress }));
      }
    }, 200);
  }, []);

  // Filter predictions for the slider value
  const visibleHazards = predictionTime === 0
    ? hazards
    : [
        ...hazards,
        // Add simulated future hazards based on slider
        ...(predictionTime >= 24 ? [{
          id: 'pred-24', name: 'Projected Flash Flood', type: 'flood', severity: 'HIGH',
          description: `Predicted with 82% probability at +${predictionTime}h`,
          recommendation: 'Monitor water levels. Plan evacuation route now.',
          coords: effectiveCoords ? [effectiveCoords.lng + 0.04, effectiveCoords.lat - 0.03] : [-73.97, 40.75],
          isWeatherDerived: true,
        }] : []),
        ...(predictionTime >= 48 ? [{
          id: 'pred-48', name: 'Wind Storm System', type: 'wind', severity: 'EXTREME',
          description: `High probability event at +${predictionTime}h`,
          recommendation: 'Secure structures. Avoid coastal areas.',
          coords: effectiveCoords ? [effectiveCoords.lng - 0.05, effectiveCoords.lat + 0.04] : [-74.02, 40.72],
          isWeatherDerived: true,
        }] : []),
      ];

  useEffect(() => {
    if (!isNavigating) return;
    const activeRoute = routing.routes[selectedRouteIndex];
    const snapshot = getNavigationSnapshot(activeRoute, effectiveCoords, visibleHazards);
    setNavSnapshot(snapshot);
  }, [isNavigating, routing.routes, selectedRouteIndex, effectiveCoords, visibleHazards]);

  useEffect(() => {
    if (!routing.routes.length) {
      setIsNavigating(false);
      setNavSnapshot(null);
    }
  }, [routing.routes.length]);

  return (
    <div className={styles.app}>
      <TopBar
        weather={weather}
        userCoords={effectiveCoords}
        onDestinationSelect={handleDestinationSelect}
        onSettingsOpen={() => setSettingsOpen(true)}
        isOnline={isOnline}
      />

      <div className={styles.main}>
        <div className={styles.mapWrapper}>
          <Map
            userCoords={effectiveCoords}
            hazards={visibleHazards}
            routes={routing.routes}
            selectedRouteIndex={selectedRouteIndex}
            resources={mapResources}
            destination={routing.destination}
          />

          {isNavigating && navSnapshot && (
            <div className={`${styles.navOverlay} glass`}>
              <div className={styles.navPrimary}>
                <div>
                  <div className={styles.navLabel}>{navSnapshot.offRoute ? 'OFF ROUTE' : 'ACTIVE GUIDANCE'}</div>
                  <div className={styles.navTitle}>
                    {navSnapshot.offRoute ? 'Rejoin the highlighted route' : `${navSnapshot.remainingDistanceKm} km remaining`}
                  </div>
                </div>
                <button className={styles.stopNavBtn} onClick={handleStopNavigation}>End</button>
              </div>
              <div className={styles.navStats}>
                <span>{navSnapshot.etaMin} min ETA</span>
                <span>{navSnapshot.progress}% complete</span>
                <span>{navSnapshot.alertsAhead.length} alerts ahead</span>
              </div>
            </div>
          )}

          {/* GPS Loading Overlay (Only if not falling back) */}
          {gpsLoading && !effectiveCoords && !useFallback && (
            <div className={styles.gpsOverlay}>
              <div className={styles.gpsCard}>
                <div className={styles.gpsSpinner} />
                <div className={styles.gpsInfo}>
                  <span>Acquiring GPS location...</span>
                  <button 
                    onClick={() => setUseFallback(true)} 
                    className={styles.skipBtn}
                  >
                    Skip & use default location
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* GPS Toast */}
          {gpsToast && (
            <div className={styles.toast}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              GPS location acquired
            </div>
          )}

          <PredictionSlider value={predictionTime} onChange={setPredictionTime} />
        </div>

        <Sidebar
          hazards={visibleHazards}
          routes={routing.routes}
          routing={routing}
          selectedRouteIndex={selectedRouteIndex}
          onSelectRoute={handleSelectRoute}
          onStartNavigation={handleStartNavigation}
          onStopNavigation={handleStopNavigation}
          onSOS={handleSOS}
          userCoords={effectiveCoords}
          onResourcesChange={setMapResources}
          isNavigating={isNavigating}
          navSnapshot={navSnapshot}
        />
      </div>

      <SOSModal
        isOpen={sosOpen}
        onClose={() => setSosOpen(false)}
        onConfirm={handleSOSConfirm}
        userCoords={effectiveCoords}
      />

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        offlineRegions={offlineRegions}
        onDownload={handleDownload}
      />
    </div>
  );
}

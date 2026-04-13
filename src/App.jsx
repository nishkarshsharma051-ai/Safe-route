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

export default function App() {
  // Core state
  const { coords: userCoords, loading: gpsLoading } = useGeolocation();
  const { weather, hazards, refresh: refreshWeather } = useWeather(userCoords);
  const routing = useRouting(hazards);

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
  const effectiveCoords = userCoords || (useFallback ? { lat: 40.7484, lng: -73.9857 } : null);

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
    const startCoords = effectiveCoords || { lat: 40.7484, lng: -73.9857 };
    routing.calculate(startCoords, place);
  }, [effectiveCoords, routing.calculate]);

  const handleSelectRoute = useCallback((i) => {
    setSelectedRouteIndex(i);
    routing.setSelectedIndex(i);
  }, [routing.setSelectedIndex]);

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
          coords: userCoords ? [userCoords.lng + 0.04, userCoords.lat - 0.03] : [-73.97, 40.75],
          isWeatherDerived: true,
        }] : []),
        ...(predictionTime >= 48 ? [{
          id: 'pred-48', name: 'Wind Storm System', type: 'wind', severity: 'EXTREME',
          description: `High probability event at +${predictionTime}h`,
          recommendation: 'Secure structures. Avoid coastal areas.',
          coords: userCoords ? [userCoords.lng - 0.05, userCoords.lat + 0.04] : [-74.02, 40.72],
          isWeatherDerived: true,
        }] : []),
      ];

  return (
    <div className={styles.app}>
      <TopBar
        weather={weather}
        userCoords={userCoords}
        onDestinationSelect={handleDestinationSelect}
        onSettingsOpen={() => setSettingsOpen(true)}
        isOnline={isOnline}
      />

      <div className={styles.main}>
        <div className={styles.mapWrapper}>
          <Map
            userCoords={userCoords}
            hazards={visibleHazards}
            routes={routing.routes}
            selectedRouteIndex={selectedRouteIndex}
            resources={mapResources}
          />

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
          onSOS={handleSOS}
          userCoords={userCoords}
          onResourcesChange={setMapResources}
        />
      </div>

      <SOSModal
        isOpen={sosOpen}
        onClose={() => setSosOpen(false)}
        onConfirm={handleSOSConfirm}
        userCoords={userCoords}
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

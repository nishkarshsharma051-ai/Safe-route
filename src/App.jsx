import { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import DashboardView from './views/DashboardView';
import AnalysisView from './views/AnalysisView';
import ShelterView from './views/ShelterView';
import WeatherView from './views/WeatherView';
import ProfileView from './views/ProfileView';
import { useGeolocation } from './hooks/useGeolocation';
import { useWeather } from './hooks/useWeather';
import { useRouting } from './hooks/useRouting';
import { 
  TriangleAlert, 
  Radio, 
  Map, 
  ShieldPlus, 
  CloudLightning, 
  User,
  CloudDownload
} from 'lucide-react';

export default function App() {
  // Navigation State
  const [activeView, setActiveView] = useState('dashboard');
  const [sosActive, setSosActive] = useState(false);
  const [isNavigatingGlobal, setIsNavigatingGlobal] = useState(false);
  const [navigationInstruction, setNavigationInstruction] = useState('Awaiting mission start...');
  const [isOfflineMapEnabled, setIsOfflineMapEnabled] = useState(false);
  const [cachingProgress, setCachingProgress] = useState(0);
  const [isCaching, setIsCaching] = useState(false);

  // Offline Caching Simulation
  const handleOfflineToggle = () => {
    if (isOfflineMapEnabled) {
      setIsOfflineMapEnabled(false);
    } else {
      setIsCaching(true);
      setCachingProgress(0);
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 15) + 5;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setTimeout(() => {
            setIsCaching(false);
            setIsOfflineMapEnabled(true);
          }, 500);
        }
        setCachingProgress(progress);
      }, 300);
    }
  };

  // Simulation Hub for Tactical Guidance
  useEffect(() => {
    let interval;
    if (isNavigatingGlobal) {
      const instructions = [
        'Calculating primary transit vectors...',
        'Scanning Sector Gamma-9 for heat signatures...',
        'Hazard avoidance protocol active.',
        'Maintaining 50m tactical buffer from danger nodes.',
        'Approaching waypoint: Junction Delta.',
        'Environmental integrity: STABLE.',
        'Signal strength optimized.',
        'Estimated 2.4km to target objective.'
      ];
      let step = 0;
      setNavigationInstruction(instructions[0]);
      interval = setInterval(() => {
        step = (step + 1) % instructions.length;
        setNavigationInstruction(instructions[step]);
      }, 5000);
    } else {
      setNavigationInstruction('Awaiting mission start...');
    }
    return () => clearInterval(interval);
  }, [isNavigatingGlobal]);

  // Tactical Hooks
  const { coords: userCoords, loading: gpsLoading } = useGeolocation();
  const { weather, hazards } = useWeather(userCoords);
  const routing = useRouting(hazards);

  const startNavigation = useCallback(() => {
    if (routing.destination) {
      setIsNavigatingGlobal(true);
    }
  }, [routing.destination]);

  const stopNavigation = useCallback(() => {
    setIsNavigatingGlobal(false);
    routing.calculate(null, null);
  }, [routing.calculate]);

  // Search Logic (Fixing the 9800km global geocoding bug)
  const handleSearch = useCallback(async (query) => {
    if (!query) return null;
    
    // If exact coordinates are passed directly (e.g. from local shelters), bypass global geocoding!
    if (typeof query === 'object' && query.lat && query.lng) {
      routing.calculate(userCoords, query);
      setActiveView('dashboard');
      return query;
    }

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`, {
        headers: {
          'User-Agent': 'SafeRoute/2.0'
        }
      });
      const data = await response.json();
      if (data && data.length > 0) {
        const result = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          name: data[0].display_name
        };
        routing.calculate(userCoords, result);
        setActiveView('dashboard'); // Switch to maps to show route
        return result;
      }
      return null;
    } catch (err) {
      console.error('Search failed:', err);
      return null;
    }
  }, [userCoords, routing]);

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': 
        return (
          <DashboardView 
            userCoords={userCoords}
            hazards={hazards}
            routes={routing.routes}
            selectedRouteIndex={routing.selectedIndex}
            destination={routing.destination}
            isNavigating={isNavigatingGlobal}
            navigationInstruction={navigationInstruction}
            onStartNavigation={startNavigation}
            onStopNavigation={stopNavigation}
            onSearch={handleSearch}
          />
        );
      case 'threat': 
        return <AnalysisView userCoords={userCoords} hazards={hazards} />;
      case 'shelters': 
        return <ShelterView userCoords={userCoords} hazards={hazards} onSearch={handleSearch} />;
      case 'weather': 
        return <WeatherView weather={weather} hazards={hazards} />;
      case 'profile': 
        return <ProfileView />;
      default: 
        return (
          <DashboardView 
            userCoords={userCoords} 
            hazards={hazards} 
            routes={[]} 
            onSearch={handleSearch}
            onStartNavigation={startNavigation}
            onStopNavigation={stopNavigation}
          />
        );
    }
  };

  return (
    <div className="h-screen w-full bg-background flex flex-col overflow-hidden text-on-surface">
      {/* Sidebar - Fixed on desktop */}
      <Sidebar 
        activeView={activeView} 
        onViewChange={setActiveView} 
        onSOS={() => setSosActive(true)} 
      />

      {/* Header - Fixed on top */}
      <TopBar 
        activeView={activeView} 
        onViewChange={setActiveView} 
        onSearch={handleSearch}
        isOffline={isOfflineMapEnabled}
        onOfflineToggle={handleOfflineToggle}
      />

      {/* Main Content Area - Offset by sidebar/header */}
      <main className="md:ml-64 pt-16 flex-1 relative overflow-hidden h-full">
        {renderView()}
      </main>

      {/* Tactical Loading Overlay */}
      {gpsLoading && !userCoords && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center">
           <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <div className="flex flex-col items-center">
                <span className="font-headline font-bold text-primary tracking-widest text-sm">ACQUIRING TACTICAL GPS FIX</span>
                <span className="text-[10px] text-secondary font-semibold">SIGNAL STRENGTH: WEAK</span>
              </div>
           </div>
        </div>
      )}

      {/* Offline Caching Overlay */}
      {isCaching && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-6">
           <div className="bg-[#1a1c1e] p-10 rounded-3xl shadow-2xl max-w-sm w-full flex flex-col items-center border border-white/10">
              <CloudDownload className="text-[#cfe6f2] w-12 h-12 mb-6 animate-bounce" />
              <div className="w-full flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold text-[#cfe6f2] uppercase tracking-[0.2em]">Caching Local Vector Radius</span>
                <span className="text-[12px] font-headline font-bold text-white tabular-nums">{cachingProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                 <div className="h-full bg-primary transition-all duration-300 shadow-[0_0_8px_rgba(0,52,97,0.8)]" style={{ width: `${cachingProgress}%` }}></div>
              </div>
              <p className="text-[9px] text-[#cfe6f2]/50 uppercase tracking-widest mt-6 text-center">Do not close app or sever connection during cryptographic payload extraction.</p>
           </div>
        </div>
      )}

      {/* Emergency Overlay */}
      {sosActive && (
        <div className="fixed inset-0 z-[1000] bg-[#6e0009]/90 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-md w-full flex flex-col items-center text-center">
            <TriangleAlert className="w-16 h-16 text-[#6e0009] animate-pulse mb-4" />
            <h2 className="text-2xl font-headline font-bold text-[#1a1c1e] mb-2 uppercase tracking-tight">Safe Route Emergency Signal</h2>
            <p className="text-[#4c616c] text-sm mb-8 leading-relaxed">Broadcasting GPS coordinates and medical dossier to all nearby emergency nodes. Response teams alerted.</p>
            
            <div className="relative w-24 h-24 mb-10">
              <div className="absolute inset-0 border-4 border-[#6e0009] rounded-full animate-ping opacity-20"></div>
              <div className="absolute inset-4 border-4 border-[#6e0009] rounded-full animate-ping opacity-40"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Radio className="w-10 h-10 text-[#6e0009]" />
              </div>
            </div>

            <button 
              className="w-full py-4 bg-[#6e0009] text-white rounded-xl font-headline font-bold uppercase tracking-widest text-xs hover:bg-[#ba1a1a] transition-all shadow-xl shadow-[#6e0009]/20" 
              onClick={() => setSosActive(false)}
            >
              Cancel Broadcast
            </button>
          </div>
        </div>
      )}

      {/* Bottom Nav - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full h-16 bg-[#f9f9fc]/85 backdrop-blur-xl flex justify-around items-center px-4 z-50 border-t border-[#eeeef0]">
        {[
          { id: 'dashboard', Icon: Map, label: 'Map' },
          { id: 'shelters', Icon: ShieldPlus, label: 'Safety' },
          { id: 'weather', Icon: CloudLightning, label: 'Alerts' },
          { id: 'profile', Icon: User, label: 'Me' },
        ].map((item) => (
          <button 
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`flex flex-col items-center gap-1 ${activeView === item.id ? 'text-primary' : 'text-[#526772]'}`}
          >
            <item.Icon className="w-6 h-6" strokeWidth={activeView === item.id ? 2.5 : 2} />
            <span className="text-[10px] font-semibold">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}


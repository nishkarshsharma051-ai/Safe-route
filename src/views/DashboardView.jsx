import React from 'react';
import LeafletMap from '../components/LeafletMap';
import { 
  Satellite, 
  Flag, 
  MapPin, 
  Search, 
  Route, 
  ShieldCheck, 
  TriangleAlert, 
  Navigation, 
  XCircle,
  BrainCircuit,
  ShieldPlus,
  List,
  Car,
  Bike,
  Footprints
} from 'lucide-react';

export default function DashboardView({ 
  userCoords, 
  hazards, 
  routes, 
  selectedRouteIndex, 
  destination,
  isNavigating,
  navigationInstruction,
  onStartNavigation,
  onStopNavigation,
  onSearch
}) {
  const [destQuery, setDestQuery] = React.useState('');
  const [travelMode, setTravelMode] = React.useState('driving');
  const [suggestions, setSuggestions] = React.useState([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);

  React.useEffect(() => {
    const fetchSuggestions = async () => {
      if (destQuery.trim().length < 3) {
        setSuggestions([]);
        return;
      }
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destQuery)}&format=json&limit=5`, {
          headers: { 'User-Agent': 'SafeRoute/2.0' }
        });
        const data = await response.json();
        setSuggestions(data.map(item => ({
          name: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon)
        })));
      } catch (err) {
        console.error('Autocomplete Error:', err);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchSuggestions();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [destQuery]);

  const handleSuggestionSelect = (suggestion) => {
    setDestQuery(suggestion.name.split(',')[0]);
    setShowSuggestions(false);
    onSearch(suggestion, travelMode);
  };

  const handleSearchTrigger = () => {
    if (destQuery.trim()) {
      onSearch(destQuery.trim(), travelMode);
      setShowSuggestions(false);
    }
  };

  const handleModeChange = (newMode) => {
    setTravelMode(newMode);
    if (destination) {
      onSearch(destination, newMode);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearchTrigger();
  };

  return (
    <div className="h-full relative overflow-hidden bg-background">
      {/* Map Layer */}
      <LeafletMap 
        userCoords={userCoords}
        hazards={hazards}
        routes={routes}
        selectedRouteIndex={selectedRouteIndex}
        destination={destination}
      />

      {/* Primary UI HUD */}
      <div className="absolute inset-0 z-40 p-6 lg:p-10 flex flex-col pointer-events-none overflow-hidden">
        
        {/* Live Navigation Overlay */}
        {isNavigating && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 pointer-events-auto z-50 animate-in slide-in-from-top-4 duration-500">
            <div className="glass-panel text-on-surface px-6 py-3 rounded-full shadow-lg flex items-center gap-4 border border-outline-variant/20">
              <Navigation className="w-5 h-5 text-primary" />
              <div className="flex flex-col max-w-xs">
                <span className="text-sm font-bold truncate text-primary">
                  {navigationInstruction}
                </span>
                <span className="text-xs text-secondary opacity-80">Monitoring route conditions...</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-8 flex-1 overflow-hidden h-full">
          {/* Left Side Controls (Search Only) */}
          <div className="w-[360px] flex flex-col gap-5 relative z-40 overflow-hidden pb-10">
            {/* Unified Command Center Card */}
            <div className="glass-panel p-5 rounded-2xl shadow-xl relative z-50 pointer-events-auto flex flex-col max-h-full">
              {/* Header and Inputs (Always visible) */}
              <div className="shrink-0">
                <h2 className="font-headline font-semibold text-on-surface text-lg mb-4 flex items-center gap-2">
                  <Search className="w-5 h-5 text-secondary" />
                  Where to?
                </h2>
                <div className="space-y-3">
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-6 flex items-center justify-center">
                      <MapPin className="text-primary w-4 h-4" />
                    </div>
                    <input 
                      disabled
                      className="w-full bg-surface-container/30 border-none rounded-xl pl-11 pr-4 py-3 text-sm text-secondary truncate" 
                      type="text" 
                      value={userCoords ? `Current Location` : 'Acquiring GPS...'} 
                    />
                  </div>
                  <div className="relative group z-50">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-6 flex items-center justify-center">
                      <Search className="text-primary w-4 h-4" />
                    </div>
                    <input 
                      className="w-full bg-surface-container border border-transparent rounded-xl pl-11 pr-4 py-3 text-sm text-on-surface focus:border-primary/30 focus:bg-white dark:focus:bg-[#1a1c1e] outline-none placeholder:text-outline shadow-sm transition-all" 
                      placeholder={destination?.name ? '' : "Search destination"} 
                      type="text" 
                      value={destQuery}
                      onChange={(e) => {
                        setDestQuery(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      onKeyDown={handleKeyDown}
                    />
                    {/* Autocomplete Dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1a1c1e] border border-outline-variant/20 rounded-2xl shadow-2xl overflow-hidden z-[100] isolate animate-in fade-in slide-in-from-top-2">
                      {suggestions.map((s, i) => (
                        <button 
                          key={i}
                          onClick={() => handleSuggestionSelect(s)}
                          className="w-full text-left px-4 py-3 text-sm font-medium text-on-surface border-b border-outline-variant/5 last:border-b-0 hover:bg-surface-container flex items-start gap-3 transition-colors"
                        >
                          <MapPin className="w-4 h-4 text-primary shrink-0 opacity-70 mt-0.5" />
                          <span className="leading-snug opacity-90">{s.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Transportation Mode Segmented Control */}
                <div className="flex bg-surface-container/50 p-1 rounded-xl mt-2 border border-outline-variant/10">
                  <button 
                    onClick={() => handleModeChange('driving')}
                    className={`flex-1 py-2 flex justify-center items-center rounded-lg transition-all ${travelMode === 'driving' ? 'bg-white dark:bg-[#1a1c1e] shadow-sm text-primary font-semibold' : 'text-secondary hover:text-on-surface'}`}
                  >
                    <Car className="w-4.5 h-4.5" />
                  </button>
                  <button 
                    onClick={() => handleModeChange('cycling')}
                    className={`flex-1 py-2 flex justify-center items-center rounded-lg transition-all ${travelMode === 'cycling' ? 'bg-white dark:bg-[#1a1c1e] shadow-sm text-primary font-semibold' : 'text-secondary hover:text-on-surface'}`}
                  >
                    <Bike className="w-4.5 h-4.5" />
                  </button>
                  <button 
                    onClick={() => handleModeChange('foot')}
                    className={`flex-1 py-2 flex justify-center items-center rounded-lg transition-all ${travelMode === 'foot' ? 'bg-white dark:bg-[#1a1c1e] shadow-sm text-primary font-semibold' : 'text-secondary hover:text-on-surface'}`}
                  >
                    <Footprints className="w-4.5 h-4.5" />
                  </button>
                </div>

                <button 
                  onClick={handleSearchTrigger}
                  className="w-full h-12 bg-primary text-white rounded-xl font-medium text-sm mt-3 hover:bg-primary/90 transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Route className="w-4 h-4" />
                  View Routes
                </button>
              </div>
            </div>

              {/* Scrollable Expanded Elements (Routes & Summary) */}
              <div className="overflow-y-auto custom-scrollbar pr-1 mt-4">
                {routes.length > 0 && (
                  <>
                    <div className="space-y-2 mb-6">
                      <p className="text-xs font-semibold text-secondary mb-3">Available Routes</p>
                      {routes.map((r, i) => (
                        <div 
                          key={r.id}
                          className={`p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                            selectedRouteIndex === i 
                            ? 'border-primary bg-primary/5 shadow-sm' 
                            : 'border-transparent bg-surface-container-low hover:bg-surface-container'
                          }`}
                        >
                          <div>
                            <p className="text-sm font-semibold text-on-surface mb-0.5">Route {i + 1}</p>
                            <p className="text-xs text-secondary">{r.distanceKm} km • {r.durationMin} min</p>
                          </div>
                          <div className="text-right flex flex-col items-end">
                            <span className={`text-sm font-bold ${r.safetyScore > 80 ? 'text-emerald-600' : 'text-amber-600'}`}>{r.safetyScore}%</span>
                            <p className="text-[10px] font-medium text-secondary">Safety</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Integrated Trip Summary */}
                    {routes[selectedRouteIndex] && (
                      <div className="pt-6 border-t border-outline-variant/10">
                        <div className="flex items-center justify-between mb-5">
                          <h4 className="font-headline font-semibold text-base text-on-surface">Trip Summary</h4>
                          {isNavigating && (
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full">
                               <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
                               <span className="text-[10px] font-bold uppercase tracking-wider">Active</span>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/5">
                            <p className="text-[10px] font-semibold text-secondary uppercase tracking-widest mb-1">Distance</p>
                            <p className="text-lg font-headline font-semibold text-on-surface tabular-nums">{routes[selectedRouteIndex]?.distanceKm || '--'} <span className="text-xs font-medium text-secondary">km</span></p>
                          </div>
                          <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/5">
                            <p className="text-[10px] font-semibold text-secondary uppercase tracking-widest mb-1">Safety</p>
                            <p className={`text-lg font-headline font-semibold tabular-nums ${routes[selectedRouteIndex]?.safetyScore > 80 ? 'text-emerald-600' : 'text-amber-500'}`}>
                              {routes[selectedRouteIndex]?.safetyScore || '100'}%
                            </p>
                          </div>
                          <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/5">
                            <p className="text-[10px] font-semibold text-secondary uppercase tracking-widest mb-1">Duration</p>
                            <p className="text-lg font-headline font-semibold text-on-surface tabular-nums">{routes[selectedRouteIndex]?.durationMin || '--'} <span className="text-xs font-medium text-secondary">min</span></p>
                          </div>
                          <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/5">
                            <p className="text-[10px] font-semibold text-secondary uppercase tracking-widest mb-1">Alerts</p>
                            <p className="text-lg font-headline font-bold text-error tabular-nums">{hazards?.length || 0}</p>
                          </div>
                        </div>

                        {isNavigating ? (
                          <button 
                            onClick={onStopNavigation}
                            className="w-full py-3.5 bg-surface-container font-semibold text-on-surface rounded-xl text-sm hover:bg-error hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]"
                          >
                            Exit Navigation
                            <XCircle className="w-4 h-4" />
                          </button>
                        ) : (
                          <button 
                            onClick={onStartNavigation}
                            className="w-full py-3.5 bg-primary text-white font-semibold rounded-xl text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-md active:scale-[0.98]"
                          >
                            Start Navigation
                            <Navigation className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Danger Prediction Legend (Bottom Right Minimised) */}
      <div className="absolute bottom-6 right-6 pointer-events-none z-20 hidden md:block">
        <div className="glass-panel px-4 py-2 rounded-2xl shadow-md flex flex-col gap-2 pointer-events-auto border border-outline-variant/5">
          <div className="flex items-center gap-2 mb-1 border-b border-outline-variant/10 pb-2">
            <BrainCircuit className="text-primary w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Prediction Engine</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-xs font-medium text-secondary">Cleared Route</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-error"></div>
            <span className="text-xs font-medium text-secondary">Caution Area</span>
          </div>
        </div>
      </div>
    </div>
  );
}

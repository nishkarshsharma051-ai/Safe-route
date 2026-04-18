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
  List
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
    onSearch(suggestion);
  };

  const handleSearchTrigger = () => {
    if (destQuery.trim()) {
      onSearch(destQuery.trim());
      setShowSuggestions(false);
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
          <div className="w-80 flex flex-col gap-5 relative z-40">
            {/* Destination Card */}
            <div className="glass-panel p-5 rounded-2xl shadow-xl relative z-50 pointer-events-auto">
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
                <button 
                  onClick={handleSearchTrigger}
                  className="w-full h-12 bg-primary text-white rounded-xl font-medium text-sm mt-2 hover:bg-primary/90 transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Route className="w-4 h-4" />
                  View Routes
                </button>
              </div>

              {routes.length > 0 && (
                <div className="mt-6 space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2 pt-2">
                  <p className="text-xs font-medium text-secondary mb-3">Suggested Routes</p>
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
              )}
            </div>


          </div>

          {/* Right Side (Summary Panel) */}
          <div className="flex-1 flex flex-col items-end gap-6 overflow-hidden h-full pointer-events-none">
            <div className="mt-auto w-80 pointer-events-auto pb-10">
              {routes[selectedRouteIndex] ? (
                <div className={`glass-panel p-6 rounded-2xl shadow-xl relative overflow-hidden transition-all duration-300 border border-outline-variant/10 bg-white dark:bg-[#1a1c1e]`}>
                  
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="font-headline font-semibold text-lg text-on-surface">Trip Summary</h4>
                    {isNavigating && (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full">
                         <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                         <span className="text-xs font-bold">Navigating</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-secondary">Distance</p>
                      <p className="text-xl font-headline font-semibold text-on-surface">{routes[selectedRouteIndex]?.distanceKm || '--'} <span className="text-sm font-normal text-secondary">km</span></p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-secondary">Safety Score</p>
                      <p className={`text-xl font-headline font-semibold ${routes[selectedRouteIndex]?.safetyScore > 80 ? 'text-emerald-600' : 'text-amber-500'}`}>
                        {routes[selectedRouteIndex]?.safetyScore || '100'}%
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-secondary">Estimated Time</p>
                      <p className="text-xl font-headline font-semibold text-on-surface">{routes[selectedRouteIndex]?.durationMin || '--'} <span className="text-sm font-normal text-secondary">min</span></p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-secondary">Live Alerts</p>
                      <p className="text-xl font-headline font-bold text-error">{hazards?.length || 0}</p>
                    </div>
                  </div>

                  {isNavigating ? (
                    <button 
                      onClick={onStopNavigation}
                      className="w-full h-12 bg-surface-container font-semibold text-on-surface rounded-xl text-sm hover:bg-surface-container-high transition-all flex items-center justify-center gap-3 shadow-sm active:scale-[0.98]"
                    >
                      Exit Navigation
                      <XCircle className="w-5 h-5" />
                    </button>
                  ) : (
                    <button 
                      onClick={onStartNavigation}
                      className="w-full h-12 bg-primary text-white font-semibold rounded-xl text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-3 shadow-md active:scale-[0.98]"
                    >
                      Start Navigation
                      <Navigation className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="glass-panel p-8 rounded-2xl shadow-sm text-center border border-outline-variant/10">
                  <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center mx-auto mb-4 text-secondary">
                    <Search className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-medium text-secondary">Set a destination to analyze routes.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Danger Prediction Legend (Bottom Panel) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none z-20">
        <div className="glass-panel px-5 py-2.5 rounded-full shadow-md flex items-center gap-6 pointer-events-auto">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
            <span className="text-xs font-medium text-on-surface">Cleared Route</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-error"></div>
            <span className="text-xs font-medium text-on-surface">Caution Area</span>
          </div>
          <div className="h-4 w-[1px] bg-outline-variant"></div>
          <div className="flex items-center gap-2">
            <BrainCircuit className="text-primary w-4 h-4" />
            <span className="text-xs font-semibold text-primary">ML Routing Engine Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}

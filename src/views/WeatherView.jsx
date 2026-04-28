import React from 'react';
import LeafletMap from '../components/LeafletMap';
import { 
  Radar, 
  CloudSun, 
  TriangleAlert, 
  Zap, 
  ShieldCheck, 
  Thermometer, 
  Droplets, 
  Wind,
  Activity
} from 'lucide-react';

export default function WeatherView({ weather, hazards }) {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8 overflow-y-auto h-full custom-scrollbar pb-32">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-outline-variant/10 pb-8">
        <div>
          <h1 className="font-headline text-4xl font-semibold tracking-tight text-primary mb-2">Local Weather Alerts</h1>
        </div>
        <div className="flex gap-4">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container text-secondary text-xs font-semibold border border-outline-variant/10 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span> Live Radar Active
          </span>
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container text-secondary text-xs font-semibold border border-outline-variant/10 shadow-sm text-center">
            Updated: {weather?.time || 'NOW'}
          </span>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Radar Map Section */}
        <div className="lg:col-span-8 h-[550px] relative rounded-3xl overflow-hidden shadow-2xl group bg-surface-container-low border border-outline-variant/10">
          <LeafletMap userCoords={null} hazards={hazards} routes={[]} />
          
          <div className="absolute top-8 left-8 flex flex-col gap-3 z-[1000]">
            <div className="glass-panel px-5 py-2.5 rounded-xl text-primary flex items-center gap-3 shadow-md border border-outline-variant/10">
              <Radar className="w-4 h-4" />
              <span className="text-xs font-semibold">Live Meteorological Feed</span>
            </div>
          </div>
        </div>

        {/* Alert Feed Section */}
        <div className="lg:col-span-4 space-y-8">
          {/* Hazard Inventory */}
          <div className="glass-panel rounded-2xl p-6 border border-outline-variant/10 shadow-sm">
            <h3 className="text-sm font-semibold text-secondary mb-4 opacity-80">Active Weather Alerts</h3>
            <div className="space-y-3">
              {hazards.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 bg-surface-container-low rounded-xl border border-dashed border-outline-variant/30 text-center gap-2">
                  <CloudSun className="text-outline/30 w-8 h-8" />
                  <p className="text-xs font-semibold text-secondary">No active weather hazards</p>
                </div>
              ) : (
                hazards.map((h, i) => (
                  <div key={i} className={`flex items-center justify-between p-4 bg-white/50 dark:bg-[#2e3032]/50 rounded-xl border-l-4 shadow-sm transition-all hover:translate-x-1 ${h.severity === 'HIGH' ? 'border-error' : 'border-primary'}`}>
                    <div>
                      <p className="text-sm font-semibold text-on-surface">{h.name}</p>
                      <p className="text-xs text-secondary font-medium mt-0.5">Local Area</p>
                    </div>
                    {h.severity === 'HIGH' ? <TriangleAlert className="text-error w-5 h-5" /> : <Zap className="text-primary w-5 h-5" />}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Detailed Safety Instruction Card */}
          <div className="bg-primary text-white rounded-2xl p-6 shadow-md relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-primary-fixed">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-headline text-lg font-semibold">Safety Guidance</h3>
              </div>
              <p className="text-primary-fixed text-sm mb-6 leading-relaxed opacity-90">Please stay alert to local broadcasts. Weather monitoring indicates potential disruptions in your area.</p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-4">
                  <span className="w-6 h-6 flex items-center justify-center rounded-full bg-white/10 text-xs font-semibold shrink-0">1</span>
                  <span className="text-sm text-white/90">Review your planned routes before traveling.</span>
                </li>
                <li className="flex items-start gap-4">
                  <span className="w-6 h-6 flex items-center justify-center rounded-full bg-white/10 text-xs font-semibold shrink-0">2</span>
                  <span className="text-sm text-white/90">Follow alerts produced by the local API feed.</span>
                </li>
              </ul>
              <button className="w-full h-12 bg-white text-primary rounded-xl font-semibold text-sm hover:bg-primary-fixed transition-all shadow-sm active:scale-[0.98]">
                View Full Guidelines
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-5 shadow-sm border border-outline-variant/10 group hover:translate-y-[-4px] transition-all">
          <div className="w-14 h-14 rounded-xl bg-surface-container flex items-center justify-center text-primary shadow-sm group-hover:bg-primary/5 transition-colors">
            <Thermometer className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-semibold text-secondary opacity-80 mb-1">Temperature</p>
            <p className="font-headline text-2xl font-bold text-on-surface tabular-nums">{weather?.temp || '---'}°C</p>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-5 shadow-sm border border-outline-variant/10 group hover:translate-y-[-4px] transition-all">
          <div className="w-14 h-14 rounded-xl bg-surface-container flex items-center justify-center text-primary shadow-sm group-hover:bg-primary/5 transition-colors">
            <Droplets className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-semibold text-secondary opacity-80 mb-1">Humidity</p>
            <p className="font-headline text-2xl font-bold text-on-surface tabular-nums">{weather?.humidity || '---'}%</p>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-5 shadow-sm border border-outline-variant/10 group hover:translate-y-[-4px] transition-all">
          <div className="w-14 h-14 rounded-xl bg-surface-container flex items-center justify-center text-primary shadow-sm group-hover:bg-primary/5 transition-colors">
            <Wind className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-semibold text-secondary opacity-80 mb-1">Wind Speed</p>
            <p className="font-headline text-2xl font-bold text-on-surface tabular-nums">{weather?.wind || '---'} km/h</p>
          </div>
        </div>
      </div>
    </div>
  );
}

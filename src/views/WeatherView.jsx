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
          <h1 className="font-headline text-5xl font-bold tracking-tight text-primary mb-3">Weather Alerts</h1>
          <p className="text-secondary font-medium max-w-2xl opacity-80 uppercase text-[10px] tracking-[0.2em]">Operational meteorological threat monitoring • Grid Sector 7G</p>
        </div>
        <div className="flex gap-4">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container text-secondary text-[10px] font-bold uppercase tracking-widest border border-outline-variant/10 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span> Live Radar Active
          </span>
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container text-secondary text-[10px] font-bold uppercase tracking-widest border border-outline-variant/10 shadow-sm text-center">
            RESYNC {weather?.time || 'NOW'}
          </span>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Radar Map Section */}
        <div className="lg:col-span-8 h-[550px] relative rounded-3xl overflow-hidden shadow-2xl group bg-surface-container-low border border-outline-variant/10">
          <LeafletMap userCoords={null} hazards={hazards} routes={[]} />
          
          <div className="absolute top-8 left-8 flex flex-col gap-3 z-[1000]">
            <div className="glass-panel px-6 py-3 rounded-full text-primary flex items-center gap-3 shadow-2xl border border-white/30">
              <Radar className="w-4.5 h-4.5" />
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Atmospheric Feed: 0.1s Pulse</span>
            </div>
          </div>
        </div>

        {/* Alert Feed Section */}
        <div className="lg:col-span-4 space-y-8">
          {/* Hazard Inventory */}
          <div className="glass-panel rounded-3xl p-8 border border-outline-variant/10 shadow-xl">
            <h3 className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em] mb-6 opacity-60">Hazard Inventory</h3>
            <div className="space-y-4">
              {hazards.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 bg-surface-container-low rounded-2xl border border-dashed border-outline-variant/30 text-center gap-2">
                  <CloudSun className="text-outline/30 w-10 h-10" />
                  <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">No active weather hazards</p>
                </div>
              ) : (
                hazards.map((h, i) => (
                  <div key={i} className={`flex items-center justify-between p-4 bg-white/50 dark:bg-[#2e3032]/50 rounded-2xl border-l-4 shadow-sm transition-all hover:translate-x-1 ${h.severity === 'HIGH' ? 'border-error' : 'border-primary'}`}>
                    <div>
                      <p className="text-[11px] font-bold text-on-surface uppercase tracking-tight">{h.name}</p>
                      <p className="text-[9px] text-secondary font-bold uppercase opacity-60 mt-1">Grid Perimeter Alpha</p>
                    </div>
                    {h.severity === 'HIGH' ? <TriangleAlert className="text-error w-5 h-5" /> : <Zap className="text-primary w-5 h-5" />}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Detailed Safety Instruction Card */}
          <div className="bg-primary text-white rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-primary-fixed">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-headline text-xl font-bold uppercase tracking-tight">Safety Directive</h3>
              </div>
              <p className="text-primary-fixed text-[11px] font-medium mb-8 leading-relaxed opacity-90 uppercase tracking-tighter">Atmospheric monitoring indicates elevated risk patterns. Implementation of Protocol 4-Beta is advised.</p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-4">
                  <span className="w-6 h-6 flex items-center justify-center rounded-full bg-white/10 text-[10px] font-bold shrink-0">01</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/90 pt-1 leading-tight">Restrict non-essential movement during peak alert.</span>
                </li>
                <li className="flex items-start gap-4">
                  <span className="w-6 h-6 flex items-center justify-center rounded-full bg-white/10 text-[10px] font-bold shrink-0">02</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/90 pt-1 leading-tight">Maintain active link with primary Safe Route feed.</span>
                </li>
              </ul>
              <button className="w-full h-12 bg-white text-primary rounded-xl font-headline font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-primary-fixed transition-all shadow-lg active:scale-[0.98]">
                View Full Protocol
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="glass-panel p-6 rounded-3xl flex items-center gap-5 shadow-xl border border-outline-variant/10 group hover:translate-y-[-4px] transition-all">
          <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-primary shadow-sm group-hover:bg-primary/5 transition-colors">
            <Thermometer className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-secondary uppercase tracking-[0.15em] opacity-60 mb-1">Temperature Index</p>
            <p className="font-headline text-2xl font-bold text-on-surface tabular-nums">{weather?.temp || '---'}°C</p>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-3xl flex items-center gap-5 shadow-xl border border-outline-variant/10 group hover:translate-y-[-4px] transition-all">
          <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-primary shadow-sm group-hover:bg-primary/5 transition-colors">
            <Droplets className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-secondary uppercase tracking-[0.15em] opacity-60 mb-1">Humidity Ratio</p>
            <p className="font-headline text-2xl font-bold text-on-surface tabular-nums">{weather?.humidity || '---'}%</p>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-3xl flex items-center gap-5 shadow-xl border border-outline-variant/10 group hover:translate-y-[-4px] transition-all">
          <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-primary shadow-sm group-hover:bg-primary/5 transition-colors">
            <Wind className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-secondary uppercase tracking-[0.15em] opacity-60 mb-1">Wind Velocity</p>
            <p className="font-headline text-2xl font-bold text-on-surface tabular-nums">{weather?.wind || '---'} km/h</p>
          </div>
        </div>
      </div>
    </div>
  );
}

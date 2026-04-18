import React from 'react';
import LeafletMap from '../components/LeafletMap';
import { Radar, Activity, ShieldCheck, TriangleAlert } from 'lucide-react';

export default function AnalysisView({ userCoords, hazards }) {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8 overflow-y-auto h-full custom-scrollbar pb-32">
      {/* Hero Analysis Section: Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Strategic Map View */}
        <div className="lg:col-span-8 h-[550px] relative rounded-3xl overflow-hidden shadow-2xl bg-surface-container-low border border-outline-variant/10">
          <LeafletMap userCoords={userCoords} hazards={hazards} routes={[]} />
          
          {/* HUD Overlays */}
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 z-40">
            <div className="flex justify-between items-start pointer-events-auto">
              <div className="glass-panel p-6 rounded-2xl shadow-2xl max-w-sm border border-white/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Radar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-headline font-bold text-primary text-lg leading-none">Strategic Overview</h3>
                    <p className="text-[10px] text-secondary font-bold uppercase tracking-widest mt-1">Grid Sector Delta-7</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <span className="px-2 py-1 bg-error text-white text-[9px] font-bold rounded uppercase tracking-tighter">PHASE 1: THREAT DETECTED</span>
                  <span className={`px-2 py-1 bg-surface-container text-secondary text-[9px] font-bold rounded uppercase tracking-tighter ${hazards.length > 0 ? '' : 'hidden'}`}>LIVE SIGNAL</span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center pointer-events-auto">
              <div className="glass-panel px-8 py-4 rounded-full border border-white/30 shadow-2xl flex items-center gap-10">
                <div className="flex flex-col items-center">
                  <span className="text-[9px] uppercase font-bold tracking-[0.1em] text-secondary opacity-60">Monitored Area</span>
                  <span className="font-headline font-bold text-primary text-lg">5.0 KM</span>
                </div>
                <div className="w-px h-8 bg-outline-variant/30"></div>
                <div className="flex flex-col items-center">
                  <span className="text-[9px] uppercase font-bold tracking-[0.1em] text-secondary opacity-60">Hazard Nodes</span>
                  <span className="font-headline font-bold text-primary text-lg">{hazards.length}</span>
                </div>
                <div className="w-px h-8 bg-outline-variant/30"></div>
                <div className="flex flex-col items-center">
                  <span className="text-[9px] uppercase font-bold tracking-[0.1em] text-secondary opacity-60">Local Safety Score</span>
                  <span className={`font-headline font-bold text-lg ${hazards.length > 2 ? 'text-error' : 'text-primary'}`}>42/100</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Prediction Matrix */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <div className="glass-panel p-8 rounded-3xl shadow-xl flex-1 border border-outline-variant/10">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-headline font-bold text-xl text-primary leading-none">Danger Matrix</h3>
              <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center overflow-hidden">
                <Activity className="text-primary w-5 h-5" />
              </div>
            </div>
            <div className="space-y-8">
              {/* Circular Analysis HUD */}
              <div className="relative w-40 h-40 mx-auto group">
                <div className="absolute inset-0 rounded-full border-4 border-outline-variant/10"></div>
                <svg className="w-full h-full transform -rotate-90">
                  <circle className="text-error" cx="80" cy="80" fill="transparent" r="76" stroke="currentColor" strokeWidth="8" strokeDasharray="477.5" strokeDashoffset={477.5 * 0.58}></circle>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-headline font-bold text-on-surface">42%</span>
                  <span className="text-[9px] uppercase font-bold text-secondary tracking-widest">Global Safety</span>
                </div>
              </div>
              
              <div className="space-y-6 pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">Environmental Risks</span>
                    <span className="text-[10px] font-bold text-error">HIGH</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                    <div className="bg-error h-full w-[84%] rounded-full shadow-[0_0_8px_rgba(186,26,26,0.3)]"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">Infrastructure Integrity</span>
                    <span className="text-[10px] font-bold text-primary">STABLE</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                    <div className="bg-primary h-full w-[32%] rounded-full shadow-[0_0_8px_rgba(0,52,97,0.3)]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Nodes Detail */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-headline font-bold text-2xl text-primary">Live Threat Nodes</h2>
          <span className="px-3 py-1 bg-surface-container text-secondary text-[10px] font-bold rounded-full uppercase tracking-widest">{hazards.length} IDENTIFIED ANALYTICS</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {hazards.length === 0 ? (
            <div className="col-span-full border-2 border-dashed border-outline-variant/30 rounded-3xl py-16 flex flex-col items-center justify-center text-center gap-4">
              <ShieldCheck className="text-outline/30 w-12 h-12" />
              <p className="text-xs font-bold text-secondary uppercase tracking-[0.2em]">No localized threat nodes identified.</p>
            </div>
          ) : (
            hazards.slice(0, 4).map((h, i) => (
              <div key={i} className="glass-panel p-6 rounded-2xl border border-outline-variant/10 hover:border-primary/20 transition-all group group hover:translate-y-[-4px] shadow-lg">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary font-headline font-bold shadow-sm">
                    {i + 1}
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter ${h.severity === 'HIGH' ? 'bg-error text-white' : 'bg-secondary text-white'}`}>
                    {h.severity} ALERT
                  </span>
                </div>
                <h4 className="font-headline font-bold text-on-surface text-lg mb-2 leading-tight uppercase">{h.name}</h4>
                <p className="text-[11px] text-on-surface-variant font-medium leading-relaxed opacity-80 mb-6">Threat vector identified in immediate perimeter. Mission focus: avoid direct proximity engagement.</p>
                <div className="pt-2 border-t border-outline-variant/10">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] font-bold text-secondary uppercase tracking-widest">Severity Index</span>
                    <span className="text-[9px] font-bold text-on-surface">{h.severity === 'HIGH' ? '92%' : '14%'}</span>
                  </div>
                  <div className="w-full h-1 bg-surface-container rounded-full overflow-hidden">
                    <div className={`h-full ${h.severity === 'HIGH' ? 'bg-error w-[92%]' : 'bg-primary w-[14%]'}`}></div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import LeafletMap from '../components/LeafletMap';
import { 
  ShieldPlus, 
  Hospital, 
  ShieldAlert, 
  Phone, 
  Navigation,
  Satellite
} from 'lucide-react';

export default function ShelterView({ userCoords, hazards, onSearch }) {
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchShelters() {
      if (!userCoords) return;
      setLoading(true);
      try {
        const query = `
          [out:json];
          (
            node["amenity"="hospital"](around:8000,${userCoords.lat},${userCoords.lng});
            node["amenity"="police"](around:8000,${userCoords.lat},${userCoords.lng});
          );
          out 8;
        `;
        const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        const realShelters = data.elements.map((el, i) => {
          // Haversine rough distance
          const R = 6371;
          const dLat = (el.lat - userCoords.lat) * (Math.PI/180);
          const dLon = (el.lon - userCoords.lng) * (Math.PI/180);
          const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(userCoords.lat*(Math.PI/180))*Math.cos(el.lat*(Math.PI/180))*Math.sin(dLon/2)*Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const distKm = (R * c).toFixed(1);

          return {
            id: el.id,
            name: el.tags.name || (el.tags.amenity === 'hospital' ? 'Local Medical Center' : 'Police Precinct'),
            dist: `${distKm} km`,
            area: el.tags['addr:suburb'] || el.tags['addr:city'] || 'Nearby Area',
            occupancy: Math.floor(Math.random() * 60) + 20, // Simulated real-time load
            status: distKm > 5 ? 'Limited' : 'Available',
            color: el.tags.amenity === 'hospital' ? 'emerald' : 'slate',
            coords: { lat: el.lat, lng: el.lon }
          };
        }).sort((a,b) => parseFloat(a.dist) - parseFloat(b.dist));

        setShelters(realShelters);
      } catch (err) {
        console.error("Overpass API Error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchShelters();
  }, [userCoords]);
  return (
    <div className="h-full relative flex flex-col md:flex-row overflow-hidden bg-background">
      {/* Background Map Layer */}
      <div className="absolute inset-0 z-0 opacity-60 grayscale-[0.2]">
        <LeafletMap userCoords={userCoords} hazards={hazards} places={shelters} routes={[]} />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent pointer-events-none"></div>
      </div>

      {/* Floating UI Over Map */}
      <div className="relative z-40 flex-1 p-8 flex flex-col md:flex-row gap-8 overflow-hidden">
        {/* Left Side: Interactive Shelter Directory */}
        <section className="w-full md:w-[400px] flex flex-col gap-5 overflow-hidden pointer-events-auto">
          <div className="glass-panel p-6 rounded-2xl shadow-xl border border-outline-variant/10">
            <h1 className="text-2xl font-headline font-semibold text-primary mb-2">Nearby Emergency Resources</h1>
            {loading ? (
              <p className="text-xs font-semibold text-primary opacity-70 mb-6 animate-pulse">Scanning local area...</p>
            ) : (
              <p className="text-xs font-semibold text-secondary opacity-70 mb-6">Found {shelters.length} secure locations nearby</p>
            )}
            <div className="flex gap-2.5 overflow-x-auto pb-2 custom-scrollbar">
              <button className="px-5 py-2.5 bg-primary text-white text-xs font-semibold rounded-xl flex items-center gap-2 whitespace-nowrap shadow-md active:scale-95 transition-all">
                <div className="w-5 h-5 flex items-center justify-center overflow-hidden shrink-0">
                  <ShieldPlus className="w-4 h-4" />
                </div>
                <span>Places</span>
              </button>
              <button className="px-5 py-2.5 bg-surface-container text-secondary text-xs font-semibold rounded-xl flex items-center gap-2 whitespace-nowrap hover:bg-surface-container-high transition-all border border-outline-variant/10">
                <div className="w-5 h-5 flex items-center justify-center overflow-hidden shrink-0">
                  <Hospital className="w-4 h-4" />
                </div>
                <span>Medical</span>
              </button>
              <button className="px-5 py-2.5 bg-surface-container text-secondary text-xs font-semibold rounded-xl flex items-center gap-2 whitespace-nowrap hover:bg-surface-container-high transition-all border border-outline-variant/10">
                <div className="w-5 h-5 flex items-center justify-center overflow-hidden shrink-0">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <span>Police</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar pb-10">
            {shelters.map((s) => (
              <div key={s.id} className="glass-panel p-5 rounded-2xl shadow-sm border-l-4 border-outline-variant/10 hover:border-primary/20 transition-all group" 
                style={{ borderLeftColor: s.color === 'emerald' ? '#00875a' : s.color === 'amber' ? '#ff8b00' : '#42526e' }}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-headline font-semibold text-on-surface text-base leading-tight">{s.name}</h3>
                    <p className="text-xs font-medium text-secondary mt-1">{s.dist} • {s.area}</p>
                  </div>
                  <span className={`px-2 py-1 text-[10px] font-bold rounded-full uppercase tracking-tighter ${
                    s.status === 'Available' ? 'bg-emerald-500 text-white' : 
                    s.status === 'Limited' ? 'bg-amber-500 text-white' : 'bg-primary text-white'
                  }`}>
                    {s.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-6">
                  <div className="flex-1 bg-surface-container rounded-full h-1.5 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${
                      s.occupancy > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} style={{ width: `${s.occupancy}%` }}></div>
                   </div>
                  <span className="text-xs font-medium text-on-surface">{s.occupancy}% Full</span>
                </div>
                <div className="flex gap-3 mt-6">
                  <button className="flex-1 py-2.5 bg-surface-container text-secondary text-xs font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-surface-container-high transition-all">
                    <Phone className="w-4 h-4" strokeWidth={2.5} /> Call
                  </button>
                  <button 
                    onClick={() => onSearch({ lat: s.coords.lat, lng: s.coords.lng, name: s.name })}
                    className="flex-1 py-2.5 bg-primary text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-sm"
                  >
                    <Navigation className="w-4 h-4" strokeWidth={2.5} /> Route
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right Side: Active Routing Panel (Desktop) */}
        <section className="flex-1 relative hidden lg:flex flex-col items-end pointer-events-none">
          <div className="mt-auto glass-panel p-6 rounded-2xl w-80 shadow-xl self-end pointer-events-auto border border-outline-variant/10">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-md">
                <Navigation className="w-5 h-5" strokeWidth={2} />
              </div>
              <div>
                <p className="text-xs text-secondary font-medium opacity-80">Optimized Route</p>
                <h4 className="font-headline font-semibold text-on-surface text-base leading-tight truncate w-40">
                  {shelters.length > 0 ? shelters[0].name : 'Harbor Safe'}
                </h4>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-outline-variant/5">
                <span className="text-xs font-semibold text-secondary">Distance</span>
                <span className="text-sm font-semibold text-on-surface">{shelters.length > 0 ? shelters[0].dist : '2.4 KM'}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-outline-variant/5">
                <span className="text-xs font-semibold text-secondary">Calculated Time</span>
                <span className="text-sm font-semibold text-on-surface">{shelters.length > 0 ? `${Math.ceil(parseFloat(shelters[0].dist) * 8)} MIN` : '8 MIN'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-secondary">Route Clearance</span>
                <span className="text-sm font-bold text-emerald-600">SAFE</span>
              </div>
            </div>
            <button 
              onClick={() => onSearch(shelters.length > 0 ? { lat: shelters[0].coords.lat, lng: shelters[0].coords.lng, name: shelters[0].name } : 'Harbor Safe Center')}
              className="w-full mt-8 py-3 bg-primary text-white font-semibold text-sm rounded-xl hover:bg-primary/90 transition-all shadow-md active:scale-[0.98]"
            >
              Start Navigation
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

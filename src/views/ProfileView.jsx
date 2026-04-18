import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  MapPin, 
  Plus, 
  ChevronRight, 
  History, 
  Edit3, 
  ShieldCheck,
  Activity,
  User,
  Trash2
} from 'lucide-react';

export default function ProfileView() {
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('aegis-profile');
    return saved ? JSON.parse(saved) : {
      bloodType: 'Unknown',
      allergies: [],
      medications: 'None declared',
      conditions: 'None declared',
      contacts: []
    };
  });

  const [isEditing, setIsEditing] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', relation: '' });

  useEffect(() => {
    localStorage.setItem('aegis-profile', JSON.stringify(profile));
  }, [profile]);

  const addContact = () => {
    if (newContact.name && newContact.relation) {
      setProfile(p => ({ ...p, contacts: [...p.contacts, newContact] }));
      setNewContact({ name: '', relation: '' });
      setIsEditing(false);
    }
  };

  const removeContact = (idx) => {
    setProfile(p => ({
      ...p,
      contacts: p.contacts.filter((_, i) => i !== idx)
    }));
  };
  return (
    <div className="max-w-6xl mx-auto p-6 lg:p-8 h-full overflow-y-auto custom-scrollbar pb-32">
      {/* Header Section */}
      <div className="mb-12 border-b border-outline-variant/10 pb-8">
        <h1 className="text-5xl font-headline font-bold text-primary mb-3 tracking-tight">Agent Dossier</h1>
        <p className="text-secondary font-medium uppercase text-[10px] tracking-[0.2em] opacity-70">Operational Profile • Clearance Level 4-Alpha</p>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Medical Information */}
        <div className="md:col-span-8 glass-panel rounded-3xl p-8 shadow-xl border border-outline-variant/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
            <Stethoscope className="w-[120px] h-[120px]" />
          </div>
          <div className="flex justify-between items-start mb-10">
            <div>
              <h3 className="text-2xl font-headline font-bold text-on-surface mb-1 uppercase tracking-tight">Medical Dossier</h3>
              <p className="text-[10px] font-bold text-secondary uppercase tracking-widest opacity-60">Critical Bio-Metric Data</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
              <Activity className="w-6 h-6" />
            </div>
          </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="text-[9px] uppercase tracking-[0.2em] font-bold text-secondary mb-2 block opacity-60">Blood Type</label>
                  <div className="bg-surface-container px-5 py-3.5 rounded-xl border-l-4 border-primary text-primary font-headline font-bold text-lg shadow-sm">
                    {profile.bloodType}
                  </div>
                </div>
                <div>
                  <label className="text-[9px] uppercase tracking-[0.2em] font-bold text-secondary mb-2 block opacity-60">Known Allergies</label>
                  <div className="bg-surface-container p-4 rounded-xl flex flex-wrap gap-2 shadow-sm min-h-[50px] items-center">
                    {profile.allergies.length > 0 ? profile.allergies.map((al, idx) => (
                      <span key={idx} className="bg-white px-3 py-1 rounded-lg text-[10px] font-bold text-primary uppercase border border-primary/10 shadow-sm">{al}</span>
                    )) : <span className="text-[11px] font-bold text-on-surface uppercase opacity-50 italic">None logged</span>}
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="text-[9px] uppercase tracking-[0.2em] font-bold text-secondary mb-2 block opacity-60">Current Medications</label>
                  <div className="bg-surface-container p-4 rounded-xl text-[11px] font-bold text-on-surface uppercase opacity-50 italic min-h-[50px] flex items-center">
                    {profile.medications}
                  </div>
                </div>
                <div>
                  <label className="text-[9px] uppercase tracking-[0.2em] font-bold text-secondary mb-2 block opacity-60">Chronic Conditions</label>
                  <div className="bg-surface-container p-4 rounded-xl text-[11px] font-bold text-on-surface uppercase min-h-[50px] flex items-center">
                    {profile.conditions}
                  </div>
                </div>
              </div>
            </div>
            <button 
              onClick={() => {
                const bType = prompt("Enter Blood Type:", profile.bloodType);
                if (bType) setProfile(p => ({ ...p, bloodType: bType }));
              }}
              className="mt-10 px-6 py-3 bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-[0.2em] rounded-xl flex items-center gap-3 hover:bg-primary/10 transition-all border border-primary/10 active:scale-[0.98]"
            >
              <Edit3 className="w-4 h-4" />
              Quick Update Tactical Info
            </button>
          </div>

        {/* Emergency Contacts */}
        <div className="md:col-span-4 glass-panel rounded-3xl p-8 border border-outline-variant/10 shadow-xl flex flex-col">
          <h3 className="text-xl font-headline font-bold text-on-surface mb-8 uppercase tracking-tight">Emergency Tier 1</h3>
          <div className="space-y-4 flex-1">
            {profile.contacts.length === 0 ? (
              <div className="p-4 text-center border-2 border-dashed border-outline-variant/30 rounded-2xl opacity-60">
                <p className="text-[10px] font-bold uppercase tracking-widest text-secondary">No tactical contacts assigned</p>
              </div>
            ) : (
              profile.contacts.map((c, idx) => (
                <div key={idx} className="bg-white/50 dark:bg-[#2e3032]/50 p-5 rounded-2xl flex items-center justify-between shadow-sm border border-outline-variant/5 group hover:translate-x-1 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-secondary-container flex items-center justify-center text-primary font-headline font-bold text-lg shadow-sm">
                      {c.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-on-surface uppercase tracking-tight">{c.name}</p>
                      <p className="text-[9px] text-secondary uppercase font-bold opacity-60 mt-0.5 tracking-widest">{c.relation} • NODE-A</p>
                    </div>
                  </div>
                  <button onClick={() => removeContact(idx)} className="text-error opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                </div>
              ))
            )}
          </div>
          
          {isEditing ? (
            <div className="mt-8 flex gap-2 flex-col">
              <input type="text" placeholder="NAME" className="bg-surface-container rounded-xl px-4 py-3 text-xs font-bold uppercase" value={newContact.name} onChange={(e) => setNewContact({...newContact, name: e.target.value})} />
              <input type="text" placeholder="RELATIONSHIP" className="bg-surface-container rounded-xl px-4 py-3 text-xs font-bold uppercase" value={newContact.relation} onChange={(e) => setNewContact({...newContact, relation: e.target.value})} />
              <div className="flex gap-2">
                <button onClick={addContact} className="flex-1 py-3 bg-primary text-white font-bold text-[10px] uppercase tracking-widest rounded-xl">Save</button>
                <button onClick={() => setIsEditing(false)} className="px-4 py-3 bg-error text-white font-bold text-[10px] uppercase tracking-widest rounded-xl"><Trash2 className="w-4 h-4"/></button>
              </div>
            </div>
          ) : (
            <button onClick={() => setIsEditing(true)} className="w-full mt-8 py-4 bg-surface-container text-primary font-bold text-[10px] uppercase tracking-[0.15em] rounded-2xl border border-outline-variant/10 hover:bg-surface-container-high transition-all flex items-center justify-center gap-3 group">
              <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-3.5 h-3.5" />
              </div>
              Add Strategic Contact
            </button>
          )}
        </div>

        {/* Notification Preferences */}
        <div className="md:col-span-5 glass-panel rounded-3xl p-8 shadow-xl border border-outline-variant/10">
          <h3 className="text-xl font-headline font-bold text-on-surface mb-8 uppercase tracking-tight">Alert Configuration</h3>
          <div className="space-y-8">
            <div className="flex items-center justify-between bg-surface-container p-5 rounded-2xl border border-outline-variant/5">
              <div>
                <p className="text-[11px] font-bold text-on-surface uppercase tracking-tight mb-1">Critical SMS Alerts</p>
                <p className="text-[9px] text-secondary font-bold uppercase opacity-60 tracking-tighter">Priority: IMMEDIATE ENGAGEMENT</p>
              </div>
              <div className="w-12 h-6 bg-primary rounded-full relative flex items-center px-1 cursor-pointer">
                <div className="w-4 h-4 bg-white rounded-full ml-auto shadow-sm"></div>
              </div>
            </div>
            <div className="flex items-center justify-between bg-surface-container p-5 rounded-2xl border border-outline-variant/5">
              <div>
                <p className="text-[11px] font-bold text-on-surface uppercase tracking-tight mb-1">Smart Push Notifications</p>
                <p className="text-[9px] text-secondary font-bold uppercase opacity-60 tracking-tighter">Priority: PROXIMITY SENSITIVE</p>
              </div>
              <div className="w-12 h-6 bg-primary rounded-full relative flex items-center px-1 cursor-pointer">
                <div className="w-4 h-4 bg-white rounded-full ml-auto shadow-sm"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Historical Safety Logs */}
        <div className="md:col-span-7 glass-panel rounded-3xl p-8 overflow-hidden relative border border-outline-variant/10 shadow-xl group">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
            <History className="w-[120px] h-[120px]" />
          </div>
          <h3 className="text-xl font-headline font-bold text-on-surface mb-2 uppercase tracking-tight">Operational History</h3>
          <p className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em] mb-8 opacity-60 border-b border-outline-variant/10 pb-4">Last 30 days of secured transit logs</p>
          <div className="space-y-4">
            {profile.contacts.length === 0 ? (
                <div className="flex items-center gap-6 bg-white/50 dark:bg-[#2e3032]/50 p-5 rounded-2xl shadow-sm border border-outline-variant/5">
                  <p className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em] opacity-60">No recent transit logs initiated.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                  {/* Procedurally Generated Recent Log */}
                  <div className="flex items-center gap-6 bg-white/50 dark:bg-[#2e3032]/50 p-5 rounded-2xl shadow-sm border border-outline-variant/5 hover:translate-x-1 transition-all cursor-pointer group">
                    <div className="flex flex-col items-center justify-center w-14 h-14 bg-surface-container rounded-2xl shrink-0 group-hover:bg-primary/5 transition-colors">
                      <span className="text-[9px] font-bold uppercase text-secondary tracking-widest opacity-60 mb-0.5">Yest</span>
                      <span className="text-xl font-headline font-bold text-primary tabular-nums">1</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] font-bold text-on-surface uppercase tracking-tight mb-1">Local Perimeter Recon</p>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span className="text-[8px] font-bold text-emerald-600 uppercase">SECURED</span>
                        </div>
                        <span className="text-[9px] font-bold text-secondary uppercase opacity-60 tracking-widest">1.4 KM ANALYTICS</span>
                      </div>
                    </div>
                    <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors text-outline">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

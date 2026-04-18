import React from 'react';
import { 
  Map, 
  BrainCircuit, 
  ShieldPlus, 
  CloudLightning, 
  User, 
  TriangleAlert, 
  HelpCircle, 
  History 
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', Icon: Map },
  { id: 'threat', label: 'Safety Analytics', Icon: BrainCircuit },
  { id: 'shelters', label: 'Places', Icon: ShieldPlus },
  { id: 'weather', label: 'Local Weather', Icon: CloudLightning },
  { id: 'profile', label: 'Profile', Icon: User },
];

export default function Sidebar({ activeView, onViewChange, onSOS }) {
  return (
    <aside className="h-screen w-64 fixed left-0 top-0 pt-20 bg-surface-container-low dark:bg-[#1a1c1e] flex flex-col gap-2 p-4 z-40 border-r border-outline-variant/10">
      <div className="mb-8 px-2">
        <h2 className="font-headline font-bold text-primary tracking-tight text-xl mb-1">Main Menu</h2>
        <p className="text-xs text-secondary font-medium opacity-70">System Online</p>
      </div>

      <nav className="flex-1 flex flex-col gap-1.5">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          const { Icon } = item;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-white dark:bg-[#2e3032] text-primary dark:text-primary-fixed shadow-sm translate-x-1' 
                  : 'text-secondary dark:text-secondary-fixed-dim hover:bg-surface-container-high dark:hover:bg-[#323437] hover:translate-x-1'
              }`}
            >
              <div className="w-8 h-8 flex items-center justify-center shrink-0">
                <Icon 
                  className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} 
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </div>
              <span className="text-sm font-medium whitespace-nowrap opacity-90 group-hover:opacity-100 transition-opacity">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-2 pt-6 border-t border-outline-variant/20">
        <button 
          onClick={onSOS}
          className="w-full bg-error text-white py-3 rounded-xl font-medium text-sm mb-4 hover:bg-[#ba1a1a] transition-all active:scale-[0.98] shadow-lg shadow-error/20 flex items-center justify-center gap-3 group"
        >
          <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <TriangleAlert className="w-3 h-3" strokeWidth={3} />
          </div>
          <span>Emergency SOS</span>
        </button>
        
        <button className="flex items-center gap-4 px-4 py-2.5 text-secondary hover:text-primary transition-all text-sm font-medium group">
          <div className="w-8 h-8 flex items-center justify-center shrink-0">
            <HelpCircle className="w-4 h-4" />
          </div>
          <span className="opacity-80 group-hover:opacity-100">Help & Support</span>
        </button>
        <button className="flex items-center gap-4 px-4 py-2.5 text-secondary hover:text-primary transition-all text-sm font-medium group">
          <div className="w-8 h-8 flex items-center justify-center shrink-0">
            <History className="w-4 h-4" />
          </div>
          <span className="opacity-80 group-hover:opacity-100">Travel History</span>
        </button>
      </div>
    </aside>
  );
}

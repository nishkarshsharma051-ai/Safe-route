import React from 'react';
import { Search, Bell, Settings, CloudDownload, CloudOff } from 'lucide-react';

export default function TopBar({ activeView, onViewChange, onSearch, onOfflineToggle, isOffline }) {
  const [query, setQuery] = React.useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#f9f9fc]/85 dark:bg-[#1a1c1e]/85 backdrop-blur-xl flex justify-between items-center px-8 h-16 shadow-[0_4px_24px_rgba(26,28,30,0.04)] border-b border-outline-variant/5">
      <div className="flex items-center gap-12">
        <span className="text-[22px] font-headline font-bold tracking-tight text-primary dark:text-[#cfe6f2] flex items-center gap-2">
          Safe Route
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden sm:block">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center overflow-hidden pointer-events-none">
            <Search className="text-outline w-4 h-4" strokeWidth={2.5} />
          </div>
          <input 
            type="text" 
            placeholder="Search global map..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-surface-container dark:bg-[#2e3032] border border-outline-variant/10 rounded-xl pl-12 pr-4 py-2 text-xs w-72 focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-outline/60 font-medium transition-all" 
          />
        </div>
        <div className="flex items-center gap-1.5">
          <button 
            onClick={onOfflineToggle}
            title={isOffline ? "Offline Map Downloaded" : "Download Offline Area"}
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${isOffline ? 'bg-primary/10 text-primary shadow-inner border border-primary/20' : 'hover:bg-surface-container text-outline hover:text-primary'}`}
          >
            {isOffline ? <CloudOff className="w-5 h-5" strokeWidth={2.5} /> : <CloudDownload className="w-5 h-5" strokeWidth={2} />}
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors text-outline hover:text-primary">
            <Bell className="w-5 h-5" strokeWidth={2} />
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-surface-container transition-colors text-outline hover:text-primary">
            <Settings className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>
        <div className="h-10 w-10 rounded-xl overflow-hidden border border-outline-variant/20 hover:border-primary/50 transition-colors cursor-pointer p-0.5 ml-2 shadow-sm">
          <div className="w-full h-full rounded-[10px] overflow-hidden">
            <img 
              alt="User Profile" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCeEdcc2UUF1p61yJYeAPYZ3zYD_D4DT2YyXhUtC0Ct33prxkH49nPIRuBFcFI97YfWaWj6UddSoYm5wWnlkPNelZ6XABsW79WUT52MC7631u-PQ63SlptG_g3_zPrkMuy1CPFypPYF_IcCmSLIYcwaw2RVIa8BOTkP1AKe8XaGykhp3-hVSsxp6PmQStoZNBw3n7VB2qnzACCD6oatghrZKEeGY_9P7lC8tNKYyHSFU0bPSP8KKhGwY1e3BqnM8PVjHF2FxjgIhPGx" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </nav>
  );
}


import React from 'react';
import { Terminal, Database, FileCode, Activity, Compass, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  activeTab: 'console' | 'data' | 'docs' | 'metrics';
  setActiveTab: (tab: 'console' | 'data' | 'docs' | 'metrics') => void;
  apiHealthy: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, apiHealthy }) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-100 tracking-tight">Ovisito Backend</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                  v2.2 REST
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Wisata, Kuliner & Layanan Super-App Aceh</p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              id="nav-tab-console"
              onClick={() => setActiveTab('console')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'console'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span className="hidden md:inline">API Console</span>
            </button>

            <button
              id="nav-tab-data"
              onClick={() => setActiveTab('data')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'data'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Database className="w-4 h-4" />
              <span className="hidden md:inline">Data Explorer</span>
            </button>

            <button
              id="nav-tab-docs"
              onClick={() => setActiveTab('docs')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'docs'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span className="hidden md:inline">API Specs</span>
            </button>

            <button
              id="nav-tab-metrics"
              onClick={() => setActiveTab('metrics')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'metrics'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span className="hidden md:inline">System & Auth</span>
            </button>
          </nav>

          {/* Status Indicator */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs">
              <span className={`w-2 h-2 rounded-full ${apiHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-slate-300 font-mono hidden sm:inline">
                {apiHealthy ? 'Port 3000 Active' : 'Connecting...'}
              </span>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};

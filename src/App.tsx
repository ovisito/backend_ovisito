import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ApiExplorer } from './components/ApiExplorer';
import { DataViewer } from './components/DataViewer';
import { DocViewer } from './components/DocViewer';
import { MetricsPanel } from './components/MetricsPanel';

export function App() {
  const [activeTab, setActiveTab] = useState<'console' | 'data' | 'docs' | 'metrics'>('console');
  const [apiHealthy, setApiHealthy] = useState(true);

  useEffect(() => {
    // Verify server health on mount
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'ok') setApiHealthy(true);
      })
      .catch(() => setApiHealthy(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500/20 selection:text-emerald-300">
      
      {/* Top Navigation */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        apiHealthy={apiHealthy} 
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'console' && <ApiExplorer />}
        {activeTab === 'data' && <DataViewer />}
        {activeTab === 'docs' && <DocViewer />}
        {activeTab === 'metrics' && <MetricsPanel />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">Ovisito Super-App Backend API v2.2</span>
            <span>•</span>
            <span>Provinsi Aceh, Indonesia</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono">Port: 3000 (0.0.0.0)</span>
            <span>•</span>
            <span>Rate Limit: 120 req/min</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;

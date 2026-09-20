import React, { useState } from 'react';
import { Play, Copy, Check, Terminal, ExternalLink, ShieldCheck, RefreshCw, Send, Layers } from 'lucide-react';
import { API_ENDPOINTS } from '../data/seedData';
import { ApiEndpointDoc, ModuleKey } from '../types';

export const ApiExplorer: React.FC = () => {
  const [selectedModule, setSelectedModule] = useState<ModuleKey | 'all'>('all');
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpointDoc>(API_ENDPOINTS[0]);
  const [customParams, setCustomParams] = useState<Record<string, string>>({});
  const [customBody, setCustomBody] = useState<string>(
    selectedEndpoint.bodyExample ? JSON.stringify(selectedEndpoint.bodyExample, null, 2) : ''
  );
  const [clientId, setClientId] = useState('shop-web');
  const [clientSecret] = useState('ovisito-demo-secret-2026');
  const [authToken, setAuthToken] = useState('ovs_cust_demo_token_aceh');

  // Request & Response State
  const [loading, setLoading] = useState(false);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({});
  const [responseDuration, setResponseDuration] = useState<number | null>(null);
  const [responseBody, setResponseBody] = useState<any>(selectedEndpoint.responseExample);
  const [copied, setCopied] = useState(false);

  // Filter endpoints
  const filteredEndpoints = selectedModule === 'all' 
    ? API_ENDPOINTS 
    : API_ENDPOINTS.filter(e => e.module === selectedModule);

  const handleSelectEndpoint = (ep: ApiEndpointDoc) => {
    setSelectedEndpoint(ep);
    setCustomParams({});
    setCustomBody(ep.bodyExample ? JSON.stringify(ep.bodyExample, null, 2) : '');
    setResponseBody(ep.responseExample);
    setResponseStatus(200);
  };

  const handleParamChange = (name: string, value: string) => {
    setCustomParams(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const executeRequest = async () => {
    setLoading(true);
    const startTime = performance.now();

    try {
      // Build URL with query params
      let targetPath = selectedEndpoint.path;
      // Handle route param replacement like :id
      if (targetPath.includes(':id')) {
        const idParam = customParams['id'] || '1';
        targetPath = targetPath.replace(':id', idParam);
      }

      const url = new URL(window.location.origin + targetPath);
      Object.entries(customParams).forEach(([k, v]) => {
        if (v && k !== 'id') {
          url.searchParams.set(k, v);
        }
      });

      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'X-Client-ID': clientId,
        'X-Client-Secret': clientSecret
      };

      if (selectedEndpoint.access !== 'Public' && authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers
      };

      if (selectedEndpoint.method === 'POST' || selectedEndpoint.method === 'PUT') {
        headers['Content-Type'] = 'application/json';
        options.body = customBody || '{}';
      }

      const res = await fetch(url.toString(), options);
      const endTime = performance.now();
      setResponseDuration(Math.round(endTime - startTime));
      setResponseStatus(res.status);

      // Collect key response headers
      const resHeaders: Record<string, string> = {};
      res.headers.forEach((val, key) => {
        if (key.startsWith('x-') || key === 'content-type') {
          resHeaders[key] = val;
        }
      });
      setResponseHeaders(resHeaders);

      const json = await res.json();
      setResponseBody(json);
    } catch (err: any) {
      setResponseStatus(500);
      setResponseBody({
        status: false,
        message: 'Gagal terhubung ke API backend: ' + err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const generateCurl = () => {
    let targetPath = selectedEndpoint.path.replace(':id', customParams['id'] || '1');
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(customParams).filter(([k, v]) => v && k !== 'id'))
    ).toString();
    const fullPath = query ? `${targetPath}?${query}` : targetPath;

    let cmd = `curl -X ${selectedEndpoint.method} "http://localhost:3000${fullPath}" \\\n  -H "X-Client-ID: ${clientId}" \\\n  -H "X-Client-Secret: ${clientSecret}" \\\n  -H "Accept: application/json"`;
    if (selectedEndpoint.method === 'POST') {
      cmd += ` \\\n  -H "Content-Type: application/json" \\\n  -d '${customBody.replace(/\n/g, '')}'`;
    }
    return cmd;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const modulesList: { key: ModuleKey | 'all'; label: string }[] = [
    { key: 'all', label: 'Semua Modul' },
    { key: 'destinasi', label: 'Destinasi Wisata' },
    { key: 'kuliner', label: 'Kuliner Khas' },
    { key: 'hotel', label: 'Hotel & Resort' },
    { key: 'event', label: 'Kalender Event' },
    { key: 'transport', label: 'Transportasi' },
    { key: 'rental', label: 'Rental Armada' },
    { key: 'mice', label: 'Venue MICE' },
    { key: 'marketplace', label: 'Marketplace' },
    { key: 'bahasa-aceh', label: 'Bahasa Aceh' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20 mb-2">
              <Terminal className="w-3.5 h-3.5" />
              Interactive REST Playground
            </div>
            <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">
              Ovisito API Console & Endpoint Tester
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-3xl">
              Uji coba langsung seluruh endpoint REST API Ovisito v2.2 (Destinasi, Kuliner, Hotel, Event, Transport, Rental, MICE, Marketplace, dan Bahasa Aceh) dengan data langsung dari server.
            </p>
          </div>
          
          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              onClick={() => copyToClipboard(generateCurl())}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'cURL Tersalin' : 'Salin cURL'}</span>
            </button>
            <button
              onClick={executeRequest}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition shadow-sm"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>Kirim Request</span>
            </button>
          </div>
        </div>

        {/* Module Filter Pills */}
        <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-2 scrollbar-none">
          {modulesList.map(mod => (
            <button
              key={mod.key}
              onClick={() => setSelectedModule(mod.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                selectedModule === mod.key
                  ? 'bg-slate-100 text-slate-950 font-semibold shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {mod.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Endpoints list & Request/Response Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Endpoint Navigator */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col h-[740px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Daftar Endpoint</span>
            <span className="text-xs text-slate-500 font-mono">{filteredEndpoints.length} Routes</span>
          </div>

          <div className="flex-1 overflow-y-auto mt-3 space-y-2 pr-1">
            {filteredEndpoints.map((ep, idx) => {
              const isSelected = selectedEndpoint.path === ep.path && selectedEndpoint.method === ep.method;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelectEndpoint(ep)}
                  className={`w-full text-left p-3 rounded-xl border transition ${
                    isSelected 
                      ? 'bg-slate-800/90 border-emerald-500/40 text-slate-100 shadow-sm' 
                      : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/40 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                      ep.method === 'GET' 
                        ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' 
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {ep.method}
                    </span>
                    <span className="text-xs font-semibold text-slate-200 truncate">{ep.title}</span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-400 truncate">{ep.path}</p>
                </button>
              );
            })}
          </div>

          {/* Quick Info Box */}
          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>Standard Client ID:</span>
              <span className="font-mono text-slate-300">shop-web</span>
            </div>
            <div className="flex justify-between">
              <span>Rate Limit:</span>
              <span className="font-mono text-slate-300">120 req / min</span>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Console & Response Viewer */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Active Request Configuration */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold px-2.5 py-1 rounded font-mono ${
                  selectedEndpoint.method === 'GET' 
                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' 
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}>
                  {selectedEndpoint.method}
                </span>
                <span className="font-mono text-sm text-slate-200 font-semibold break-all">
                  {selectedEndpoint.path}
                </span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                Akses: {selectedEndpoint.access}
              </span>
            </div>

            <p className="text-xs text-slate-400">{selectedEndpoint.description}</p>

            {/* Query Parameters (if applicable) */}
            {selectedEndpoint.queryParams && selectedEndpoint.queryParams.length > 0 && (
              <div className="space-y-2 pt-2">
                <label className="text-xs font-semibold text-slate-300 block">Query Parameters:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedEndpoint.queryParams.map((q, idx) => (
                    <div key={idx} className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="font-mono text-emerald-400 font-medium">{q.name}</span>
                        <span className="text-slate-500">{q.type}</span>
                      </div>
                      <input
                        type="text"
                        placeholder={q.description}
                        value={customParams[q.name] || ''}
                        onChange={(e) => handleParamChange(q.name, e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700/60 rounded-lg px-2.5 py-1 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Path param replacement (e.g. :id) */}
            {selectedEndpoint.path.includes(':id') && (
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="font-mono text-amber-400 font-medium">:id (Parameter ID)</span>
                  <span className="text-slate-500">number / string</span>
                </div>
                <input
                  type="text"
                  placeholder="Masukkan ID (contoh: 1 atau slug)"
                  value={customParams['id'] || '1'}
                  onChange={(e) => handleParamChange('id', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/60 rounded-lg px-2.5 py-1 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            )}

            {/* Request Body Editor (for POST/PUT) */}
            {(selectedEndpoint.method === 'POST' || selectedEndpoint.method === 'PUT') && (
              <div className="space-y-2 pt-2">
                <label className="text-xs font-semibold text-slate-300 block">JSON Payload Body:</label>
                <textarea
                  rows={6}
                  value={customBody}
                  onChange={(e) => setCustomBody(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}

          </div>

          {/* Live Response Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="bg-slate-950/80 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-300">Live Response:</span>
                {responseStatus !== null && (
                  <span className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${
                    responseStatus >= 200 && responseStatus < 300 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}>
                    {responseStatus} {responseStatus === 200 ? 'OK' : responseStatus === 201 ? 'CREATED' : 'STATUS'}
                  </span>
                )}
                {responseDuration !== null && (
                  <span className="text-xs text-slate-500 font-mono">
                    ⚡ {responseDuration} ms
                  </span>
                )}
              </div>

              <button
                onClick={() => copyToClipboard(JSON.stringify(responseBody, null, 2))}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Salin JSON</span>
              </button>
            </div>

            {/* Response Headers Preview */}
            {Object.keys(responseHeaders).length > 0 && (
              <div className="px-5 py-2 bg-slate-950/30 border-b border-slate-800/60 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-mono text-slate-400">
                {Object.entries(responseHeaders).map(([k, v]) => (
                  <div key={k}>
                    <span className="text-slate-500">{k}:</span> <span className="text-slate-300">{v}</span>
                  </div>
                ))}
              </div>
            )}

            {/* JSON Viewer */}
            <div className="p-5 max-h-[360px] overflow-auto font-mono text-xs text-slate-200 bg-slate-950">
              <pre className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                {JSON.stringify(responseBody, null, 2)}
              </pre>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

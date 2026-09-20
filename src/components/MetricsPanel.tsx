import React, { useState, useEffect } from 'react';
import { Activity, Shield, Key, Server, Cpu, Database, CheckCircle2, AlertCircle } from 'lucide-react';

export const MetricsPanel: React.FC = () => {
  const [healthData, setHealthData] = useState<any>(null);
  const [testEmail, setTestEmail] = useState('wisatawan@aceh.go.id');
  const [testPassword, setTestPassword] = useState('AcehMeutuah2026!');
  const [tokenResult, setTokenResult] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(false);

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setHealthData(data))
      .catch(err => console.error(err));
  }, []);

  const handleTestLogin = async (role: 'customer' | 'admin') => {
    setLoadingAuth(true);
    try {
      const endpoint = role === 'admin' ? '/api/v2/admin/login' : '/api/v2/auth/login';
      const body = role === 'admin' 
        ? { username: 'admin_disbudpar', password: testPassword }
        : { email: testEmail, password: testPassword };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-ID': 'shop-web',
          'X-Client-Secret': 'demo-secret'
        },
        body: JSON.stringify(body)
      });
      const json = await res.json();
      setTokenResult(json);
    } catch (err: any) {
      setTokenResult({ status: false, message: err.message });
    } finally {
      setLoadingAuth(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
          Status Sistem & Keamanan API Ovisito
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Informasi runtime, arsitektur guard autentikasi, dan pengujian token JWT/Bearer.
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Service Status</span>
            <Server className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-100">Active</span>
            <span className="text-xs font-mono text-emerald-400">Port 3000</span>
          </div>
          <p className="text-xs text-slate-500">Express v4 + Vite HMR Middleware</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Modul Terintegrasi</span>
            <Database className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-100">9 Modul</span>
            <span className="text-xs font-mono text-sky-400">v2.2 REST</span>
          </div>
          <p className="text-xs text-slate-500">Destinasi s/d Bahasa Aceh</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Rate Limit Policy</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-100">120</span>
            <span className="text-xs font-mono text-amber-400">req / min</span>
          </div>
          <p className="text-xs text-slate-500">Throttle: 120, 1 window</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Security Layer</span>
            <Shield className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-100">2 Layers</span>
            <span className="text-xs font-mono text-purple-400">Client + Guard</span>
          </div>
          <p className="text-xs text-slate-500">X-Client-ID & Bearer Token</p>
        </div>

      </div>

      {/* Two-layer Auth Tester */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Layer Specification & Info */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-slate-100 font-bold">
            <Key className="w-4 h-4 text-emerald-400" />
            <h3>2-Layer Authentication Specification</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Sesuai spesifikasi resmi dalam berkas arsitektur Ovisito:
          </p>

          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-xs font-bold text-slate-200">Layer 1: Client Authentication (Wajib)</span>
              <p className="text-[11px] text-slate-400">
                Setiap panggilan API harus menyertakan header <code className="text-emerald-400 font-mono">X-Client-ID</code> dan <code className="text-emerald-400 font-mono">X-Client-Secret</code>.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-xs font-bold text-slate-200">Layer 2: User Guard (Endpoint Terproteksi)</span>
              <p className="text-[11px] text-slate-400">
                Endpoint customer menggunakan guard <code className="text-sky-400 font-mono">auth:customer</code>, sedangkan endpoint admin menggunakan <code className="text-purple-400 font-mono">auth:admin_api</code>.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Status Server Response (/api/health)
            </span>
            <pre className="bg-slate-950 p-3 rounded-xl text-[11px] font-mono text-emerald-400 overflow-x-auto">
              {JSON.stringify(healthData, null, 2)}
            </pre>
          </div>
        </div>

        {/* Auth Simulation Tester */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-slate-100 font-bold">
            <Shield className="w-4 h-4 text-sky-400" />
            <h3>Uji Coba Penerbitan Token Pengguna</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Generate token Bearer untuk Customer atau Admin langsung dari server:
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 font-semibold block mb-1">Email Pengguna:</label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 font-semibold block mb-1">Password:</label>
              <input
                type="password"
                value={testPassword}
                onChange={(e) => setTestPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => handleTestLogin('customer')}
                disabled={loadingAuth}
                className="flex-1 py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-slate-950 font-bold text-xs transition"
              >
                Login sebagai Customer
              </button>
              <button
                onClick={() => handleTestLogin('admin')}
                disabled={loadingAuth}
                className="flex-1 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-slate-950 font-bold text-xs transition"
              >
                Login sebagai Admin
              </button>
            </div>
          </div>

          {/* Token Result Output */}
          {tokenResult && (
            <div className="pt-2 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-400 block mb-1">Response Auth:</span>
              <pre className="bg-slate-950 p-3 rounded-xl text-[11px] font-mono text-slate-200 overflow-x-auto max-h-48">
                {JSON.stringify(tokenResult, null, 2)}
              </pre>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

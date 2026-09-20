import React, { useState, useEffect } from 'react';
import { FileText, Download, Copy, Check, ExternalLink, BookOpen, Layers } from 'lucide-react';

const SPEC_FILES = [
  { filename: 'Destinasi.md', title: 'Modul Destinasi (Wisata Aceh)', version: 'v2.2', desc: 'Objek wisata, paket tour, tiket, tour guide, booking' },
  { filename: 'bahasaaceh.md', title: 'Modul Bahasa Aceh', version: 'v2.2', desc: 'Kamus Aceh-Indonesia, peribahasa, tata bahasa, budaya' },
  { filename: 'event.md', title: 'Modul Event & Festival', version: 'v2.2', desc: 'Event budaya, tiket event, booking, review' },
  { filename: 'hotel.md', title: 'Modul Hotel & Resort', version: 'v2.2', desc: 'Katalog penginapan, tipe kamar, reservasi Syariah' },
  { filename: 'kuliner.md', title: 'Modul Kuliner Aceh', version: 'v2.2', desc: 'Restoran, warkop tradisional, menu khas Aceh' },
  { filename: 'transport.md', title: 'Modul Transportasi', version: 'v2.2', desc: 'Kapal cepat Sabang, ferry Ro-Ro, shuttle antar-kota' },
  { filename: 'rental.md', title: 'Modul Rental Kendaraan', version: 'v2.2', desc: 'Rental mobil lepas kunci / dengan supir, sewa motor' },
  { filename: 'mice.md', title: 'Modul MICE & Meeting', version: 'v2.2', desc: 'Venue ballroom, convention hall, paket rapat' },
  { filename: 'marketplace.md', title: 'Modul Marketplace UMKM', version: 'v2.2', desc: 'Produk lokal Aceh, Kopi Gayo, souvenir, kerajinan' }
];

export const DocViewer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState(SPEC_FILES[0].filename);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [filterText, setFilterText] = useState('');

  const fetchSpecContent = async (file: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v2/docs/spec/${file}`);
      const json = await res.json();
      if (json.data && json.data.content) {
        setContent(json.data.content);
      } else {
        setContent('# Gagal memuat dokumentasi\n' + JSON.stringify(json));
      }
    } catch (err: any) {
      setContent('# Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpecContent(selectedFile);
  }, [selectedFile]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredSpecs = SPEC_FILES.filter(s => 
    s.title.toLowerCase().includes(filterText.toLowerCase()) ||
    s.filename.toLowerCase().includes(filterText.toLowerCase()) ||
    s.desc.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
            Dokumentasi Spesifikasi REST API Ovisito
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            File spesifikasi asli repository Ovisito Backend untuk standar integrasi aplikasi web dan mobile.
          </p>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition self-start md:self-auto"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Dokumen Disalin' : 'Salin Markdown'}</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: File List */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col h-[750px]">
          <div className="pb-3 border-b border-slate-800">
            <input
              type="text"
              placeholder="Filter file spesifikasi..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex-1 overflow-y-auto mt-3 space-y-2 pr-1">
            {filteredSpecs.map((spec) => {
              const isSelected = selectedFile === spec.filename;
              return (
                <button
                  key={spec.filename}
                  onClick={() => setSelectedFile(spec.filename)}
                  className={`w-full text-left p-3 rounded-xl border transition ${
                    isSelected
                      ? 'bg-slate-800/90 border-emerald-500/40 text-slate-100 shadow-sm'
                      : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/40 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="text-xs font-bold text-slate-200 truncate">{spec.title}</span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 shrink-0">
                      {spec.version}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{spec.desc}</p>
                  <span className="text-[10px] font-mono text-slate-500 mt-1 block">/{spec.filename}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Markdown View */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-[750px] overflow-hidden">
          
          <div className="bg-slate-950 px-6 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-emerald-400">/{selectedFile}</span>
              <span className="text-xs text-slate-500 font-mono">
                {content.split('\n').length} baris
              </span>
            </div>
            <span className="text-xs text-slate-400">REST API v2.2 Documentation</span>
          </div>

          <div className="flex-1 p-6 overflow-y-auto font-mono text-xs text-slate-300 bg-slate-950/60 leading-relaxed whitespace-pre-wrap selection:bg-emerald-500/30 selection:text-emerald-200">
            {loading ? (
              <div className="py-20 text-center text-slate-500">Memuat teks dokumentasi...</div>
            ) : (
              content
            )}
          </div>

        </div>

      </div>

    </div>
  );
};

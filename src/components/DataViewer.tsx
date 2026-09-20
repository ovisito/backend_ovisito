import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Utensils, 
  Building2, 
  Calendar, 
  Navigation, 
  Car, 
  Briefcase, 
  ShoppingBag, 
  BookOpen, 
  Star, 
  Search, 
  ChevronRight, 
  Clock, 
  ShieldCheck, 
  Tag, 
  ExternalLink 
} from 'lucide-react';
import { ModuleKey } from '../types';

export const DataViewer: React.FC = () => {
  const [activeModule, setActiveModule] = useState<ModuleKey>('destinasi');
  const [searchQuery, setSearchQuery] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const fetchModuleData = async (mod: ModuleKey, query = '') => {
    setLoading(true);
    try {
      let endpoint = '';
      if (mod === 'destinasi') endpoint = `/api/v2/public/destinasi/destinasi${query ? `?search=${encodeURIComponent(query)}` : ''}`;
      else if (mod === 'kuliner') endpoint = `/api/v2/public/kuliner/menu${query ? `?search=${encodeURIComponent(query)}` : ''}`;
      else if (mod === 'hotel') endpoint = `/api/v2/public/hotel/hotel`;
      else if (mod === 'event') endpoint = `/api/v2/public/event/event`;
      else if (mod === 'transport') endpoint = `/api/v2/public/transport/rute`;
      else if (mod === 'rental') endpoint = `/api/v2/public/rental/kendaraan`;
      else if (mod === 'mice') endpoint = `/api/v2/public/mice/venue`;
      else if (mod === 'marketplace') endpoint = `/api/v2/public/marketplace/produk${query ? `?search=${encodeURIComponent(query)}` : ''}`;
      else if (mod === 'bahasa-aceh') endpoint = `/api/v2/public/bahasa-aceh/kamus${query ? `?q=${encodeURIComponent(query)}` : ''}`;

      const res = await fetch(endpoint);
      const json = await res.json();
      
      // Handle pagination or straight data array
      if (json.data && Array.isArray(json.data)) {
        setData(json.data);
      } else if (Array.isArray(json)) {
        setData(json);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error('Error fetching module data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModuleData(activeModule, searchQuery);
    setSelectedItem(null);
  }, [activeModule]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchModuleData(activeModule, searchQuery);
  };

  const moduleTabs = [
    { key: 'destinasi', label: 'Destinasi Wisata', icon: MapPin },
    { key: 'kuliner', label: 'Kuliner Aceh', icon: Utensils },
    { key: 'hotel', label: 'Hotel & Resort', icon: Building2 },
    { key: 'event', label: 'Event & Festival', icon: Calendar },
    { key: 'transport', label: 'Transportasi', icon: Navigation },
    { key: 'rental', label: 'Rental Kendaraan', icon: Car },
    { key: 'mice', label: 'Venue MICE', icon: Briefcase },
    { key: 'marketplace', label: 'Marketplace UMKM', icon: ShoppingBag },
    { key: 'bahasa-aceh', label: 'Kamus Bahasa Aceh', icon: BookOpen },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header & Module Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
            Eksplorasi Data Wisata & Layanan Aceh
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Data live dari database in-memory Ovisito untuk 9 pilar kepariwisataan Serambi Mekkah.
          </p>
        </div>

        {/* Live Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-80">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Cari di ${activeModule}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            Cari
          </button>
        </form>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {moduleTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeModule === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveModule(tab.key as ModuleKey);
                setSearchQuery('');
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                isActive
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Data Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-sm">
          Memuat data dari API Ovisito...
        </div>
      ) : data.length === 0 ? (
        <div className="py-20 text-center bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <p className="text-slate-400 text-sm">Tidak ada data ditemukan untuk query "{searchQuery}".</p>
          <button
            onClick={() => {
              setSearchQuery('');
              fetchModuleData(activeModule, '');
            }}
            className="mt-3 text-xs text-emerald-400 hover:underline"
          >
            Reset filter pencarian
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.map((item, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedItem(item)}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden cursor-pointer transition flex flex-col group shadow-sm hover:shadow-md"
            >
              {/* Card Image (if available) */}
              {item.foto && item.foto[0] ? (
                <div className="h-44 w-full relative overflow-hidden bg-slate-950">
                  <img
                    src={item.foto[0]}
                    alt={item.nama || item.kata_aceh}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    referrerPolicy="no-referrer"
                  />
                  {item.kategori && (
                    <span className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur px-2.5 py-1 rounded-md text-[10px] font-semibold text-slate-200 border border-slate-800">
                      {item.kategori}
                    </span>
                  )}
                  {item.rating && (
                    <span className="absolute top-3 right-3 bg-amber-500/90 text-slate-950 px-2 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1 shadow">
                      <Star className="w-3 h-3 fill-slate-950" />
                      {item.rating}
                    </span>
                  )}
                </div>
              ) : (
                <div className="h-28 bg-gradient-to-br from-slate-900 to-slate-950 border-b border-slate-800/80 p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                      {item.kelas_kata || item.jenis || item.tipe || 'Ovisito Data'}
                    </span>
                    <h3 className="text-lg font-bold text-slate-100">{item.kata_aceh || item.nama || item.operator}</h3>
                  </div>
                </div>
              )}

              {/* Card Content */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <h3 className="font-bold text-slate-100 group-hover:text-emerald-400 transition text-base">
                    {item.nama || item.kata_aceh || item.operator}
                  </h3>

                  {item.kabupaten_kota && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{item.kabupaten_kota}</span>
                    </div>
                  )}

                  {/* Bahasa Aceh specific card details */}
                  {item.art_indonesia && (
                    <div className="text-xs text-slate-300 space-y-1">
                      <p><span className="text-slate-500 font-medium">Indonesia:</span> {item.art_indonesia}</p>
                      <p><span className="text-slate-500 font-medium">English:</span> {item.arti_inggris}</p>
                      {item.lafal_fonetik && (
                        <p className="font-mono text-emerald-400 text-[11px]">Fonetik: {item.lafal_fonetik}</p>
                      )}
                    </div>
                  )}

                  {/* Price info */}
                  {item.harga !== undefined && (
                    <div className="pt-1">
                      <span className="text-xs text-slate-500">Harga Tiket/Menu: </span>
                      <span className="text-sm font-bold text-emerald-400 font-mono">
                        {item.harga === 0 ? 'Gratis' : `Rp ${Number(item.harga).toLocaleString('id-ID')}`}
                      </span>
                    </div>
                  )}

                  {item.harga_mulai && (
                    <div className="pt-1">
                      <span className="text-xs text-slate-500">Mulai dari: </span>
                      <span className="text-sm font-bold text-emerald-400 font-mono">
                        Rp {Number(item.harga_mulai).toLocaleString('id-ID')} / malam
                      </span>
                    </div>
                  )}

                  {item.harga_per_hari && (
                    <div className="pt-1">
                      <span className="text-xs text-slate-500">Sewa: </span>
                      <span className="text-sm font-bold text-emerald-400 font-mono">
                        Rp {Number(item.harga_per_hari).toLocaleString('id-ID')} / hari
                      </span>
                    </div>
                  )}

                  {item.deskripsi && (
                    <p className="text-xs text-slate-400 line-clamp-2 pt-1 leading-relaxed">
                      {item.deskripsi}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span className="text-[11px] text-slate-500 font-mono">ID: #{item.id}</span>
                  <span className="flex items-center gap-1 text-emerald-400 group-hover:translate-x-1 transition font-medium">
                    Detail <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 text-lg w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center"
            >
              ✕
            </button>

            <div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                {selectedItem.kategori || selectedItem.kelas_kata || activeModule.toUpperCase()}
              </span>
              <h2 className="text-xl font-extrabold text-slate-100 mt-1">
                {selectedItem.nama || selectedItem.kata_aceh || selectedItem.operator}
              </h2>
            </div>

            {selectedItem.foto && selectedItem.foto[0] && (
              <img
                src={selectedItem.foto[0]}
                alt="Foto"
                className="w-full h-64 object-cover rounded-xl border border-slate-800"
                referrerPolicy="no-referrer"
              />
            )}

            {selectedItem.deskripsi && (
              <div>
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Deskripsi</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{selectedItem.deskripsi}</p>
              </div>
            )}

            {/* Example sentence for language */}
            {selectedItem.contoh_kalimat_aceh && (
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                <span className="text-[11px] font-semibold text-emerald-400">Contoh Percakapan Bahasa Aceh:</span>
                <p className="text-xs text-slate-100 italic">"{selectedItem.contoh_kalimat_aceh}"</p>
                <p className="text-xs text-slate-400">Artinya: {selectedItem.terjemahan_contoh}</p>
              </div>
            )}

            {/* Facilities / Amenities */}
            {selectedItem.fasilitas && (
              <div>
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Fasilitas / Layanan</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedItem.fasilitas.map((f: string, i: number) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Raw JSON Data Preview */}
            <div className="pt-2 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-400 block mb-1">Payload JSON Asli dari API:</span>
              <pre className="bg-slate-950 p-3 rounded-xl text-[11px] font-mono text-slate-300 overflow-x-auto">
                {JSON.stringify(selectedItem, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

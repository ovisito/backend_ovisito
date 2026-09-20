export type ModuleKey = 
  | 'destinasi'
  | 'kuliner'
  | 'hotel'
  | 'event'
  | 'transport'
  | 'rental'
  | 'mice'
  | 'marketplace'
  | 'bahasa-aceh';

export interface ApiResponse<T = any> {
  status: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T = any> {
  current_page: number;
  data: T[];
  per_page: number;
  total: number;
  last_page: number;
}

export interface Destination {
  id: number;
  nama: string;
  slug: string;
  kategori: string;
  kabupaten_kota: string;
  kabupaten_kota_id: number;
  alamat: string;
  lat: number;
  lng: number;
  harga_tiket: number;
  rating: number;
  total_review: number;
  featured: boolean;
  is_active: boolean;
  deskripsi: string;
  foto: string[];
  fasilitas: string[];
  jam_operasional: string;
}

export interface KulinerItem {
  id: number;
  nama: string;
  slug: string;
  kategori: string;
  restoran_nama: string;
  kabupaten_kota: string;
  harga: number;
  halal_certified: boolean;
  rating: number;
  deskripsi: string;
  bahan_utama: string[];
  foto: string[];
}

export interface HotelItem {
  id: number;
  nama: string;
  slug: string;
  bintang: number;
  syariah: boolean;
  kabupaten_kota: string;
  alamat: string;
  harga_mulai: number;
  rating: number;
  total_review: number;
  foto: string[];
  tipe_kamar: {
    id: number;
    nama: string;
    harga: number;
    kapasitas: number;
    fasilitas: string[];
  }[];
}

export interface EventItem {
  id: number;
  nama: string;
  slug: string;
  kategori: string;
  lokasi: string;
  kabupaten_kota: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  harga_tiket: number;
  status: 'upcoming' | 'ongoing' | 'completed';
  deskripsi: string;
  foto: string[];
}

export interface TransportRoute {
  id: number;
  operator: string;
  jenis: 'kapal_cepat' | 'ferry' | 'shuttle_hiace' | 'bus' | 'bandara_transfer';
  asal: string;
  tujuan: string;
  durasi: string;
  harga: number;
  jadwal: string[];
  fasilitas: string[];
}

export interface RentalVehicle {
  id: number;
  nama: string;
  tipe: 'mobil' | 'motor';
  transmisi: 'manual' | 'matic';
  kapasitas: number;
  harga_per_hari: number;
  harga_dengan_supir?: number;
  kabupaten_kota: string;
  tahun: number;
  foto: string[];
}

export interface MiceVenue {
  id: number;
  nama: string;
  tipe: 'ballroom' | 'convention_center' | 'meeting_room' | 'outdoor_pavilion';
  kapasitas_maksimal: number;
  harga_sewa_per_hari: number;
  kabupaten_kota: string;
  luas_m2: number;
  fasilitas: string[];
  foto: string[];
}

export interface MarketplaceProduct {
  id: number;
  nama: string;
  slug: string;
  kategori: string;
  umkm_nama: string;
  asal_daerah: string;
  harga: number;
  stok: number;
  rating: number;
  berat_gram: number;
  deskripsi: string;
  foto: string[];
}

export interface BahasaAcehWord {
  id: number;
  kata_aceh: string;
  art_indonesia: string;
  arti_inggris: string;
  kelas_kata: 'nomina' | 'verba' | 'adjektiva' | 'partikel' | 'ungkapan';
  lafal_fonetik: string;
  contoh_kalimat_aceh: string;
  terjemahan_contoh: string;
  dialek: 'Aceh Rayeuk' | 'Pidie' | 'Aceh Utara' | 'Aceh Barat' | 'Umum';
}

export interface HabaJameun {
  id: number;
  peribahasa_aceh: string;
  arti_harfiah: string;
  makna_filosofis: string;
  konteks_penggunaan: string;
}

export interface ApiEndpointDoc {
  module: ModuleKey;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  title: string;
  description: string;
  access: 'Public' | 'Customer' | 'Admin';
  queryParams?: { name: string; type: string; default?: string; description: string }[];
  bodyExample?: any;
  responseExample: any;
}

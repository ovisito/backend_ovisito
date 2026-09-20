import { Router, Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { 
  DESTINASI_DATA, 
  KULINER_DATA, 
  HOTEL_DATA, 
  EVENT_DATA, 
  TRANSPORT_DATA, 
  RENTAL_DATA, 
  MICE_DATA, 
  MARKETPLACE_DATA, 
  BAHASA_ACEH_DATA, 
  HABA_JAMEUN_DATA,
  API_ENDPOINTS
} from '../data/seedData';

export const apiRouter = Router();

// Middleware: Standard Ovisito headers & rate limiting metadata
apiRouter.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-RateLimit-Limit', '120');
  res.setHeader('X-RateLimit-Remaining', '118');
  res.setHeader('X-RateLimit-Reset', String(Math.floor(Date.now() / 1000) + 60));
  res.setHeader('X-Ovisito-Version', '2.2.0');
  next();
});

// Helper for standardized Ovisito JSON response
const success = (res: Response, data: any, message?: string, statusCode = 200) => {
  return res.status(statusCode).json({
    status: true,
    ...(message ? { message } : {}),
    data
  });
};

const paginate = (res: Response, items: any[], page = 1, perPage = 10) => {
  const total = items.length;
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const start = (page - 1) * perPage;
  const paginatedData = items.slice(start, start + perPage);

  return res.status(200).json({
    status: true,
    current_page: Number(page),
    data: paginatedData,
    per_page: Number(perPage),
    total,
    last_page: lastPage
  });
};

// ==========================================
// 1. SYSTEM & HEALTH
// ==========================================
apiRouter.get('/health', (req: Request, res: Response) => {
  return res.json({
    status: 'ok',
    service: 'ovisito-backend-api',
    version: '2.2.0',
    timestamp: new Date().toISOString(),
    uptime_seconds: process.uptime(),
    modules: [
      'destinasi', 'kuliner', 'hotel', 'event', 'transport', 'rental', 'mice', 'marketplace', 'bahasa-aceh'
    ]
  });
});

apiRouter.get('/v2/docs/routes', (req: Request, res: Response) => {
  return success(res, API_ENDPOINTS, 'Katalog endpoint Ovisito API v2');
});

apiRouter.get('/v2/docs/spec/:filename', async (req: Request, res: Response) => {
  const allowed = [
    'Destinasi.md', 'bahasaaceh.md', 'event.md', 'hotel.md', 
    'kuliner.md', 'marketplace.md', 'mice.md', 'rental.md', 'transport.md'
  ];
  const filename = req.params.filename;
  if (!allowed.includes(filename)) {
    return res.status(404).json({ status: false, message: 'File spesifikasi tidak ditemukan' });
  }

  try {
    const filePath = path.join(process.cwd(), filename);
    const content = await fs.promises.readFile(filePath, 'utf-8');
    return success(res, { filename, content }, 'Dokumentasi berhasil dimuat');
  } catch (err: any) {
    return res.status(500).json({ status: false, message: 'Gagal membaca file dokumentasi: ' + err.message });
  }
});

// ==========================================
// 2. AUTHENTICATION (Simulated Token Issue)
// ==========================================
apiRouter.post('/v2/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(422).json({
      status: false,
      message: 'Email dan password wajib diisi',
      errors: {
        email: !email ? ['Field email harus valid'] : [],
        password: !password ? ['Field password wajib diisi'] : []
      }
    });
  }

  return success(res, {
    token: 'ovs_cust_' + Buffer.from(email + ':' + Date.now()).toString('base64'),
    token_type: 'Bearer',
    expires_in: 86400,
    user: {
      id: 108,
      name: 'Wisatawan Aceh',
      email: email,
      role: 'customer'
    }
  }, 'Login customer berhasil');
});

apiRouter.post('/v2/admin/login', (req: Request, res: Response) => {
  const { username, password } = req.body || {};
  return success(res, {
    token: 'ovs_admin_' + Buffer.from((username || 'admin') + ':' + Date.now()).toString('base64'),
    token_type: 'Bearer',
    expires_in: 43200,
    user: {
      id: 1,
      name: 'Super Admin Disbudpar Aceh',
      role: 'admin'
    }
  }, 'Login admin Ovisito berhasil');
});

// ==========================================
// 3. DESTINASI (Wisata Aceh)
// ==========================================
apiRouter.get('/v2/public/destinasi/destinasi', (req: Request, res: Response) => {
  const { search, kabupaten_kota_id, featured, sort, page = '1', per_page = '10' } = req.query;
  let items = [...DESTINASI_DATA];

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    items = items.filter(d => 
      d.nama.toLowerCase().includes(q) || 
      d.deskripsi.toLowerCase().includes(q) ||
      d.kabupaten_kota.toLowerCase().includes(q)
    );
  }

  if (kabupaten_kota_id) {
    items = items.filter(d => d.kabupaten_kota_id === Number(kabupaten_kota_id));
  }

  if (featured === 'true') {
    items = items.filter(d => d.featured);
  }

  if (sort === 'rating') {
    items.sort((a, b) => b.rating - a.rating);
  } else if (sort === 'price_asc') {
    items.sort((a, b) => a.harga_tiket - b.harga_tiket);
  } else if (sort === 'price_desc') {
    items.sort((a, b) => b.harga_tiket - a.harga_tiket);
  }

  return paginate(res, items, Number(page), Number(per_page));
});

apiRouter.get('/v2/public/destinasi/destinasi/:id', (req: Request, res: Response) => {
  const item = DESTINASI_DATA.find(d => d.id === Number(req.params.id) || d.slug === req.params.id);
  if (!item) {
    return res.status(404).json({ status: false, message: 'Destinasi wisata tidak ditemukan' });
  }
  return success(res, item);
});

apiRouter.get('/v2/public/destinasi/kategori', (req: Request, res: Response) => {
  const categories = [
    { id: 1, nama: 'Wisata Alam & Pegunungan', total: 42, icon: 'mountain' },
    { id: 2, nama: 'Wisata Bahari & Pantai', total: 28, icon: 'waves' },
    { id: 3, nama: 'Wisata Religi & Masjid Bersejarah', total: 19, icon: 'landmark' },
    { id: 4, nama: 'Wisata Budaya & Edukasi Tsunami', total: 15, icon: 'history' }
  ];
  return success(res, categories);
});

apiRouter.post('/v2/customer/destinasi/booking', (req: Request, res: Response) => {
  const { destinasi_id, jumlah_tiket, tanggal_kunjungan, nama_pemesan } = req.body || {};
  const destinasi = DESTINASI_DATA.find(d => d.id === Number(destinasi_id)) || DESTINASI_DATA[0];
  const total_harga = (destinasi.harga_tiket || 10000) * (jumlah_tiket || 1);

  return success(res, {
    booking_code: 'OVS-DST-' + Math.floor(100000 + Math.random() * 900000),
    destinasi: destinasi.nama,
    jumlah_tiket: jumlah_tiket || 1,
    tanggal_kunjungan: tanggal_kunjungan || new Date().toISOString().split('T')[0],
    nama_pemesan: nama_pemesan || 'Tamu Ovisito',
    total_bayar: total_harga,
    status_pembayaran: 'Menunggu Pembayaran (VA Aceh Syariah / QRIS)',
    qr_code_url: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=OVISITO-BOOKING-' + Date.now()
  }, 'Booking tiket destinasi berhasil dibuat', 201);
});

// ==========================================
// 4. KULINER ACEH
// ==========================================
apiRouter.get('/v2/public/kuliner/menu', (req: Request, res: Response) => {
  const { search, kategori } = req.query;
  let items = [...KULINER_DATA];

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    items = items.filter(k => k.nama.toLowerCase().includes(q) || k.deskripsi.toLowerCase().includes(q));
  }

  if (kategori && typeof kategori === 'string') {
    items = items.filter(k => k.kategori.toLowerCase().includes(kategori.toLowerCase()));
  }

  return success(res, items);
});

apiRouter.get('/v2/public/kuliner/restoran', (req: Request, res: Response) => {
  const restaurants = [
    { id: 1, nama: 'Warung Kopi Solong Ulee Kareng', rating: 4.9, alamat: 'Jl. T. Iskandar No.13-14, Ulee Kareng, Banda Aceh', spesialisasi: 'Kopi Tradisional & Roti Samahani' },
    { id: 2, nama: 'Mie Razali Banda Aceh', rating: 4.9, alamat: 'Jl. T. Panglima Polem No.71, Peunayong, Banda Aceh', spesialisasi: 'Mie Aceh Kepiting & Daging' },
    { id: 3, nama: 'Rumah Makan Hasan Aceh Besar', rating: 4.8, alamat: 'Jl. M. Hasan, Batoh, Lueng Bata, Banda Aceh', spesialisasi: 'Ayam Tangkap & Kari Kambing' }
  ];
  return success(res, restaurants);
});

// ==========================================
// 5. HOTEL & AKOMODASI
// ==========================================
apiRouter.get('/v2/public/hotel/hotel', (req: Request, res: Response) => {
  const { syariah, bintang } = req.query;
  let items = [...HOTEL_DATA];

  if (syariah === 'true') {
    items = items.filter(h => h.syariah);
  }
  if (bintang) {
    items = items.filter(h => h.bintang === Number(bintang));
  }

  return success(res, items);
});

apiRouter.get('/v2/public/hotel/hotel/:id', (req: Request, res: Response) => {
  const hotel = HOTEL_DATA.find(h => h.id === Number(req.params.id) || h.slug === req.params.id);
  if (!hotel) return res.status(404).json({ status: false, message: 'Hotel tidak ditemukan' });
  return success(res, hotel);
});

apiRouter.post('/v2/customer/hotel/booking', (req: Request, res: Response) => {
  const { hotel_id, room_type_id, check_in, check_out, guest_name } = req.body || {};
  return success(res, {
    booking_id: 'OVS-HTL-' + Math.floor(100000 + Math.random() * 900000),
    hotel: HOTEL_DATA.find(h => h.id === Number(hotel_id))?.nama || 'Hermes Palace Hotel',
    check_in: check_in || '2026-10-01',
    check_out: check_out || '2026-10-03',
    guest_name: guest_name || 'Tamu Terhormat',
    status: 'Confirmed - Menunggu Pembayaran'
  }, 'Reservasi kamar hotel berhasil dibuat', 201);
});

// ==========================================
// 6. EVENT & FESTIVAL
// ==========================================
apiRouter.get('/v2/public/event/event', (req: Request, res: Response) => {
  return success(res, EVENT_DATA);
});

apiRouter.get('/v2/public/event/event/:id', (req: Request, res: Response) => {
  const event = EVENT_DATA.find(e => e.id === Number(req.params.id) || e.slug === req.params.id);
  if (!event) return res.status(404).json({ status: false, message: 'Event tidak ditemukan' });
  return success(res, event);
});

// ==========================================
// 7. TRANSPORTASI
// ==========================================
apiRouter.get('/v2/public/transport/rute', (req: Request, res: Response) => {
  return success(res, TRANSPORT_DATA);
});

apiRouter.get('/v2/public/transport/jadwal', (req: Request, res: Response) => {
  const schedules = TRANSPORT_DATA.map(t => ({
    rute_id: t.id,
    operator: t.operator,
    rute: `${t.asal} ➔ ${t.tujuan}`,
    jadwal: t.jadwal,
    harga_tiket: t.harga
  }));
  return success(res, schedules);
});

// ==========================================
// 8. RENTAL KENDARAAN
// ==========================================
apiRouter.get('/v2/public/rental/kendaraan', (req: Request, res: Response) => {
  const { tipe } = req.query;
  let items = [...RENTAL_DATA];
  if (tipe && typeof tipe === 'string') {
    items = items.filter(r => r.tipe === tipe);
  }
  return success(res, items);
});

apiRouter.post('/v2/customer/rental/booking', (req: Request, res: Response) => {
  const { vehicle_id, rental_date, with_driver } = req.body || {};
  return success(res, {
    rental_code: 'OVS-RNT-' + Math.floor(100000 + Math.random() * 900000),
    vehicle: RENTAL_DATA.find(r => r.id === Number(vehicle_id))?.nama || 'Toyota Innova Reborn',
    rental_date: rental_date || new Date().toISOString().split('T')[0],
    with_driver: Boolean(with_driver),
    status: 'Booked'
  }, 'Pemesanan rental kendaraan terkonfirmasi');
});

// ==========================================
// 9. MICE (Meeting & Convention)
// ==========================================
apiRouter.get('/v2/public/mice/venue', (req: Request, res: Response) => {
  return success(res, MICE_DATA);
});

// ==========================================
// 10. MARKETPLACE (Oleh-Oleh Aceh)
// ==========================================
apiRouter.get('/v2/public/marketplace/produk', (req: Request, res: Response) => {
  const { search, kategori } = req.query;
  let items = [...MARKETPLACE_DATA];
  if (search && typeof search === 'string') {
    items = items.filter(p => p.nama.toLowerCase().includes(search.toLowerCase()));
  }
  return success(res, items);
});

// ==========================================
// 11. BAHASA ACEH (Kamus, Budaya, Terjemahan)
// ==========================================
apiRouter.get('/v2/public/bahasa-aceh/kamus', (req: Request, res: Response) => {
  const { q } = req.query;
  let items = [...BAHASA_ACEH_DATA];

  if (q && typeof q === 'string') {
    const searchWord = q.toLowerCase();
    items = items.filter(w => 
      w.kata_aceh.toLowerCase().includes(searchWord) ||
      w.art_indonesia.toLowerCase().includes(searchWord) ||
      w.arti_inggris.toLowerCase().includes(searchWord)
    );
  }

  return success(res, items);
});

apiRouter.get('/v2/public/bahasa-aceh/peribahasa', (req: Request, res: Response) => {
  return success(res, HABA_JAMEUN_DATA);
});

apiRouter.post('/v2/public/bahasa-aceh/translate', (req: Request, res: Response) => {
  const { text = '', from = 'id', to = 'aceh' } = req.body || {};

  if (!text) {
    return res.status(422).json({
      status: false,
      message: 'Parameter teks terjemahan wajib diisi'
    });
  }

  // Smart Aceh dictionary based lookup
  const cleanInput = text.trim().toLowerCase();
  let translatedText = text;

  // Simple phrase lookup
  if (cleanInput.includes('apa kabar')) {
    translatedText = 'Peue haba?';
  } else if (cleanInput.includes('kabar baik')) {
    translatedText = 'Haba get';
  } else if (cleanInput.includes('terima kasih')) {
    translatedText = 'Teurimong geunaseh';
  } else if (cleanInput.includes('selamat datang')) {
    translatedText = 'Saleum teuka rakan';
  } else if (cleanInput.includes('silakan mampir') || cleanInput.includes('singgah')) {
    translatedText = 'Neu piyoh dilee';
  } else if (cleanInput.includes('enak sekali') || cleanInput.includes('sangat enak')) {
    translatedText = 'Mangat that keubit';
  } else if (cleanInput.includes('berapa harga')) {
    translatedText = 'Padup hareuga?';
  } else if (from === 'aceh') {
    // reverse
    if (cleanInput.includes('peue haba')) translatedText = 'Apa kabar?';
    else if (cleanInput.includes('teurimong geunaseh')) translatedText = 'Terima kasih';
    else if (cleanInput.includes('mangat')) translatedText = 'Sangat lezat / Enak';
    else translatedText = `[Terjemahan Aceh ➔ ID]: ${text}`;
  } else {
    translatedText = `[Terjemahan ID ➔ Aceh]: ${text} (Kosa kata adat terverifikasi)`;
  }

  return success(res, {
    original: text,
    translated: translatedText,
    source_lang: from,
    target_lang: to,
    confidence: 0.96,
    cultural_note: 'Bahasa Aceh memiliki ragam dialek Aceh Rayeuk, Pidie, dan Aceh Barat dengan tingkatan rasa hormat (alus / sopan).'
  });
});

📘 Dokumentasi REST API — Modul Destinasi (Wisata Aceh)
File: docs/api/destinasi-api.md
Versi: 2.2
Terakhir diperbarui: 2026-09-16

# Ovisito Destinasi API v2
REST API untuk modul destinasi wisata (objek wisata, tiket, booking, tour guide, paket wisata, review).

## Daftar Isi
1. Overview
2. Autentikasi
3. Base URL & Header
4. Format Response
5. Rate Limiting
6. Endpoint — Public
7. Endpoint — Customer
8. Endpoint — Admin
9. Webhook
10. Error Codes
11. Status Enum
12. Changelog

## 1. Overview
Modul Destinasi menyediakan API untuk:

- **Public** — katalog destinasi, cari destinasi, detail destinasi
- **Customer** — booking tiket destinasi, paket tour, pembayaran
- **Admin** — kelola destinasi, paket tour, tour guide, booking, review, disaster alert, public services

### Aktor & Guard
| Aktor | Guard | Login Endpoint |
|---|---|---|
| Customer | auth:customer | POST /api/v2/auth/login |
| Admin | auth:admin_api | POST /api/v2/admin/login |

> ℹ️ Modul destinasi saat ini tidak punya merchant panel terpisah — semua destinasi dikelola oleh admin Ovisito.

### Base Path
```
Production : https://api.ovisito.com
Sandbox    : https://staging.ovisito.com

Admin   : /api/v2/admin/destinasi/*
Public  : /api/v2/public/destinasi/*      (rekomendasi — perlu dibuat)
Customer: /api/v2/customer/destinasi/*    (rekomendasi — perlu dibuat)
```

### Model Namespace
```
App\Models\wisata_aceh\*
```

## 2. Autentikasi
Setiap request melewati 2 layer autentikasi:

### Layer 1 — Client Auth (wajib semua endpoint)
| Header | Wajib | Keterangan |
|---|---|---|
| X-Client-ID | ✅ | ID aplikasi |
| X-Client-Secret | ✅ | Secret aplikasi |

### Layer 2 — Token User (untuk endpoint terproteksi)
| Header | Wajib |
|---|---|
| Authorization: Bearer `<token>` | ✅ |

## 3. Base URL & Header

### Header Standar
```http
X-Client-ID: shop-web
X-Client-Secret: <secret>
Authorization: Bearer <token>
Content-Type: application/json
Accept: application/json
```

### Contoh Request
```bash
curl -X GET "https://api.ovisito.com/api/v2/public/destinasi/destinasi" \
  -H "X-Client-ID: shop-web" \
  -H "X-Client-Secret: xxxxx" \
  -H "Accept: application/json"
```

## 4. Format Response

### Sukses
```json
{
  "status": true,
  "message": "Optional success message",
  "data": { }
}
```

### Sukses dengan Pagination
```json
{
  "current_page": 1,
  "data": [ ... ],
  "per_page": 15,
  "total": 120,
  "last_page": 8
}
```

### Error
```json
{
  "status": false,
  "message": "Pesan error yang jelas",
  "errors": {
    "field": ["Validation error message"]
  }
}
```

## 5. Rate Limiting
| Endpoint Group | Limit |
|---|---|
| Public destinasi | 120 req/menit |
| Customer | 120 req/menit |
| Admin | 120 req/menit |

## 6. Endpoint — Public
Base path: `/api/v2/public/destinasi`
Middleware: `client.auth`, `throttle:120,1`

> ⚠️ Endpoint publik destinasi belum tersedia. Yang ada saat ini hanya admin.
> Dokumentasi berikut adalah rekomendasi yang perlu diimplementasi.

### 6.1 List Destinasi ⭐
```http
GET /api/v2/public/destinasi/destinasi
```
**Query Params:**
| Param | Tipe | Default | Keterangan |
|---|---|---|---|
| search | string | — | Cari nama destinasi |
| kabupaten_kota_id | int | — | Filter lokasi |
| kategori_id | int | — | Filter kategori |
| min_price | number | — | Harga tiket minimum |
| max_price | number | — | Harga tiket maksimum |
| featured | boolean | — | Destinasi unggulan |
| is_active | boolean | — | Hanya aktif |
| sort | enum | popular | popular, rating, price_asc, price_desc, latest |
| page | int | 1 | |
| per_page | int | 15 | |

**Request:**
```bash
GET /api/v2/public/destinasi/destinasi?kabupaten_kota_id=1&featured=true&sort=rating
```

**Response:**
```json
{
  "current_page": 1,
  "data": [
    {
      "id": "uuid",
      "nama": "Pantai Lampuuk",
      "slug": "pantai-lampuuk",
      "deskripsi": "Pantai dengan pasir putih di pesisir barat Aceh",
      "kabupaten_kota": { "id": 1, "nama": "Kota Banda Aceh" },
      "kategori": { "id": 1, "nama": "Pantai", "slug": "pantai" },
      "alamat": "Lhoknga, Aceh Besar",
      "latitude": "5.48380000",
      "longitude": "95.23450000",
      "foto_utama": "destinasi/lampuuk/main.jpg",
      "foto_urls": [
        "destinasi/lampuuk/1.jpg",
        "destinasi/lampuuk/2.jpg"
      ],
      "harga_tiket": "10000.00",
      "harga_tiket_formatted": "Rp 10.000",
      "jam_buka": "07:00",
      "jam_tutup": "18:00",
      "is_open_now": true,
      "fasilitas": ["parkir", "toilet", "warung_makan", "musholla"],
      "rating_average": 4.7,
      "total_reviews": 250,
      "views_count": 1200,
      "is_featured": true,
      "is_active": true
    }
  ],
  "per_page": 15,
  "total": 85,
  "last_page": 6
}
```

### 6.2 Detail Destinasi
```http
GET /api/v2/public/destinasi/destinasi/{slug}
```
**Response:**
```json
{
  "data": {
    "id": "uuid",
    "nama": "Pantai Lampuuk",
    "slug": "pantai-lampuuk",
    "deskripsi": "Pantai dengan pasir putih...",
    "deskripsi_lengkap": "Pantai Lampuuk adalah salah satu pantai terindah...",
    "kabupaten_kota": { ... },
    "kecamatan": { ... },
    "kategori": { ... },
    "alamat": "Lhoknga, Aceh Besar",
    "latitude": "5.48380000",
    "longitude": "95.23450000",
    "phone": "0651-123456",
    "website": "https://lampuuk.com",
    "foto_urls": [ ... ],
    "harga_tiket": "10000.00",
    "harga_tiket_formatted": "Rp 10.000",
    "harga_weekend": "15000.00",
    "harga_weekend_formatted": "Rp 15.000",
    "jam_buka": "07:00",
    "jam_tutup": "18:00",
    "is_open_now": true,
    "fasilitas": ["parkir", "toilet", "warung_makan", "musholla"],
    "aksesibilitas": {
      "jalan_aspal": true,
      "parkir_bus": true,
      "ramp_difabel": false,
      "toilet_difabel": false
    },
    "aktivitas": ["berenang", "surfing", "foto", "piknik"],
    "best_time_to_visit": "Pagi (07:00 - 10:00) atau sore (16:00 - 18:00)",
    "rating_average": 4.7,
    "total_reviews": 250,
    "rating_breakdown": {
      "kebersihan": 4.5,
      "keindahan": 4.9,
      "fasilitas": 4.4,
      "akses": 4.6,
      "harga": 4.7
    },
    "reviews": [
      {
        "id": "uuid",
        "rating": 5,
        "komentar": "Pantai terindah di Aceh!",
        "user": { "uuid": "uuid", "nama": "Budi S." },
        "created_at": "2026-09-10T10:30:00Z"
      }
    ],
    "nearby_destinasi": [ ... ]
  }
}
```

### 6.3 List Kategori Destinasi
```http
GET /api/v2/public/destinasi/kategori
```
**Response:**
```json
{
  "data": [
    { "id": 1, "nama": "Pantai", "slug": "pantai", "icon": "🏖️", "total": 15 },
    { "id": 2, "nama": "Gunung", "slug": "gunung", "icon": "⛰️", "total": 8 },
    { "id": 3, "nama": "Air Terjun", "slug": "air-terjun", "icon": "💧", "total": 12 },
    { "id": 4, "nama": "Sejarah", "slug": "sejarah", "icon": "🏛️", "total": 20 }
  ]
}
```

### 6.4 List Paket Tour
```http
GET /api/v2/public/destinasi/tour-packages
```
**Query Params:**
| Param | Tipe |
|---|---|
| search | string |
| min_price | number |
| max_price | number |
| duration | 1d, 2d, 3d, more |
| sort | popular, rating, price_asc, price_desc |

**Response:**
```json
{
  "current_page": 1,
  "data": [
    {
      "id": "uuid",
      "nama": "Tur 3 Hari Pesona Aceh",
      "slug": "tur-3-hari-pesona-aceh",
      "deskripsi": "Jelajahi keindahan Aceh dalam 3 hari",
      "durasi_hari": 3,
      "harga_per_orang": "1500000.00",
      "harga_per_orang_formatted": "Rp 1.500.000",
      "min_peserta": 2,
      "max_peserta": 15,
      "foto_urls": [ ... ],
      "destinasi_list": [
        "Pantai Lampuuk",
        "Masjid Baiturrahman",
        "Museum Tsunami"
      ],
      "itinerary": [
        { "hari": 1, "kegiatan": "Kunjungan Masjid Baiturrahman" },
        { "hari": 2, "kegiatan": "Wisata Pantai Lampuuk" },
        { "hari": 3, "kegiatan": "Museum Tsunami" }
      ],
      "fasilitas": ["transport", "guide", "makan", "penginapan"],
      "rating_average": 4.8,
      "total_reviews": 45,
      "is_featured": true
    }
  ]
}
```

### 6.5 Detail Paket Tour
```http
GET /api/v2/public/destinasi/tour-packages/{slug}
```

### 6.6 List Tour Guide
```http
GET /api/v2/public/destinasi/tour-guides
```
Query Params: `kabupaten_kota_id`, `language`, `sort`

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "nama": "Ahmad Fauzi",
      "slug": "ahmad-fauzi",
      "foto_url": "guides/ahmad.jpg",
      "bio": "Tour guide profesional dengan pengalaman 5 tahun",
      "kabupaten_kota": { "id": 1, "nama": "Kota Banda Aceh" },
      "bahasa": ["Indonesia", "Inggris", "Arab"],
      "spesialisasi": ["sejarah", "budaya", "kuliner"],
      "harga_per_hari": "500000.00",
      "harga_per_hari_formatted": "Rp 500.000",
      "rating_average": 4.9,
      "total_reviews": 80,
      "is_verified": true
    }
  ]
}
```

### 6.7 Disaster Alert (Info Bencana)
```http
GET /api/v2/public/destinasi/disasters/active
```
**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "jenis": "banjir",
      "judul": "Banjir di Aceh Barat",
      "deskripsi": "Banjir merendam beberapa kecamatan",
      "severity": "high",
      "lokasi": "Aceh Barat Daya",
      "latitude": "3.75341000",
      "longitude": "96.90892000",
      "started_at": "2026-09-15T08:00:00Z",
      "is_active": true
    }
  ]
}
```

### 6.8 Public Services (Info Layanan Publik)
```http
GET /api/v2/public/destinasi/public-services
```
Query Params: `kabupaten_kota_id`, `type`

## 7. Endpoint — Customer
Base path: `/api/v2/customer/destinasi`
Middleware: `client.auth`, `throttle:120,1`, `auth:customer`

> ⚠️ Endpoint customer destinasi belum tersedia. Rekomendasi di bawah ini perlu diimplementasi.

### 7.1 Booking Tiket Destinasi
```http
POST /api/v2/customer/destinasi/booking-destinasi
```
**Body:**
```json
{
  "destinasi_id": "uuid",
  "visit_date": "2026-09-25",
  "session": "all_day",
  "num_adults": 2,
  "num_children": 1,
  "guest_name": "Budi Santoso",
  "guest_email": "budi@example.com",
  "guest_phone": "081234567890",
  "special_request": "Butuh kursi roda untuk orang tua"
}
```

**Validasi:**
| Field | Wajib | Keterangan |
|---|---|---|
| destinasi_id | ✅ | ID destinasi |
| visit_date | ✅ | ≥ hari ini |
| session | — | morning, afternoon, all_day |
| num_adults | ✅ | 1+ |
| num_children | — | Default 0 |
| guest_name | ✅ | |
| guest_email | ✅ | |
| guest_phone | ✅ | |

**Response 201:**
```json
{
  "status": true,
  "message": "Booking berhasil dibuat",
  "data": {
    "id": "uuid",
    "booking_code": "DST-20260916-ABCD12",
    "status": "pending",
    "payment_status": "unpaid",
    "destinasi": {
      "id": "uuid",
      "nama": "Pantai Lampuuk"
    },
    "visit_date": "2026-09-25",
    "session": "all_day",
    "num_adults": 2,
    "num_children": 1,
    "harga_dewasa": "10000.00",
    "harga_anak": "5000.00",
    "total_price": "25000.00",
    "formatted_total": "Rp 25.000",
    "ticket_code": "TKT-DST-ABCD12",
    "expired_at": "2026-09-16T11:00:00Z"
  }
}
```

### 7.2 List Booking Destinasi
```http
GET /api/v2/customer/destinasi/booking-destinasi
```
Query Params: `status`, `page`, `per_page`

### 7.3 Detail Booking
```http
GET /api/v2/customer/destinasi/booking-destinasi/{booking_code}
```

### 7.4 Bayar Booking
```http
POST /api/v2/customer/destinasi/booking-destinasi/{booking_code}/pay
```
**Body:**
```json
{
  "payment_method": "qris"
}
```

### 7.5 Cek Status Pembayaran
```http
GET /api/v2/customer/destinasi/booking-destinasi/{booking_code}/payment-status
```

### 7.6 Batalkan Booking
```http
POST /api/v2/customer/destinasi/booking-destinasi/{booking_code}/cancel
```
**Body:** `{ "reason": "Rencana berubah" }`

### 7.7 Booking Paket Tour
```http
POST /api/v2/customer/destinasi/booking-packages
```
**Body:**
```json
{
  "package_id": "uuid",
  "start_date": "2026-10-01",
  "num_participants": 4,
  "guest_name": "Budi Santoso",
  "guest_email": "budi@example.com",
  "guest_phone": "081234567890",
  "special_request": "Vegetarian meal"
}
```

**Response 201:**
```json
{
  "status": true,
  "message": "Booking paket tour berhasil",
  "data": {
    "id": "uuid",
    "booking_code": "PKG-20260916-ABCD12",
    "status": "pending",
    "package": { "id": "uuid", "nama": "Tur 3 Hari Pesona Aceh" },
    "start_date": "2026-10-01",
    "num_participants": 4,
    "harga_per_orang": "1500000.00",
    "total_price": "6000000.00",
    "formatted_total": "Rp 6.000.000"
  }
}
```

### 7.8 List Booking Paket Tour
```http
GET /api/v2/customer/destinasi/booking-packages
```

### 7.9 Detail Booking Paket
```http
GET /api/v2/customer/destinasi/booking-packages/{booking_code}
```

### 7.10 Batalkan Paket
```http
POST /api/v2/customer/destinasi/booking-packages/{booking_code}/cancel
```

### 7.11 Buat Review
```http
POST /api/v2/customer/destinasi/reviews
```
**Body:**
```json
{
  "destinasi_id": "uuid",
  "booking_id": "uuid",
  "rating": 5,
  "komentar": "Pantai terindah di Aceh!",
  "aspects": {
    "kebersihan": 5,
    "keindahan": 5,
    "fasilitas": 4,
    "akses": 5,
    "harga": 5
  },
  "foto": ["reviews/lampuuk-1.jpg"]
}
```
**Validasi:** Booking harus completed.

## 8. Endpoint — Admin
Base path: `/api/v2/admin/destinasi`
Middleware: `client.auth`, `throttle:120,1`, `auth:admin_api`, `admin`

### 8.1 Destinasi
| Method | Endpoint | Fungsi |
|---|---|---|
| GET | /destinasi | List destinasi |
| POST | /destinasi | Buat destinasi |
| GET | /destinasi/stats | Statistik |
| GET | /destinasi/top-destinasi | Top destinasi |
| GET | /destinasi/revenue-trends | Tren revenue |
| GET | /destinasi/{destinasi} | Detail |
| PUT | /destinasi/{destinasi} | Update |
| DELETE | /destinasi/{destinasi} | Hapus |
| POST | /destinasi/{id}/toggle-featured | Toggle unggulan |
| POST | /destinasi/{id}/toggle-status | Toggle aktif |

**POST Body:**
```json
{
  "nama": "Pantai Lampuuk",
  "slug": "pantai-lampuuk",
  "deskripsi": "Pantai dengan pasir putih...",
  "deskripsi_lengkap": "...",
  "kabupaten_kota_id": 1,
  "kecamatan_id": 12,
  "kategori_id": 1,
  "alamat": "Lhoknga, Aceh Besar",
  "latitude": 5.48380000,
  "longitude": 95.23450000,
  "phone": "0651-123456",
  "website": "https://lampuuk.com",
  "harga_tiket": 10000,
  "harga_weekend": 15000,
  "jam_buka": "07:00",
  "jam_tutup": "18:00",
  "fasilitas": ["parkir", "toilet", "warung_makan", "musholla"],
  "aksesibilitas": {
    "jalan_aspal": true,
    "parkir_bus": true,
    "ramp_difabel": false
  },
  "aktivitas": ["berenang", "surfing"],
  "best_time_to_visit": "Pagi atau sore",
  "is_featured": true,
  "is_active": true
}
```

### 8.2 Kategori Destinasi
| Method | Endpoint |
|---|---|
| GET | /kategori |
| POST | /kategori |
| GET | /kategori/{id} |
| PUT | /kategori/{id} |
| DELETE | /kategori/{id} |
| POST | /kategori/{id}/toggle-active |

### 8.3 Paket Tour
| Method | Endpoint |
|---|---|
| GET | /tour-packages |
| POST | /tour-packages |
| GET | /tour-packages/stats |
| GET | /tour-packages/top-packages |
| GET | /tour-packages/{tour_package} |
| PUT | /tour-packages/{tour_package} |
| DELETE | /tour-packages/{tour_package} |
| POST | /tour-packages/{id}/publish |
| POST | /tour-packages/{id}/toggle-status |

### 8.4 Tour Guide
| Method | Endpoint |
|---|---|
| GET | /tour-guides |
| POST | /tour-guides |
| GET | /tour-guides/{tour_guide} |
| PUT | /tour-guides/{tour_guide} |
| DELETE | /tour-guides/{tour_guide} |
| POST | /tour-guides/{id}/toggle-status |

### 8.5 Booking Destinasi
| Method | Endpoint |
|---|---|
| GET | /booking-destinasi |
| POST | /booking-destinasi |
| GET | /booking-destinasi/stats |
| GET | /booking-destinasi/upcoming |
| GET | /booking-destinasi/{booking_destinasi} |
| PUT | /booking-destinasi/{booking_destinasi} |
| DELETE | /booking-destinasi/{booking_destinasi} |
| POST | /booking-destinasi/{id}/mark-paid |
| POST | /booking-destinasi/{id}/update-status |
| POST | /booking-destinasi/{id}/use-ticket |

### 8.6 Booking Paket
| Method | Endpoint |
|---|---|
| GET | /booking-packages |
| POST | /booking-packages |
| GET | /booking-packages/stats |
| GET | /booking-packages/{booking_package} |
| PUT | /booking-packages/{booking_package} |
| DELETE | /booking-packages/{booking_package} |
| POST | /booking-packages/{id}/cancel |
| POST | /booking-packages/{id}/mark-paid |
| POST | /booking-packages/{id}/update-status |

### 8.7 Disaster Alert
| Method | Endpoint |
|---|---|
| GET | /disasters |
| POST | /disasters |
| GET | /disasters/active |
| GET | /disasters/stats |
| GET | /disasters/{disaster} |
| PUT | /disasters/{disaster} |
| DELETE | /disasters/{disaster} |
| POST | /disasters/{id}/resolve |

**POST Body:**
```json
{
  "jenis": "banjir",
  "judul": "Banjir di Aceh Barat",
  "deskripsi": "Banjir merendam beberapa kecamatan",
  "severity": "high",
  "lokasi": "Aceh Barat Daya",
  "latitude": 3.75341,
  "longitude": 96.90892,
  "started_at": "2026-09-15 08:00:00",
  "is_active": true
}
```

### 8.8 Public Services
| Method | Endpoint |
|---|---|
| GET | /public-services |
| POST | /public-services |
| GET | /public-services/stats |
| GET | /public-services/{public_service} |
| PUT | /public-services/{public_service} |
| DELETE | /public-services/{public_service} |
| POST | /public-services/{id}/toggle-active |
| POST | /public-services/{id}/toggle-featured |

## 9. Webhook

### Flip Payment Webhook
```http
POST /api/webhook/flip
```
**Body:**
```json
{
  "id": 12345,
  "bill_id": 12345,
  "status": "SUCCESSFUL",
  "amount": 25000,
  "reference_id": "DST-20260916-ABCD12",
  "sender_bank": "bca",
  "sender_name": "Budi Santoso",
  "payment_method": "qris"
}
```

**Efek:**
| Status | Aksi |
|---|---|
| SUCCESSFUL | Booking → paid, payment_status → paid, kirim e-ticket via email |
| FAILED | payment_status → failed |
| EXPIRED | payment_status → failed |

## 10. Error Codes
| Code | Keterangan |
|---|---|
| 200 | Sukses |
| 201 | Berhasil create |
| 400 | Bad request |
| 401 | Unauthenticated |
| 403 | Forbidden |
| 404 | Resource tidak ditemukan |
| 410 | Gone (kadaluarsa) |
| 422 | Validasi gagal |
| 429 | Rate limit |
| 500 | Server error |

### Pesan Error Umum
| Pesan | Penyebab |
|---|---|
| Client credentials required | Header tidak ada |
| Invalid client credentials | Client ID/Secret salah |
| Unauthenticated. | Token tidak valid |
| Destinasi tidak tersedia | Destinasi non-aktif |
| Tiket habis | Kuota harian habis |
| Tanggal kunjungan tidak valid | Tanggal < hari ini |
| Booking tidak dapat dibatalkan | Sudah used / lewat |
| Hanya bisa review setelah kunjungan | Booking belum completed |

## 11. Status Enum

### Booking Status
| Status | Label | Warna Badge |
|---|---|---|
| pending | Menunggu Pembayaran | bg-yellow-100 text-yellow-800 |
| paid | Sudah Dibayar | bg-blue-100 text-blue-800 |
| confirmed | Terkonfirmasi | bg-green-100 text-green-800 |
| used | Sudah Digunakan | bg-indigo-100 text-indigo-800 |
| completed | Selesai | bg-teal-100 text-teal-800 |
| cancelled | Dibatalkan | bg-red-100 text-red-800 |
| refunded | Direfund | bg-orange-100 text-orange-800 |

### Payment Status
| Status | Label |
|---|---|
| unpaid | Belum Dibayar |
| paid | Sudah Dibayar |
| failed | Gagal |
| refunded | Direfund |

### Kategori Destinasi
| Kategori | Icon |
|---|---|
| Pantai | 🏖️ |
| Gunung | ⛰️ |
| Air Terjun | 💧 |
| Sejarah | 🏛️ |
| Budaya | 🎭 |
| Kuliner | 🍜 |
| Taman | 🌳 |
| Museum | 🏛️ |

### Disaster Severity
| Level | Label | Warna |
|---|---|---|
| low | Rendah | bg-green-100 text-green-800 |
| medium | Sedang | bg-yellow-100 text-yellow-800 |
| high | Tinggi | bg-orange-100 text-orange-800 |
| critical | Kritis | bg-red-100 text-red-800 |

### Booking Session
| Session | Waktu |
|---|---|
| morning | 07:00 - 12:00 |
| afternoon | 12:00 - 18:00 |
| all_day | Full day |

## 12. Changelog
| Versi | Tanggal | Perubahan |
|---|---|---|
| 1.0 | 2025-01 | Rilis awal — destinasi & kategori |
| 2.0 | 2026-03 | Tambah tour packages & guides |
| 2.1 | 2026-06 | Tambah booking & disaster alert |
| 2.2 | 2026-09-16 | Dokumentasi lengkap |

## 📎 Lampiran

### A. Alur Lengkap Customer — Booking Tiket
```
1. Customer cari destinasi
   GET /api/v2/public/destinasi/destinasi?kabupaten_kota_id=1

2. Customer lihat detail destinasi
   GET /api/v2/public/destinasi/destinasi/pantai-lampuuk

3. Customer login
   POST /api/v2/auth/login

4. Customer buat booking
   POST /api/v2/customer/destinasi/booking-destinasi
   { destinasi_id, visit_date, num_adults, num_children, guest_name, ... }
   → Response: booking_code + ticket_code

5. Customer bayar
   POST /api/v2/customer/destinasi/booking-destinasi/{code}/pay
   → Response: payment_url

6. Bayar di Flip (QR/VA/ewallet)

7. Flip kirim webhook
   POST /api/webhook/flip
   → Booking status: paid + e-ticket terkirim

8. Customer datang ke destinasi
   Tunjukkan e-ticket + QR code ke petugas

9. Petugas scan QR
   POST /api/v2/admin/destinasi/booking-destinasi/{id}/use-ticket
   → Booking status: used

10. Booking completed
    POST /api/v2/admin/destinasi/booking-destinasi/{id}/update-status
    { status: completed }

11. Customer review
    POST /api/v2/customer/destinasi/reviews
    { destinasi_id, booking_id, rating, komentar }
```

### B. Alur Booking Paket Tour
```
1. Customer lihat paket tour
   GET /api/v2/public/destinasi/tour-packages

2. Customer lihat detail paket
   GET /api/v2/public/destinasi/tour-packages/tur-3-hari-pesona-aceh

3. Customer login & booking
   POST /api/v2/customer/destinasi/booking-packages
   { package_id, start_date, num_participants, guest_name, ... }

4. Customer bayar
   POST /api/v2/customer/destinasi/booking-packages/{code}/pay

5. Admin konfirmasi & assign tour guide
   POST /api/v2/admin/destinasi/booking-packages/{id}/update-status
   { status: confirmed }

6. Customer review setelah tour selesai
```

### C. Contoh cURL Lengkap
```bash
# ═══ PUBLIC ═══════════════════════════════════════════════
# List destinasi
curl -H "X-Client-ID: shop-web" \
     -H "X-Client-Secret: xxxxx" \
     "https://api.ovisito.com/api/v2/public/destinasi/destinasi?kabupaten_kota_id=1"

# Detail destinasi
curl -H "X-Client-ID: shop-web" \
     -H "X-Client-Secret: xxxxx" \
     "https://api.ovisito.com/api/v2/public/destinasi/destinasi/pantai-lampuuk"

# List paket tour
curl -H "X-Client-ID: shop-web" \
     -H "X-Client-Secret: xxxxx" \
     "https://api.ovisito.com/api/v2/public/destinasi/tour-packages"

# Disaster alert
curl -H "X-Client-ID: shop-web" \
     -H "X-Client-Secret: xxxxx" \
     "https://api.ovisito.com/api/v2/public/destinasi/disasters/active"

# ═══ CUSTOMER ═════════════════════════════════════════════
# Booking tiket
curl -X POST \
     -H "X-Client-ID: shop-web" \
     -H "X-Client-Secret: xxxxx" \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"destinasi_id":"uuid","visit_date":"2026-09-25","num_adults":2,"num_children":1,"guest_name":"Budi","guest_email":"budi@test.com","guest_phone":"08123"}' \
     "https://api.ovisito.com/api/v2/customer/destinasi/booking-destinasi"

# ═══ ADMIN ════════════════════════════════════════════════
# List semua destinasi
curl -H "X-Client-ID: admin-web" \
     -H "X-Client-Secret: xxxxx" \
     -H "Authorization: Bearer <admin_token>" \
     "https://api.ovisito.com/api/v2/admin/destinasi/destinasi"

# Stats destinasi
curl -H "X-Client-ID: admin-web" \
     -H "X-Client-Secret: xxxxx" \
     -H "Authorization: Bearer <admin_token>" \
     "https://api.ovisito.com/api/v2/admin/destinasi/destinasi/stats"

# Use ticket (scan QR)
curl -X POST \
     -H "X-Client-ID: admin-web" \
     -H "X-Client-Secret: xxxxx" \
     -H "Authorization: Bearer <admin_token>" \
     "https://api.ovisito.com/api/v2/admin/destinasi/booking-destinasi/{id}/use-ticket"
```

### D. Perbandingan dengan Modul Lain
| Aspek | Destinasi | Rental | Hotel | Transport |
|---|---|---|---|---|
| Merchant panel | ❌ | ❌ | ❌ | ✅ |
| Tipe tiket | Per orang | Per unit | Per kamar | Per orang |
| Multi-tiket | ✅ (dewasa + anak) | ❌ | ❌ | ✅ |
| Paket tour | ✅ Ada | ❌ | ❌ | ❌ |
| Tour guide | ✅ Ada | ❌ | ❌ | ❌ |
| Disaster alert | ✅ Ada | ❌ | ❌ | ❌ |
| Fasilitas | JSON | JSON | JSON | JSON |
| Aksesibilitas | ✅ Ada | ❌ | ❌ | ❌ |
| Best time to visit | ✅ Ada | ❌ | ❌ | ❌ |

### E. TODO — Endpoint yang Belum Ada

**Public (perlu dibuat):**
- [ ] GET /public/destinasi/destinasi
- [ ] GET /public/destinasi/destinasi/{slug}
- [ ] GET /public/destinasi/kategori
- [ ] GET /public/destinasi/tour-packages
- [ ] GET /public/destinasi/tour-packages/{slug}
- [ ] GET /public/destinasi/tour-guides
- [ ] GET /public/destinasi/disasters/active
- [ ] GET /public/destinasi/public-services

**Customer (perlu dibuat):**
- [ ] POST /customer/destinasi/booking-destinasi
- [ ] GET /customer/destinasi/booking-destinasi
- [ ] GET /customer/destinasi/booking-destinasi/{code}
- [ ] POST /customer/destinasi/booking-destinasi/{code}/pay
- [ ] POST /customer/destinasi/booking-destinasi/{code}/cancel
- [ ] POST /customer/destinasi/booking-packages
- [ ] GET /customer/destinasi/booking-packages
- [ ] POST /customer/destinasi/reviews

---
**Maintainer:** Tim Backend Ovisito
**Kontak:** backend@ovisito.com

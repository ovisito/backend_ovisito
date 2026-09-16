📘 Dokumentasi REST API — Modul Rental (Aceh Sewa)
File: docs/api/rental-api.md
Versi: 2.2
Terakhir diperbarui: 2026-09-16

# Ovisito Rental API v2
REST API untuk modul rental/sewa (katalog item, booking, rental aktif, maintenance, review).

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
Modul Rental menyediakan API untuk:

- **Public** — katalog item sewa, kategori, detail item
- **Customer** — booking item, pembayaran, pengembalian, review
- **Admin** — kelola item, kategori, booking, rental aktif, maintenance, payment, review

### Aktor & Guard
| Aktor | Guard | Login Endpoint |
|---|---|---|
| Customer | auth:customer | POST /api/v2/auth/login |
| Admin | auth:admin_api | POST /api/v2/admin/login |

> ℹ️ Modul rental saat ini tidak punya merchant panel terpisah — semua item sewa dikelola oleh admin Ovisito.

### Base Path
```
Production : https://api.ovisito.com
Sandbox    : https://staging.ovisito.com

Admin   : /api/v2/admin/rental/*
Public  : /api/v2/public/rental/*      (rekomendasi — perlu dibuat)
Customer: /api/v2/customer/rental/*    (rekomendasi — perlu dibuat)
```

### Model Namespace
```
App\Models\AcehSewa\*
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
curl -X GET "https://api.ovisito.com/api/v2/public/rental/items" \
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
| Public rental | 120 req/menit |
| Customer | 120 req/menit |
| Admin | 120 req/menit |

## 6. Endpoint — Public
Base path: `/api/v2/public/rental`
Middleware: `client.auth`, `throttle:120,1`

> ⚠️ Endpoint publik rental belum tersedia. Yang ada saat ini hanya admin.
> Dokumentasi berikut adalah rekomendasi yang perlu diimplementasi.

### 6.1 List Kategori Item
```http
GET /api/v2/public/rental/categories
```
**Query Params:**
| Param | Tipe |
|---|---|
| search | string |
| is_active | boolean |
| per_page | int |

**Response:**
```json
{
  "status": true,
  "data": [
    {
      "id": "uuid",
      "nama": "Sepeda Gunung",
      "slug": "sepeda-gunung",
      "icon": "🚵",
      "deskripsi": "Aneka sepeda gunung untuk petualangan",
      "total_items": 45,
      "is_active": true
    }
  ]
}
```

### 6.2 Detail Kategori
```http
GET /api/v2/public/rental/categories/{slug}
```
Response: Detail kategori + list item.

### 6.3 List Item Rental ⭐
```http
GET /api/v2/public/rental/items
```
**Query Params:**
| Param | Tipe | Default | Keterangan |
|---|---|---|---|
| search | string | — | Cari nama item |
| category_id | uuid | — | Filter kategori |
| min_price | number | — | Harga minimum |
| max_price | number | — | Harga maksimum |
| available | boolean | — | Hanya yang tersedia |
| top_rated | boolean | — | Hanya rating tinggi |
| featured | boolean | — | Hanya item unggulan |
| sort | enum | popular | popular, price_asc, price_desc, rating |
| page | int | 1 | |
| per_page | int | 15 | |

**Request:**
```bash
GET /api/v2/public/rental/items?category_id=uuid&available=true&sort=price_asc
```

**Response:**
```json
{
  "current_page": 1,
  "data": [
    {
      "id": "uuid",
      "nama": "Sepeda Gunung Polygon Siskiu D5",
      "slug": "sepeda-polygon-siskiu-d5",
      "deskripsi": "Sepeda gunung 27.5 inch, cocok untuk trail",
      "kategori": {
        "id": "uuid",
        "nama": "Sepeda Gunung",
        "slug": "sepeda-gunung"
      },
      "harga_per_hari": "150000.00",
      "harga_per_hari_formatted": "Rp 150.000",
      "harga_per_jam": "25000.00",
      "harga_per_jam_formatted": "Rp 25.000",
      "deposit": "500000.00",
      "deposit_formatted": "Rp 500.000",
      "foto_utama": "rental/sepeda-polygon/main.jpg",
      "foto_urls": [
        "rental/sepeda-polygon/1.jpg",
        "rental/sepeda-polygon/2.jpg"
      ],
      "spesifikasi": {
        "merek": "Polygon",
        "tipe": "Sepeda Gunung",
        "ukuran": "27.5 inch",
        "tahun": 2023
      },
      "stok_total": 5,
      "stok_tersedia": 3,
      "rating_average": 4.7,
      "total_reviews": 89,
      "is_available": true,
      "is_featured": true
    }
  ],
  "per_page": 15,
  "total": 45,
  "last_page": 3
}
```

### 6.4 Detail Item Rental
```http
GET /api/v2/public/rental/items/{slug}
```
**Response:**
```json
{
  "data": {
    "id": "uuid",
    "nama": "Sepeda Gunung Polygon Siskiu D5",
    "slug": "sepeda-polygon-siskiu-d5",
    "deskripsi": "Sepeda gunung 27.5 inch, cocok untuk trail",
    "kategori": { ... },
    "harga_per_hari": "150000.00",
    "harga_per_jam": "25000.00",
    "harga_per_minggu": "900000.00",
    "deposit": "500000.00",
    "foto_urls": [ ... ],
    "spesifikasi": {
      "merek": "Polygon",
      "tipe": "Sepeda Gunung",
      "ukuran": "27.5 inch",
      "berat": "14.5 kg",
      "warna": "Hitam Merah",
      "tahun": 2023
    },
    "fasilitas": [
      "helm",
      "sarung_tangan",
      "pompa",
      "toolkit",
      "bottle_holder"
    ],
    "syarat_sewa": [
      "KTP asli sebagai jaminan",
      "Minimal usia 17 tahun",
      "Wajib mengisi form perjanjian sewa"
    ],
    "rating_average": 4.7,
    "total_reviews": 89,
    "rating_breakdown": {
      "kondisi": 4.8,
      "pelayanan": 4.6,
      "kebersihan": 4.5,
      "harga": 4.7
    },
    "stok_total": 5,
    "stok_tersedia": 3,
    "reviews": [
      {
        "id": "uuid",
        "rating": 5,
        "komentar": "Sepeda bagus, kondisi mulus!",
        "user": { "uuid": "uuid", "nama": "Budi S." },
        "created_at": "2026-09-10T10:30:00Z"
      }
    ]
  }
}
```

### 6.5 Cek Ketersediaan Item
```http
GET /api/v2/public/rental/items/{slug}/availability
```
**Query Params:**
| Param | Wajib | Keterangan |
|---|---|---|
| start_date | ✅ | YYYY-MM-DD HH:MM |
| end_date | ✅ | YYYY-MM-DD HH:MM |
| jumlah | — | Jumlah unit (default 1) |

**Response:**
```json
{
  "status": true,
  "data": {
    "item_id": "uuid",
    "nama": "Sepeda Gunung Polygon Siskiu D5",
    "start_date": "2026-09-20 08:00",
    "end_date": "2026-09-22 17:00",
    "durasi": {
      "hari": 3,
      "jam": 57
    },
    "harga_per_hari": "150000.00",
    "total_harga": "450000.00",
    "deposit": "500000.00",
    "total_bayar": "950000.00",
    "stok_tersedia": 3,
    "is_available": true
  }
}
```

## 7. Endpoint — Customer
Base path: `/api/v2/customer/rental`
Middleware: `client.auth`, `throttle:120,1`, `auth:customer`

> ⚠️ Endpoint customer rental belum tersedia. Rekomendasi di bawah ini perlu diimplementasi.

### 7.1 Buat Booking Rental
```http
POST /api/v2/customer/rental/bookings
```
**Body:**
```json
{
  "item_id": "uuid",
  "start_date": "2026-09-20 08:00",
  "end_date": "2026-09-22 17:00",
  "jumlah": 1,
  "metode_pengambilan": "pickup",
  "catatan": "Tolong siapkan helm ukuran L",
  "jaminan": {
    "tipe": "ktp",
    "nomor": "1101012000010001"
  }
}
```

**Validasi:**
| Field | Wajib | Keterangan |
|---|---|---|
| item_id | ✅ | ID item |
| start_date | ✅ | ≥ hari ini |
| end_date | ✅ | > start_date |
| jumlah | ✅ | 1–5 |
| metode_pengambilan | ✅ | pickup atau delivery |
| jaminan.tipe | ✅ | ktp, sim, deposit_only |
| jaminan.nomor | ✅* | Wajib kalau bukan deposit_only |

**Response 201:**
```json
{
  "status": true,
  "message": "Booking rental berhasil dibuat",
  "data": {
    "id": "uuid",
    "booking_code": "RNT-20260916-ABCD12",
    "status": "pending",
    "payment_status": "unpaid",
    "item": {
      "id": "uuid",
      "nama": "Sepeda Gunung Polygon Siskiu D5"
    },
    "start_date": "2026-09-20 08:00",
    "end_date": "2026-09-22 17:00",
    "durasi": {
      "hari": 3,
      "jam": 57
    },
    "jumlah": 1,
    "harga_per_hari": "150000.00",
    "total_harga": "450000.00",
    "deposit": "500000.00",
    "total_bayar": "950000.00",
    "formatted_total": "Rp 950.000",
    "metode_pengambilan": "pickup",
    "expired_at": "2026-09-16T11:00:00Z"
  }
}
```

**Error 422:**
```json
{ "status": false, "message": "Stok item tidak mencukupi untuk tanggal tersebut." }
```

**Error lain:**
- Item tidak tersedia — item non-aktif
- Tanggal tidak valid — end_date < start_date
- Jumlah melebihi batas (5 unit) — business rule

### 7.2 List Booking Saya
```http
GET /api/v2/customer/rental/bookings
```
**Query Params:**
| Param | Tipe |
|---|---|
| status | enum |
| page | int |
| per_page | int |

**Response:**
```json
{
  "current_page": 1,
  "data": [
    {
      "id": "uuid",
      "booking_code": "RNT-20260916-ABCD12",
      "status": "confirmed",
      "formatted_status": "Terkonfirmasi",
      "status_badge_class": "bg-green-100 text-green-800",
      "payment_status": "paid",
      "item": {
        "id": "uuid",
        "nama": "Sepeda Gunung Polygon Siskiu D5",
        "foto_url": "rental/sepeda-polygon/main.jpg"
      },
      "start_date": "2026-09-20 08:00",
      "end_date": "2026-09-22 17:00",
      "total_bayar": "950000.00",
      "formatted_total_bayar": "Rp 950.000",
      "booked_at": "2026-09-16T10:30:00Z"
    }
  ]
}
```

### 7.3 Detail Booking
```http
GET /api/v2/customer/rental/bookings/{booking_code}
```
**Response:**
```json
{
  "data": {
    "id": "uuid",
    "booking_code": "RNT-20260916-ABCD12",
    "status": "confirmed",
    "payment_status": "paid",
    "item": {
      "id": "uuid",
      "nama": "Sepeda Gunung Polygon Siskiu D5",
      "foto_urls": ["rental/sepeda-polygon/main.jpg"],
      "spesifikasi": { ... }
    },
    "start_date": "2026-09-20 08:00",
    "end_date": "2026-09-22 17:00",
    "durasi": { "hari": 3, "jam": 57 },
    "jumlah": 1,
    "harga_per_hari": "150000.00",
    "total_harga": "450000.00",
    "deposit": "500000.00",
    "total_bayar": "950000.00",
    "metode_pengambilan": "pickup",
    "lokasi_pengambilan": "Kantor Ovisito Rental, Banda Aceh",
    "jaminan": {
      "tipe": "ktp",
      "nomor": "1101012000010001",
      "status": "diterima"
    },
    "catatan": "Tolong siapkan helm ukuran L",
    "paid_at": "2026-09-16T10:45:00Z",
    "confirmed_at": "2026-09-16T11:00:00Z",
    "booked_at": "2026-09-16T10:30:00Z"
  }
}
```

### 7.4 Bayar Booking
```http
POST /api/v2/customer/rental/bookings/{booking_code}/pay
```
**Body:**
```json
{
  "payment_method": "qris"
}
```

**Response:**
```json
{
  "status": true,
  "data": {
    "payment_url": "https://flip.id/pay/xxxxx",
    "qr_url": "https://api.flip.id/qr/xxxxx",
    "bill_id": "12345",
    "expired_at": "2026-09-17T10:30:00Z"
  }
}
```

### 7.5 Cek Status Pembayaran
```http
GET /api/v2/customer/rental/bookings/{booking_code}/payment-status
```

### 7.6 Batalkan Booking
```http
POST /api/v2/customer/rental/bookings/{booking_code}/cancel
```
**Body:**
```json
{
  "reason": "Rencana berubah"
}
```

### 7.7 Pengembalian Item
```http
POST /api/v2/customer/rental/bookings/{booking_code}/return
```
**Body:**
```json
{
  "kondisi": "baik",
  "catatan": "Tidak ada kerusakan",
  "foto": ["returns/item-1.jpg", "returns/item-2.jpg"]
}
```

**Validasi:**
| Field | Wajib | Keterangan |
|---|---|---|
| kondisi | ✅ | baik, rusak_ringan, rusak_berat |
| catatan | — | Maks 500 char |
| foto | — | Max 5 foto |

**Response:**
```json
{
  "status": true,
  "message": "Item berhasil dikembalikan",
  "data": {
    "booking_code": "RNT-20260916-ABCD12",
    "status": "returned",
    "returned_at": "2026-09-22T17:30:00Z",
    "kondisi": "baik",
    "deposit_dikembalikan": "500000.00",
    "denda": "0.00"
  }
}
```

### 7.8 Buat Review
```http
POST /api/v2/customer/rental/reviews
```
**Body:**
```json
{
  "booking_id": "uuid",
  "rating": 5,
  "komentar": "Sepeda bagus, kondisi mulus!",
  "aspects": {
    "kondisi": 5,
    "pelayanan": 5,
    "kebersihan": 4,
    "harga": 5
  }
}
```

**Validasi:**
- Booking harus completed atau returned
- 1 booking = 1 review

## 8. Endpoint — Admin
Base path: `/api/v2/admin/rental`
Middleware: `client.auth`, `throttle:120,1`, `auth:admin_api`, `admin`

### 8.1 Kategori

**List**
```http
GET /api/v2/admin/rental/categories
```
Query Params: `search`, `is_active`, `page`, `per_page`

**Stats**
```http
GET /api/v2/admin/rental/categories/stats
```
**Response:**
```json
{
  "data": {
    "total": 12,
    "active": 10,
    "inactive": 2,
    "total_items": 145
  }
}
```

**Detail / Create / Update / Delete**
```http
GET    /api/v2/admin/rental/categories/{id}
POST   /api/v2/admin/rental/categories
PUT    /api/v2/admin/rental/categories/{id}
DELETE /api/v2/admin/rental/categories/{id}
```

**Create Body:**
```json
{
  "nama": "Sepeda Gunung",
  "slug": "sepeda-gunung",
  "icon": "🚵",
  "deskripsi": "Aneka sepeda gunung untuk petualangan",
  "is_active": true
}
```

### 8.2 Item Rental

**List**
```http
GET /api/v2/admin/rental/items
```
Query Params:
| Param | Tipe |
|---|---|
| search | string |
| category_id | uuid |
| is_available | boolean |
| is_featured | boolean |
| status | active, inactive |

**Stats**
```http
GET /api/v2/admin/rental/items/stats
```
**Response:**
```json
{
  "data": {
    "total_items": 145,
    "available": 120,
    "rented": 25,
    "maintenance": 5,
    "total_value": "45000000.00",
    "revenue_this_month": "15000000.00"
  }
}
```

**Top Items**
```http
GET /api/v2/admin/rental/items/top-items
```
Query Params: `period` (7d, 30d, 90d), `limit` (default 10)

**Detail**
```http
GET /api/v2/admin/rental/items/{id}
```
Path `{id}` = slug atau ID.

**Create**
```http
POST /api/v2/admin/rental/items
```
**Body:**
```json
{
  "category_id": "uuid",
  "nama": "Sepeda Gunung Polygon Siskiu D5",
  "deskripsi": "Sepeda gunung 27.5 inch, cocok untuk trail",
  "harga_per_hari": 150000,
  "harga_per_jam": 25000,
  "harga_per_minggu": 900000,
  "deposit": 500000,
  "stok_total": 5,
  "spesifikasi": {
    "merek": "Polygon",
    "tipe": "Sepeda Gunung",
    "ukuran": "27.5 inch",
    "berat": "14.5 kg",
    "warna": "Hitam Merah",
    "tahun": 2023
  },
  "fasilitas": ["helm", "sarung_tangan", "pompa", "toolkit"],
  "syarat_sewa": [
    "KTP asli sebagai jaminan",
    "Minimal usia 17 tahun"
  ],
  "is_featured": true,
  "is_available": true
}
```

**Update**
```http
PUT /api/v2/admin/rental/items/{id}
```

**Delete**
```http
DELETE /api/v2/admin/rental/items/{id}
```

**Toggle Availability**
```http
POST /api/v2/admin/rental/items/{id}/toggle-availability
```

### 8.3 Media Item

**List Media**
```http
GET /api/v2/admin/rental/items/{itemId}/media
```

**Upload Media**
```http
POST /api/v2/admin/rental/items/{itemId}/media
```
**Body (multipart):**
```
media: <file>
caption: "Tampak depan"
is_primary: true
```

**Detail Media**
```http
GET /api/v2/admin/rental/items/media/{id}
```

**Set Primary**
```http
POST /api/v2/admin/rental/items/media/{id}/set-primary
```

**Delete Media**
```http
DELETE /api/v2/admin/rental/items/media/{id}
```

### 8.4 Booking

**List Booking**
```http
GET /api/v2/admin/rental/bookings
```
Query Params:
| Param | Tipe |
|---|---|
| status | enum |
| payment_status | enum |
| item_id | uuid |
| date_from | date |
| date_to | date |
| search | string (booking_code / nama customer) |

**Stats**
```http
GET /api/v2/admin/rental/bookings/stats
```
**Response:**
```json
{
  "data": {
    "total_bookings": 345,
    "bookings_today": 12,
    "pending_bookings": 8,
    "active_rentals": 25,
    "revenue_this_month": "45000000.00",
    "average_duration": 2.5
  }
}
```

**Upcoming**
```http
GET /api/v2/admin/rental/bookings/upcoming
```
Query Params: `days` (default 7)

**Detail**
```http
GET /api/v2/admin/rental/bookings/{booking}
```

**Update**
```http
PUT /api/v2/admin/rental/bookings/{booking}
```

**Delete**
```http
DELETE /api/v2/admin/rental/bookings/{booking}
```

**Mark as Paid**
```http
POST /api/v2/admin/rental/bookings/{id}/mark-paid
```

**Update Status**
```http
POST /api/v2/admin/rental/bookings/{id}/update-status
```
**Body:**
```json
{
  "status": "confirmed",
  "notes": "Konfirmasi via telepon"
}
```

**Convert to Rental**
```http
POST /api/v2/admin/rental/bookings/{id}/convert-to-rental
```
Fungsi: Convert booking → rental aktif (setelah customer ambil item).

**Response:**
```json
{
  "status": true,
  "message": "Booking berhasil dikonversi ke rental",
  "data": {
    "booking_code": "RNT-20260916-ABCD12",
    "rental_id": "uuid",
    "status": "active",
    "started_at": "2026-09-20T08:00:00Z"
  }
}
```

### 8.5 Rental Aktif

**List Rental**
```http
GET /api/v2/admin/rental/rentals
```
Query Params: `status`, `item_id`, `date_from`, `date_to`

**Stats**
```http
GET /api/v2/admin/rental/rentals/stats
```
**Response:**
```json
{
  "data": {
    "total_rentals": 890,
    "active": 25,
    "returned": 860,
    "late": 5,
    "revenue_this_month": "45000000.00"
  }
}
```

**Active Rentals**
```http
GET /api/v2/admin/rental/rentals/active
```

**Detail**
```http
GET /api/v2/admin/rental/rentals/{rental}
```

**Update**
```http
PUT /api/v2/admin/rental/rentals/{rental}
```

**Delete**
```http
DELETE /api/v2/admin/rental/rentals/{rental}
```

**Complete Rental**
```http
POST /api/v2/admin/rental/rentals/{id}/complete
```
**Body:**
```json
{
  "returned_at": "2026-09-22 17:30",
  "kondisi": "baik",
  "catatan": "Tidak ada kerusakan",
  "denda": 0
}
```

**Return Item**
```http
POST /api/v2/admin/rental/rentals/{id}/return-item
```
**Body:**
```json
{
  "kondisi": "rusak_ringan",
  "catatan": "Ada goresan di body",
  "denda": 50000,
  "foto": ["returns/damage-1.jpg"]
}
```

**Update Status**
```http
POST /api/v2/admin/rental/rentals/{id}/update-status
```
**Body:**
```json
{
  "status": "overdue",
  "notes": "Belum dikembalikan"
}
```

### 8.6 Maintenance Log

**List**
```http
GET /api/v2/admin/rental/maintenance-logs
```
Query Params: `item_id`, `status`, `date_from`, `date_to`

**Create**
```http
POST /api/v2/admin/rental/maintenance-logs
```
**Body:**
```json
{
  "item_id": "uuid",
  "jenis": "rutin",
  "deskripsi": "Servis rutin 3 bulan",
  "biaya": 150000,
  "tanggal_mulai": "2026-09-23",
  "tanggal_selesai": "2026-09-24",
  "vendor": "Bengkel Sepeda Jaya",
  "notes": "Ganti oli dan rantai"
}
```

**Detail / Update / Delete**
```http
GET    /api/v2/admin/rental/maintenance-logs/{maintenance_log}
PUT    /api/v2/admin/rental/maintenance-logs/{maintenance_log}
DELETE /api/v2/admin/rental/maintenance-logs/{maintenance_log}
```

**Update Status**
```http
POST /api/v2/admin/rental/maintenance-logs/{id}/update-status
```
**Body:**
```json
{
  "status": "selesai",
  "notes": "Item siap disewakan kembali"
}
```

### 8.7 Payment

**List Payment**
```http
GET /api/v2/admin/rental/payments
```
Query Params: `status`, `booking_id`, `date_from`, `date_to`

**Stats**
```http
GET /api/v2/admin/rental/payments/stats
```

**Detail**
```http
GET /api/v2/admin/rental/payments/{payment}
```

**Create**
```http
POST /api/v2/admin/rental/payments
```
**Body:**
```json
{
  "booking_id": "uuid",
  "amount": 950000,
  "payment_method": "transfer",
  "payment_channel": "bca",
  "notes": "Pembayaran manual"
}
```

**Update**
```http
PUT /api/v2/admin/rental/payments/{payment}
```

**Delete**
```http
DELETE /api/v2/admin/rental/payments/{payment}
```

**Mark Completed**
```http
POST /api/v2/admin/rental/payments/{id}/mark-completed
```

### 8.8 Review

**List Review**
```http
GET /api/v2/admin/rental/reviews
```
Query Params: `item_id`, `rating`, `is_active`, `page`, `per_page`

**Stats**
```http
GET /api/v2/admin/rental/reviews/stats
```
**Response:**
```json
{
  "data": {
    "total_reviews": 890,
    "average_rating": 4.6,
    "rating_breakdown": {
      "5": 500,
      "4": 250,
      "3": 100,
      "2": 30,
      "1": 10
    },
    "verified_reviews": 750
  }
}
```

**Detail / Create / Update / Delete**
```http
GET    /api/v2/admin/rental/reviews/{review}
POST   /api/v2/admin/rental/reviews
PUT    /api/v2/admin/rental/reviews/{review}
DELETE /api/v2/admin/rental/reviews/{review}
```

**Toggle Active**
```http
POST /api/v2/admin/rental/reviews/{id}/toggle-active
```

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
  "amount": 950000,
  "reference_id": "RNT-20260916-ABCD12",
  "sender_bank": "bca",
  "sender_name": "Budi Santoso",
  "payment_method": "qris"
}
```

**Efek:**
| Status | Aksi |
|---|---|
| SUCCESSFUL | Booking → paid, payment_status → paid, kirim notif |
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
| Item tidak tersedia | Item non-aktif |
| Stok item tidak mencukupi | Overbooking |
| Tanggal tidak valid | end_date < start_date |
| Jumlah melebihi batas (5 unit) | Business rule |
| Booking tidak dapat dibatalkan | Sudah aktif |
| Item belum dikembalikan | Return belum |
| Hanya bisa review setelah rental selesai | Booking belum completed |

## 11. Status Enum

### Booking Status
| Status | Label | Warna Badge |
|---|---|---|
| pending | Menunggu Pembayaran | bg-yellow-100 text-yellow-800 |
| paid | Sudah Dibayar | bg-blue-100 text-blue-800 |
| confirmed | Terkonfirmasi | bg-green-100 text-green-800 |
| active | Sedang Disewa | bg-indigo-100 text-indigo-800 |
| returned | Dikembalikan | bg-purple-100 text-purple-800 |
| completed | Selesai | bg-teal-100 text-teal-800 |
| cancelled | Dibatalkan | bg-red-100 text-red-800 |
| overdue | Terlambat | bg-orange-100 text-orange-800 |

### Payment Status
| Status | Label |
|---|---|
| unpaid | Belum Dibayar |
| paid | Sudah Dibayar |
| failed | Gagal |
| refunded | Direfund |

### Kondisi Item
| Kondisi | Label |
|---|---|
| baik | Baik (tidak ada kerusakan) |
| rusak_ringan | Rusak Ringan |
| rusak_berat | Rusak Berat |
| hilang | Hilang |

### Maintenance Status
| Status | Label |
|---|---|
| scheduled | Dijadwalkan |
| in_progress | Sedang Dikerjakan |
| selesai | Selesai |
| cancelled | Dibatalkan |

### Maintenance Type
| Type | Label |
|---|---|
| rutin | Perawatan Rutin |
| perbaikan | Perbaikan |
| penggantian | Penggantian Part |

## 12. Changelog
| Versi | Tanggal | Perubahan |
|---|---|---|
| 1.0 | 2025-01 | Rilis awal — item & kategori |
| 2.0 | 2026-05 | Tambah booking & rental |
| 2.1 | 2026-08 | Tambah maintenance log & payment |
| 2.2 | 2026-09-16 | Dokumentasi lengkap |

## 📎 Lampiran

### A. Alur Lengkap Customer
```
1. Customer lihat kategori
   GET /api/v2/public/rental/categories

2. Customer browse item
   GET /api/v2/public/rental/items?category_id=uuid

3. Customer lihat detail item
   GET /api/v2/public/rental/items/sepeda-polygon-siskiu-d5

4. Cek ketersediaan
   GET /api/v2/public/rental/items/{slug}/availability
     ?start_date=2026-09-20 08:00&end_date=2026-09-22 17:00

5. Customer login
   POST /api/v2/auth/login

6. Buat booking
   POST /api/v2/customer/rental/bookings
   { item_id, start_date, end_date, jumlah, metode_pengambilan, jaminan }
   → Response: booking_code

7. Bayar
   POST /api/v2/customer/rental/bookings/{code}/pay
   → Response: payment_url

8. Bayar di Flip (QR/VA/ewallet)

9. Flip kirim webhook
   POST /api/webhook/flip
   → Booking status: paid

10. Admin konfirmasi
    POST /api/v2/admin/rental/bookings/{id}/update-status
    { status: confirmed }

11. Customer ambil item di lokasi
    Admin: POST /api/v2/admin/rental/bookings/{id}/convert-to-rental
    → Rental aktif

12. Customer pakai item

13. Customer kembalikan item
    POST /api/v2/customer/rental/bookings/{code}/return
    { kondisi, catatan, foto }

14. Admin cek kondisi & complete
    POST /api/v2/admin/rental/rentals/{id}/complete
    { returned_at, kondisi, denda }

15. Customer review
    POST /api/v2/customer/rental/reviews
    { booking_id, rating, komentar }
```

### B. Alur Maintenance
```
1. Item dalam perbaikan
   POST /api/v2/admin/rental/maintenance-logs
   { item_id, jenis, deskripsi, biaya, tanggal_mulai }

2. Update progress
   POST /api/v2/admin/rental/maintenance-logs/{id}/update-status
   { status: in_progress }

3. Selesai
   POST /api/v2/admin/rental/maintenance-logs/{id}/update-status
   { status: selesai, notes: "Item siap disewakan" }

4. Item kembali available
   POST /api/v2/admin/rental/items/{id}/toggle-availability
```

### C. Contoh cURL Lengkap
```bash
# ═══ PUBLIC ═══════════════════════════════════════════════
# List kategori
curl -H "X-Client-ID: shop-web" \
     -H "X-Client-Secret: xxxxx" \
     "https://api.ovisito.com/api/v2/public/rental/categories"

# List item
curl -H "X-Client-ID: shop-web" \
     -H "X-Client-Secret: xxxxx" \
     "https://api.ovisito.com/api/v2/public/rental/items?category_id=uuid"

# Detail item
curl -H "X-Client-ID: shop-web" \
     -H "X-Client-Secret: xxxxx" \
     "https://api.ovisito.com/api/v2/public/rental/items/sepeda-polygon-siskiu-d5"

# Cek ketersediaan
curl -H "X-Client-ID: shop-web" \
     -H "X-Client-Secret: xxxxx" \
     "https://api.ovisito.com/api/v2/public/rental/items/{slug}/availability?start_date=2026-09-20 08:00&end_date=2026-09-22 17:00"

# ═══ CUSTOMER ═════════════════════════════════════════════
# Buat booking
curl -X POST \
     -H "X-Client-ID: shop-web" \
     -H "X-Client-Secret: xxxxx" \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"item_id":"uuid","start_date":"2026-09-20 08:00","end_date":"2026-09-22 17:00","jumlah":1,"metode_pengambilan":"pickup","jaminan":{"tipe":"ktp","nomor":"1101012000010001"}}' \
     "https://api.ovisito.com/api/v2/customer/rental/bookings"

# Return item
curl -X POST \
     -H "X-Client-ID: shop-web" \
     -H "X-Client-Secret: xxxxx" \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"kondisi":"baik","catatan":"Tidak ada kerusakan"}' \
     "https://api.ovisito.com/api/v2/customer/rental/bookings/RNT-XXX/return"

# ═══ ADMIN ════════════════════════════════════════════════
# List item
curl -H "X-Client-ID: admin-web" \
     -H "X-Client-Secret: xxxxx" \
     -H "Authorization: Bearer <admin_token>" \
     "https://api.ovisito.com/api/v2/admin/rental/items"

# Stats
curl -H "X-Client-ID: admin-web" \
     -H "X-Client-Secret: xxxxx" \
     -H "Authorization: Bearer <admin_token>" \
     "https://api.ovisito.com/api/v2/admin/rental/items/stats"

# Convert booking to rental
curl -X POST \
     -H "X-Client-ID: admin-web" \
     -H "X-Client-Secret: xxxxx" \
     -H "Authorization: Bearer <admin_token>" \
     "https://api.ovisito.com/api/v2/admin/rental/bookings/{id}/convert-to-rental"

# Return item (admin)
curl -X POST \
     -H "X-Client-ID: admin-web" \
     -H "X-Client-Secret: xxxxx" \
     -H "Authorization: Bearer <admin_token>" \
     -H "Content-Type: application/json" \
     -d '{"kondisi":"rusak_ringan","catatan":"Ada goresan","denda":50000}' \
     "https://api.ovisito.com/api/v2/admin/rental/rentals/{id}/return-item"
```

### D. Perbandingan dengan Modul Lain
| Aspek | Rental | Hotel | Transport | Marketplace |
|---|---|---|---|---|
| Merchant panel | ❌ Tidak ada | ❌ Tidak ada | ✅ Ada | ✅ Ada |
| Tipe durasi | Jam / Hari / Minggu | Per malam | Per jalan | Sekali kirim |
| Multi-item | ✅ Bisa (varian) | ❌ (1 kamar) | ✅ (N tiket) | ✅ (N produk) |
| Deposit | ✅ Ada | ❌ | ❌ | ❌ |
| Jaminan | ✅ KTP/SIM | ❌ | ❌ | ❌ |
| Return flow | ✅ Ada (pengembalian) | ❌ | ❌ | ❌ |
| Maintenance | ✅ Ada | ❌ | ❌ | ❌ |
| Kondisi barang | ✅ Baik/Rusak | ❌ | ❌ | ❌ |
| Denda | ✅ Ada | ❌ | ❌ | ❌ |

### E. TODO — Endpoint yang Belum Ada

**Public (perlu dibuat):**
- [ ] GET /public/rental/categories
- [ ] GET /public/rental/categories/{slug}
- [ ] GET /public/rental/items
- [ ] GET /public/rental/items/{slug}
- [ ] GET /public/rental/items/{slug}/availability

**Customer (perlu dibuat):**
- [ ] POST /customer/rental/bookings
- [ ] GET /customer/rental/bookings
- [ ] GET /customer/rental/bookings/{code}
- [ ] POST /customer/rental/bookings/{code}/pay
- [ ] POST /customer/rental/bookings/{code}/cancel
- [ ] POST /customer/rental/bookings/{code}/return
- [ ] POST /customer/rental/reviews

---
**Maintainer:** Tim Backend Ovisito
**Kontak:** backend@ovisito.com

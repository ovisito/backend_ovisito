# Ovisito MICE API v2

**File:** `docs/api/mice-api.md`
**Versi:** 2.2
**Terakhir diperbarui:** 2026-09-17

REST API untuk modul MICE (Meeting, Incentive, Convention, Exhibition).

## Daftar Isi

1. [Overview](#1-overview)
2. [Autentikasi](#2-autentikasi)
3. [Base URL & Header](#3-base-url--header)
4. [Format Response](#4-format-response)
5. [Rate Limiting](#5-rate-limiting)
6. [Endpoint — Public](#6-endpoint--public)
7. [Endpoint — Customer](#7-endpoint--customer)
8. [Endpoint — Admin](#8-endpoint--admin)
9. [Webhook](#9-webhook)
10. [Error Codes](#10-error-codes)
11. [Status Enum](#11-status-enum)
12. [Changelog](#12-changelog)

---

## 1. Overview

Modul MICE menyediakan API untuk:

- **Public** — katalog venue, vendor, paket MICE
- **Customer** — booking venue, paket MICE, event organizer
- **Admin** — kelola venue, vendor, paket, booking, review

### Aktor & Guard

| Aktor    | Guard          | Login Endpoint             |
|----------|----------------|-----------------------------|
| Customer | `auth:customer`   | `POST /api/v2/auth/login`       |
| Admin    | `auth:admin_api`  | `POST /api/v2/admin/login`      |

### Base Path

```
Production : https://api.ovisito.com
Sandbox    : https://staging.ovisito.com

Admin   : /api/v2/admin/mice/*
Public  : /api/v2/public/mice/*      (rekomendasi — perlu dibuat)
Customer: /api/v2/customer/mice/*    (rekomendasi — perlu dibuat)
```

### Model Namespace

```
App\Models\MiceAceh\*
```

---

## 2. Autentikasi

Setiap request melewati 2 layer autentikasi:

### Layer 1 — Client Auth (wajib semua endpoint)

| Header            | Wajib |
|--------------------|:-----:|
| `X-Client-ID`      | ✅ |
| `X-Client-Secret`  | ✅ |

### Layer 2 — Token User (untuk endpoint terproteksi)

| Header                          | Wajib |
|----------------------------------|:-----:|
| `Authorization: Bearer <token>` | ✅ |

---

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
curl -X GET "https://api.ovisito.com/api/v2/public/mice/venues" \
  -H "X-Client-ID: shop-web" \
  -H "X-Client-Secret: xxxxx"
```

---

## 4. Format Response

### Sukses

```json
{
  "status": true,
  "message": "Optional success message",
  "data": { }
}
```

### Pagination

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
  "message": "Pesan error",
  "errors": { "field": ["..."] }
}
```

---

## 5. Rate Limiting

| Endpoint Group | Limit         |
|-----------------|---------------|
| Public MICE     | 120 req/menit |
| Customer        | 120 req/menit |
| Admin           | 120 req/menit |

---

## 6. Endpoint — Public

**Base path:** `/api/v2/public/mice`
**Middleware:** `client.auth`, `throttle:120,1`

> ⚠️ Endpoint publik MICE belum tersedia. Rekomendasi di bawah perlu diimplementasi.

### 6.1 List Venue

```http
GET /api/v2/public/mice/venues
```

**Query Params:**

| Param              | Tipe    | Default |
|---------------------|---------|---------|
| `search`            | string  | —       |
| `kabupaten_kota_id` | int     | —       |
| `kapasitas`         | int     | —       |
| `tipe`               | enum    | `ballroom`, `meeting_room`, `convention_hall`, `outdoor` |
| `min_price`         | number  | —       |
| `max_price`         | number  | —       |
| `featured`          | boolean | —       |
| `sort`               | enum    | `popular` |
| `per_page`          | int     | 15      |

**Response:**

```json
{
  "current_page": 1,
  "data": [
    {
      "id": "uuid",
      "nama": "Hermes Convention Hall",
      "slug": "hermes-convention-hall",
      "tipe": "convention_hall",
      "tipe_label": "Convention Hall",
      "deskripsi": "Convention hall dengan kapasitas 1500 orang",
      "kabupaten_kota": { "id": 1, "nama": "Kota Banda Aceh" },
      "alamat": "Jl. Teuku Umar No. 1",
      "latitude": "5.54830000",
      "longitude": "95.32380000",
      "kapasitas_max": 1500,
      "kapasitas_ruangan": 8,
      "foto_utama": "mice/hermes/main.jpg",
      "foto_urls": ["mice/hermes/1.jpg", "mice/hermes/2.jpg"],
      "fasilitas": ["wifi", "ac", "sound_system", "projector", "catering", "parkir"],
      "harga_per_hari": "15000000.00",
      "harga_per_hari_formatted": "Rp 15.000.000",
      "rating_average": 4.8,
      "total_reviews": 45,
      "is_featured": true,
      "is_active": true
    }
  ]
}
```

### 6.2 Detail Venue

```http
GET /api/v2/public/mice/venues/{slug}
```

**Response:**

```json
{
  "data": {
    "id": "uuid",
    "nama": "Hermes Convention Hall",
    "slug": "hermes-convention-hall",
    "deskripsi": "...",
    "tipe": "convention_hall",
    "kapasitas_max": 1500,
    "kapasitas_ruangan": 8,
    "ruangan": [
      {
        "id": "uuid",
        "nama": "Grand Ballroom",
        "kapasitas": 800,
        "layout": ["theater", "classroom", "round_table", "u_shape"],
        "harga_per_hari": "10000000.00"
      },
      {
        "id": "uuid",
        "nama": "Meeting Room A",
        "kapasitas": 50,
        "layout": ["boardroom", "classroom"],
        "harga_per_hari": "2000000.00"
      }
    ],
    "fasilitas": ["wifi", "ac", "sound_system", "projector", "catering", "parkir"],
    "foto_urls": ["mice/hermes/1.jpg"],
    "kontak": {
      "phone": "0651-123456",
      "email": "info@hermes.com",
      "website": "https://hermes.com"
    },
    "rating_breakdown": {
      "fasilitas": 4.9,
      "kebersihan": 4.7,
      "pelayanan": 4.8,
      "harga": 4.6
    },
    "reviews": [ ... ]
  }
}
```

### 6.3 List Vendor

```http
GET /api/v2/public/mice/vendors
```

**Query Params:**

| Param                | Tipe   |
|------------------------|--------|
| `search`               | string |
| `tipe`                  | `catering`, `decoration`, `sound_system`, `photography`, `event_organizer`, `transport` |
| `kabupaten_kota_id`    | int    |

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "nama": "Aceh Catering Service",
      "slug": "aceh-catering-service",
      "tipe": "catering",
      "tipe_label": "Catering",
      "deskripsi": "Layanan catering untuk 100-2000 pax",
      "kabupaten_kota": { "id": 1, "nama": "Kota Banda Aceh" },
      "foto_url": "mice/vendors/catering.jpg",
      "harga_mulai": "50000.00",
      "harga_mulai_formatted": "Rp 50.000/pax",
      "rating_average": 4.7,
      "total_reviews": 120,
      "is_verified": true
    }
  ]
}
```

### 6.4 List Paket MICE

```http
GET /api/v2/public/mice/packages
```

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "nama": "Paket Meeting Full Day 50 Pax",
      "slug": "paket-meeting-full-day-50-pax",
      "deskripsi": "Paket meeting lengkap termasuk venue, catering, dan equipment",
      "tipe": "meeting",
      "kapasitas_min": 20,
      "kapasitas_max": 50,
      "durasi": "1 hari",
      "harga_per_pax": "350000.00",
      "harga_per_pax_formatted": "Rp 350.000/pax",
      "include": ["venue", "coffee_break", "lunch", "projector", "sound_system"],
      "foto_urls": [ ... ],
      "rating_average": 4.8
    }
  ]
}
```

---

## 7. Endpoint — Customer

**Base path:** `/api/v2/customer/mice`
**Middleware:** `client.auth`, `throttle:120,1`, `auth:customer`

> ⚠️ Endpoint customer MICE belum tersedia. Rekomendasi di bawah perlu diimplementasi.

### 7.1 Booking Venue

```http
POST /api/v2/customer/mice/bookings
```

**Body:**

```json
{
  "venue_id": "uuid",
  "room_id": "uuid",
  "event_name": "Seminat Nasional Teknologi",
  "event_type": "seminar",
  "start_date": "2026-10-15",
  "end_date": "2026-10-15",
  "start_time": "08:00",
  "end_time": "17:00",
  "num_participants": 200,
  "layout": "theater",
  "organizer_name": "Budi Santoso",
  "organizer_phone": "081234567890",
  "organizer_email": "budi@example.com",
  "special_request": "Butuh microphone tambahan"
}
```

**Validasi:**

| Field              | Wajib | Keterangan |
|---------------------|:-----:|------------|
| `venue_id`          | ✅ | ID venue |
| `room_id`           | ✅ | ID ruangan |
| `event_name`        | ✅ | Nama event |
| `event_type`        | ✅ | `seminar`, `workshop`, `conference`, `exhibition`, `gathering` |
| `start_date`        | ✅ | ≥ hari ini |
| `end_date`          | ✅ | ≥ `start_date` |
| `num_participants`  | ✅ | Max = kapasitas ruangan |
| `layout`            | ✅ | `theater`, `classroom`, `round_table`, `u_shape`, `boardroom` |

**Response 201:**

```json
{
  "status": true,
  "message": "Booking venue berhasil dibuat",
  "data": {
    "id": "uuid",
    "booking_code": "MICE-20260917-ABCD12",
    "status": "pending",
    "payment_status": "unpaid",
    "venue": { "id": "uuid", "nama": "Hermes Convention Hall" },
    "room": { "id": "uuid", "nama": "Grand Ballroom" },
    "event_name": "Seminat Nasional Teknologi",
    "start_date": "2026-10-15",
    "end_date": "2026-10-15",
    "num_participants": 200,
    "layout": "theater",
    "harga_per_hari": "10000000.00",
    "total_price": "10000000.00",
    "formatted_total": "Rp 10.000.000",
    "expired_at": "2026-09-17T11:00:00Z"
  }
}
```

### 7.2 List Booking Saya

```http
GET /api/v2/customer/mice/bookings
```

Query Params: `status`, `page`, `per_page`

### 7.3 Detail Booking

```http
GET /api/v2/customer/mice/bookings/{booking_code}
```

### 7.4 Bayar Booking

```http
POST /api/v2/customer/mice/bookings/{booking_code}/pay
```

Body: `{ "payment_method": "qris" }`

### 7.5 Cek Status Pembayaran

```http
GET /api/v2/customer/mice/bookings/{booking_code}/payment-status
```

### 7.6 Batalkan Booking

```http
POST /api/v2/customer/mice/bookings/{booking_code}/cancel
```

Body: `{ "reason": "Rencana berubah" }`

### 7.7 Booking Paket MICE

```http
POST /api/v2/customer/mice/package-bookings
```

**Body:**

```json
{
  "package_id": "uuid",
  "event_name": "Workshop Digital Marketing",
  "start_date": "2026-11-01",
  "num_participants": 40,
  "organizer_name": "Budi Santoso",
  "organizer_phone": "081234567890",
  "organizer_email": "budi@example.com",
  "special_request": "Vegetarian meal untuk 5 peserta"
}
```

### 7.8 List Booking Paket

```http
GET /api/v2/customer/mice/package-bookings
```

### 7.9 Buat Review

```http
POST /api/v2/customer/mice/reviews
```

**Body:**

```json
{
  "venue_id": "uuid",
  "booking_id": "uuid",
  "rating": 5,
  "komentar": "Venue sangat bagus, pelayanan ramah!",
  "aspects": {
    "fasilitas": 5,
    "kebersihan": 5,
    "pelayanan": 5,
    "harga": 4
  },
  "foto": ["reviews/hermes-1.jpg"]
}
```

Validasi: Booking harus `completed`.

---

## 8. Endpoint — Admin

**Base path:** `/api/v2/admin/mice`
**Middleware:** `client.auth`, `throttle:120,1`, `auth:admin_api`, `admin`

### 8.1 Venue

| Method | Endpoint                        | Fungsi              |
|--------|-----------------------------------|----------------------|
| GET    | `/venues`                         | List venue           |
| POST   | `/venues`                         | Buat venue           |
| GET    | `/venues/stats`                   | Statistik            |
| GET    | `/venues/top-venues`              | Top venue            |
| GET    | `/venues/{venue}`                 | Detail                |
| PUT    | `/venues/{venue}`                 | Update                |
| DELETE | `/venues/{venue}`                 | Hapus                 |
| POST   | `/venues/{id}/toggle-featured`    | Toggle unggulan      |
| POST   | `/venues/{id}/toggle-status`      | Toggle aktif          |

**POST Body:**

```json
{
  "nama": "Hermes Convention Hall",
  "slug": "hermes-convention-hall",
  "tipe": "convention_hall",
  "deskripsi": "Convention hall dengan kapasitas 1500 orang",
  "kabupaten_kota_id": 1,
  "kecamatan_id": 12,
  "alamat": "Jl. Teuku Umar No. 1",
  "latitude": 5.5483,
  "longitude": 95.3238,
  "kapasitas_max": 1500,
  "kapasitas_ruangan": 8,
  "phone": "0651-123456",
  "email": "info@hermes.com",
  "website": "https://hermes.com",
  "fasilitas": ["wifi", "ac", "sound_system", "projector", "catering", "parkir"],
  "is_featured": true,
  "is_active": true
}
```

### 8.2 Ruangan Venue

| Method | Endpoint                       |
|--------|-----------------------------------|
| GET    | `/venues/{venueId}/rooms`      |
| POST   | `/venues/{venueId}/rooms`      |
| GET    | `/rooms/{id}`                   |
| PUT    | `/rooms/{id}`                   |
| DELETE | `/rooms/{id}`                   |
| POST   | `/rooms/{id}/toggle-status`    |

**POST Body:**

```json
{
  "nama": "Grand Ballroom",
  "kapasitas": 800,
  "layout": ["theater", "classroom", "round_table", "u_shape"],
  "harga_per_hari": 10000000,
  "fasilitas": ["projector", "sound_system", "ac"],
  "foto_urls": ["venues/hermes/ballroom.jpg"],
  "is_active": true
}
```

### 8.3 Vendor

| Method | Endpoint                    |
|--------|--------------------------------|
| GET    | `/vendors`                    |
| POST   | `/vendors`                    |
| GET    | `/vendors/stats`             |
| GET    | `/vendors/{vendor}`          |
| PUT    | `/vendors/{vendor}`          |
| DELETE | `/vendors/{vendor}`          |
| POST   | `/vendors/{id}/toggle-status` |

**POST Body:**

```json
{
  "nama": "Aceh Catering Service",
  "slug": "aceh-catering-service",
  "tipe": "catering",
  "deskripsi": "Layanan catering untuk 100-2000 pax",
  "kabupaten_kota_id": 1,
  "phone": "0651-123456",
  "email": "info@acehcatering.com",
  "harga_mulai": 50000,
  "foto_url": "vendors/catering.jpg",
  "is_verified": true,
  "is_active": true
}
```

### 8.4 Paket MICE

| Method | Endpoint                      |
|--------|-----------------------------------|
| GET    | `/packages`                      |
| POST   | `/packages`                      |
| GET    | `/packages/stats`                |
| GET    | `/packages/{package}`            |
| PUT    | `/packages/{package}`            |
| DELETE | `/packages/{package}`            |
| POST   | `/packages/{id}/toggle-status`   |

**POST Body:**

```json
{
  "nama": "Paket Meeting Full Day 50 Pax",
  "slug": "paket-meeting-full-day-50-pax",
  "deskripsi": "Paket meeting lengkap termasuk venue, catering, dan equipment",
  "tipe": "meeting",
  "kapasitas_min": 20,
  "kapasitas_max": 50,
  "durasi": "1 hari",
  "harga_per_pax": 350000,
  "include": ["venue", "coffee_break", "lunch", "projector", "sound_system"],
  "is_active": true
}
```

### 8.5 Booking

| Method | Endpoint                        |
|--------|-------------------------------------|
| GET    | `/bookings`                        |
| POST   | `/bookings`                        |
| GET    | `/bookings/stats`                  |
| GET    | `/bookings/trends`                 |
| GET    | `/bookings/upcoming`               |
| GET    | `/bookings/{booking}`              |
| PUT    | `/bookings/{booking}`              |
| DELETE | `/bookings/{booking}`              |
| POST   | `/bookings/{id}/update-status`     |
| POST   | `/bookings/{id}/mark-paid`         |
| POST   | `/bookings/{id}/cancel`            |

### 8.6 Review

| Method | Endpoint                       |
|--------|------------------------------------|
| GET    | `/reviews`                        |
| POST   | `/reviews`                        |
| GET    | `/reviews/stats`                  |
| GET    | `/reviews/{review}`               |
| PUT    | `/reviews/{review}`               |
| DELETE | `/reviews/{review}`               |
| POST   | `/reviews/{id}/approve`           |
| POST   | `/reviews/{id}/reply`             |
| POST   | `/reviews/{id}/toggle-active`     |
| POST   | `/reviews/{id}/toggle-featured`   |

**POST Reply Body:**

```json
{
  "reply_content": "Terima kasih atas feedback Anda!"
}
```

---

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
  "amount": 10000000,
  "reference_id": "MICE-20260917-ABCD12",
  "sender_bank": "bca",
  "sender_name": "Budi Santoso",
  "payment_method": "qris"
}
```

**Efek:**

| Status       | Aksi |
|---------------|------|
| `SUCCESSFUL`  | Booking → `paid`, kirim konfirmasi via email |
| `FAILED`      | `payment_status` → `failed` |
| `EXPIRED`     | `payment_status` → `failed` |

---

## 10. Error Codes

| Code | Keterangan          |
|------|----------------------|
| 200  | Sukses                |
| 201  | Berhasil create        |
| 400  | Bad request           |
| 401  | Unauthenticated       |
| 403  | Forbidden              |
| 404  | Resource tidak ditemukan |
| 410  | Gone (kadaluarsa)      |
| 422  | Validasi gagal        |
| 429  | Rate limit             |
| 500  | Server error           |

### Pesan Error Umum

| Pesan                                             | Penyebab                        |
|-----------------------------------------------------|----------------------------------|
| `Client credentials required`                      | Header client tidak ada         |
| `Invalid client credentials`                       | Client ID/Secret salah          |
| `Unauthenticated.`                                  | Token tidak valid                |
| `Venue tidak tersedia`                              | Venue non-aktif                  |
| `Ruangan tidak tersedia pada tanggal tersebut`      | Overbooking                      |
| `Kapasitas melebihi batas ruangan`                  | > `kapasitas_max`               |
| `Tanggal tidak valid`                                | `end_date` < `start_date`       |
| `Booking tidak dapat dibatalkan`                    | Sudah lewat / event berjalan     |

---

## 11. Status Enum

### Booking Status

| Status      | Label                  | Warna           |
|-------------|--------------------------|------------------|
| `pending`   | Menunggu Pembayaran     | `bg-yellow-100` |
| `paid`      | Sudah Dibayar            | `bg-blue-100`   |
| `confirmed` | Terkonfirmasi             | `bg-green-100`  |
| `ongoing`   | Sedang Berlangsung       | `bg-indigo-100` |
| `completed` | Selesai                   | `bg-teal-100`   |
| `cancelled` | Dibatalkan                | `bg-red-100`    |
| `refunded`  | Direfund                  | `bg-orange-100` |

### Payment Status

| Status     | Label            |
|------------|-------------------|
| `unpaid`   | Belum Dibayar    |
| `paid`     | Sudah Dibayar    |
| `failed`   | Gagal             |
| `refunded` | Direfund          |

### Venue Type

| Tipe               | Label             |
|----------------------|--------------------|
| `ballroom`          | Ballroom           |
| `meeting_room`      | Meeting Room       |
| `convention_hall`   | Convention Hall    |
| `outdoor`            | Outdoor Venue      |

### Vendor Type

| Tipe               | Label            |
|----------------------|--------------------|
| `catering`          | Catering           |
| `decoration`        | Dekorasi           |
| `sound_system`      | Sound System       |
| `photography`       | Fotografi          |
| `event_organizer`   | Event Organizer    |
| `transport`          | Transportasi       |

### Package Type

| Tipe          | Label          |
|-----------------|------------------|
| `meeting`      | Meeting          |
| `incentive`     | Incentive        |
| `convention`   | Convention       |
| `exhibition`    | Exhibition       |

### Event Type

| Tipe          | Label       |
|-----------------|---------------|
| `seminar`      | Seminar       |
| `workshop`      | Workshop      |
| `conference`   | Konferensi    |
| `exhibition`    | Pameran       |
| `gathering`     | Gathering     |

### Layout Ruangan

| Layout        | Keterangan               |
|-----------------|-----------------------------|
| `theater`       | Theater (kursi berbaris)   |
| `classroom`     | Classroom (meja belajar)   |
| `round_table`   | Round Table (meja bundar)  |
| `u_shape`        | U-Shape                     |
| `boardroom`     | Boardroom                   |

---

## 12. Changelog

| Versi | Tanggal    | Perubahan                              |
|-------|------------|-------------------------------------------|
| 1.0   | 2025-03    | Rilis awal — venue & vendor              |
| 2.0   | 2026-04    | Tambah booking & packages                |
| 2.1   | 2026-07    | Tambah review & stats                    |
| 2.2   | 2026-09-17 | Dokumentasi lengkap                      |

---

## 📎 Lampiran

### A. Alur Lengkap Customer

```
1. Customer lihat venue
   GET /api/v2/public/mice/venues

2. Customer lihat detail venue
   GET /api/v2/public/mice/venues/hermes-convention-hall

3. Customer lihat vendor
   GET /api/v2/public/mice/vendors?tipe=catering

4. Customer lihat paket MICE
   GET /api/v2/public/mice/packages

5. Customer login
   POST /api/v2/auth/login

6. Customer booking venue
   POST /api/v2/customer/mice/bookings
   { venue_id, room_id, event_name, event_type, start_date, num_participants, layout, ... }
   → Response: booking_code

7. Customer bayar
   POST /api/v2/customer/mice/bookings/{code}/pay
   → Response: payment_url

8. Bayar di Flip

9. Flip kirim webhook
   POST /api/webhook/flip
   → Booking status: paid

10. Admin konfirmasi
    POST /api/v2/admin/mice/bookings/{id}/update-status
    { status: confirmed }

11. Event berjalan
    POST /api/v2/admin/mice/bookings/{id}/update-status
    { status: ongoing }

12. Event selesai
    POST /api/v2/admin/mice/bookings/{id}/update-status
    { status: completed }

13. Customer review
    POST /api/v2/customer/mice/reviews
    { venue_id, booking_id, rating, komentar }
```

### B. Contoh cURL Lengkap

```bash
# ═══ PUBLIC ═══════════════════════════════════════════════
# List venue
curl -H "X-Client-ID: shop-web" \
     -H "X-Client-Secret: xxxxx" \
     "https://api.ovisito.com/api/v2/public/mice/venues?kabupaten_kota_id=1"

# Detail venue
curl -H "X-Client-ID: shop-web" \
     -H "X-Client-Secret: xxxxx" \
     "https://api.ovisito.com/api/v2/public/mice/venues/hermes-convention-hall"

# List vendor
curl -H "X-Client-ID: shop-web" \
     -H "X-Client-Secret: xxxxx" \
     "https://api.ovisito.com/api/v2/public/mice/vendors?tipe=catering"

# List paket
curl -H "X-Client-ID: shop-web" \
     -H "X-Client-Secret: xxxxx" \
     "https://api.ovisito.com/api/v2/public/mice/packages"

# ═══ CUSTOMER ═════════════════════════════════════════════
# Booking venue
curl -X POST \
     -H "X-Client-ID: shop-web" \
     -H "X-Client-Secret: xxxxx" \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"venue_id":"uuid","room_id":"uuid","event_name":"Seminar","event_type":"seminar","start_date":"2026-10-15","end_date":"2026-10-15","num_participants":200,"layout":"theater","organizer_name":"Budi","organizer_phone":"08123","organizer_email":"budi@test.com"}' \
     "https://api.ovisito.com/api/v2/customer/mice/bookings"

# ═══ ADMIN ════════════════════════════════════════════════
# List semua venue
curl -H "X-Client-ID: admin-web" \
     -H "X-Client-Secret: xxxxx" \
     -H "Authorization: Bearer <admin_token>" \
     "https://api.ovisito.com/api/v2/admin/mice/venues"

# Stats venue
curl -H "X-Client-ID: admin-web" \
     -H "X-Client-Secret: xxxxx" \
     -H "Authorization: Bearer <admin_token>" \
     "https://api.ovisito.com/api/v2/admin/mice/venues/stats"

# Update status booking
curl -X POST \
     -H "X-Client-ID: admin-web" \
     -H "X-Client-Secret: xxxxx" \
     -H "Authorization: Bearer <admin_token>" \
     -H "Content-Type: application/json" \
     -d '{"status":"confirmed"}' \
     "https://api.ovisito.com/api/v2/admin/mice/bookings/{id}/update-status"

# Reply review
curl -X POST \
     -H "X-Client-ID: admin-web" \
     -H "X-Client-Secret: xxxxx" \
     -H "Authorization: Bearer <admin_token>" \
     -H "Content-Type: application/json" \
     -d '{"reply_content":"Terima kasih atas feedback Anda!"}' \
     "https://api.ovisito.com/api/v2/admin/mice/reviews/{id}/reply"
```

### C. Perbandingan dengan Modul Lain

| Aspek           | MICE          | Destinasi | Hotel      | Rental    |
|------------------|---------------|-----------|------------|-----------|
| Merchant panel   | ❌             | ❌         | ❌          | ❌         |
| Tipe booking     | Per event      | Per orang | Per kamar  | Per unit  |
| Multi-ruangan    | ✅             | ❌         | ✅          | ❌         |
| Vendor            | ✅ Ada         | ❌         | ❌          | ❌         |
| Kapasitas         | ✅ Ada         | ❌         | ✅          | ❌         |
| Layout            | ✅ Ada         | ❌         | ❌          | ❌         |
| Durasi            | Jam/Hari       | Hari      | Malam       | Jam/Hari  |

### D. TODO — Endpoint yang Belum Ada

**Public (perlu dibuat):**

- [ ] `GET /public/mice/venues`
- [ ] `GET /public/mice/venues/{slug}`
- [ ] `GET /public/mice/vendors`
- [ ] `GET /public/mice/packages`

**Customer (perlu dibuat):**

- [ ] `POST /customer/mice/bookings`
- [ ] `GET /customer/mice/bookings`
- [ ] `GET /customer/mice/bookings/{code}`
- [ ] `POST /customer/mice/bookings/{code}/pay`
- [ ] `POST /customer/mice/bookings/{code}/cancel`
- [ ] `POST /customer/mice/package-bookings`
- [ ] `POST /customer/mice/reviews`

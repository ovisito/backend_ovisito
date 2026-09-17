# Ovisito Event API v2

**File:** `docs/api/event-api.md`
**Versi:** 2.2
**Terakhir diperbarui:** 2026-09-17

REST API untuk modul Event (event, tiket event, booking, review).

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

Modul Event menyediakan API untuk:

- **Public** — katalog event, cari event, detail event, tiket
- **Customer** — beli tiket event, pembayaran, review
- **Admin** — kelola event, tiket, booking, review

### Aktor & Guard

| Aktor    | Guard             | Login Endpoint             |
|----------|--------------------|------------------------------|
| Customer | `auth:customer`    | `POST /api/v2/auth/login`       |
| Admin    | `auth:admin_api`   | `POST /api/v2/admin/login`      |

### Base Path

```
Production : https://api.ovisito.com
Sandbox    : https://staging.ovisito.com

Admin   : /api/v2/admin/event/*
Public  : /api/v2/public/event/*      (rekomendasi — perlu dibuat)
Customer: /api/v2/customer/event/*    (rekomendasi — perlu dibuat)
```

### Model Namespace

```
App\Models\EventAceh\*
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
curl -X GET "https://api.ovisito.com/api/v2/public/event/events" \
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
| Public event    | 120 req/menit |
| Customer        | 120 req/menit |
| Admin           | 120 req/menit |

---

## 6. Endpoint — Public

**Base path:** `/api/v2/public/event`
**Middleware:** `client.auth`, `throttle:120,1`

> ⚠️ Endpoint publik event belum tersedia. Rekomendasi di bawah perlu diimplementasi.

### 6.1 List Event ⭐

```http
GET /api/v2/public/event/events
```

**Query Params:**

| Param                | Tipe    | Default    | Keterangan             |
|------------------------|---------|------------|---------------------------|
| `search`               | string  | —          | Cari nama event           |
| `kategori_id`          | int     | —          | Filter kategori           |
| `kabupaten_kota_id`   | int     | —          | Filter lokasi              |
| `date_from`            | date    | —          | Filter tanggal mulai      |
| `date_to`              | date    | —          | Filter tanggal akhir       |
| `status`                | enum    | `upcoming` | `upcoming`, `ongoing`, `past` |
| `min_price`            | number  | —          | Harga tiket minimum       |
| `max_price`            | number  | —          | Harga tiket maksimum      |
| `featured`             | boolean | —          | Event unggulan             |
| `sort`                  | enum    | `soonest`  | `soonest`, `popular`, `price_asc`, `price_desc` |
| `page`                  | int     | 1          |                             |
| `per_page`             | int     | 15         |                             |

**Request:**

```bash
GET /api/v2/public/event/events?kabupaten_kota_id=1&status=upcoming&featured=true
```

**Response:**

```json
{
  "current_page": 1,
  "data": [
    {
      "id": "uuid",
      "nama": "Aceh Cultural Festival 2026",
      "slug": "aceh-cultural-festival-2026",
      "deskripsi": "Festival budaya Aceh dengan berbagai pertunjukan",
      "kategori": { "id": 1, "nama": "Budaya", "slug": "budaya" },
      "kabupaten_kota": { "id": 1, "nama": "Kota Banda Aceh" },
      "venue_name": "Taman Ratu Safiatuddin",
      "alamat": "Jl. Teuku Umar, Banda Aceh",
      "latitude": "5.54830000",
      "longitude": "95.32380000",
      "start_datetime": "2026-10-15T09:00:00Z",
      "end_datetime": "2026-10-17T22:00:00Z",
      "is_multi_day": true,
      "foto_utama": "events/cultural-festival/main.jpg",
      "foto_urls": ["events/cultural-festival/1.jpg"],
      "harga_mulai": "50000.00",
      "harga_mulai_formatted": "Rp 50.000",
      "total_tiket_tersedia": 500,
      "rating_average": 4.8,
      "total_reviews": 120,
      "is_featured": true,
      "is_active": true,
      "status": "upcoming",
      "formatted_status": "Akan Datang"
    }
  ],
  "per_page": 15,
  "total": 45,
  "last_page": 3
}
```

### 6.2 Detail Event

```http
GET /api/v2/public/event/events/{slug}
```

**Response:**

```json
{
  "data": {
    "id": "uuid",
    "nama": "Aceh Cultural Festival 2026",
    "slug": "aceh-cultural-festival-2026",
    "deskripsi": "...",
    "deskripsi_lengkap": "...",
    "kategori": { ... },
    "kabupaten_kota": { ... },
    "venue_name": "Taman Ratu Safiatuddin",
    "alamat": "...",
    "latitude": "...",
    "longitude": "...",
    "start_datetime": "2026-10-15T09:00:00Z",
    "end_datetime": "2026-10-17T22:00:00Z",
    "is_multi_day": true,
    "foto_urls": [ ... ],
    "lineup": [
      { "nama": "Rencong Dance", "jam": "10:00" },
      { "nama": "Aceh Rap Concert", "jam": "19:00" }
    ],
    "fasilitas": ["parkir", "toilet", "musholla", "food_court"],
    "syarat_ketentuan": [
      "Wajib membawa KTP",
      "Dilarang membawa senjata tajam"
    ],
    "tiket_types": [
      {
        "id": "uuid",
        "nama": "Regular",
        "harga": "50000.00",
        "harga_formatted": "Rp 50.000",
        "kuota": 300,
        "tersisa": 150,
        "is_available": true
      },
      {
        "id": "uuid",
        "nama": "VIP",
        "harga": "150000.00",
        "harga_formatted": "Rp 150.000",
        "kuota": 100,
        "tersisa": 45,
        "is_available": true
      }
    ],
    "harga_mulai": "50000.00",
    "rating_average": 4.8,
    "rating_breakdown": {
      "kualitas_event": 4.9,
      "organisasi": 4.7,
      "fasilitas": 4.6,
      "harga": 4.8
    },
    "reviews": [ ... ]
  }
}
```

### 6.3 List Kategori Event

```http
GET /api/v2/public/event/kategori
```

**Response:**

```json
{
  "data": [
    { "id": 1, "nama": "Budaya", "slug": "budaya", "icon": "🎭", "total": 15 },
    { "id": 2, "nama": "Musik", "slug": "musik", "icon": "🎵", "total": 20 },
    { "id": 3, "nama": "Olahraga", "slug": "olahraga", "icon": "⚽", "total": 12 },
    { "id": 4, "nama": "Pameran", "slug": "pameran", "icon": "🎨", "total": 8 }
  ]
}
```

### 6.4 Event Terdekat (Upcoming)

```http
GET /api/v2/public/event/upcoming?limit=5
```

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "nama": "Aceh Cultural Festival 2026",
      "start_datetime": "2026-10-15T09:00:00Z",
      "days_until": 28,
      "venue_name": "Taman Ratu Safiatuddin",
      "harga_mulai": "50000.00"
    }
  ]
}
```

### 6.5 Cek Ketersediaan Tiket

```http
GET /api/v2/public/event/events/{slug}/availability
```

Query Params: `ticket_type_id`, `quantity`

**Response:**

```json
{
  "status": true,
  "data": {
    "event_id": "uuid",
    "ticket_type": { "id": "uuid", "nama": "Regular", "harga": "50000.00" },
    "quantity": 2,
    "subtotal": "100000.00",
    "biaya_layanan": "5000.00",
    "total": "105000.00",
    "tersisa": 150,
    "is_available": true
  }
}
```

---

## 7. Endpoint — Customer

**Base path:** `/api/v2/customer/event`
**Middleware:** `client.auth`, `throttle:120,1`, `auth:customer`

> ⚠️ Endpoint customer event belum tersedia. Rekomendasi di bawah perlu diimplementasi.

### 7.1 Beli Tiket Event

```http
POST /api/v2/customer/event/bookings
```

**Body:**

```json
{
  "event_id": "uuid",
  "ticket_type_id": "uuid",
  "quantity": 2,
  "attendees": [
    { "nama": "Budi Santoso", "email": "budi@example.com", "phone": "081234567890", "id_number": "110101..." },
    { "nama": "Ani Lestari",  "email": "ani@example.com",  "phone": "081234567891", "id_number": "110101..." }
  ],
  "notes": "Butuh kursi dekat panggung"
}
```

**Validasi:**

| Field                   | Wajib | Keterangan                          |
|---------------------------|:-----:|----------------------------------------|
| `event_id`                | ✅ | ID event                                |
| `ticket_type_id`          | ✅ | ID tipe tiket                          |
| `quantity`                | ✅ | 1–10, tidak boleh > tersisa            |
| `attendees`               | ✅ | Array (jumlah = `quantity`)            |
| `attendees.*.nama`       | ✅ | Nama peserta                            |
| `attendees.*.email`      | —  | Untuk e-ticket                          |
| `attendees.*.phone`      | —  |                                          |

**Response 201:**

```json
{
  "status": true,
  "message": "Booking tiket berhasil",
  "data": {
    "id": "uuid",
    "booking_code": "EVT-20260917-ABCD12",
    "status": "pending",
    "payment_status": "unpaid",
    "event": { "id": "uuid", "nama": "Aceh Cultural Festival 2026" },
    "ticket_type": { "id": "uuid", "nama": "Regular", "harga": "50000.00" },
    "quantity": 2,
    "subtotal": "100000.00",
    "biaya_layanan": "5000.00",
    "total_price": "105000.00",
    "formatted_total": "Rp 105.000",
    "tickets": [
      { "ticket_code": "TKT-EVT-001", "attendee_name": "Budi Santoso" },
      { "ticket_code": "TKT-EVT-002", "attendee_name": "Ani Lestari" }
    ],
    "expired_at": "2026-09-17T11:00:00Z"
  }
}
```

**Error 422:**

```json
{ "status": false, "message": "Tiket tidak mencukupi. Tersisa 1 tiket." }
```

### 7.2 List Booking Saya

```http
GET /api/v2/customer/event/bookings
```

Query Params: `status`, `page`, `per_page`

### 7.3 Detail Booking

```http
GET /api/v2/customer/event/bookings/{booking_code}
```

**Response:**

```json
{
  "data": {
    "id": "uuid",
    "booking_code": "EVT-20260917-ABCD12",
    "status": "paid",
    "payment_status": "paid",
    "event": {
      "id": "uuid",
      "nama": "Aceh Cultural Festival 2026",
      "start_datetime": "2026-10-15T09:00:00Z",
      "end_datetime": "2026-10-17T22:00:00Z",
      "venue_name": "Taman Ratu Safiatuddin",
      "alamat": "..."
    },
    "ticket_type": { "nama": "Regular", "harga": "50000.00" },
    "quantity": 2,
    "total_price": "105000.00",
    "tickets": [
      { "ticket_code": "TKT-EVT-001", "qr_code": "QR-...", "attendee_name": "Budi", "status": "active" },
      { "ticket_code": "TKT-EVT-002", "qr_code": "QR-...", "attendee_name": "Ani",  "status": "active" }
    ],
    "paid_at": "2026-09-17T10:45:00Z",
    "booked_at": "2026-09-17T10:30:00Z"
  }
}
```

### 7.4 Bayar Booking

```http
POST /api/v2/customer/event/bookings/{booking_code}/pay
```

Body: `{ "payment_method": "qris" }`

**Response:**

```json
{
  "status": true,
  "data": {
    "payment_url": "https://flip.id/pay/xxxxx",
    "qr_url": "https://api.flip.id/qr/xxxxx",
    "bill_id": "12345",
    "expired_at": "2026-09-18T10:30:00Z"
  }
}
```

### 7.5 Cek Status Pembayaran

```http
GET /api/v2/customer/event/bookings/{booking_code}/payment-status
```

### 7.6 Batalkan Booking

```http
POST /api/v2/customer/event/bookings/{booking_code}/cancel
```

Body: `{ "reason": "Rencana berubah" }`

### 7.7 Unduh E-Ticket

```http
GET /api/v2/customer/event/bookings/{booking_code}/ticket
```

Response: `Content-Type: application/pdf` — binary

### 7.8 Buat Review

```http
POST /api/v2/customer/event/reviews
```

**Body:**

```json
{
  "event_id": "uuid",
  "booking_id": "uuid",
  "rating": 5,
  "komentar": "Event sangat meriah dan terorganisir!",
  "aspects": {
    "kualitas_event": 5,
    "organisasi": 5,
    "fasilitas": 4,
    "harga": 5
  },
  "foto": ["reviews/event-1.jpg"]
}
```

**Validasi:**

- Booking harus `completed` (event sudah selesai)
- 1 booking = 1 review

---

## 8. Endpoint — Admin

**Base path:** `/api/v2/admin/event`
**Middleware:** `client.auth`, `throttle:120,1`, `auth:admin_api`, `admin`

### 8.1 Event

| Method | Endpoint                          | Fungsi              |
|--------|--------------------------------------|----------------------|
| GET    | `/events`                           | List event            |
| POST   | `/events`                           | Buat event            |
| GET    | `/events/stats`                     | Statistik             |
| GET    | `/events/quick-stats`               | Quick stats           |
| GET    | `/events/top-events`                | Top event              |
| GET    | `/events/{event}`                   | Detail                 |
| PUT    | `/events/{event}`                   | Update                 |
| DELETE | `/events/{event}`                   | Hapus                  |
| POST   | `/events/{id}/publish`              | Publish event         |
| POST   | `/events/{id}/toggle-featured`      | Toggle unggulan       |
| POST   | `/events/{id}/toggle-status`        | Toggle aktif           |

**POST Body:**

```json
{
  "nama": "Aceh Cultural Festival 2026",
  "slug": "aceh-cultural-festival-2026",
  "deskripsi": "Festival budaya Aceh...",
  "deskripsi_lengkap": "...",
  "kategori_id": 1,
  "kabupaten_kota_id": 1,
  "kecamatan_id": 12,
  "venue_name": "Taman Ratu Safiatuddin",
  "alamat": "Jl. Teuku Umar, Banda Aceh",
  "latitude": 5.5483,
  "longitude": 95.3238,
  "start_datetime": "2026-10-15 09:00:00",
  "end_datetime": "2026-10-17 22:00:00",
  "is_multi_day": true,
  "fasilitas": ["parkir", "toilet", "musholla", "food_court"],
  "syarat_ketentuan": ["Wajib membawa KTP"],
  "lineup": [
    { "nama": "Rencong Dance", "jam": "10:00" }
  ],
  "is_featured": true,
  "is_active": true
}
```

### 8.2 Tipe Tiket Event

| Method | Endpoint                                              |
|--------|----------------------------------------------------------|
| GET    | `/event/tickets` (atau `/events/{eventId}/tickets`)   |
| POST   | `/event/tickets`                                        |
| GET    | `/event/tickets/stats`                                  |
| GET    | `/event/tickets/{ticket}`                                |
| PUT    | `/event/tickets/{ticket}`                                |
| DELETE | `/event/tickets/{ticket}`                                |
| POST   | `/event/tickets/{id}/toggle-status`                     |

**POST Body:**

```json
{
  "event_id": "uuid",
  "nama": "Regular",
  "deskripsi": "Tiket masuk reguler",
  "harga": 50000,
  "kuota": 300,
  "max_per_transaction": 5,
  "sale_start": "2026-09-01 00:00:00",
  "sale_end": "2026-10-14 23:59:59",
  "is_active": true
}
```

### 8.3 Booking Event

| Method | Endpoint                            |
|--------|-----------------------------------------|
| GET    | `/event/bookings`                       |
| POST   | `/event/bookings`                       |
| GET    | `/event/bookings/stats`                 |
| GET    | `/event/bookings/trends`                |
| GET    | `/event/bookings/{booking}`             |
| PUT    | `/event/bookings/{booking}`             |
| DELETE | `/event/bookings/{booking}`             |
| POST   | `/event/bookings/{id}/confirm`         |
| POST   | `/event/bookings/{id}/mark-paid`       |
| POST   | `/event/bookings/{id}/cancel`          |
| POST   | `/event/bookings/{id}/update-status`   |

**Update Status Body:**

```json
{
  "status": "confirmed",
  "notes": "Konfirmasi via telepon"
}
```

### 8.4 Review Event

| Method | Endpoint                              |
|--------|--------------------------------------------|
| GET    | `/event/reviews`                           |
| POST   | `/event/reviews`                           |
| GET    | `/event/reviews/stats`                     |
| GET    | `/event/reviews/{review}`                  |
| PUT    | `/event/reviews/{review}`                  |
| DELETE | `/event/reviews/{review}`                  |
| POST   | `/event/reviews/{id}/approve`             |
| POST   | `/event/reviews/{id}/reply`               |
| POST   | `/event/reviews/{id}/toggle-active`       |
| POST   | `/event/reviews/{id}/toggle-featured`     |

**Reply Body:**

```json
{ "reply_content": "Terima kasih atas feedback Anda!" }
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
  "amount": 105000,
  "reference_id": "EVT-20260917-ABCD12",
  "sender_bank": "bca",
  "sender_name": "Budi Santoso",
  "payment_method": "qris"
}
```

**Efek:**

| Status       | Aksi |
|---------------|------|
| `SUCCESSFUL`  | Booking → `paid`, tiket aktif, kirim e-ticket via email |
| `FAILED`      | `payment_status` → `failed` |
| `EXPIRED`     | `payment_status` → `failed` |

---

## 10. Error Codes

| Code | Keterangan          |
|------|-----------------------|
| 200  | Sukses                 |
| 201  | Berhasil create        |
| 400  | Bad request            |
| 401  | Unauthenticated        |
| 403  | Forbidden               |
| 404  | Resource tidak ditemukan |
| 410  | Gone (kadaluarsa)       |
| 422  | Validasi gagal         |
| 429  | Rate limit              |
| 500  | Server error            |

### Pesan Error Umum

| Pesan                                             | Penyebab                        |
|------------------------------------------------------|------------------------------------|
| `Client credentials required`                       | Header client tidak ada           |
| `Invalid client credentials`                        | Client ID/Secret salah            |
| `Unauthenticated.`                                   | Token tidak valid                  |
| `Event tidak tersedia`                               | Event non-aktif                    |
| `Tiket tidak mencukupi`                              | Sisa tiket < quantity             |
| `Penjualan tiket belum dibuka`                       | Sale belum mulai                  |
| `Penjualan tiket sudah ditutup`                      | Sale sudah lewat                   |
| `Maksimal X tiket per transaksi`                     | Business rule                      |
| `Booking tidak dapat dibatalkan`                     | Event sudah berlangsung           |
| `Hanya bisa review setelah event selesai`            | Event belum selesai               |

---

## 11. Status Enum

### Event Status

| Status       | Label                  | Warna           |
|---------------|--------------------------|------------------|
| `draft`       | Draft                    | `bg-gray-100`   |
| `published`   | Dipublikasikan           | `bg-blue-100`   |
| `upcoming`    | Akan Datang              | `bg-yellow-100` |
| `ongoing`     | Sedang Berlangsung       | `bg-green-100`  |
| `completed`   | Selesai                  | `bg-teal-100`   |
| `cancelled`   | Dibatalkan                | `bg-red-100`    |

### Booking Status

| Status      | Label                  |
|-------------|--------------------------|
| `pending`   | Menunggu Pembayaran     |
| `paid`      | Sudah Dibayar            |
| `confirmed` | Terkonfirmasi             |
| `used`      | Sudah Digunakan          |
| `completed` | Selesai                   |
| `cancelled` | Dibatalkan                |
| `refunded`  | Direfund                  |

### Payment Status

| Status     | Label            |
|------------|--------------------|
| `unpaid`   | Belum Dibayar     |
| `paid`     | Sudah Dibayar     |
| `failed`   | Gagal              |
| `refunded` | Direfund           |

### Ticket Status

| Status      | Label            |
|-------------|--------------------|
| `active`    | Aktif              |
| `used`      | Sudah Digunakan   |
| `cancelled` | Dibatalkan         |

### Kategori Event

| Kategori   | Icon |
|-------------|------|
| Budaya      | 🎭   |
| Musik       | 🎵   |
| Olahraga    | ⚽   |
| Pameran     | 🎨   |
| Seminar     | 🎤   |
| Workshop    | 🔧   |
| Festival    | 🎉   |
| Kompetisi   | 🏆   |

---

## 12. Changelog

| Versi | Tanggal    | Perubahan                            |
|-------|------------|------------------------------------------|
| 1.0   | 2025-03    | Rilis awal — event & tiket               |
| 2.0   | 2026-04    | Tambah booking & payment                |
| 2.1   | 2026-07    | Tambah review & stats                    |
| 2.2   | 2026-09-17 | Dokumentasi lengkap                      |

---

## 📎 Lampiran

### A. Alur Lengkap Customer

```
1. Customer lihat event
   GET /api/v2/public/event/events?status=upcoming

2. Customer lihat detail event
   GET /api/v2/public/event/events/aceh-cultural-festival-2026

3. Customer cek ketersediaan tiket
   GET /api/v2/public/event/events/{slug}/availability
     ?ticket_type_id=uuid&quantity=2

4. Customer login
   POST /api/v2/auth/login

5. Customer beli tiket
   POST /api/v2/customer/event/bookings
   { event_id, ticket_type_id, quantity, attendees }
   → Response: booking_code + tiket codes

6. Customer bayar
   POST /api/v2/customer/event/bookings/{code}/pay
   → Response: payment_url

7. Bayar di Flip

8. Flip kirim webhook
   POST /api/webhook/flip
   → Booking status: paid, tiket aktif

9. Customer unduh e-ticket
   GET /api/v2/customer/event/bookings/{code}/ticket

10. Customer datang ke event
    Tunjukkan e-ticket + QR code ke petugas

11. Event selesai
    Admin: POST /api/v2/admin/event/bookings/{id}/update-status
    { status: completed }

12. Customer review
    POST /api/v2/customer/event/reviews
    { event_id, booking_id, rating, komentar }
```

### B. Contoh cURL Lengkap

```bash
# ═══ PUBLIC ═══════════════════════════════════════════════
# List event
curl -H "X-Client-ID: shop-web" \
     -H "X-Client-Secret: xxxxx" \
     "https://api.ovisito.com/api/v2/public/event/events?status=upcoming"

# Detail event
curl -H "X-Client-ID: shop-web" \
     -H "X-Client-Secret: xxxxx" \
     "https://api.ovisito.com/api/v2/public/event/events/aceh-cultural-festival-2026"

# Cek ketersediaan tiket
curl -H "X-Client-ID: shop-web" \
     -H "X-Client-Secret: xxxxx" \
     "https://api.ovisito.com/api/v2/public/event/events/{slug}/availability?ticket_type_id=uuid&quantity=2"

# Event terdekat
curl -H "X-Client-ID: shop-web" \
     -H "X-Client-Secret: xxxxx" \
     "https://api.ovisito.com/api/v2/public/event/upcoming?limit=5"

# ═══ CUSTOMER ═════════════════════════════════════════════
# Beli tiket
curl -X POST \
     -H "X-Client-ID: shop-web" \
     -H "X-Client-Secret: xxxxx" \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"event_id":"uuid","ticket_type_id":"uuid","quantity":2,"attendees":[{"nama":"Budi","email":"budi@test.com","phone":"08123"},{"nama":"Ani","email":"ani@test.com","phone":"08124"}]}' \
     "https://api.ovisito.com/api/v2/customer/event/bookings"

# Bayar
curl -X POST \
     -H "X-Client-ID: shop-web" \
     -H "X-Client-Secret: xxxxx" \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"payment_method":"qris"}' \
     "https://api.ovisito.com/api/v2/customer/event/bookings/EVT-XXX/pay"

# ═══ ADMIN ════════════════════════════════════════════════
# List semua event
curl -H "X-Client-ID: admin-web" \
     -H "X-Client-Secret: xxxxx" \
     -H "Authorization: Bearer <admin_token>" \
     "https://api.ovisito.com/api/v2/admin/event/events"

# Stats event
curl -H "X-Client-ID: admin-web" \
     -H "X-Client-Secret: xxxxx" \
     -H "Authorization: Bearer <admin_token>" \
     "https://api.ovisito.com/api/v2/admin/event/events/stats"

# Publish event
curl -X POST \
     -H "X-Client-ID: admin-web" \
     -H "X-Client-Secret: xxxxx" \
     -H "Authorization: Bearer <admin_token>" \
     "https://api.ovisito.com/api/v2/admin/event/events/{id}/publish"

# Update status booking
curl -X POST \
     -H "X-Client-ID: admin-web" \
     -H "X-Client-Secret: xxxxx" \
     -H "Authorization: Bearer <admin_token>" \
     -H "Content-Type: application/json" \
     -d '{"status":"confirmed"}' \
     "https://api.ovisito.com/api/v2/admin/event/bookings/{id}/update-status"
```

### C. Perbandingan dengan Modul Lain

| Aspek           | Event      | Destinasi | MICE        | Transport |
|------------------|------------|-----------|-------------|-----------|
| Merchant panel   | ❌          | ❌         | ❌           | ✅         |
| Tipe tiket       | Multiple   | Multiple  | Per ruangan | Per orang |
| Multi-day        | ✅          | ❌         | ✅           | ❌         |
| Lineup            | ✅          | ❌         | ❌           | ❌         |
| Kapasitas         | ✅          | ❌         | ✅           | ✅         |
| Venue             | Nama bebas | Tetap     | Ruangan     | Terminal  |
| E-ticket          | ✅          | ✅         | ❌           | ✅         |

### D. TODO — Endpoint yang Belum Ada

**Public (perlu dibuat):**

- [ ] `GET /public/event/events`
- [ ] `GET /public/event/events/{slug}`
- [ ] `GET /public/event/kategori`
- [ ] `GET /public/event/upcoming`
- [ ] `GET /public/event/events/{slug}/availability`

**Customer (perlu dibuat):**

- [ ] `POST /customer/event/bookings`
- [ ] `GET /customer/event/bookings`
- [ ] `GET /customer/event/bookings/{code}`
- [ ] `POST /customer/event/bookings/{code}/pay`
- [ ] `POST /customer/event/bookings/{code}/cancel`
- [ ] `GET /customer/event/bookings/{code}/ticket`
- [ ] `POST /customer/event/reviews`

---

**Maintainer:** Tim Backend Ovisito
**Kontak:** backend@ovisito.com

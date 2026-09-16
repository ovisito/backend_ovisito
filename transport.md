# Ovisito Transport API

**REST API Documentation · Modul Transport**

REST API untuk modul transportasi bus (tiket, jadwal, booking, check-in).

| | |
|---|---|
| **File** | `docs/api/transport-api.md` |
| **Versi** | 2.2 |
| **Terakhir Diperbarui** | 16 September 2026 |
| **Maintainer** | Tim Backend Ovisito |
| **Kontak** | backend@ovisito.com |
| **Base URL (Production)** | `https://api.ovisito.com` |
| **Base URL (Sandbox)** | `https://staging.ovisito.com` |

---

## Daftar Isi

1. [Overview](#1-overview)
2. [Autentikasi](#2-autentikasi)
3. [Base URL & Header](#3-base-url--header)
4. [Format Response](#4-format-response)
5. [Rate Limiting](#5-rate-limiting)
6. [Endpoint — Public](#6-endpoint--public)
7. [Endpoint — Customer](#7-endpoint--customer)
8. [Endpoint — Merchant](#8-endpoint--merchant)
9. [Endpoint — Admin](#9-endpoint--admin)
10. [Webhook](#10-webhook)
11. [Error Codes](#11-error-codes)
12. [Changelog](#12-changelog)
13. [Lampiran](#lampiran)

---

## 1. Overview

Modul Transport menyediakan API untuk:

| Aktor | Cakupan |
|---|---|
| **Public** | Cari jadwal bus, lihat operator & terminal, verifikasi tiket |
| **Customer** | Booking tiket, pembayaran, unduh e-ticket |
| **Merchant** | Kelola armada, jadwal, rute, terminal, pesanan, check-in |
| **Admin** | Kelola semua master data, verifikasi operator, check-in |

### Aktor & Guard

| Aktor | Guard | Login Endpoint |
|---|---|---|
| Customer | `auth:customer` | `POST /api/v2/auth/login` |
| Merchant | `auth:merchant_api` | `POST /api/v2/merchant/login` |
| Admin | `auth:admin_api` | `POST /api/v2/admin/login` |

---

## 2. Autentikasi

Setiap request melewati **2 layer** autentikasi.

### Layer 1 — Client Auth *(wajib semua endpoint)*

Identifikasi aplikasi yang mengakses API.

| Header | Wajib | Keterangan |
|---|---|---|
| `X-Client-ID` | ✅ | ID aplikasi |
| `X-Client-Secret` | ✅ | Secret aplikasi |

**Client ID yang tersedia**

| Client ID | Untuk |
|---|---|
| `shop-web` | Shop frontend |
| `merchant-web` | Merchant dashboard |
| `admin-web` | Admin panel |
| `mobile-app` | Mobile app |

### Layer 2 — Token User *(untuk endpoint terproteksi)*

Setelah login, gunakan Bearer token.

| Header | Wajib |
|---|---|
| `Authorization: Bearer <token>` | ✅ |

---

## 3. Base URL & Header

### Base URL

```
Production : https://api.ovisito.com
Sandbox    : https://staging.ovisito.com
```

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
curl -X GET "https://api.ovisito.com/api/v2/public/transport/schedules" \
  -H "X-Client-ID: shop-web" \
  -H "X-Client-Secret: xxxxx" \
  -H "Accept: application/json"
```

---

## 4. Format Response

### Sukses

```json
{
  "status": true,
  "message": "Optional success message",
  "data": {
    "...": "..."
  }
}
```

### Sukses dengan Pagination

```json
{
  "status": true,
  "data": {
    "current_page": 1,
    "data": [ "..." ],
    "per_page": 15,
    "total": 120,
    "last_page": 8
  }
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

---

## 5. Rate Limiting

| Endpoint Group | Limit |
|---|---|
| Public transport | 60 req/menit |
| Customer, Merchant, Admin | 120 req/menit |
| Verify tiket (public) | 30 req/menit |

**Header response**

```http
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 118
```

**Kalau limit tercapai**

```json
{ "message": "Too Many Attempts." }
```

---

## 6. Endpoint — Public

> **Base path:** `/api/v2/public/transport` · **Middleware:** `client.auth`, `throttle:60,1`

### 6.1 List Terminal

```http
GET /api/v2/public/transport/terminals
```

**Query Params**

| Param | Tipe | Keterangan |
|---|---|---|
| `search` | string | Cari nama terminal |
| `type` | enum | `terminal`, `pool`, `agen` |
| `per_page` | int | Default `20` |

**Response**

```json
{
  "status": true,
  "data": [
    {
      "id": 1,
      "name": "Terminal Batoh",
      "slug": "terminal-batoh",
      "type": "terminal",
      "type_label": "Terminal Resmi",
      "city": "Banda Aceh",
      "address": "Jl. Soekarno-Hatta, Banda Aceh",
      "latitude": "5.53419000",
      "longitude": "95.38172000",
      "is_active": true
    }
  ]
}
```

### 6.2 Detail Terminal

```http
GET /api/v2/public/transport/terminals/{id}
```

### 6.3 List Operator

```http
GET /api/v2/public/transport/operators
```

**Query Params**

| Param | Tipe | Keterangan |
|---|---|---|
| `search` | string | Nama operator |
| `type` | enum | `AKAP`, `AKDP` |
| `is_featured` | boolean | Hanya yang unggulan |

**Response**

```json
{
  "status": true,
  "data": [
    {
      "id": 46,
      "name": "PT. Mandala Putra Perkasa",
      "slug": "mandala-putra-perkasa",
      "operator_type": "AKDP",
      "formatted_operator_type": "Antar Kota Dalam Provinsi",
      "logo_url": "https://...",
      "is_verified": true,
      "average_rating": 4.5,
      "total_reviews": 120
    }
  ]
}
```

### 6.4 Detail Operator

```http
GET /api/v2/public/transport/operators/{id}
```

Response: Detail operator + list bus + routes.

### 6.5 Cari Jadwal ⭐

```http
GET /api/v2/public/transport/schedules
```

**Query Params**

| Param | Tipe | Default | Keterangan |
|---|---|---|---|
| `origin_terminal_id` | int | — | Filter terminal asal |
| `destination_terminal_id` | int | — | Filter terminal tujuan |
| `date` | date | hari ini | Format `YYYY-MM-DD` |
| `passengers` | int | `1` | Minimal kursi tersedia |
| `class` | enum | — | `ekonomi`, `bisnis`, `executive`, `vip` |
| `operator_id` | int | — | Filter operator |
| `min_price` | number | — | Minimal harga |
| `max_price` | number | — | Maksimal harga |
| `sort` | enum | `departure_asc` | `departure_asc`, `departure_desc`, `price_asc`, `price_desc` |
| `per_page` | int | `15` | Maks `50` |

**Request**

```bash
GET /api/v2/public/transport/schedules
  ?origin_terminal_id=1
  &destination_terminal_id=3
  &date=2026-09-20
  &passengers=2
  &sort=price_asc
```

**Response**

```json
{
  "status": true,
  "data": {
    "current_page": 1,
    "data": [
      {
        "id": 1,
        "operator": {
          "id": 46,
          "name": "PT. Mandala Putra Perkasa",
          "logo_url": "..."
        },
        "route": {
          "id": 1,
          "name": "Banda Aceh – Meulaboh",
          "origin_terminal": { "id": 1, "name": "Terminal Batoh", "city": "Banda Aceh" },
          "destination_terminal": { "id": 3, "name": "Terminal Meulaboh", "city": "Meulaboh" },
          "distance_km": "256.00",
          "formatted_duration": "6 jam"
        },
        "bus": {
          "id": 7,
          "name": "Mandala 01",
          "plate_number": "BL 4601 CC",
          "class": "bisnis",
          "total_seats": 44,
          "facilities": ["AC", "reclining_seat", "USB_charger", "TV"]
        },
        "departure_time": "07:00",
        "arrival_time_estimate": "13:00",
        "price": "100000.00",
        "formatted_price": "Rp 100.000",
        "available_seats": 32
      }
    ],
    "per_page": 15,
    "total": 5,
    "last_page": 1
  }
}
```

### 6.6 Detail Jadwal

```http
GET /api/v2/public/transport/schedules/{id}
```

Response: Detail lengkap + info bus + sisa kursi per kursi.

### 6.7 Verifikasi Tiket via QR

```http
GET /api/v2/public/transport/verify?qr_code=TKT-XXXXXXXX
```

> **Middleware:** `throttle:30,1`

**Response sukses**

```json
{
  "status": true,
  "message": "✅ Tiket valid, siap check-in",
  "data": {
    "ticket_number": "T20260916001",
    "booking_code": "TRX-ABCD1234",
    "passenger_name": "Budi S*****",
    "route": {
      "origin": "Terminal Batoh",
      "destination": "Terminal Meulaboh"
    },
    "departure": {
      "date": "20 Sep 2026",
      "time": "07:00"
    },
    "status": "active",
    "payment_status": "paid"
  }
}
```

**Response error**

```json
{
  "status": false,
  "message": "❌ Tiket tidak valid atau tidak ditemukan"
}
```

---

## 7. Endpoint — Customer

> **Base path:** `/api/v2/customer/transport` · **Middleware:** `client.auth`, `throttle:120,1`, `auth:customer`

### 7.1 List Booking

```http
GET /api/v2/customer/transport/bookings
```

**Query Params**

| Param | Tipe |
|---|---|
| `status` | enum: `pending`, `paid`, `confirmed`, `completed`, `cancelled` |
| `page` | int |
| `per_page` | int |

**Response**

```json
{
  "status": true,
  "data": {
    "current_page": 1,
    "data": [
      {
        "id": 5,
        "booking_code": "TRX-ABCD1234",
        "status": "paid",
        "formatted_status": "Sudah Dibayar",
        "payment_status": "paid",
        "total_passengers": 2,
        "total_price": "200000.00",
        "formatted_grand_total": "Rp 206.000",
        "departure_date": "2026-09-20",
        "created_at": "2026-09-16T10:30:00Z"
      }
    ]
  }
}
```

### 7.2 Buat Booking

```http
POST /api/v2/customer/transport/bookings
```

**Body**

```json
{
  "schedule_id": 1,
  "total_passengers": 2,
  "nama_pemesan": "Budi Santoso",
  "nomor_telepon": "081234567890",
  "email": "budi@example.com",
  "notes": "Bawa barang bawaan sedang"
}
```

**Validasi**

| Field | Wajib | Keterangan |
|---|---|---|
| `schedule_id` | ✅ | Harus jadwal aktif |
| `total_passengers` | ✅ | 1–6 orang |
| `nama_pemesan` | ✅ | Maks 100 char |
| `nomor_telepon` | ✅ | Format Indonesia |
| `email` | ✅ | Untuk kirim e-ticket |

**Response 201**

```json
{
  "status": true,
  "message": "Booking berhasil dibuat",
  "data": {
    "id": 5,
    "booking_code": "TRX-ABCD1234",
    "status": "pending",
    "payment_status": "unpaid",
    "total_price": "200000.00",
    "service_fee": "6000.00",
    "formatted_grand_total": "Rp 206.000",
    "expired_at": "2026-09-16T11:00:00Z",
    "tickets": [
      {
        "id": 10,
        "ticket_number": "T20260916001",
        "passenger_name": "Budi Santoso",
        "qr_code": "TKT-XXXXX"
      }
    ]
  }
}
```

**Error 422**

```json
{
  "status": false,
  "message": "Kursi tidak mencukupi. Tersedia 1 kursi."
}
```

Error lain: *Jadwal sudah berangkat* · *Jadwal tidak aktif* · *Jumlah penumpang melebihi batas (6)*

### 7.3 Detail Booking

```http
GET /api/v2/customer/transport/bookings/{code}
```

Path `{code}` = `booking_code` (misal `TRX-ABCD1234`).

**Response**

```json
{
  "status": true,
  "data": {
    "id": 5,
    "booking_code": "TRX-ABCD1234",
    "nama_pemesan": "Budi Santoso",
    "nomor_telepon": "081234567890",
    "email": "budi@example.com",
    "status": "paid",
    "payment_status": "paid",
    "total_passengers": 2,
    "total_price": "200000.00",
    "service_fee": "6000.00",
    "grand_total": 206000,
    "formatted_grand_total": "Rp 206.000",
    "departure_date": "2026-09-20",
    "paid_at": "2026-09-16T10:45:00Z",
    "expired_at": null,
    "schedule": {
      "id": 1,
      "operator": { "name": "PT. Mandala Putra Perkasa" },
      "route": {
        "name": "Banda Aceh – Meulaboh",
        "origin_terminal": { "name": "Terminal Batoh" },
        "destination_terminal": { "name": "Terminal Meulaboh" }
      },
      "bus": { "name": "Mandala 01", "plate_number": "BL 4601 CC" }
    },
    "tickets": [
      {
        "id": 10,
        "ticket_number": "T20260916001",
        "passenger_name": "Budi Santoso",
        "seat_number": "7A",
        "status": "active",
        "checked_in_at": null
      },
      {
        "id": 11,
        "ticket_number": "T20260916002",
        "passenger_name": "Budi Santoso",
        "seat_number": "7B",
        "status": "active",
        "checked_in_at": null
      }
    ]
  }
}
```

### 7.4 Batalkan Booking

```http
POST /api/v2/customer/transport/bookings/{code}/cancel
```

**Body**

```json
{ "reason": "Batal karena urusan mendadak" }
```

**Response**

```json
{
  "status": true,
  "message": "Booking berhasil dibatalkan",
  "data": {
    "booking_code": "TRX-ABCD1234",
    "status": "cancelled",
    "cancelled_at": "2026-09-16T11:00:00Z",
    "refund_amount": "206000.00",
    "refund_status": "processing"
  }
}
```

Error 422: Booking tidak dapat dibatalkan (lewat batas waktu).

### 7.5 Bayar Booking

```http
POST /api/v2/customer/transport/bookings/{code}/pay
```

**Body (opsional)**

```json
{ "payment_method": "qris" }
```

**Response**

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

**Error:** *Booking sudah dibayar (422)* · *Booking dibatalkan (422)* · *Booking kadaluarsa (410)*

### 7.6 Cek Status Pembayaran

```http
GET /api/v2/customer/transport/bookings/{code}/payment-status
```

```json
{
  "status": true,
  "data": {
    "booking_code": "TRX-ABCD1234",
    "payment_status": "paid",
    "status": "paid",
    "paid_at": "2026-09-16T10:45:00Z",
    "flip_transaction_id": "12345",
    "payment_method": "qris"
  }
}
```

### 7.7 Unduh E-Ticket

```http
GET /api/v2/customer/transport/bookings/{code}/ticket
```

Response: `Content-Type: application/pdf` — binary file

**Query Params**

| Param | Nilai |
|---|---|
| `format` | `pdf` (default), `json` |

Error 403: E-ticket belum tersedia (belum lunas).

---

## 8. Endpoint — Merchant

> **Base path:** `/api/v2/merchant/transport` · **Middleware:** `client.auth`, `throttle:120,1`, `auth:merchant_api`
>
> Semua endpoint di-scope ke operator milik merchant.

### 8.1 Dashboard

```http
GET /api/v2/merchant/transport/dashboard
```

```json
{
  "status": true,
  "data": {
    "total_bookings": 245,
    "bookings_today": 12,
    "revenue_this_month": "12500000.00",
    "total_buses": 5,
    "active_schedules": 18
  }
}
```

| Method | Endpoint |
|---|---|
| GET | `/dashboard/recent-bookings` |
| GET | `/dashboard/upcoming-schedules` |

### 8.2 Bus

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/buses` | List bus |
| POST | `/buses` | Buat bus baru |
| GET | `/buses/stats` | Statistik bus |
| GET | `/buses/{id}` | Detail |
| PUT | `/buses/{id}` | Update |
| DELETE | `/buses/{id}` | Hapus |
| POST | `/buses/{id}/toggle-active` | Toggle aktif |

**Buat Bus — Body**

```json
{
  "plate_number": "BL 1234 ABC",
  "name": "Armada 01",
  "class": "eksekutif",
  "total_seats": 40,
  "year": 2022,
  "facilities": ["AC", "WiFi", "Toilet"],
  "photo": "buses/bus-1.jpg"
}
```

### 8.3 Schedule

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/schedules` | List jadwal |
| POST | `/schedules` | Buat jadwal |
| GET | `/schedules/{id}` | Detail |
| PUT | `/schedules/{id}` | Update |
| DELETE | `/schedules/{id}` | Hapus |
| POST | `/schedules/{id}/toggle-active` | Toggle aktif |

**Buat Jadwal — Body**

```json
{
  "route_id": 1,
  "bus_id": 7,
  "departure_time": "08:00",
  "arrival_time_estimate": "14:00",
  "price": 100000,
  "days_of_week": [1, 2, 3, 4, 5, 6, 7],
  "valid_from": "2026-09-01",
  "valid_until": "2026-12-31"
}
```

### 8.4 Route

```http
GET    /api/v2/merchant/transport/routes
POST   /api/v2/merchant/transport/routes
GET    /api/v2/merchant/transport/routes/{id}
PUT    /api/v2/merchant/transport/routes/{id}
DELETE /api/v2/merchant/transport/routes/{id}
POST   /api/v2/merchant/transport/routes/{id}/toggle-active
```

### 8.5 Terminal

```http
GET    /api/v2/merchant/transport/terminals
POST   /api/v2/merchant/transport/terminals
GET    /api/v2/merchant/transport/terminals/{id}
PUT    /api/v2/merchant/transport/terminals/{id}
DELETE /api/v2/merchant/transport/terminals/{id}
```

### 8.6 Booking

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/bookings` | List booking |
| GET | `/bookings/stats` | Statistik |
| GET | `/bookings/{id}` | Detail |
| POST | `/bookings/{id}/confirm` | Konfirmasi |
| POST | `/bookings/{id}/complete` | Selesaikan |
| POST | `/bookings/{id}/cancel` | Batalkan |

**List Booking — Query Params:** `status`, `date_from`, `date_to`, `search` (booking_code)

**Cancel — Body**

```json
{ "reason": "Bus rusak, tidak bisa berangkat" }
```

### 8.7 Check-In

| Method | Endpoint | Fungsi |
|---|---|---|
| POST | `/check-in/verify` | Verifikasi QR (preview tiket) |
| POST | `/check-in` | Proses check-in |
| POST | `/check-in/manual` | Check-in via kode manual |
| GET | `/check-in/stats` | Statistik check-in |

**8.7.1 Verifikasi QR**

```http
POST /api/v2/merchant/transport/check-in/verify
```

```json
{ "qr_code": "TKT-XXXXXXXX" }
```

**Response valid**

```json
{
  "status": true,
  "message": "✅ Tiket valid, siap check-in",
  "data": {
    "ticket_id": 10,
    "ticket_number": "T20260916001",
    "booking_code": "TRX-ABCD1234",
    "passenger_name": "Budi Santoso",
    "passenger_phone": "081234567890",
    "seat_number": "7A",
    "status": "active",
    "payment_status": "paid",
    "checked_in_at": null,
    "route": {
      "origin": "Terminal Batoh",
      "destination": "Terminal Meulaboh"
    },
    "departure": {
      "date": "20 Sep 2026",
      "time": "07:00"
    },
    "bus": {
      "name": "Mandala 01",
      "plate": "BL 4601 CC",
      "class": "bisnis"
    },
    "operator": "PT. Mandala Putra Perkasa"
  }
}
```

Error 403: *Tiket bukan milik operator Anda* · Error 422: *Pembayaran booking belum lunas*

**8.7.2 Proses Check-In**

```http
POST /api/v2/merchant/transport/check-in
```

```json
{ "qr_code": "TKT-XXXXXXXX", "location": "Loket Merchant" }
```

```json
{
  "status": true,
  "message": "✅ Check-in berhasil!",
  "data": { "...": "..." }
}
```

**8.7.3 Check-In Manual**

```http
POST /api/v2/merchant/transport/check-in/manual
```

```json
{ "code": "T20260916001", "location": "Loket Merchant" }
```

Keterangan: `code` bisa `ticket_number` atau `booking_code`.

**8.7.4 Statistik Check-In**

```http
GET /api/v2/merchant/transport/check-in/stats
```

Query Params: `date` (default hari ini)

```json
{
  "status": true,
  "data": {
    "date": "2026-09-20",
    "total_tickets": 40,
    "checked_in": 25,
    "not_checked_in": 15,
    "progress": 62.5
  }
}
```

---

## 9. Endpoint — Admin

> **Base path:** `/api/v2/admin/transport` · **Middleware:** `client.auth`, `throttle:120,1`, `auth:admin_api`, `admin`

### 9.1 Booking

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/bookings` | List semua booking |
| POST | `/bookings` | Buat manual |
| GET | `/bookings/stats` | Statistik |
| GET | `/bookings/upcoming` | Booking akan datang |
| GET | `/bookings/{id}` | Detail |
| PUT | `/bookings/{id}` | Update |
| DELETE | `/bookings/{id}` | Hapus |
| POST | `/bookings/{id}/confirm` | Konfirmasi |
| POST | `/bookings/{id}/mark-paid` | Tandai lunas |
| POST | `/bookings/{id}/complete` | Selesai |
| POST | `/bookings/{id}/cancel` | Batalkan |
| POST | `/bookings/{id}/update-status` | Ubah status |

### 9.2 Bus

| Method | Endpoint |
|---|---|
| GET | `/buses` |
| POST | `/buses` |
| GET | `/buses/stats` |
| GET | `/buses/{id}` |
| PUT | `/buses/{id}` |
| DELETE | `/buses/{id}` |
| POST | `/buses/{id}/toggle-active` |

### 9.3 Operator

| Method | Endpoint |
|---|---|
| GET | `/operators` |
| POST | `/operators` |
| GET | `/operators/stats` |
| GET | `/operators/{id}` |
| PUT | `/operators/{id}` |
| DELETE | `/operators/{id}` |
| POST | `/operators/{id}/verify` |
| POST | `/operators/{id}/toggle-active` |

### 9.4 Route

| Method | Endpoint |
|---|---|
| GET | `/routes` |
| POST | `/routes` |
| GET | `/routes/stats` |
| GET | `/routes/{id}` |
| PUT | `/routes/{id}` |
| DELETE | `/routes/{id}` |
| POST | `/routes/{id}/toggle-active` |

### 9.5 Schedule

| Method | Endpoint |
|---|---|
| GET | `/schedules` |
| POST | `/schedules` |
| GET | `/schedules/available` |
| GET | `/schedules/stats` |
| GET | `/schedules/{id}` |
| PUT | `/schedules/{id}` |
| DELETE | `/schedules/{id}` |
| POST | `/schedules/{id}/toggle-active` |

### 9.6 Terminal

| Method | Endpoint |
|---|---|
| GET | `/terminals` |
| POST | `/terminals` |
| GET | `/terminals/stats` |
| GET | `/terminals/{id}` |
| PUT | `/terminals/{id}` |
| DELETE | `/terminals/{id}` |
| POST | `/terminals/{id}/toggle-active` |

### 9.7 Check-In

| Method | Endpoint | Fungsi |
|---|---|---|
| POST | `/check-in/verify` | Preview tiket |
| POST | `/check-in` | Proses check-in |
| POST | `/check-in/manual` | Check-in via kode |
| GET | `/check-in/stats` | Statistik |

Endpoint sama seperti merchant, tapi bisa akses semua operator.

---

## 10. Webhook

### Flip Payment Webhook

```http
POST /api/webhook/flip
```

Tanpa middleware `client.auth` — Flip mengirim callback tanpa `X-Client-ID`.

**Header**

| Header | Nilai |
|---|---|
| `X-Callback-Signature` | HMAC SHA256 dari raw body, dengan key = `FLIP_WEBHOOK_TOKEN` |

**Body**

```json
{
  "id": 12345,
  "bill_id": 12345,
  "status": "SUCCESSFUL",
  "amount": 206000,
  "reference_id": "TRX-ABCD1234",
  "sender_bank": "bca",
  "sender_name": "Budi Santoso",
  "payment_method": "qris",
  "paid_at": "2026-09-16 10:45:00"
}
```

**Status yang mungkin**

| Status | Efek |
|---|---|
| `SUCCESSFUL` | Booking → `paid`, tiket aktif, PDF + notifikasi dikirim |
| `FAILED` | Payment → `failed`, booking tetap `pending` |
| `EXPIRED` | Payment → `expired` |
| `PENDING` | Diabaikan (ignored) |

**Response**

| Code | Kapan |
|---|---|
| 200 | Sukses diproses |
| 401 | Signature invalid |
| 422 | Payload tidak lengkap |
| 500 | Server error → Flip akan retry |

---

## 11. Error Codes

| Code | Keterangan |
|---|---|
| 200 | Sukses |
| 201 | Berhasil create |
| 400 | Bad request |
| 401 | Unauthenticated (client/token tidak valid) |
| 403 | Forbidden (tidak punya akses) |
| 404 | Resource tidak ditemukan |
| 410 | Gone (kadaluarsa) |
| 422 | Validasi gagal |
| 429 | Rate limit |
| 500 | Server error |

### Pesan Error Umum

| Pesan | Penyebab |
|---|---|
| `Client credentials required` | Header `X-Client-ID`/`Secret` tidak ada |
| `Invalid client credentials` | Client ID/Secret salah |
| `Unauthenticated.` | Token user tidak valid/expired |
| `Kursi tidak mencukupi` | Booking melebihi kursi tersedia |
| `Jadwal sudah berangkat` | Jadwal lewat |
| `Jadwal tidak aktif` | Jadwal dinonaktifkan operator |
| `Booking sudah dibayar` | Booking sudah lunas |
| `Booking tidak dapat dibatalkan` | Lewat batas cancel |
| `Tiket tidak valid` | QR code tidak ditemukan |
| `Pembayaran booking belum lunas` | Belum bayar saat check-in |
| `Waktu check-in sudah berakhir` | Lewat batas check-in |

---

## 12. Changelog

| Versi | Tanggal | Perubahan |
|---|---|---|
| 1.0 | 2025-01 | Rilis awal — admin master data |
| 2.0 | 2026-08 | Tambah admin booking + stats |
| 2.1 | 2026-09-10 | Tambah merchant endpoints |
| **2.2** | **2026-09-16** | **Tambah customer & public endpoints + check-in + webhook + PDF** |

---

## Lampiran

### A. Contoh Alur Lengkap

```
1. Customer cari jadwal
   GET /api/v2/public/transport/schedules?origin_terminal_id=1&destination_terminal_id=3&date=2026-09-20

2. Customer lihat detail jadwal
   GET /api/v2/public/transport/schedules/1

3. Customer login
   POST /api/v2/auth/login { email, password }

4. Customer buat booking
   POST /api/v2/customer/transport/bookings { schedule_id, total_passengers, ... }
   → Response: booking_code + tiket + expired_at

5. Customer bayar
   POST /api/v2/customer/transport/bookings/TRX-XXX/pay
   → Response: payment_url + qr_url

6. Customer bayar di Flip (QR/VA/e-wallet)

7. Flip kirim webhook
   POST /api/webhook/flip { id, status, amount, reference_id }
   → Backend: booking.status = paid
   → Backend: generate PDF
   → Backend: kirim email + WA

8. Customer unduh e-ticket
   GET /api/v2/customer/transport/bookings/TRX-XXX/ticket
   → Response: PDF

9. Merchant lihat booking masuk
   GET /api/v2/merchant/transport/bookings?status=paid

10. Customer datang ke terminal
    Petugas scan QR → POST /api/v2/merchant/transport/check-in
    → Response: ✅ Check-in berhasil

11. Merchant complete booking
    POST /api/v2/merchant/transport/bookings/{id}/complete
```

### B. Contoh cURL Lengkap

```bash
# ═══ PUBLIC ═══════════════════════════════════════════════
# Cari jadwal
curl -H "X-Client-ID: shop-web" \
     -H "X-Client-Secret: xxxxx" \
     "https://api.ovisito.com/api/v2/public/transport/schedules?origin_terminal_id=1&destination_terminal_id=3&date=2026-09-20"

# Verifikasi tiket publik
curl -H "X-Client-ID: shop-web" \
     -H "X-Client-Secret: xxxxx" \
     "https://api.ovisito.com/api/v2/public/transport/verify?qr_code=TKT-XXXX"

# ═══ CUSTOMER ═════════════════════════════════════════════
# Login
curl -X POST \
     -H "X-Client-ID: shop-web" \
     -H "X-Client-Secret: xxxxx" \
     -H "Content-Type: application/json" \
     -d '{"email":"user@test.com","password":"secret"}' \
     "https://api.ovisito.com/api/v2/auth/login"

# Booking
curl -X POST \
     -H "X-Client-ID: shop-web" \
     -H "X-Client-Secret: xxxxx" \
     -H "Authorization: Bearer <customer_token>" \
     -H "Content-Type: application/json" \
     -d '{"schedule_id":1,"total_passengers":2,"nama_pemesan":"Budi","nomor_telepon":"08123","email":"budi@test.com"}' \
     "https://api.ovisito.com/api/v2/customer/transport/bookings"

# Unduh tiket
curl -H "X-Client-ID: shop-web" \
     -H "X-Client-Secret: xxxxx" \
     -H "Authorization: Bearer <customer_token>" \
     -o tiket.pdf \
     "https://api.ovisito.com/api/v2/customer/transport/bookings/TRX-XXX/ticket"

# ═══ MERCHANT ═════════════════════════════════════════════
# Verify tiket
curl -X POST \
     -H "X-Client-ID: merchant-web" \
     -H "X-Client-Secret: xxxxx" \
     -H "Authorization: Bearer <merchant_token>" \
     -H "Content-Type: application/json" \
     -d '{"qr_code":"TKT-XXXX"}' \
     "https://api.ovisito.com/api/v2/merchant/transport/check-in/verify"

# Proses check-in
curl -X POST \
     -H "X-Client-ID: merchant-web" \
     -H "X-Client-Secret: xxxxx" \
     -H "Authorization: Bearer <merchant_token>" \
     -H "Content-Type: application/json" \
     -d '{"qr_code":"TKT-XXXX","location":"Loket 1"}' \
     "https://api.ovisito.com/api/v2/merchant/transport/check-in"

# ═══ ADMIN ════════════════════════════════════════════════
# Verifikasi operator
curl -X POST \
     -H "X-Client-ID: admin-web" \
     -H "X-Client-Secret: xxxxx" \
     -H "Authorization: Bearer <admin_token>" \
     "https://api.ovisito.com/api/v2/admin/transport/operators/46/verify"

# ═══ WEBHOOK ══════════════════════════════════════════════
# (Contoh payload yang Flip kirim)
curl -X POST \
     -H "Content-Type: application/json" \
     -H "X-Callback-Signature: <hmac>" \
     -d '{"id":12345,"status":"SUCCESSFUL","amount":206000,"reference_id":"TRX-XXX"}' \
     "https://api.ovisito.com/api/webhook/flip"
```

### C. Status Enum Lengkap

**Booking Status**

| Status | Label |
|---|---|
| `pending` | Menunggu Pembayaran |
| `paid` | Sudah Dibayar |
| `confirmed` | Terkonfirmasi |
| `completed` | Selesai |
| `cancelled` | Dibatalkan |
| `refunded` | Direfund |

**Payment Status**

| Status | Label |
|---|---|
| `unpaid` | Belum Dibayar |
| `paid` | Sudah Dibayar |
| `failed` | Gagal |
| `refunded` | Direfund |

**Ticket Status**

| Status | Label |
|---|---|
| `active` | Aktif |
| `used` | Sudah Digunakan |
| `cancelled` | Dibatalkan |

**Bus Class**

| Class | Label |
|---|---|
| `ekonomi` | Ekonomi |
| `bisnis` | Bisnis |
| `executive` | Executive |
| `vip` | VIP |

**Operator Type**

| Type | Label |
|---|---|
| `AKAP` | Antar Kota Antar Provinsi |
| `AKDP` | Antar Kota Dalam Provinsi |

---

<p align="center"><sub>Dokumen terakhir diperbarui: 16 September 2026 · Versi 2.2 · Maintainer: Tim Backend Ovisito · Kontak: backend@ovisito.com</sub></p>

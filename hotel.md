# 📘 Dokumentasi REST API — Modul Hotel

**File:** `docs/api/hotel-api.md`
**Versi:** 2.2
**Terakhir diperbarui:** 2026-09-16

## Ovisito Hotel API v2

REST API untuk modul hotel (katalog hotel, kamar, booking, review).

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

Modul Hotel menyediakan API untuk:

- **Public** — cari hotel, lihat kamar, ketersediaan
- **Customer** — booking kamar, pembayaran, review
- **Admin** — kelola hotel, kamar, foto, klasifikasi, review, booking

### Aktor & Guard

| Aktor | Guard | Login Endpoint |
|---|---|---|
| Customer | `auth:customer` | `POST /api/v2/auth/login` |
| Admin | `auth:admin_api` | `POST /api/v2/admin/login` |

> ℹ️ Modul hotel saat ini tidak punya merchant panel terpisah — semua hotel dikelola oleh admin Ovisito.

### Base Path

```
Production : https://api.ovisito.com
Sandbox    : https://staging.ovisito.com

Admin   : /api/v2/admin/hotel/*
Public  : /api/v2/public/hotel/*      (rekomendasi — perlu dibuat)
Customer: /api/v2/customer/hotel/*    (rekomendasi — perlu dibuat)
```

---

## 2. Autentikasi

Setiap request melewati 2 layer autentikasi:

### Layer 1 — Client Auth (wajib semua endpoint)

| Header | Wajib | Keterangan |
|---|---|---|
| `X-Client-ID` | ✅ | ID aplikasi |
| `X-Client-Secret` | ✅ | Secret aplikasi |

### Layer 2 — Token User (untuk endpoint terproteksi)

| Header | Wajib |
|---|---|
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
curl -X GET "https://api.ovisito.com/api/v2/public/hotel/hotels" \
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

---

## 5. Rate Limiting

| Endpoint Group | Limit |
|---|---|
| Public hotel | 120 req/menit |
| Customer | 120 req/menit |
| Admin | 120 req/menit |

---

## 6. Endpoint — Public

**Base path:** `/api/v2/public/hotel`
**Middleware:** `client.auth`, `throttle:120,1`

> ⚠️ Endpoint publik hotel belum tersedia. Yang ada saat ini hanya admin.
> Dokumentasi berikut adalah rekomendasi yang perlu diimplementasi.

### 6.1 List Hotel ⭐

```http
GET /api/v2/public/hotel/hotels
```

**Query Params:**

| Param | Tipe | Default | Keterangan |
|---|---|---|---|
| `search` | string | — | Cari nama hotel |
| `kabupaten_kota_id` | int | — | Filter lokasi |
| `klasifikasi_id` | int | — | Filter klasifikasi (bintang) |
| `min_price` | number | — | Harga minimum |
| `max_price` | number | — | Harga maksimum |
| `featured` | boolean | — | Hotel unggulan |
| `sort` | enum | `popular` | `popular`, `price_asc`, `price_desc`, `rating` |
| `page` | int | 1 | |
| `per_page` | int | 15 | |

**Request:**

```bash
GET /api/v2/public/hotel/hotels?kabupaten_kota_id=1&min_price=300000&sort=rating
```

**Response:**

```json
{
  "current_page": 1,
  "data": [
    {
      "id": "uuid",
      "nama": "Hotel Hermes Palace",
      "slug": "hotel-hermes-palace",
      "deskripsi": "Hotel bintang 4 di pusat kota...",
      "alamat": "Jl. Teuku Umar No. 1",
      "kabupaten_kota": { "id": 1, "nama": "Kota Banda Aceh" },
      "klasifikasi": { "id": 4, "nama": "Bintang 4", "jumlah_bintang": 4 },
      "latitude": "5.54830000",
      "longitude": "95.32380000",
      "foto_utama": "hotels/hermes/main.jpg",
      "foto_urls": ["hotels/hermes/1.jpg", "hotels/hermes/2.jpg"],
      "fasilitas": ["wifi", "kolam_renang", "restoran", "parkir"],
      "rating_average": 4.5,
      "total_reviews": 234,
      "price_from": "450000.00",
      "price_from_formatted": "Rp 450.000",
      "is_featured": true,
      "is_active": true
    }
  ],
  "per_page": 15,
  "total": 24,
  "last_page": 2
}
```

### 6.2 Detail Hotel

```http
GET /api/v2/public/hotel/hotels/{slug}
```

**Response:**

```json
{
  "data": {
    "id": "uuid",
    "nama": "Hotel Hermes Palace",
    "slug": "hotel-hermes-palace",
    "deskripsi": "Hotel bintang 4 di pusat kota...",
    "alamat": "Jl. Teuku Umar No. 1, Banda Aceh",
    "kabupaten_kota": { "id": 1, "nama": "Kota Banda Aceh" },
    "klasifikasi": { "id": 4, "nama": "Bintang 4", "jumlah_bintang": 4 },
    "latitude": "5.54830000",
    "longitude": "95.32380000",
    "phone": "0651-123456",
    "email": "info@hermespalace.com",
    "website": "https://hermespalace.com",
    "foto_urls": [
      "hotels/hermes/main.jpg",
      "hotels/hermes/lobby.jpg",
      "hotels/hermes/pool.jpg"
    ],
    "fasilitas": ["wifi", "kolam_renang", "restoran", "parkir", "gym", "spa"],
    "check_in_time": "14:00",
    "check_out_time": "12:00",
    "rating_average": 4.5,
    "total_reviews": 234,
    "rating_breakdown": {
      "kebersihan": 4.7,
      "pelayanan": 4.6,
      "lokasi": 4.8,
      "nilai": 4.3,
      "fasilitas": 4.5
    },
    "rooms": [
      {
        "id": "uuid",
        "nama": "Deluxe Room",
        "tipe": "deluxe",
        "kapasitas": 2,
        "luas_m2": 28,
        "tempat_tidur": "1 King Bed",
        "harga_per_malam": "450000.00",
        "harga_formatted": "Rp 450.000",
        "foto_urls": ["rooms/deluxe-1.jpg"],
        "fasilitas": ["AC", "TV", "WiFi", "Mini Bar"]
      },
      {
        "id": "uuid",
        "nama": "Executive Suite",
        "tipe": "suite",
        "kapasitas": 3,
        "harga_per_malam": "850000.00"
      }
    ],
    "reviews": [
      {
        "id": "uuid",
        "rating": 5,
        "komentar": "Hotel bersih, pelayanan ramah!",
        "user": { "uuid": "uuid", "nama": "Budi S." },
        "created_at": "2026-09-10T10:30:00Z"
      }
    ],
    "facilities_detail": {
      "umum": ["wifi", "parkir", "kolam_renang", "restoran"],
      "kamar": ["AC", "TV", "WiFi", "Mini Bar"],
      "layanan": ["room_service", "laundry", "24h_front_desk"]
    }
  }
}
```

### 6.3 List Kamar Hotel

```http
GET /api/v2/public/hotel/hotels/{hotelId}/rooms
```

**Query Params:** `check_in`, `check_out`, `kapasitas`

### 6.4 Cek Ketersediaan Kamar

```http
GET /api/v2/public/hotel/hotels/{hotelId}/rooms/availability
```

**Query Params:**

| Param | Wajib | Keterangan |
|---|---|---|
| `check_in` | ✅ | Format `YYYY-MM-DD` |
| `check_out` | ✅ | Format `YYYY-MM-DD` |
| `kapasitas` | — | Jumlah tamu |

**Response:**

```json
{
  "data": [
    {
      "room_id": "uuid",
      "nama": "Deluxe Room",
      "harga_per_malam": "450000.00",
      "total_malam": 2,
      "total_harga": "900000.00",
      "tersedia": 3,
      "is_available": true
    }
  ]
}
```

### 6.5 List Klasifikasi Hotel

```http
GET /api/v2/public/hotel/klasifikasi-hotel
```

**Response:**

```json
{
  "data": [
    { "id": 1, "nama": "Bintang 1", "jumlah_bintang": 1 },
    { "id": 2, "nama": "Bintang 2", "jumlah_bintang": 2 },
    { "id": 3, "nama": "Bintang 3", "jumlah_bintang": 3 },
    { "id": 4, "nama": "Bintang 4", "jumlah_bintang": 4 },
    { "id": 5, "nama": "Bintang 5", "jumlah_bintang": 5 }
  ]
}
```

---

## 7. Endpoint — Customer

**Base path:** `/api/v2/customer/hotel`
**Middleware:** `client.auth`, `throttle:120,1`, `auth:customer`

> ⚠️ Endpoint customer hotel belum tersedia. Rekomendasi di bawah ini perlu diimplementasi.

### 7.1 Cek Ketersediaan

```http
GET /api/v2/customer/hotel/availability
```

**Query Params:**

| Param | Wajib |
|---|---|
| `hotel_id` | ✅ |
| `room_id` | ✅ |
| `check_in` | ✅ |
| `check_out` | ✅ |
| `jumlah_kamar` | Default 1 |

**Response:**

```json
{
  "status": true,
  "data": {
    "hotel": { "id": "uuid", "nama": "Hotel Hermes Palace" },
    "room": { "id": "uuid", "nama": "Deluxe Room" },
    "check_in": "2026-09-20",
    "check_out": "2026-09-22",
    "jumlah_malam": 2,
    "jumlah_kamar": 1,
    "harga_per_malam": "450000.00",
    "subtotal": "900000.00",
    "pajak": "90000.00",
    "total": "990000.00",
    "is_available": true,
    "kamar_tersedia": 3
  }
}
```

### 7.2 Buat Booking

```http
POST /api/v2/customer/hotel/bookings
```

**Body:**

```json
{
  "hotel_id": "uuid",
  "room_id": "uuid",
  "check_in_date": "2026-09-20",
  "check_out_date": "2026-09-22",
  "num_rooms": 1,
  "num_adults": 2,
  "num_children": 0,
  "guest_name": "Budi Santoso",
  "guest_email": "budi@example.com",
  "guest_phone": "081234567890",
  "special_request": "Tolong sediakan bantal ekstra"
}
```

**Validasi:**

| Field | Wajib | Keterangan |
|---|---|---|
| `hotel_id` | ✅ | ID hotel |
| `room_id` | ✅ | ID kamar |
| `check_in_date` | ✅ | ≥ hari ini |
| `check_out_date` | ✅ | > check_in |
| `num_rooms` | ✅ | 1–5 |
| `num_adults` | ✅ | 1+ |
| `guest_name` | ✅ | Maks 100 |
| `guest_email` | ✅ | |
| `guest_phone` | ✅ | |

**Response 201:**

```json
{
  "status": true,
  "message": "Booking berhasil dibuat",
  "data": {
    "id": "uuid",
    "booking_code": "HTL-20260916-ABCD12",
    "status": "pending",
    "payment_status": "unpaid",
    "hotel": { "id": "uuid", "nama": "Hotel Hermes Palace" },
    "room": { "id": "uuid", "nama": "Deluxe Room" },
    "check_in_date": "2026-09-20",
    "check_out_date": "2026-09-22",
    "total_nights": 2,
    "num_rooms": 1,
    "num_adults": 2,
    "total_price": "990000.00",
    "formatted_total": "Rp 990.000",
    "expired_at": "2026-09-16T11:00:00Z"
  }
}
```

### 7.3 List Booking

```http
GET /api/v2/customer/hotel/bookings
```

**Query Params:** `status`, `page`, `per_page`

### 7.4 Detail Booking

```http
GET /api/v2/customer/hotel/bookings/{booking_code}
```

**Response:**

```json
{
  "data": {
    "id": "uuid",
    "booking_code": "HTL-20260916-ABCD12",
    "status": "confirmed",
    "payment_status": "paid",
    "hotel": {
      "id": "uuid",
      "nama": "Hotel Hermes Palace",
      "alamat": "Jl. Teuku Umar No. 1, Banda Aceh",
      "phone": "0651-123456",
      "foto_urls": ["hotels/hermes/main.jpg"]
    },
    "room": {
      "id": "uuid",
      "nama": "Deluxe Room",
      "tipe": "deluxe",
      "kapasitas": 2
    },
    "guest_name": "Budi Santoso",
    "guest_email": "budi@example.com",
    "guest_phone": "081234567890",
    "check_in_date": "2026-09-20",
    "check_out_date": "2026-09-22",
    "total_nights": 2,
    "num_rooms": 1,
    "num_adults": 2,
    "num_children": 0,
    "total_price": "990000.00",
    "paid_at": "2026-09-16T10:45:00Z",
    "confirmed_at": "2026-09-16T11:00:00Z",
    "special_request": "Tolong sediakan bantal ekstra"
  }
}
```

### 7.5 Bayar Booking

```http
POST /api/v2/customer/hotel/bookings/{booking_code}/pay
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

### 7.6 Cek Status Pembayaran

```http
GET /api/v2/customer/hotel/bookings/{booking_code}/payment-status
```

### 7.7 Batalkan Booking

```http
POST /api/v2/customer/hotel/bookings/{booking_code}/cancel
```

**Body:**

```json
{
  "reason": "Rencana berubah"
}
```

### 7.8 Buat Review

```http
POST /api/v2/customer/hotel/reviews
```

**Body:**

```json
{
  "booking_id": "uuid",
  "rating": 5,
  "komentar": "Hotel bersih, pelayanan ramah!",
  "aspects": {
    "kebersihan": 5,
    "pelayanan": 5,
    "lokasi": 4,
    "nilai": 4,
    "fasilitas": 5
  }
}
```

**Validasi:**

- Booking harus `completed`
- 1 booking = 1 review

---

## 8. Endpoint — Admin

**Base path:** `/api/v2/admin/hotel`
**Middleware:** `client.auth`, `throttle:120,1`, `auth:admin_api`, `admin`

### 8.1 Hotel

**List Hotel**

```http
GET /api/v2/admin/hotel/hotels
```

**Query Params:**

| Param | Tipe |
|---|---|
| `search` | string |
| `status` | enum: `active`, `inactive` |
| `featured` | boolean |
| `kabupaten_kota_id` | int |
| `klasifikasi_id` | int |
| `page` | int |
| `per_page` | int |

**Stats Hotel**

```http
GET /api/v2/admin/hotel/hotels/stats
```

```json
{
  "data": {
    "total": 120,
    "active": 115,
    "inactive": 5,
    "featured": 12,
    "total_rooms": 1450,
    "total_bookings_this_month": 345
  }
}
```

**Quick Stats**

```http
GET /api/v2/admin/hotel/hotels/quick-stats
```

**Revenue Trends**

```http
GET /api/v2/admin/hotel/hotels/revenue-trends
```

Query Params: `period` (`7d`, `30d`, `90d`, `1y`)

**Occupancy**

```http
GET /api/v2/admin/hotel/hotels/occupancy
```

```json
{
  "data": {
    "occupancy_rate": 72.5,
    "rooms_occupied": 1080,
    "rooms_available": 1485,
    "period": "2026-09"
  }
}
```

**Top Hotels**

```http
GET /api/v2/admin/hotel/hotels/top-hotels
```

**Detail Hotel**

```http
GET /api/v2/admin/hotel/hotels/{hotel}
```

Path `{hotel}` = slug atau ID.

**Create Hotel**

```http
POST /api/v2/admin/hotel/hotels
```

```json
{
  "nama": "Hotel Hermes Palace",
  "deskripsi": "Hotel bintang 4 di pusat kota...",
  "alamat": "Jl. Teuku Umar No. 1",
  "kabupaten_kota_id": 1,
  "kecamatan_id": 12,
  "klasifikasi_hotel_id": 4,
  "latitude": 5.54830000,
  "longitude": 95.32380000,
  "phone": "0651-123456",
  "email": "info@hermespalace.com",
  "website": "https://hermespalace.com",
  "check_in_time": "14:00",
  "check_out_time": "12:00",
  "fasilitas": ["wifi", "kolam_renang", "restoran", "parkir"],
  "is_featured": true,
  "is_active": true
}
```

**Update Hotel**

```http
PUT /api/v2/admin/hotel/hotels/{hotel}
```

**Delete Hotel**

```http
DELETE /api/v2/admin/hotel/hotels/{hotel}
```

**Toggle Status**

```http
POST /api/v2/admin/hotel/hotels/{id}/toggle-status
```

**Toggle Featured**

```http
POST /api/v2/admin/hotel/hotels/{id}/toggle-featured
```

### 8.2 Foto Hotel

**List Foto**

```http
GET /api/v2/admin/hotel/hotels/{hotelId}/photos
```

**Upload Foto**

```http
POST /api/v2/admin/hotel/hotels/photos
```

Body (`multipart/form-data`):

```
hotel_id: uuid
photo: <file>
caption: "Lobby Hotel"
is_main: true
```

**Response:**

```json
{
  "status": true,
  "data": {
    "id": "uuid",
    "photo_path": "hotels/hermes/lobby.jpg",
    "url": "https://.../hotels/hermes/lobby.jpg",
    "caption": "Lobby Hotel",
    "is_main": true
  }
}
```

**Set Foto Utama**

```http
POST /api/v2/admin/hotel/hotels/photos/{id}/set-main
```

**Hapus Foto**

```http
DELETE /api/v2/admin/hotel/hotels/photos/{id}
```

### 8.3 Kamar

**List Kamar Hotel**

```http
GET /api/v2/admin/hotel/hotels/{hotelId}/rooms
```

**Stats Kamar**

```http
GET /api/v2/admin/hotel/rooms/stats
```

**Create Kamar**

```http
POST /api/v2/admin/hotel/rooms
```

```json
{
  "hotel_id": "uuid",
  "nama": "Deluxe Room",
  "tipe": "deluxe",
  "kapasitas": 2,
  "luas_m2": 28,
  "tempat_tidur": "1 King Bed",
  "harga_per_malam": 450000,
  "fasilitas": ["AC", "TV", "WiFi", "Mini Bar"],
  "jumlah_kamar": 10,
  "is_active": true
}
```

**Detail Kamar**

```http
GET /api/v2/admin/hotel/rooms/{id}
```

**Update Kamar**

```http
PUT /api/v2/admin/hotel/rooms/{id}
```

**Hapus Kamar**

```http
DELETE /api/v2/admin/hotel/rooms/{id}
```

**Toggle Status**

```http
POST /api/v2/admin/hotel/rooms/{id}/toggle-status
```

### 8.4 Klasifikasi Hotel

**List**

```http
GET /api/v2/admin/hotel/klasifikasi-hotel
```

**Create**

```http
POST /api/v2/admin/hotel/klasifikasi-hotel
```

```json
{
  "nama": "Bintang 4",
  "jumlah_bintang": 4,
  "deskripsi": "Hotel dengan fasilitas lengkap"
}
```

**Detail / Update / Delete**

```http
GET    /api/v2/admin/hotel/klasifikasi-hotel/{id}
PUT    /api/v2/admin/hotel/klasifikasi-hotel/{id}
DELETE /api/v2/admin/hotel/klasifikasi-hotel/{id}
```

### 8.5 Review

**List Review**

```http
GET /api/v2/admin/hotel/hotels/{hotelId}/reviews
```

Query Params: `rating`, `is_active`, `page`

**Stats Review**

```http
GET /api/v2/admin/hotel/hotels/reviews/stats
```

**Create Review (Manual)**

```http
POST /api/v2/admin/hotel/hotels/reviews
```

```json
{
  "hotel_id": "uuid",
  "user_id": 1,
  "rating": 5,
  "komentar": "Hotel sangat bagus"
}
```

**Update Review**

```http
PUT /api/v2/admin/hotel/hotels/reviews/{id}
```

**Hapus Review**

```http
DELETE /api/v2/admin/hotel/hotels/reviews/{id}
```

**Toggle Aktif**

```http
POST /api/v2/admin/hotel/hotels/reviews/{id}/toggle-active
```

### 8.6 Booking Hotel

**List Booking**

```http
GET /api/v2/admin/hotel/booking-hotels
```

**Query Params:**

| Param | Tipe |
|---|---|
| `status` | enum |
| `payment_status` | enum |
| `hotel_id` | uuid |
| `date_from` | date |
| `date_to` | date |
| `search` | string (booking_code / nama tamu) |

**Stats Booking**

```http
GET /api/v2/admin/hotel/booking-hotels/stats
```

```json
{
  "data": {
    "total_bookings": 345,
    "bookings_today": 12,
    "revenue_this_month": "125000000.00",
    "occupancy_rate": 72.5,
    "average_stay": 2.3,
    "cancellation_rate": 5.2
  }
}
```

**Upcoming Bookings**

```http
GET /api/v2/admin/hotel/booking-hotels/upcoming
```

Query Params: `days` (default 7)

**Detail Booking**

```http
GET /api/v2/admin/hotel/booking-hotels/{id}
```

**Update Booking**

```http
PUT /api/v2/admin/hotel/booking-hotels/{id}
```

**Delete Booking**

```http
DELETE /api/v2/admin/hotel/booking-hotels/{id}
```

**Mark as Paid**

```http
POST /api/v2/admin/hotel/booking-hotels/{id}/mark-paid
```

**Update Status**

```http
POST /api/v2/admin/hotel/booking-hotels/{id}/update-status
```

```json
{
  "status": "confirmed",
  "notes": "Konfirmasi via telepon"
}
```

---

## 9. Webhook

### Flip Payment Webhook

```http
POST /api/webhook/flip
```

```json
{
  "id": 12345,
  "bill_id": 12345,
  "status": "SUCCESSFUL",
  "amount": 990000,
  "reference_id": "HTL-20260916-ABCD12",
  "sender_bank": "bca",
  "sender_name": "Budi Santoso",
  "payment_method": "qris"
}
```

**Efek:**

| Status | Aksi |
|---|---|
| `SUCCESSFUL` | Booking → paid, payment_status → paid, kirim notif |
| `FAILED` | payment_status → failed |
| `EXPIRED` | payment_status → failed |

---

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
| `Client credentials required` | Header tidak ada |
| `Invalid client credentials` | Client ID/Secret salah |
| `Unauthenticated.` | Token tidak valid |
| `Kamar tidak tersedia pada tanggal tersebut` | Overbooking |
| `Check-out harus setelah check-in` | Validasi tanggal |
| `Booking tidak dapat dibatalkan` | Lewat batas waktu |
| `Hanya bisa review setelah check-out` | Booking belum completed |

---

## 11. Status Enum

### Booking Status

| Status | Label | Warna Badge |
|---|---|---|
| `pending` | Menunggu Pembayaran | `bg-yellow-100 text-yellow-800` |
| `paid` | Sudah Dibayar | `bg-blue-100 text-blue-800` |
| `confirmed` | Terkonfirmasi | `bg-green-100 text-green-800` |
| `checked_in` | Check-In | `bg-indigo-100 text-indigo-800` |
| `completed` | Selesai | `bg-teal-100 text-teal-800` |
| `cancelled` | Dibatalkan | `bg-red-100 text-red-800` |
| `refunded` | Direfund | `bg-orange-100 text-orange-800` |

### Payment Status

| Status | Label |
|---|---|
| `unpaid` | Belum Dibayar |
| `paid` | Sudah Dibayar |
| `failed` | Gagal |
| `refunded` | Direfund |

### Room Type

| Tipe | Label |
|---|---|
| `standard` | Standard |
| `superior` | Superior |
| `deluxe` | Deluxe |
| `suite` | Suite |
| `executive` | Executive |
| `presidential` | Presidential |

### Klasifikasi Bintang

| Bintang | Label |
|---|---|
| 1 | Bintang 1 |
| 2 | Bintang 2 |
| 3 | Bintang 3 |
| 4 | Bintang 4 |
| 5 | Bintang 5 |

---

## 12. Changelog

| Versi | Tanggal | Perubahan |
|---|---|---|
| 1.0 | 2025-01 | Rilis awal — admin hotel master data |
| 2.0 | 2026-06 | Tambah review & photo management |
| 2.1 | 2026-08 | Tambah booking management |
| 2.2 | 2026-09-16 | Dokumentasi lengkap |

---

## 📎 Lampiran

### A. Alur Lengkap Customer

```
1. Customer cari hotel
   GET /api/v2/public/hotel/hotels?kabupaten_kota_id=1&sort=rating

2. Customer lihat detail hotel
   GET /api/v2/public/hotel/hotels/hotel-hermes-palace

3. Cek ketersediaan kamar
   GET /api/v2/public/hotel/hotels/{hotelId}/rooms/availability
     ?check_in=2026-09-20&check_out=2026-09-22

4. Customer login
   POST /api/v2/auth/login

5. Buat booking
   POST /api/v2/customer/hotel/bookings
   { hotel_id, room_id, check_in_date, check_out_date, ... }
   → Response: booking_code

6. Bayar
   POST /api/v2/customer/hotel/bookings/{code}/pay
   → Response: payment_url

7. Bayar di Flip (QR/VA/ewallet)

8. Flip kirim webhook
   POST /api/webhook/flip
   → Booking status: paid

9. Admin konfirmasi
   POST /api/v2/admin/hotel/booking-hotels/{id}/update-status
   { status: confirmed }

10. Customer check-in di hotel (show booking_code)

11. Booking completed
    POST /api/v2/admin/hotel/booking-hotels/{id}/update-status
    { status: completed }

12. Customer review
    POST /api/v2/customer/hotel/reviews
    { booking_id, rating, komentar }
```

### B. Contoh cURL Lengkap

```bash
# ═══ PUBLIC ═══════════════════════════════════════════════
# List hotel
curl -H "X-Client-ID: shop-web" \
     -H "X-Client-Secret: xxxxx" \
     "https://api.ovisito.com/api/v2/public/hotel/hotels?kabupaten_kota_id=1"

# Detail hotel
curl -H "X-Client-ID: shop-web" \
     -H "X-Client-Secret: xxxxx" \
     "https://api.ovisito.com/api/v2/public/hotel/hotels/hotel-hermes-palace"

# Cek ketersediaan
curl -H "X-Client-ID: shop-web" \
     -H "X-Client-Secret: xxxxx" \
     "https://api.ovisito.com/api/v2/public/hotel/hotels/{hotelId}/rooms/availability?check_in=2026-09-20&check_out=2026-09-22"

# ═══ CUSTOMER ═════════════════════════════════════════════
# Buat booking
curl -X POST \
     -H "X-Client-ID: shop-web" \
     -H "X-Client-Secret: xxxxx" \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"hotel_id":"uuid","room_id":"uuid","check_in_date":"2026-09-20","check_out_date":"2026-09-22","num_rooms":1,"num_adults":2,"guest_name":"Budi","guest_email":"budi@test.com","guest_phone":"08123"}' \
     "https://api.ovisito.com/api/v2/customer/hotel/bookings"

# ═══ ADMIN ════════════════════════════════════════════════
# List semua hotel
curl -H "X-Client-ID: admin-web" \
     -H "X-Client-Secret: xxxxx" \
     -H "Authorization: Bearer <admin_token>" \
     "https://api.ovisito.com/api/v2/admin/hotel/hotels"

# Stats hotel
curl -H "X-Client-ID: admin-web" \
     -H "X-Client-Secret: xxxxx" \
     -H "Authorization: Bearer <admin_token>" \
     "https://api.ovisito.com/api/v2/admin/hotel/hotels/stats"

# Create hotel
curl -X POST \
     -H "X-Client-ID: admin-web" \
     -H "X-Client-Secret: xxxxx" \
     -H "Authorization: Bearer <admin_token>" \
     -H "Content-Type: application/json" \
     -d '{"nama":"Hotel Baru","alamat":"Jl. Test","kabupaten_kota_id":1,"klasifikasi_hotel_id":4,"is_active":true}' \
     "https://api.ovisito.com/api/v2/admin/hotel/hotels"

# Update booking status
curl -X POST \
     -H "X-Client-ID: admin-web" \
     -H "X-Client-Secret: xxxxx" \
     -H "Authorization: Bearer <admin_token>" \
     -H "Content-Type: application/json" \
     -d '{"status":"confirmed"}' \
     "https://api.ovisito.com/api/v2/admin/hotel/booking-hotels/{id}/update-status"
```

### C. Perbandingan dengan Modul Lain

| Aspek | Hotel | Transport | Marketplace |
|---|---|---|---|
| Merchant panel | ❌ Tidak ada (admin only) | ✅ Ada | ✅ Ada |
| Customer booking | ⏠ Perlu dibuat | ✅ Ada | ✅ Ada |
| Public endpoint | ⏠ Perlu dibuat | ✅ Ada | ✅ Ada |
| Multi-item | ❌ 1 booking = 1 kamar | ✅ N tiket | ✅ N produk |
| Durasi | ✅ Multi-malam | ❌ Sekali jalan | ❌ Sekali kirim |
| Review | Per booking | Per booking | Per item |
| Kurir/Pengiriman | ❌ | ❌ | ✅ |
| Check-in | Di hotel (manual) | Scan QR di terminal | — |

### D. TODO — Endpoint yang Belum Ada

**Public (perlu dibuat):**

- [ ] `GET /public/hotel/hotels`
- [ ] `GET /public/hotel/hotels/{slug}`
- [ ] `GET /public/hotel/hotels/{hotelId}/rooms`
- [ ] `GET /public/hotel/hotels/{hotelId}/rooms/availability`
- [ ] `GET /public/hotel/klasifikasi-hotel`

**Customer (perlu dibuat):**

- [ ] `POST /customer/hotel/bookings`
- [ ] `GET /customer/hotel/bookings`
- [ ] `GET /customer/hotel/bookings/{code}`
- [ ] `POST /customer/hotel/bookings/{code}/pay`
- [ ] `GET /customer/hotel/bookings/{code}/payment-status`
- [ ] `POST /customer/hotel/bookings/{code}/cancel`
- [ ] `POST /customer/hotel/reviews`

---

**Maintainer:** Tim Backend Ovisito
**Kontak:** backend@ovisito.com

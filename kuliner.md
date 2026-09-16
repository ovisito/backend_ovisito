# Ovisito Kuliner API v2

> **File:** `docs/api/kuliner-api.md` · **Versi:** 2.2 · **Diperbarui:** 2026-09-16  
> **Maintainer:** Tim Backend Ovisito · **Kontak:** backend@ovisito.com

---

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
13. [Lampiran](#lampiran)

---

## 1. Overview

Modul Kuliner menyediakan REST API untuk pengelolaan ekosistem tempat makan di Ovisito, mencakup:

| Area | Deskripsi |
|---|---|
| **Public** | Cari tempat makan, lihat menu & kategori |
| **Customer** | Order makanan, reservasi tempat, beri review |
| **Admin** | Kelola tempat kuliner, menu, order, booking, dan review |

### Aktor & Guard

| Aktor | Guard | Login Endpoint |
|---|---|---|
| Customer | `auth:customer` | `POST /api/v2/auth/login` |
| Admin | `auth:admin_api` | `POST /api/v2/admin/login` |

> **Catatan:** Modul kuliner saat ini tidak memiliki merchant panel terpisah. Semua tempat makan dikelola oleh admin Ovisito.

### Base Path

| Lingkungan | URL |
|---|---|
| Production | `https://api.ovisito.com` |
| Sandbox | `https://staging.ovisito.com` |

| Guard | Path Prefix |
|---|---|
| Admin | `/api/v2/admin/kuliner/*` |
| Public | `/api/v2/public/kuliner/*` *(perlu dibuat)* |
| Customer | `/api/v2/customer/kuliner/*` *(perlu dibuat)* |

---

## 2. Autentikasi

Setiap request melewati dua layer autentikasi secara berurutan.

### Layer 1 — Client Auth *(wajib semua endpoint)*

| Header | Wajib | Keterangan |
|---|:---:|---|
| `X-Client-ID` | ✅ | ID aplikasi |
| `X-Client-Secret` | ✅ | Secret aplikasi |

### Layer 2 — Token User *(endpoint terproteksi)*

| Header | Wajib |
|---|:---:|
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
curl -X GET "https://api.ovisito.com/api/v2/public/kuliner/tempat-kuliner" \
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
  "data": {}
}
```

### Sukses dengan Pagination

```json
{
  "current_page": 1,
  "data": [],
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
| Public kuliner | 120 req/menit |
| Customer | 120 req/menit |
| Admin | 120 req/menit |

---

## 6. Endpoint — Public

**Base path:** `/api/v2/public/kuliner`  
**Middleware:** `client.auth`, `throttle:120,1`

> ⚠️ **Endpoint publik kuliner belum tersedia.** Yang ada saat ini hanya admin. Dokumentasi berikut adalah rekomendasi yang perlu diimplementasi.

---

### 6.1 List Tempat Kuliner ⭐

```http
GET /api/v2/public/kuliner/tempat-kuliner
```

**Query Parameters:**

| Param | Tipe | Default | Keterangan |
|---|---|:---:|---|
| `search` | string | — | Cari nama tempat |
| `kabupaten_kota_id` | int | — | Filter lokasi |
| `kategori_id` | int | — | Filter kategori (resto, cafe, dll) |
| `min_rating` | number | — | Rating minimum (1–5) |
| `harga` | enum | — | `murah`, `sedang`, `mahal` |
| `featured` | boolean | — | Tampilkan tempat unggulan |
| `is_signature` | boolean | — | Tampilkan menu signature |
| `sort` | enum | `popular` | `popular`, `rating`, `latest` |
| `page` | int | `1` | |
| `per_page` | int | `15` | |

**Contoh Request:**

```bash
GET /api/v2/public/kuliner/tempat-kuliner?kabupaten_kota_id=1&min_rating=4&sort=rating
```

**Response `200`:**

```json
{
  "current_page": 1,
  "data": [
    {
      "id": "uuid",
      "nama": "Resto Mie Aceh Tgk. Sabi",
      "slug": "resto-mie-aceh-tgk-sabi",
      "deskripsi": "Mie Aceh legendaris sejak 1970",
      "alamat": "Jl. Panglima Polem No. 5",
      "kabupaten_kota": { "id": 1, "nama": "Kota Banda Aceh" },
      "kategori": { "id": 1, "nama": "Restoran", "slug": "restoran" },
      "latitude": "5.54830000",
      "longitude": "95.32380000",
      "foto_utama": "kuliner/mie-sabi/main.jpg",
      "foto_urls": ["kuliner/mie-sabi/1.jpg", "kuliner/mie-sabi/2.jpg"],
      "rating_average": 4.7,
      "total_reviews": 1250,
      "harga_range": "Rp 25.000 - Rp 75.000",
      "harga_kategori": "murah",
      "jam_buka": "10:00",
      "jam_tutup": "22:00",
      "is_open_now": true,
      "is_featured": true,
      "is_signature": true
    }
  ],
  "per_page": 15,
  "total": 145,
  "last_page": 10
}
```

---

### 6.2 Detail Tempat Kuliner

```http
GET /api/v2/public/kuliner/tempat-kuliner/{slug}
```

**Response `200`:**

```json
{
  "data": {
    "id": "uuid",
    "nama": "Resto Mie Aceh Tgk. Sabi",
    "slug": "resto-mie-aceh-tgk-sabi",
    "deskripsi": "Mie Aceh legendaris sejak 1970",
    "alamat": "Jl. Panglima Polem No. 5, Banda Aceh",
    "kabupaten_kota": { "id": 1, "nama": "Kota Banda Aceh" },
    "kecamatan": { "id": 12, "nama": "Baiturrahman" },
    "kategori": { "id": 1, "nama": "Restoran", "slug": "restoran" },
    "latitude": "5.54830000",
    "longitude": "95.32380000",
    "phone": "0651-123456",
    "whatsapp": "6281234567890",
    "foto_urls": [
      "kuliner/mie-sabi/main.jpg",
      "kuliner/mie-sabi/interior.jpg",
      "kuliner/mie-sabi/menu.jpg"
    ],
    "fasilitas": ["wifi", "ac", "musholla", "parkir", "delivery"],
    "jam_operasional": [
      { "hari": "senin-minggu", "buka": "10:00", "tutup": "22:00" }
    ],
    "is_open_now": true,
    "rating_average": 4.7,
    "total_reviews": 1250,
    "rating_breakdown": {
      "rasa": 4.8,
      "pelayanan": 4.6,
      "kebersihan": 4.5,
      "harga": 4.7,
      "suasana": 4.6
    },
    "harga_range": "Rp 25.000 - Rp 75.000",
    "kategori_menu": [
      {
        "id": 1,
        "nama": "Mie Aceh",
        "menu_count": 8,
        "menus": [
          {
            "id": "uuid",
            "nama": "Mie Aceh Kepiting",
            "harga": "55000.00",
            "harga_formatted": "Rp 55.000",
            "foto_url": "kuliner/mie-sabi/menu/kepiting.jpg",
            "is_signature": true,
            "is_available": true
          }
        ]
      }
    ],
    "reviews": [
      {
        "id": "uuid",
        "rating": 5,
        "komentar": "Mie Aceh terenak di kota!",
        "user": { "uuid": "uuid", "nama": "Budi S." },
        "created_at": "2026-09-10T10:30:00Z"
      }
    ]
  }
}
```

---

### 6.3 List Kategori Menu

```http
GET /api/v2/public/kuliner/kategori-menu
```

**Response `200`:**

```json
{
  "data": [
    { "id": 1, "nama": "Mie Aceh", "slug": "mie-aceh", "icon": "🍜" },
    { "id": 2, "nama": "Kopi", "slug": "kopi", "icon": "☕" },
    { "id": 3, "nama": "Seafood", "slug": "seafood", "icon": "🦐" },
    { "id": 4, "nama": "Kue Traditional", "slug": "kue", "icon": "🍰" }
  ]
}
```

---

### 6.4 List Menu (Global)

```http
GET /api/v2/public/kuliner/menu
```

**Query Parameters:**

| Param | Tipe |
|---|---|
| `tempat_kuliner_id` | uuid |
| `kategori_menu_id` | int |
| `search` | string |
| `is_signature` | boolean |
| `min_price` | number |
| `max_price` | number |
| `sort` | `popular`, `price_asc`, `price_desc` |

**Response `200`:**

```json
{
  "current_page": 1,
  "data": [
    {
      "id": "uuid",
      "nama": "Mie Aceh Kepiting",
      "deskripsi": "Mie Aceh dengan kepiting segar",
      "harga": "55000.00",
      "harga_formatted": "Rp 55.000",
      "foto_url": "kuliner/menu/kepiting.jpg",
      "kategori_menu": { "id": 1, "nama": "Mie Aceh" },
      "tempat_kuliner": {
        "id": "uuid",
        "nama": "Resto Mie Aceh Tgk. Sabi",
        "slug": "resto-mie-aceh-tgk-sabi"
      },
      "is_signature": true,
      "is_available": true,
      "total_orders": 234
    }
  ]
}
```

---

### 6.5 Cari Menu

```http
GET /api/v2/public/kuliner/menu/search?q=mie
```

**Response `200`:**

```json
{
  "data": [
    {
      "menu_id": "uuid",
      "nama": "Mie Aceh Kepiting",
      "harga": "55000.00",
      "tempat_kuliner": { "nama": "Resto Mie Aceh Tgk. Sabi" }
    }
  ]
}
```

---

## 7. Endpoint — Customer

**Base path:** `/api/v2/customer/kuliner`  
**Middleware:** `client.auth`, `throttle:120,1`, `auth:customer`

> ⚠️ **Endpoint customer kuliner belum tersedia.** Rekomendasi di bawah ini perlu diimplementasi.

---

### 7.1 Order Kuliner

#### Buat Order

```http
POST /api/v2/customer/kuliner/orders
```

**Request Body:**

```json
{
  "tempat_kuliner_id": "uuid",
  "tipe_order": "delivery",
  "items": [
    { "menu_id": "uuid-1", "quantity": 2, "notes": "Pedas sedang" },
    { "menu_id": "uuid-2", "quantity": 1 }
  ],
  "delivery_address": {
    "name": "Budi Santoso",
    "phone": "081234567890",
    "address": "Jl. Merdeka No. 10",
    "city": "Banda Aceh",
    "postal_code": "23111",
    "notes": "Rumah pagar hijau"
  },
  "notes": "Tolong dibungkus rapi"
}
```

**Validasi:**

| Field | Wajib | Keterangan |
|---|:---:|---|
| `tempat_kuliner_id` | ✅ | ID tempat kuliner |
| `tipe_order` | ✅ | `dine_in`, `takeaway`, `delivery` |
| `items` | ✅ | Minimal 1 item |
| `items.*.menu_id` | ✅ | |
| `items.*.quantity` | ✅ | 1–20 |
| `delivery_address` | ✅* | Wajib jika `tipe_order=delivery` |

**Response `201`:**

```json
{
  "status": true,
  "message": "Order berhasil dibuat",
  "data": {
    "id": "uuid",
    "order_code": "KUL-20260916-ABCD12",
    "status": "pending",
    "payment_status": "unpaid",
    "tempat_kuliner": {
      "id": "uuid",
      "nama": "Resto Mie Aceh Tgk. Sabi"
    },
    "tipe_order": "delivery",
    "items": [
      {
        "id": "uuid",
        "menu": { "nama": "Mie Aceh Kepiting" },
        "quantity": 2,
        "harga": "55000.00",
        "subtotal": "110000.00"
      },
      {
        "id": "uuid",
        "menu": { "nama": "Es Teh Manis" },
        "quantity": 1,
        "harga": "8000.00",
        "subtotal": "8000.00"
      }
    ],
    "subtotal": "118000.00",
    "delivery_fee": "15000.00",
    "total": "133000.00",
    "formatted_total": "Rp 133.000",
    "estimated_time": "30-45 menit",
    "expired_at": "2026-09-16T11:00:00Z"
  }
}
```

#### List Order

```http
GET /api/v2/customer/kuliner/orders
```

**Query Parameters:** `status`, `page`, `per_page`

**Response `200`:**

```json
{
  "current_page": 1,
  "data": [
    {
      "id": "uuid",
      "order_code": "KUL-20260916-ABCD12",
      "status": "preparing",
      "formatted_status": "Sedang Disiapkan",
      "tipe_order": "delivery",
      "tempat_kuliner": { "nama": "Resto Mie Aceh Tgk. Sabi" },
      "total": "133000.00",
      "formatted_total": "Rp 133.000",
      "ordered_at": "2026-09-16T10:30:00Z"
    }
  ]
}
```

#### Detail Order

```http
GET /api/v2/customer/kuliner/orders/{order_code}
```

**Response `200`:**

```json
{
  "data": {
    "id": "uuid",
    "order_code": "KUL-20260916-ABCD12",
    "status": "delivery",
    "payment_status": "paid",
    "tempat_kuliner": {
      "id": "uuid",
      "nama": "Resto Mie Aceh Tgk. Sabi",
      "phone": "0651-123456",
      "alamat": "Jl. Panglima Polem No. 5"
    },
    "tipe_order": "delivery",
    "items": [
      {
        "id": "uuid",
        "menu": {
          "id": "uuid",
          "nama": "Mie Aceh Kepiting",
          "foto_url": "kuliner/menu/kepiting.jpg"
        },
        "quantity": 2,
        "harga": "55000.00",
        "subtotal": "110000.00",
        "notes": "Pedas sedang"
      }
    ],
    "subtotal": "118000.00",
    "delivery_fee": "15000.00",
    "total": "133000.00",
    "delivery_address": {
      "name": "Budi Santoso",
      "phone": "081234567890",
      "address": "Jl. Merdeka No. 10",
      "city": "Banda Aceh"
    },
    "courier": {
      "nama": "Andi",
      "phone": "081299998888"
    },
    "estimated_time": "30-45 menit",
    "paid_at": "2026-09-16T10:35:00Z",
    "ordered_at": "2026-09-16T10:30:00Z"
  }
}
```

#### Batalkan Order

```http
POST /api/v2/customer/kuliner/orders/{order_code}/cancel
```

**Request Body:**

```json
{ "reason": "Salah pesan" }
```

> **Error `422`:** Order tidak dapat dibatalkan pada status ini (sudah `preparing`).

#### Bayar Order

```http
POST /api/v2/customer/kuliner/orders/{order_code}/pay
```

**Request Body:**

```json
{ "payment_method": "qris" }
```

**Response `200`:**

```json
{
  "status": true,
  "data": {
    "payment_url": "https://flip.id/pay/xxxxx",
    "qr_url": "https://api.flip.id/qr/xxxxx",
    "bill_id": "12345",
    "expired_at": "2026-09-16T11:00:00Z"
  }
}
```

#### Lacak Order Delivery

```http
GET /api/v2/customer/kuliner/orders/{order_code}/track
```

**Response `200`:**

```json
{
  "order_code": "KUL-20260916-ABCD12",
  "status": "on_delivery",
  "formatted_status": "Dalam Perjalanan",
  "courier": {
    "nama": "Andi",
    "phone": "081299998888",
    "latitude": "5.54830000",
    "longitude": "95.32380000"
  },
  "estimated_arrival": "2026-09-16T11:15:00Z",
  "trackings": [
    { "status": "confirmed", "description": "Order dikonfirmasi", "timestamp": "..." },
    { "status": "preparing", "description": "Sedang disiapkan", "timestamp": "..." },
    { "status": "on_delivery", "description": "Dalam perjalanan", "timestamp": "..." }
  ]
}
```

---

### 7.2 Reservasi Tempat

#### Buat Reservasi

```http
POST /api/v2/customer/kuliner/reservations
```

**Request Body:**

```json
{
  "tempat_kuliner_id": "uuid",
  "tanggal_reservasi": "2026-09-20",
  "waktu_reservasi": "19:00",
  "jumlah_orang": 4,
  "nama_pemesan": "Budi Santoso",
  "nomor_telepon": "081234567890",
  "email": "budi@example.com",
  "special_request": "Meja dekat jendela"
}
```

**Validasi:**

| Field | Wajib | Keterangan |
|---|:---:|---|
| `tempat_kuliner_id` | ✅ | |
| `tanggal_reservasi` | ✅ | ≥ hari ini |
| `waktu_reservasi` | ✅ | Format `HH:MM` |
| `jumlah_orang` | ✅ | 1–20 |
| `nama_pemesan` | ✅ | |
| `nomor_telepon` | ✅ | |

**Response `201`:**

```json
{
  "status": true,
  "message": "Reservasi berhasil dibuat",
  "data": {
    "id": "uuid",
    "reservation_code": "RSV-20260916-ABCD12",
    "status": "pending",
    "tempat_kuliner": {
      "id": "uuid",
      "nama": "Resto Mie Aceh Tgk. Sabi"
    },
    "tanggal_reservasi": "2026-09-20",
    "waktu_reservasi": "19:00",
    "jumlah_orang": 4,
    "nama_pemesan": "Budi Santoso",
    "nomor_telepon": "081234567890"
  }
}
```

#### Endpoint Reservasi Lainnya

| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/reservations` | List reservasi customer |
| `GET` | `/reservations/{reservation_code}` | Detail reservasi |
| `POST` | `/reservations/{reservation_code}/cancel` | Batalkan reservasi |

**Body cancel:**
```json
{ "reason": "Rencana berubah" }
```

---

### 7.3 Review

#### Buat Review

```http
POST /api/v2/customer/kuliner/reviews
```

**Request Body:**

```json
{
  "tempat_kuliner_id": "uuid",
  "order_id": "uuid",
  "rating": 5,
  "komentar": "Mie Aceh terenak di kota!",
  "aspects": {
    "rasa": 5,
    "pelayanan": 5,
    "kebersihan": 4,
    "harga": 5,
    "suasana": 4
  },
  "foto": ["reviews/mie-1.jpg", "reviews/mie-2.jpg"]
}
```

**Aturan:**
- Order harus berstatus `completed`
- 1 order hanya dapat memberikan 1 review

**Response `201`:**

```json
{
  "status": true,
  "message": "Review berhasil dikirim",
  "data": {
    "id": "uuid",
    "rating": 5,
    "komentar": "Mie Aceh terenak di kota!",
    "is_verified_purchase": true,
    "created_at": "2026-09-16T11:00:00Z"
  }
}
```

#### Endpoint Review Lainnya

| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/reviews` | List review milik customer |
| `PUT` | `/reviews/{id}` | Update review |
| `DELETE` | `/reviews/{id}` | Hapus review |

---

## 8. Endpoint — Admin

**Base path:** `/api/v2/admin/kuliner`  
**Middleware:** `client.auth`, `throttle:120,1`, `auth:admin_api`, `admin`

---

### 8.1 Tempat Kuliner

#### Endpoints

| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/tempat-kuliner` | List semua tempat kuliner |
| `GET` | `/tempat-kuliner/stats` | Statistik ringkas |
| `GET` | `/tempat-kuliner/quick-stats` | Quick stats |
| `GET` | `/tempat-kuliner/top-restaurants` | Top restoran |
| `GET` | `/tempat-kuliner/{id}` | Detail (slug atau ID) |
| `POST` | `/tempat-kuliner` | Buat tempat kuliner |
| `PUT` | `/tempat-kuliner/{id}` | Update |
| `DELETE` | `/tempat-kuliner/{id}` | Hapus |
| `POST` | `/tempat-kuliner/{id}/toggle-status` | Aktif/nonaktif |
| `POST` | `/tempat-kuliner/{id}/toggle-featured` | Unggulan on/off |

**Query Parameters — List:**

| Param | Tipe |
|---|---|
| `search` | string |
| `kabupaten_kota_id` | int |
| `kategori_id` | int |
| `featured` | boolean |
| `status` | `active`, `inactive` |
| `page` | int |
| `per_page` | int |

**Response — Stats `200`:**

```json
{
  "data": {
    "total": 145,
    "active": 140,
    "featured": 15,
    "signature": 32,
    "total_menus": 1250,
    "total_orders_this_month": 2450
  }
}
```

**Request Body — Create:**

```json
{
  "nama": "Resto Mie Aceh Tgk. Sabi",
  "deskripsi": "Mie Aceh legendaris sejak 1970",
  "alamat": "Jl. Panglima Polem No. 5",
  "kabupaten_kota_id": 1,
  "kecamatan_id": 12,
  "kategori_id": 1,
  "latitude": 5.5483,
  "longitude": 95.3238,
  "phone": "0651-123456",
  "whatsapp": "6281234567890",
  "email": "info@miesabi.com",
  "jam_buka": "10:00",
  "jam_tutup": "22:00",
  "fasilitas": ["wifi", "ac", "musholla", "parkir", "delivery"],
  "harga_range": "Rp 25.000 - Rp 75.000",
  "is_featured": true,
  "is_signature": true,
  "is_active": true
}
```

---

### 8.2 Kategori Menu

| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/kategori-menu` | List |
| `POST` | `/kategori-menu` | Buat |
| `GET` | `/kategori-menu/{id}` | Detail |
| `PUT` | `/kategori-menu/{id}` | Update |
| `DELETE` | `/kategori-menu/{id}` | Hapus |

**Request Body — Create:**

```json
{
  "nama": "Mie Aceh",
  "slug": "mie-aceh",
  "icon": "🍜",
  "deskripsi": "Aneka mie khas Aceh",
  "is_active": true
}
```

---

### 8.3 Menu

#### Endpoints

| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/menu` | List |
| `GET` | `/menu/stats` | Statistik menu |
| `POST` | `/menu` | Buat menu |
| `GET` | `/menu/{id}` | Detail |
| `PUT` | `/menu/{id}` | Update |
| `DELETE` | `/menu/{id}` | Hapus |
| `POST` | `/menu/{id}/toggle-availability` | Ketersediaan on/off |
| `POST` | `/menu/{id}/toggle-signature` | Signature on/off |

**Query Parameters — List:**

| Param | Tipe |
|---|---|
| `tempat_kuliner_id` | uuid |
| `kategori_menu_id` | int |
| `search` | string |
| `is_signature` | boolean |
| `is_available` | boolean |

**Response — Stats `200`:**

```json
{
  "data": {
    "total_menus": 1250,
    "available": 1200,
    "out_of_stock": 50,
    "signature": 145,
    "top_selling": [
      { "menu_id": "uuid", "nama": "Mie Aceh Kepiting", "total_orders": 234 }
    ]
  }
}
```

**Request Body — Create:**

```json
{
  "tempat_kuliner_id": "uuid",
  "kategori_menu_id": 1,
  "nama": "Mie Aceh Kepiting",
  "deskripsi": "Mie Aceh dengan kepiting segar",
  "harga": 55000,
  "foto": "kuliner/menu/kepiting.jpg",
  "is_signature": true,
  "is_available": true,
  "stok_harian": 50,
  "waktu_preparasi_menit": 15
}
```

---

### 8.4 Order

#### Endpoints

| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/orders` | List order |
| `GET` | `/orders/stats` | Statistik order |
| `GET` | `/orders/revenue-trends` | Tren revenue |
| `GET` | `/orders/{order}` | Detail order |
| `PUT` | `/orders/{order}` | Update order |
| `DELETE` | `/orders/{order}` | Hapus order |
| `POST` | `/orders/{id}/update-status` | Update status order |

**Query Parameters — List:**

| Param | Tipe |
|---|---|
| `status` | enum |
| `payment_status` | enum |
| `tipe_order` | `dine_in`, `takeaway`, `delivery` |
| `tempat_kuliner_id` | uuid |
| `date_from` | date |
| `date_to` | date |
| `search` | string (order_code) |

**Query Parameters — Revenue Trends:**

| Param | Nilai |
|---|---|
| `period` | `7d`, `30d`, `90d`, `1y` |

**Response — Stats `200`:**

```json
{
  "data": {
    "total_orders": 2450,
    "orders_today": 85,
    "revenue_this_month": "85000000.00",
    "average_order_value": "95000.00",
    "delivery_orders": 1200,
    "dine_in_orders": 800,
    "takeaway_orders": 450
  }
}
```

**Request Body — Update Status:**

```json
{
  "status": "preparing",
  "notes": "Sedang disiapkan"
}
```

**Alur Status Order:**

```
pending → confirmed → preparing → ready → on_delivery → delivered → completed
                                ↘ cancelled
```

---

### 8.5 Review

#### Endpoints

| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/reviews` | List review |
| `GET` | `/reviews/stats` | Statistik review |
| `POST` | `/reviews` | Buat review manual |
| `GET` | `/reviews/{review}` | Detail |
| `PUT` | `/reviews/{review}` | Update |
| `DELETE` | `/reviews/{review}` | Hapus |
| `POST` | `/reviews/{id}/toggle-active` | Aktif/nonaktif |
| `POST` | `/reviews/{id}/verify` | Verifikasi review |

**Query Parameters — List:**

| Param | Tipe |
|---|---|
| `tempat_kuliner_id` | uuid |
| `rating` | int (1–5) |
| `is_active` | boolean |
| `is_verified` | boolean |
| `page` | int |

**Response — Stats `200`:**

```json
{
  "data": {
    "total_reviews": 3450,
    "average_rating": 4.5,
    "rating_breakdown": {
      "5": 2000,
      "4": 1000,
      "3": 300,
      "2": 100,
      "1": 50
    },
    "verified_reviews": 2800
  }
}
```

---

### 8.6 Booking Kuliner (Reservasi)

| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/booking-kuliner` | List booking |
| `GET` | `/booking-kuliner/stats` | Statistik booking |
| `GET` | `/booking-kuliner/{booking_kuliner}` | Detail |
| `PUT` | `/booking-kuliner/{booking_kuliner}` | Update |
| `DELETE` | `/booking-kuliner/{booking_kuliner}` | Hapus |
| `POST` | `/booking-kuliner/{id}/update-status` | Update status |

**Query Parameters — List:** `status`, `date_from`, `date_to`, `search`

**Request Body — Update Status:**

```json
{
  "status": "confirmed",
  "notes": "Meja sudah disiapkan"
}
```

---

## 9. Webhook

### Flip Payment Webhook

```http
POST /api/webhook/flip
```

**Request Body:**

```json
{
  "id": 12345,
  "bill_id": 12345,
  "status": "SUCCESSFUL",
  "amount": 133000,
  "reference_id": "KUL-20260916-ABCD12",
  "sender_bank": "bca",
  "sender_name": "Budi Santoso",
  "payment_method": "qris"
}
```

**Efek berdasarkan status:**

| Status Flip | Aksi |
|---|---|
| `SUCCESSFUL` | Order → `paid`, `payment_status` → `paid`, kirim notifikasi ke customer & resto |
| `FAILED` | `payment_status` → `failed` |
| `EXPIRED` | `payment_status` → `failed` |

---

## 10. Error Codes

### HTTP Status Code

| Code | Keterangan |
|:---:|---|
| `200` | Sukses |
| `201` | Berhasil create |
| `400` | Bad request |
| `401` | Unauthenticated |
| `403` | Forbidden |
| `404` | Resource tidak ditemukan |
| `410` | Gone (kadaluarsa) |
| `422` | Validasi gagal |
| `429` | Rate limit |
| `500` | Server error |

### Pesan Error Umum

| Pesan | Penyebab |
|---|---|
| `Client credentials required` | Header tidak ada |
| `Invalid client credentials` | Client ID/Secret salah |
| `Unauthenticated.` | Token tidak valid |
| `Menu tidak tersedia` | Menu di-nonaktifkan |
| `Stok menu habis` | Stok harian habis |
| `Resto sedang tutup` | Di luar jam operasional |
| `Minimum order belum terpenuhi` | Di bawah batas minimum |
| `Alamat pengiriman di luar jangkauan` | Di luar radius delivery |
| `Order tidak dapat dibatalkan` | Sudah diproses |
| `Waktu reservasi sudah lewat` | Reservasi kadaluarsa |

---

## 11. Status Enum

### Order Status

| Status | Label | Badge |
|---|---|---|
| `pending` | Menunggu Konfirmasi | `bg-yellow-100 text-yellow-800` |
| `confirmed` | Dikonfirmasi | `bg-blue-100 text-blue-800` |
| `preparing` | Sedang Disiapkan | `bg-indigo-100 text-indigo-800` |
| `ready` | Siap Diambil | `bg-purple-100 text-purple-800` |
| `on_delivery` | Dalam Perjalanan | `bg-orange-100 text-orange-800` |
| `delivered` | Sudah Diantar | `bg-teal-100 text-teal-800` |
| `completed` | Selesai | `bg-green-100 text-green-800` |
| `cancelled` | Dibatalkan | `bg-red-100 text-red-800` |

### Payment Status

| Status | Label |
|---|---|
| `unpaid` | Belum Dibayar |
| `paid` | Sudah Dibayar |
| `failed` | Gagal |
| `refunded` | Direfund |

### Tipe Order

| Tipe | Label |
|---|---|
| `dine_in` | Makan di Tempat |
| `takeaway` | Bawa Pulang |
| `delivery` | Diantar |

### Kategori Harga

| Kategori | Range |
|---|---|
| `murah` | < Rp 50.000 |
| `sedang` | Rp 50.000 – Rp 150.000 |
| `mahal` | > Rp 150.000 |

### Status Reservasi

| Status | Label |
|---|---|
| `pending` | Menunggu Konfirmasi |
| `confirmed` | Terkonfirmasi |
| `seated` | Sudah Duduk |
| `completed` | Selesai |
| `cancelled` | Dibatalkan |
| `no_show` | Tidak Datang |

---

## 12. Changelog

| Versi | Tanggal | Perubahan |
|---|---|---|
| 1.0 | 2025-01 | Rilis awal — admin tempat kuliner & menu |
| 2.0 | 2026-05 | Tambah order & review |
| 2.1 | 2026-08 | Tambah booking/reservasi |
| 2.2 | 2026-09-16 | Dokumentasi lengkap |

---

## Lampiran

### A. Alur Lengkap Customer — Order

```
1. Cari tempat kuliner
   GET /api/v2/public/kuliner/tempat-kuliner?kabupaten_kota_id=1&min_rating=4

2. Lihat detail + menu
   GET /api/v2/public/kuliner/tempat-kuliner/resto-mie-aceh-tgk-sabi

3. Login
   POST /api/v2/auth/login

4. Buat order
   POST /api/v2/customer/kuliner/orders
   → Response: order_code

5. Bayar
   POST /api/v2/customer/kuliner/orders/{code}/pay
   → Response: payment_url

6. Bayar di Flip (QR / VA / e-wallet)

7. Flip kirim webhook
   POST /api/webhook/flip
   → Order status: paid

8. Admin konfirmasi & proses
   POST /api/v2/admin/kuliner/orders/{id}/update-status { status: "preparing" }

9. Kirim (jika delivery)
   POST /api/v2/admin/kuliner/orders/{id}/update-status { status: "on_delivery" }

10. Customer terima
    POST /api/v2/admin/kuliner/orders/{id}/update-status { status: "delivered" }

11. Complete & review
    POST /api/v2/admin/kuliner/orders/{id}/update-status { status: "completed" }
    POST /api/v2/customer/kuliner/reviews
```

---

### B. Alur Lengkap Customer — Reservasi

```
1. Cari tempat kuliner
   GET /api/v2/public/kuliner/tempat-kuliner

2. Lihat detail
   GET /api/v2/public/kuliner/tempat-kuliner/{slug}

3. Login
   POST /api/v2/auth/login

4. Buat reservasi
   POST /api/v2/customer/kuliner/reservations
   → Response: reservation_code

5. Resto konfirmasi
   POST /api/v2/admin/kuliner/booking-kuliner/{id}/update-status { status: "confirmed" }

6. Customer datang & duduk
   POST /api/v2/admin/kuliner/booking-kuliner/{id}/update-status { status: "seated" }

7. Selesai
   POST /api/v2/admin/kuliner/booking-kuliner/{id}/update-status { status: "completed" }
```

---

### C. Contoh cURL Lengkap

```bash
# ═══════════════════════════════════════════════════════
# PUBLIC
# ═══════════════════════════════════════════════════════

# List tempat kuliner
curl -H "X-Client-ID: shop-web" \
     -H "X-Client-Secret: xxxxx" \
     "https://api.ovisito.com/api/v2/public/kuliner/tempat-kuliner?kabupaten_kota_id=1&sort=rating"

# Detail tempat kuliner
curl -H "X-Client-ID: shop-web" \
     -H "X-Client-Secret: xxxxx" \
     "https://api.ovisito.com/api/v2/public/kuliner/tempat-kuliner/resto-mie-aceh-tgk-sabi"

# List menu signature
curl -H "X-Client-ID: shop-web" \
     -H "X-Client-Secret: xxxxx" \
     "https://api.ovisito.com/api/v2/public/kuliner/menu?tempat_kuliner_id=uuid&is_signature=true"

# ═══════════════════════════════════════════════════════
# CUSTOMER
# ═══════════════════════════════════════════════════════

# Order makanan
curl -X POST \
     -H "X-Client-ID: shop-web" \
     -H "X-Client-Secret: xxxxx" \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{
       "tempat_kuliner_id": "uuid",
       "tipe_order": "delivery",
       "items": [{ "menu_id": "uuid", "quantity": 2 }],
       "delivery_address": { "name": "Budi", "phone": "0812...", "address": "Jl. Merdeka 10", "city": "Banda Aceh" }
     }' \
     "https://api.ovisito.com/api/v2/customer/kuliner/orders"

# Buat reservasi
curl -X POST \
     -H "X-Client-ID: shop-web" \
     -H "X-Client-Secret: xxxxx" \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{
       "tempat_kuliner_id": "uuid",
       "tanggal_reservasi": "2026-09-20",
       "waktu_reservasi": "19:00",
       "jumlah_orang": 4,
       "nama_pemesan": "Budi Santoso",
       "nomor_telepon": "081234567890"
     }' \
     "https://api.ovisito.com/api/v2/customer/kuliner/reservations"

# ═══════════════════════════════════════════════════════
# ADMIN
# ═══════════════════════════════════════════════════════

# List tempat kuliner
curl -H "X-Client-ID: admin-web" \
     -H "X-Client-Secret: xxxxx" \
     -H "Authorization: Bearer <admin_token>" \
     "https://api.ovisito.com/api/v2/admin/kuliner/tempat-kuliner"

# Stats tempat kuliner
curl -H "X-Client-ID: admin-web" \
     -H "X-Client-Secret: xxxxx" \
     -H "Authorization: Bearer <admin_token>" \
     "https://api.ovisito.com/api/v2/admin/kuliner/tempat-kuliner/stats"

# Create menu
curl -X POST \
     -H "X-Client-ID: admin-web" \
     -H "X-Client-Secret: xxxxx" \
     -H "Authorization: Bearer <admin_token>" \
     -H "Content-Type: application/json" \
     -d '{
       "tempat_kuliner_id": "uuid",
       "nama": "Mie Aceh Kepiting",
       "harga": 55000,
       "is_signature": true
     }' \
     "https://api.ovisito.com/api/v2/admin/kuliner/menu"

# Update status order
curl -X POST \
     -H "X-Client-ID: admin-web" \
     -H "X-Client-Secret: xxxxx" \
     -H "Authorization: Bearer <admin_token>" \
     -H "Content-Type: application/json" \
     -d '{ "status": "preparing" }' \
     "https://api.ovisito.com/api/v2/admin/kuliner/orders/{id}/update-status"
```

---

### D. Perbandingan Modul

| Aspek | Kuliner | Hotel | Transport | Marketplace |
|---|:---:|:---:|:---:|:---:|
| Merchant panel | ❌ | ❌ | ✅ | ✅ |
| Tipe order | dine_in / takeaway / delivery | Per malam | Per jalan | Per kirim |
| Multi-item | ✅ | ❌ | ✅ | ✅ |
| Reservasi | ✅ | ✅ | ❌ | ❌ |
| Delivery | ✅ Internal | ❌ | ❌ | ✅ Eksternal |
| Katalog menu | ✅ | ❌ | ❌ | ✅ |
| Rating aspek | ✅ Rasa, pelayanan, dll | ✅ Kebersihan, dll | ❌ | ❌ |

---

### E. TODO — Endpoint yang Belum Diimplementasi

**Public** *(perlu dibuat):*
- [ ] `GET /public/kuliner/tempat-kuliner`
- [ ] `GET /public/kuliner/tempat-kuliner/{slug}`
- [ ] `GET /public/kuliner/kategori-menu`
- [ ] `GET /public/kuliner/menu`
- [ ] `GET /public/kuliner/menu/search`

**Customer** *(perlu dibuat):*
- [ ] `POST /customer/kuliner/orders`
- [ ] `GET  /customer/kuliner/orders`
- [ ] `GET  /customer/kuliner/orders/{code}`
- [ ] `POST /customer/kuliner/orders/{code}/pay`
- [ ] `POST /customer/kuliner/orders/{code}/cancel`
- [ ] `GET  /customer/kuliner/orders/{code}/track`
- [ ] `POST /customer/kuliner/reservations`
- [ ] `GET  /customer/kuliner/reservations`
- [ ] `POST /customer/kuliner/reviews`

---

*Dokumentasi ini dikelola oleh Tim Backend Ovisito. Pertanyaan dan kontribusi: **backend@ovisito.com***

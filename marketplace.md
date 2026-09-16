# Ovisito Marketplace API

**REST API Documentation · Modul Shop / Marketplace**

REST API untuk modul marketplace souvenir (katalog produk, pesanan, review, pengiriman).

| | |
|---|---|
| **File** | `docs/api/shop-marketplace-api.md` |
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
14. [Perbedaan Transport vs Marketplace](#14-perbedaan-transport-vs-marketplace)

---

## 1. Overview

Modul Marketplace menyediakan API untuk:

| Aktor | Cakupan |
|---|---|
| **Public** | Katalog produk, kategori, toko, ongkir |
| **Customer** | Checkout, pesanan, review |
| **Merchant** | Kelola produk, pesanan, toko, transaksi |
| **Admin** | Kelola semua master data & verifikasi |

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
curl -X GET "https://api.ovisito.com/api/v2/public/souvenir/products" \
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
  "current_page": 1,
  "data": [ "..." ],
  "per_page": 12,
  "total": 145,
  "last_page": 13
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
| Public souvenir | 120 req/menit |
| Customer, Merchant, Admin | 120 req/menit |

**Header response**

```http
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 118
```

---

## 6. Endpoint — Public

> **Base path:** `/api/v2/public/souvenir` · **Middleware:** `client.auth`, `throttle:120,1`

### 6.1 List Produk ⭐

```http
GET /api/v2/public/souvenir/products
```

**Query Params**

| Param | Tipe | Default | Keterangan |
|---|---|---|---|
| `search` | string | — | Cari nama & deskripsi |
| `category` | string | — | Slug atau ID kategori (auto-include children) |
| `store_id` | string | — | Filter per toko |
| `merchant_uuid` | string | — | Filter per merchant |
| `min_price` | number | — | Minimal harga |
| `max_price` | number | — | Maksimal harga |
| `featured` | boolean | — | Hanya produk unggulan |
| `in_stock` | boolean | — | Hanya yang stok > 0 |
| `sort` | enum | `latest` | `latest`, `price_asc`, `price_desc`, `popular` |
| `page` | int | `1` | — |
| `per_page` | int | `12` | Maks `60` |

**Request**

```bash
GET /api/v2/public/souvenir/products?search=kopi&sort=price_asc&per_page=20
```

**Response**

```json
{
  "current_page": 1,
  "data": [
    {
      "id": "uuid",
      "name": "Kopi Gayo Premium",
      "slug": "kopi-gayo-premium",
      "description": "Kopi arabika single origin...",
      "price": "85000.00",
      "discount_price": "75000.00",
      "final_price": 75000,
      "is_discount": true,
      "stock": 45,
      "weight": "500.00",
      "images": ["products/kopi-1.jpg", "products/kopi-2.jpg"],
      "is_active": true,
      "featured": true,
      "views": 230,
      "category": { "id": "uuid", "name": "Kopi", "slug": "kopi" },
      "store": {
        "id": "uuid",
        "name": "Toko Kopi Aceh",
        "slug": "toko-kopi-aceh"
      }
    }
  ],
  "per_page": 20,
  "total": 48,
  "last_page": 3
}
```

### 6.2 Detail Produk

```http
GET /api/v2/public/souvenir/products/{slug}
```

**Response**

```json
{
  "data": {
    "id": "uuid",
    "name": "Kopi Gayo Premium",
    "slug": "kopi-gayo-premium",
    "description": "...",
    "final_price": 75000,
    "is_discount": true,
    "stock": 45,
    "weight": "500.00",
    "images": ["products/kopi-1.jpg"],
    "category": { "id": "uuid", "name": "Kopi", "slug": "kopi" },
    "store": {
      "id": "uuid",
      "name": "Toko Kopi Aceh",
      "slug": "toko-kopi-aceh",
      "logo_url": "https://...",
      "is_physical": true
    },
    "merchant": {
      "uuid": "uuid-merchant",
      "name": "CV Kopi Nusantara"
    },
    "reviews": [
      {
        "id": "uuid",
        "rating": 5,
        "review": "Produk bagus!",
        "user": { "uuid": "uuid", "name": "Budi S." },
        "created_at": "2026-09-15T10:30:00Z"
      }
    ]
  },
  "related": [
    { "id": "uuid", "name": "Kopi Gayo Light", "slug": "...", "final_price": 65000 }
  ]
}
```

### 6.3 Produk Unggulan

```http
GET /api/v2/public/souvenir/featured
```

Query Params: `limit` (default `8`, maks `24`)

### 6.4 List Kategori

```http
GET /api/v2/public/souvenir/categories
```

**Query Params**

| Param | Tipe | Default | Keterangan |
|---|---|---|---|
| `with_children` | boolean | `true` | Include sub-kategori |
| `only_parents` | boolean | `true` | Hanya root |

**Response**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Makanan & Minuman",
      "slug": "makanan-minuman",
      "children": [
        { "id": "uuid", "name": "Kopi", "slug": "kopi" },
        { "id": "uuid", "name": "Cokelat", "slug": "cokelat" }
      ]
    }
  ]
}
```

### 6.5 Detail Kategori

```http
GET /api/v2/public/souvenir/categories/{slug}
```

Response: Detail kategori + produk di dalamnya.

### 6.6 List Toko

```http
GET /api/v2/public/souvenir/stores
```

**Query Params**

| Param | Tipe |
|---|---|
| `search` | string |
| `kabupaten_id` | int |
| `physical` | boolean |

### 6.7 Detail Toko

```http
GET /api/v2/public/souvenir/stores/{slug}
```

**Response**

```json
{
  "data": {
    "id": "uuid",
    "name": "Toko Kopi Aceh",
    "slug": "toko-kopi-aceh",
    "description": "...",
    "address": "Jl. ...",
    "full_address": "Jl. ..., Banda Aceh",
    "logo_url": "https://...",
    "is_physical": true,
    "is_default": true,
    "operational_hours": "08:00 - 17:00",
    "kabupatenKota": { "id": 1, "nama": "Kota Banda Aceh" }
  },
  "products": {
    "current_page": 1,
    "data": [ "..." ],
    "total": 24
  }
}
```

### 6.8 List Metode Pengiriman

```http
GET /api/v2/public/souvenir/shipping-methods
```

**Response**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "JNE Reguler",
      "courier_code": "jne",
      "description": "Estimasi 2-3 hari",
      "base_cost": "15000.00",
      "is_active": true
    },
    {
      "id": "uuid",
      "name": "J&T Express",
      "courier_code": "jnt",
      "base_cost": "18000.00"
    }
  ]
}
```

### 6.9 Kalkulasi Ongkir

```http
POST /api/v2/public/souvenir/shipping-methods/calculate
```

**Body**

```json
{
  "weight": 500,
  "method_id": "uuid"
}
```

**Response**

```json
{
  "data": {
    "method": "JNE Reguler",
    "courier_code": "jne",
    "weight": 500,
    "cost": 15500,
    "cost_formatted": "Rp 15.500"
  }
}
```

---

## 7. Endpoint — Customer

> **Base path:** `/api/v2/customer` · **Middleware:** `client.auth`, `throttle:120,1`, `auth:customer`

### 7.1 List Pesanan

```http
GET /api/v2/customer/orders
```

**Query Params**

| Param | Tipe |
|---|---|
| `status` | enum: `pending`, `paid`, `processing`, `shipped`, `completed`, `cancelled` |
| `payment_status` | enum |
| `page` | int |
| `per_page` | int |

**Response**

```json
{
  "current_page": 1,
  "data": [
    {
      "id": "uuid",
      "order_number": "SO-20260916-ABCD1234",
      "status": "paid",
      "formatted_status": "Dibayar",
      "status_badge_class": "bg-blue-100 text-blue-800",
      "payment_status": "paid",
      "total_amount": "200000.00",
      "shipping_cost": "18000.00",
      "formatted_total_amount": "Rp 200.000",
      "formatted_shipping_cost": "Rp 18.000",
      "grand_total": 218000,
      "merchant": { "uuid": "uuid", "name": "CV Kopi Nusantara" },
      "items": [
        {
          "id": "uuid",
          "product_name": "Kopi Gayo Premium",
          "quantity": 2,
          "price": "75000.00",
          "subtotal": "150000.00"
        }
      ],
      "ordered_at": "2026-09-16T10:30:00Z"
    }
  ]
}
```

### 7.2 Buat Pesanan (Checkout)

```http
POST /api/v2/customer/orders
```

**Body**

```json
{
  "merchant_uuid": "uuid-merchant",
  "shipping_method_id": "uuid-method",
  "shipping_address": {
    "name": "Budi Santoso",
    "phone": "081234567890",
    "address": "Jl. Merdeka No. 10",
    "city": "Banda Aceh",
    "postal_code": "23111"
  },
  "notes": "Tolong dibungkus rapi",
  "items": [
    { "product_uuid": "uuid-produk-1", "quantity": 2 },
    { "product_uuid": "uuid-produk-2", "quantity": 1 }
  ]
}
```

**Validasi**

| Field | Wajib | Keterangan |
|---|---|---|
| `merchant_uuid` | ✅ | Semua item harus dari merchant ini |
| `shipping_method_id` | ✅ | Metode pengiriman |
| `shipping_address.name` | ✅ | Nama penerima |
| `shipping_address.phone` | ✅ | Telepon |
| `shipping_address.address` | ✅ | Alamat lengkap |
| `shipping_address.city` | ✅ | Kota |
| `items` | ✅ | Min 1 item |
| `items.*.product_uuid` | ✅ | ID produk |
| `items.*.quantity` | ✅ | Min 1 |

**Response 201**

```json
{
  "status": true,
  "message": "Order berhasil dibuat",
  "data": {
    "id": "uuid",
    "order_number": "SO-20260916-ABCD1234",
    "status": "pending",
    "payment_status": "unpaid",
    "total_amount": "200000.00",
    "shipping_cost": "18000.00",
    "discount_total": "0.00",
    "grand_total": 218000,
    "items": [
      {
        "id": "uuid",
        "product_uuid": "uuid-produk-1",
        "product_name": "Kopi Gayo Premium",
        "quantity": 2,
        "price": "75000.00",
        "subtotal": "150000.00"
      }
    ],
    "ordered_at": "2026-09-16T10:30:00Z"
  }
}
```

**Error 422**

```json
{ "message": "Stok produk Kopi Gayo Premium tidak mencukupi." }
```

Error lain: *Produk ... bukan dari merchant yang dipilih (mixed merchant)* · *Alamat pengiriman tidak lengkap*

### 7.3 Detail Pesanan

```http
GET /api/v2/customer/orders/{order_number}
```

Path `{order_number}` = format `SO-YYYYMMDD-XXXXXXXX`.

**Response**

```json
{
  "data": {
    "id": "uuid",
    "order_number": "SO-20260916-ABCD1234",
    "status": "shipped",
    "payment_status": "paid",
    "total_amount": "200000.00",
    "shipping_cost": "18000.00",
    "grand_total": 218000,
    "shipping_address": {
      "name": "Budi Santoso",
      "phone": "081234567890",
      "address": "Jl. Merdeka No. 10",
      "city": "Banda Aceh",
      "postal_code": "23111"
    },
    "courier": "jne",
    "tracking_number": "JNE123456789",
    "shipped_at": "2026-09-17T10:00:00Z",
    "estimated_delivery_at": "2026-09-20T10:00:00Z",
    "items": [
      {
        "id": "uuid",
        "product": {
          "id": "uuid",
          "name": "Kopi Gayo Premium",
          "slug": "kopi-gayo-premium",
          "images": ["products/kopi-1.jpg"]
        },
        "quantity": 2,
        "price": "75000.00",
        "subtotal": "150000.00"
      }
    ],
    "merchant": { "uuid": "uuid", "name": "CV Kopi Nusantara" },
    "shipping_trackings": [
      {
        "status": "shipped",
        "description": "Paket dikirim via JNE",
        "location": "Banda Aceh",
        "tracked_at": "2026-09-17T10:00:00Z"
      }
    ]
  }
}
```

### 7.4 Batalkan Pesanan

```http
POST /api/v2/customer/orders/{order_number}/cancel
```

**Body**

```json
{ "reason": "Salah pilih ukuran" }
```

**Response**

```json
{
  "status": true,
  "message": "Pesanan dibatalkan.",
  "data": {
    "order_number": "SO-20260916-ABCD1234",
    "status": "cancelled",
    "cancelled_at": "2026-09-16T11:00:00Z"
  }
}
```

Error 422: Pesanan tidak dapat dibatalkan pada status ini (sudah `shipped`).

### 7.5 Lacak Pesanan

```http
GET /api/v2/customer/orders/{order_number}/track
```

```json
{
  "order_number": "SO-20260916-ABCD1234",
  "status": "shipped",
  "formatted_status": "Dikirim",
  "courier": "jne",
  "tracking_number": "JNE123456789",
  "trackings": [
    {
      "status": "shipped",
      "description": "Paket dikirim via JNE",
      "location": "Banda Aceh",
      "tracked_at": "2026-09-17T10:00:00Z"
    },
    {
      "status": "in_transit",
      "description": "Paket dalam perjalanan ke Medan",
      "location": "Lhokseumawe",
      "tracked_at": "2026-09-18T08:00:00Z"
    }
  ]
}
```

### 7.6 Bayar Pesanan

```http
POST /api/v2/customer/payment/process
```

**Body**

```json
{ "booking_code": "SO-20260916-ABCD1234" }
```

**Response**

```json
{
  "data": {
    "payment_url": "https://flip.id/pay/xxxxx",
    "qr_url": "https://api.flip.id/qr/xxxxx",
    "bill_id": "12345"
  }
}
```

### 7.7 Cek Status Pembayaran

```http
GET /api/v2/customer/payment/status/{bookingCode}
```

### 7.8 QR Code Pembayaran

```http
GET /api/v2/customer/payment/qr/{bookingCode}
```

### 7.9 Review

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/api/v2/customer/reviews` | List review saya |
| POST | `/api/v2/customer/reviews` | Buat review |
| PUT | `/api/v2/customer/reviews/{id}` | Update review |
| DELETE | `/api/v2/customer/reviews/{id}` | Hapus review |

**Buat Review — Body**

```json
{
  "order_item_uuid": "uuid",
  "rating": 5,
  "review": "Produk bagus, pengiriman cepat!",
  "images": ["reviews/img1.jpg"]
}
```

**Validasi:** hanya bisa review item dari order yang sudah `completed` · 1 order item = 1 review

---

## 8. Endpoint — Merchant

> **Base path:** `/api/v2/merchant` · **Middleware:** `client.auth`, `throttle:120,1`, `auth:merchant_api`

### 8.1 Produk

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/souvenir/products` | List produk (`search`, `category_id`, `page`, `per_page`) |
| POST | `/souvenir/products` | Buat produk |
| GET | `/souvenir/products/{product}` | Detail *(slug atau ID)* |
| PUT | `/souvenir/products/{product}` | Update |
| DELETE | `/souvenir/products/{product}` | Hapus |
| PUT | `/souvenir/products/{id}/stock` | Update stok |
| PUT | `/souvenir/products/{id}/toggle-active` | Toggle aktif |

**Buat Produk — Body**

```json
{
  "name": "Kopi Gayo Premium",
  "description": "Kopi arabika single origin dari dataran tinggi Gayo",
  "category_id": "uuid",
  "price": 85000,
  "discount_price": 75000,
  "stock": 100,
  "weight": 500,
  "images": ["products/kopi-1.jpg", "products/kopi-2.jpg"],
  "is_active": true,
  "featured": false,
  "store_id": "uuid"
}
```

**Update Stock — Body**

```json
{ "stock": 150 }
```

### 8.2 Pesanan

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/souvenir/orders` | List (`status`, `date_from`, `date_to`, `search`) |
| GET | `/souvenir/orders/{uuid}` | Detail |
| PUT | `/souvenir/orders/{uuid}/status` | Update status |
| POST | `/souvenir/orders/{uuid}/ship` | Kirim manual |
| POST | `/souvenir/orders/{uuid}/ship-kiriminaja` | Kirim via KiriminAja |
| GET | `/souvenir/orders/{uuid}/track` | Lacak |

**Update Status — Body**

```json
{ "status": "processing" }
```

**Kirim Manual — Body**

```json
{
  "courier": "jne",
  "tracking_number": "JNE123456789",
  "delivery_note": "Dikirim dari Banda Aceh",
  "shipping_order_id": "optional"
}
```

**Response**

```json
{
  "status": true,
  "message": "Pesanan berhasil dikirim",
  "data": {
    "status": "shipped",
    "shipped_at": "2026-09-17T10:00:00Z",
    "tracking_number": "JNE123456789"
  }
}
```

**Kirim via KiriminAja — Body**

```json
{
  "courier": "jne",
  "service": "reg",
  "notes": "Fragile"
}
```

Response: Booking pickup + tracking number otomatis.

### 8.3 Kategori *(Read-only)*

```http
GET /api/v2/merchant/souvenir/categories
```

### 8.4 Toko

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/store` | Ambil data toko |
| POST | `/store` | Buat toko |
| PUT | `/store` | Update toko |
| GET | `/store/{uuid}` | Detail toko |

**Buat Toko — Body**

```json
{
  "name": "Toko Kopi Aceh",
  "description": "Menjual kopi khas Aceh",
  "address": "Jl. ...",
  "kabupaten_kota_id": 1,
  "latitude": 5.53419000,
  "longitude": 95.38172000,
  "phone": "0651123456",
  "email": "toko@example.com",
  "is_physical": true
}
```

### 8.5 Dashboard

```http
GET /api/v2/merchant/dashboard
GET /api/v2/merchant/dashboard/summary
```

**Response summary**

```json
{
  "data": {
    "total_products": 24,
    "total_orders": 145,
    "orders_today": 8,
    "revenue_this_month": "12500000.00",
    "pending_orders": 3
  }
}
```

### 8.6 Transaksi & Withdraw

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/transactions` | Riwayat transaksi |
| POST | `/withdraw` | Ajukan withdraw |
| GET | `/withdrawals` | Riwayat withdraw |

**Ajukan Withdraw — Body**

```json
{
  "amount": 500000,
  "bank_account": "1234567890",
  "bank_name": "BCA"
}
```

---

## 9. Endpoint — Admin

> **Base path:** `/api/v2/admin/marketplace` · **Middleware:** `client.auth`, `throttle:120,1`, `auth:admin_api`, `admin`

### 9.1 Produk

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/products` | List semua produk |
| POST | `/products` | Buat |
| GET | `/products/stats` | Statistik |
| GET | `/products/{product}` | Detail |
| PUT | `/products/{product}` | Update |
| DELETE | `/products/{product}` | Hapus |
| PUT | `/products/{id}/stock` | Update stok |
| POST | `/products/{id}/toggle-active` | Aktif/nonaktif |
| POST | `/products/{id}/toggle-featured` | Toggle unggulan |

### 9.2 Pesanan

| Method | Endpoint |
|---|---|
| GET | `/orders` |
| POST | `/orders` |
| GET | `/orders/stats` |
| GET | `/orders/trends` |
| GET | `/orders/{order}` |
| PUT | `/orders/{order}` |
| DELETE | `/orders/{order}` |
| POST | `/orders/{id}/update-status` |
| POST | `/orders/{id}/mark-paid` |
| POST | `/orders/{id}/ship` |
| POST | `/orders/{id}/mark-completed` |

### 9.3 Kategori

| Method | Endpoint |
|---|---|
| GET | `/categories` |
| POST | `/categories` |
| GET | `/categories/tree` |
| GET | `/categories/stats` |
| GET | `/categories/{category}` |
| PUT | `/categories/{category}` |
| DELETE | `/categories/{category}` |
| POST | `/categories/{id}/toggle-active` |

### 9.4 Toko

| Method | Endpoint |
|---|---|
| GET | `/stores` |
| POST | `/stores` |
| GET | `/stores/stats` |
| GET | `/stores/{store}` |
| PUT | `/stores/{store}` |
| DELETE | `/stores/{store}` |
| POST | `/stores/{id}/toggle-active` |
| POST | `/stores/{id}/set-default` |

### 9.5 Review

| Method | Endpoint |
|---|---|
| GET | `/reviews` |
| POST | `/reviews` |
| GET | `/reviews/stats` |
| GET | `/reviews/{review}` |
| PUT | `/reviews/{review}` |
| DELETE | `/reviews/{review}` |

### 9.6 Metode Pengiriman

| Method | Endpoint |
|---|---|
| GET | `/shipping-methods` |
| POST | `/shipping-methods` |
| GET | `/shipping-methods/active/list` |
| GET | `/shipping-methods/{shipping_method}` |
| PUT | `/shipping-methods/{shipping_method}` |
| DELETE | `/shipping-methods/{shipping_method}` |
| POST | `/shipping-methods/{id}/toggle-active` |

### 9.7 Merchant Management

| Method | Endpoint |
|---|---|
| GET | `/admin/merchants` |
| GET | `/admin/merchants/{uuid}` |
| PUT | `/admin/merchants/{uuid}` |
| PUT | `/admin/merchants/{uuid}/verify` |
| GET | `/admin/merchants/{uuid}/products` |
| GET | `/admin/merchants/{uuid}/orders` |

---

## 10. Webhook

### 10.1 Flip Payment Webhook

```http
POST /api/webhook/flip
```

Tanpa middleware `client.auth` — Flip mengirim callback tanpa `X-Client-ID`.

**Body**

```json
{
  "id": 12345,
  "bill_id": 12345,
  "status": "SUCCESSFUL",
  "amount": 218000,
  "reference_id": "SO-20260916-ABCD1234",
  "sender_bank": "bca",
  "sender_name": "Budi Santoso",
  "payment_method": "qris"
}
```

**Efek**

| Status | Aksi |
|---|---|
| `SUCCESSFUL` | Order → `paid`, `payment_status` → `paid`, kirim notifikasi |
| `FAILED` | `payment_status` → `failed` |
| `EXPIRED` | `payment_status` → `failed` |

### 10.2 Shipping Webhook (KiriminAja)

```http
POST /api/webhook/shipping
```

**Body**

```json
{
  "awb": "JNE123456789",
  "status": "delivered",
  "description": "Paket diterima oleh Budi",
  "location": "Banda Aceh",
  "tracked_at": "2026-09-18T15:00:00Z"
}
```

**Efek**

| Status | Aksi |
|---|---|
| `shipped` / `in_transit` | `order.status` → `shipped` |
| `delivered` / `completed` | `order.status` → `completed` |

---

## 11. Error Codes

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
| `Client credentials required` | Header `X-Client-ID`/`Secret` tidak ada |
| `Invalid client credentials` | Client ID/Secret salah |
| `Unauthenticated.` | Token user tidak valid/expired |
| `Stok produk ... tidak mencukupi` | Order melebihi stok |
| `Produk ... bukan dari merchant yang dipilih` | Mixed merchant |
| `Pesanan tidak dapat dibatalkan pada status ini` | Sudah `shipped`/`completed` |
| `Hanya bisa review produk dari pesanan yang sudah selesai` | Order belum `completed` |
| `Anda sudah memberi review untuk item ini` | Duplikat review |

---

## 12. Changelog

| Versi | Tanggal | Perubahan |
|---|---|---|
| 1.0 | 2025-01 | Rilis awal — catalog + order |
| 2.0 | 2026-03 | Tambah merchant endpoints, store, review |
| 2.1 | 2026-06 | Tambah admin marketplace, shipping methods |
| **2.2** | **2026-09-16** | **Dokumentasi lengkap, restrukturisasi endpoint** |

---

## Lampiran

### A. Alur Lengkap Customer

```
1. Customer browse produk
   GET /api/v2/public/souvenir/products?search=kopi

2. Customer lihat detail produk
   GET /api/v2/public/souvenir/products/kopi-gayo-premium

3. Customer login
   POST /api/v2/auth/login { email, password }

4. Customer checkout
   POST /api/v2/customer/orders
   { merchant_uuid, shipping_method_id, shipping_address, items }
   → Response: order_number

5. Customer bayar
   POST /api/v2/customer/payment/process
   { booking_code: order_number }
   → Response: payment_url

6. Customer bayar di Flip (QR/VA/e-wallet)

7. Flip kirim webhook
   POST /api/webhook/flip
   → Order status: paid

8. Merchant proses & kirim
   POST /api/v2/merchant/souvenir/orders/{uuid}/ship
   { courier, tracking_number }
   → Order status: shipped

9. Kurir kirim webhook (opsional)
   POST /api/webhook/shipping
   → Order status: completed

10. Customer review
    POST /api/v2/customer/reviews
    { order_item_uuid, rating, review }
```

### B. Status Enum Lengkap

**Order Status**

| Status | Label |
|---|---|
| `pending` | Menunggu Pembayaran |
| `paid` | Dibayar |
| `processing` | Diproses |
| `shipped` | Dikirim |
| `completed` | Selesai |
| `cancelled` | Dibatalkan |

**Payment Status**

| Status | Label |
|---|---|
| `unpaid` | Belum Dibayar |
| `paid` | Sudah Dibayar |
| `failed` | Gagal |
| `refunded` | Direfund |

### C. Contoh cURL Lengkap

```bash
# ═══ PUBLIC ═══════════════════════════════════════════════
# Browse produk
curl -H "X-Client-ID: shop-web" \
     -H "X-Client-Secret: xxxxx" \
     "https://api.ovisito.com/api/v2/public/souvenir/products?search=kopi&sort=price_asc"

# Detail produk
curl -H "X-Client-ID: shop-web" \
     -H "X-Client-Secret: xxxxx" \
     "https://api.ovisito.com/api/v2/public/souvenir/products/kopi-gayo-premium"

# List kategori
curl -H "X-Client-ID: shop-web" \
     -H "X-Client-Secret: xxxxx" \
     "https://api.ovisito.com/api/v2/public/souvenir/categories?with_children=true"

# Detail toko
curl -H "X-Client-ID: shop-web" \
     -H "X-Client-Secret: xxxxx" \
     "https://api.ovisito.com/api/v2/public/souvenir/stores/toko-kopi-aceh"

# Kalkulasi ongkir
curl -X POST \
     -H "X-Client-ID: shop-web" \
     -H "X-Client-Secret: xxxxx" \
     -H "Content-Type: application/json" \
     -d '{"weight":500,"method_id":"uuid"}' \
     "https://api.ovisito.com/api/v2/public/souvenir/shipping-methods/calculate"

# ═══ CUSTOMER ═════════════════════════════════════════════
# Login
curl -X POST \
     -H "X-Client-ID: shop-web" \
     -H "X-Client-Secret: xxxxx" \
     -H "Content-Type: application/json" \
     -d '{"email":"user@test.com","password":"secret"}' \
     "https://api.ovisito.com/api/v2/auth/login"

# Checkout
curl -X POST \
     -H "X-Client-ID: shop-web" \
     -H "X-Client-Secret: xxxxx" \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"merchant_uuid":"uuid","shipping_method_id":"uuid","shipping_address":{"...":"..."},"items":[{"...":"..."}]}' \
     "https://api.ovisito.com/api/v2/customer/orders"

# List pesanan
curl -H "X-Client-ID: shop-web" \
     -H "X-Client-Secret: xxxxx" \
     -H "Authorization: Bearer <token>" \
     "https://api.ovisito.com/api/v2/customer/orders?status=paid"

# Detail pesanan
curl -H "X-Client-ID: shop-web" \
     -H "X-Client-Secret: xxxxx" \
     -H "Authorization: Bearer <token>" \
     "https://api.ovisito.com/api/v2/customer/orders/SO-20260916-ABCD1234"

# ═══ MERCHANT ═════════════════════════════════════════════
# Tambah produk
curl -X POST \
     -H "X-Client-ID: merchant-web" \
     -H "X-Client-Secret: xxxxx" \
     -H "Authorization: Bearer <merchant_token>" \
     -H "Content-Type: application/json" \
     -d '{"name":"Kopi Gayo","category_id":"uuid","price":85000,"stock":100,"weight":500}' \
     "https://api.ovisito.com/api/v2/merchant/souvenir/products"

# Kirim pesanan
curl -X POST \
     -H "X-Client-ID: merchant-web" \
     -H "X-Client-Secret: xxxxx" \
     -H "Authorization: Bearer <merchant_token>" \
     -H "Content-Type: application/json" \
     -d '{"courier":"jne","tracking_number":"JNE123456789"}' \
     "https://api.ovisito.com/api/v2/merchant/souvenir/orders/{uuid}/ship"

# ═══ ADMIN ════════════════════════════════════════════════
# List semua produk
curl -H "X-Client-ID: admin-web" \
     -H "X-Client-Secret: xxxxx" \
     -H "Authorization: Bearer <admin_token>" \
     "https://api.ovisito.com/api/v2/admin/marketplace/products"

# Stats order
curl -H "X-Client-ID: admin-web" \
     -H "X-Client-Secret: xxxxx" \
     -H "Authorization: Bearer <admin_token>" \
     "https://api.ovisito.com/api/v2/admin/marketplace/orders/stats"

# ═══ WEBHOOK ══════════════════════════════════════════════
# Flip webhook
curl -X POST \
     -H "Content-Type: application/json" \
     -H "X-Callback-Signature: <hmac>" \
     -d '{"id":12345,"status":"SUCCESSFUL","amount":218000,"reference_id":"SO-XXX"}' \
     "https://api.ovisito.com/api/webhook/flip"
```

---

## 14. Perbedaan Transport vs Marketplace

| Aspek | Transport | Marketplace |
|---|---|---|
| Unit transaksi | Tiket (orang) | Produk (barang) |
| Checkout | Booking schedule | Keranjang produk |
| Pengiriman | Orang datang ke terminal | Barang dikirim via kurir |
| E-Ticket | Ya (QR di-scan saat boarding) | Tidak ada |
| Tracking | Jadwal & kursi | Resi kurir |
| Multi-merchant | 1 booking = 1 operator | 1 order = 1 merchant |
| Multi-penumpang | Ya (1 booking N tiket) | Tidak (1 item N qty) |
| Review | Setelah trip selesai | Setelah barang diterima |

---

<p align="center"><sub>Dokumen terakhir diperbarui: 16 September 2026 · Versi 2.2 · Maintainer: Tim Backend Ovisito · Kontak: backend@ovisito.com</sub></p>

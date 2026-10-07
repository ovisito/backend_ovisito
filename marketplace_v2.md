# Marketplace API — Ovisito

> Dokumentasi endpoint marketplace souvenir (multi-database) untuk platform Ovisito.
>
> **Versi:** 2.1
> **Terakhir diupdate:** 2026-10-08
> **Base URL:** `https://api.ovisito.com`

---

## Daftar Isi

1. [Overview](#1-overview)
2. [Database Architecture](#2-database-architecture)
3. [Response Format](#3-response-format)
4. [Authentication & Middleware](#4-authentication--middleware)
5. [Public Endpoints](#5-public-endpoints)
6. [Customer Endpoints](#6-customer-endpoints)
7. [Merchant Endpoints](#7-merchant-endpoints)
8. [Admin Endpoints](#8-admin-endpoints)
9. [Payment Integration (Flip)](#9-payment-integration-flip)
10. [Shipping Integration](#10-shipping-integration)
11. [Order Lifecycle](#11-order-lifecycle)
12. [Notification](#12-notification)
13. [Models Reference](#13-models-reference)
14. [Constants Reference](#14-constants-reference)
15. [Changelog](#15-changelog)
16. [Referensi](#16-referensi)

---

## 1. Overview

Modul marketplace menangani:

- **Produk souvenir** (dari multiple merchants)
- **Toko** (store fisik & online)
- **Kategori produk** (hierarki 2 level)
- **Order & pembayaran** (via Flip)
- **Shipping** (manual & KiriminAja)
- **Review produk**
- **Customer order flow** (buat pesanan → bayar → tracking)

### Akses & Role

| Role | Auth | Endpoint Prefix |
|---|---|---|
| **Public** | `client.auth` | `/api/v2/public/souvenir/*` |
| **Customer** | `client.auth` + Sanctum user | `/api/v2/customer/*` |
| **Merchant** | `client.auth` + Sanctum merchant | `/api/v2/merchant/souvenir/*` |
| **Admin** | Sanctum admin (`auth:admin_api`) | `/api/v2/admin/marketplace/*` |
| **Webhook** | Signature verification | `/api/webhook/*` |

---

## 2. Database Architecture

Modul ini pakai **multi-database** dalam 1 platform:

| Service | Connection | Fungsi |
|---|---|---|
| **Marketplace** | `souvenir_sql` | Produk, kategori, toko, order, review, shipping |
| **Payment** | `payment` | Central booking, Flip transaction, payment history |
| **Users** | `user` | User, Merchant, Admin, Client App |

### Konvensi Schema

- **Primary key**:
  - Tabel marketplace: `char(36)` UUID (auto-generate via trait `HasUuids`)
  - `users.id`, `merchants.id`, `central_bookings.id`: `bigint UNSIGNED AUTO_INCREMENT`
- **Foreign key**:
  - Referensi ke tabel UUID: suffix `_uuid` (contoh: `user_uuid`, `merchant_uuid`, `order_uuid`, `product_uuid`)
  - Referensi ke tabel integer: suffix `_id` (contoh: `user_id`, `category_id` untuk `kabupaten_kota_id`)
- **Timestamps**: `created_at`, `updated_at`, `deleted_at` (soft delete)

### Cross-Service Foreign Key

| Dari | Ke | Tipe |
|---|---|---|
| `souvenir_orders.user_uuid` | `users.uuid` | char(36) |
| `souvenir_orders.merchant_uuid` | `merchants.uuid` | char(36) |
| `souvenir_orders.id` | `souvenir_order_items.order_uuid` | char(36) |
| `souvenir_orders.id` | `souvenir_shipping_trackings.order_uuid` | char(36) |
| `souvenir_order_items.product_uuid` | `souvenir_products.id` | char(36) |
| `souvenir_reviews.product_uuid` | `souvenir_products.id` | char(36) |
| `souvenir_reviews.user_uuid` | `users.uuid` | char(36) |
| `souvenir_reviews.order_item_uuid` | `souvenir_order_items.id` | char(36) |
| `souvenir_store_categories.store_id` | `souvenir_stores.id` | char(36) |
| `souvenir_store_categories.category_id` | `souvenir_categories.id` | char(36) |
| `central_bookings.service_booking_id` | (service-dependent) | varchar(36) |
| `central_bookings.user_id` | `users.id` | int unsigned |

### Tabel Ringkas

| Tabel | Connection | PK | Route Key |
|---|---|---|---|
| `souvenir_products` | `souvenir_sql` | UUID | `slug` |
| `souvenir_categories` | `souvenir_sql` | UUID | `slug` |
| `souvenir_stores` | `souvenir_sql` | UUID | `slug` |
| `souvenir_store_categories` | `souvenir_sql` | UUID | `id` |
| `souvenir_orders` | `souvenir_sql` | UUID | `id` |
| `souvenir_order_items` | `souvenir_sql` | UUID | `id` |
| `souvenir_reviews` | `souvenir_sql` | UUID | `id` |
| `souvenir_shipping_methods` | `souvenir_sql` | UUID | `id` |
| `souvenir_shipping_trackings` | `souvenir_sql` | UUID | `id` |
| `central_bookings` | `payment` | bigint | `uuid` |
| `flip_transactions` | `payment` | bigint | `id` |
| `users` | `user` | bigint | `uuid` |
| `merchants` | `user` | bigint | `uuid` |

---

## 3. Response Format

### Sukses

```json
{
  "status": true,
  "message": "Optional message",
  "data": { ... } | [ ... ] | null
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

### HTTP Status Codes

| Code | Arti |
|---|---|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 422 | Validation Error |
| 500 | Internal Server Error |

### Pagination Meta

```json
{
  "status": true,
  "data": [ ... ],
  "meta": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 12,
    "total": 60
  }
}
```

---

## 4. Authentication & Middleware

### Middleware Registry

| Middleware | Header | Fungsi |
|---|---|---|
| `client.auth` | `X-Client-ID`, `X-Client-Secret` | Identifikasi platform/app |
| `auth:sanctum` | `Authorization: Bearer <token>` | Authenticated customer |
| `auth:merchant` | `Authorization: Bearer <token>` | Authenticated merchant |
| `auth:admin_api` | `Authorization: Bearer <token>` | Authenticated admin |
| `admin` | — | Cek role admin |
| `throttle:120,1` | — | Rate limit 120 req/menit |

### Client Auth (Public Endpoints)

Semua endpoint `/api/v2/public/*`, `/api/v2/customer/*`, `/api/v2/merchant/*` wajib sertakan:

```http
X-Client-ID: client_web
X-Client-Secret: <secret>
```

Client credentials didaftarkan di tabel `client_apps` (connection `user`).

---

## 5. Public Endpoints

**Base:** `/api/v2/public/souvenir`
**Middleware:** `client.auth`, `throttle:120,1`
**Auth User:** Tidak perlu

### 5.1 Products

#### `GET /products`

Ambil daftar produk aktif.

**Query Parameters:**

| Param | Tipe | Default | Deskripsi |
|---|---|---|---|
| `search` | string | — | Cari nama & deskripsi |
| `category` | string | — | Slug atau UUID kategori (auto-include children) |
| `merchant_uuid` | uuid | — | Filter per merchant |
| `featured` | boolean | false | Hanya produk unggulan |
| `min_price` | numeric | — | Harga minimum |
| `max_price` | numeric | — | Harga maksimum |
| `in_stock` | boolean | false | Hanya yang ada stok |
| `sort` | enum | `latest` | `latest` \| `price_asc` \| `price_desc` \| `popular` |
| `per_page` | int | 12 | Max 60 |
| `page` | int | 1 | — |

**Response:**

```json
{
  "status": true,
  "data": [
    {
      "id": "uuid",
      "name": "Kopi Aceh Gayo",
      "slug": "kopi-aceh-gayo",
      "description": "...",
      "price": "50000.00",
      "discount_price": null,
      "stock": 100,
      "weight": "250.00",
      "images": ["souvenir/products/..."],
      "is_active": true,
      "featured": false,
      "views": 42,
      "category": { "id": "...", "name": "Minuman", "slug": "minuman" },
      "store": { "id": "...", "name": "Toko Kopi Aceh", "slug": "toko-kopi-aceh" },
      "merchant": { "uuid": "...", "name": "Merchant Name" }
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 12,
    "total": 60
  }
}
```

#### `GET /products/{slug}`

Detail produk + review + related.

**Response tambahan:**

- `product` — detail lengkap
- `related` — 8 produk serupa (kategori sama)
- Increment `views` otomatis

#### `GET /featured`

Produk unggulan.

**Query Parameters:**

| Param | Tipe | Default | Max |
|---|---|---|---|
| `limit` | int | 8 | 24 |

### 5.2 Categories

#### `GET /categories`

**Query Parameters:**

| Param | Tipe | Default | Deskripsi |
|---|---|---|---|
| `with_children` | boolean | true | Include sub-kategori (2 level) |
| `only_parents` | boolean | true | Hanya kategori root |

**Response:**

```json
{
  "status": true,
  "data": [
    {
      "id": "...",
      "name": "Makanan",
      "slug": "makanan",
      "description": "...",
      "parent_id": null,
      "is_active": true,
      "children": [
        {
          "id": "...",
          "name": "Kue Kering",
          "slug": "kue-kering",
          "children": []
        }
      ]
    }
  ]
}
```

#### `GET /categories/{slug}`

Detail kategori + produk dalamnya.

**Fitur:** Auto-include children & grandchildren (2 level). Produk di sub-kategori ikut tampil.

### 5.3 Stores

#### `GET /stores`

**Query Parameters:**

| Param | Tipe | Default | Deskripsi |
|---|---|---|---|
| `search` | string | — | Cari nama & deskripsi |
| `merchant_uuid` | uuid | — | Filter per merchant |
| `kabupaten_id` | int | — | Filter per kabupaten |
| `is_physical` | boolean | — | Toko fisik / online |
| `per_page` | int | 12 | Max 60 |

#### `GET /stores/{slug}`

Detail toko + 12 produk terbaru.

### 5.4 Shipping Methods

#### `GET /shipping-methods`

List metode pengiriman aktif.

**Response:**

```json
{
  "status": true,
  "data": [
    {
      "id": "uuid",
      "name": "JNE Reguler",
      "courier_code": "jne",
      "base_cost": "15000.00",
      "description": "...",
      "is_active": true
    }
  ]
}
```

#### `POST /shipping-methods/calculate`

Hitung ongkir.

**Request Body:**

```json
{
  "weight": 500,
  "method_id": "uuid"
}
```

**Response:**

```json
{
  "status": true,
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

## 6. Customer Endpoints

**Base:** `/api/v2/customer`
**Middleware:** `client.auth`, `auth:sanctum`, `throttle:120,1`
**Auth User:** Wajib (Sanctum token)

### 6.1 Orders

#### `POST /orders` — Buat Order Baru

**Request Body:**

```json
{
  "merchant_uuid": "uuid",
  "items": [
    { "product_uuid": "uuid", "quantity": 2 }
  ],
  "shipping_address": {
    "name": "Budi",
    "phone": "08123456789",
    "address": "Jl. ...",
    "city": "Banda Aceh",
    "postal_code": "23116"
  },
  "shipping_cost": 15000,
  "shipping_method_id": "uuid",
  "courier": "jne",
  "notes": "Tolong dibungkus rapi"
}
```

**Business Rules:**

- Satu order = satu merchant (semua item harus dari `merchant_uuid` yang sama)
- Stok di-decrement atomic (transaction + `lockForUpdate`)
- Harga pakai `final_price` = `discount_price` jika ada, else `price`
- `total_amount` = sum(subtotal) + shipping_cost - discount_total
- Status awal: `pending`, `payment_status: unpaid`
- Auto-generate `order_number`: format `SO-YYYYMMDD-XXXXXXXX`

**Response (201):**

```json
{
  "status": true,
  "message": "Pesanan berhasil dibuat. Silakan lanjut ke pembayaran.",
  "data": {
    "order": {
      "id": "uuid",
      "order_number": "SO-20261008-ABC123XY",
      "user_uuid": "uuid",
      "merchant_uuid": "uuid",
      "total_amount": "115000.00",
      "shipping_cost": "15000.00",
      "discount_total": "0.00",
      "status": "pending",
      "payment_status": "unpaid",
      "shipping_address": { ... },
      "items": [
        {
          "id": "uuid",
          "product_uuid": "uuid",
          "product_name": "Kopi Aceh Gayo",
          "price": "50000.00",
          "quantity": 2,
          "subtotal": "100000.00"
        }
      ],
      "ordered_at": "2026-10-08T10:30:00.000000Z"
    },
    "payment": {
      "next_step": "POST /api/v2/customer/payment/process",
      "booking_type": "marketplace",
      "booking_id": "SO-20261008-ABC123XY"
    }
  }
}
```

**Error 422:**

- Produk tidak ditemukan atau tidak aktif
- Produk bukan milik merchant yang dipilih
- Stok tidak cukup

#### `GET /orders` — List Order User

**Query Parameters:**

| Param | Tipe | Default | Deskripsi |
|---|---|---|---|
| `status` | string | — | Filter status (`pending`, `paid`, `processing`, `shipped`, `completed`, `cancelled`) |
| `per_page` | int | 15 | Max 50 |
| `page` | int | 1 | — |

**Eager load:** `items.product`, `merchant`, `shippingTrackings`

#### `GET /orders/{order_number}` — Detail Order

Path param: `order_number` (format `SO-YYYYMMDD-XXXXXXXX`)

#### `POST /orders/{order_number}/cancel` — Batalkan

**Request Body (opsional):**

```json
{
  "reason": "Berubah pikiran"
}
```

**Rules:** Hanya boleh cancel kalau status = `pending`. Stok otomatis dikembalikan.

#### `GET /orders/{order_number}/track` — Lacak

**Response:**

```json
{
  "status": true,
  "data": {
    "order_number": "SO-20261008-ABC123XY",
    "status": "shipped",
    "status_label": "Dikirim",
    "courier": "jne",
    "tracking_number": "JNE1234567890",
    "history": [
      {
        "id": "uuid",
        "status": "shipped",
        "description": "Paket telah dikirim melalui jne dengan nomor resi JNE1234567890",
        "location": "Banda Aceh",
        "tracked_at": "2026-10-08T11:00:00.000000Z"
      }
    ]
  }
}
```

### 6.2 Payment

**Base:** `/api/v2/customer/payment`

#### `POST /process` — Mulai Pembayaran

**Request Body:**

```json
{
  "booking_type": "marketplace",
  "booking_id": "SO-20261008-ABC123XY",
  "payment_method": "qris",
  "payment_channel": "gopay"
}
```

**Response:**

```json
{
  "status": true,
  "message": "Pembayaran berhasil diproses. Silakan selesaikan pembayaran.",
  "data": {
    "booking_code": "SO-20261008-ABC123XY",
    "booking_type": "marketplace",
    "amount": 115000,
    "status": "pending",
    "payment_url": "https://flip.id/...",
    "qr_code": "data:image/png;base64,...",
    "flip_bill_id": "12345"
  }
}
```

#### `GET /qr/{bookingCode}` — QR Code

**Response:**

```json
{
  "status": true,
  "data": {
    "booking_code": "SO-20261008-ABC123XY",
    "qr_code": "data:image/png;base64,...",
    "expires_in": 3600
  }
}
```

#### `GET /status/{bookingCode}` — Cek Status

**Response:**

```json
{
  "status": true,
  "data": {
    "booking_code": "SO-20261008-ABC123XY",
    "is_paid": true,
    "amount": 115000,
    "status": "paid",
    "booking_type": "marketplace"
  }
}
```

---

## 7. Merchant Endpoints

**Base:** `/api/v2/merchant`
**Middleware:** `client.auth`, `auth:merchant`, `throttle:120,1`

### 7.1 Store Management

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/store` | Ambil toko default merchant |
| POST | `/store` | Buat toko baru |
| PUT | `/store` | Update toko default |
| GET | `/store/{uuid}` | Detail toko by UUID |

> **Catatan:** Toko pertama merchant otomatis di-set `is_default = true`.

### 7.2 Souvenir Products

**Base:** `/api/v2/merchant/souvenir/products`

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/products` | List produk merchant |
| POST | `/products` | Buat produk |
| GET | `/products/{product}` | Detail produk |
| PUT/PATCH | `/products/{product}` | Update produk |
| DELETE | `/products/{product}` | Hapus produk |
| PUT | `/products/{id}/stock` | Update stok |
| PUT | `/products/{id}/toggle-active` | Toggle aktif |

### 7.3 Souvenir Orders

**Base:** `/api/v2/merchant/souvenir/orders`

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/orders` | List pesanan merchant |
| GET | `/orders/{uuid}` | Detail pesanan |
| PUT | `/orders/{uuid}/status` | Update status |
| POST | `/orders/{uuid}/ship` | Kirim manual (tracking) |
| POST | `/orders/{uuid}/ship-kiriminaja` | Kirim via KiriminAja (auto AWB) |
| GET | `/orders/{uuid}/track` | Lacak pesanan |

**Transisi Status Valid:**

| Dari | Ke |
|---|---|
| `paid` | `processing`, `cancelled` |
| `processing` | `shipped`, `cancelled` |
| `shipped` | `completed` |

### 7.4 Transactions

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/transactions` | Riwayat transaksi (order + withdrawal) |
| POST | `/withdraw` | Tarik saldo |
| GET | `/withdrawals` | Riwayat penarikan |

**Withdraw Request:**

```json
{
  "amount": 100000,
  "bank_name": "BCA",
  "bank_account": "1234567890",
  "account_name": "Nama Pemilik"
}
```

Minimum: Rp 10.000. Proses 1-3 hari kerja.

---

## 8. Admin Endpoints

**Base:** `/api/v2/admin/marketplace`
**Middleware:** `throttle:120,1`, `auth:admin_api`, `admin`

### 8.1 Products

| Method | Endpoint |
|---|---|
| GET | `/products` |
| POST | `/products` |
| GET | `/products/{product}` |
| PUT/PATCH | `/products/{product}` |
| DELETE | `/products/{product}` |
| POST | `/products/{id}/toggle-active` |
| POST | `/products/{id}/toggle-featured` |
| PUT | `/products/{id}/stock` |
| POST | `/products/{id}/images` |
| DELETE | `/products/{id}/images` |
| GET | `/products/stats` |

### 8.2 Categories

| Method | Endpoint |
|---|---|
| GET | `/categories` |
| POST | `/categories` |
| GET | `/categories/tree` |
| GET | `/categories/{category}` |
| PUT/PATCH | `/categories/{category}` |
| DELETE | `/categories/{category}` |
| POST | `/categories/{id}/toggle-active` |
| GET | `/categories/stats` |

### 8.3 Orders

| Method | Endpoint |
|---|---|
| GET | `/orders` |
| POST | `/orders` |
| GET | `/orders/{order}` |
| PUT/PATCH | `/orders/{order}` |
| DELETE | `/orders/{order}` |
| POST | `/orders/{id}/mark-paid` |
| POST | `/orders/{id}/mark-completed` |
| POST | `/orders/{id}/ship` |
| POST | `/orders/{id}/update-status` |
| GET | `/orders/stats` |
| GET | `/orders/trends` |

### 8.4 Reviews

| Method | Endpoint |
|---|---|
| GET | `/reviews` |
| POST | `/reviews` |
| GET | `/reviews/{review}` |
| PUT/PATCH | `/reviews/{review}` |
| DELETE | `/reviews/{review}` |
| GET | `/reviews/stats` |

### 8.5 Shipping Methods

| Method | Endpoint |
|---|---|
| GET | `/shipping-methods` |
| POST | `/shipping-methods` |
| GET | `/shipping-methods/active/list` |
| GET | `/shipping-methods/{shipping_method}` |
| PUT/PATCH | `/shipping-methods/{shipping_method}` |
| DELETE | `/shipping-methods/{shipping_method}` |
| POST | `/shipping-methods/{id}/toggle-active` |

### 8.6 Stores

| Method | Endpoint |
|---|---|
| GET | `/stores` |
| POST | `/stores` |
| GET | `/stores/{store}` |
| PUT/PATCH | `/stores/{store}` |
| DELETE | `/stores/{store}` |
| POST | `/stores/{id}/set-default` |
| POST | `/stores/{id}/toggle-active` |
| GET | `/stores/stats` |

### 8.7 Merchants

| Method | Endpoint |
|---|---|
| GET | `/merchants` |
| GET | `/merchants/{uuid}` |
| PUT | `/merchants/{uuid}` |
| PUT | `/merchants/{uuid}/verify` |
| GET | `/merchants/{uuid}/products` |
| GET | `/merchants/{uuid}/orders` |

---

## 9. Payment Integration (Flip)

### 9.1 PayableBooking Interface

Model yang bisa dibayar via Flip wajib implement `App\Contracts\PayableBooking`:

```php
interface PayableBooking
{
    public function getAmount(): float;
    public function getCustomerName(): string;
    public function getCustomerEmail(): ?string;
    public function getCustomerPhone(): ?string;
    public function getBookingCode(): string;
    public function getServiceType(): string;
    public function isPaid(): bool;
    public function markAsPaid(?float $amount = null): void;
    public function getCustomerId(): ?int;
    public function getStartDate(): ?string;
    public function getEndDate(): ?string;
    public function getKey();
}
```

**Model yang implement:**

- `SouvenirOrder` (marketplace)
- `TransportBooking` (transport)
- `BookingHotel`, `BookingDestinasi`, `BookingPackage` (wisata)
- `BookingKuliner` (kuliner)
- `Booking` (rental / AcehSewa)
- `EventBooking` (event)
- `MiceBooking` (mice)

### 9.2 Central Booking

Tabel `central_bookings` di connection `payment` — aggregator semua transaksi lintas service.

**Enum `service_type`:**

```text
hotel | kuliner | rental | destinasi | tour | event | mice | transport | marketplace
```

**Enum `payment_status`:**

```text
unpaid | pending | paid | refunded | expired | cancelled
```

### 9.3 Payment Flow (Marketplace)

```text
1. Customer POST /api/v2/customer/payment/process
   Body: { booking_type: "marketplace", booking_id: "SO-...", payment_method: "qris" }

2. PaymentController::process()
   → resolveBooking('marketplace', 'SO-...')
   → SouvenirOrder (by order_number)
   → PaymentService::processPayment()
     - Buat CentralBooking (service_type=marketplace)
     - Buat FlipTransaction (status=PENDING)
     - Buat PaymentTransaction (legacy)
   → Response: payment_url + qr_code

3. Customer bayar via payment_url / scan QR

4. Flip kirim webhook ke POST /api/webhook/flip
   Payload: { id, status: "SUCCESSFUL", ... }

5. FlipWebhookController::handle()
   → validateSignature() (HMAC SHA256)
   → FlipPaymentService::handleWebhook()
   → dispatchByStatus → handlePaid()
     - $booking->markAsPaid()
     - Update SouvenirOrder: status=paid, payment_status=paid, paid_at=now()
     - dispatchNotification()
   → Response: { status: 'ok' }
```

### 9.4 Webhook (Flip)

**Endpoint:** `POST /api/webhook/flip`

**Signature Verification:**

```http
X-Callback-Signature: <HMAC-SHA256(raw_body, webhook_token)>
```

**Payload Contoh:**

```json
{
  "id": 12345,
  "bill_id": 12345,
  "status": "SUCCESSFUL",
  "amount": 115000,
  "reference_id": "...",
  "sender_bank": "bca",
  "sender_name": "Budi Santoso",
  "payment_method": "bank_transfer",
  "paid_at": "2026-10-08 10:30:00"
}
```

**Status yang Didukung:**

| Status | Handler |
|---|---|
| `SUCCESSFUL` / `PAID` | `handlePaid()` → markAsPaid |
| `FAILED` / `CANCELLED` | `handleFailed()` → markAsFailed |
| `EXPIRED` | `handleExpired()` → log |
| `PENDING` | ignored |

**Idempotency:** Kalau `FlipTransaction.isPaid() = true`, webhook return 200 tanpa proses ulang.

**Dev Mode Skip:** Set `FLIP_SKIP_SIGNATURE=true` di `.env` untuk skip verifikasi (⚠️ **JANGAN di production**).

---

## 10. Shipping Integration

### 10.1 Shipping Methods

Tabel `souvenir_shipping_methods` (connection `souvenir_sql`) — manual methods yang di-set admin.

**Fields:**

- `name` — Nama metode (contoh: "JNE Reguler")
- `courier_code` — Kode kurir (`jne`, `jnt`, `sicepat`, dll)
- `base_cost` — Biaya dasar (decimal)
- `description` — Deskripsi
- `is_active` — Status aktif

### 10.2 Shipping Tracking

Tabel `souvenir_shipping_trackings` — history tracking order.

**Fields:**

- `order_uuid` — FK ke `souvenir_orders.id`
- `status` — Status (`shipped`, `in_transit`, `delivered`, dll)
- `description` — Keterangan
- `location` — Lokasi tracking
- `tracked_at` — Waktu tracking

### 10.3 KiriminAja Integration

Untuk pengiriman otomatis dengan AWB:

- `KiriminAjaService::createOrder()` — request pickup & dapat AWB
- `KiriminAjaService::trackOrder()` — lacak by AWB

### 10.4 Webhook (Shipping)

**Endpoint:** `POST /api/webhook/shipping`

**Payload Flexible:**

```json
{
  "awb": "JNE1234567890",
  "status": "delivered",
  "description": "Paket diterima",
  "location": "Banda Aceh",
  "tracked_at": "2026-10-08 14:00:00"
}
```

**Behavior:**

- Insert `SouvenirShippingTracking`
- Kalau `status = delivered` → `SouvenirOrder.markAsCompleted()`
- Kalau `status = shipped / in_transit` + status order = `processing` → update ke `shipped`

---

## 11. Order Lifecycle

### 11.1 Full Flow

```text
┌─────────────────────────────────────────────────────────────┐
│  1. CUSTOMER BROWSING                                       │
│     GET /api/v2/public/souvenir/products                    │
│     GET /api/v2/public/souvenir/products/{slug}             │
│     POST /api/v2/public/souvenir/shipping-methods/calculate │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  2. CREATE ORDER                                            │
│     POST /api/v2/customer/orders                            │
│     → SouvenirOrder (status=pending, payment_status=unpaid) │
│     → Reserve stock (decrement)                             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  3. PAYMENT                                                 │
│     POST /api/v2/customer/payment/process                   │
│     → CentralBooking (service_type=marketplace)             │
│     → FlipTransaction (status=PENDING)                      │
│     → Response: payment_url / qr_code                       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  4. WEBHOOK FLIP (dari Flip)                                │
│     POST /api/webhook/flip                                  │
│     → validateSignature                                     │
│     → FlipTransaction.markAsPaid()                          │
│     → SouvenirOrder.markAsPaid()                            │
│       status=paid, payment_status=paid, paid_at=now()       │
│     → Send email confirmation                               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  5. MERCHANT PROCESSING                                     │
│     PUT /api/v2/merchant/souvenir/orders/{uuid}/status      │
│     Body: { status: "processing" }                          │
│     → SouvenirOrder.status = processing                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  6. SHIPPING                                                │
│     Option A (manual):                                      │
│       POST /api/v2/merchant/souvenir/orders/{uuid}/ship     │
│       Body: { tracking_number, courier, delivery_note }     │
│                                                             │
│     Option B (KiriminAja):                                  │
│       POST /api/v2/merchant/souvenir/orders/{uuid}/         │
│            ship-kiriminaja                                  │
│       Body: { sender_*, recipient_*, courier_code, ... }    │
│                                                             │
│     → SouvenirOrder.ship()                                  │
│       status=shipped, tracking_number=..., shipped_at=now() │
│     → Insert SouvenirShippingTracking                       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  7. WEBHOOK SHIPPING (dari kurir)                           │
│     POST /api/webhook/shipping                              │
│     → Insert SouvenirShippingTracking                       │
│     → Kalau delivered: SouvenirOrder.markAsCompleted()      │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  8. COMPLETED                                               │
│     SouvenirOrder.status = completed                        │
│     SouvenirOrder.completed_at = now()                      │
└─────────────────────────────────────────────────────────────┘
```

### 11.2 Status Flow

| Status | Deskripsi | Transisi Boleh |
|---|---|---|
| `pending` | Menunggu pembayaran | `paid`, `cancelled` |
| `paid` | Sudah dibayar | `processing`, `cancelled` |
| `processing` | Sedang diproses merchant | `shipped`, `cancelled` |
| `shipped` | Sudah dikirim | `completed` |
| `completed` | Selesai | — |
| `cancelled` | Dibatalkan | — |

### 11.3 Payment Status

| Status | Deskripsi |
|---|---|
| `unpaid` | Belum dibayar |
| `paid` | Sudah dibayar |
| `failed` | Gagal |
| `refunded` | Dikembalikan |

---

## 12. Notification

### 12.1 Status Implementasi

| Event | Email | WA |
|---|---|---|
| Booking dibuat | ✅ `BookingConfirmationMail` | ❌ |
| Pembayaran sukses | ✅ `PaymentConfirmationMail` | ❌ |
| Order paid → processing | ❌ | ❌ |
| Order processing → shipped | ❌ | ❌ |
| Order shipped → completed | ❌ | ❌ |
| Order cancelled | ❌ | ❌ |
| Merchant: order baru | ❌ | ❌ |
| Merchant: pembayaran masuk | ❌ | ❌ |

### 12.2 Service yang Ada

| Service | Fungsi | Status |
|---|---|---|
| `PaymentNotificationService` | Email booking & payment confirmation | ✅ Aktif |
| `WhatsAppService` | WA gateway (fonnte/wablas/kirimwa) | ✅ Ada, belum dipakai marketplace |
| `TransportNotificationService` | Notif transport (sudah lengkap) | ✅ Aktif |

### 12.3 TODO (Roadmap Fase 4)

- [ ] `MarketplaceNotificationService` — central notif marketplace
- [ ] Observer `SouvenirOrder` untuk trigger notif otomatis saat status berubah
- [ ] WA notif untuk customer (order paid, shipped, delivered)
- [ ] WA notif untuk merchant (order baru, pembayaran masuk)
- [ ] Queue job di `app/Jobs/` untuk async email/WA

### 12.4 Config

**Email** (`config/services.php`):

```php
'postmark' => ['key' => env('POSTMARK_API_KEY')],
'resend'   => ['key' => env('RESEND_API_KEY')],
'ses'      => ['key' => env('AWS_ACCESS_KEY_ID'), ...],
```

**WhatsApp:**

```php
'whatsapp' => [
    'provider' => env('WA_PROVIDER', 'fonnte'),
    'api_key'  => env('WA_API_KEY'),
    'api_url'  => env('WA_API_URL', 'https://api.fonnte.com/send'),
    'sender'   => env('WA_SENDER', '6281234567890'),
    'enabled'  => env('WA_ENABLED', false),  // ⚠️ Default OFF
],
```

---

## 13. Models Reference

### 13.1 Class List

| Model | Table | PK | Trait | Route Key |
|---|---|---|---|---|
| `SouvenirProduct` | `souvenir_products` | UUID | `HasFactory`, `SoftDeletes` | `slug` |
| `SouvenirCategory` | `souvenir_categories` | UUID | `HasUuids` | `slug` |
| `SouvenirStore` | `souvenir_stores` | UUID | `HasUuids`, `SoftDeletes` | `slug` |
| `SouvenirStoreCategory` | `souvenir_store_categories` | UUID | `HasUuids` | `id` |
| `SouvenirOrder` | `souvenir_orders` | UUID | `HasUuids`, `SoftDeletes` + implements `PayableBooking` | `id` |
| `SouvenirOrderItem` | `souvenir_order_items` | UUID | `HasUuids`, `SoftDeletes` | `id` |
| `SouvenirReview` | `souvenir_reviews` | UUID | `HasUuids` | `id` |
| `SouvenirShippingMethod` | `souvenir_shipping_methods` | UUID | `HasUuids` | `id` |
| `SouvenirShippingTracking` | `souvenir_shipping_trackings` | UUID | `HasUuids` | `id` |

### 13.2 Key Relations

```php
// SouvenirProduct
$product->category          // belongsTo SouvenirCategory (category_id)
$product->store             // belongsTo SouvenirStore (store_id)
$product->merchant          // belongsTo Merchant (merchant_uuid → merchants.uuid) — cross-DB
$product->orderItems        // hasMany SouvenirOrderItem (product_uuid)
$product->reviews           // hasMany SouvenirReview (product_uuid)

// SouvenirCategory
$category->parent           // belongsTo SouvenirCategory (parent_id)
$category->children         // hasMany SouvenirCategory (parent_id)
$category->products         // hasMany SouvenirProduct (category_id)
$category->getDescendantIds()  // array UUID termasuk children & grandchildren (2 level)

// SouvenirStore
$store->merchant            // belongsTo Merchant (merchant_uuid) — cross-DB
$store->products            // hasMany SouvenirProduct (store_id)
$store->categories          // belongsToMany SouvenirCategory via souvenir_store_categories
$store->storeCategories     // hasMany SouvenirStoreCategory

// SouvenirOrder
$order->user                // belongsTo User (user_uuid → users.uuid) — cross-DB
$order->merchant            // belongsTo Merchant (merchant_uuid) — cross-DB
$order->items               // hasMany SouvenirOrderItem (order_uuid)
$order->shippingTrackings   // hasMany SouvenirShippingTracking (order_uuid)

// SouvenirOrderItem
$item->order                // belongsTo SouvenirOrder (order_uuid)
$item->product              // belongsTo SouvenirProduct (product_uuid)

// SouvenirReview
$review->product            // belongsTo SouvenirProduct (product_uuid)
$review->user               // belongsTo User (user_uuid) — cross-DB
$review->orderItem          // belongsTo SouvenirOrderItem (order_item_uuid)

// SouvenirShippingTracking
$tracking->order            // belongsTo SouvenirOrder (order_uuid)
```

### 13.3 Business Methods — SouvenirOrder

```php
// Status checks
$order->isPending()         // status === 'pending'
$order->isPaid()            // payment_status === 'paid'
$order->isProcessing()      // status === 'processing'
$order->isShipped()         // status === 'shipped'
$order->isCompleted()       // status === 'completed'
$order->isCancelled()       // status === 'cancelled'

// Permission checks
$order->canBeCancelled()    // in [pending, paid, processing]
$order->canBeProcessed()    // status === paid
$order->canBeShipped()      // status === processing
$order->canBeCompleted()    // status === shipped

// Transitions (idempotent)
$order->markAsPaid($amount)     // → paid, payment_status=paid, paid_at=now
$order->markAsProcessing()      // → processing
$order->ship($courier, $tracking, $note, $shippingOrderId)  // → shipped + tracking log
$order->markAsCompleted()       // → completed, completed_at=now
$order->cancel($reason)         // → cancelled, restore stock

// PayableBooking interface
$order->getAmount()             // float
$order->getBookingCode()        // order_number
$order->getServiceType()        // 'marketplace'
$order->getCustomerName()       // $this->user?->name
$order->getCustomerEmail()      // $this->user?->email
$order->getCustomerPhone()      // $this->user?->phone
$order->getCustomerId()         // $this->user?->id (int)
$order->getStartDate()          // ordered_at->toDateString()
$order->getEndDate()            // ordered_at->toDateString()
```

### 13.4 Accessors & Appends

```php
// SouvenirOrder
$order->formatted_total         // "Rp 115.000"
$order->formatted_shipping_cost // "Rp 15.000"
$order->grand_total             // (float) total_amount
$order->status_label            // "Menunggu Pembayaran", "Dibayar", dll
$order->status_badge_class      // "bg-yellow-100 text-yellow-800", dll
$order->payment_status_label    // "Menunggu Pembayaran", "Dibayar", dll

// SouvenirProduct
$product->final_price           // discount_price jika < price, else price

// SouvenirOrderItem
$item->formatted_price          // "Rp 50.000"
$item->formatted_subtotal       // "Rp 100.000"
```

---

## 14. Constants Reference

### 14.1 SouvenirOrder

```php
// Status pesanan
SouvenirOrder::STATUS_PENDING    = 'pending'
SouvenirOrder::STATUS_PAID       = 'paid'
SouvenirOrder::STATUS_PROCESSING = 'processing'
SouvenirOrder::STATUS_SHIPPED    = 'shipped'
SouvenirOrder::STATUS_COMPLETED  = 'completed'
SouvenirOrder::STATUS_CANCELLED  = 'cancelled'

// Status pembayaran
SouvenirOrder::PAYMENT_UNPAID   = 'unpaid'
SouvenirOrder::PAYMENT_PAID     = 'paid'
SouvenirOrder::PAYMENT_FAILED   = 'failed'
SouvenirOrder::PAYMENT_REFUNDED = 'refunded'
```

### 14.2 CentralBooking

```php
// Service type (enum DB)
CentralBooking::SERVICE_HOTEL       = 'hotel'
CentralBooking::SERVICE_DESTINASI   = 'destinasi'
CentralBooking::SERVICE_TOUR        = 'tour'
CentralBooking::SERVICE_KULINER     = 'kuliner'
CentralBooking::SERVICE_RENTAL      = 'rental'
CentralBooking::SERVICE_EVENT       = 'event'
CentralBooking::SERVICE_MICE        = 'mice'
CentralBooking::SERVICE_TRANSPORT   = 'transport'
CentralBooking::SERVICE_MARKETPLACE = 'marketplace'

// Payment status (enum DB)
CentralBooking::PAYMENT_UNPAID    = 'unpaid'
CentralBooking::PAYMENT_PENDING   = 'pending'
CentralBooking::PAYMENT_PAID      = 'paid'
CentralBooking::PAYMENT_REFUNDED  = 'refunded'
CentralBooking::PAYMENT_EXPIRED   = 'expired'
CentralBooking::PAYMENT_CANCELLED = 'cancelled'
```

### 14.3 FlipTransaction

```php
FlipTransaction::STATUS_PENDING   = 'PENDING'
FlipTransaction::STATUS_PAID      = 'PAID'
FlipTransaction::STATUS_EXPIRED   = 'EXPIRED'
FlipTransaction::STATUS_FAILED    = 'FAILED'
FlipTransaction::STATUS_CANCELLED = 'CANCELLED'
```

---

## 15. Changelog

### v2.1 — 2026-10-08

**Breaking Changes:**

- `SouvenirOrderItem` fillable berubah:
  - `product_price` → `price`
  - `order_id` → `order_uuid` (FK)
  - `product_id` → `product_uuid` (FK)
- Connection di semua model marketplace: `marketplace` → `souvenir_sql`
- `SouvenirOrder` sekarang implement `PayableBooking` (breaking untuk code yang pakai `status` sebagai `isPaid`)

**Fixes:**

- FK inconsistency `order_id` vs `order_uuid` di relasi `items()` & `shippingTrackings()`
- `PaymentController::resolveBooking()` — schema-aware lookup (support UUID & kode booking)
- `PaymentController::findBookingByCode()` — schema-aware lookup lintas model
- `ShippingWebhookController` — fix `$order->uuid` → `$order->id`
- Flip webhook signature verification (sebelumnya di-comment)
- Enum `central_bookings.service_type` += `marketplace`
- Enum `central_bookings.payment_status` += `cancelled`
- `scopeSearch` di `SouvenirProduct` — fix OR precedence bug

**Additions:**

- `SouvenirCategory::getDescendantIds()` — 2 level
- `SouvenirCategory::getRouteKeyName()` → `slug`
- `SouvenirStore::getRouteKeyName()` → `slug`
- `SouvenirShippingMethod::scopeActive()`
- `SouvenirOrder::shippingTrackings()` relation
- `SouvenirOrder::PAYMENT_UNPAID = 'unpaid'` (sesuai DB default)
- Route binding slug untuk `SouvenirCategory` & `SouvenirStore`
- Controller `Public\StoreController` — endpoint publik untuk toko
- Controller `Public\CustomerOrderController` — buat / list / cancel / track order
- Route `POST /api/v2/customer/orders` — customer bisa pesan
- Config `services.flip.skip_signature_validation` — env flag untuk dev

**Removed:**

- File `Api\Payment\FlipWebhookController.php` (dead code, duplikat `Api\Webhook\FlipWebhookController`)

### v2.0 — 2026-09-xx

- Rilis awal dokumentasi marketplace API

---

## 16. Referensi

- [Flip API Docs](https://docs.flip.id)
- [KiriminAja Docs](https://developer.kiriminaja.com)
- [RajaOngkir Docs](https://rajaongkir.com/dokumentasi)
- [Fonnte WA Gateway](https://docs.fonnte.com)
- [Laravel Sanctum](https://laravel.com/docs/sanctum)
- [Laravel Eloquent Relationships](https://laravel.com/docs/eloquent-relationships)

---

**Maintained by:** Backend Team Ovisito
**Last updated:** 2026-10-08
**Version:** 2.1

# Marketplace API — Ovisito

Dokumentasi endpoint marketplace souvenir (multi-database) untuk platform Ovisito.

**Versi:** 2.6 · **Terakhir diupdate:** 2026-10-08

**Base URL API:** https://api.ovisito.com

**Base URL Frontend Merchant:** https://merchant.ovisito.com

## Daftar Isi

1. Overview
2. Arsitektur Multi-Service
3. Database Connection
4. Response Format
5. Authentication & Middleware
6. Public Endpoints
7. Customer Endpoints
8. Merchant Endpoints
9. Admin Endpoints
10. Payment Integration (Flip)
11. Shipping Integration
12. Order Lifecycle
13. Notification
14. Models Reference
15. Constants Reference
16. Roadmap & Known Issues
17. Changelog
18. Referensi

## 1. Overview

Modul marketplace menangani produk souvenir, toko, kategori, order, pembayaran (Flip), shipping, dan review.

### Akses & Role

| Role | Auth | Endpoint Prefix |
|---|---|---|
| Public | client.auth | /api/v2/public/souvenir/* |
| Customer | client.auth + auth:sanctum / auth:customer | /api/v2/customer/* |
| Merchant | client.auth + auth:merchant_api | /api/v2/merchant/* |
| Admin | auth:admin_api + admin | /api/v2/admin/marketplace/* |
| Webhook | Signature verification | /api/webhook/* |

## 2. Arsitektur Multi-Service

Platform Ovisito terdiri dari 9 layanan dengan database terpisah, disatukan oleh CentralBooking aggregator.

```text
Modul (DB terpisah)              → CentralBooking (payment DB)
├── hotel (wisata_aceh)          → central_bookings
├── destinasi (wisata_aceh)      → central_bookings
├── tour (wisata_aceh)           → central_bookings
├── kuliner (kuliner_aceh)       → central_bookings
├── rental (aceh_sewa)           → central_bookings
├── event (events)               → central_bookings
├── mice (mice)                  → central_bookings
├── transport (aceh_transport)   → central_bookings
└── marketplace (souvenir_sql)   → central_bookings
```

Satu payment gateway (Flip) untuk semua layanan. Setiap booking tercatat di `central_bookings` sebagai aggregator.

### PayableBooking Interface

Setiap model yang bisa dibayar wajib implement `App\Contracts\PayableBooking`:

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

## 3. Database Connection

Modul marketplace menggunakan 3 koneksi database terpisah:

| Connection | Fungsi | Model |
|---|---|---|
| souvenir_sql | Produk, kategori, order, review | Semua model App\Models\Marketplace\* |
| payment | Central booking, Flip transaction | CentralBooking, FlipTransaction, MerchantWithdrawal |
| user | User, Merchant, Admin, ClientApp | User, Merchant, ClientApp |

### Cara Deklarasi

```php
class SouvenirOrder extends Model
{
    protected $connection = 'souvenir_sql';
    protected $table      = 'souvenir_orders';
}
```

### Relasi Cross-Database

Laravel handle otomatis:

```php
// SouvenirOrder → User (cross-DB)
public function user()
{
    return $this->belongsTo(User::class, 'user_uuid', 'uuid');
}
```

> ⚠️ **Catatan penting:** Jangan pakai `->on('connection')` untuk query Eloquent. Gunakan `$connection` property di model — biar konsisten dan tidak bentrok.

### Tabel Marketplace

| Tabel | PK | Route Key |
|---|---|---|
| souvenir_products | UUID | slug |
| souvenir_categories | UUID | slug |
| souvenir_stores | UUID | slug |
| souvenir_store_categories | UUID | id |
| souvenir_orders | UUID | id |
| souvenir_order_items | UUID | id |
| souvenir_reviews | UUID | id |
| souvenir_shipping_methods | UUID | id |
| souvenir_shipping_trackings | UUID | id |

### Cross-Service FK

| Dari | Ke | Tipe |
|---|---|---|
| souvenir_orders.user_uuid | users.uuid | char(36) |
| souvenir_orders.merchant_uuid | merchants.uuid | char(36) |
| souvenir_orders.id | souvenir_order_items.order_uuid | char(36) |
| souvenir_order_items.product_uuid | souvenir_products.id | char(36) |
| souvenir_shipping_trackings.order_uuid | souvenir_orders.id | char(36) |
| souvenir_reviews.product_uuid | souvenir_products.id | char(36) |
| central_bookings.user_id | users.id | int unsigned |

> ⚠️ MySQL tidak support FK lintas-database. Relasi di-enforce di app-layer via Eloquent.

## 4. Response Format

### Sukses

```json
{
  "status": true,
  "message": "Optional message",
  "data": { }
}
```

`data` dapat berupa object, array, atau null.

### Error

```json
{
  "status": false,
  "message": "Pesan error",
  "errors": { "field": ["..."] }
}
```

### HTTP Status

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
| 502 | Bad Gateway (upstream error, mis. KiriminAja) |

### Pagination Meta

Standar v2.6: `data` array + `meta` object (bukan paginator nested).

```json
{
  "status": true,
  "data": [ ],
  "meta": { "current_page": 1, "last_page": 5, "per_page": 12, "total": 60 }
}
```

> ⚠️ **Breaking change v2.6:** Semua endpoint list (order merchant, transaksi, withdrawal, product merchant) sekarang konsisten pakai format di atas. Sebelumnya ada yang return paginator object langsung.

## 5. Authentication & Middleware

### Middleware Registry

| Middleware | Header | Fungsi |
|---|---|---|
| client.auth | X-Client-ID, X-Client-Secret | Identifikasi platform/app |
| auth:sanctum | Authorization: Bearer <token> | Customer (marketplace order, payment) |
| auth:customer | Authorization: Bearer <token> | Customer (support, transport) |
| auth:merchant_api | Authorization: Bearer <token> | Authenticated merchant |
| auth:admin_api | Authorization: Bearer <token> | Authenticated admin |
| admin | — | Cek role admin |
| throttle:120,1 | — | Rate limit 120 req/menit |

### ⚠️ Perbedaan Guard Customer

Ada dua guard berbeda untuk customer:

- `auth:sanctum` — untuk marketplace (`/customer/orders/*`, `/customer/payment/*`)
- `auth:customer` — untuk support tickets & transport bookings

Konsisten dengan route masing-masing. Jangan tertukar.

### Client Auth

Semua endpoint `/api/v2/public/*`, `/api/v2/customer/*`, `/api/v2/merchant/*` wajib sertakan:

```text
X-Client-ID: client_web
X-Client-Secret: <secret>
```

Client credentials didaftarkan di tabel `client_apps` (connection `user`).

### Merchant Auth Flow

```text
POST /api/v2/merchant/register
   ↓
POST /api/v2/merchant/login         → dapat token Sanctum
   ↓
Authorization: Bearer <token>       → untuk semua endpoint merchant
   ↓
POST /api/v2/merchant/logout        → revoke token
```

## 6. Public Endpoints

**Base:** `/api/v2/public/souvenir` · **Middleware:** `client.auth`, `throttle:120,1` · **Auth User:** tidak perlu

### 6.1 Products

#### GET /products

| Param | Tipe | Default | Deskripsi |
|---|---|---|---|
| search | string | — | Cari nama & deskripsi |
| category | string | — | Slug atau UUID kategori (auto-include children) |
| merchant_uuid | uuid | — | Filter per merchant |
| featured | bool | false | Hanya produk unggulan |
| min_price / max_price | numeric | — | Range harga |
| in_stock | bool | false | Hanya yang ada stok |
| sort | enum | latest | latest / price_asc / price_desc / popular |
| per_page | int | 12 | Max 60 |
| page | int | 1 | — |

Response:

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
      "discount_price": "40000.00",
      "final_price": 40000,
      "stock": 100,
      "weight": "250.00",
      "images": ["souvenir/products/..."],
      "is_active": true,
      "featured": false,
      "views": 42,
      "sku": "SKU-ABCD1234",
      "category": { "id": "...", "name": "Minuman", "slug": "minuman" },
      "store": { "id": "...", "name": "Toko Kopi Aceh", "slug": "toko-kopi-aceh" },
      "merchant": { "uuid": "...", "name": "Merchant Name" }
    }
  ],
  "meta": { "current_page": 1, "last_page": 5, "per_page": 12, "total": 60 }
}
```

> ⭐ **Baru di v2.6:** field `final_price` (float). FE tidak perlu hitung manual: kalau `discount_price < price`, pakai `discount_price`, else `price`.

#### GET /products/{slug}

Detail produk + reviews (10) + related (8). Increment `views` otomatis.

#### GET /featured

Query: `limit` (default 8, max 24).

### 6.2 Categories

#### GET /categories

| Param | Default | Deskripsi |
|---|---|---|
| with_children | true | Include sub-kategori |
| only_parents | true | Hanya kategori root |

#### GET /categories/{slug}

Auto-include children via `getDescendantIds()` — BFS, tidak dibatasi 2 level (update v2.6).

### 6.3 Stores

```text
GET /stores         → list store (search, merchant_uuid, kabupaten_id, is_physical, per_page)
GET /stores/{slug}  → detail store + 12 produk terbaru
```

### 6.4 Shipping Methods

```text
GET  /shipping-methods
POST /shipping-methods/calculate    → body: { weight, method_id }
```

## 7. Customer Endpoints

**Base:** `/api/v2/customer` · **Middleware:** `client.auth` + `auth:sanctum`

### 7.1 Orders

#### POST /orders

Request Body:

```json
{
  "merchant_uuid": "uuid",
  "items": [ { "product_uuid": "uuid", "quantity": 2 } ],
  "shipping_address": {
    "name": "Budi",
    "phone": "628123456789",
    "address": "Jl. ...",
    "city": "Banda Aceh",
    "postal_code": "23116"
  },
  "shipping_cost": 15000,
  "courier": "jne"
}
```

Business Rules:

- Satu order = satu merchant
- Stock di-decrement atomic (`lockForUpdate`)
- Harga pakai `final_price` (discount jika ada)
- Status awal: `pending`, payment: `unpaid`
- Auto-generate `order_number`: `SO-YYYYMMDD-XXXXXXXX`
- ⭐ Auto-trigger `PaymentService::processPayment()` → customer langsung dapat `payment_url`

> ⚠️ **Catatan `shipping_address.phone`:** WAJIB format `628xxx` — dipakai sebagai target WA notif customer. Kalau `08xxx`, service auto-normalize ke `628xxx`.

Response (201):

```json
{
  "status": true,
  "message": "Pesanan berhasil dibuat. Silakan lanjut ke pembayaran.",
  "data": {
    "order": {
      "id": "uuid",
      "order_number": "SO-20261008-XXXXXXXX",
      "total_amount": "135000.00",
      "shipping_cost": "15000.00",
      "discount_total": "0.00",
      "status": "pending",
      "payment_status": "unpaid",
      "flip_bill_id": "362xxx",
      "shipping_address": { },
      "items": [ ],
      "ordered_at": "2026-10-08T10:30:00.000000Z"
    },
    "payment": {
      "next_step": "POST /api/v2/customer/payment/process",
      "booking_type": "marketplace",
      "booking_id": "SO-20261008-XXXXXXXX",
      "payment_url": "https://flip.id/pwf-sandbox/..."
    }
  }
}
```

Flow otomatis setelah create order:

```text
1. SouvenirOrder dibuat (pending, flip_bill_id=null)
2. Observer::created() → log saja (skip notif)
3. AUTO trigger PaymentService::processPayment()
4. Flip API → bill_id + payment_url
5. Set flip_bill_id di order
6. Observer::updated() detect flip_bill_id changed
7. MarketplaceNotificationService::orderCreated($order, $paymentUrl)
8. 📧 Email "Pesanan Diterima + 💳 Bayar Sekarang →"
9. 📱 WA "Pesanan Diterima + Link Bayar"
10. Response 201
```

**Fallback:** Kalau auto-payment gagal, order tetap dibuat + notif tetap dikirim tanpa `payment_url`.

#### GET /orders

List order user. Filter: `status`, `per_page` (max 50).

#### GET /orders/{order_number}

Detail order + `items.product` + `merchant` + `shipping_trackings`.

#### POST /orders/{order_number}/cancel

Body opsional: `{ "reason": "..." }`. Hanya boleh cancel kalau status `pending`, `paid`, atau `processing`. Stock otomatis dikembalikan.

#### GET /orders/{order_number}/track

Response: `order_number`, `status`, `status_label`, `courier`, `tracking_number`, `history`.

### 7.2 Payment

**Base:** `/api/v2/customer/payment`

#### POST /process

Request Body:

```json
{
  "booking_type": "marketplace",
  "booking_id": "SO-20261008-XXXXXXXX",
  "payment_method": "qris",
  "payment_channel": null
}
```

Response:

```json
{
  "status": true,
  "message": "Pembayaran berhasil diproses. Silakan selesaikan pembayaran.",
  "data": {
    "booking_code": "SO-20261008-XXXXXXXX",
    "booking_type": "marketplace",
    "amount": "135000.00",
    "status": "pending",
    "payment_url": "https://flip.id/pwf-sandbox/...",
    "qr_code": "data:image/png;base64,...",
    "flip_bill_id": "362438"
  }
}
```

Idempotent — kalau ada bill aktif belum expired, reuse bill lama. Endpoint ini opsional untuk retry — auto-trigger dari `POST /customer/orders` sudah handle.

#### GET /qr/{bookingCode}

#### GET /status/{bookingCode}

## 8. Merchant Endpoints

**Base:** `/api/v2/merchant` · **Middleware:** `client.auth` + `auth:merchant_api` + `throttle:120,1`

### 8.1 Auth

**Base:** `/api/v2/merchant` · **Middleware:** `client.auth` + `throttle:120,1` (public, tanpa auth)

#### POST /register

Request Body:

```json
{
  "name": "Budi Santoso",
  "email": "budi@merchant.com",
  "password": "password123",
  "password_confirmation": "password123",
  "phone": "081234567890",
  "business_name": "Toko Kopi Aceh",
  "business_type": "souvenir",
  "address": "Jl. ...",
  "city": "Banda Aceh",
  "province": "Aceh",
  "postal_code": "23116",
  "description": "optional",
  "website": "https://...",
  "category_id": "optional"
}
```

`business_type` enum: `hotel`, `kuliner`, `rental`, `tour`, `destinasi`, `souvenir`.

Response (201):

```json
{
  "status": true,
  "message": "Registrasi berhasil. Silakan cek email untuk verifikasi.",
  "data": { "uuid": "uuid", "email": "budi@merchant.com" }
}
```

Error 422: email/phone sudah terdaftar.

#### POST /login

Request Body:

```json
{
  "email": "budi@merchant.com",
  "password": "password123",
  "device_name": "web-merchant"
}
```

Response:

```json
{
  "status": true,
  "message": "Login berhasil.",
  "data": {
    "token": "1|abcdef...",
    "merchant": {
      "uuid": "...",
      "name": "Budi Santoso",
      "email": "...",
      "phone": "...",
      "business_name": "Toko Kopi Aceh",
      "business_type": "souvenir",
      "address": "...",
      "city": "Banda Aceh",
      "province": "Aceh",
      "category_id": null,
      "logo": null,
      "balance": 0,
      "status": "pending",
      "verified_status": "unverified",
      "partnership_type": null,
      "email_verified_at": "2026-10-08T10:00:00.000000Z"
    }
  }
}
```

Error 403: akun tidak aktif / email belum diverifikasi. Error 422: email atau password salah.

#### POST /logout

Middleware: `auth:merchant_api`. Revoke token aktif.

#### GET /verify-email/{uuid}?hash=<sha1_email>

Verify email merchant. Hash = `sha1(email)`.

#### POST /resend-verification

Body: `{ "email": "..." }`. Anti user-enumeration — selalu return pesan sukses.

#### POST /forgot-password

Body: `{ "email": "..." }`. Kirim email reset password via `MerchantResetPasswordMail`. Response selalu: "Jika email terdaftar, link reset password telah dikirim."

#### POST /reset-password

Request Body:

```json
{
  "token": "<token_dari_email>",
  "email": "budi@merchant.com",
  "password": "newpassword",
  "password_confirmation": "newpassword"
}
```

Token valid 60 menit. Setelah reset, semua token Sanctum di-revoke.

### 8.2 Profile

Middleware: `auth:merchant_api`

#### GET /profile

Response:

```json
{
  "status": true,
  "data": {
    "uuid": "...",
    "name": "...",
    "email": "...",
    "phone": "...",
    "business_name": "...",
    "business_type": "souvenir",
    "address": "...",
    "city": "...",
    "province": "...",
    "postal_code": "...",
    "description": "...",
    "website": "...",
    "logo": "merchants/uuid/logo.png",
    "status": "active",
    "verified_status": "verified",
    "partnership_type": "regular",
    "balance": 150000,
    "category_id": null,
    "email_verified_at": "...",
    "created_at": "...",
    "updated_at": "..."
  }
}
```

`password`, `remember_token`, `tokens` tidak di-expose.

#### PUT /profile

Body (multipart/form-data untuk upload logo):

| Field | Tipe | Deskripsi |
|---|---|---|
| name | string | — |
| phone | string | Max 20 |
| business_name | string | Max 255 |
| address | string | — |
| city | string | Max 100 |
| province | string | Max 100 |
| postal_code | string | Max 10 |
| description | string | Max 1000 |
| website | url | Max 255 |
| logo | file | jpeg/png/jpg/webp, max 2 MB |

Semua field `sometimes`. Logo lama otomatis dihapus kalau upload logo baru.

#### PUT /change-password

Request Body:

```json
{
  "current_password": "password123",
  "new_password": "newpassword456",
  "new_password_confirmation": "newpassword456"
}
```

Rules:

- Password baru minimal 8 karakter
- Password baru ≠ password lama
- Setelah ganti → semua token lain di-revoke (kecuali token sekarang)

Error 422: current password salah / password baru sama dengan lama.

### 8.3 Dashboard

Middleware: `auth:merchant_api`

#### GET /dashboard

Response:

```json
{
  "status": true,
  "data": {
    "summary": {
      "total_orders": 42,
      "total_revenue": 5250000,
      "formatted_revenue": "Rp 5.250.000",
      "total_products": 15,
      "active_products": 12,
      "out_of_stock": 2,
      "low_stock": 3,
      "balance": 150000,
      "formatted_balance": "Rp 150.000"
    },
    "order_status": {
      "pending": 3, "paid": 1, "processing": 2,
      "shipped": 1, "completed": 34, "cancelled": 1
    },
    "recent_orders": [
      {
        "order_number": "SO-20261008-XXXXXXXX",
        "total_amount": 135000,
        "formatted_total": "Rp 135.000",
        "status": "paid",
        "status_label": "Dibayar",
        "status_badge": "bg-blue-100 text-blue-800",
        "customer_name": "Budi",
        "ordered_at": "2026-10-08T10:30:00.000000Z",
        "items_count": 2
      }
    ],
    "sales_chart": [
      { "date": "2026-10-02", "label": "Wed", "total_orders": 3, "total_revenue": 350000 }
    ]
  }
}
```

#### GET /dashboard/summary

Response ringkas: `today_orders`, `today_revenue`, `week_orders`, `pending_orders`, `balance`.

### 8.4 Store Management

Middleware: `auth:merchant_api`

#### GET /store

Ambil toko default merchant.

Response 200:

```json
{
  "status": true,
  "data": {
    "id": "uuid",
    "merchant_uuid": "uuid",
    "name": "Toko Kopi Aceh",
    "slug": "toko-kopi-aceh",
    "description": "...",
    "address": "...",
    "phone": "...",
    "email": null,
    "website": null,
    "logo": null,
    "is_physical": true,
    "is_active": true,
    "is_default": true,
    "kabupaten_kota_id": null,
    "kecamatan_id": null,
    "desa_id": null,
    "latitude": null,
    "longitude": null,
    "jam_buka": "08:00",
    "jam_tutup": "17:00",
    "category_ids": ["uuid1", "uuid2"],
    "categories": [ { "id": "...", "name": "..." } ],
    "created_at": "...",
    "updated_at": "..."
  }
}
```

Response 404 kalau belum punya toko: `{ "status": false, "message": "Toko tidak ditemukan.", "data": null }`.

#### POST /store

Buat toko baru. Satu merchant hanya boleh punya 1 toko (untuk sekarang).

Request Body (multipart/form-data):

| Field | Tipe | Wajib | Deskripsi |
|---|---|---|---|
| name | string | ✅ | Max 255 |
| address | string | ✅ | — |
| phone | string | ✅ | Max 20 |
| category_ids | array | ✅ | 1–5 UUID kategori |
| description | string | ❌ | — |
| email | email | ❌ | — |
| website | url | ❌ | — |
| is_physical | bool | ❌ | Default true |
| logo | file | ❌ | jpeg/png/jpg/webp, max 2 MB |
| kabupaten_kota_id | int | ❌ | — |
| kecamatan_id | int | ❌ | — |
| desa_id | int | ❌ | — |
| latitude | numeric | ❌ | -90 s/d 90 |
| longitude | numeric | ❌ | -180 s/d 180 |
| jam_buka | string | ❌ | Format HH:MM |
| jam_tutup | string | ❌ | Format HH:MM |

Response (201): data store lengkap. Error 422: merchant sudah punya toko / validasi gagal.

#### PUT /store

Update toko. Semua field `sometimes`. Slug otomatis regenerate kalau `name` berubah.

> ⭐ **v2.6:** Set field jadi `null` sekarang benar-benar update (mis. `{"website": null}` → website jadi null). Sebelumnya di-skip.

#### GET /store/{uuid}

Detail toko by UUID.

### 8.5 Categories (Read-Only)

Middleware: `auth:merchant_api`

#### GET /souvenir/categories

Ambil kategori aktif berbentuk tree (parent + children).

```json
{
  "status": true,
  "data": [
    {
      "id": "uuid",
      "name": "Makanan",
      "slug": "makanan",
      "description": "...",
      "parent_id": null,
      "is_active": true,
      "children": [
        { "id": "uuid", "name": "Kue Kering", "slug": "kue-kering", "description": null, "parent_id": "uuid", "is_active": true, "children": [] }
      ]
    }
  ],
  "message": "Daftar kategori berhasil diambil."
}
```

Merchant hanya boleh read kategori — CRUD adalah wewenang admin.

### 8.6 Souvenir Products

**Base:** `/api/v2/merchant/souvenir/products`

#### GET /products

Query: `search`, `category_id`, `is_active`, `featured`, `per_page` (max 60), `page`.

```json
{
  "status": true,
  "data": [
    {
      "id": "uuid",
      "name": "Kopi Aceh Gayo",
      "slug": "kopi-aceh-gayo",
      "sku": "SKU-ABCD1234",
      "price": "50000.00",
      "discount_price": "40000.00",
      "final_price": 40000,
      "stock": 100,
      "weight": "250.00",
      "images": ["souvenir/products/..."],
      "is_active": true,
      "featured": false,
      "views": 42,
      "category": { },
      "store": { }
    }
  ],
  "meta": { "current_page": 1, "last_page": 3, "per_page": 15, "total": 42 }
}
```

#### POST /products

Request Body (multipart/form-data):

| Field | Tipe | Wajib | Deskripsi |
|---|---|---|---|
| name | string | ✅ | Max 255 |
| price | numeric | ✅ | Min 0 |
| stock | int | ✅ | Min 0 |
| sku | string | ❌ | Auto-generate kalau kosong |
| category_id | uuid | ❌ | — |
| store_id | uuid | ❌ | Default store merchant |
| description | string | ❌ | — |
| discount_price | numeric | ❌ | Harus < price |
| weight | numeric | ❌ | Gram |
| images | array | ❌ | Max 5 file, jpeg/png/jpg/gif/webp, max 2 MB each |
| is_active | bool | ❌ | Default true |
| featured | bool | ❌ | Default false |

Response (201):

```json
{ "status": true, "message": "Produk berhasil ditambahkan.", "data": { } }
```

#### GET /products/{id}

Detail produk milik merchant.

#### PUT/PATCH /products/{id}

Update produk. Field `sometimes`. Slug auto-regenerate kalau `name` berubah. Image baru di-append.

#### DELETE /products/{id}

Soft delete. Semua file image dihapus dari disk.

#### PUT /products/{id}/stock

Request Body: `{ "stock": 25 }`

```json
{
  "status": true,
  "message": "Stok produk berhasil diperbarui.",
  "data": { "id": "uuid", "name": "Kopi Aceh Gayo", "stock": 25 }
}
```

#### PUT /products/{id}/toggle-active

Toggle `is_active`.

```json
{
  "status": true,
  "message": "Produk diaktifkan.",
  "data": { "id": "uuid", "name": "...", "is_active": true }
}
```

### 8.7 Souvenir Orders

**Base:** `/api/v2/merchant/souvenir/orders`

#### GET /orders

Query: `status`, `search` (order_number), `date_from`, `date_to`, `per_page` (max 50), `page`.

```json
{
  "status": true,
  "data": [
    {
      "id": "uuid",
      "order_number": "SO-20261008-XXXXXXXX",
      "status": "paid",
      "payment_status": "paid",
      "total_amount": "135000.00",
      "shipping_cost": "15000.00",
      "user": { "uuid": "...", "name": "Budi" },
      "items": [ ],
      "shipping_trackings": [ ],
      "ordered_at": "2026-10-08T10:30:00.000000Z"
    }
  ],
  "meta": { }
}
```

#### GET /orders/{uuid}

Detail order + items + product + tracking.

#### PUT /orders/{uuid}/status

Request Body:

```json
{ "status": "processing", "reason": "optional, wajib kalau cancelled" }
```

Transisi valid via endpoint ini:

| Dari | Ke |
|---|---|
| paid | processing, cancelled |
| processing | cancelled |
| shipped | completed |

> ⚠️ **Breaking change v2.6:** Status `shipped` tidak boleh di-set lewat endpoint ini. Wajib lewat `/ship` atau `/ship-kiriminaja` supaya `tracking_number` + shipping log konsisten.

Error 422: transisi tidak valid / status tidak diizinkan.

#### POST /orders/{uuid}/ship

Kirim manual — input resi + kurir.

```json
{
  "tracking_number": "JNE1234567890",
  "courier": "jne",
  "delivery_note": "optional, max 500"
}
```

Aturan:

- Order harus `paid` atau `processing`
- Belum punya `tracking_number` (cegah overwrite)

Response:

```json
{ "status": true, "message": "Pesanan berhasil dikirim.", "data": { } }
```

Error 422: status tidak valid / sudah punya resi.

#### POST /orders/{uuid}/ship-kiriminaja

Kirim via KiriminAja — auto AWB.

```json
{
  "sender_name": "...",
  "sender_phone": "...",
  "sender_address": "...",
  "sender_district_id": 12345,
  "recipient_name": "Budi",
  "recipient_phone": "628123456789",
  "recipient_address": "Jl. ...",
  "recipient_district_id": 54321,
  "courier_code": "jne",
  "service_type": "REG",
  "schedule": null,
  "weight": 500,
  "width": 20,
  "height": 10,
  "length": 15,
  "delivery_note": "optional"
}
```

`courier_code` enum: `jne`, `jnt`, `sicepat`, `pos`, `anteraja`.

Response:

```json
{
  "status": true,
  "message": "Pesanan berhasil dikirim via KiriminAja.",
  "data": { "order": { }, "shipping": { } }
}
```

`shipping` berisi response KiriminAja. Error 502: KiriminAja return error.

#### GET /orders/{uuid}/track

```json
{
  "status": true,
  "data": {
    "tracking_number": "JNE1234567890",
    "courier": "jne",
    "tracking": { },
    "history": [ ],
    "remote_error": null
  }
}
```

`tracking` = response KiriminAja, `history` = `shipping_trackings` lokal. `remote_error` diisi kalau KiriminAja timeout/error, tapi history lokal tetap dikirim.

### 8.8 Transactions & Withdraw

**Base:** `/api/v2/merchant`

#### GET /transactions

Gabungan pemasukan (order completed) + pengeluaran (withdrawal).

```json
{
  "status": true,
  "data": [
    {
      "id": "uuid",
      "type": "order",
      "amount": 135000,
      "formatted_amount": "Rp 135.000",
      "is_credit": true,
      "reference": "SO-20261008-XXXXXXXX",
      "description": "Pembayaran order",
      "created_at": "2026-10-08T10:30:00.000000Z"
    },
    {
      "id": "uuid",
      "type": "withdrawal",
      "amount": -50000,
      "formatted_amount": "Rp 50.000",
      "is_credit": false,
      "reference": "uuid",
      "description": "Penarikan saldo",
      "status": "pending",
      "created_at": "2026-10-07T15:00:00.000000Z"
    }
  ],
  "meta": { }
}
```

> **v2.6:** Karena `souvenir_orders` dan `merchant_withdrawals` di connection berbeda, query tidak pakai UNION SQL — di-merge di PHP.

#### POST /withdraw

```json
{
  "amount": 50000,
  "bank_name": "BCA",
  "bank_account": "1234567890",
  "account_name": "Budi Santoso"
}
```

Rules:

- Minimum Rp 10.000, maximum Rp 100.000.000
- Saldo harus cukup
- Lock merchant row untuk cegah double-withdraw

Response:

```json
{
  "status": true,
  "message": "Permintaan penarikan berhasil. Proses 1-3 hari kerja.",
  "data": {
    "withdrawal_id": "uuid",
    "amount": 50000,
    "formatted_amount": "Rp 50.000",
    "balance_after": 100000,
    "formatted_balance_after": "Rp 100.000"
  }
}
```

Error 422: saldo tidak cukup / validasi gagal.

#### GET /withdrawals

Riwayat penarikan. Pagination standard.

### 8.9 Support Tickets

**Base:** `/api/v2/merchant/support/tickets` · **Middleware:** `auth:merchant_api`

```text
GET  /tickets
POST /tickets
GET  /tickets/{id}
POST /tickets/{id}/messages
```

> ⚠️ Controller: `App\Http\Controllers\Api\Admin\Support\TicketController` (namespace legacy, dipakai bersama merchant & customer).

## 9. Admin Endpoints

**Base:** `/api/v2/admin/marketplace` · **Middleware:** `throttle:120,1` + `auth:admin_api` + `admin`

| Resource | CRUD | Extra |
|---|---|---|
| Products | ✅ | stats, images, toggle-active, toggle-featured |
| Categories | ✅ | tree, toggle-active, stats |
| Orders | ✅ | mark-paid, mark-completed, ship, update-status, stats, trends |
| Reviews | ✅ | stats |
| Shipping Methods | ✅ | active/list, toggle-active |
| Stores | ✅ | set-default, toggle-active, stats |
| Merchants | R/U | verify, products, orders |

## 10. Payment Integration (Flip)

### 10.1 Konfigurasi

`config/services.php`:

```php
'flip' => [
    'api_key'                   => env('FLIP_API_KEY'),
    'webhook_token'             => env('FLIP_WEBHOOK_TOKEN'),
    'validation_token'          => env('FLIP_VALIDATION_TOKEN', env('FLIP_WEBHOOK_TOKEN')),
    'base_url'                  => env('FLIP_BASE_URL', 'https://bigflip.id/big_sandbox_api'),
    'sandbox_mode'              => env('FLIP_SANDBOX', true),
    'timeout'                   => env('FLIP_TIMEOUT', 15),
    'default_expiry_minutes'    => env('FLIP_DEFAULT_EXPIRY_MINUTES', 30),
    'skip_signature_validation' => env('FLIP_SKIP_SIGNATURE', false),
],
```

`config/flip.php`:

```php
'pwf_api_version' => env('FLIP_PWF_API_VERSION', 'v2'),
```

### 10.2 Environment

| Mode | Base URL | API Version |
|---|---|---|
| Sandbox | https://bigflip.id/big_sandbox_api | v2 |
| Production | https://bigflip.id/api | v3 |

> ⚠️ Saat ini sandbox — live masih proses verifikasi.

### 10.3 Central Booking

Enum `service_type`: `hotel` | `kuliner` | `rental` | `destinasi` | `tour` | `event` | `mice` | `transport` | `marketplace`

Enum `payment_status`: `unpaid` | `pending` | `paid` | `refunded` | `expired` | `cancelled`

### 10.4 Payment Flow (Fase 6 — Auto Trigger)

**Entry point utama:** `POST /customer/orders` (bukan lagi manual ke `/payment/process`)

```text
1. Customer checkout → POST /customer/orders
   ├─ Buat SouvenirOrder (pending, unpaid)
   ├─ Reserve stock (atomic decrement)
   ├─ AUTO trigger PaymentService::processPayment():
   │   ├─ syncCentralBooking() (dengan user_id)
   │   ├─ FlipPaymentService::createBillFromPayable()
   │   │   └─ HTTP POST ke Flip → bill_id + payment_url
   │   ├─ Set flip_bill_id di SouvenirOrder
   │   └─ Update CentralBooking via flip_bill_id
   ├─ Observer::updated() trigger orderCreated($order, $paymentUrl)
   │   ├─ 📧 Email + tombol Bayar
   │   └─ 📱 WA + link bayar
   └─ Response 201 dengan payment_url

2. Customer klik tombol dari email → bayar di Flip

3. Webhook Flip: POST /api/webhook/flip
   ├─ validateSignature (HMAC SHA256)
   ├─ FlipTransaction.markAsPaid()
   ├─ SouvenirOrder.markAsPaid()
   └─ MarketplaceNotificationService::orderPaid()
       ├─ 📧 Email "Pembayaran Berhasil"
       └─ 📱 WA "Pembayaran Berhasil"
```

Endpoint `POST /customer/payment/process` tetap ada — untuk retry/manual kalau auto-payment gagal.

### 10.5 Webhook Flip

**Endpoint:** `POST /api/webhook/flip`

**Header:** `X-Callback-Signature: HMAC-SHA256(raw_body, validation_token)`

Payload (flat):

```json
{
  "id": 362438,
  "bill_id": 362438,
  "status": "SUCCESSFUL",
  "amount": 135000,
  "reference_id": "SO-20261008-XXXXXXXX",
  "sender_bank": "bca",
  "sender_name": "Budi",
  "payment_method": "bank_transfer",
  "paid_at": "2026-10-08 10:30:00"
}
```

Status didukung:

| Status | Handler |
|---|---|
| SUCCESSFUL / PAID | handlePaid() → markAsPaid + notif |
| FAILED / CANCELLED | handleFailed() |
| EXPIRED | handleExpired() |
| PENDING | ignored |

**Idempotency:** Kalau sudah paid, skip processing.

**Guard v2.6:** Webhook SUCCESSFUL tidak akan mengubah order yang sudah `cancelled` menjadi `paid`.

**Dev mode:** `FLIP_SKIP_SIGNATURE=true` untuk skip verifikasi. ⚠️ JANGAN di production.

## 11. Shipping Integration

### 11.1 Shipping Methods

Tabel `souvenir_shipping_methods` — metode manual yang di-set admin. Field: `name`, `courier_code`, `base_cost`, `description`, `is_active`.

### 11.2 Shipping Tracking

Tabel `souvenir_shipping_trackings` — history tracking order. Field: `order_uuid`, `status`, `description`, `location`, `tracked_at`.

### 11.3 KiriminAja Integration

- `KiriminAjaService::createOrder()` — request pickup & dapat AWB
- `KiriminAjaService::trackOrder()` — lacak by AWB

### 11.4 Webhook Shipping

**Endpoint:** `POST /api/webhook/shipping`

Payload flexible:

```json
{
  "awb": "JNE1234567890",
  "status": "delivered",
  "description": "Paket diterima",
  "location": "Banda Aceh",
  "tracked_at": "2026-10-08 14:00:00"
}
```

Behavior:

- Insert `SouvenirShippingTracking`
- Kalau status = `delivered` → `SouvenirOrder::markAsCompleted()`
- Kalau status = `shipped` / `in_transit` + order status = `processing` → update ke `shipped`

## 12. Order Lifecycle

### 12.1 Full Flow

```text
1. BROWSE
   GET /public/souvenir/products
   GET /public/souvenir/products/{slug}

2. CREATE ORDER (auto payment trigger)
   POST /customer/orders
   → SouvenirOrder (pending, unpaid)
   → Reserve stock
   → Auto trigger PaymentService → payment_url
   → Notif: email + WA "Pesanan Diterima + tombol Bayar"

3. PAYMENT (customer klik tombol dari email)
   → Redirect ke Flip → bayar
   → Webhook Flip: POST /webhook/flip
   → FlipTransaction.markAsPaid()
   → SouvenirOrder.markAsPaid()
   → Notif: email + WA "Pembayaran Berhasil"

4. MERCHANT PROCESSING
   PUT /merchant/souvenir/orders/{uuid}/status
   Body: { status: "processing" }

5. SHIPPING
   POST /merchant/souvenir/orders/{uuid}/ship
   → SouvenirOrder::ship()
   → Insert SouvenirShippingTracking
   → Notif: email + WA "Pesanan Dikirim"

6. WEBHOOK SHIPPING
   POST /webhook/shipping
   → Kalau delivered: markAsCompleted()

7. COMPLETED
   status=completed, completed_at=now()
   → Notif: email + WA "Pesanan Selesai"
```

### 12.2 Status Flow

| Status | Deskripsi | Transisi Boleh |
|---|---|---|
| pending | Menunggu pembayaran | paid, cancelled |
| paid | Sudah dibayar | processing, cancelled |
| processing | Sedang diproses merchant | shipped, cancelled |
| shipped | Sudah dikirim | completed |
| completed | Selesai | — |
| cancelled | Dibatalkan | — |

> ⚠️ **v2.6:** Transisi `processing → shipped` hanya boleh lewat endpoint `/ship` atau `/ship-kiriminaja`. Bukan lewat `PUT /orders/{uuid}/status`.

### 12.3 Payment Status

| Status | Deskripsi |
|---|---|
| unpaid | Belum dibayar |
| paid | Sudah dibayar |
| failed | Gagal |
| refunded | Dikembalikan |

## 13. Notification

### 13.1 Status

| Event | Email Customer | Email Merchant | WA Customer | WA Merchant |
|---|---|---|---|---|
| Order created | ✅ + tombol bayar | ✅ | ✅ + link bayar | ✅ (skip invalid) |
| Order paid | ✅ | ✅ | ✅ | ✅ (skip invalid) |
| Order shipped | ✅ | — | ✅ | — |
| Order completed | ✅ | — | ✅ | — |
| Order cancelled | ✅ | ✅ | ✅ | — |

### 13.2 Service

| Service | Fungsi |
|---|---|
| MarketplaceNotificationService | Dispatcher terpusat |
| MarketplaceOrderMail | Mailable class (terima paymentUrl) |
| MerchantResetPasswordMail | Mailable reset password merchant |
| SouvenirOrderObserver | Auto-trigger dari event model |
| WhatsAppService | WA gateway multi-provider |

### 13.3 Flow

```text
SouvenirOrder::create()
    ↓
Observer::created() → SKIP notif (tunggu payment_url)
    ↓
Auto PaymentService::processPayment()
    ↓
Set flip_bill_id → Observer::updated() detect
    ↓
MarketplaceNotificationService::orderCreated($order, $paymentUrl)
    ↓
├─ Mail::queue() → MarketplaceOrderMail → SMTP
└─ WhatsAppService::send() → Fonnte/Wablas/Kirimwa
    ↓
Status PAID (via webhook) → Observer::updated() detect
    ↓
MarketplaceNotificationService::orderPaid()
    ↓
📧 + 📱 Notif "Pembayaran Berhasil"
```

### 13.4 Config Email

```env
MAIL_MAILER=smtp
MAIL_HOST=live.smtp.mailtrap.io
MAIL_PORT=587
MAIL_USERNAME=api
MAIL_PASSWORD=<mailtrap_password>
MAIL_FROM_ADDRESS=hello@ovisito.com
MAIL_FROM_NAME="OvisitO - See More, Smile More"
```

> ⚠️ Typo `ovisto.com` (tanpa i) ditolak Mailtrap dengan error `550 Sending from domain ovisto.com is not allowed`.

### 13.5 Config WhatsApp

```env
WA_PROVIDER=fonnte
WA_API_KEY=<token_fonnte>
WA_API_URL=https://api.fonnte.com/send
WA_SENDER=6281234567890
WA_ENABLED=true
```

### 13.6 Setup Fonnte

1. Daftar di https://fonnte.com
2. Device → Add Device → scan QR pakai WA nomor sekunder
3. Copy token dari dashboard
4. Top-up Rp 25.000 (paket Lite) → watermark hilang + kuota 1.000 pesan/bulan
5. Set `.env` + hapus `bootstrap/cache/config.php`

#### ⚠️ Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Nomor WA banned (Fonnte = unofficial) | Pakai nomor sekunder khusus bisnis |
| Deteksi bot di volume tinggi | Pemanasan nomor 7-14 hari |
| Kirim massal terdeteksi spam | Set delay di Fonnte (default 5 detik) |
| Konten promosi memicu report | Notif transaksional, bukan promosi |
| Nomor baru kirim banyak | Batasi 50-100 pesan/hari awal |
| Device disconnected | Cek dashboard (harus 🟢 Online) |

Volume besar (> 500/hari): pertimbangkan WhatsApp Business API resmi (Twilio / Wati / Qontak) — tidak bisa banned, biaya lebih tinggi.

### 13.7 Templates

| Template | Path |
|---|---|
| Blade order marketplace | resources/views/emails/marketplace/order.blade.php |
| Blade reset password merchant | resources/views/emails/merchant/reset-password.blade.php |
| Mailable order | app/Mail/MarketplaceOrderMail.php |
| Mailable reset password | app/Mail/MerchantResetPasswordMail.php |

### 13.8 Queue

```text
Dev:  QUEUE_CONNECTION=sync
Prod: QUEUE_CONNECTION=database + php artisan queue:work --tries=3
```

## 14. Models Reference

### 14.1 Class List

| Model | Table | PK | Route Key | Connection |
|---|---|---|---|---|
| SouvenirProduct | souvenir_products | UUID | slug | souvenir_sql |
| SouvenirCategory | souvenir_categories | UUID | slug | souvenir_sql |
| SouvenirStore | souvenir_stores | UUID | slug | souvenir_sql |
| SouvenirStoreCategory | souvenir_store_categories | UUID | id | souvenir_sql |
| SouvenirOrder | souvenir_orders | UUID | id | souvenir_sql |
| SouvenirOrderItem | souvenir_order_items | UUID | id | souvenir_sql |
| SouvenirReview | souvenir_reviews | UUID | id | souvenir_sql |
| SouvenirShippingMethod | souvenir_shipping_methods | UUID | id | souvenir_sql |
| SouvenirShippingTracking | souvenir_shipping_trackings | UUID | id | souvenir_sql |
| Merchant | merchants | bigint | uuid | user |
| MerchantWithdrawal | merchant_withdrawals | bigint | id | payment |

> ⚠️ `App\Models\Marketplace\Store` deprecated — pakai `SouvenirStore`. Akan dihapus di v2.7.

### 14.2 Key Relations

```php
// SouvenirProduct
$product->category          // belongsTo SouvenirCategory (category_id)
$product->store             // belongsTo SouvenirStore (store_id)
$product->merchant          // belongsTo Merchant (merchant_uuid) — cross-DB
$product->orderItems        // hasMany SouvenirOrderItem (product_uuid)
$product->reviews           // hasMany SouvenirReview (product_uuid)

// SouvenirCategory
$category->parent           // belongsTo SouvenirCategory (parent_id)
$category->children         // hasMany SouvenirCategory (parent_id)
$category->products         // hasMany SouvenirProduct (category_id)
$category->getDescendantIds()  // BFS, unlimited level

// SouvenirStore
$store->merchant            // belongsTo Merchant (merchant_uuid) — cross-DB
$store->products            // hasMany SouvenirProduct (store_id)
$store->categories          // belongsToMany SouvenirCategory via souvenir_store_categories
$store->storeCategories     // hasMany SouvenirStoreCategory

// SouvenirOrder
$order->user                // belongsTo User (user_uuid) — cross-DB
$order->merchant            // belongsTo Merchant (merchant_uuid) — cross-DB
$order->items               // hasMany SouvenirOrderItem (order_uuid)
$order->shippingTrackings   // hasMany SouvenirShippingTracking (order_uuid)
$order->flipTransactions    // (stub) → FlipTransaction via bill_id

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

### 14.3 Business Methods — SouvenirOrder

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
                                // ⚠️ Guard: skip kalau sudah cancelled
$order->markAsProcessing()      // → processing
                                // ⚠️ Guard: skip kalau cancelled/completed
$order->ship($courier, $tracking, $note, $shippingOrderId)
                                // → shipped + insert tracking log
$order->markAsShipped($courier, $tracking, $note)
                                // ⭐ v2.6: shipped TANPA insert tracking
                                // Untuk admin & webhook shipping
$order->markAsCompleted()       // → completed
                                // ⚠️ Guard: skip kalau cancelled
$order->cancel($reason, $safe = false)
                                // → cancelled, restore stock
                                // $safe = true → pakai cancelSafely()
$order->cancelSafely($reason)   // → cancelled dengan row-lock
                                // Khusus merchant (cegah double-cancel)
```

### 14.4 Accessors & Appends

```php
// SouvenirOrder
$order->formatted_total         // "Rp 135.000"
$order->formatted_shipping_cost // "Rp 15.000"
$order->grand_total             // (float) total_amount
$order->status_label            // "Menunggu Pembayaran", "Dibayar", dll
$order->status_badge_class      // "bg-yellow-100 text-yellow-800", dll
$order->payment_status_label    // "Menunggu Pembayaran", "Dibayar", dll
$order->payment_method_label    // ⭐ v2.6: "QRIS", "Transfer Bank", dll

// SouvenirProduct
$product->final_price           // ⭐ v2.6: auto-append ke JSON
                                // discount_price jika < price, else price

// SouvenirOrderItem
$item->formatted_price          // "Rp 50.000"
$item->formatted_subtotal       // "Rp 100.000"

// SouvenirStore
$store->category_ids            // array UUID (auto-append)
```

## 15. Constants Reference

### 15.1 SouvenirOrder

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

// Alias legacy
SouvenirOrder::PAYMENT_PENDING = 'unpaid'
```

### 15.2 CentralBooking

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

### 15.3 FlipTransaction

```php
FlipTransaction::STATUS_PENDING   = 'PENDING'
FlipTransaction::STATUS_PAID      = 'PAID'
FlipTransaction::STATUS_EXPIRED   = 'EXPIRED'
FlipTransaction::STATUS_FAILED    = 'FAILED'
FlipTransaction::STATUS_CANCELLED = 'CANCELLED'
```

## 16. Roadmap & Known Issues

### ✅ Selesai

#### v2.6 — Backend Audit & Fix

- ☑ Fix guard `$request->user('merchant')` → `$request->user()`
- ☑ Fix `markAsShipped()` undefined di merchant order controller
- ☑ Fix `formatted_status` → `status_label` di dashboard
- ☑ Fix `forgotPassword` — benar-benar kirim email reset
- ☑ Fix `changePassword` double hash (pakai `Hash::make` manual)
- ☑ Fix `resetPassword` — jangan double hash
- ☑ Fix slug generation race condition di StoreController
- ☑ Fix `orWhere` tanpa grouping di CategoryController
- ☑ Fix UNION lintas-DB di TransactionController
- ☑ Standardisasi response `status: true/false` (bukan `'success'/'error'`)
- ☑ Standardisasi pagination `data[]` + `meta{}`
- ☑ Tambah guard `isCancelled()` di `markAsPaid()` & `markAsCompleted()`
- ☑ Tambah `markAsShipped()` (admin & webhook)
- ☑ Tambah opsi `cancel($reason, $safe)` untuk row-lock
- ☑ Tambah accessor `payment_method_label`
- ☑ Tambah `final_price` ke appends SouvenirProduct
- ☑ Tambah helper `generateUniqueSlug()` dengan `withTrashed()`
- ☑ Tambah try/catch (Throwable) + `Log::error` di semua controller merchant
- ☑ Tambah `MerchantResetPasswordMail` + blade template
- ☑ SQL migration: cleanup slug kosong + unique constraint + index performa
- ☑ Deprecate `Store.php` (duplicate dari SouvenirStore)

#### v2.5 — Auto trigger + tombol bayar

- ☑ `CustomerOrderController::store()` auto-trigger payment
- ☑ `SouvenirOrderObserver` trigger notif saat `flip_bill_id` changed
- ☑ Email "Pesanan Diterima + 💳 Bayar Sekarang →"
- ☑ WA "Pesanan Diterima + Link Bayar"

#### v2.4 — WA Fonnte

- ☑ WhatsAppService integration
- ☑ Config `WA_ENABLED=true`
- ☑ Resolve customer phone dari `shipping_address`

#### v2.3 — Webhook Flip

- ☑ `FlipPaymentService::handleWebhookCallback()` support flat & nested
- ☑ `syncCentralBooking()` support relasi `user()`

### 🔴 Known Issues

#### Critical

- □ Frontend `ovisito.com/orders/{order_number}` belum ada → link "Lihat Pesanan" di email 404. **Fix cepat:** arahkan ke `/user/orders`. **Fix ideal:** buat halaman detail order di frontend.
- □ `FLIP_SKIP_SIGNATURE=true` masih aktif — wajib `false` untuk production
- □ Typo `ovisto.com` di `.env` / `config/mail.php` — fix ke `ovisito.com`
- □ Live mode Flip — masih proses verifikasi (sandbox aktif)

#### Backend

- □ Transport observer — nama model tidak konsisten
- □ Hotel observer — perlu test
- □ Queue async — ganti `QUEUE_CONNECTION=sync` → `database`
- □ Cleanup route debug — hapus `/debug-wa` + `/test-wa`
- □ `MerchantWithdrawal.merchant_id` isi UUID — sebaiknya rename jadi `merchant_uuid` (breaking)
- □ Method `uploadImages` & `deleteImage` di SouvenirProductController — route belum terdaftar
- □ Method `show`, `parents`, `children` di CategoryController — route belum terdaftar
- □ Hapus `Store.php` (deprecated) di v2.7
- □ Hapus `SouvenirStoreController.php` (dead code) di v2.7

#### Database

- □ Unique constraint `(merchant_uuid, is_default)` via generated column — sudah SQL migration
- □ Cek index performa setelah migration

#### Frontend Merchant TODO (merchant.ovisito.com)

- □ Halaman login + register
- □ Halaman dashboard (summary, chart, recent orders)
- □ Halaman produk (list, create, edit, upload image)
- □ Halaman order (list, detail, update status, ship)
- □ Halaman store (create, edit)
- □ Halaman transaksi & withdraw
- □ Halaman profil & change password
- □ Halaman support tickets

#### Frontend Customer TODO

- □ Halaman checkout — panggil `POST /customer/orders` → redirect ke `payment_url`
- □ Halaman callback — terima redirect dari Flip → polling status
- □ Halaman detail order — `/orders/{order_number}`
- □ Halaman my orders — list order dengan status badge
- □ Polling status — refresh tiap 30 detik

### 📊 Endpoint Verification

**Public Catalog:**

- ✅ GET /public/souvenir/products
- ✅ GET /public/souvenir/products/{slug}
- ✅ GET /public/souvenir/featured
- ✅ GET /public/souvenir/categories
- ✅ GET /public/souvenir/categories/{slug}
- ✅ GET /public/souvenir/stores
- ✅ GET /public/souvenir/stores/{slug}
- ✅ GET /public/souvenir/shipping-methods
- ⏸️ POST /public/souvenir/shipping-methods/calculate

**Customer:**

- ✅ POST /customer/orders
- ✅ GET /customer/orders
- ✅ GET /customer/orders/{order_number}
- ✅ POST /customer/orders/{order_number}/cancel
- ✅ GET /customer/orders/{order_number}/track
- ⏸️ POST /customer/payment/process

**Merchant** — verifikasi setelah fix v2.6:

- ⏳ POST /merchant/register
- ⏳ POST /merchant/login
- ⏳ GET /merchant/dashboard
- ⏳ GET/POST/PUT /merchant/store
- ⏳ GET/POST/PUT/DELETE /merchant/souvenir/products
- ⏳ GET/PUT /merchant/souvenir/orders
- ⏳ POST /merchant/souvenir/orders/{uuid}/ship
- ⏳ GET /merchant/transactions
- ⏳ POST /merchant/withdraw

**Webhook:**

- ✅ POST /webhook/flip
- ✅ POST /webhook/shipping

## 17. Changelog

### v2.6 — 2026-10-08

**Fokus:** Backend audit + fix bug kritis + standardisasi response merchant.

**Breaking Changes:**

- Response `status` field di SouvenirProductController sekarang boolean (`true`/`false`), bukan `'success'`/`'error'`
- Pagination format di semua merchant list endpoint: `data[]` + `meta{}`
- `PUT /merchant/souvenir/orders/{uuid}/status` — status `shipped` ditolak, harus lewat `/ship` atau `/ship-kiriminaja`
- SouvenirProduct sekarang append `final_price` di JSON (additive, tapi strict schema bisa break)
- Middleware docs: `auth:merchant` → `auth:merchant_api`

**Fixes:**

- MerchantAuthController: `forgotPassword` benar-benar kirim email; `changePassword` fix double hash
- MerchantProfileController: fix double hash di `changePassword`; handle upload file logo
- StoreController: fix slug race condition pakai `generateUniqueSlug()` + `lockForUpdate()`
- StoreController@update: field yang di-null-kan sekarang benar terupdate
- CategoryController@show: `orWhere` grouping fix
- TransactionController: fix UNION lintas-DB; format pagination
- SouvenirOrderController@updateStatus: hapus case `'shipped'` (method undefined)
- DashboardController: `formatted_status` → `status_label`
- `SouvenirOrder::markAsPaid()`: guard terhadap status cancelled
- `SouvenirOrder::markAsCompleted()`: guard terhadap status cancelled
- SouvenirProductController: konsisten `status: true/false`

**Additions:**

- `SouvenirOrder::markAsShipped()` — untuk admin & webhook shipping
- `SouvenirOrder::cancel($reason, $safe = false)` — opsi row-lock
- `SouvenirProduct::final_price` accessor + appends
- `SouvenirOrder::payment_method_label` accessor
- `SouvenirStore::generateUniqueSlug()` — helper
- `MerchantResetPasswordMail` + blade template
- Scopes: `paymentUnpaid`, `paymentFailed`, `paymentRefunded`
- SQL migration: cleanup slug + unique constraint + index

**Deprecated:**

- `App\Models\Marketplace\Store` — pakai `SouvenirStore`

### v2.5 — 2026-10-08

**Fokus:** Auto trigger payment + email/WA tombol bayar.

Additions:

- `SouvenirOrderObserver` trigger notif saat `flip_bill_id` changed
- Email "Pesanan Diterima" + tombol "💳 Bayar Sekarang →"
- WA "Pesanan Diterima" + link bayar
- Fallback notif tanpa `payment_url` kalau auto-payment gagal

Breaking Changes:

- `POST /customer/orders` auto-panggil Flip → response include `payment_url` + `flip_bill_id`

### v2.4 — 2026-10-08

**Fokus:** Aktivasi WA Fonnte.

- Fix: `resolveCustomerPhone()` — prioritas `shipping_address.phone` > `user.phone`
- Fix: skip WA kalau nomor < 10 digit
- Add: WA notif aktif via Fonnte
- Add: risiko & mitigasi WA gateway

### v2.3 — 2026-10-08

**Fokus:** Webhook Flip + integrasi WA dasar.

- Fix: `FlipPaymentService::handleWebhookCallback()` — support payload flat & nested
- Fix: `handleWebhook()` — method baru (wrapper)
- Fix: `syncCentralBooking()` — support relasi `user()`

### v2.2 — 2026-10-08

- Refactor multi-database
- Fix payment pipeline
- SouvenirOrder implements PayableBooking
- Multi-DB: marketplace → `souvenir_sql`

### v2.1 — 2026-10-07

- Dokumentasi awal marketplace API

## 18. Referensi

- Flip API Docs
- KiriminAja Docs
- RajaOngkir Docs
- Mailtrap
- Fonnte WA Gateway
- Laravel Sanctum
- Laravel Eloquent Relationships

---

*Maintained by: Backend Team Ovisito · Last updated: 2026-10-08 · Version: 2.6*

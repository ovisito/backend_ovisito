📄 Update Sections untuk marketplacev2.2.md
Berikut hanya bagian yang berubah dari v2.2 → v2.5. Anda tinggal replace/insert section yang sesuai di file existing.

🔄 SECTION YANG PERLU DIREPLACE/DIINSERT
A. Section Baru — Setelah §4 (Auth) — INSERT
Tambahkan section baru §4A — Database Connection (kalau belum ada):

markdown
## 4A. Database Connection

Modul marketplace menggunakan **3 koneksi database** terpisah:

| Connection | Database | Fungsi |
|---|---|---|
| `souvenir_sql` | `souvenir-313930ab07` | Produk, kategori, order, review |
| `payment` | Payment DB | Central booking, Flip transaction |
| `user` | User DB | User, Merchant, Admin, Client App |

**Semua model Marketplace pakai `souvenir_sql`:**

```php
class SouvenirOrder extends Model
{
    protected $connection = 'souvenir_sql';
    protected $table      = 'souvenir_orders';
    // ...
}
Relasi cross-database (mis. order → user) pakai Eloquent standar — Laravel otomatis handle:

php
public function user()
{
    return $this->belongsTo(User::class, 'user_uuid', 'uuid');
    //                                        ↑ cross-DB FK
}
Catatan penting: Jangan pakai ->on('connection') di query Eloquent. Gunakan $connection property di model — biar konsisten dan tidak bentrok.

text

---

### B. Section §5.1 — Update `GET /products` Response

Ganti response JSON dengan versi ini (tambah field baru):

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
      "category": { ... },
      "store": { ... },
      "merchant": { ... }
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 12,
    "total": 60
  }
}
Query Params final:

Param	Tipe	Default	Deskripsi
search	string	—	Cari nama & deskripsi (bukan q)
category	string	—	Slug atau UUID kategori (auto-include children)
merchant_uuid	uuid	—	Filter per merchant
featured	bool	false	Hanya produk unggulan
min_price / max_price	numeric	—	Range harga
in_stock	bool	false	Hanya ada stok
sort	enum	latest	latest / price_asc / price_desc / popular
per_page	int	12	Max 60
C. Section §6.1 — Update POST /orders
Ganti section ini dengan versi final:

markdown
### 6.1 Orders

#### `POST /orders`

**Request Body:**

```json
{
  "merchant_uuid": "uuid",
  "items": [{ "product_uuid": "uuid", "quantity": 2 }],
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
Business Rules:

Satu order = satu merchant

Stock di-decrement atomic (lockForUpdate)

Harga pakai final_price (discount jika ada)

Status awal: pending, payment: unpaid

Auto-generate order_number: SO-YYYYMMDD-XXXXXXXX

⭐ Auto-trigger PaymentService::processPayment() — customer langsung dapat payment_url tanpa panggilan terpisah

⚠️ Catatan shipping_address.phone:

WAJIB format 628xxx — dipakai sebagai target WA notif customer

Kalau 08xxx, service auto-normalize ke 628xxx

Response 201:

json
{
  "status": true,
  "message": "Pesanan berhasil dibuat. Silakan lanjut ke pembayaran.",
  "data": {
    "order": {
      "id": "uuid",
      "order_number": "SO-20261008-XXXXXXXX",
      "user_uuid": "uuid",
      "merchant_uuid": "uuid",
      "total_amount": "135000.00",
      "shipping_cost": "15000.00",
      "discount_total": "0.00",
      "status": "pending",
      "payment_status": "unpaid",
      "flip_bill_id": "362xxx",        ⭐ auto-isi
      "shipping_address": { ... },
      "items": [ ... ],
      "ordered_at": "2026-10-08T10:30:00.000000Z"
    },
    "payment": {
      "next_step": "POST /api/v2/customer/payment/process",
      "booking_type": "marketplace",
      "booking_id": "SO-20261008-XXXXXXXX",
      "payment_url": "https://flip.id/pwf-sandbox/..."   ⭐ auto-isi
    }
  }
}
Flow otomatis setelah create order:

text
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
Fallback: Kalau auto-payment gagal (Flip error), order tetap dibuat + notif tetap dikirim tanpa payment_url.

text

---

### D. Section §9.5 — Update Payment Flow (Fase 6)

Ganti flow diagram di §9.5:

```markdown
### 9.5 Payment Flow (Fase 6 — Auto Trigger)

**Entry Point Utama:** `POST /customer/orders` (bukan lagi manual ke `/payment/process`)
Customer checkout → POST /customer/orders
├─ Buat SouvenirOrder (pending, unpaid)
├─ Reserve stock (atomic decrement)
├─ AUTO trigger PaymentService::processPayment():
│ ├─ syncCentralBooking() (dengan user_id)
│ ├─ FlipPaymentService::createBillFromPayable()
│ │ └─ HTTP POST ke Flip → bill_id + payment_url
│ ├─ Set flip_bill_id di SouvenirOrder
│ └─ Update CentralBooking via flip_bill_id
├─ Observer::updated() trigger orderCreated(
o
r
d
e
r
,
order,paymentUrl)
│ ├─ 📧 Email + tombol Bayar
│ └─ 📱 WA + link bayar
└─ Response 201 dengan payment_url

Customer klik tombol dari email → bayar di Flip
↓

Webhook Flip: POST /api/webhook/flip
├─ validateSignature (HMAC SHA256)
├─ FlipTransaction.markAsPaid()
├─ SouvenirOrder.markAsPaid()
└─ MarketplaceNotificationService::orderPaid()
├─ 📧 Email "Pembayaran Berhasil"
└─ 📱 WA "Pembayaran Berhasil"

text

**Endpoint `POST /customer/payment/process` masih ada** — untuk retry / panggilan manual kalau auto-payment gagal.
E. Section §12 — Update Notification (Fase 6)
Ganti section §12 dengan versi ini:

markdown
## 12. Notification

### 12.1 Status

| Event | Email Customer | Email Merchant | WA Customer | WA Merchant |
|---|---|---|---|---|
| Order created | ✅ + tombol bayar | ✅ | ✅ + link bayar | ✅ (skip invalid) |
| Order paid | ✅ | ✅ | ✅ | ✅ (skip invalid) |
| Order shipped | ✅ | — | ✅ | — |
| Order completed | ✅ | — | ✅ | — |
| Order cancelled | ✅ | ✅ | ✅ | — |

### 12.2 Service

| Service | Fungsi |
|---|---|
| `MarketplaceNotificationService` | Dispatcher terpusat |
| `MarketplaceOrderMail` | Mailable class (terima `paymentUrl`) |
| `SouvenirOrderObserver` | Auto-trigger dari event model |
| `WhatsAppService` | WA gateway multi-provider |

### 12.3 Flow

**Fase 6 — Auto Trigger:**
SouvenirOrder::create()
↓
Observer::created() → SKIP notif (tunggu payment_url)
↓
Auto PaymentService::processPayment()
↓
Set flip_bill_id → Observer::updated() detect
↓
MarketplaceNotificationService::orderCreated(
o
r
d
e
r
,
order,paymentUrl)
↓
├─ Mail::queue() → MarketplaceOrderMail → SMTP
└─ WhatsAppService::send() → Fonnte/Wablas/Kirimwa
↓
Status PAID (via webhook) → Observer::updated() detect
↓
MarketplaceNotificationService::orderPaid()
↓
📧 + 📱 Notif "Pembayaran Berhasil"

text

### 12.4 Config Email

```env
MAIL_MAILER=smtp
MAIL_HOST=live.smtp.mailtrap.io
MAIL_PORT=587
MAIL_USERNAME=api
MAIL_PASSWORD=<mailtrap_password>
MAIL_FROM_ADDRESS=hello@ovisito.com       ← WAJIB 'ovisito.com' (dengan i)
MAIL_FROM_NAME="OvisitO - See More, Smile More"
⚠️ Typo ovisto.com (tanpa i) ditolak Mailtrap dengan error:

text
550 Sending from domain ovisto.com is not allowed
12.5 Config WhatsApp
env
WA_PROVIDER=fonnte
WA_API_KEY=<token_fonnte>
WA_API_URL=https://api.fonnte.com/send
WA_SENDER=6281234567890
WA_ENABLED=true
12.6 Setup Fonnte
Daftar di https://fonnte.com

Device → Add Device → scan QR pakai WA nomor sekunder (bukan nomor pribadi utama)

Copy token dari dashboard

Top-up Rp 25.000 (paket Lite) → watermark hilang + kuota 1.000 pesan/bulan

Set .env + hapus bootstrap/cache/config.php

⚠️ Risiko & Mitigasi:

Risiko	Mitigasi
Nomor WA banned (Fonnte = unofficial)	Pakai nomor sekunder khusus bisnis
Deteksi bot di volume tinggi	Pemanasan nomor 7-14 hari
Kirim massal terdeteksi spam	Set delay di Fonnte (default 5 detik)
Konten promosi memicu report	Notif transaksional, bukan promosi
Nomor baru kirim banyak	Batasi 50-100 pesan/hari awal
Device disconnected	Cek dashboard (harus 🟢 Online)
Volume besar (> 500/hari): pertimbangkan WhatsApp Business API resmi (Twilio / Wati / Qontak) — tidak bisa banned, biaya lebih tinggi.

12.7 Templates
Template	Path
Blade markdown	resources/views/emails/marketplace/order.blade.php
Mailable class	app/Mail/MarketplaceOrderMail.php
12.8 Queue
Dev: QUEUE_CONNECTION=sync
Prod: QUEUE_CONNECTION=database + php artisan queue:work --tries=3

text

---

### F. Section §15 — Update Roadmap

Ganti section §15:

```markdown
## 15. Roadmap & Known Issues

### ✅ Selesai

#### Fase 0A-0B — Model & Database
- [x] `SouvenirCategory::getDescendantIds()`, `getRouteKeyName('slug')`
- [x] `SouvenirStore::getRouteKeyName('slug')`
- [x] `SouvenirShippingMethod::scopeActive()`
- [x] `SouvenirProduct::orderItems()` FK fix
- [x] `SouvenirOrder` rewrite + `PayableBooking`
- [x] `SouvenirOrderItem` rewrite + hapus `SoftDeletes`
- [x] `CentralBooking::SERVICE_MARKETPLACE`
- [x] ALTER enum `central_bookings.service_type` += `marketplace`
- [x] ALTER enum `central_bookings.payment_status` += `cancelled`

#### Fase 1 — PayableBooking
- [x] `SouvenirOrder implements PayableBooking`
- [x] Method: `markAsPaid`, `markAsProcessing`, `ship`, `markAsCompleted`, `cancel`

#### Fase 2 — Payment & Webhook
- [x] `PaymentController::resolveBooking()` schema-aware
- [x] `ShippingWebhookController` fix `$order->id`
- [x] `FlipWebhookController` signature + `handleWebhook()`
- [x] `PaymentService` panggil `FlipPaymentService::createBillFromPayable()`
- [x] `config/services.php` → `skip_signature_validation`

#### Fase 3 — Endpoint
- [x] `ProductCatalogController` (products, categories, featured)
- [x] `ShippingMethodController`
- [x] `StoreController` (BARU)
- [x] `CustomerOrderController` (BARU)
- [x] `routes/api/shop.php`
- [x] Bootstrap `redirectGuestsTo` → 401 JSON

#### Fase 4 — Notifikasi Email
- [x] `MarketplaceNotificationService`
- [x] `SouvenirOrderObserver`
- [x] `MarketplaceOrderMail`
- [x] Blade `emails/marketplace/order.blade.php`
- [x] Fix folder `email` → `emails`
- [x] Email terkirim (verified)

#### Fase 5 — Payment Flip
- [x] `FlipPaymentService` restructure
- [x] `createBillFromPayable()` adapter
- [x] `handleWebhook()` + `handleWebhookCallback()` fix
- [x] `syncCentralBooking()` — support relasi `user()`
- [x] Payment URL + bill_id verified
- [x] Webhook E2E verified

#### Fase 5b — WhatsApp Notif
- [x] Integrasi `WhatsAppService` di `MarketplaceNotificationService`
- [x] Config `WA_ENABLED=true`
- [x] WA gateway via Fonnte (device aktif)
- [x] Resolve customer phone dari `shipping_address`
- [x] Skip merchant WA kalau nomor invalid
- [x] WA terkirim (verified)

#### Fase 6 — Auto Trigger + Tombol Bayar ⭐
- [x] `CustomerOrderController::store()` auto-trigger payment
- [x] `PaymentService` skip `sendBookingConfirmation` untuk marketplace
- [x] `SouvenirOrderObserver` trigger notif saat `flip_bill_id` changed
- [x] Email "Pesanan Diterima + 💳 Bayar Sekarang →"
- [x] WA "Pesanan Diterima + Link Bayar"
- [x] Tested E2E

### 🔴 Known Issues

#### Critical
- [ ] **Frontend `ovisito.com/orders/{order_number}` belum ada** → link "Lihat Pesanan" di email 404
  - **Fix cepat:** Arahkan ke halaman existing (`/user/orders`)
  - **Fix ideal:** Buat halaman detail order di frontend
- [ ] **`FLIP_SKIP_SIGNATURE=true`** masih aktif — wajib balik ke `false` untuk production
- [ ] **Typo `ovisto.com`** di `.env` / `config/mail.php` — fix ke `ovisito.com`

#### Backend
- [ ] **Live mode Flip** — masih proses verifikasi (sandbox aktif)
- [ ] **Transport observer** — nama model `App\Models\Transport\*` vs `App\Models\transport_aceh\*` tidak konsisten
- [ ] **Hotel observer** — sudah dibuat, perlu test
- [ ] **Queue async** — ganti `QUEUE_CONNECTION=sync` → `database`
- [ ] **Cleanup route debug** — hapus `/debug-wa` + `/test-wa`
- [ ] `SouvenirStore::is_default` — belum ada unique constraint
- [ ] Auto-set `is_default` toko pertama merchant

#### Frontend TODO
- [ ] Halaman **checkout** — panggil `POST /customer/orders` → redirect ke `payment_url`
- [ ] Halaman **callback** — terima redirect dari Flip → polling status
- [ ] Halaman **detail order** — `/orders/{order_number}`
- [ ] Halaman **my orders** — list order dengan status badge
- [ ] **Polling status** — refresh tiap 30 detik
G. Section §16 — Update Changelog
Tambahkan 3 entri ini di paling atas changelog:

markdown
## 16. Changelog

### v2.5 — 2026-10-08

**Fokus:** Auto trigger payment + email/WA tombol bayar.

**Breaking Changes:**
- `POST /customer/orders` auto-panggil Flip → response include `payment_url` + `flip_bill_id`
- `MarketplaceNotificationService::orderCreated($order, ?string $paymentUrl = null)`
- `MarketplaceOrderMail::__construct($order, $event, $recipient, ?string $paymentUrl = null)`

**Additions:**
- `SouvenirOrderObserver` trigger notif saat `flip_bill_id` changed
- Email "Pesanan Diterima" + tombol "💳 Bayar Sekarang →"
- WA "Pesanan Diterima" + link bayar
- Fallback notif tanpa payment_url kalau auto-payment gagal

**Verified E2E:**
- Customer order → email + WA tombol bayar ✅
- Webhook → order paid ✅

### v2.4 — 2026-10-08

**Fokus:** Aktivasi WA Fonnte + fix customer phone resolution.

**Fixes:**
- `MarketplaceNotificationService::sendWa()` — tambah log + validasi nomor
- `resolveCustomerPhone()` — prioritas `shipping_address.phone` > `user.phone`
- Skip WA kalau nomor < 10 digit

**Additions:**
- WA notif aktif via Fonnte
- Risiko & mitigasi WA gateway (section §12.6)

### v2.3 — 2026-10-08

**Fokus:** Perbaikan webhook Flip + integrasi WA dasar.

**Fixes:**
- `FlipPaymentService::handleWebhookCallback()` — support payload flat & nested
- `handleWebhook()` — method baru (wrapper)
- `syncCentralBooking()` — support relasi `user()`

### v2.2 — [existing date]
- (biarkan apa adanya)
📋 Cara Apply Update ke marketplacev2.2.md
Buka file marketplacev2.2.md di GitHub / editor.

Step 1 — Insert Section Baru
Insert §4A — Database Connection setelah section §4 (Auth)

Step 2 — Replace Section yang Ada
Replace §5.1 response block → dengan section B di atas

Replace §6.1 seluruh POST /orders → dengan section C

Replace §9.5 flow diagram → dengan section D

Replace §12 seluruh Notification section → dengan section E

Replace §15 seluruh Roadmap → dengan section F

Replace §16 Changelog → tambahkan 3 entri (section G)

Step 3 — Rename File
Rename marketplacev2.2.md → marketplacev2.5.md (opsional)

Atau update version header di dalam file: **Versi:** 2.5

🚦 Kirim Hasil
Setelah update, jawab 2 hal:

Section mana yang berhasil di-replace? (semua / sebagian)

Ada section yang bingung cara merge-nya? (sebutkan, saya pandu)

Kalau perlu, saya bisa kirim file utuh v2.5 final (17 section lengkap) — tinggal paste di GitHub sebagai file baru.

Mau saya kirim full file v2.5? Jawab ya / tidak. 🚀

ya
📄 marketplacev2.5.md — File Utuh Final
markdown
# Marketplace API — Ovisito

> Dokumentasi endpoint marketplace souvenir (multi-database) untuk platform Ovisito.
>
> **Versi:** 2.5
> **Terakhir diupdate:** 2026-10-08
> **Base URL API:** `https://api.ovisito.com`
> **Base URL Frontend:** `https://ovisito.com` / `https://shop.ovisito.com`

---

## Daftar Isi

1. [Overview](#1-overview)
2. [Arsitektur Multi-Service](#2-arsitektur-multi-service)
3. [Database Connection](#3-database-connection)
4. [Response Format](#4-response-format)
5. [Authentication & Middleware](#5-authentication--middleware)
6. [Public Endpoints](#6-public-endpoints)
7. [Customer Endpoints](#7-customer-endpoints)
8. [Merchant Endpoints](#8-merchant-endpoints)
9. [Admin Endpoints](#9-admin-endpoints)
10. [Payment Integration (Flip)](#10-payment-integration-flip)
11. [Shipping Integration](#11-shipping-integration)
12. [Order Lifecycle](#12-order-lifecycle)
13. [Notification](#13-notification)
14. [Models Reference](#14-models-reference)
15. [Constants Reference](#15-constants-reference)
16. [Roadmap & Known Issues](#16-roadmap--known-issues)
17. [Changelog](#17-changelog)

---

## 1. Overview

Modul marketplace menangani produk souvenir, toko, kategori, order, pembayaran (Flip), shipping, dan review.

### Akses & Role

| Role | Auth | Endpoint Prefix |
|---|---|---|
| **Public** | `client.auth` | `/api/v2/public/souvenir/*` |
| **Customer** | `client.auth` + Sanctum user | `/api/v2/customer/*` |
| **Merchant** | `client.auth` + Sanctum merchant | `/api/v2/merchant/souvenir/*` |
| **Admin** | Sanctum admin (`auth:admin_api`) | `/api/v2/admin/marketplace/*` |
| **Webhook** | Signature verification | `/api/webhook/*` |

---

## 2. Arsitektur Multi-Service

Platform Ovisito terdiri dari **9 layanan** dengan **database terpisah**, disatukan oleh **CentralBooking aggregator**.
Modul (DB terpisah) → CentralBooking (payment DB)
├── hotel (wisata_aceh) → central_bookings
├── destinasi (wisata_aceh) → central_bookings
├── tour (wisata_aceh) → central_bookings
├── kuliner (kuliner_aceh) → central_bookings
├── rental (aceh_sewa) → central_bookings
├── event (events) → central_bookings
├── mice (mice) → central_bookings
├── transport (aceh_transport) → central_bookings
└── marketplace (souvenir_sql) → central_bookings

text

**Satu payment gateway (Flip) untuk semua layanan.** Setiap booking (dari layanan manapun) tercatat di `central_bookings` sebagai aggregator.

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
3. Database Connection
Modul marketplace menggunakan 3 koneksi database terpisah:

Connection	Fungsi	Model
souvenir_sql	Produk, kategori, order, review	Semua model App\Models\Marketplace\*
payment	Central booking, Flip transaction	CentralBooking, FlipTransaction, PaymentTransaction
user	User, Merchant, Admin	User, Merchant, ClientApp
Cara deklarasi:

php
class SouvenirOrder extends Model
{
    protected $connection = 'souvenir_sql';
    protected $table      = 'souvenir_orders';
}
Relasi cross-database — Laravel handle otomatis:

php
// SouvenirOrder → User (cross-DB)
public function user()
{
    return $this->belongsTo(User::class, 'user_uuid', 'uuid');
}
Catatan: Jangan pakai ->on('connection') untuk query Eloquent. Gunakan $connection property di model.

Tabel Marketplace
Tabel	PK	Route Key
souvenir_products	UUID	slug
souvenir_categories	UUID	slug
souvenir_stores	UUID	slug
souvenir_store_categories	UUID	id
souvenir_orders	UUID	id
souvenir_order_items	UUID	id
souvenir_reviews	UUID	id
souvenir_shipping_methods	UUID	id
souvenir_shipping_trackings	UUID	id
Cross-Service FK
Dari	Ke	Tipe
souvenir_orders.user_uuid	users.uuid	char(36)
souvenir_orders.merchant_uuid	merchants.uuid	char(36)
souvenir_orders.id	souvenir_order_items.order_uuid	char(36)
souvenir_order_items.product_uuid	souvenir_products.id	char(36)
souvenir_shipping_trackings.order_uuid	souvenir_orders.id	char(36)
souvenir_reviews.product_uuid	souvenir_products.id	char(36)
central_bookings.user_id	users.id	int unsigned
4. Response Format
Sukses
json
{
  "status": true,
  "message": "Optional message",
  "data": { ... } | [ ... ] | null
}
Error
json
{
  "status": false,
  "message": "Pesan error",
  "errors": { "field": ["..."] }
}
HTTP Status
200, 201, 400, 401, 403, 404, 422, 500.

Pagination Meta
json
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
5. Authentication & Middleware
Middleware	Header	Fungsi
client.auth	X-Client-ID, X-Client-Secret	Identifikasi platform
auth:sanctum	Authorization: Bearer <token>	Authenticated customer
auth:merchant	Bearer token	Authenticated merchant
auth:admin_api	Bearer token	Authenticated admin
throttle:120,1	—	Rate limit 120 req/menit
Client Auth
http
X-Client-ID: client_web
X-Client-Secret: <secret>
6. Public Endpoints
Base: /api/v2/public/souvenir
Auth: client.auth, throttle:120,1

6.1 Products
GET /products
Param	Tipe	Default	Deskripsi
search	string	—	Cari nama & deskripsi
category	string	—	Slug atau UUID (auto-include children)
merchant_uuid	uuid	—	Filter per merchant
featured	bool	false	Hanya produk unggulan
min_price / max_price	numeric	—	Range harga
in_stock	bool	false	Hanya ada stok
sort	enum	latest	latest / price_asc / price_desc / popular
per_page	int	12	Max 60
Response: array produk + pagination meta.

GET /products/{slug}
Detail produk + reviews (10) + related (8).

GET /featured
limit default 8, max 24.

6.2 Categories
GET /categories
Param	Default	Deskripsi
with_children	true	Include sub-kategori (2 level)
only_parents	true	Hanya root
GET /categories/{slug}
Auto-include children & grandchildren via getDescendantIds().

6.3 Stores
Method	Endpoint
GET	/stores
GET	/stores/{slug}
Query: search, merchant_uuid, kabupaten_id, is_physical, per_page.

6.4 Shipping Methods
Method	Endpoint
GET	/shipping-methods
POST	/shipping-methods/calculate
Body: { weight, method_id }.

7. Customer Endpoints
Base: /api/v2/customer
Auth: client.auth, auth:sanctum

7.1 Orders
POST /orders
Request Body:

json
{
  "merchant_uuid": "uuid",
  "items": [{ "product_uuid": "uuid", "quantity": 2 }],
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
Business Rules:

Satu order = satu merchant

Stock di-decrement atomic (lockForUpdate)

Harga pakai final_price (discount jika ada)

Status awal: pending, payment: unpaid

Auto-generate order_number: SO-YYYYMMDD-XXXXXXXX

⭐ Auto-trigger PaymentService::processPayment() — customer langsung dapat payment_url

⚠️ Catatan shipping_address.phone:

WAJIB format 628xxx — dipakai sebagai target WA notif customer

Kalau 08xxx, service auto-normalize ke 628xxx

Response 201:

json
{
  "status": true,
  "message": "Pesanan berhasil dibuat. Silakan lanjut ke pembayaran.",
  "data": {
    "order": {
      "id": "uuid",
      "order_number": "SO-20261008-XXXXXXXX",
      "user_uuid": "uuid",
      "merchant_uuid": "uuid",
      "total_amount": "135000.00",
      "shipping_cost": "15000.00",
      "discount_total": "0.00",
      "status": "pending",
      "payment_status": "unpaid",
      "flip_bill_id": "362xxx",
      "shipping_address": { ... },
      "items": [ ... ],
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
Flow otomatis setelah create order:

text
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
Fallback: Kalau auto-payment gagal, order tetap dibuat + notif tetap dikirim tanpa payment_url.

GET /orders
List order user. Filter status, per_page (max 50).

GET /orders/{order_number}
Detail order + items.product + merchant + shippingTrackings.

POST /orders/{order_number}/cancel
Hanya status = pending. Stock otomatis dikembalikan.

GET /orders/{order_number}/track
Response: order_number, status, status_label, courier, tracking_number, history.

7.2 Payment
POST /payment/process
Request Body:

json
{
  "booking_type": "marketplace",
  "booking_id": "SO-20261008-HYNTEBQ5",
  "payment_method": "qris",
  "payment_channel": null
}
Response:

json
{
  "status": true,
  "message": "Pembayaran berhasil diproses. Silakan selesaikan pembayaran.",
  "data": {
    "booking_code": "SO-20261008-HYNTEBQ5",
    "booking_type": "marketplace",
    "amount": "135000.00",
    "status": "pending",
    "payment_url": "https://flip.id/pwf-sandbox/...",
    "qr_code": "data:image/png;base64,...",
    "flip_bill_id": "362438"
  }
}
Catatan:

payment_url → link Flip untuk redirect user

qr_code → QR lokal (bukan QRIS Flip)

flip_bill_id → ID bill di sistem Flip

Idempotent — kalau ada bill aktif belum expired, reuse bill lama

GET /payment/status/{bookingCode}
Cek status pembayaran.

GET /payment/qr/{bookingCode}
Generate QR code untuk booking.

8. Merchant Endpoints
Base: /api/v2/merchant

Store Management
Method	Endpoint
GET	/store
POST	/store
PUT	/store
GET	/store/{uuid}
Souvenir Products
Method	Endpoint
GET	/souvenir/products
POST	/souvenir/products
PUT	/souvenir/products/{product}
DELETE	/souvenir/products/{product}
PUT	/souvenir/products/{id}/stock
PUT	/souvenir/products/{id}/toggle-active
Souvenir Orders
Method	Endpoint
GET	/souvenir/orders
GET	/souvenir/orders/{uuid}
PUT	/souvenir/orders/{uuid}/status
POST	/souvenir/orders/{uuid}/ship
POST	/souvenir/orders/{uuid}/ship-kiriminaja
GET	/souvenir/orders/{uuid}/track
Transisi status valid:

Dari	Ke
paid	processing, cancelled
processing	shipped, cancelled
shipped	completed
Transactions
Method	Endpoint
GET	/transactions
POST	/withdraw
GET	/withdrawals
9. Admin Endpoints
Base: /api/v2/admin/marketplace

Resource	CRUD	Extra
Products	✅	stats, images, toggle-active, toggle-featured
Categories	✅	tree, toggle-active, stats
Orders	✅	mark-paid, mark-completed, ship, update-status, stats, trends
Reviews	✅	stats
Shipping Methods	✅	active/list, toggle-active
Stores	✅	set-default, toggle-active, stats
Merchants	R/U	verify, products, orders
10. Payment Integration (Flip)
10.1 Konfigurasi
File config/services.php:

php
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
File config/flip.php:

php
'pwf_api_version' => env('FLIP_PWF_API_VERSION', 'v2'),
10.2 Environment
Mode	Base URL	API Version
Sandbox	https://bigflip.id/big_sandbox_api	v2
Production	https://bigflip.id/api	v3
Saat ini sandbox — live masih proses verifikasi.

Setelah live aktif:

Update .env: FLIP_BASE_URL, FLIP_API_KEY, FLIP_WEBHOOK_TOKEN, FLIP_VALIDATION_TOKEN

Update callback URL di dashboard Flip → https://api.ovisito.com/api/webhook/flip

Hapus bootstrap/cache/config.php

10.3 Central Booking
Enum service_type:

text
hotel | kuliner | rental | destinasi | tour | event | mice | transport | marketplace
Enum payment_status:

text
unpaid | pending | paid | refunded | expired | cancelled
10.4 Payment Flow (Fase 6)
Entry Point Utama: POST /customer/orders (auto-trigger payment)

text
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
Endpoint POST /customer/payment/process tetap ada — untuk retry / panggilan manual kalau auto-payment gagal.

10.5 Webhook Flip
Endpoint: POST /api/webhook/flip

Header: X-Callback-Signature: HMAC-SHA256(raw_body, validation_token)

Payload (flat):

json
{
  "id": 362438,
  "bill_id": 362438,
  "status": "SUCCESSFUL",
  "amount": 135000,
  "reference_id": "SO-20261008-HYNTEBQ5",
  "sender_bank": "bca",
  "sender_name": "Budi",
  "payment_method": "bank_transfer",
  "paid_at": "2026-10-08 10:30:00"
}
Status didukung:

SUCCESSFUL / PAID → handlePaid() → markAsPaid + notif

FAILED / CANCELLED → handleFailed()

EXPIRED → handleExpired()

PENDING → ignored

Idempotency: Kalau sudah paid, skip processing.

Dev mode: Set FLIP_SKIP_SIGNATURE=true di .env untuk skip verifikasi (⚠️ JANGAN di production).

11. Shipping Integration
Shipping Methods
Tabel souvenir_shipping_methods — metode manual yang di-set admin.

Fields: name, courier_code, base_cost, description, is_active.

Shipping Tracking
Tabel souvenir_shipping_trackings — history tracking.

Fields: order_uuid, status, description, location, tracked_at.

Webhook Shipping
Endpoint: POST /api/webhook/shipping

Payload flexible: awb, status, description, location, tracked_at.

Behavior:

Insert SouvenirShippingTracking

Kalau status = delivered → SouvenirOrder::markAsCompleted()

Kalau status = shipped + order processing → update ke shipped

12. Order Lifecycle
text
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
Status Flow
Status	Transisi
pending	paid, cancelled
paid	processing, cancelled
processing	shipped, cancelled
shipped	completed
completed	—
cancelled	—
Payment Status
Status	Deskripsi
unpaid	Belum dibayar
paid	Sudah dibayar
failed	Gagal
refunded	Dikembalikan
13. Notification
13.1 Status
Event	Email Customer	Email Merchant	WA Customer	WA Merchant
Order created	✅ + tombol bayar	✅	✅ + link bayar	✅ (skip invalid)
Order paid	✅	✅	✅	✅ (skip invalid)
Order shipped	✅	—	✅	—
Order completed	✅	—	✅	—
Order cancelled	✅	✅	✅	—
13.2 Service
Service	Fungsi
MarketplaceNotificationService	Dispatcher terpusat
MarketplaceOrderMail	Mailable class (terima paymentUrl)
SouvenirOrderObserver	Auto-trigger dari event model
WhatsAppService	WA gateway multi-provider
13.3 Flow
text
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
13.4 Config Email
env
MAIL_MAILER=smtp
MAIL_HOST=live.smtp.mailtrap.io
MAIL_PORT=587
MAIL_USERNAME=api
MAIL_PASSWORD=<mailtrap_password>
MAIL_FROM_ADDRESS=hello@ovisito.com
MAIL_FROM_NAME="OvisitO - See More, Smile More"
⚠️ Typo ovisto.com (tanpa i) ditolak Mailtrap dengan error 550 Sending from domain ovisto.com is not allowed.

13.5 Config WhatsApp
env
WA_PROVIDER=fonnte
WA_API_KEY=<token_fonnte>
WA_API_URL=https://api.fonnte.com/send
WA_SENDER=6281234567890
WA_ENABLED=true
13.6 Setup Fonnte
Daftar di https://fonnte.com

Device → Add Device → scan QR pakai WA nomor sekunder (bukan nomor pribadi utama)

Copy token dari dashboard

Top-up Rp 25.000 (paket Lite) → watermark hilang + kuota 1.000 pesan/bulan

Set .env + hapus bootstrap/cache/config.php

⚠️ Risiko & Mitigasi:

Risiko	Mitigasi
Nomor WA banned (Fonnte = unofficial)	Pakai nomor sekunder khusus bisnis
Deteksi bot di volume tinggi	Pemanasan nomor 7-14 hari
Kirim massal terdeteksi spam	Set delay di Fonnte (default 5 detik)
Konten promosi memicu report	Notif transaksional, bukan promosi
Nomor baru kirim banyak	Batasi 50-100 pesan/hari awal
Device disconnected	Cek dashboard (harus 🟢 Online)
Volume besar (> 500/hari): pertimbangkan WhatsApp Business API resmi (Twilio / Wati / Qontak) — tidak bisa banned, biaya lebih tinggi.

13.7 Templates
Template	Path
Blade markdown	resources/views/emails/marketplace/order.blade.php
Mailable class	app/Mail/MarketplaceOrderMail.php
13.8 Queue
Dev: QUEUE_CONNECTION=sync
Prod: QUEUE_CONNECTION=database + php artisan queue:work --tries=3

14. Models Reference
Class List
Model	Table	PK	Route Key	Trait
SouvenirProduct	souvenir_products	UUID	slug	HasFactory, SoftDeletes
SouvenirCategory	souvenir_categories	UUID	slug	HasUuids
SouvenirStore	souvenir_stores	UUID	slug	HasUuids, SoftDeletes
SouvenirStoreCategory	souvenir_store_categories	UUID	id	HasUuids
SouvenirOrder	souvenir_orders	UUID	id	HasUuids, SoftDeletes + PayableBooking
SouvenirOrderItem	souvenir_order_items	UUID	id	HasUuids
SouvenirReview	souvenir_reviews	UUID	id	HasUuids
SouvenirShippingMethod	souvenir_shipping_methods	UUID	id	HasUuids
SouvenirShippingTracking	souvenir_shipping_trackings	UUID	id	HasUuids
Business Methods — SouvenirOrder
php
$order->markAsPaid($amount)     // idempotent
$order->markAsProcessing()
$order->ship($courier, $tracking, $note, $shippingOrderId)
$order->markAsCompleted()
$order->cancel($reason)         // restore stock
Accessors
php
$order->formatted_total         // "Rp 135.000"
$order->status_label            // "Menunggu Pembayaran"
$order->status_badge_class      // "bg-yellow-100 text-yellow-800"
$order->payment_status_label    // "Menunggu Pembayaran"
15. Constants Reference
SouvenirOrder
php
STATUS_PENDING    = 'pending'
STATUS_PAID       = 'paid'
STATUS_PROCESSING = 'processing'
STATUS_SHIPPED    = 'shipped'
STATUS_COMPLETED  = 'completed'
STATUS_CANCELLED  = 'cancelled'

PAYMENT_UNPAID   = 'unpaid'
PAYMENT_PAID     = 'paid'
PAYMENT_FAILED   = 'failed'
PAYMENT_REFUNDED = 'refunded'
CentralBooking
php
SERVICE_HOTEL       = 'hotel'
SERVICE_DESTINASI   = 'destinasi'
SERVICE_TOUR        = 'tour'
SERVICE_KULINER     = 'kuliner'
SERVICE_RENTAL      = 'rental'
SERVICE_EVENT       = 'event'
SERVICE_MICE        = 'mice'
SERVICE_TRANSPORT   = 'transport'
SERVICE_MARKETPLACE = 'marketplace'

PAYMENT_UNPAID    = 'unpaid'
PAYMENT_PENDING   = 'pending'
PAYMENT_PAID      = 'paid'
PAYMENT_REFUNDED  = 'refunded'
PAYMENT_EXPIRED   = 'expired'
PAYMENT_CANCELLED = 'cancelled'
16. Roadmap & Known Issues
✅ Selesai
Fase 0A-0B — Model & Database
☑ SouvenirCategory::getDescendantIds(), getRouteKeyName('slug')
☑ SouvenirStore::getRouteKeyName('slug')
☑ SouvenirShippingMethod::scopeActive()
☑ SouvenirProduct::orderItems() FK fix
☑ SouvenirOrder rewrite + PayableBooking
☑ SouvenirOrderItem rewrite + hapus SoftDeletes
☑ CentralBooking::SERVICE_MARKETPLACE
☑ ALTER enum central_bookings.service_type += marketplace
☑ ALTER enum central_bookings.payment_status += cancelled
Fase 1 — PayableBooking
☑ SouvenirOrder implements PayableBooking
☑ Method: markAsPaid, markAsProcessing, ship, markAsCompleted, cancel
Fase 2 — Payment & Webhook
☑ PaymentController::resolveBooking() schema-aware
☑ ShippingWebhookController fix $order->id
☑ FlipWebhookController signature + handleWebhook()
☑ PaymentService panggil FlipPaymentService::createBillFromPayable()
☑ config/services.php → skip_signature_validation
Fase 3 — Endpoint
☑ ProductCatalogController (products, categories, featured)
☑ ShippingMethodController
☑ StoreController
☑ CustomerOrderController
☑ routes/api/shop.php
☑ Bootstrap redirectGuestsTo → 401 JSON
Fase 4 — Notifikasi Email
☑ MarketplaceNotificationService
☑ SouvenirOrderObserver
☑ MarketplaceOrderMail
☑ Blade emails/marketplace/order.blade.php
☑ Fix folder email → emails
☑ Email terkirim (verified)
Fase 5 — Payment Flip
☑ FlipPaymentService restructure
☑ createBillFromPayable() adapter
☑ handleWebhook() + handleWebhookCallback() fix
☑ syncCentralBooking() — support relasi user()
☑ Payment URL + bill_id verified
☑ Webhook E2E verified
Fase 5b — WhatsApp Notif
☑ Integrasi WhatsAppService
☑ Config WA_ENABLED=true
☑ WA gateway via Fonnte (device aktif)
☑ Resolve customer phone dari shipping_address
☑ Skip merchant WA kalau nomor invalid
☑ WA terkirim (verified)
Fase 6 — Auto Trigger + Tombol Bayar
☑ CustomerOrderController::store() auto-trigger payment
☑ PaymentService skip sendBookingConfirmation untuk marketplace
☑ SouvenirOrderObserver trigger notif saat flip_bill_id changed
☑ Email "Pesanan Diterima + 💳 Bayar Sekarang →"
☑ WA "Pesanan Diterima + Link Bayar"
☑ Tested E2E
🔴 Known Issues
Critical
□ Frontend ovisito.com/orders/{order_number} belum ada → link "Lihat Pesanan" di email 404
Fix cepat: Arahkan ke halaman existing (/user/orders)

Fix ideal: Buat halaman detail order di frontend

□ FLIP_SKIP_SIGNATURE=true masih aktif — wajib balik ke false untuk production
□ Typo ovisto.com di .env / config/mail.php — fix ke ovisito.com
Backend
□ Live mode Flip — masih proses verifikasi (sandbox aktif)
□ Transport observer — nama model App\Models\Transport\* vs App\Models\transport_aceh\* tidak konsisten
□ Hotel observer — sudah dibuat, perlu test
□ Queue async — ganti QUEUE_CONNECTION=sync → database
□ Cleanup route debug — hapus /debug-wa + /test-wa
□ SouvenirStore::is_default — belum ada unique constraint
□ Auto-set is_default toko pertama merchant
Frontend TODO
□ Halaman checkout — panggil POST /customer/orders → redirect ke payment_url
□ Halaman callback — terima redirect dari Flip → polling status
□ Halaman detail order — /orders/{order_number}
□ Halaman my orders — list order dengan status badge
□ Polling status — refresh tiap 30 detik
17. Changelog
v2.5 — 2026-10-08
Fokus: Auto trigger payment + email/WA tombol bayar.

Breaking Changes:

POST /customer/orders auto-panggil Flip → response include payment_url + flip_bill_id

MarketplaceNotificationService::orderCreated($order, ?string $paymentUrl = null)

MarketplaceOrderMail::__construct($order, $event, $recipient, ?string $paymentUrl = null)

Additions:

SouvenirOrderObserver trigger notif saat flip_bill_id changed

Email "Pesanan Diterima" + tombol "💳 Bayar Sekarang →"

WA "Pesanan Diterima" + link bayar

Fallback notif tanpa payment_url kalau auto-payment gagal

Verified E2E:

Customer order → email + WA tombol bayar ✅

Webhook → order paid ✅

v2.4 — 2026-10-08
Fokus: Aktivasi WA Fonnte + fix customer phone resolution.

Fixes:

MarketplaceNotificationService::sendWa() — tambah log + validasi nomor

resolveCustomerPhone() — prioritas shipping_address.phone > user.phone

Skip WA kalau nomor < 10 digit

Additions:

WA notif aktif via Fonnte

Risiko & mitigasi WA gateway (§13.6)

v2.3 — 2026-10-08
Fokus: Perbaikan webhook Flip + integrasi WA dasar.

Fixes:

FlipPaymentService::handleWebhookCallback() — support payload flat & nested

handleWebhook() — method baru (wrapper)

syncCentralBooking() — support relasi user()

v2.2 — 2026-10-08
Refactor multi-database

Fix payment pipeline

SouvenirOrder implements PayableBooking

Multi-DB: marketplace → souvenir_sql

v2.1 — 2026-10-07
Dokumentasi awal marketplace API

18. Referensi
Flip API Docs

KiriminAja Docs

RajaOngkir Docs

Mailtrap

Fonnte WA Gateway

Laravel Sanctum

Maintained by: Backend Team Ovisito
Last updated: 2026-10-08
Version: 2.5

text

---

## 📋 Cara Pakai

**Opsi 1 — Replace File Existing:**
1. Buka GitHub: `marketplacev2.2.md`
2. **Edit** → Ctrl+A → Delete → paste isi di atas
3. Rename file `marketplacev2.2.md` → `marketplacev2.5.md` (opsional)
4. Commit

**Opsi 2 — Buat File Baru:**
1. **New File** → `marketplacev2.5.md`
2. Paste isi di atas
3. Commit

---

## 🎯 Yang Lengkap di v2.5

✅ **18 section** (dari awal sampai akhir)
✅ **Multi-service architecture** (§2)
✅ **Database connection** (§3)
✅ **Public, Customer, Merchant, Admin endpoints** (§6-9)
✅ **Payment integration Flip** (§10)
✅ **Shipping integration** (§11)
✅ **Order lifecycle** (§12)
✅ **Notification lengkap** — email + WA + Fonnte setup + risiko (§13)
✅ **Models & constants reference** (§14-15)
✅ **Roadmap + Known Issues + Frontend TODO** (§16)
✅ **Changelog lengkap** v2.1 → v2.5 (§17)

**File siap pakai. Tidak ada yang terpotong.** 🚀

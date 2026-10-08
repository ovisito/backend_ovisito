📄 NOTIFICATION_GUIDE.md — Panduan Integrasi Email & WA untuk Semua Layanan
File ini untuk semua modul (hotel, kuliner, rental, transport, event, mice, destinasi, tour, marketplace). Simpan di root project: public_html/api/laravel13/NOTIFICATION_GUIDE.md.

markdown
# Notification Integration Guide — Ovisito

> Panduan integrasi **Email** dan **WhatsApp** notifikasi untuk semua layanan di platform Ovisito.
>
> **Versi:** 1.0
> **Terakhir diupdate:** 2026-10-08
> **Berlaku untuk:** hotel, kuliner, rental, transport, event, mice, destinasi, tour, marketplace

---

## Daftar Isi

1. [Overview](#1-overview)
2. [Arsitektur](#2-arsitektur)
3. [Prerequisites](#3-prerequisites)
4. [WhatsAppService](#4-whatsappservice)
5. [Email — Mailable Pattern](#5-email--mailable-pattern)
6. [Notification Service per Modul](#6-notification-service-per-modul)
7. [Trigger via Observer](#7-trigger-via-observer)
8. [Blade Templates](#8-blade-templates)
9. [Config & Environment](#9-config--environment)
10. [Best Practices](#10-best-practices)
11. [Troubleshooting](#11-troubleshooting)
12. [Contoh Lengkap — Modul Hotel](#12-contoh-lengkap--modul-hotel)

---

## 1. Overview

### Tujuan

Memberikan standar **pattern** integrasi notifikasi (email + WhatsApp) supaya:
- Konsisten di semua layanan
- Tidak ada duplikasi kode
- Mudah maintenance
- Gagal notif **tidak** bikin transaksi utama gagal

### Prinsip Utama

1. **Failsafe** — notif gagal tidak boleh rollback transaksi utama
2. **Async** — email & WA via queue (kalau ada)
3. **Idempotent** — cegah kirim ganda di webhook retry
4. **Multi-channel** — email + WA sebagai default
5. **Per-recipient** — customer & merchant dapat notif berbeda

---

## 2. Arsitektur

### Flow Umum
Model Event (create/update)
↓
Observer (XxxObserver)
↓
Notification Service (XxxNotificationService)
↓
├─ Email: Mail::queue() → XxxMail → SMTP
└─ WhatsApp: WhatsAppService::send() → Fonnte/Wablas/Kirimwa

text

### Struktur File
app/
├── Observers/
│ ├── SouvenirOrderObserver.php ← marketplace
│ ├── BookingHotelObserver.php ← hotel (BUAT KALAU BELUM)
│ ├── BookingKulinerObserver.php ← kuliner
│ ├── BookingTransportObserver.php ← transport
│ └── ...
├── Services/
│ ├── Transport/
│ │ └── WhatsAppService.php ← GLOBAL — pakai untuk semua modul
│ ├── Marketplace/
│ │ └── MarketplaceNotificationService.php
│ ├── Hotels/
│ │ └── HotelNotificationService.php ← BUAT KALAU BELUM
│ └── ...
├── Mail/
│ ├── MarketplaceOrderMail.php ← marketplace
│ ├── HotelBookingMail.php ← hotel
│ └── ...
resources/views/emails/
├── marketplace/
│ └── order.blade.php
├── hotel/
│ └── booking.blade.php
└── ...

text

---

## 3. Prerequisites

### Untuk Email

1. **SMTP Credential** (Mailtrap Live / Postmark / Resend)
2. **Verified sender domain** — `ovisito.com` (wajib di-verify di provider)
3. **Blade template** — markdown-friendly
4. **Mailable class** — extend `Mailable`

### Untuk WhatsApp

1. **Akun WA Gateway** — Fonnte (rekomendasi), Wablas, atau Kirimwa
2. **Device aktif** — scan QR pakai nomor **sekunder** (bukan nomor pribadi utama)
3. **Top-up minimal** — Rp 25.000 (Fonnte Lite) → watermark hilang, 1.000 pesan/bulan
4. **Config `.env`** — sudah ada `WA_*`

### Untuk Queue (Rekomendasi)

```env
QUEUE_CONNECTION=database
Jalankan worker:

bash
php artisan queue:work --tries=3
4. WhatsAppService
Lokasi
text
app/Services/Transport/WhatsAppService.php
Deskripsi
Service GLOBAL — bisa dipakai semua modul. Meskipun berada di folder Transport (karena modul transport duluan butuh), fungsinya universal.

Cara Pakai
php
use App\Services\Transport\WhatsAppService;

$wa = app(WhatsAppService::class);

// Simple message
$wa->send('628123456789', 'Halo! Ini pesan notif.');

// Message with link
$wa->sendWithLink(
    '628123456789',
    "Pesanan Anda sedang diproses",
    'https://shop.ovisito.com/orders/123',
    'Lacak Pesanan'
);
Return Value
bool — true kalau sukses, false kalau gagal (tidak throw exception).

Method
Method	Signature	Deskripsi
send()	(string $phone, string $message): bool	Kirim WA ke nomor
sendWithLink()	(string $phone, string $message, string $url, string $label = 'Buka Link'): bool	Kirim WA + link di akhir
Normalisasi Nomor
Service otomatis normalize nomor HP ke format 628xxx:

Input	Output
08123456789	628123456789
8123456789	628123456789
+628123456789	628123456789
628123456789	628123456789
Kalau nomor tidak valid (kosong / < 10 digit) → return false tanpa error.

Provider Support
Provider	Config WA_PROVIDER	Endpoint
Fonnte	fonnte	https://api.fonnte.com/send
Wablas	wablas	Custom
Kirimwa	kirimwa	Custom
Ganti provider tinggal ubah .env — tidak perlu ubah kode.

5. Email — Mailable Pattern
Step 1 — Buat Mailable Class
Path: app/Mail/XxxMail.php (contoh: HotelBookingMail.php)

php
<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class HotelBookingMail extends Mailable
{
    use Queueable, SerializesModels;

    public $booking;
    public string $event;
    public $recipient;
    public ?string $paymentUrl;

    /**
     * @param mixed $booking    Model booking hotel
     * @param string $event     created|paid|confirmed|cancelled|...
     * @param mixed $recipient  User|Merchant
     * @param string|null $paymentUrl
     */
    public function __construct(
        $booking,
        string $event,
        $recipient,
        ?string $paymentUrl = null
    ) {
        $this->booking    = $booking->load(['hotel', 'user', 'merchant']);
        $this->event      = $event;
        $this->recipient  = $recipient;
        $this->paymentUrl = $paymentUrl;
    }

    public function build()
    {
        $subjects = [
            'created'   => 'Booking Diterima',
            'paid'      => 'Pembayaran Berhasil',
            'confirmed' => 'Booking Dikonfirmasi',
            'completed' => 'Menginap Selesai',
            'cancelled' => 'Booking Dibatalkan',
        ];

        $prefix = ($this->recipient->role ?? '') === 'merchant' ? '[Penjual] ' : '';

        return $this->subject(
                $prefix . ($subjects[$this->event] ?? 'Update Booking')
                . ' - ' . $this->booking->booking_code
            )
            ->markdown('emails.hotel.booking', [
                'booking'    => $this->booking,
                'event'      => $this->event,
                'recipient'  => $this->recipient,
                'paymentUrl' => $this->paymentUrl,
            ]);
    }
}
Step 2 — Buat Blade Template
Path: resources/views/emails/hotel/booking.blade.php

blade
@component('mail::message')
# {{
    match($event) {
        'created'   => '🏨 Booking Diterima',
        'paid'      => '✅ Pembayaran Berhasil',
        'confirmed' => '🎉 Booking Dikonfirmasi',
        'completed' => '🌟 Selesai',
        'cancelled' => '❌ Booking Dibatalkan',
        default     => 'Update Booking',
    }
}}

Halo **{{ $recipient->name ?? 'Pelanggan' }}**,

---

**Kode Booking**: {{ $booking->booking_code }}  
**Hotel**: {{ $booking->hotel?->nama ?? '-' }}  
**Check-in**: {{ $booking->check_in_date?->format('d M Y') ?? '-' }}  
**Check-out**: {{ $booking->check_out_date?->format('d M Y') ?? '-' }}  
**Total**: Rp {{ number_format((float) $booking->total_amount, 0, ',', '.') }}

@if($event === 'created' && $paymentUrl)

## 💳 Selesaikan Pembayaran

@component('mail::button', ['url' => $paymentUrl, 'color' => 'primary'])
💳 Bayar Sekarang →
@endcomponent

Atau copy link ini ke browser: {{ $paymentUrl }}

---

@endif

@component('mail::button', ['url' => config('app.frontend_url', 'https://ovisito.com') . '/bookings'])
Lihat Booking
@endcomponent

Terima kasih,  
**{{ config('app.name') }}**

@endcomponent
6. Notification Service per Modul
Struktur Service
Path: app/Services/Hotels/HotelNotificationService.php

php
<?php

namespace App\Services\Hotels;

use App\Mail\HotelBookingMail;
use App\Services\Transport\WhatsAppService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class HotelNotificationService
{
    protected WhatsAppService $wa;

    public function __construct(WhatsAppService $wa)
    {
        $this->wa = $wa;
    }

    // ═════════════════════════════════════════════════════════════════════
    // ENTRY POINTS
    // ═════════════════════════════════════════════════════════════════════

    public function bookingCreated($booking, ?string $paymentUrl = null): void
    {
        $this->safeExecute('bookingCreated', $booking, function () use ($booking, $paymentUrl) {
            $this->sendEmail($booking, 'created', $booking->user, $paymentUrl);
            $this->sendEmail($booking, 'created', $booking->merchant, $paymentUrl);

            $customerPhone = $this->resolveCustomerPhone($booking);
            $this->sendWa($booking, 'created', $customerPhone, $paymentUrl);

            $merchantPhone = $booking->merchant?->phone;
            if ($this->isValidPhone($merchantPhone)) {
                $this->sendWa($booking, 'created', $merchantPhone, $paymentUrl);
            }
        });
    }

    public function bookingPaid($booking): void
    {
        $this->safeExecute('bookingPaid', $booking, function () use ($booking) {
            $this->sendEmail($booking, 'paid', $booking->user);
            $this->sendWa($booking, 'paid', $this->resolveCustomerPhone($booking));
        });
    }

    public function bookingConfirmed($booking): void
    {
        $this->safeExecute('bookingConfirmed', $booking, function () use ($booking) {
            $this->sendEmail($booking, 'confirmed', $booking->user);
            $this->sendWa($booking, 'confirmed', $this->resolveCustomerPhone($booking));
        });
    }

    public function bookingCompleted($booking): void
    {
        $this->safeExecute('bookingCompleted', $booking, function () use ($booking) {
            $this->sendEmail($booking, 'completed', $booking->user);
            $this->sendWa($booking, 'completed', $this->resolveCustomerPhone($booking));
        });
    }

    public function bookingCancelled($booking): void
    {
        $this->safeExecute('bookingCancelled', $booking, function () use ($booking) {
            $this->sendEmail($booking, 'cancelled', $booking->user);
            $this->sendWa($booking, 'cancelled', $this->resolveCustomerPhone($booking));
            $this->sendEmail($booking, 'cancelled', $booking->merchant);
        });
    }

    // ═════════════════════════════════════════════════════════════════════
    // INTERNAL HELPERS
    // ═════════════════════════════════════════════════════════════════════

    protected function safeExecute(string $event, $booking, callable $fn): void
    {
        try {
            $fn();
            Log::info("[HotelNotif] {$event} sent", [
                'booking_code' => $booking->booking_code,
            ]);
        } catch (\Throwable $e) {
            Log::error("[HotelNotif] {$event} failed", [
                'booking_code' => $booking->booking_code,
                'error'        => $e->getMessage(),
            ]);
        }
    }

    protected function sendEmail($booking, string $event, $recipient, ?string $paymentUrl = null): void
    {
        if (!$recipient || empty($recipient->email)) {
            Log::warning("[HotelNotif] Skip email {$event} — no email", [
                'booking_code' => $booking->booking_code,
            ]);
            return;
        }

        Mail::to($recipient->email)->queue(
            new HotelBookingMail($booking, $event, $recipient, $paymentUrl)
        );
    }

    protected function sendWa($booking, string $event, ?string $phone, ?string $paymentUrl = null): void
    {
        if (!$phone) return;

        if (!$this->isValidPhone($phone)) {
            Log::warning("[HotelNotif] Skip WA {$event} — phone invalid", [
                'phone' => $phone,
            ]);
            return;
        }

        $message = $this->buildWaMessage($booking, $event, $paymentUrl);
        if (empty($message)) return;

        $this->wa->send($phone, $message);
    }

    protected function buildWaMessage($booking, string $event, ?string $paymentUrl = null): string
    {
        $code  = $booking->booking_code;
        $total = 'Rp ' . number_format((float) $booking->total_amount, 0, ',', '.');

        return match ($event) {
            'created' => "🏨 *Booking Diterima*\n\n"
                       . "Kode: {$code}\n"
                       . "Total: {$total}\n\n"
                       . ($paymentUrl ? "💳 *Bayar:*\n{$paymentUrl}\n\n" : "")
                       . "Terima kasih! 🙏",

            'paid' => "✅ *Pembayaran Berhasil*\n\n"
                    . "Kode: {$code}\n\n"
                    . "Booking Anda sedang dikonfirmasi. 📝",

            'confirmed' => "🎉 *Booking Dikonfirmasi*\n\n"
                         . "Kode: {$code}\n\n"
                         . "Sampai jumpa di hotel! 🏨",

            'completed' => "🌟 *Menginap Selesai*\n\n"
                         . "Kode: {$code}\n\n"
                         . "Terima kasih sudah menginap. ⭐",

            'cancelled' => "❌ *Booking Dibatalkan*\n\n"
                         . "Kode: {$code}\n\n"
                         . "Hubungi CS untuk info lebih lanjut.",

            default => '',
        };
    }

    protected function resolveCustomerPhone($booking): ?string
    {
        // Prioritas:
        // 1. Field phone di booking (kalau ada)
        // 2. user->phone
        if (!empty($booking->customer_phone)) return $booking->customer_phone;
        if (!empty($booking->phone))          return $booking->phone;
        return $booking->user?->phone;
    }

    protected function isValidPhone(?string $phone): bool
    {
        if (empty($phone)) return false;
        $clean = preg_replace('/[^0-9]/', '', $phone);
        return strlen($clean) >= 10;
    }
}
7. Trigger via Observer
Struktur Observer
Path: app/Observers/BookingHotelObserver.php

php
<?php

namespace App\Observers;

use App\Models\wisata_aceh\BookingHotel;
use App\Services\Hotels\HotelNotificationService;
use Illuminate\Support\Facades\Log;

class BookingHotelObserver
{
    protected HotelNotificationService $notifier;

    public function __construct(HotelNotificationService $notifier)
    {
        $this->notifier = $notifier;
    }

    public function created(BookingHotel $booking): void
    {
        // ⚠️ Skip — tunggu flip_bill_id di-set (updated)
        Log::info('[BookingHotelObserver] created', [
            'booking_code' => $booking->booking_code,
        ]);
    }

    public function updated(BookingHotel $booking): void
    {
        // Trigger created saat flip_bill_id di-set (dengan payment_url)
        if ($booking->wasChanged('flip_bill_id') && !empty($booking->flip_bill_id)) {
            $flipTrx    = \App\Models\Payment\FlipTransaction::where('bill_id', $booking->flip_bill_id)->first();
            $paymentUrl = $flipTrx?->bill_link;

            $this->notifier->bookingCreated($booking, $paymentUrl);
        }

        // Trigger status changes
        if ($booking->wasChanged('status')) {
            match ($booking->status) {
                'paid'      => $this->notifier->bookingPaid($booking),
                'confirmed' => $this->notifier->bookingConfirmed($booking),
                'completed' => $this->notifier->bookingCompleted($booking),
                'cancelled' => $this->notifier->bookingCancelled($booking),
                default     => null,
            };
        }
    }
}
Registrasi Observer
Di app/Providers/AppServiceProvider.php — method boot():

php
public function boot(): void
{
    // ... existing

    // Marketplace
    \App\Models\Marketplace\SouvenirOrder::observe(
        \App\Observers\SouvenirOrderObserver::class
    );

    // Hotel
    \App\Models\wisata_aceh\BookingHotel::observe(
        \App\Observers\BookingHotelObserver::class
    );

    // Kuliner
    \App\Models\kuliner_aceh\BookingKuliner::observe(
        \App\Observers\BookingKulinerObserver::class
    );

    // Transport
    \App\Models\transport_aceh\TransportBooking::observe(
        \App\Observers\BookingTransportObserver::class
    );

    // ... dst untuk setiap modul
}
8. Blade Templates
Struktur Folder
text
resources/views/emails/
├── marketplace/
│   └── order.blade.php
├── hotel/
│   └── booking.blade.php
├── kuliner/
│   └── booking.blade.php
├── transport/
│   └── booking.blade.php
├── rental/
│   └── booking.blade.php
└── ...
Konvensi Naming
Folder: snake_case nama layanan (marketplace, hotel, kuliner)

File: booking.blade.php atau order.blade.php

Path mailable: emails.{modul}.{file} (dot notation)

Template Wajib Punya
Header — judul dinamis per event

Greeting — Halo {nama}

Detail — Kode booking, tanggal, total

Action button — Bayar / Lihat / Lacak

Footer — brand & thank you

Markdown Blade — Elemen yang Didukung
blade
# Heading 1
## Heading 2
**Bold**, *Italic*

@component('mail::button', ['url' => 'https://...', 'color' => 'primary'])
Text Tombol
@endcomponent

@component('mail::table')
| Col 1 | Col 2 |
|-------|-------|
| A     | B     |
@endcomponent
Hindari: SVG, div styling custom (sering di-strip email client). Pakai markdown component.

9. Config & Environment
.env — Email
env
MAIL_MAILER=smtp
MAIL_HOST=live.smtp.mailtrap.io
MAIL_PORT=587
MAIL_USERNAME=api
MAIL_PASSWORD=<mailtrap_password>
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=hello@ovisito.com
MAIL_FROM_NAME="OvisitO - See More, Smile More"
⚠️ Wajib ovisito.com (dengan huruf 'i') — typo ovisto.com ditolak Mailtrap.

.env — WhatsApp
env
WA_PROVIDER=fonnte
WA_API_KEY=<token_fonnte>
WA_API_URL=https://api.fonnte.com/send
WA_SENDER=6281234567890
WA_ENABLED=true
config/services.php
php
'whatsapp' => [
    'provider' => env('WA_PROVIDER', 'fonnte'),
    'api_key'  => env('WA_API_KEY'),
    'api_url'  => env('WA_API_URL', 'https://api.fonnte.com/send'),
    'sender'   => env('WA_SENDER', '6281234567890'),
    'enabled'  => env('WA_ENABLED', false),
],
Setelah ubah .env
WAJIB hapus cache config:

text
bootstrap/cache/config.php
Kalau tidak, perubahan .env tidak terbaca.

10. Best Practices
1. Selalu Bungkus dengan safeExecute()
php
protected function safeExecute(string $event, $model, callable $fn): void
{
    try {
        $fn();
    } catch (\Throwable $e) {
        Log::error("[XxxNotif] {$event} failed", [
            'error' => $e->getMessage(),
        ]);
    }
}
Kenapa: Notif gagal tidak boleh rollback transaksi utama.

2. Prioritaskan Phone dari Booking Form
php
protected function resolveCustomerPhone($booking): ?string
{
    // 1. Phone dari booking (customer isi saat checkout)
    if (!empty($booking->customer_phone)) return $booking->customer_phone;
    
    // 2. Fallback ke user record
    return $booking->user?->phone;
}
Kenapa: Customer mungkin order untuk orang lain (nomor beda dari akun).

3. Validasi Nomor Sebelum Kirim
php
if (strlen(preg_replace('/[^0-9]/', '', $phone)) < 10) {
    Log::warning('Skip WA — phone invalid');
    return;
}
Kenapa: Cegah spam log error untuk nomor invalid (contoh: 0877887).

4. Skip Merchant Kalau Nomor Invalid
php
$merchantPhone = $booking->merchant?->phone;
if ($this->isValidPhone($merchantPhone)) {
    $this->sendWa($booking, 'created', $merchantPhone);
}
Kenapa: Tidak semua merchant punya nomor WA valid. Skip senyap.

5. Gunakan Queue untuk Email
php
Mail::to($email)->queue(new XxxMail(...));
Kenapa: Request webhook tidak blocking kalau SMTP lambat.

6. Idempotent — Cek Status Sebelum Kirim
php
// Di webhook handler
if ($booking->isPaid()) {
    return ['status' => 'already_paid'];
}
Kenapa: Webhook bisa retry. Cegah notif ganda.

7. Log Terstruktur
php
Log::info("[XxxNotif] {$event} sent", [
    'booking_code' => $booking->booking_code,
    'recipient'    => $recipient->email ?? null,
    'phone'        => $phone,
]);
Kenapa: Memudahkan debugging di production.

11. Troubleshooting
Error: Expected response code "250" but got code "550"
Penyebab: Domain pengirim tidak di-verify / typo.
Fix: Cek MAIL_FROM_ADDRESS di .env — harus hello@ovisito.com (dengan 'i').

Error: Class "App\Services\Transport\WhatsAppService" not found
Penyebab: File belum dibuat atau namespace salah.
Fix: Pastikan file ada di app/Services/Transport/WhatsAppService.php.

WA tidak terkirim — log [WA] Skipped — disabled
Penyebab: WA_ENABLED=false (atau cache config belum dihapus).
Fix: Set WA_ENABLED=true di .env + hapus bootstrap/cache/config.php.

WA tidak terkirim — log [WA/Fonnte] ❌ Failed {"reason":"disconnected device"}
Penyebab: Device Fonnte belum scan QR / offline.
Fix: Login dashboard Fonnte → Device → scan QR pakai nomor WA.

WA tidak terkirim — log [WA/Fonnte] ❌ Failed {"reason":"target input invalid"}
Penyebab: Nomor tujuan invalid (kurang digit).
Fix: Cek nomor customer. Untuk merchant dengan 0877887, skip.

WA terkirim tapi ada watermark "Powered by Fonnte"
Penyebab: Akun Fonnte masih free tier.
Fix: Top-up minimal Rp 25.000 (paket Lite) → watermark hilang.

Email terkirim tapi tidak masuk inbox
Penyebab:

Masuk folder Spam

Domain belum verified di provider

Recipient bounce

Fix: Cek spam → cek dashboard provider → cek log.

Notif ganda (2x kirim untuk 1 event)
Penyebab: Observer trigger 2x (created + updated).
Fix: Trigger hanya di updated() saat flip_bill_id changed (seperti pattern marketplace).

12. Contoh Lengkap — Modul Hotel
Checklist Implementasi Modul Baru
Ikuti langkah berikut untuk menambahkan notif ke modul baru (contoh: Hotel):

Step 1 — Buat Mailable
app/Mail/HotelBookingMail.php

php
<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class HotelBookingMail extends Mailable
{
    use Queueable, SerializesModels;

    public $booking;
    public string $event;
    public $recipient;
    public ?string $paymentUrl;

    public function __construct($booking, string $event, $recipient, ?string $paymentUrl = null)
    {
        $this->booking    = $booking;
        $this->event      = $event;
        $this->recipient  = $recipient;
        $this->paymentUrl = $paymentUrl;
    }

    public function build()
    {
        return $this->subject('Booking Hotel - ' . $this->booking->booking_code)
            ->markdown('emails.hotel.booking', [
                'booking'    => $this->booking,
                'event'      => $this->event,
                'recipient'  => $this->recipient,
                'paymentUrl' => $this->paymentUrl,
            ]);
    }
}
Step 2 — Buat Blade Template
resources/views/emails/hotel/booking.blade.php — copy pattern dari marketplace.

Step 3 — Buat Notification Service
app/Services/Hotels/HotelNotificationService.php — copy pattern dari marketplace.

Step 4 — Buat Observer
app/Observers/BookingHotelObserver.php — copy pattern.

Step 5 — Registrasi Observer
app/Providers/AppServiceProvider.php:

php
\App\Models\wisata_aceh\BookingHotel::observe(
    \App\Observers\BookingHotelObserver::class
);
Step 6 — Test
Buat booking baru via API

Cek log [HotelNotif]

Cek inbox email

Cek WA masuk

Step 7 — (Opsional) Auto-Trigger Payment
Kalau booking perlu Flip, update controller untuk auto-panggil PaymentService setelah create — sama seperti CustomerOrderController.

Matrix Provider WA — Kelebihan & Kekurangan
Provider	Setup	Harga	Watermark Free	Risiko Ban	Rekomendasi
Fonnte	Mudah (scan QR)	Rp 25k/bulan + Rp 100/pesan	✅ Ada (hilang setelah top-up)	🟡 Sedang	✅ Default
Wablas	Mudah	Rp 150/pesan	⚠️ Ada	🟡 Sedang	Alternatif
Kirimwa	Mudah	Rp 100/pesan	⚠️ Ada	🟡 Sedang	Alternatif
WhatsApp Business API	Sulit (verifikasi bisnis)	$0.005/pesan + bulanan	❌ Tidak ada	🟢 Rendah	Untuk enterprise
Baileys (self-host)	Sulit (butuh server)	Gratis	❌ Tidak ada	🔴 Tinggi	Untuk developer
Referensi
Fonnte Docs

Laravel Mail

Laravel Notifications

Markdown Mail

Marketplace Notification Implementation

Maintained by: Backend Team Ovisito
Last updated: 2026-10-08
Version: 1.0

text

---

## 📋 Cara Pakai Dokumen Ini

### Untuk Developer Baru

1. **Baca §1-3** — paham arsitektur & prerequisite
2. **Baca §4-5** — pakai `WhatsAppService` & bikin Mailable
3. **Baca §6-7** — bikin NotificationService & Observer
4. **Ikuti §12** — implementasi step-by-step

### Untuk Modul Existing (yang belum ada notif)

Ambil 1 modul (misal Hotel), ikuti checklist §12:
- Buat `HotelBookingMail`
- Buat `hotel/booking.blade.php`
- Buat `HotelNotificationService`
- Buat `BookingHotelObserver`
- Registrasi di `AppServiceProvider`
- Test

### Untuk Modul Baru (ke depan)

Copy folder existing (misal `Marketplace`), rename jadi modul baru, sesuaikan:
- Model (SouvenirOrder → XxxBooking)
- Event names
- Blade template content

---

## 🚦 Next Step

Mau saya bantu implementasi notif untuk modul tertentu (misal Hotel / Kuliner / Transport)? Atau ada yang perlu ditambahkan di dokumen ini?

**Kalau OK**, dokumen ini siap disimpan dan bisa jadi referensi tim developer untuk integrasi notif di semua layanan. 🚀

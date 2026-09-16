📘 Dokumentasi REST API — Modul Bahasa Aceh
File: docs/api/bahasa-aceh-api.md
Versi: 2.2
Terakhir diperbarui: 2026-09-17

Ovisito Bahasa Aceh API v2
REST API untuk modul Bahasa Aceh (kamus, peribahasa, tata bahasa, budaya, chatbot).

Daftar Isi
Overview

Autentikasi

Base URL & Header

Format Response

Rate Limiting

Endpoint — Public

Endpoint — Admin

Error Codes

Changelog

1. Overview
Modul Bahasa Aceh menyediakan API untuk:

Public — kamus Aceh, peribahasa, tata bahasa, budaya, pencarian global

Admin — kelola seluruh data bahasa Aceh, log interaksi, feedback

Aktor & Guard
Aktor	Guard	Login Endpoint
Customer/Public	client.auth	—
Admin	auth:admin_api	POST /api/v2/admin/login
Base Path
text
Production : https://api.ovisito.com
Sandbox    : https://staging.ovisito.com

Admin   : /api/v2/admin/bahasa-aceh/*
Public  : /api/v2/public/bahasa-aceh/*
Model Namespace
text
App\Models\Bahasa_Aceh\*
Sub-Modul
Sub-Modul	Deskripsi
kata	Kamus kata Aceh-Indonesia
hadih-maja	Peribahasa Aceh
tanya-jawab	FAQ bahasa Aceh
kata-sapaan	Kata sapaan
pola-kalimat	Pola tata bahasa
contoh-kalimat	Contoh penggunaan
frasa	Frasa & idiom
fonem	Sistem fonem
cara-baca-huruf	Panduan pelafalan
imbuhan	Sistem imbuhan
morfofonemik	Proses morfofonemik
pemajemukan	Kata majemuk
perulangan-kata	Reduplikasi
variasi-kata	Varian dialek
komponen-frasa	Struktur frasa
fungsi-imbuhan	Fungsi imbuhan
contoh-imbuhan	Contoh imbuhan
aceh-arabic	Kamus Aceh-Arab
aceh-china	Kamus Aceh-China
ref-daerah	Referensi daerah
ref-strata	Referensi strata bahasa
interaction-logs	Log interaksi chatbot
training-feedback	Feedback untuk training
2. Autentikasi
Setiap request melewati 2 layer autentikasi:

Layer 1 — Client Auth (wajib semua endpoint)
Header	Wajib	Keterangan
X-Client-ID	✅	ID aplikasi
X-Client-Secret	✅	Secret aplikasi
Layer 2 — Token User (khusus admin)
Header	Wajib
Authorization: Bearer <token>	✅ (admin only)
3. Base URL & Header
Header Standar — Public
http
X-Client-ID: shop-web
X-Client-Secret: <secret>
Content-Type: application/json
Accept: application/json
Header Standar — Admin
http
X-Client-ID: admin-web
X-Client-Secret: <secret>
Authorization: Bearer <admin_token>
Content-Type: application/json
Accept: application/json
Contoh Request
bash
# Public
curl -X GET "https://api.ovisito.com/api/v2/public/bahasa-aceh/kata" \
  -H "X-Client-ID: shop-web" \
  -H "X-Client-Secret: xxxxx" \
  -H "Accept: application/json"

# Admin
curl -X GET "https://api.ovisito.com/api/v2/admin/bahasa-aceh/kata" \
  -H "X-Client-ID: admin-web" \
  -H "X-Client-Secret: xxxxx" \
  -H "Authorization: Bearer <admin_token>"
4. Format Response
Sukses
json
{
  "status": true,
  "message": "Optional success message",
  "data": { }
}
Sukses dengan Pagination
json
{
  "current_page": 1,
  "data": [ ... ],
  "per_page": 20,
  "total": 1200,
  "last_page": 60
}
Error
json
{
  "status": false,
  "message": "Pesan error",
  "errors": {
    "field": ["Validation error message"]
  }
}
5. Rate Limiting
Endpoint Group	Limit
Public bahasa aceh (default)	120 req/menit
GET /public/bahasa-aceh/search	60 req/menit
Admin	120 req/menit
6. Endpoint — Public
Base path: /api/v2/public/bahasa-aceh
Middleware: client.auth, throttle:120,1

6.1 Cari Global (Search) ⭐
http
GET /api/v2/public/bahasa-aceh/search?q=makan
Middleware tambahan: throttle:60,1

Query Params:

Param	Tipe	Wajib	Keterangan
q	string	✅	Keyword (min 2 char, max 50)
limit	int	—	Default 10, max 50
type	enum	—	Filter: kata, hadih, tanya, sapaan, pola
Request:

bash
GET /api/v2/public/bahasa-aceh/search?q=makan&type=kata&limit=5
Response:

json
{
  "status": true,
  "data": {
    "kata": [
      {
        "id": 1,
        "kata_aceh": "makan",
        "arti_indonesia": "makan",
        "kelas_kata": "verba",
        "contoh_penggunaan": "Lon makan bu"
      }
    ],
    "hadih_maja": [
      {
        "id": 12,
        "teks_aceh": "Makan saboh, tapeugah...",
        "arti_indonesia": "Makan bersama, jangan sendiri"
      }
    ],
    "tanya_jawab": [ ... ],
    "kata_sapaan": [ ... ],
    "pola_kalimat": [ ... ]
  }
}
Error 422 (kalau q < 2 char):

json
{
  "status": false,
  "message": "Keyword minimal 2 karakter."
}
6.2 List Kata (Kamus)
http
GET /api/v2/public/bahasa-aceh/kata
Query Params:

Param	Tipe	Default	Keterangan
search	string	—	Filter kata
kelas_kata	enum	—	verba, nomina, adjektiva, dll
page	int	1	
per_page	int	20	Max 100
Response:

json
{
  "status": true,
  "data": {
    "current_page": 1,
    "data": [
      {
        "id": 1,
        "kata_aceh": "makan",
        "arti_indonesia": "makan",
        "kelas_kata": "verba",
        "contoh_penggunaan": "Lon makan bu",
        "contoh_arti": "Saya makan nasi"
      }
    ],
    "per_page": 20,
    "total": 850,
    "last_page": 43
  }
}
6.3 Detail Kata
http
GET /api/v2/public/bahasa-aceh/kata/{id}
Response:

json
{
  "status": true,
  "data": {
    "id": 1,
    "kata_aceh": "makan",
    "arti_indonesia": "makan",
    "kelas_kata": "verba",
    "contoh_penggunaan": "Lon makan bu",
    "contoh_arti": "Saya makan nasi",
    "variasi": [
      { "daerah": "Aceh Besar", "bentuk": "makan" },
      { "daerah": "Pidie", "bentuk": "makan" }
    ],
    "kata_terkait": [
      { "id": 5, "kata_aceh": "peunajoh", "arti_indonesia": "makanan" }
    ]
  }
}
6.4 Kata Hari Ini (Daily Word) ⭐
http
GET /api/v2/public/bahasa-aceh/daily-word
Response:

json
{
  "status": true,
  "data": {
    "id": 42,
    "kata_aceh": "cinta",
    "arti_indonesia": "cinta",
    "kelas_kata": "nomina",
    "contoh_penggunaan": "Cinta nanggroe",
    "contoh_arti": "Cinta tanah air"
  },
  "meta": {
    "generated_at": "2026-09-17T00:00:00Z",
    "cache_until": "2026-09-17T23:59:59Z"
  }
}
📌 Cache: Response di-cache per hari supaya semua user dapat kata yang sama.

6.5 List Hadih Maja (Peribahasa)
http
GET /api/v2/public/bahasa-aceh/hadih-maja
Query Params:

Param	Tipe
search	string
page	int
per_page	int (max 100)
Response:

json
{
  "status": true,
  "data": {
    "current_page": 1,
    "data": [
      {
        "id": 12,
        "teks_aceh": "Makan saboh tapeugah, hareukat saboh tapeugah...",
        "arti_indonesia": "Makan bersama diberitahu, rezeki bersama diberitahu...",
        "makna": "Kebersamaan dalam keluarga"
      }
    ],
    "total": 145
  }
}
6.6 Hadih Maja Acak (Random)
http
GET /api/v2/public/bahasa-aceh/hadih-maja/random?limit=3
Query Params: limit (default 1, max 10)

Response:

json
{
  "status": true,
  "data": [
    {
      "id": 12,
      "teks_aceh": "...",
      "arti_indonesia": "..."
    },
    {
      "id": 45,
      "teks_aceh": "...",
      "arti_indonesia": "..."
    }
  ]
}
6.7 List Kata Sapaan
http
GET /api/v2/public/bahasa-aceh/kata-sapaan
Response:

json
{
  "status": true,
  "data": [
    {
      "id": 1,
      "sapaan": "Assalamualaikum",
      "arti": "Salam sejahtera",
      "penggunaan": "Salam pembuka"
    },
    {
      "id": 2,
      "sapaan": "Pak",
      "arti": "Bapak",
      "penggunaan": "Sapaan untuk pria dewasa"
    }
  ]
}
6.8 List Pola Kalimat
http
GET /api/v2/public/bahasa-aceh/pola-kalimat
Response:

json
{
  "status": true,
  "data": [
    {
      "id": 1,
      "nama_pola": "SPO (Subjek - Predikat - Objek)",
      "deskripsi": "Lon (S) - makan (P) - bu (O)",
      "contoh": "Lon makan bu = Saya makan nasi"
    }
  ]
}
6.9 List Tanya Jawab
http
GET /api/v2/public/bahasa-aceh/tanya-jawab
Query Params: search, page, per_page

Response:

json
{
  "status": true,
  "data": {
    "current_page": 1,
    "data": [
      {
        "id": 1,
        "pertanyaan": "Apa itu hadih maja?",
        "jawaban": "Hadih maja adalah peribahasa dalam bahasa Aceh...",
        "kategori": "Budaya"
      }
    ],
    "total": 45
  }
}
7. Endpoint — Admin
Base path: /api/v2/admin/bahasa-aceh
Middleware: client.auth, throttle:120,1, auth:admin_api, admin

7.1 Pola CRUD Umum
Semua sub-modul berikut punya pola CRUD yang sama:

Method	Endpoint	Fungsi
GET	/{resource}	List
POST	/{resource}	Create
GET	/{resource}/{id}	Detail
PUT/PATCH	/{resource}/{id}	Update
DELETE	/{resource}/{id}	Hapus
Daftar resource:

text
aceh-arabic
aceh-china
cara-baca-huruf
contoh-imbuhan
contoh-kalimat
fonem
frasa
fungsi-imbuhan
hadih-maja
imbuhan
interaction-logs
kata
kata-sapaan
komponen-frasa
morfofonemik
pemajemukan
perulangan-kata
pola-kalimat
ref-daerah
ref-strata
tanya-jawab
training-feedback
variasi-kata
7.2 Contoh Detail — Kata
List Kata (Admin)
http
GET /api/v2/admin/bahasa-aceh/kata
Query Params:

Param	Tipe
search	string
kelas_kata	enum
page	int
per_page	int (max 100)
Stats Kata
http
GET /api/v2/admin/bahasa-aceh/kata/stats
Response:

json
{
  "status": true,
  "data": {
    "total": 850,
    "by_kelas_kata": {
      "verba": 250,
      "nomina": 320,
      "adjektiva": 180,
      "adverbia": 100
    },
    "by_daerah": {
      "Aceh Besar": 200,
      "Pidie": 150,
      "Aceh Utara": 180,
      "Aceh Barat": 120
    },
    "baru_minggu_ini": 12
  }
}
Detail Kata (Admin)
http
GET /api/v2/admin/bahasa-aceh/kata/{kata}
Parameter {kata} = ID.

Create Kata
http
POST /api/v2/admin/bahasa-aceh/kata
Body:

json
{
  "kata_aceh": "peunajoh",
  "arti_indonesia": "makanan",
  "kelas_kata": "nomina",
  "contoh_penggunaan": "Peunajoh nyoe mangat that",
  "contoh_arti": "Makanan ini enak sekali",
  "daerah": "Aceh Besar"
}
Update Kata
http
PUT /api/v2/admin/bahasa-aceh/kata/{kata}
Parameter {kata} = ID.

Hapus Kata
http
DELETE /api/v2/admin/bahasa-aceh/kata/{kata}
Parameter {kata} = ID.

7.3 Contoh Detail — Hadih Maja
Create Hadih Maja
http
POST /api/v2/admin/bahasa-aceh/hadih-maja
Body:

json
{
  "teks_aceh": "Makan saboh tapeugah, hareukat saboh tapeugah...",
  "arti_indonesia": "Makan bersama diberitahu, rezeki bersama diberitahu...",
  "makna": "Kebersamaan dalam keluarga",
  "kategori": "keluarga",
  "daerah": "Aceh Besar"
}
7.4 Contoh Detail — Tanya Jawab
Create Tanya Jawab
http
POST /api/v2/admin/bahasa-aceh/tanya-jawab
Body:

json
{
  "pertanyaan": "Apa itu hadih maja?",
  "jawaban": "Hadih maja adalah peribahasa dalam bahasa Aceh...",
  "kategori": "Budaya",
  "is_active": true
}
7.5 Interaction Logs (Chatbot)
List Log
http
GET /api/v2/admin/bahasa-aceh/interaction-logs
Query Params:

Param	Tipe
user_uuid	string
session_id	string
from_date	date
to_date	date
page	int
Response:

json
{
  "current_page": 1,
  "data": [
    {
      "id": "uuid",
      "user_uuid": "uuid",
      "session_id": "session-abc123",
      "user_message": "Apa bahasa Acehnya makan?",
      "bot_response": "Bahasa Acehnya makan adalah 'makan' juga.",
      "intent": "translate",
      "confidence": 0.95,
      "created_at": "2026-09-17T10:30:00Z"
    }
  ]
}
7.6 Training Feedback
List Feedback
http
GET /api/v2/admin/bahasa-aceh/training-feedback
Query Params: is_processed, rating, from_date, to_date

Response:

json
{
  "data": [
    {
      "id": "uuid",
      "interaction_log_uuid": "uuid",
      "user_uuid": "uuid",
      "rating": 5,
      "feedback": "Jawaban sangat membantu",
      "is_processed": false,
      "created_at": "2026-09-17T10:35:00Z"
    }
  ]
}
Create Feedback
http
POST /api/v2/admin/bahasa-aceh/training-feedback
Body:

json
{
  "interaction_log_uuid": "uuid",
  "rating": 5,
  "feedback": "Jawaban sangat membantu",
  "is_processed": false
}
7.7 Sub-Modul Kecil
Aceh-Arabic
http
GET    /api/v2/admin/bahasa-aceh/aceh-arabic
POST   /api/v2/admin/bahasa-aceh/aceh-arabic
GET    /api/v2/admin/bahasa-aceh/aceh-arabic/{aceh_arabic}
PUT    /api/v2/admin/bahasa-aceh/aceh-arabic/{aceh_arabic}
DELETE /api/v2/admin/bahasa-aceh/aceh-arabic/{aceh_arabic}
Create Body:

json
{
  "kata_aceh": "sikin",
  "kata_arab": "سِكِّين",
  "arti": "pisau",
  "transliterasi": "sikkīn"
}
Aceh-China
http
GET    /api/v2/admin/bahasa-aceh/aceh-china
POST   /api/v2/admin/bahasa-aceh/aceh-china
GET    /api/v2/admin/bahasa-aceh/aceh-china/{aceh_china}
PUT    /api/v2/admin/bahasa-aceh/aceh-china/{aceh_china}
DELETE /api/v2/admin/bahasa-aceh/aceh-china/{aceh_china}
Create Body:

json
{
  "kata_aceh": "teh",
  "kata_china": "茶",
  "pinyin": "chá",
  "arti": "teh"
}
Fonem
http
GET    /api/v2/admin/bahasa-aceh/fonem
POST   /api/v2/admin/bahasa-aceh/fonem
GET    /api/v2/admin/bahasa-aceh/fonem/{fonem}
PUT    /api/v2/admin/bahasa-aceh/fonem/{fonem}
DELETE /api/v2/admin/bahasa-aceh/fonem/{fonem}
Create Body:

json
{
  "simbol": "é",
  "jenis": "vokal",
  "contoh_kata": "éh",
  "deskripsi": "Vokal e pepet"
}
Cara Baca Huruf
http
GET    /api/v2/admin/bahasa-aceh/cara-baca-huruf
POST   /api/v2/admin/bahasa-aceh/cara-baca-huruf
GET    /api/v2/admin/bahasa-aceh/cara-baca-huruf/{cara_baca_huruf}
PUT    /api/v2/admin/bahasa-aceh/cara-baca-huruf/{cara_baca_huruf}
DELETE /api/v2/admin/bahasa-aceh/cara-baca-huruf/{cara_baca_huruf}
Create Body:

json
{
  "huruf": "a",
  "cara_baca": "a seperti pada kata 'ayah'",
  "contoh": "aneuk (anak)"
}
Frasa
http
GET    /api/v2/admin/bahasa-aceh/frasa
POST   /api/v2/admin/bahasa-aceh/frasa
GET    /api/v2/admin/bahasa-aceh/frasa/{frasa}
PUT    /api/v2/admin/bahasa-aceh/frasa/{frasa}
DELETE /api/v2/admin/bahasa-aceh/frasa/{frasa}
Create Body:

json
{
  "frasa_aceh": "ureung agam",
  "arti_indonesia": "orang laki-laki",
  "jenis": "nomina",
  "contoh": "Ureung agam nyan ka jak"
}
Contoh Kalimat
http
GET    /api/v2/admin/bahasa-aceh/contoh-kalimat
POST   /api/v2/admin/bahasa-aceh/contoh-kalimat
GET    /api/v2/admin/bahasa-aceh/contoh-kalimat/{contoh_kalimat}
PUT    /api/v2/admin/bahasa-aceh/contoh-kalimat/{contoh_kalimat}
DELETE /api/v2/admin/bahasa-aceh/contoh-kalimat/{contoh_kalimat}
Imbuhan
http
GET    /api/v2/admin/bahasa-aceh/imbuhan
POST   /api/v2/admin/bahasa-aceh/imbuhan
GET    /api/v2/admin/bahasa-aceh/imbuhan/{imbuhan}
PUT    /api/v2/admin/bahasa-aceh/imbuhan/{imbuhan}
DELETE /api/v2/admin/bahasa-aceh/imbuhan/{imbuhan}
Create Body:

json
{
  "imbuhan": "meu-",
  "jenis": "prefiks",
  "fungsi": "menyatakan memiliki/melakukan",
  "contoh": "meureunoh (berasap) dari reunoh (asap)"
}
8. Error Codes
Code	Keterangan
200	Sukses
201	Berhasil create
400	Bad request
401	Unauthenticated (client/token tidak valid)
403	Forbidden
404	Resource tidak ditemukan
422	Validasi gagal
429	Rate limit
500	Server error
Pesan Error Umum
Pesan	Penyebab
Client credentials required	Header X-Client-ID/Secret tidak ada
Invalid client credentials	Client ID/Secret salah
Unauthenticated.	Token user tidak valid/expired (admin endpoint)
Keyword diperlukan	q kosong di endpoint search
Keyword minimal 2 karakter	q < 2 char
Resource tidak ditemukan	ID/slug tidak ada
Validasi gagal	Field wajib tidak diisi
Too Many Attempts	Rate limit tercapai
9. Changelog
Versi	Tanggal	Perubahan
1.0	2025-06	Rilis awal — kamus kata & kategori
1.5	2026-01	Tambah hadih maja, tanya jawab
2.0	2026-05	Tambah fonem, imbuhan, morfofonemik
2.1	2026-08	Tambah interaction log, training feedback
2.2	2026-09-17	Dokumentasi lengkap + endpoint public
📎 Lampiran
A. Alur Penggunaan Shop Frontend
text
1. Homepage — Tampilkan kata hari ini
   GET /api/v2/public/bahasa-aceh/daily-word

2. Homepage — Tampilkan peribahasa acak
   GET /api/v2/public/bahasa-aceh/hadih-maja/random?limit=3

3. Halaman Kamus — List kata + filter
   GET /api/v2/public/bahasa-aceh/kata?search=makan&per_page=20

4. Detail Kata
   GET /api/v2/public/bahasa-aceh/kata/1

5. Halaman Hadih Maja
   GET /api/v2/public/bahasa-aceh/hadih-maja?search=keluarga

6. Halaman Kata Sapaan
   GET /api/v2/public/bahasa-aceh/kata-sapaan

7. Halaman Pola Kalimat
   GET /api/v2/public/bahasa-aceh/pola-kalimat

8. Search global
   GET /api/v2/public/bahasa-aceh/search?q=cinta&type=kata
B. Contoh cURL Lengkap
bash
# ═══ PUBLIC ═══════════════════════════════════════════════
# Search global
curl -H "X-Client-ID: shop-web" \
     -H "X-Client-Secret: xxxxx" \
     "https://api.ovisito.com/api/v2/public/bahasa-aceh/search?q=makan"

# Search hanya kata
curl -H "X-Client-ID: shop-web" \
     -H "X-Client-Secret: xxxxx" \
     "https://api.ovisito.com/api/v2/public/bahasa-aceh/search?q=makan&type=kata"

# List kata dengan filter
curl -H "X-Client-ID: shop-web" \
     -H "X-Client-Secret: xxxxx" \
     "https://api.ovisito.com/api/v2/public/bahasa-aceh/kata?search=makan&kelas_kata=verba"

# Detail kata
curl -H "X-Client-ID: shop-web" \
     -H "X-Client-Secret: xxxxx" \
     "https://api.ovisito.com/api/v2/public/bahasa-aceh/kata/1"

# Daily word
curl -H "X-Client-ID: shop-web" \
     -H "X-Client-Secret: xxxxx" \
     "https://api.ovisito.com/api/v2/public/bahasa-aceh/daily-word"

# Hadih maja acak
curl -H "X-Client-ID: shop-web" \
     -H "X-Client-Secret: xxxxx" \
     "https://api.ovisito.com/api/v2/public/bahasa-aceh/hadih-maja/random?limit=3"

# Kata sapaan
curl -H "X-Client-ID: shop-web" \
     -H "X-Client-Secret: xxxxx" \
     "https://api.ovisito.com/api/v2/public/bahasa-aceh/kata-sapaan"

# Pola kalimat
curl -H "X-Client-ID: shop-web" \
     -H "X-Client-Secret: xxxxx" \
     "https://api.ovisito.com/api/v2/public/bahasa-aceh/pola-kalimat"

# Tanya jawab
curl -H "X-Client-ID: shop-web" \
     -H "X-Client-Secret: xxxxx" \
     "https://api.ovisito.com/api/v2/public/bahasa-aceh/tanya-jawab?search=hadih"

# ═══ ADMIN ════════════════════════════════════════════════
# List kata (admin)
curl -H "X-Client-ID: admin-web" \
     -H "X-Client-Secret: xxxxx" \
     -H "Authorization: Bearer <admin_token>" \
     "https://api.ovisito.com/api/v2/admin/bahasa-aceh/kata"

# Stats kata
curl -H "X-Client-ID: admin-web" \
     -H "X-Client-Secret: xxxxx" \
     -H "Authorization: Bearer <admin_token>" \
     "https://api.ovisito.com/api/v2/admin/bahasa-aceh/kata/stats"

# Create kata
curl -X POST \
     -H "X-Client-ID: admin-web" \
     -H "X-Client-Secret: xxxxx" \
     -H "Authorization: Bearer <admin_token>" \
     -H "Content-Type: application/json" \
     -d '{"kata_aceh":"peunajoh","arti_indonesia":"makanan","kelas_kata":"nomina"}' \
     "https://api.ovisito.com/api/v2/admin/bahasa-aceh/kata"

# Update kata
curl -X PUT \
     -H "X-Client-ID: admin-web" \
     -H "X-Client-Secret: xxxxx" \
     -H "Authorization: Bearer <admin_token>" \
     -H "Content-Type: application/json" \
     -d '{"arti_indonesia":"makanan enak"}' \
     "https://api.ovisito.com/api/v2/admin/bahasa-aceh/kata/1"

# Delete kata
curl -X DELETE \
     -H "X-Client-ID: admin-web" \
     -H "X-Client-Secret: xxxxx" \
     -H "Authorization: Bearer <admin_token>" \
     "https://api.ovisito.com/api/v2/admin/bahasa-aceh/kata/1"

# Interaction logs
curl -H "X-Client-ID: admin-web" \
     -H "X-Client-Secret: xxxxx" \
     -H "Authorization: Bearer <admin_token>" \
     "https://api.ovisito.com/api/v2/admin/bahasa-aceh/interaction-logs?from_date=2026-09-01"
C. Perbandingan Public vs Admin
Aspek	Public	Admin
Auth	client.auth	client.auth + auth:admin_api + admin
Baca	✅	✅
Tulis (Create)	❌	✅
Update	❌	✅
Delete	❌	✅
Stats	❌	✅
Interaction logs	❌	✅
Training feedback	❌	✅
D. Response Field Konsisten
Setiap response konsisten memuat:

Field	Keterangan
status	true / false
message	Pesan opsional
data	Data utama
meta	Metadata (mis. generated_at)
E. TODO — Yang Bisa Ditambahkan
□ Endpoint Quiz — GET /public/bahasa-aceh/quiz/random
□ Endpoint Audio Pronunciation — GET /public/bahasa-aceh/kata/{id}/audio
□ Endpoint Flashcard — untuk belajar bahasa Aceh
□ Endpoint Statistik Publik — total kata, hadih maja, dll
□ Endpoint Export — unduh kamus (CSV/PDF)
□ Endpoint Kontribusi — usul kata baru dari user
Maintainer: Tim Backend Ovisito
Kontak: backend@ovisito.com


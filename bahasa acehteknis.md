# Technical Design Document
## Aceh Language Intelligence Platform (ALIP)
### Multi-Agent RAG System dengan DeepSeek API

| | |
|---|---|
| **Document Version** | 1.0 |
| **Status** | Draft for Review |
| **Author** | Engineering Team |
| **Date** | 2026-09-23 |
| **Reviewers** | CTO, Head of Product, Lead Data Scientist |
| **Classification** | Internal |

---

## 1. Executive Summary

Aceh Language Intelligence Platform (ALIP) adalah sistem AI multi-agent berbasis Retrieval-Augmented Generation (RAG) yang dirancang untuk melestarikan, mengajarkan, dan mempromosikan bahasa, sastra, dan budaya Aceh. Sistem ini menggabungkan kurasi data linguistik terstruktur (20+ tabel bahasa) dengan LLM generatif (DeepSeek) melalui arsitektur multi-agent yang terdesentralisasi dan dapat diperluas.

**Masalah yang diselesaikan:**

- Bahasa Aceh terancam punah (kategori *vulnerable* per UNESCO)
- Tidak ada platform digital komprehensif untuk pembelajaran bahasa Aceh
- Akses ke pengetahuan linguistik & budaya Aceh terbatas pada akademisi
- Generasi muda Aceh semakin kehilangan koneksi dengan warisan bahasa

**Solusi:**
Platform AI yang menyediakan 6 domain layanan spesifik (Kamus, Tata Bahasa, Sapaan, Hadih Maja, Sastra, Terjemahan) melalui arsitektur multi-agent, dengan dua mode akses: Umum (auto-routing) dan Spesifik (user-directed).

**Target Dampak (12 bulan):**

- 100.000+ user aktif
- 1 juta+ interaksi terlog
- Kontribusi dataset ke penelitian linguistik Aceh
- Adopsi oleh minimal 50 institusi pendidikan

---

## 2. Problem Statement & Opportunity

### 2.1 Problem Space

| Dimensi | Masalah | Dampak |
|---|---|---|
| Linguistik | Tidak ada korpus digital terstruktur bahasa Aceh | Riset & pengajaran terhambat |
| Aksesibilitas | Kamus & buku tata bahasa hanya tersedia fisik | Generasi muda tidak terlayani |
| Kontekstual | Kamus konvensional tidak menjelaskan nuansa budaya | Salah penggunaan sapaan/adat |
| Multimodal | Tidak ada integrasi Latin ↔ Jawi ↔ Arab ↔ China | Kesulitan lintas bahasa |
| Skalabilitas | Pakar bahasa Aceh terbatas jumlahnya | Kualitas pengajaran tidak merata |

### 2.2 Market Opportunity

- **TAM:** 5,4 juta penutur bahasa Aceh + 20 juta diaspora Aceh global
- **SAM:** 500.000 pelajar & mahasiswa di Aceh + 100.000 peneliti/pengajar
- **SOM:** 50.000 user awal (Fase 1) dari segmen edukasi & diaspora

### 2.3 Competitive Landscape

| Kompetitor | Kelebihan | Kelemahan |
|---|---|---|
| Google Translate | Skala besar | Tidak ada bahasa Aceh, tidak kontekstual |
| Kamus Aceh cetak | Komprehensif | Tidak interaktif, tidak *searchable* |
| Chatbot generik (ChatGPT) | Fleksibel | Halusinasi, tidak akurat untuk bahasa daerah |
| Aplikasi lokal | Fokus | Terbatas, tidak multi-domain |

**Differentiator kami:** Data linguistik terkurasi + multi-agent RAG + feedback loop self-improving.

---

## 3. Goals & Non-Goals

### 3.1 Goals (Fase 1 — 6 Bulan)

- ✅ Menyediakan 6 domain layanan bahasa Aceh berbasis AI
- ✅ Mencapai akurasi retrieval ≥ 90% pada test set internal
- ✅ Mencapai response time P95 < 3 detik
- ✅ Membangun pipeline feedback → fine-tuning
- ✅ Mendukung 5 bahasa: Aceh, Indonesia, Arab, China, Inggris

### 3.2 Non-Goals (Fase 1)

- ❌ Speech-to-text / Text-to-speech bahasa Aceh
- ❌ Terjemahan dokumen panjang (>1000 kata)
- ❌ Integrasi hardware / offline mode
- ❌ Mobile native app (fokus web + API dulu)
- ❌ Fine-tuning model (fokus RAG dulu)

---

## 4. Success Metrics

### 4.1 North Star Metric

**Weekly Active Learners (WAL)** — user yang melakukan ≥3 interaksi signifikan per minggu.

### 4.2 Metrics Framework (HEART)

| Kategori | Metric | Target Fase 1 |
|---|---|---|
| Happiness | User rating rata-rata | ≥ 4.3 / 5.0 |
| Engagement | Session depth (pesan/sesi) | ≥ 4 pesan |
| Adoption | New user retention D7 | ≥ 35% |
| Retention | User retention M1 | ≥ 25% |
| Task Success | Retrieval precision@5 | ≥ 0.90 |
| Task Success | Answer relevance (LLM-judge) | ≥ 4.0 / 5.0 |

### 4.3 Technical SLIs/SLOs

| SLI | SLO | Measurement |
|---|---|---|
| Availability | 99.5% | Uptime monitoring |
| Latency P50 | < 1.5s | APM |
| Latency P95 | < 3.0s | APM |
| Error rate | < 0.5% | Log aggregation |
| DeepSeek API failure | < 1% | Circuit breaker fallback |

---

## 5. System Architecture

### 5.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                               │
│  Web (Next.js)  │  WhatsApp  │  Telegram  │  REST API           │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    API GATEWAY (Laravel 11)                     │
│  - Rate Limiting   - Auth (Sanctum)   - Request Validation     │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                  ORCHESTRATION LAYER                            │
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌─────────────────┐  │
│  │   Intent     │───▶│    Agent     │───▶│   Orchestrator  │  │
│  │  Classifier  │    │   Router     │    │  (DeepSeek +    │  │
│  └──────────────┘    └──────────────┘    │   RAG + Logging)│  │
│                                            └─────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    AGENT LAYER (6 Agents)                       │
│                                                                 │
│  ┌───────────┐ ┌──────────┐ ┌─────────┐ ┌──────────┐          │
│  │ Dictionary│ │ Grammar  │ │ Culture │ │ Proverb  │          │
│  └───────────┘ └──────────┘ └─────────┘ └──────────┘          │
│  ┌───────────┐ ┌──────────┐ ┌─────────────────────┐          │
│  │Literature │ │Translation│ │ GeneralAgent (fallback)│         │
│  └───────────┘ └──────────┘ └─────────────────────┘          │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    RETRIEVAL LAYER (RAG)                        │
│                                                                 │
│  ┌──────────────────┐    ┌──────────────────┐                  │
│  │ Keyword Search   │    │ Embedding Search │                  │
│  │ (MySQL LIKE)     │    │ (Qdrant/pgvector)│                  │
│  └──────────────────┘    └──────────────────┘                  │
│           │                       │                             │
│           └───────────┬───────────┘                             │
│                       ▼                                         │
│              ┌─────────────────┐                                │
│              │  Reranker       │                                │
│              │  (Cross-encoder)│                                │
│              └─────────────────┘                                │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      DATA LAYER                                 │
│                                                                 │
│  ┌──────────────────┐  ┌─────────────┐  ┌──────────────────┐  │
│  │ MySQL            │  │   Redis     │  │   Vector DB      │  │
│  │ bahasa_aceh      │  │   Cache     │  │   (Qdrant)       │  │
│  │ (20+ tables)     │  │   + Queue   │  │                  │  │
│  └──────────────────┘  └─────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    EXTERNAL SERVICES                            │
│  DeepSeek API  │  OpenAI Embeddings  │  Analytics  │  Monitoring│
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Design Principles

1. **Separation of Concerns** — Setiap layer punya tanggung jawab tunggal
2. **Fail-Safe by Default** — Fallback agent untuk setiap kegagalan
3. **Observable First** — Setiap interaksi ter-log dengan metadata lengkap
4. **Cost-Aware** — Context window dioptimalkan per agent
5. **Extensible** — Tambah agent baru tanpa ubah core
6. **Data Sovereignty** — Data linguistik tetap di kontrol komunitas Aceh

### 5.3 Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | Next.js 14 + TailwindCSS | SSR, SEO-friendly, DX unggul |
| API | Laravel 11 | Ekosistem matang, tim familiar |
| LLM | DeepSeek Chat API | Biaya 10× lebih murah dari GPT-4 |
| Embedding | OpenAI text-embedding-3-small | Akurasi tinggi, biaya rendah |
| Vector DB | Qdrant | Open-source, cepat, self-host |
| Primary DB | MySQL 8 (existing) | Sudah ada, stabil |
| Cache | Redis 7 | Standar industri |
| Queue | Laravel Horizon | Terintegrasi Laravel |
| Monitoring | Sentry + Grafana | Best-in-class |
| Deployment | Docker + Kubernetes | Skalabel |

---

## 6. Data Architecture

### 6.1 Data Inventory

| Domain | Tables | Rows (est.) | Update Freq |
|---|---|---|---|
| Kamus | aceh_arabic, aceh_china, kata_aceh, variasi_kata_aceh | ~15.000 | Bulanan |
| Fonologi | fonem_aceh, cara_baca_huruf_aceh | ~100 | Jarang |
| Morfologi | imbuhan, fungsi_imbuhan, contoh_imbuhan, morfofonemik, pemajemukan, perulangan_kata | ~1.500 | Bulanan |
| Sintaksis | pola_kalimat, contoh_kalimat, frasa, komponen_frasa | ~800 | Bulanan |
| Budaya | hadih_maja, kata_sapaan, ref_daerah, ref_strata, tanya_jawab | ~2.000 | Mingguan |
| Feedback | interaction_logs, training_feedback | Tumbuh cepat | Real-time |

### 6.2 Data Quality Standards

Semua data harus melewati:

1. **Validasi Schema** — migration + model validation
2. **Deduplikasi** — hash-based dedup sebelum ingestion
3. **Normalisasi Unicode** — NFC untuk Arab/Jawi
4. **Verifikasi Pakar** — untuk entry baru (workflow admin)
5. **Versioning** — setiap perubahan tercatat

### 6.3 Data Pipeline untuk RAG

```
┌──────────────┐    ┌───────────────┐    ┌──────────────┐
│  MySQL       │───▶│  Ingestion    │───▶│  Chunking    │
│  (source)    │    │  Worker       │    │  (semantic)  │
└──────────────┘    └───────────────┘    └──────┬───────┘
                                                 │
                    ┌────────────────────────────▼──────────┐
                    │  Enrichment                           │
                    │  - Metadata tagging                   │
                    │  - Category assignment                │
                    │  - Language detection                 │
                    └────────────┬──────────────────────────┘
                                 │
                    ┌────────────▼──────────────┐
                    │  Embedding Generation     │
                    │  (OpenAI text-embedding-3)│
                    └────────────┬──────────────┘
                                 │
                    ┌────────────▼──────────────┐
                    │  Vector DB (Qdrant)       │
                    │  + MySQL keyword index    │
                    └───────────────────────────┘
```

**Chunking Strategy:**

- Untuk kamus: 1 entry = 1 chunk (short)
- Untuk pola_kalimat: 1 pola + contoh = 1 chunk
- Untuk hadih_maja: 1 peribahasa + penjelasan = 1 chunk
- Untuk frasa: frasa + komponen = 1 chunk

**Metadata yang disimpan per chunk:**

```json
{
  "id": "hadih_maja_001",
  "source": "hadih_maja",
  "category": "proverb",
  "topic": "kehidupan",
  "language": "aceh",
  "text": "...",
  "metadata": { ... },
  "embedding_version": "v1",
  "updated_at": "2026-09-23T..."
}
```

---

## 7. Agent Architecture

### 7.1 Agent Taxonomy

Sistem terdiri dari 6 specialist agents + 1 fallback agent, masing-masing dengan intent eksklusif:

| Agent | Intent | Data Sources | Persona |
|---|---|---|---|
| DictionaryAgent | translation, dictionary, arti_kata | aceh_arabic, aceh_china, kata_aceh | Kamus presisi |
| GrammarAgent | grammar, imbuhan, pola_kalimat, fonem, morfologi | imbuhan, pola_kalimat, fonem_aceh, morfofonemik, dll | Guru teliti |
| CultureAgent | sapaan, etiquette, adat, tata_krama | kata_sapaan, ref_daerah, ref_strata | Ahli adat |
| ProverbAgent | hadih_maja, peribahasa, pepatah | hadih_maja | Penasihat bijak |
| LiteratureAgent | sastra, puisi, pantun, frasa | frasa, komponen_frasa, hadih_maja | Penyair |
| TranslationAgent | translate_multi, multi_lang | aceh_arabic, aceh_china, tanya_jawab | Penerjemah profesional |
| GeneralAgent (fallback) | aceh_general, default | Semua (sampling) | Asisten ramah |

### 7.2 Agent Interface Contract

```php
interface AgentInterface
{
    /**
     * Agent ini menangani intent apa saja (eksklusif).
     */
    public function supports(string $intent, array $entities): bool;

    /**
     * Extract entities dari user message (keyword, topic, dll).
     */
    public function extractEntities(string $message): array;

    /**
     * Retrieval dari RAG berdasarkan entities.
     */
    public function retrieve(array $entities, array $context): array;

    /**
     * Build prompt untuk LLM.
     */
    public function buildPrompt(array $articles, array $globalContext): string;

    /**
     * Temperature khusus per agent.
     */
    public function getTemperature(): float;

    /**
     * Post-process hasil LLM sebelum dikirim.
     */
    public function postProcess(string $rawResponse): string;
}
```

### 7.3 Routing Logic

```
User Input
    │
    ▼
┌─────────────────────┐
│  Check Mode         │
│  (umum / spesifik)  │
└──────┬──────────────┘
       │
   ┌───┴────┐
   │        │
   ▼        ▼
UMUM    SPESIFIK
   │        │
   │        └──▶ Ambil kategori pilihan user
   │             └──▶ AgentRegistry.resolve()
   │
   ▼
IntentClassifier.classify()
   │
   ├─ confidence ≥ 0.7 ──▶ Route ke specialist agent
   │
   └─ confidence < 0.7 ──▶ Route ke GeneralAgent
```

### 7.4 Agent Contract Details

**DictionaryAgent**

```yaml
intent: [translation, dictionary, arti_kata]
temperature: 0.2          # Presisi tinggi
max_tokens: 500
prompt_style: |
  Kamu adalah kamus bahasa Aceh yang akurat.
  - Berikan terjemahan langsung
  - Sebutkan padanan dalam bahasa Arab, China, Inggris jika ada
  - Sertakan cara baca (jika Jawi)
  - Berikan 1-2 contoh penggunaan
  - Jangan mengarang jika tidak ada di data
```

**GrammarAgent**

```yaml
intent: [grammar, imbuhan, pola_kalimat, fonem, morfologi]
temperature: 0.3
max_tokens: 800
prompt_style: |
  Kamu adalah guru tata bahasa Aceh.
  - Jelaskan aturan dengan struktur: Definisi → Aturan → Contoh → Pengecualian
  - Gunakan tabel jika membantu
  - Berikan minimal 3 contoh
  - Sebutkan sumber jika dari data
```

**CultureAgent**

```yaml
intent: [sapaan, etiquette, adat, tata_krama]
temperature: 0.4
max_tokens: 700
prompt_style: |
  Kamu adalah ahli adat & budaya Aceh.
  - Jelaskan konteks sosial penggunaan
  - Sebutkan strata sosial (jika ada)
  - Sebutkan daerah penggunaan
  - Berikan contoh percakapan nyata
  - Gunakan bahasa sopan dan hormat
```

**ProverbAgent**

```yaml
intent: [hadih_maja, peribahasa, pepatah]
temperature: 0.5          # Kreatif untuk interpretasi
max_tokens: 600
prompt_style: |
  Kamu adalah penasihat bijak Aceh.
  - Terjemahkan hadih maja secara literal
  - Jelaskan makna tersirat
  - Kaitkan dengan nilai kehidupan
  - Berikan analogi modern jika relevan
```

**LiteratureAgent**

```yaml
intent: [sastra, puisi, pantun, frasa]
temperature: 0.7          # Kreatif
max_tokens: 800
prompt_style: |
  Kamu adalah penyair Aceh.
  - Jelaskan frasa/ungkapan dalam konteks sastra
  - Boleh menciptakan pantun/syair baru jika diminta
  - Gunakan bahasa yang indah
  - Jaga keaslian estetika Aceh
```

**TranslationAgent**

```yaml
intent: [translate_multi, multi_lang]
temperature: 0.2
max_tokens: 700
prompt_style: |
  Kamu adalah penerjemah profesional 5 bahasa.
  - Terjemahkan ke bahasa target yang diminta
  - Sertakan transliterasi jika melibatkan Arab/Jawi
  - Jelaskan nuansa yang hilang dalam terjemahan
  - Format output: terjemahan utama + catatan
```

---

## 8. RAG Pipeline

### 8.1 Retrieval Flow

```
Query
  │
  ▼
┌──────────────────────┐
│ Query Processing     │
│ - Normalize          │
│ - Language detect    │
│ - Entity extract     │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Hybrid Retrieval     │
│                      │
│  ┌────────────────┐  │
│  │ Keyword Search │  │  (MySQL LIKE, scoped)
│  └────────────────┘  │
│  ┌────────────────┐  │
│  │ Vector Search  │  │  (Qdrant, cosine)
│  └────────────────┘  │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Merge & Deduplicate  │
│ (RRF — Reciprocal    │
│  Rank Fusion)        │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Reranker             │
│ (Cross-encoder)      │
│ Optional Fase 2      │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Top-K Selection      │
│ (dynamic K per agent)│
└──────────┬───────────┘
           │
           ▼
       Articles
```

### 8.2 Retrieval Parameters

| Agent | K Keyword | K Vector | Total K |
|---|---|---|---|
| Dictionary | 5 | 5 | 5 |
| Grammar | 3 | 3 | 4 |
| Culture | 5 | 5 | 5 |
| Proverb | 5 | 5 | 5 |
| Literature | 3 | 3 | 4 |
| Translation | 5 | 5 | 5 |
| General | 2×4 source | 2×4 source | 8 |

### 8.3 Query Enhancement

Untuk meningkatkan recall:

- **Synonym Expansion** — "terima kasih" → juga cari "teurimong gaseh"
- **Fuzzy Match** — typo tolerance untuk kata Aceh
- **Jawi Transliteration** — jika query Arab, juga cari Jawi
- **Topic Expansion** — "kehidupan" → juga "hidup", "nasib"

### 8.4 Embedding Strategy

- **Model:** text-embedding-3-small (1536 dim, $0.02/1M token)
- **Cache:** Embedding di-cache di Redis dengan TTL 30 hari
- **Batch:** Update embedding dalam batch malam (off-peak)
- **Versioning:** Setiap entry punya `embedding_version` untuk rollback

### 8.5 Context Assembly

Setiap artikel yang dikirim ke LLM punya format:

```
[Artikel 1 | Sumber: hadih_maja | Relevansi: 0.92]
Judul: "Adat bak po teumeureuhom"
Isi: ...
Metadata: topic=adat, daerah=aceh_besar

[Artikel 2 | Sumber: kata_sapaan | Relevansi: 0.87]
Judul: "Sapaan untuk ulama"
Isi: ...
Metadata: strata=ulama, daerah=banda_aceh
```

Context max: 3000 token (di bawah limit DeepSeek 64K).

---

## 9. LLM Integration (DeepSeek)

### 9.1 Model Selection

| Model | Use Case | Cost (per 1M token) | Latency |
|---|---|---|---|
| deepseek-chat | Default untuk semua agent | $0.14 (input) / $0.28 (output) | ~1.5s |
| deepseek-reasoner | Query kompleks (opsional) | $0.55 / $2.19 | ~8s |

Default: `deepseek-chat` untuk semua agent. `deepseek-reasoner` hanya untuk fallback jika confidence < 0.5.

### 9.2 Request Contract

```php
class DeepSeekClient
{
    public function chat(
        string $system,
        string $user,
        array $options = []
    ): DeepSeekResponse {
        $payload = [
            'model' => $options['model'] ?? 'deepseek-chat',
            'messages' => [
                ['role' => 'system', 'content' => $system],
                ['role' => 'user', 'content' => $user],
            ],
            'temperature' => $options['temperature'] ?? 0.3,
            'max_tokens' => $options['max_tokens'] ?? 800,
            'stream' => $options['stream'] ?? false,
            'response_format' => $options['response_format'] ?? null,
        ];

        // Retry logic dengan exponential backoff
        // Circuit breaker untuk API failure
        // Timeout 30s
    }
}
```

### 9.3 Prompt Composition

Setiap agent build prompt dari komponen berikut:

```
┌─────────────────────────────────────────────┐
│  1. IDENTITY & ROLE                         │
│     "Kamu adalah [persona]..."              │
├─────────────────────────────────────────────┤
│  2. CONTEXT (dari RAG)                      │
│     Artikel 1, 2, 3, ...                    │
├─────────────────────────────────────────────┤
│  3. INSTRUCTIONS                            │
│     Format, tone, constraint                │
├─────────────────────────────────────────────┤
│  4. GUARDRAILS                              │
│     "Jika tidak ada data, akui..."          │
├─────────────────────────────────────────────┤
│  5. OUTPUT FORMAT                           │
│     Markdown / JSON / plain                 │
└─────────────────────────────────────────────┘
```

### 9.4 Anti-Hallucination Strategy

1. **Grounding Prompt** — "Jawab HANYA berdasarkan artikel di atas"
2. **Citation** — Minta LLM sebutkan nomor artikel
3. **Confidence Check** — Jika artikel sedikit/relevansi rendah, minta LLM akui keterbatasan
4. **Fallback Response** — Template untuk kasus data tidak cukup

### 9.5 Cost Optimization

| Strategi | Penghematan |
|---|---|
| Multi-agent (context pendek) | 60-70% |
| Redis caching untuk query populer | 20-30% |
| Embedding caching | 90% |
| Prompt compression | 10-15% |
| Batch processing untuk non-urgent | 15% |

Estimasi biaya: $0.003 - $0.005 per query → 1 juta query = $3.000 - $5.000/bulan.

---

## 10. API Design

### 10.1 Endpoints

```
GET  /api/v1/categories          → List mode & kategori
POST /api/v1/chat                 → Main chat endpoint
POST /api/v1/feedback             → Submit feedback
GET  /api/v1/history              → Riwayat percakapan
GET  /api/v1/health               → Health check
```

### 10.2 Chat Endpoint Contract

**Request:**

```json
POST /api/v1/chat
{
  "message": "Apa arti meuseukat?",
  "mode": "spesifik",
  "category": "kamus",
  "session_id": "uuid-v4",
  "context": {
    "previous_messages": [...]
  }
}
```

**Response:**

```json
{
  "reply": "Meuseukat adalah...",
  "agent": "DictionaryAgent",
  "articles_used": 3,
  "log_id": 12345,
  "session_id": "uuid-v4",
  "metadata": {
    "tokens_used": 245,
    "response_time_ms": 1823,
    "mode": "spesifik",
    "category": "kamus"
  }
}
```

### 10.3 Error Handling

| HTTP | Scenario | Response |
|---|---|---|
| 400 | Invalid input | `{ error, field }` |
| 401 | Unauthorized | `{ error: "auth_required" }` |
| 429 | Rate limited | `{ error, retry_after }` |
| 503 | LLM unavailable | Fallback message + `{ degraded: true }` |
| 500 | Server error | Generic + `{ trace_id }` |

### 10.4 Rate Limiting

| Tier | Limit | Burst |
|---|---|---|
| Anonymous | 10/min | 20 |
| Registered | 30/min | 60 |
| Premium | 100/min | 200 |
| Internal | 1000/min | 2000 |

---

## 11. Frontend / UX Design

### 11.1 User Flow

```
Landing
  │
  ▼
┌──────────────────────┐
│  Mode Selection      │
│  [Umum] [Spesifik]   │
└──────────┬───────────┘
           │
      ┌────┴────┐
      │         │
      ▼         ▼
    UMUM     SPESIFIK
      │         │
      │         ▼
      │    ┌─────────────────┐
      │    │ Category Picker │
      │    └────────┬────────┘
      │             │
      └──────┬──────┘
             │
             ▼
     ┌───────────────┐
     │  Chat UI      │
     │  - Input      │
     │  - History    │
     │  - Feedback   │
     └───────────────┘
```

### 11.2 Design Principles

- **Progressive Disclosure** — Jangan overwhelm user baru
- **Visible Context** — Tampilkan mode & kategori yang aktif
- **Easy Mode Switch** — Bisa ganti kategori kapan saja
- **Feedback Prominent** — Thumbs up/down di setiap respons
- **Loading States** — Skeleton + typing indicator
- **Accessibility** — WCAG 2.1 AA compliant

### 11.3 Komponen Utama

- `<ModeSelector />` — Pemilihan umum/spesifik
- `<CategoryPicker />` — Grid kategori dengan icon & description
- `<ChatWindow />` — Area percakapan
- `<MessageBubble />` — Bubble dengan feedback
- `<ArticleSource />` — Collapsible sumber artikel
- `<FeedbackModal />` — Form feedback detail

---

## 12. Security & Privacy

### 12.1 Threat Model

| Threat | Mitigation |
|---|---|
| Prompt injection | Input sanitization + system prompt guard |
| PII leakage | Auto-detect & redact (email, phone, NIK) |
| API key exposure | Secrets management (Vault) |
| DoS | Rate limiting + Cloudflare |
| Data poisoning | Admin approval untuk training data |
| Model inversion | Tidak expose embedding vector ke user |

### 12.2 Data Privacy

- **User messages:** Retained 90 hari (default), dapat dihapus on-demand
- **Interaction logs:** Anonymous (session_id-based), user_id opsional
- **Training data:** Hanya dari feedback yang admin-approved
- **PII:** Auto-redacted sebelum disimpan
- **Compliance:** UU PDP (Indonesia) + GDPR-ready

### 12.3 Access Control

```
Roles:
  - guest: Read-only chat, no history
  - user: Chat + history + feedback
  - contributor: + submit corrections
  - admin: + approve feedback, manage data
  - super_admin: + system config
```

---

## 13. Observability & Analytics

### 13.1 Logging Strategy

**Structured Logging (JSON):**

```json
{
  "timestamp": "2026-09-23T10:30:00Z",
  "level": "info",
  "service": "chat-api",
  "trace_id": "abc-123",
  "span": "agent.retrieve",
  "agent": "DictionaryAgent",
  "duration_ms": 234,
  "articles_count": 3,
  "user_id": "u_123",
  "session_id": "s_456"
}
```

### 13.2 Metrics

**Technical:**

- Request rate, error rate, latency (P50/P95/P99)
- DeepSeek API usage & cost
- Cache hit ratio
- Vector DB query performance

**Product:**

- Mode distribution (umum vs spesifik)
- Category popularity
- Session depth
- Feedback rating per agent
- Retrieval precision (via user feedback)

**Business:**

- DAU/WAU/MAU
- Retention D1/D7/M1
- Cost per user per month
- LTV estimate

### 13.3 Dashboards

- **Operations Dashboard** — Health, latency, errors
- **Product Dashboard** — Usage, retention, engagement
- **AI Quality Dashboard** — Retrieval quality, hallucination rate, feedback trends
- **Cost Dashboard** — API cost breakdown per agent

### 13.4 Alerting

| Alert | Threshold | Action |
|---|---|---|
| API error rate | > 2% for 5 min | Page on-call |
| P95 latency | > 5s for 10 min | Page on-call |
| DeepSeek failure | > 5% for 5 min | Auto-switch fallback |
| Cost anomaly | > 150% daily avg | Notify finance |
| Feedback rating drop | < 3.5 for 1 hour | Notify product |

---

## 14. Cost Model

### 14.1 Infrastruktur Bulanan (estimasi, 100k MAU)

| Item | Spec | Cost/bulan |
|---|---|---|
| Compute (API) | 4 vCPU, 8GB × 2 | $80 |
| MySQL | Managed, 100GB | $60 |
| Redis | Managed, 4GB | $30 |
| Qdrant | Self-host, 2 vCPU | $30 |
| Object Storage | 500GB | $15 |
| CDN | Cloudflare Pro | $20 |
| Monitoring | Sentry + Grafana | $50 |
| **Total Infra** | | **~$285** |

### 14.2 LLM Cost (estimasi)

Asumsi: 100k MAU, 5 query/user/bulan, 500k query/bulan

| Komponen | Volume | Cost |
|---|---|---|
| DeepSeek input | 500k × 800 token | $56 |
| DeepSeek output | 500k × 400 token | $56 |
| OpenAI embedding | 500k × 200 token | $2 |
| **Total LLM** | | **~$114** |

### 14.3 Total Cost of Ownership

| Kategori | Bulanan | Tahunan |
|---|---|---|
| Infrastruktur | $285 | $3.420 |
| LLM API | $114 | $1.368 |
| Development (2 FTE) | $8.000 | $96.000 |
| Design (0.5 FTE) | $2.000 | $24.000 |
| QA (0.5 FTE) | $1.500 | $18.000 |
| **Total** | **~$11.899** | **~$142.788** |

**Cost per user per month:** $0.12 (infra + LLM only)

---

## 15. Deployment & Infrastructure

### 15.1 Environment Strategy

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   DEV       │  │   STAGING   │  │   PROD      │
│ (local)     │  │ (cloud)     │  │ (cloud)     │
├─────────────┤  ├─────────────┤  ├─────────────┤
│ - SQLite    │  │ - MySQL     │  │ - MySQL HA  │
│ - Qdrant    │  │ - Qdrant    │  │ - Qdrant    │
│   local     │  │ - DeepSeek  │  │ - DeepSeek  │
│ - DeepSeek  │  │   sandbox   │  │   production│
│   sandbox   │  │ - Sample    │  │ - Full data │
│ - Seed data │  │   data      │  │ - Backups   │
└─────────────┘  └─────────────┘  └─────────────┘
```

### 15.2 CI/CD Pipeline

```
Push → Lint → Test → Build → Deploy Staging → E2E Test → Manual Approval → Deploy Prod
```

- **CI:** GitHub Actions
- **CD:** ArgoCD (GitOps)
- **Zero-downtime:** Blue-green deployment
- **Rollback:** < 2 min via ArgoCD

### 15.3 Scaling Strategy

| Komponen | Horizontal | Vertical |
|---|---|---|
| API | ✅ Auto-scale 2-10 pods | 4 vCPU → 8 vCPU |
| Worker | ✅ Queue-based | - |
| MySQL | Read replicas | 8GB → 32GB |
| Redis | Cluster mode | 4GB → 16GB |
| Qdrant | Sharding | - |

### 15.4 Disaster Recovery

- **RTO:** 1 jam
- **RPO:** 15 menit
- **Backup:** Daily full + hourly incremental
- **Retention:** 30 hari
- **Multi-region:** Fase 2

---

## 16. Testing Strategy

### 16.1 Test Pyramid

```
        ┌─────────────┐
        │   Manual    │  5%   — Expert review
        │   QA        │
        ├─────────────┤
        │   E2E       │  15%  — Cypress
        │             │
        ├─────────────┤
        │ Integration │  30%  — Agent + RAG
        │             │
        ├─────────────┤
        │    Unit     │  50%  — PHPUnit
        └─────────────┘
```

### 16.2 AI-Specific Testing

- **Retrieval Quality** — Test set 200 query dengan ground truth
- **Answer Relevance** — LLM-judge (GPT-4 as judge)
- **Hallucination Rate** — Fact-check via second LLM
- **Guardrails** — Adversarial prompts untuk prompt injection
- **Multilingual** — Test di 5 bahasa
- **Regression** — Golden set yang harus selalu lulus

### 16.3 Quality Gates

| Gate | Threshold | Blocker |
|---|---|---|
| Unit test coverage | ≥ 80% | Yes |
| Retrieval precision@5 | ≥ 0.90 | Yes |
| Answer relevance | ≥ 4.0 | Yes |
| Hallucination rate | ≤ 2% | Yes |
| P95 latency | ≤ 3s | Yes |
| Accessibility score | ≥ 95 | No |

---

## 17. Roadmap & Milestones

### Fase 0: Foundation (Minggu 1-2)

- [ ] Setup environment & CI/CD
- [ ] Refactor existing code (fix bugs)
- [ ] Implement core interfaces
- [ ] Setup monitoring

### Fase 1: MVP (Minggu 3-8)

- [ ] IntentClassifier + AgentRouter
- [ ] 6 specialist agents
- [ ] ChatOrchestrator + DeepSeek integration
- [ ] Basic UI (mode selector + chat)
- [ ] Logging + feedback

**Milestone:** 100 internal testers

### Fase 2: Quality (Minggu 9-14)

- [ ] Embedding-based retrieval (Qdrant)
- [ ] Reranker
- [ ] Feedback → training pipeline
- [ ] Advanced UI (sources, examples)
- [ ] Analytics dashboard

**Milestone:** 1.000 beta users, rating ≥ 4.0

### Fase 3: Scale (Minggu 15-24)

- [ ] Multi-language support polish
- [ ] Voice input (opsional)
- [ ] Mobile-responsive improvement
- [ ] Public launch
- [ ] Partnership dengan universitas

**Milestone:** 10.000 MAU

### Fase 4: Platform (Bulan 7-12)

- [ ] Public API
- [ ] Fine-tuned model
- [ ] Mobile app
- [ ] Marketplace kontribusi data

**Milestone:** 100.000 MAU

---

## 18. Risks & Mitigations

| # | Risk | Probability | Impact | Mitigation |
|---|---|---|---|---|
| 1 | DeepSeek API down | Medium | High | Circuit breaker + fallback ke GeneralAgent template |
| 2 | Data linguistik kurang | High | High | Partnership dengan universitas + crowdsourcing |
| 3 | Hallucination tinggi | Medium | High | Grounding prompt + admin review + user feedback |
| 4 | Cost overrun | Low | Medium | Cost alerts + caching + prompt optimization |
| 5 | User adoption rendah | Medium | High | Community engagement + free for education |
| 6 | Kompetitor besar masuk | Low | High | Fokus pada nuansa lokal + partnership |
| 7 | Regulasi data | Low | Medium | Compliance by design |
| 8 | Expert review bottleneck | High | Medium | Community moderation + tiered review |
| 9 | Model drift | Medium | Medium | Continuous evaluation + periodic retraining |
| 10 | Scope creep | High | Medium | Strict phase gating + MoSCoW |

---

## 19. Team & Organization

### 19.1 Fase 1 Team (Minimum Viable Team)

| Role | FTE | Responsibility |
|---|---|---|
| Tech Lead / CTO | 0.5 | Architecture, code review |
| Backend Engineer | 1.0 | API, agents, RAG |
| AI/ML Engineer | 0.5 | Retrieval, prompt engineering |
| Frontend Engineer | 0.5 | UI/UX |
| Designer | 0.5 | UX, visual |
| Linguist Advisor | 0.2 | Data validation |
| Product Manager | 0.5 | Priorities, roadmap |

**Total:** ~3.7 FTE

### 19.2 Fase 2 Expansion

Tambah:

- Data Engineer (0.5 FTE)
- QA Engineer (0.5 FTE)
- Community Manager (0.5 FTE)

---

## 20. Appendix

### 20.1 Glossary

| Term | Definition |
|---|---|
| RAG | Retrieval-Augmented Generation |
| Agent | Komponen AI yang menangani domain spesifik |
| Intent | Maksud/tujuan user query |
| Retrieval | Proses mengambil data relevan |
| Reranker | Model yang menyusun ulang hasil retrieval |
| Hadih Maja | Peribahasa Aceh |
| Jawi | Aksara Arab yang diadaptasi untuk Melayu/Aceh |

### 20.2 References

1. Lewis et al. (2020). *Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks*
2. DeepSeek API Documentation
3. UNESCO Atlas of the World's Languages in Danger
4. Laravel 11 Documentation
5. Qdrant Documentation

### 20.3 Change Log

| Version | Date | Changes | Author |
|---|---|---|---|
| 1.0 | 2026-09-23 | Initial draft | Engineering Team |

---

## Sign-off

| Role | Name | Signature | Date |
|---|---|---|---|
| CTO | | | |
| Head of Product | | | |
| Lead Engineer | | | |
| Linguist Advisor | | | |

---

*End of Document*

> Dokumen ini adalah *living document*. Setiap perubahan harus melalui review dan versioning. Untuk pertanyaan atau klarifikasi, hubungi tim engineering.

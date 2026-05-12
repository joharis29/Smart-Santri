# Arsitektur Sistem Smart Santri 🏗️

Dokumen ini memberikan gambaran tingkat tinggi (*high-level overview*) mengenai arsitektur teknologi yang digunakan dalam proyek **Smart Santri**. Sistem ini dirancang sebagai **Sistem Informasi Akuntansi (SIA) Pengeluaran Kas terintegrasi Kecerdasan Buatan (AI)** yang menjamin skalabilitas, integritas data keuangan, serta kepatuhan otomatis terhadap regulasi eksternal dan internal.

## 1. Frontend & Presentation Layer: Next.js + TypeScript 🖥️

Lapisan antarmuka pengguna dibangun menggunakan kerangka kerja *full-stack* **Next.js** dengan paradigma modern untuk menjamin kecepatan dan tipe data yang aman.
- **App Router & Server Components**: Memanfaatkan direktori `src/app` dengan *React Server Components* (RSC) dan *Server Actions*. Arsitektur ini memungkinkan validasi transaksi dilakukan di sisi peladen (SSR), yang secara signifikan mengoptimalkan performa *Core Web Vitals* dan keamanan logika bisnis.
- **TypeScript & Zod**: Seluruh aliran data dijamin oleh **TypeScript** untuk deteksi *error* sejak fase pengembangan. **Zod** digunakan sebagai lapisan validasi skema untuk memastikan setiap input nominal dan narasi pengajuan dana memenuhi kriteria sebelum menyentuh basis data.
- **Styling Modular**: Menggunakan **Tailwind CSS** untuk antarmuka yang responsif dan konsisten. Penggunaan *utility classes* memastikan beban jaringan tetap ringan namun memiliki fleksibilitas desain yang tinggi.

## 2. AI & Compliance Engine: Multi-Source RAG Pipeline 🧠

Inovasi utama sistem ini adalah fitur *Smart Compliance Audit* yang mengimplementasikan arsitektur *Retrieval-Augmented Generation* (RAG) sebagai instrumen pendukung keputusan (*decision support*).
- **Orkestrasi LangChain.js**: Menghubungkan aplikasi dengan **OpenAI LLM** untuk memproses validasi lintas regulasi (*cross-regulation validation*).
- **Four-Pillar Vector Store**: Sistem melakukan *similarity search* terhadap empat sumber pengetahuan utama yang telah di-*embedding*:
  1. **ISAK 335**: Standar pelaporan entitas nirlaba.
  2. **Pedoman Akuntansi Pesantren (PAP)**: Standar akuntansi khusus pesantren.
  3. **Juknis BOS**: Regulasi penggunaan dana pemerintah.
  4. **SOP Pesantren X**: Prosedur birokrasi dan kebijakan internal.
- **Mitigasi Halusinasi**: Dengan menginjeksi dokumen regulasi di atas langsung ke dalam jendela konteks LLM, sistem memberikan temuan audit yang disertai kutipan pasal/pedoman faktual.

## 3. Backend & Database Layer: Supabase (PostgreSQL) 🗄️

Sistem menggunakan **Supabase** sebagai layanan *Backend-as-a-Service* (BaaS) untuk mengelola data finansial yang sensitif.
- **PostgreSQL Database**: Menjamin integritas referensial antar tabel (Pengguna, Pengajuan, Realisasi, Anggaran).
- **Security & Otorisasi (RLS)**: Menerapkan kebijakan *Row-Level Security* (RLS) untuk menegakkan *Role-Based Access Control* (RBAC). Ini memastikan Bendahara, Pimpinan, dan Pengurus hanya berinteraksi dengan data sesuai batas otoritas mereka di tingkat basis data.
- **Data Protection**: Seluruh data terlindungi oleh enkripsi **AES-256** pada *Data-at-Rest* dan komunikasi API yang diamankan oleh token JWT.

## 4. Deployment, Infrastruktur & Kualitas Kode 🚀

Aplikasi didistribusikan melalui infrastruktur *cloud* yang mendukung siklus pengembangan berkelanjutan.
- **Vercel Hosting**: Di-*deploy* menggunakan **Vercel** untuk pemanfaatan *Edge Network* dan *caching* otomatis, menjaga sistem tetap responsif saat diakses secara simultan.
- **Keamanan Repositori**: Manajemen rahasia (*Secret Management*) diterapkan untuk melindungi `OPENAI_API_KEY` dan kredensial Supabase. Penggunaan file `.gitignore` dilakukan secara disiplin untuk mencegah kebocoran kredensial.
- **CI/CD & SonarCloud**: Integrasi GitHub dengan **SonarCloud** untuk analisis statis kode secara otomatis. Hal ini dilakukan untuk mendeteksi *bugs*, kerentanan keamanan (*security hotspots*), dan menjaga keandalan (*reliability*) sistem secara proaktif.

---

### Diagram Alur Arsitektur (Topologi Sistem)

```mermaid
graph TD
    User([Pengguna: Bendahara / Pimpinan / Pengurus])
    
    subgraph Infrastruktur Vercel (Frontend & Logika)
        NextJS[Next.js App Router & Server Actions]
        LangChain[LangChain.js RAG Pipeline]
    end
    
    subgraph Layanan Eksternal (AI)
        OpenAI[OpenAI LLM API]
    end
    
    subgraph Ekosistem Supabase (Data & Keamanan)
        Auth[Supabase Auth & RLS]
        Postgres[(PostgreSQL: Data Keuangan)]
        VectorDb[(Vector Store: ISAK 335, PAP, BOS, SOP)]
    end
    
    User <-->|Input Transaksi & Akses UI| NextJS
    NextJS <-->|Validasi Sesi & RBAC| Auth
    NextJS <-->|CRUD Data Finansial| Postgres
    NextJS -->|Kirim Narasi Transaksi| LangChain
    LangChain <-->|Similarity Search| VectorDb
    LangChain <-->|Kirim Konteks & Prompt| OpenAI
    OpenAI -->|Hasil Validasi & Kutipan Pasal| LangChain
    LangChain -->|Tampilkan Peringatan Audit| NextJS
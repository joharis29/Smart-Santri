# Arsitektur Sistem Smart Santri 🏗️

Dokumen ini memberikan gambaran tingkat tinggi (*high-level overview*) mengenai arsitektur teknologi yang digunakan dalam proyek **Smart Santri**. Sistem ini dirancang bukan sekadar sebagai aplikasi pencatatan, melainkan sebagai **Sistem Informasi Akuntansi (SIA) Pengeluaran Kas terintegrasi Kecerdasan Buatan (AI)**. Arsitektur ini menjamin skalabilitas, integritas data keuangan, serta kepatuhan syariah dan regulasi secara otomatis.

## 1. Frontend & Presentation Layer: Next.js + TypeScript 🖥️

Lapisan antarmuka pengguna dibangun menggunakan kerangka kerja *full-stack* **Next.js** dengan dukungan tipe statis yang ketat.
- **App Router & Server Components**: Memanfaatkan direktori `src/app` dengan *React Server Components* (RSC) dan *Server Actions* untuk memindahkan beban komputasi logika (seperti validasi transaksi) ke sisi peladen (SSR). Hal ini mengoptimalkan metrik *Core Web Vitals* (seperti LCP dan TBT).
- **TypeScript & Zod**: Menggunakan **TypeScript** sebagai superset JavaScript untuk mendeteksi *runtime errors* sejak dini, dipadukan dengan **Zod** untuk memvalidasi integritas struktur data yang diinput oleh pengguna.
- **Styling Modular**: Menggunakan **Tailwind CSS** untuk menyusun antarmuka (*UI*) yang responsif, dinamis, dan konsisten tanpa membebani performa jaringan dengan ukuran *file* CSS yang besar.

## 2. AI & Compliance Engine: RAG Pipeline (LangChain + OpenAI) 🧠

Inovasi utama sistem ini terletak pada fitur *Smart Compliance Audit* yang mengimplementasikan arsitektur *Retrieval-Augmented Generation* (RAG) sebagai instrumen pendukung keputusan (*decision support*).
- **Orkestrasi AI**: Menggunakan **LangChain.js** untuk menjembatani aplikasi dengan *Large Language Model* (LLM) dari **OpenAI**.
- **Vector Store & Similarity Search**: Dokumen regulasi pesantren, pedoman **Juknis BOS**, dan standar **ISAK 335** dipecah (*chunking*), diubah menjadi vektor (*embeddings*), dan disimpan dalam basis data vektor. Saat pengajuan dana dibuat, sistem melakukan *similarity search* untuk menarik konteks hukum yang paling relevan.
- **Mitigasi Halusinasi**: Dengan menginjeksi dokumen regulasi langsung ke dalam *prompt* LLM, peringatan/temuan audit yang dihasilkan sistem terjamin landasan faktualnya dan bebas dari risiko ilusi model.

## 3. Backend & Database Layer: Supabase 🗄️

Sistem menggunakan platform *Backend-as-a-Service* (BaaS) **Supabase** untuk mengamankan data sensitif keuangan.
- **PostgreSQL Database**: Menyimpan seluruh entitas data (pengguna, transaksi, anggaran) secara relasional dan terstruktur, menjamin integritas referensial antar tabel.
- **Autentikasi & Keamanan (RLS)**: Menangani sistem login berbasis peran (*Role-Based Access Control* / RBAC) untuk Bendahara, Pimpinan, dan Pengurus. Kebijakan *Row-Level Security* (RLS) memastikan pengguna hanya dapat mengakses data transaksi yang menjadi otoritas mereka.
- **Enkripsi**: Data yang tersimpan dilindungi oleh enkripsi standar industri (AES-256) untuk mencegah kebocoran informasi finansial.

## 4. Deployment, Infrastruktur & Kualitas Kode 🚀

Aplikasi didistribusikan melalui infrastruktur modern untuk memastikan keandalan *deployment* dan keamanan kode sumber.
- **Vercel Hosting**: Di-*deploy* menggunakan **Vercel** untuk memanfaatkan *Edge Network* global dan *caching* otomatis, memastikan sistem tetap stabil saat diakses serentak oleh banyak pengurus.
- **Keamanan Repositori**: Menggunakan file `.gitignore` secara disiplin dan *Secret Management* untuk memastikan `OPENAI_API_KEY` dan kredensial basis data tidak terekspos ke publik.
- **CI/CD & SonarCloud**: Terintegrasi langsung dengan GitHub. Setiap pembaruan kode idealnya dipindai menggunakan *Static Analysis Tool* (seperti SonarCloud) untuk mendeteksi *bugs*, kerentanan keamanan (*security hotspots*), dan *code smells* secara proaktif.

---

### Diagram Alur Arsitektur (Topologi Sistem)

```mermaid
graph TD
    User([Pengguna: Bendahara / Pimpinan])
    
    subgraph Infrastruktur Vercel (Frontend & Logika)
        NextJS[Next.js App Router & Server Actions]
        LangChain[LangChain.js RAG Pipeline]
    end
    
    subgraph Layanan Eksternal (Kecerdasan Buatan)
        OpenAI[OpenAI LLM API]
    end
    
    subgraph Ekosistem Supabase (Data & Keamanan)
        Auth[Supabase Auth & RLS]
        Postgres[(PostgreSQL Relasional)]
        VectorDb[(Vector Store: ISAK 335 & Regulasi)]
    end
    
    User <-->|Input Transaksi & Akses UI| NextJS
    NextJS <-->|Validasi Token & RBAC| Auth
    NextJS <-->|CRUD Pengajuan & Laporan| Postgres
    NextJS -->|Pemicu Validasi Kepatuhan| LangChain
    LangChain <-->|Similarity Search| VectorDb
    LangChain <-->|Kirim Konteks Hukum & Prompt| OpenAI
    OpenAI -->|Hasil Analisis / Peringatan Dini| LangChain
    LangChain -->|Tampilkan Temuan Audit| NextJS
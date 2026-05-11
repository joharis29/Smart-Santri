# Smart Santri 🎓
**Sistem Informasi Akuntansi Pengeluaran Kas Pesantren Terintegrasi AI**

Smart Santri adalah Sistem Informasi Akuntansi (SIA) cerdas berbasis web yang dirancang khusus untuk mengelola siklus pengeluaran kas di lingkungan pesantren. Dikembangkan sebagai proyek penelitian skripsi dengan pendekatan *Design Science Research* (DSR), sistem ini tidak hanya mencatat transaksi keuangan, tetapi juga bertindak sebagai instrumen pengendalian internal preventif (*Smart Compliance Audit*). 

Sistem ini didukung oleh kecerdasan buatan guna memastikan setiap pengeluaran mematuhi prinsip syariah, pedoman Juknis BOS, serta standar akuntansi ISAK 335 (pemisahan Aset Neto dengan dan tanpa pembatasan).

## 🚀 Teknologi Utama

Proyek ini dibangun menggunakan arsitektur *full-stack* modern yang skalabel dan aman:

- **[Next.js](https://nextjs.org/) & [Vercel](https://vercel.com/)**: Kerangka kerja utama pendukung arsitektur *Single Page Application* (SPA) dengan *Server-Side Rendering* (SSR) yang optimal dan di-*deploy* melalui Vercel untuk stabilitas *core web vitals*.
- **[TypeScript](https://www.typescriptlang.org/)**: Memberikan sistem pengetikan statis yang ketat untuk menekan *runtime errors* dan memastikan integritas data.
- **[Tailwind CSS](https://tailwindcss.com/)**: *Framework* CSS *utility-first* untuk merancang antarmuka pengguna yang responsif, modern, dan modular.
- **[Supabase](https://supabase.com/) (PostgreSQL)**: Platform *Backend-as-a-Service* (BaaS) yang menyediakan basis data relasional, autentikasi terpusat, dan lapisan keamanan *Row-Level Security* (RLS) serta perlindungan enkripsi AES-256.
- **[LangChain.js](https://js.langchain.com/) & OpenAI**: Orkestrator *Retrieval-Augmented Generation* (RAG) *pipeline* yang menelusuri *vector store* untuk memvalidasi kepatuhan transaksi terhadap dokumen regulasi.

## ✨ Fitur Utama

- **Smart Compliance Audit (Validasi AI)**: Fitur pengecekan anomali pengajuan dana secara otomatis. Sistem akan membandingkan narasi transaksi pengeluaran dengan aturan Juknis BOS dan ISAK 335, lalu memberikan peringatan dini (*early warning*) yang dilandasi kutipan pasal regulasi secara akurat tanpa risiko halusinasi.
- **Manajemen Siklus Pengeluaran Kas**: Digitalisasi alur pengajuan, verifikasi, hingga realisasi pencairan dana untuk meminimalisir risiko kesalahan manual dan mencegah percampuran dana.
- **Keamanan Data & Otorisasi Berlapis**: Akses sistem berbasis peran (Role-Based Access Control) yang ketat antara Pengurus, Bendahara, dan Pimpinan Pesantren, dijamin oleh Supabase RLS.
- **Pemisahan Aset Sesuai ISAK 335**: Sistem pencatatan yang secara otomatis mendisiplinkan pemisahan antara dana dengan pembatasan (*restricted*) dan tanpa pembatasan (*unrestricted*).

## 🛠️ Cara Instalasi Lokal

Ikuti langkah-langkah di bawah ini untuk menjalankan proyek Smart Santri di lingkungan lokal (*development*) Anda.

### Prasyarat
Pastikan Anda telah menginstal [Node.js](https://nodejs.org/) (versi 18.x atau lebih baru disarankan) di komputer Anda.

### 1. Instalasi Dependensi

Buka terminal Anda, arahkan ke direktori proyek `smart_santri`, dan jalankan perintah berikut untuk menginstal semua paket dan dependensi yang dibutuhkan:

```bash
npm install
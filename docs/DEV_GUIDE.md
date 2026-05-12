# Panduan Pengembang (Developer Guide) - Smart Santri 💻

Dokumen ini berisi panduan, standar teknis, dan alur kerja (*workflow*) yang wajib diikuti selama pengembangan **Sistem Informasi Akuntansi (SIA) Smart Santri**. Fokus utama panduan ini adalah menjaga integritas data keuangan, keamanan kredensial, dan kualitas kode yang memenuhi standar industri.

---

## 1. Standar Penulisan Kode (*Coding Standards*) 📝

Proyek ini dibangun menggunakan *stack* teknologi: **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, dan **Supabase**.

### A. Next.js, TypeScript & Validasi Data
- **Type Safety**: Dilarang menggunakan tipe `any`. Gunakan antarmuka (*interface*) atau tipe (*type*) TypeScript secara eksplisit untuk semua data transaksi, terutama pada *Props* dan *State* komponen.
- **Server Actions**: Gunakan *Server Actions* untuk semua mutasi data ke Supabase guna memastikan logika bisnis dan validasi keamanan tetap berada di sisi peladen.
- **Validasi Skema (Zod)**: Setiap input formulir pengajuan dana wajib divalidasi menggunakan pustaka **Zod** sebelum diproses lebih lanjut untuk menjamin integritas data keuangan.
- **Client vs Server Components**:
  - Gunakan *Server Components* secara default untuk pengambilan data (*fetching*) guna mengoptimalkan performa.
  - Gunakan `'use client';` hanya jika komponen memerlukan interaktivitas atau *hooks* sisi klien.

### B. Tailwind CSS & UI Modular
- **Utility-First**: Gunakan kelas utilitas Tailwind secara langsung pada elemen JSX. Hindari penulisan CSS kustom kecuali untuk animasi kompleks.
- **Konsistensi Desain**: Selalu merujuk pada konfigurasi `tailwind.config.ts` untuk penggunaan skema warna dan tipografi agar antarmuka tetap profesional dan konsisten.

### C. Supabase & AI Logic (LangChain)
- **Database Access**: Lakukan operasi basis data melalui *Supabase Client SDK* dengan memanfaatkan kebijakan *Row-Level Security* (RLS).
- **RAG Pipeline**: Logika pengolahan dokumen kepatuhan (ISAK 335, PAP, Juknis BOS, dan SOP Pesantren) di dalam LangChain.js harus dipisahkan dari komponen UI. Pastikan *prompt engineering* divalidasi untuk menghindari hasil yang bias atau tidak akurat.

---

## 2. Keamanan & Kualitas Kode 🛡️

Mengingat sistem ini mengelola dana pesantren, standar keamanan adalah prioritas utama.

### A. Manajemen Rahasia (Secrets)
- **.env Protection**: File `.env.local` yang berisi `SUPABASE_SERVICE_ROLE_KEY` dan `OPENAI_API_KEY` wajib masuk ke dalam `.gitignore`.
- **No Hardcoding**: Dilarang keras menanamkan kunci API atau kredensial apa pun secara langsung di dalam kode sumber (*hardcoded*).

### B. Peninjauan Kualitas (SonarCloud)
- Gunakan instrumen **SonarCloud** untuk menganalisis kode secara statis. Pastikan tidak ada *Security Hotspots*, *Bugs* fatal, maupun *Code Smells* yang menumpuk sebelum melakukan penggabungan kode (*merge*).

---

## 3. Alur Kerja Git & Konvensi Commit 🔄

Gunakan standar **Conventional Commits** agar riwayat pengembangan mudah dilacak dan diaudit.

### Format Pesan Commit
```text
<tipe>(<scope opsional>): <pesan deskriptif huruf kecil>
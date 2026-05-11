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
- **RAG Pipeline**: Logika pengolahan dokumen (Juknis BOS/ISAK 335) di dalam LangChain.js harus dipisahkan dari komponen UI. Pastikan *prompt engineering* divalidasi untuk menghindari hasil yang bias atau tidak akurat.

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

## 5. Strategi Isolasi Pengembangan & Git Flow 🚦

Untuk mencegah terjadinya konflik kode dan memastikan sistem operasional pesantren tidak terganggu selama masa pengembangan fitur baru, seluruh pengembang **wajib** mematuhi aturan isolasi berikut:

### A. Aturan Percabangan (Branching Strategy)
Kita menerapkan model **Feature Branch Workflow**. Dilarang keras melakukan *commit* dan *push* secara langsung ke *branch* utama.

- **`main`**: Adalah *branch* suci (*sacred branch*). Kode di sini merepresentasikan kondisi aplikasi yang sedang dipakai oleh pesantren (Produksi/Live). Dilarang menulis kode langsung di sini.
- **`staging` / `develop`**: *Branch* untuk menggabungkan seluruh fitur baru. Berfungsi sebagai lingkungan pengujian integrasi (*testing environment*) sebelum dirilis ke `main`.
- **`feat/[nama-fitur]`**: *Branch* yang dibuat oleh pengembang saat membuat fitur baru. Berasal (di-*branch*) dari `staging`. *(Contoh: `feat/laporan-bos`)*.
- **`fix/[nama-bug]`**: *Branch* khusus untuk memperbaiki kerusakan atau anomali. *(Contoh: `fix/kalkulasi-saldo`)*.

### B. Isolasi Lingkungan (Environment Separation)
Kode yang sedang dikerjakan tidak boleh menyentuh basis data asli milik pesantren.
1. **Local Development**: Pengembang wajib menjalankan basis data Supabase secara lokal (menggunakan Supabase CLI atau proyek Supabase gratis terpisah) untuk pengujian awal.
2. **Vercel Preview Deployments**: Setiap kali kode di-*push* ke *branch* `feat/*`, Vercel secara otomatis akan membuatkan URL Preview (situs kloningan sementara). Gunakan URL ini untuk menguji apakah fitur baru berjalan lancar tanpa mengganggu situs `main`.

### C. Aturan Penggabungan Kode (Pull Requests / Merge)
Kode dari *branch* fitur (`feat/*`) hanya boleh digabungkan ke `staging` atau `main` melalui mekanisme **Pull Request (PR)** di GitHub/GitLab.

Sebelum PR dapat disetujui (*Approve*) dan digabungkan (*Merge*), harus memenuhi syarat berikut:
1. **Lulus TypeScript Check**: Tidak ada *error* tipe data (jalankan `npx tsc --noEmit` di lokal).
2. **Lulus Linting**: Tidak ada pelanggaran format penulisan (jalankan `npm run lint`).
3. **Lulus Code Review**: Minimal 1 pengembang lain (atau pembimbing) telah meninjau dan menyetujui kode tersebut.
4. **Lolos SonarCloud (CI/CD)**: Analisis statis tidak menemukan *Security Hotspot* atau *Bug* tingkat parah.

### D. Penggunaan Git Hooks (Husky)
Untuk mencegah kode rusak terlanjur masuk ke repositori, proyek ini dikonfigurasi menggunakan **Husky**. Setiap kali Anda mengetik `git commit`, sistem secara otomatis akan menjalankan proses *linting* (Prettier/ESLint). Jika kode berantakan atau ada *error* sintaks, proses *commit* akan digagalkan secara otomatis hingga Anda memperbaikinya.
# Product Backlog & To-Do List Pengembangan Smart Santri 📋

Dokumen ini berisi daftar tugas (*To-Do List*) dan *Product Backlog* yang disusun berdasarkan kebutuhan pengguna (*User Stories*) dan spesifikasi arsitektur sistem. Daftar ini akan menjadi panduan tahapan pengembangan (*Sprint*) menuju peluncuran aplikasi.

---

## 🏃‍♂️ Fase 1: Fondasi Arsitektur & Keamanan (Selesai/On-Going)
Fokus pada penyiapan infrastruktur dasar, autentikasi, dan skema basis data yang aman.

- [x] Inisialisasi Proyek (Next.js, TypeScript, Tailwind CSS v4)
- [x] Setup *Routing* & UI Dasar:
  - [x] Landing Page (Homepage)
  - [x] Halaman Login
  - [x] Halaman Register (Khusus untuk keperluan Demo)
  - [x] Dashboard Inti
  - [x] Halaman Manajemen User
  - [x] Halaman Manajemen Role Information
- [x] Setup Supabase Project (Database, Auth, Storage)
- [x] Pembuatan Skema Tabel Relasional (Users, Roles, Jenjang, Unit, Pengajuan, dsb)
- [x] Implementasi Autentikasi & perlindungan *Route* via *Middleware*
- [x] Konfigurasi *Row-Level Security* (RLS) untuk perlindungan data RBAC

## 🏗️ Fase 2: Sistem Informasi Akuntansi (SIA) Inti (Prioritas Tinggi)
Fokus pada alur CRUD (Create, Read, Update, Delete) utama untuk siklus pengeluaran kas.

- [x] **Modul Pengajuan RKA (Rencana Kegiatan Anggaran)**
  - [x] Antarmuka Spreadsheet-Style High-Density (Ultra Compact).
  - [x] Form input RKA untuk Bendahara Unit / Staf dengan validasi cerdas.
  - [x] **Smart Rincian Detail Grid**: Tabel multi-kolom (Nama Item, Satuan, Qty, Harga Satuan, Total Otomatis).
  - [x] **Smart Funding Split**: Kalkulasi pembagian sumber dana otomatis via persentase (%) dan nominal (Rp).
  - [x] Akumulasi otomatis rincian kegiatan ke total Rencana Anggaran utama.
  - [x] Pencegahan input untuk periode (Bulan & Tahun Ajaran) yang sudah lampau.
  - [/] Fitur *Import* data RKA via Excel/CSV (Kerangka UI Selesai).
- [x] **Modul Otorisasi Berjenjang**
  - [x] Fitur persetujuan tingkat 1: Kepala Unit / Jenjang (Review & Penolakan Bercatatan).
  - [x] Fitur otorisasi tingkat 2: Bendahara Pusat (Edit Penuh, Setujui, Tolak dengan catatan).
  - [x] Fitur penolakan draft oleh Bendahara Unit (Mode Checker di Rekap Draft).
- [x] **Modul Pencairan & Integrasi Saldo**
  - [x] Fitur pencairan dana oleh Bendahara Pusat (Status CAIR).
  - [x] Sistem otomatis saldo unit bertambah saat status menjadi "SUDAH DITERIMA".
  - [x] Dasbor pemisahan saldo otomatis berdasarkan dompet dana (BOS, Yayasan, Zakat, dll).
  - [x] Penyelarasan branding: "Dana Dengan Pembatasan" (Restricted) & "Dana Tanpa Pembatasan" (Unrestricted) dengan skema warna Amber/Emerald.
- [x] **Modul Pelaporan Realisasi (LPJ)**
  - [x] Form laporan realisasi belanja dengan narasi detail (Ultra Compact UI).
  - [x] Fitur *Multi-Upload* foto kuitansi/nota (Dioptimalkan untuk *Mobile*).
  - [x] Integrasi Kamera Langsung untuk pengambilan nota secara *real-time*.
  - [x] **Subsidi Silang Reaktif**: Penggunaan lebih dari satu sumber dana dengan kalkulasi otomatis via % dan Nominal Rp.
  - [x] **Restricted Fund Protection**: Validasi otomatis agar dana terbatas hanya bisa ditutup oleh sumber dana tertentu.
  - [x] **Alur Akuntabilitas LPJ**: Draft -> Bendahara Unit -> Kepala Unit -> Bendahara Pusat.
  - [x] **Universal Tab & Filter System**: Pemisahan RKA/LPJ di Draft Saya, Rekap Draft, dan Aktivitas Dasbor.
  - [x] Modul input harian (*reimbursement*) khusus Dapur Asrama.
  - [x] **Sistem Draft Pribadi (Personal Workspace)**: Halaman khusus "Draft Saya" untuk isolasi data staf sebelum diajukan ke Bendahara.

## 🧠 Fase 3: Integrasi Kecerdasan Buatan (Smart Compliance Audit)
Fokus pada pengembangan mesin *Retrieval-Augmented Generation* (RAG) untuk validasi kepatuhan.

- [ ] Persiapan *Vector Database* (Supabase `pgvector`).
- [ ] Ekstraksi dan *Embedding* 4 Pilar Regulasi (ISAK 335, PAP, Juknis BOS, SOP Pesantren).
- [ ] Pengembangan *Pipeline* LangChain.js (Retrieval & Prompt Engineering).
- [ ] Pembuatan *API Route* Next.js untuk menghubungkan narasi transaksi dengan OpenAI LLM.
- [x] Integrasi UI: Menampilkan bendera peringatan (*Flag*) anomali audit (Kepatuhan Syariah) di tabel pengajuan.

## ⚙️ Fase 4: Fitur Lanjutan & Otomatisasi (Prioritas Menengah)
Fitur-fitur tambahan untuk meningkatkan efisiensi dan tata kelola.

- [ ] **Sistem Blokir RKA**: Mekanisme penguncian pengajuan bulan baru jika realisasi bulan lalu belum selesai (belum diunggah).
- [x] **Tracking System**: UI interaktif untuk melacak status pengajuan (Pop-up "Lacak" di Dasbor dengan Step Indicator).
- [ ] **Notifikasi Email**: Pengiriman email otomatis untuk pengajuan yang *urgent* ke Bendahara Pusat.
- [ ] **Manajemen Penjadwalan Ulang (*Reschedule*)**: Fitur untuk memindahkan kegiatan yang belum terlaksana ke bulan berikutnya beserta kalkulasi sisa saldo.
- [x] **Audit Trail Log UI**: Tampilan riwayat aktivitas (*read-only*) terintegrasi (RKA & LPJ) melalui detail pelacakan untuk transparansi mutasi data.
- [x] **Ultra Compact Dashboard**: Optimalisasi kepadatan informasi untuk monitoring keuangan efisien.

## 🚀 Fase 5: Pengujian & Peluncuran (Penyelesaian)
Fokus pada pemastian kualitas, keamanan, dan penerimaan pengguna.

- [ ] *Unit Testing* & *Integration Testing* (Terutama kalkulasi nominal saldo).
- [ ] Pemindaian keamanan kode (*Static Code Analysis*) dengan SonarCloud.
- [ ] Simulasi dan Pengujian Kotak Hitam (*Black Box Testing*).
- [ ] *User Acceptance Testing* (UAT) bersama Bendahara Pesantren.
- [ ] Peluncuran *Production* di Vercel dan *Monitoring* Performa (Core Web Vitals).

---
*Catatan: Centang kotak `[ ]` menjadi `[x]` seiring berjalannya progres pengembangan aplikasi.*

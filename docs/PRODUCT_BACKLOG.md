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
- [x] **Fitur Lupa Kata Sandi**: Halaman `/lupa-kata-sandi` & `/reset-kata-sandi` terintegrasi dengan Supabase Auth email recovery.
- [x] **Template Email Kustom**: Desain email Reset Password & Password Changed dengan branding Smart Santri (panduan konfigurasi SMTP kustom disediakan).

---

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
  - [x] **Klasifikasi Dana Iuran Non-Wajib**: Dikoreksi menjadi "Dana Dengan Pembatasan" karena eksklusif untuk biaya antar jemput siswa TK.
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
  - [x] **Otomatisasi Pencatatan Buku Besar**: LPJ yang direalisasi otomatis dicatat ke `transaksi_pengeluaran` (segmentasi per sumber dana / split funding, termasuk penanganan overbudget).
- [x] **Modul Buku Besar (Laporan)**
  - [x] Halaman `/laporan/buku-besar` menampilkan mutasi keuangan unit.
  - [x] Sumber data terpusat dari `transaksi_pengeluaran` untuk menghilangkan pencatatan ganda (*double-counting*).
- [x] **Modul Pemasukan Manual**
  - [x] Halaman `/pendapatan/buat` — form input pendapatan Ultra-Compact.
  - [x] Pemetaan sumber dana dinamis dan dibatasi berdasarkan unit pengguna.
  - [x] Logika RBAC: entri pendapatan otomatis terasosiasi dengan unit user yang login.
  - [x] Persistensi data ke tabel pendapatan dan pembaruan saldo unit otomatis.
  - [x] Sidebar ringkasan transaksi real-time untuk verifikasi administrasi langsung.
- [x] **Pengaturan Sumber Dana**
  - [x] Halaman `/pengaturan/kelola-sumber-dana` untuk manajemen daftar sumber dana per unit.
- [x] **Pengaturan Kontrol Pengajuan**
  - [x] Halaman `/pengaturan/kontrol-pengajuan` untuk pengaturan periode dan batas pengajuan.
- [x] **Riwayat & Rekap Pengajuan**
  - [x] Halaman riwayat pengajuan RKA & LPJ dengan filter status.
  - [x] Halaman rekap draft untuk review Bendahara Unit.

---

## 🧠 Fase 3: Integrasi Kecerdasan Buatan (Smart Compliance Audit)
Fokus pada pengembangan mesin *Retrieval-Augmented Generation* (RAG) untuk validasi kepatuhan.

- [ ] Persiapan *Vector Database* (Supabase `pgvector`).
- [ ] Ekstraksi dan *Embedding* 4 Pilar Regulasi (ISAK 335, PAP, Juknis BOS, SOP Pesantren).
- [ ] Pengembangan *Pipeline* LangChain.js (Retrieval & Prompt Engineering).
- [ ] Pembuatan *API Route* Next.js untuk menghubungkan narasi transaksi dengan OpenAI LLM.
- [x] Integrasi UI: Menampilkan bendera peringatan (*Flag*) anomali audit (Kepatuhan Syariah) di tabel pengajuan.

---

## ⚙️ Fase 4: Fitur Lanjutan & Otomatisasi (Prioritas Menengah)
Fitur-fitur tambahan untuk meningkatkan efisiensi dan tata kelola.

- [x] **Sistem Blokir RKA**: Diselesaikan melalui fitur **Kontrol Pengajuan & LPJ** (`/pengaturan/kontrol-pengajuan`) — Bendahara Pusat dapat mengunci/membuka akses RKA & LPJ secara manual per unit, memberikan fleksibilitas untuk kondisi nyata di mana jadwal kegiatan dapat mundur meskipun dana sudah cair.
- [x] **Tracking System**: UI interaktif untuk melacak status pengajuan (Pop-up "Lacak" di Dasbor dengan Step Indicator).
- [x] **Notifikasi Email**: Pengiriman email otomatis via **Resend** untuk 6 event trigger: RKA/LPJ disubmit → Bendahara Unit; diteruskan → Kepala Unit; disetujui Kepala → Bendahara Pusat; dana CAIR / SUDAH_DITERIMA → Bendahara Unit + Staf; revisi diminta → Staf Pembuat. Template HTML berbranding Smart Santri.
- [x] **Manajemen Penjadwalan Ulang (*Reschedule*)**: Diselesaikan melalui fitur **Kontrol Pengajuan & LPJ** — Bendahara Pusat dapat mentoleransi kegiatan yang belum terlaksana dengan mengatur akses pengajuan secara fleksibel per unit. Staf/Bendahara Unit cukup konfirmasi ke Bendahara Pusat tanpa alur digital yang rumit.
- [x] **Audit Trail Log UI**: Tampilan riwayat aktivitas (*read-only*) terintegrasi (RKA & LPJ) melalui detail pelacakan untuk transparansi mutasi data.
- [x] **Ultra Compact Dashboard**: Optimalisasi kepadatan informasi untuk monitoring keuangan efisien.
- [x] **Filter Dasbor Interaktif**: Filter berdasarkan unit & jenis dana dengan penutupan otomatis saat klik di luar komponen.
- [x] **RKA Referensi**: Halaman `/pengaturan/rka-referensi` untuk template standar kegiatan anggaran.

---

## 🚀 Fase 5: Pengujian & Peluncuran (Penyelesaian)
Fokus pada pemastian kualitas, keamanan, dan penerimaan pengguna.

- [ ] *Unit Testing* & *Integration Testing* (Terutama kalkulasi nominal saldo).
- [ ] Pemindaian keamanan kode (*Static Code Analysis*) dengan SonarCloud.
- [ ] Simulasi dan Pengujian Kotak Hitam (*Black Box Testing*).
- [ ] *User Acceptance Testing* (UAT) bersama Bendahara Pesantren.
- [ ] Peluncuran *Production* di Vercel dan *Monitoring* Performa (Core Web Vitals).

---
*Catatan: Centang kotak `[ ]` menjadi `[x]` seiring berjalannya progres pengembangan aplikasi.*
*Terakhir diperbarui: 20 Mei 2026*

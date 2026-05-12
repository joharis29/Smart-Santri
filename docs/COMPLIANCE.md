# Kebijakan Kepatuhan & Tata Kelola Data (Compliance) 📜

Dokumen ini menjelaskan standar kepatuhan (*compliance*), perlindungan privasi, dan tata kelola data yang diterapkan dalam sistem informasi **Smart Santri**. Sistem ini dirancang untuk menjamin akuntabilitas pengelolaan dana umat, kepatuhan terhadap empat pilar regulasi (ISAK 335, Pedoman Akuntansi Pesantren, Juknis BOS, dan SOP Internal), serta penggunaan kecerdasan buatan yang etis dan transparan.

---

## 1. Kepatuhan Standar Akuntansi & Regulasi Keuangan ⚖️

Smart Santri dikembangkan dengan kepatuhan ketat terhadap regulasi nasional, prosedur internal, dan prinsip syariah untuk menjamin validitas pelaporan keuangan:

- **ISAK 335 (Entitas Nirlaba)**: Sistem secara sistematis mewajibkan klasifikasi pengeluaran berdasarkan batasan donor. Setiap transaksi wajib ditandai sebagai **Aset Neto Dengan Pembatasan** atau **Aset Neto Tanpa Pembatasan**.
- **Pedoman Akuntansi Pesantren (PAP)**: Penamaan dan pengelompokan kode akun transaksi (CoA) diwajibkan mengikuti standar akuntansi khusus pesantren untuk menyeragamkan pelaporan tingkat jenjang/unit hingga yayasan pusat.
- **Pedoman Juknis BOS**: Penggunaan Dana Bantuan Operasional Sekolah (BOS) diawasi secara digital. Sistem memverifikasi narasi transaksi untuk memastikan selaras dengan komponen pembiayaan yang diizinkan oleh Kemendikbud.
- **SOP Pesantren X**: Aturan birokrasi internal—seperti kewajiban verifikasi berjenjang dari Kepala Unit hingga Bendahara Pusat, serta batasan nominal pengajuan—ditegakkan melalui validasi sistem dan AI.
- **Prinsip Amanah (Syariah)**: Menerapkan *Stewardship Theory* di mana sistem menjamin transparansi, mencegah *Gharar* (ketidakjelasan) dalam tujuan penggunaan dana, dan memblokir pencampuran dana operasional dengan dana terikat (zakat/wakaf/tabungan siswa).

---

## 2. Perlindungan Data Pribadi & Finansial (UU PDP) 🛡️

Selaras dengan **UU No. 27 Tahun 2022 tentang Perlindungan Data Pribadi (UU PDP)**, sistem menerapkan protokol keamanan tingkat tinggi:

- **Minimalisasi Data**: Sistem hanya mengumpulkan data yang relevan untuk proses pelaporan keuangan dan operasional pesantren.
- **Keamanan Lapis Tinggi**: Data sensitif seperti nilai transaksi, bukti kuitansi fisik, dan kredensial diamankan dengan enkripsi **AES-256** pada *Data-at-Rest* dan protokol **TLS 1.3** pada *Data-in-Transit*.
- **Isolasi Akses Berbasis Peran (RLS PostgreSQL)**: Kebijakan *Row-Level Security* membatasi visibilitas data. Staf/Bendahara Jenjang hanya dapat mengakses transaksi unitnya sendiri. Bendahara Pusat mengelola arus kas global, sementara Pimpinan Pesantren memiliki akses *read-only* (baca saja) menyeluruh untuk keperluan audit tanpa bisa mengubah data.
- **Kerahasiaan Dokumen**: File bukti kuitansi di dalam *Storage* dilindungi kebijakan privat, mencegah pengunduhan oleh pihak luar yang tidak memiliki token otentikasi.

---

## 3. Kebijakan Retensi & Arsip Digital 🗄️

Penyimpanan data mengikuti standar hukum perpajakan dan akuntansi di Indonesia:

- **Data Transaksi Keuangan**: Riwayat pengajuan, pencairan, realisasi, beserta bukti digital (foto nota/kuitansi) **disimpan selama 10 tahun** untuk keperluan audit internal, audit syariah, maupun pemeriksaan eksternal (KPK/Kemenag/Kemendikbud).
- **Data Regulasi AI (Vector Store)**: Basis data regulasi (ISAK 335, PAP, Juknis BOS, SOP) diperbarui secara berkala. Versi historis akan tetap disimpan agar audit AI dapat merujuk pada regulasi yang berlaku tepat pada tahun transaksi tersebut terjadi.
- **Penghapusan Log Sesi**: Log teknis non-krusial (seperti riwayat login harian) dihapus otomatis setiap **6 bulan** guna meminimalisasi beban server.

---

## 4. Integritas Transaksi & Jejak Audit (*Audit Trail*) 🔍

Untuk mencegah manipulasi (*fraud*) dan menjaga akuntabilitas antardepartemen, Smart Santri merekam seluruh riwayat perubahan pada siklus keuangan secara permanen.

- **Mekanisme Append-Only**: Tabel log audit diimplementasikan menggunakan *Database Trigger* pada Supabase. Log ini bersifat *read-only*, tidak dapat diubah atau dihapus oleh siapapun (termasuk Admin/Bendahara Pusat).
- **Cakupan Log**: Aksi krusial yang direkam secara mendetail meliputi:
  - Input/Upload RKA dan kuitansi realisasi oleh Bendahara Jenjang/Unit atau Staf.
  - Verifikasi pengajuan oleh Kepala Jenjang/Unit.
  - Otorisasi (Approve/Reject), perubahan nominal, atau penjadwalan ulang (*reschedule*) oleh **Bendahara Pusat**.
  - Rekaman penarikan kesimpulan anomali oleh model AI.
- **Struktur Rekaman**: Setiap log memuat: **Siapa** (ID Pengguna & Perannya), **Kapan** (Timestamp server), **Di mana** (IP/Device), dan **Apa** (Rekaman nilai sebelum dan sesudah diubah).

---

## 5. Akuntabilitas & Etika AI (*RAG Governance*) 🤖

Sistem menggunakan metodologi *Retrieval-Augmented Generation* (RAG) sebagai asisten audit cerdas (*Smart Compliance Audit*). Kebijakannya mencakup:

- **Human-in-the-Loop & Segregasi Wewenang**: AI diposisikan murni sebagai 'Early Warning System' yang menghasilkan temuan anomali. Keputusan final operasional (menyetujui/menolak dana) mutlak merupakan wewenang **Bendahara Pusat** sebagai eksekutor, sementara **Pimpinan Pesantren** menggunakan temuan AI tersebut murni untuk pengawasan, evaluasi, dan audit kebijakan tanpa campur tangan teknis pencairan.
- **Anti-Halusinasi**: Model AI diwajibkan menyertakan kutipan pasal/halaman referensi langsung dari *Vector Store* (PAP, BOS, ISAK, SOP). Jika tidak ada di referensi, AI dilarang memberikan asumsi hukum.
- **Transparansi Prompt**: Logika instruksi (*Prompt Engineering*) yang meng
# Kebijakan Kepatuhan & Tata Kelola Data (Compliance) 📜

Dokumen ini menjelaskan standar kepatuhan (*compliance*), perlindungan privasi, dan tata kelola data yang diterapkan dalam sistem informasi **Smart Santri**. Sistem ini dirancang untuk menjamin akuntabilitas pengelolaan dana umat, kepatuhan terhadap standar akuntansi nirlaba, serta penggunaan kecerdasan buatan yang etis dan transparan.

---

## 1. Kepatuhan Standar Akuntansi & Regulasi Keuangan ⚖️

Smart Santri dikembangkan dengan kepatuhan ketat terhadap regulasi nasional dan prinsip syariah untuk menjamin validitas laporan keuangan pesantren:

- **ISAK 335 (Entitas Nirlaba)**: Sistem secara sistematis mewajibkan klasifikasi pengeluaran berdasarkan batasan donor. Setiap transaksi wajib ditandai sebagai **Aset Neto Dengan Pembatasan** atau **Aset Neto Tanpa Pembatasan** untuk memastikan pelaporan yang sesuai dengan standar nirlaba terkini.
- **Pedoman Juknis BOS**: Penggunaan Dana Bantuan Operasional Sekolah (BOS) diawasi secara digital. Sistem menggunakan *RAG Pipeline* untuk memverifikasi apakah narasi transaksi selaras dengan komponen pembiayaan yang diizinkan dalam peraturan menteri pendidikan yang berlaku.
- **Prinsip Amanah (Syariah)**: Implementasi *Stewardship Theory* memastikan bahwa setiap rupiah pengeluaran memiliki landasan akad yang jelas, mencegah terjadinya *Gharar* (ketidakjelasan) dalam tujuan penggunaan dana, serta menghindari percampuran dana zakat, wakaf, dan operasional secara tidak sah.

---

## 2. Perlindungan Data Pribadi & Finansial (UU PDP) 🛡️

Selaras dengan **UU No. 27 Tahun 2022 tentang Perlindungan Data Pribadi (UU PDP)**, sistem menerapkan protokol keamanan tingkat tinggi:

- **Minimalisasi Data**: Sistem hanya mengumpulkan data pribadi yang relevan untuk proses otorisasi keuangan dan identifikasi penerima manfaat.
- **Keamanan Lapis Tinggi**: Data sensitif seperti nilai transaksi, bukti kuitansi fisik, dan kredensial pengguna dilindungi dengan enkripsi **AES-256** pada *Data-at-Rest* dan protokol **TLS 1.3** pada *Data-in-Transit*.
- **Isolasi Akses (PostgreSQL RLS)**: Menggunakan kebijakan *Row-Level Security* pada Supabase untuk memastikan bahwa Bendahara atau Pengurus hanya dapat melihat data transaksi yang sah sesuai dengan batasan peran dan departemen mereka.
- **Kerahasiaan Dokumen**: File bukti transaksi yang diunggah ke *Storage* dilindungi dengan kebijakan akses privat, mencegah pihak luar mengunduh dokumen internal pesantren tanpa token autentikasi yang valid.

---

## 3. Kebijakan Retensi & Arsip Digital 🗄️

Sistem menerapkan kebijakan penyimpanan data sesuai dengan standar hukum perpajakan dan akuntansi di Indonesia:

- **Data Transaksi Keuangan**: Sesuai standar akuntansi, seluruh riwayat transaksi pengeluaran kas beserta bukti digitalnya (kuitansi/nota) akan **disimpan selama 10 tahun** untuk keperluan audit internal, audit syariah, maupun pemeriksaan instansi pemerintah (KPK/Kemendikbud).
- **Data Regulasi (Vector Store)**: Basis data regulasi (ISAK 335, Juknis BOS) akan diperbarui secara berkala. Versi lama akan tetap disimpan sebagai referensi historis untuk mengaudit transaksi yang terjadi pada periode regulasi tersebut berlaku.
- **Penghapusan Log Sesi**: Log aktivitas teknis non-krusial (seperti log login gagal atau sesi pencarian AI) akan dihapus secara otomatis setiap **6 bulan** untuk menjaga performa sistem dan minimalisasi data.

---

## 4. Integritas Transaksi & Jejak Audit (*Audit Trail*) 🔍

Untuk mencegah manipulasi data (*fraud*) dan menjamin transparansi, Smart Santri merekam setiap perubahan pada data keuangan secara permanen.

- **Mekanisme Append-Only**: Tabel log audit diimplementasikan menggunakan *Database Trigger* pada PostgreSQL Supabase. Log ini bersifat *read-only* bagi Admin sekalipun dan tidak dapat diubah atau dihapus.
- **Cakupan Log**: Setiap aksi berikut akan direkam secara mendetail:
  - Pembuatan (Input) pengajuan dana baru.
  - Otorisasi (Approve/Reject) oleh Pimpinan Pesantren.
  - Perubahan nominal atau klasifikasi dana oleh Bendahara.
  - Unggahan atau penggantian bukti realisasi kuitansi.
- **Struktur Rekaman**: Setiap log audit memuat: **Siapa** (ID Akun), **Kapan** (Timestamp akurat server), **Di mana** (IP Address/Device), dan **Apa** (Perbandingan nilai lama vs nilai baru).

---

## 5. Akuntabilitas & Etika AI (*RAG Governance*) 🤖

Sistem menggunakan *Retrieval-Augmented Generation* (RAG) sebagai alat bantu verifikasi. Kebijakan kepatuhan AI mencakup:

- **Human-in-the-Loop**: AI diposisikan hanya sebagai instrumen 'Early Warning System'. Keputusan final mengenai penolakan atau persetujuan dana tetap menjadi otoritas penuh Pimpinan Pesantren (manusia).
- **Anti-Halusinasi**: Sistem mewajibkan model AI untuk selalu menyertakan kutipan referensi langsung dari dokumen regulasi yang tersimpan di *Vector Store*. Jika referensi tidak ditemukan, AI dilarang memberikan opini atau hasil validasi.
- **Transparansi Prompt**: Seluruh logika instruksi (*Prompt Engineering*) yang diberikan kepada AI didokumentasikan untuk memastikan tidak adanya bias dalam penilaian kepatuhan transaksi.

---
*Catatan: Pelanggaran terhadap kebijakan kepatuhan ini oleh pengguna sistem akan tercatat dalam log audit dan dapat ditindaklanjuti sesuai dengan peraturan disiplin internal pesantren dan hukum yang berlaku.*
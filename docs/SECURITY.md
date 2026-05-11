# Panduan Keamanan (*Security Policy*) - Smart Santri 🛡️

Keamanan informasi dan integritas data finansial merupakan prioritas absolut dalam pengembangan sistem informasi akuntansi pesantren **Smart Santri**. Dokumen ini menjabarkan standar, batasan, dan protokol perlindungan teknis yang wajib dipatuhi untuk melindungi kerahasiaan pengeluaran kas, mencegah kecurangan (*fraud*), dan mengamankan ekosistem kecerdasan buatan.

---

## 1. Manajemen Rahasia (*Secret Management*) 🔑

Untuk mencegah tereksposnya infrastruktur *backend* dan pembengkakan tagihan layanan pihak ketiga akibat kebocoran akses, aturan berikut mengikat secara mutlak:

- **Larangan Publikasi File `.env`**: File konfigurasi lokal yang memuat kredensial rahasia (seperti `.env`, `.env.local`) **dilarang keras** diunggah ke repositori Git publik maupun privat.
- **Validasi `.gitignore`**: Pengembang wajib memastikan ekstensi file lingkungan telah masuk daftar abaikan di `.gitignore`.
- **Proteksi Kunci API**: 
  - `SUPABASE_SERVICE_ROLE_KEY`: Akses *bypass* database tingkat admin ini dilarang keras diekspos ke klien (browser). Hanya boleh dieksekusi di *Server Actions* (Next.js) atau *Edge Functions*.
  - `OPENAI_API_KEY`: Kunci akses orkestrasi *Retrieval-Augmented Generation* (RAG) harus dilindungi dengan ketat di lingkungan peladen untuk mencegah eksploitasi kuota AI.
- **Rotasi Darurat (*Revoke & Rotate*)**: Apabila terdapat indikasi kebocoran pada kredensial apa pun, kunci harus segera dicabut melalui *dashboard* Supabase atau platform OpenAI, disusul dengan pembersihan riwayat Git (*history scrubbing*).

---

## 2. Autentikasi & Pemisahan Tugas (*Segregation of Duties*) 🔐

Sistem menggunakan Supabase Auth yang dipadukan dengan *Role-Based Access Control* (RBAC) yang ketat untuk memastikan pemisahan tugas akuntansi yang sehat:

- **Pimpinan Pesantren**: Bertindak sebagai pemegang hak veto (*Authorizer*). Hanya pimpinan yang memiliki kewenangan menyetujui/menolak pencairan dana dan mengakses temuan anomali dari Dasbor Audit AI, tanpa memiliki akses untuk menginput pengajuan awal.
- **Bendahara**: Bertindak sebagai eksekutor finansial. Bendahara berwenang memverifikasi pengajuan, melakukan klasifikasi dana sesuai standar ISAK 335 (Aset Neto Dengan/Tanpa Pembatasan), dan mengeksekusi pencairan kas, namun tidak dapat menyetujui (otorisasi) pengajuannya sendiri.
- **Pengurus (Pemohon)**: Diberikan akses sektoral secara eksklusif. Pengurus hanya diizinkan untuk membuat, mengedit, dan melampirkan kuitansi realisasi untuk transaksi yang diajukannya sendiri. Mereka tidak memiliki akses untuk melihat arus kas pengurus atau departemen lain.

*Catatan: Validasi peran ditegakkan berlapis, yakni pada Next.js Middleware (pengamanan rute aplikasi) dan pada tingkat skema Basis Data.*

---

## 3. Keamanan Database (*Row Level Security*) 🗄️

Pengamanan lapis utama (*Core Defense*) diterapkan langsung di tingkat PostgreSQL menggunakan fitur **Row Level Security (RLS)** untuk mencegah kebocoran data finansial akibat celah *endpoint*.

- **Akses Bawaan Tertutup (*Default Deny*)**: Seluruh tabel transaksi (pengajuan dana, buku besar, kuitansi) berstatus *RLS Enabled*. Tanpa kebijakan otorisasi yang eksplisit, seluruh permintaan data dari antarmuka akan otomatis diblokir.
- **Validasi Kriptografis Klien (`auth.uid()`)**: Akses data dibatasi berdasarkan verifikasi token pengguna yang aktif. Misalnya, entitas *Pengurus* hanya bisa memodifikasi baris pada tabel `pengajuan_dana` apabila nilai pada kolom `pemohon_id` identik dengan `auth.uid()` mereka. Mekanisme ini mencegah insiden *Broken Object Level Authorization* (BOLA) di mana peretas mencoba memanipulasi ID transaksi milik orang lain melalui modifikasi *payload*.

---

## 4. Keamanan Integrasi Kecerdasan Buatan (*RAG & LLM Security*) 🤖

Penggunaan LangChain dan OpenAI diikat oleh aturan keamanan pemrosesan data untuk mencegah eksploitasi model:

- **Isolasi Prompt (*Prompt Injection Prevention*)**: Input narasi realisasi dari pengguna harus melalui sanitasi teks (*text sanitization*) sebelum disisipkan ke dalam *System Prompt* LangChain. Hal ini untuk mencegah pihak internal yang mencoba memanipulasi AI agar meloloskan transaksi yang melanggar Juknis BOS.
- **Minimalisasi Data (*Data Minimization*)**: Hanya teks narasi penggunaan barang/jasa yang dikirimkan ke model OpenAI untuk pencocokan dengan *Vector Store*. Data identitas sensitif atau nominal rekening dilarang disertakan dalam kueri AI.

---

## 5. Rencana Pemulihan & Integritas Audit (*Disaster Recovery & Audit Trail*) 🚑

Sebagai antisipasi terhadap insiden kerusakan data, serangan siber, atau kebutuhan audit forensik:

- **Imutabilitas Log Audit (*Append-Only*)**: Sistem mengimplementasikan tabel Jejak Audit (*Audit Trail*) via *Database Triggers*. Tabel ini bersifat *read-only* bagi semua level pengguna aplikasi (termasuk pimpinan) untuk mencegah manipulasi rekam jejak penghapusan atau pengubahan transaksi.
- **Pencadangan Finansial Harian**: Sistem dikonfigurasi untuk melakukan *Full Backup* harian yang mencakup seluruh skema operasional dan *Vector Store* referensi regulasi.
- **Protokol Darurat (Maintenance Mode)**: Jika terdeteksi manipulasi data massal secara anomali, sistem dapat dialihkan ke *Maintenance Mode* via Vercel Edge Config, membekukan sementara seluruh lalu lintas mutasi kas hingga proses investigasi dan pemulihan (*Point-in-Time Recovery*) dari *dashboard* Supabase selesai dilakukan.
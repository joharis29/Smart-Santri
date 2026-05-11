# Aturan Bisnis (Business Rules) - Smart Santri

Dokumen ini berisi kerangka aturan dan logika bisnis yang mendasari operasional **Sistem Informasi Akuntansi Pengeluaran Kas** pada aplikasi Smart Santri. Dokumen ini menjadi acuan utama (Source of Truth) bagi pengaturan *Row-Level Security* (RLS) di Supabase, logika *Server Actions* di Next.js, dan parameter *prompt* pada *RAG Pipeline* (LangChain).

---

## 1. Hak Akses (Role-Based Access Control)

Matriks di bawah ini menjelaskan batasan, hak, dan segregasi tugas (*segregation of duties*) yang dimiliki oleh masing-masing peran untuk mencegah risiko kecurangan (*fraud*).

| Peran | Modul / Fitur | Deskripsi / Aturan Akses |
| :--- | :--- | :--- |
| **Pengurus (Pemohon)** | Pengajuan Dana | Hanya dapat membuat, mengedit (sebelum diproses), dan melihat status pengajuan dana yang dibuat oleh dirinya sendiri. |
| **Pengurus (Pemohon)** | Laporan Realisasi | Wajib mengunggah bukti fisik (kuitansi/nota) dan menuliskan narasi rincian penggunaan dana maksimal 3x24 jam setelah dana dicairkan. |
| **Bendahara** | Pra-Validasi & Klasifikasi | Berhak memverifikasi kelengkapan pengajuan, mengecek ketersediaan anggaran, dan wajib mengklasifikasikan sumber dana berdasarkan ISAK 335 (Dengan/Tanpa Pembatasan). |
| **Bendahara** | Pencairan Kas | Berhak mengubah status menjadi "Dicairkan" dan mencatat arus kas keluar setelah mendapat otorisasi dari Pimpinan. |
| **Pimpinan Pesantren** | Otorisasi Pencairan | Pemegang hak veto. Hanya Pimpinan yang dapat memberikan persetujuan akhir (Approve/Reject) untuk pengajuan dana di atas limit tertentu. |
| **Pimpinan Pesantren** | Dasbor Audit AI | Berhak melihat hasil temuan anomali dari *Smart Compliance Audit* (AI) atas laporan realisasi dana beserta rekomendasi tindak lanjutnya. |

---

## 2. Alur Siklus Pengeluaran Kas (Cash Disbursement Flow)

Tahapan baku yang harus dilalui dalam setiap transaksi pengeluaran kas, mulai dari pengajuan hingga audit realisasi.

| Tahapan | Aktor Utama | Deskripsi / Syarat & Ketentuan |
| :--- | :--- | :--- |
| **1. Pembuatan Pengajuan** | Pengurus | Mengisi formulir digital berisi nominal, tujuan penggunaan, batas waktu kebutuhan, dan mengunggah dokumen pendukung awal (jika ada). |
| **2. Klasifikasi ISAK 335** | Bendahara | Bendahara menentukan dari kantong dana mana uang akan diambil. Sistem akan mengunci alokasi jika dana berasal dari "Aset Neto Dengan Pembatasan" (misal: Dana BOS/Wakaf). |
| **3. Otorisasi Bertingkat** | Pimpinan | Sistem mengirim notifikasi. Pimpinan meninjau urgensi dan kesesuaian. Jika ditolak, dana batal dialokasikan; jika disetujui, lanjut ke pencairan. |
| **4. Pencairan Dana** | Bendahara | Bendahara menyerahkan dana (tunai/transfer) dan menekan tombol "Cairkan" di sistem. Waktu pencairan (timestamp) akan direkam secara otomatis oleh sistem. |
| **5. Pelaporan Realisasi** | Pengurus | Setelah kegiatan selesai, Pengurus wajib memasukkan nominal riil yang terpakai, mengunggah foto kuitansi, dan menuliskan narasi detail barang/jasa yang dibeli. |
| **6. Smart Compliance Audit**| Sistem (RAG AI) | *Otomatis di latar belakang.* LLM menelusuri narasi realisasi dan membandingkannya dengan *Vector Store* (Juknis BOS/ISAK 335). Jika melanggar (misal: dana BOS dipakai bayar listrik asrama), sistem menandai transaksi dengan status "Anomali / Perlu Tinjauan". |
| **7. Tutup Buku / Arsip** | Bendahara | Memverifikasi fisik kuitansi dengan laporan digital. Jika AI menemukan anomali, transaksi ditahan dari buku besar hingga diklarifikasi oleh Pimpinan. |

---

## 3. Aturan Kepatuhan & Validasi Sistem (Compliance Rules)

Parameter yang digunakan oleh sistem dan Kecerdasan Buatan (LangChain) untuk mengevaluasi kepatuhan transaksi.

| Komponen Validasi | Standar / Parameter | Aturan Eksekusi di Sistem |
| :--- | :--- | :--- |
| **Klasifikasi ISAK 335** | Pemisahan Aset Neto | Transaksi yang menggunakan *Aset Neto Dengan Pembatasan* tidak dapat digabungkan (*split bill*) dengan pengeluaran operasional umum (*Aset Neto Tanpa Pembatasan*). |
| **Kepatuhan Dana BOS** | Juknis BOS Terkini | AI akan menolak/menandai narasi realisasi yang mengandung kata kunci pembangunan fisik, investasi, atau pengeluaran pribadi jika sumber dananya ditandai sebagai Dana BOS. |
| **Prinsip Syariah** | Bebas *Gharar* & Transparansi | Setiap selisih (kembalian) antara pengajuan dan realisasi harus dicatat nominalnya. Tidak boleh ada input nilai minus. Bukti transaksi wajib ada (mencegah *Gharar*/ketidakjelasan). |
| **Batas Waktu Realisasi** | Disiplin Administratif | Jika status "Dicairkan" sudah melewati 3x24 jam dan "Laporan Realisasi" belum diinput, sistem secara otomatis menangguhkan hak pengurus tersebut untuk membuat pengajuan dana baru. |
| **Pencegahan *Double Entry***| Integritas Database | Sistem akan menolak unggahan bukti kuitansi jika *hash* gambar/file sama persis dengan yang pernah diunggah pada ID transaksi sebelumnya. |
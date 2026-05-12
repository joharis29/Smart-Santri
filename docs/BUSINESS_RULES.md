# Aturan Bisnis (Business Rules) - Smart Santri

Dokumen ini berisi kerangka aturan dan logika bisnis yang mendasari operasional **Sistem Informasi Akuntansi Pengeluaran Kas** pada aplikasi Smart Santri. Dokumen ini menjadi acuan utama (Source of Truth) bagi pengaturan *Row-Level Security* (RLS) di Supabase, logika *Server Actions* di Next.js, dan parameter *prompt* pada *RAG Pipeline* (LangChain) yang berlandaskan pada ISAK 335, Pedoman Akuntansi Pesantren (PAP), Juknis BOS, dan SOP Pesantren.

---

## 1. Hak Akses & Matriks Otorisasi (Role-Based Access Control)

Matriks di bawah ini menjelaskan batasan, hak, dan segregasi tugas untuk mencegah risiko kecurangan, dengan menegaskan bahwa otorisasi anggaran berada di tingkat Bendahara Pusat.

| Peran | Modul / Fitur | Deskripsi / Aturan Akses |
| :--- | :--- | :--- |
| **Pimpinan Pesantren** | Pengawasan & Audit | **[Read-Only]** Mengakses laporan saldo, memantau status pengajuan seluruh jenjang/unit secara *real-time*, melihat bukti nota digital, dan meninjau hasil temuan anomali dari AI (Smart Compliance Audit). Pimpinan **tidak** melakukan otorisasi pencairan. |
| **Bendahara Pusat (Yayasan)** | Otorisasi & Distribusi | Memiliki hak penuh untuk menyetujui, mengubah nominal, atau menolak pengajuan RKA (dengan catatan). Mengontrol mode Buka/Tutup periode pengajuan, memproses pencairan kas (bertahap/penuh), dan mengatur persentase alokasi multi-sumber dana. |
| **Kepala Jenjang / Unit** | Verifikasi Internal | Memverifikasi dan menyetujui/menolak pengajuan dana dari staf atau Bendahara Jenjang di tingkat internal *sebelum* diteruskan ke Bendahara Pusat. |
| **Bendahara Jenjang / Unit** | Pengajuan & Realisasi | Melakukan *import* data RKA (Excel/CSV), mengunggah multi-nota realisasi via HP, melacak status pengajuan (*tracking*), dan mengelola dasbor kas lokal. |
| **Staff (Cth: Dapur)** | Input Operasional Harian | Khusus unit dengan fluktuasi tinggi (seperti Dapur Asrama), staf berhak menginput laporan realisasi sekaligus pengajuan dana baru (*reimbursement*) secara harian. |

---

## 2. Alur Siklus Pengeluaran Kas (Cash Disbursement Flow)

Tahapan baku yang harus dilalui dalam setiap transaksi pengeluaran kas, mulai dari pengajuan hingga evaluasi.

| Tahapan | Aktor Utama | Logika Sistem / Ketentuan |
| :--- | :--- | :--- |
| **1. Penyusunan RKA/RKT** | Bendahara Jenjang/Unit | Pengguna dapat mengunggah file Excel/CSV untuk entri data massal. Sistem akan mendeteksi dan memberikan **peringatan otomatis jika terdapat duplikasi** kegiatan. |
| **2. Verifikasi Internal** | Kepala Jenjang/Unit | Memeriksa kebutuhan internal unit. Jika disetujui, status naik ke tingkat Pusat. |
| **3. Otorisasi RKA** | Bendahara Pusat | Menerima notifikasi email untuk pengajuan yang *urgent*. Meninjau, menyesuaikan nominal jika perlu, dan memberikan persetujuan akhir. Menetapkan persentase pembiayaan jika kegiatan didanai >1 sumber. |
| **4. Pencairan Dana** | Bendahara Pusat | Mengeksekusi pencairan (bisa bertahap khusus untuk unit Asrama/THQ). Saat status diubah menjadi "Sudah Diterima", sistem **otomatis menambah saldo** akun Jenjang/Unit terkait. |
| **5. Pelaporan Realisasi** | Bendahara Jenjang/Unit | Mengunggah foto kuitansi/nota secara multi-upload atau langsung via HP. Pengguna dapat memilih lebih dari satu sumber dana (subsidi silang BOS & Yayasan) untuk satu realisasi belanja. |
| **6. Smart Compliance Audit** | Sistem (AI RAG) | *Otomatis di latar belakang*. LLM menelusuri narasi realisasi dan membandingkannya dengan ISAK 335, BOS, PAP, dan SOP untuk mendeteksi anomali. |
| **7. Reschedule & Saldo**| Bendahara Pusat/Lokal | Jika kegiatan tidak terlaksana, Bendahara Pusat dapat mengubah jadwal realisasi ke bulan berikutnya. Sistem otomatis mengakumulasi sisa saldo bulan lalu menjadi saldo awal bulan berjalan di tingkat lokal. |

---

## 3. Aturan Kepatuhan & Logika Pemisahan Dana (Fund Separation Rules)

Sistem diwajibkan untuk menjalankan logika pemisahan dana (*Fund Segregation*) secara otomatis dan ketat di berbagai tingkatan dasbor:

| Tingkat / Entitas | Aturan Pemisahan & Tampilan Dasbor Otomatis |
| :--- | :--- |
| **Tingkat Pusat (Yayasan)** | Sistem otomatis memisahkan dompet dana: SPP, Zakat, Laba Usaha Koperasi, Laba Usaha Poskestren, dan Tabungan Wajib. |
| **Tingkat Pendidikan (Jenjang)** | Dasbor Bendahara Jenjang (TK, Diniyah, SDIT 1 & 2, MTs, MA) memisahkan: **Dana BOS, Dana Yayasan, dan Dana Lainnya**. Khusus dasbor MTs, MA, dan jenjang terkait, menampilkan sisa saldo **Tabungan Wajib** dan **Tabungan Siswa** untuk akurasi info ke wali santri. |
| **Tingkat Asrama & THQ** | Dasbor otomatis membedakan antara THQ, Asrama Putra, dan Asrama Putri. Di dalam masing-masing asrama, saldo dipisah menjadi: **Dana Yayasan, Uang Kas Internal, dan Uang Saku**. |
| **Tingkat Dapur Asrama** | Pemisahan tegas antara entitas Dapur Asrama Putra dan Dapur Asrama Putri. Dasbor menampilkan *Saldo Saat Ini*, *Total Akumulasi Pengeluaran*, *Pendapatan per Bulan*, serta status pelunasan tagihan ke *supplier* (koperasi). |

---

## 4. Parameter Validasi Sistem (System Constraints)

| Komponen Validasi | Aturan Eksekusi di Sistem / AI |
| :--- | :--- |
| **Kepatuhan Dana BOS** | AI menolak/menandai realisasi yang mengandung kata kunci pembangunan fisik/investasi jika sumber dana dipilih "BOS". |
| **Validasi Klasifikasi (PAP)**| Transaksi *Aset Neto Dengan Pembatasan* (misal: Zakat/BOS) tidak boleh tumpang tindih secara kode akun dengan *Aset Neto Tanpa Pembatasan* (Laba Usaha). |
| **Pencegahan Double Entry** | Sistem memblokir unggahan bukti nota dengan *hash* atau deteksi visual identik pada ID transaksi yang berbeda. |
| **Mode Akses Pengajuan** | Fitur tombol "Ajukan RKA" pada akun Jenjang/Unit akan **terkunci otomatis** (*disabled*) apabila Bendahara Pusat mengubah pengaturan ke mode "Ditutup". |
content = """# Research & Development Guide - Smart Santri 📑

Dokumen ini merangkum esensi penelitian dan alur kerja teknis untuk memastikan pengembangan aplikasi **Smart Santri** tetap selaras dengan tujuan akademik dan kebutuhan fungsional pesantren.

---

## 1. Tujuan Penelitian (Research Objectives) 🎯

Penelitian ini bertujuan untuk menghasilkan artefak teknologi yang mampu mentransformasi tata kelola keuangan pesantren melalui poin-poin berikut:

- **Membangun SIA Pengeluaran Kas**: Mengembangkan sistem informasi akuntansi berbasis web yang terstruktur khusus untuk siklus pengeluaran kas.
- **Implementasi Validasi Kepatuhan Otomatis**: Mengintegrasikan teknologi *Retrieval-Augmented Generation* (RAG) untuk memvalidasi transaksi terhadap regulasi ISAK 335 dan Juknis BOS secara *real-time*.
- **Menerapkan Stewardship Theory**: Mewujudkan sistem yang mendukung peran pengelola sebagai pelayan amanah melalui transparansi data.
- **Optimasi Performa & Keamanan**: Menjamin sistem yang responsif dengan skor *Core Web Vitals* yang tinggi serta keamanan data finansial yang berlapis.

---

## 2. Batasan Penelitian (Research Limitations) 🚧

Untuk menjaga fokus dan kedalaman penelitian, ditetapkan batasan-batasan sebagai berikut:

- **Siklus Akuntansi**: Penelitian hanya berfokus pada **Siklus Pengeluaran Kas**, mulai dari pengajuan dana, otorisasi, pencairan, hingga pelaporan realisasi.
- **Ruang Lingkup Regulasi**: Validasi kepatuhan cerdas (AI) dibatasi pada standar **ISAK 335** (Entitas Nirlaba), **Pedoman Akuntasi Pesantren** (PAP) dan **Juknis BOS** (Bantuan Operasional Sekolah) tahun berjalan.
- **Objek Penelitian**: Data dan studi kasus berfokus pada **Pesantren X (Garut)** sebagai representasi lembaga pendidikan keagamaan.
- **Teknologi**: Aplikasi dikembangkan dalam bentuk *Web-Based Application* (tidak mencakup aplikasi *mobile native*) menggunakan ekosistem Next.js dan Supabase.
- **Kecerdasan Buatan**: Penggunaan LLM (OpenAI) melalui LangChain difokuskan pada fungsi *retrieval* dokumen teks, bukan untuk prediksi angka atau manajemen investasi otomatis.

---

## 3. Alur Pengembangan Aplikasi (DSRM Workflow) 🔄

Pengembangan mengikuti model *Design Science Research Methodology* (DSRM) yang terdiri dari 6 tahapan sistematis:

### Tahap 1: Identifikasi Masalah & Motivasi
- Analisis kelemahan pengendalian internal manual di Pesantren X.
- Studi literatur mengenai risiko penyalahgunaan dana pendidikan dan hambatan budaya transparansi.

### Tahap 2: Definisi Tujuan Solusi
- Menetapkan kebutuhan fungsional (Input transaksi, RAG Pipeline) dan non-fungsional (Keamanan RLS, Kecepatan Vercel).

### Tahap 3: Desain & Pengembangan (AI-Assisted)
- **Arsitektur**: Perancangan skema relasional PostgreSQL di Supabase.
- **Frontend**: Pembangunan UI modular dengan Next.js dan Tailwind CSS.
- **Intelligence**: Konfigurasi *Vector Store* dan *Prompt Engineering* pada LangChain.js.

### Tahap 4: Demonstrasi
- Pengujian fitur utama (Siklus Pengeluaran) oleh peneliti untuk membuktikan bahwa artefak dapat bekerja sesuai skenario bisnis pesantren.

### Tahap 5: Evaluasi
- **Black Box Testing**: Memastikan seluruh fungsi berjalan tanpa *error*.
- **Quality Review**: Analisis statis menggunakan SonarCloud untuk keamanan kode.
- **User Validation**: Pengujian penerimaan menggunakan indikator *Technology Acceptance Model* (TAM).

### Tahap 6: Komunikasi
- Pendokumentasian seluruh proses ke dalam skripsi dan publikasi hasil penelitian sebagai kontribusi ilmiah di bidang Akuntansi Sistem Informasi.

---
*Dokumen ini merupakan Source of Truth untuk arah pengembangan teknis Smart Santri.*
"""

with open("RESEARCH_GUIDE.md", "w") as f:
    f.write(content)
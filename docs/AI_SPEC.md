# Spesifikasi Kecerdasan Buatan (AI Specification) - Smart Santri 🤖

Dokumen ini menguraikan rancangan strategis, implementasi teknis, dan standar etika terkait pemanfaatan teknologi *Artificial Intelligence* (AI) di dalam sistem informasi **Smart Santri**. 

Tujuan utama integrasi AI ini adalah untuk meningkatkan kualitas pelayanan administrasi dan analitik pendidikan, dengan tetap menjunjung tinggi nilai-nilai etika pesantren dan keamanan data.

---

## 1. Rencana Integrasi AI 🚀

Sistem Smart Santri merencanakan pengembangan dan implementasi fitur berbasis AI berikut di masa mendatang:

### A. Asisten Virtual (Chatbot) Wali Santri
- **Fungsi**: Chatbot pintar yang terintegrasi pada portal wali santri untuk memberikan layanan informasi 24 jam secara otomatis.
- **Skenario Penggunaan**:
  - Pengecekan status tagihan bulanan (SPP) secara instan.
  - Informasi kalender akademik, jadwal libur, dan jadwal kunjungan.
  - Menjawab Pertanyaan yang Sering Diajukan (FAQ) mengenai aturan pesantren.

### B. Analitik & Prediksi Performa Akademik
- **Fungsi**: Memanfaatkan analitik data prediktif (*Predictive Analytics*) untuk memantau grafik perkembangan belajar santri dari waktu ke waktu.
- **Skenario Penggunaan**:
  - Memberikan peringatan dini (*Early Warning System*) kepada wali kelas atau Ustadz jika algoritma mendeteksi potensi penurunan drastis pada nilai atau hafalan (Tahfidz) seorang santri.
  - Memberikan rekomendasi pola bimbingan khusus berdasarkan gaya atau tren belajar historis.

---

## 2. AI Prompt Registry (Daftar Sistem Prompt) 📝

Untuk memastikan AI menghasilkan respons yang relevan, aman, dan sesuai dengan *tone* (nada bicara) pesantren, berikut adalah kerangka dasar sistem instruksi (*System Prompts*) yang digunakan pada layanan LLM (*Large Language Model*).

| ID | Fitur | *System Prompt* (Konteks AI) |
| :--- | :--- | :--- |
| **`PR-CHAT-01`** | Chatbot Wali Santri | *"Anda adalah asisten virtual resmi Pesantren Smart Santri. Jawablah pertanyaan wali santri dengan sopan, santun, ringkas, dan jelas. Selalu mulai dengan salam Islami. Jika pertanyaan bersifat pribadi atau di luar pengetahuan Anda, arahkan mereka untuk menghubungi nomor kontak resmi admin."* |
| **`PR-ACAD-01`** | Analisis Tren Nilai | *"Anda adalah asisten akademik pesantren. Diberikan data histori nilai ujian dan hafalan santri berikut secara anonim, buatkan ringkasan 2 paragraf tentang tren perkembangannya dan berikan saran area mana yang perlu ditingkatkan."* |
| **`PR-ADMN-01`** | Generator Pengumuman | *"Buatkan draf surat pengumuman resmi pesantren tentang [Topik] yang ditujukan kepada [Target]. Gunakan tata bahasa Indonesia yang formal, baku, namun tetap komunikatif dan menjunjung adab Islami."* |

---

## 3. Batasan Etika & Privasi Data 🛡️

Dalam memproses data operasional pesantren menggunakan teknologi AI, proyek Smart Santri menerapkan standar kepatuhan dan etika privasi yang sangat ketat:

1. **Anonimisasi Data (*Data Anonymization*)**
   Data historis santri (seperti nilai, absensi, atau pelanggaran) yang digunakan untuk pemrosesan AI eksternal atau pelatihan model prediktif **wajib dianonimkan**. Identitas seperti Nama, NIK, Nomor Induk Santri (NIS), dan nomor telepon wali akan dihapus (di-*masking*) sebelum dikirim ke API *engine* AI.

2. **AI Sebagai Pendukung, Bukan Pemutus Keputusan (*Human in the Loop*)**
   AI hanya bertindak sebagai **Sistem Pendukung Keputusan** (*Decision Support System*). Keputusan yang bersifat final dan krusial—seperti status kenaikan kelas, kelulusan, atau pemberian sanksi disiplin pada santri—mutlak berada di tangan Dewan Asatidz dan Pengurus Pesantren.

3. **Keamanan API Pihak Ketiga**
   Apabila sistem memanfaatkan API dari penyedia pihak ketiga (seperti OpenAI atau model *cloud* lainnya), aplikasi dilarang keras mengirimkan data medis, dokumen pribadi, atau informasi finansial sensitif. Layanan yang dipilih harus mendukung kebijakan *Zero-Data Retention* (data yang dikirim tidak disimpan atau digunakan untuk melatih model publik mereka).

4. **Transparansi Interaksi**
   Setiap antarmuka yang melibatkan AI (seperti Chatbot) harus secara eksplisit memberi tahu pengguna bahwa mereka sedang berinteraksi dengan sistem cerdas/asisten virtual, bukan dengan staf administrasi manusia.

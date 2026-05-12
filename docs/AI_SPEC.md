# Spesifikasi Kecerdasan Buatan (AI Specification) - Smart Santri 🤖

Dokumen ini menguraikan rancangan strategis, implementasi teknis, dan standar etika terkait pemanfaatan teknologi *Artificial Intelligence* (AI) dengan metodologi *Retrieval-Augmented Generation* (RAG) di dalam sistem **Smart Santri**. 

Tujuan utama integrasi AI ini adalah sebagai instrumen **Smart Compliance Audit** untuk menjamin akuntabilitas pengeluaran kas berdasarkan empat pilar kepatuhan: **ISAK 335**, **Pedoman Akuntansi Pesantren (PAP)**, **Juknis BOS**, dan **SOP Internal Pesantren X**.

---

## 1. Rencana Integrasi AI (RAG Pipeline) 🚀

Sistem Smart Santri mengimplementasikan AI sebagai mesin validasi lintas regulasi (*cross-regulation validation*) berbasis dokumen referensi aktual:

### A. Smart Compliance Audit (Verifikasi RAG)
- **Fungsi**: Menganalisis narasi transaksi pengeluaran kas dan memvalidasinya secara simultan terhadap aturan eksternal dan internal.
- **Mekanisme**: Menggunakan **LangChain.js** untuk melakukan pencarian kemiripan (*similarity search*) pada *Vector Store* yang berisi:
  - **ISAK 335**: Standar penyajian laporan keuangan entitas nirlaba.
  - **Pedoman Akuntansi Pesantren (PAP)**: Standar teknis akuntansi khusus lingkungan pesantren.
  - **Juknis BOS**: Regulasi penggunaan dana pemerintah.
  - **SOP Pesantren X**: Prosedur birokrasi dan kebijakan internal pesantren.
- **Skenario Penggunaan**: Memastikan pengajuan dana tidak hanya benar secara administratif (SOP), tetapi juga sah menurut aturan negara (BOS) dan dicatatkan secara tepat dalam laporan keuangan (ISAK & PAP).

---

## 2. AI Prompt Registry (Daftar Sistem Prompt) 📝

Berikut adalah kerangka instruksi (*System Prompts*) yang digunakan untuk mengarahkan AI agar patuh pada empat pilar tersebut.

| ID | Fitur | *System Prompt* (Konteks AI) |
| :--- | :--- | :--- |
| **`PR-RAG-COMP`** | Audit Kepatuhan Terpadu | *"Anda adalah Auditor Internal Pesantren. Validasi narasi transaksi ini berdasarkan ISAK 335, PAP, Juknis BOS, dan SOP Pesantren X secara ketat. Identifikasi jika ada ketidaksesuaian dengan salah satu regulasi tersebut dan berikan rujukan pasal/pedoman yang spesifik."* |
| **`PR-ACC-PAP`** | Klasifikasi Akuntansi | *"Gunakan Pedoman Akuntansi Pesantren (PAP) dan ISAK 335 untuk menentukan klasifikasi aset neto dan kode akun yang tepat. Pastikan pengeluaran operasional dipisahkan dari pengeluaran dengan pembatasan donor sesuai pedoman."* |
| **`PR-SOP-VAL`** | Verifikasi Prosedur | *"Tinjau narasi pengeluaran ini berdasarkan SOP Pesantren X. Periksa batasan nominal pengajuan dan syarat lampiran bukti yang diwajibkan oleh prosedur internal pesantren sebelum memberikan status validasi."* |

---

## 3. Parameter Teknis & Anti-Halusinasi 🛠️

1. **Temperature Setting (0.0)**: Diatur pada nilai nol mutlak untuk mematikan kreativitas AI, memastikan respons bersifat kaku dan hanya mengekstraksi data faktual dari PAP, SOP, BOS, dan ISAK.
2. **Multi-Source Retrieval**: Sistem dirancang untuk menarik konteks dari beberapa dokumen sekaligus. AI akan memprioritaskan aturan yang paling ketat (misal: Jika BOS membolehkan namun SOP Pesantren melarang, AI akan memberikan bendera peringatan).
3. **Mandatory Citations**: Setiap jawaban wajib merujuk pada pilar kepatuhan yang relevan (contoh: "Berdasarkan PAP Bab X..." atau "Melanggar SOP Pesantren X Pasal Y...").

---

## 4. Batasan Etika & Privasi Finansial 🛡️

1. **Isolasi Data**: Hanya teks narasi penggunaan dan kategori dana yang dikirim ke LLM. Data identitas sensitif diisolasi di tingkat database Supabase.
2. **Human-in-the-Loop**: AI hanya memberikan "Flag" (peringatan dini). Keputusan akhir mengenai persetujuan transaksi tetap berada di tangan manusia (Pimpinan/Bendahara) sesuai amanah *Stewardship Theory*.
3. **Faithfulness & Transparency**: Jika dokumen regulasi (seperti SOP atau PAP) tidak memberikan konteks yang jelas untuk transaksi tertentu, AI diperintahkan untuk melaporkan keterbatasan informasi tersebut alih-alih memberikan asumsi.
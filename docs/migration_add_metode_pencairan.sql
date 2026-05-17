-- =========================================================================================
-- MIGRASI DATABASE: MENAMBAHKAN KOLOM METODE PENCAIRAN KE TABEL DOKUMEN PENGAJUAN
-- =========================================================================================
-- Skrip SQL ini menambahkan kolom baru 'metode_pencairan' ke tabel 'dokumen_pengajuan' di Supabase.
-- Ini memungkinkan penyimpanan data metode pembayaran (seperti 'Transfer' or 'Cash') ketika
-- Bendahara Pusat memproses pencairan dana RKA.
--
-- CARA MENJALANKAN DI SUPABASE:
-- 1. Masuk ke Supabase Dashboard proyek Anda (https://supabase.com).
-- 2. Pilih menu "SQL Editor" di sidebar kiri.
-- 3. Klik "+ New Query" atau buka editor SQL yang ada.
-- 4. Tempel (paste) skrip SQL ini sepenuhnya.
-- 5. Klik tombol "Run" di kanan bawah.
-- =========================================================================================

-- Tambahkan kolom metode_pencairan jika belum ada
ALTER TABLE public.dokumen_pengajuan 
ADD COLUMN IF NOT EXISTS metode_pencairan TEXT;

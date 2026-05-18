-- Skrip SQL ini menambahkan kolom baru 'catatan_revisi' ke tabel 'item_pengajuan' di Supabase.
-- Ini memungkinkan penyimpanan catatan peninjauan terperinci per Program/Kegiatan (item pengajuan),
-- sehingga ketika dikembalikan untuk direvisi, staf pengaju tahu persis item mana yang perlu diperbaiki.
--
-- CARA MENJALANKAN DI SUPABASE:
-- 1. Masuk ke Supabase Dashboard proyek Anda (https://supabase.com).
-- 2. Pilih menu "SQL Editor" di sidebar kiri.
-- 3. Klik "+ New Query" atau buka editor SQL yang ada.
-- 4. Tempel (paste) skrip SQL ini sepenuhnya.
-- 5. Klik tombol "Run" di kanan bawah.
-- =========================================================================================

-- Tambahkan kolom catatan_revisi jika belum ada pada tabel item_pengajuan
ALTER TABLE public.item_pengajuan 
ADD COLUMN IF NOT EXISTS catatan_revisi TEXT;

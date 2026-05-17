-- =========================================================================================
-- MIGRASI DATABASE: MENAMBAHKAN STATUS 'REKAP_BENDAHARA' KE ENUM 'status_pengajuan'
-- =========================================================================================
-- Skrip SQL ini menambahkan status baru 'REKAP_BENDAHARA' ke tipe ENUM custom PostgreSQL
-- 'status_pengajuan' agar status penggabungan Bendahara dapat disimpan secara permanen di database.
--
-- CARA MENJALANKAN DI SUPABASE:
-- 1. Masuk ke Supabase Dashboard proyek Anda.
-- 2. Pilih menu "SQL Editor" di sidebar kiri.
-- 3. Klik "+ New Query".
-- 4. Paste skrip SQL ini sepenuhnya, lalu klik "Run".
-- =========================================================================================

-- Tambahkan value 'REKAP_BENDAHARA' jika belum ada dalam enum status_pengajuan
ALTER TYPE public.status_pengajuan ADD VALUE IF NOT EXISTS 'REKAP_BENDAHARA';

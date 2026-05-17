-- =========================================================================
-- MIGRATION: PENAMBAHAN KOLOM EMAIL PADA TABEL PROFILES
-- =========================================================================
-- Jalankan perintah SQL ini di SQL Editor Supabase Anda untuk mengizinkan
-- penyimpanan alamat email dinamis staf di database.
-- =========================================================================

-- Tambah kolom email jika belum ada
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

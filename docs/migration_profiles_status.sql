-- =========================================================================
-- MIGRATION: ADD STATUS COLUMN TO PROFILES TABLE
-- =========================================================================
-- Jalankan perintah SQL ini di SQL Editor Supabase Anda untuk menambahkan
-- kolom status ke tabel profiles staf.
-- =========================================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

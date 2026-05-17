-- =========================================================================
-- MIGRATION: PENAMBAHAN VALUE 'ADMINISTRATOR' PADA ENUM USER_ROLE
-- =========================================================================
-- Jalankan perintah SQL ini di SQL Editor Supabase Anda untuk menambahkan
-- dukungan peran Administrator secara resmi di database Anda.
-- =========================================================================

-- Tambah nilai 'ADMINISTRATOR' ke tipe enum user_role jika belum ada
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'ADMINISTRATOR';

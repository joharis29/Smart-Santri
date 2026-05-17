-- =========================================================================
-- MIGRATION: DUKUNGAN PENUH SEMUA KATEGORI PERAN (ROLE ENUM EXPANSION)
-- =========================================================================
-- Jalankan perintah SQL ini di SQL Editor Supabase Anda untuk menambahkan
-- seluruh kategori peran staf secara lengkap ke database.
-- =========================================================================

-- Tambahkan nilai enum baru ke user_role jika belum ada
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'BENDAHARA_JENJANG';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'KEPALA_JENJANG';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'STAFF_BIDANG';

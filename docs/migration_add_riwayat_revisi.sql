-- =========================================================================================
-- MIGRASI DATABASE: MENAMBAHKAN KOLOM RIWAYAT REVISI KE TABEL DOKUMEN PENGAJUAN
-- =========================================================================================
-- Skrip SQL ini menambahkan kolom baru 'riwayat_revisi' (tipe JSONB) ke tabel 'dokumen_pengajuan'.
-- Ini memungkinkan penyimpanan riwayat log revisi lengkap secara terstruktur:
-- - Catatan revisi pembuat keputusan (Reviewer)
-- - Tanggal revisi
-- - Snapshot rincian item pengajuan (judul, nominal, dll) sebelum diubah
-- - Snapshot lampiran berkas bukti kuitansi lama
--
-- CARA MENJALANKAN DI SUPABASE:
-- 1. Masuk ke Supabase Dashboard proyek Anda (https://supabase.com).
-- 2. Pilih menu "SQL Editor" di sidebar kiri.
-- 3. Klik "+ New Query" atau buka editor SQL yang ada.
-- 4. Tempel (paste) skrip SQL ini sepenuhnya.
-- 5. Klik tombol "Run" di kanan bawah.
-- =========================================================================================

-- Tambahkan kolom riwayat_revisi ke tabel dokumen_pengajuan
ALTER TABLE public.dokumen_pengajuan 
ADD COLUMN IF NOT EXISTS riwayat_revisi JSONB DEFAULT '[]'::jsonb;

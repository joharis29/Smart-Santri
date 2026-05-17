-- =========================================================================================
-- MIGRASI DATABASE: MENAMBAHKAN STATUS TRANSAKSI & PENCAIRAN KE ENUM status_pengajuan
-- =========================================================================================
-- Skrip SQL ini menambahkan nilai-nilai status baru ke tipe ENUM status_pengajuan di Supabase.
-- Ini akan memperbaiki error "invalid input value for enum status_pengajuan" saat Bendahara Pusat
-- atau Unit melakukan persetujuan/pencairan.
--
-- CARA MENJALANKAN DI SUPABASE:
-- 1. Masuk ke Supabase Dashboard proyek Anda (https://supabase.com).
-- 2. Pilih menu "SQL Editor" di sidebar kiri.
-- 3. Klik "+ New Query" atau buka editor SQL yang ada.
-- 4. Tempel (paste) skrip SQL ini sepenuhnya.
-- 5. Klik tombol "Run" di kanan bawah.
-- =========================================================================================

-- Tambahkan status-status yang diperlukan ke tipe ENUM status_pengajuan (aman & non-destruktif)
ALTER TYPE public.status_pengajuan ADD VALUE IF NOT EXISTS 'MENUNGGU_VERIFIKASI';
ALTER TYPE public.status_pengajuan ADD VALUE IF NOT EXISTS 'REVISI';
ALTER TYPE public.status_pengajuan ADD VALUE IF NOT EXISTS 'MENUNGGU_CAIR';
ALTER TYPE public.status_pengajuan ADD VALUE IF NOT EXISTS 'CAIR';
ALTER TYPE public.status_pengajuan ADD VALUE IF NOT EXISTS 'SUDAH_DITERIMA';
ALTER TYPE public.status_pengajuan ADD VALUE IF NOT EXISTS 'SELESAI';

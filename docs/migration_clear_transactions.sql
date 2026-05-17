-- =========================================================================================
-- SKRIP PEMBERSIH DATA TRANSAKSIONAL (HAPUS DATA DUMMY) - SMART SANTRI
-- =========================================================================================
-- Skrip ini dirancang untuk menghapus semua data dummy transaksional (pengajuan, realisasi, 
-- pendapatan, dan log audit) agar Anda dapat melakukan pengujian riil (testing real).
--
-- Skrip ini TIDAK akan menghapus data master penting seperti:
-- - Akun Pengguna / Profil (profiles & profiles_multi_role)
-- - Struktur Organisasi (jenjang & unit)
-- - Kamus Kegiatan / Program (kamus_kegiatan)
-- =========================================================================================

-- Hapus data dengan memperhatikan integritas referensi (Foreign Key Constraints)
-- 1. Hapus riwayat audit trail logs terlebih dahulu
TRUNCATE TABLE public.audit_trail_logs CASCADE;

-- 2. Hapus detail item realisasi dan pengajuan
TRUNCATE TABLE public.realisasi_dana CASCADE;

-- Cek apakah tabel item_pengajuan dan dokumen_pengajuan ada sebelum menghapusnya
-- (cascade akan otomatis menghapus dependensi detail)
TRUNCATE TABLE public.item_pengajuan CASCADE;
TRUNCATE TABLE public.dokumen_pengajuan CASCADE;
TRUNCATE TABLE public.pengajuan_dana CASCADE;

-- 3. Hapus riwayat transaksi pendapatan manual/otomatis
TRUNCATE TABLE public.transaksi_pendapatan CASCADE;

-- 4. Reset seluruh saldo dompet dana (Sumber Dana) di semua unit kembali ke 0 (Bersih)
UPDATE public.dompet_dana
SET saldo = 0,
    updated_at = NOW();

-- =========================================================================================
-- SELESAI: Database Anda sekarang bersih dan siap digunakan untuk simulasi alur riil!
-- =========================================================================================

-- =========================================================================================
-- SKRIP PEMBERSIH DATA TRANSAKSIONAL (HAPUS DATA DUMMY) - SMART SANTRI (ROBUST VERSION)
-- =========================================================================================
-- Skrip ini dirancang untuk menghapus semua data dummy transaksional (pengajuan, realisasi, 
-- pendapatan, dan log audit) agar Anda dapat melakukan pengujian riil (testing real).
--
-- Skrip ini menggunakan blok dinamis PL/pgSQL untuk memeriksa keberadaan setiap tabel 
-- sebelum melakukan penghapusan guna menghindari error "relation does not exist" jika
-- ada tabel opsional yang belum dideploy ke database Anda.
-- =========================================================================================

DO $$ 
BEGIN 
  -- 1. Hapus riwayat audit trail logs jika tabel ada
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_trail_logs') THEN
    EXECUTE 'TRUNCATE TABLE public.audit_trail_logs CASCADE';
  END IF;

  -- 2. Hapus detail item realisasi jika tabel ada
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'realisasi_dana') THEN
    EXECUTE 'TRUNCATE TABLE public.realisasi_dana CASCADE';
  END IF;

  -- 3. Hapus detail item pengajuan jika tabel ada
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'item_pengajuan') THEN
    EXECUTE 'TRUNCATE TABLE public.item_pengajuan CASCADE';
  END IF;

  -- 4. Hapus dokumen utama RKA/LPJ jika tabel ada
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dokumen_pengajuan') THEN
    EXECUTE 'TRUNCATE TABLE public.dokumen_pengajuan CASCADE';
  END IF;

  -- 5. Hapus pengajuan dana lama jika tabel ada
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pengajuan_dana') THEN
    EXECUTE 'TRUNCATE TABLE public.pengajuan_dana CASCADE';
  END IF;

  -- 6. Hapus riwayat transaksi pendapatan manual/otomatis jika tabel ada
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transaksi_pendapatan') THEN
    EXECUTE 'TRUNCATE TABLE public.transaksi_pendapatan CASCADE';
  END IF;

  -- 7. Reset seluruh saldo dompet dana (Sumber Dana) kembali ke 0 jika tabel ada
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dompet_dana') THEN
    EXECUTE 'UPDATE public.dompet_dana SET saldo = 0, updated_at = NOW()';
  END IF;
END $$;

-- =========================================================================================
-- SELESAI: Database Anda sekarang bersih dan siap digunakan untuk simulasi alur riil!
-- =========================================================================================

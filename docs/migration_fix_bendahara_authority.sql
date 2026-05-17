-- =========================================================================================
-- MIGRASI DATABASE: MEMPERBAIKI OTORITAS UPDATE BENDAHARA UNIT/JENJANG & ENUM STATUS
-- =========================================================================================
-- Skrip SQL ini wajib dijalankan untuk:
-- 1. Mendaftarkan status 'REKAP_BENDAHARA' ke ENUM 'status_pengajuan'.
-- 2. Memperbarui Kebijakan RLS (Row Level Security) 'dokumen_update_policy' agar peran
--    BENDAHARA_UNIT dan BENDAHARA_JENJANG diizinkan secara resmi untuk mengubah status dokumen
--    RKA/LPJ milik unit/jenjang kerjanya sendiri (agar tidak ditolak diam-diam oleh RLS database).
--
-- CARA MENJALANKAN DI SUPABASE:
-- 1. Masuk ke Supabase Dashboard proyek Anda (https://supabase.com).
-- 2. Pilih menu "SQL Editor" di sidebar kiri.
-- 3. Klik "+ New Query".
-- 4. Paste skrip SQL ini sepenuhnya, lalu klik "Run".
-- =========================================================================================

-- 1. Pastikan status 'REKAP_BENDAHARA' terdaftar di tipe ENUM
ALTER TYPE public.status_pengajuan ADD VALUE IF NOT EXISTS 'REKAP_BENDAHARA';

-- 2. Hapus kebijakan RLS lama pada tabel dokumen_pengajuan
DROP POLICY IF EXISTS "dokumen_update_policy" ON public.dokumen_pengajuan;

-- 3. Buat ulang kebijakan RLS baru yang mencakup Bendahara Unit & Jenjang
CREATE POLICY "dokumen_update_policy" ON public.dokumen_pengajuan
  FOR UPDATE TO authenticated
  USING (
    -- Admin & Bendahara Pusat memiliki otoritas penuh edit/approve dokumen apa saja
    public.get_user_role(auth.uid()) IN ('ADMINISTRATOR', 'BENDAHARA_PUSAT')
    -- Kepala & Bendahara Jenjang/Unit dapat menyetujui/menolak/memproses pengajuan khusus dari unit kerjanya sendiri
    OR (
      public.get_user_role(auth.uid()) IN ('KEPALA_JENJANG', 'KEPALA_UNIT', 'BENDAHARA_JENJANG', 'BENDAHARA_UNIT')
      AND (unit_id = public.get_user_unit(auth.uid()) OR jenjang_id = public.get_user_jenjang(auth.uid()))
    )
    -- Pembuat dokumen hanya dapat mengubah isi jika status saat ini masih berwujud 'DRAFT' atau 'REVISI'
    OR (pembuat_id = auth.uid() AND status IN ('DRAFT', 'REVISI'))
  )
  WITH CHECK (
    -- Setelah diubah, pembuat boleh mengubah status dokumen miliknya ke status baru (misal DRAF -> MENUNGGU_VERIFIKASI)
    public.get_user_role(auth.uid()) IN ('ADMINISTRATOR', 'BENDAHARA_PUSAT')
    OR (
      public.get_user_role(auth.uid()) IN ('KEPALA_JENJANG', 'KEPALA_UNIT', 'BENDAHARA_JENJANG', 'BENDAHARA_UNIT')
      AND (unit_id = public.get_user_unit(auth.uid()) OR jenjang_id = public.get_user_jenjang(auth.uid()))
    )
    -- Pembuat dokumen boleh mengubah isi dokumennya sendiri
    OR (pembuat_id = auth.uid())
  );

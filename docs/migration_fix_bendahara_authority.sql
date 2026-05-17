-- =========================================================================================
-- MIGRASI DATABASE: MEMPERBAIKI OTORITAS UPDATE BENDAHARA UNIT/JENJANG & ENUM STATUS (INDESTRUCTIBLE)
-- =========================================================================================
-- Skrip SQL ini memperbarui RLS, tipe ENUM status_pengajuan, dan secara otomatis melakukan
-- pengisian (retroactive backfill) untuk kolom unit_id dan jenjang_id pada semua dokumen
-- pengajuan lama yang masih bernilai NULL di database Anda.
--
-- CARA MENJALANKAN DI SUPABASE:
-- 1. Masuk ke Supabase Dashboard proyek Anda (https://supabase.com).
-- 2. Pilih menu "SQL Editor" di sidebar kiri.
-- 3. Klik "+ New Query".
-- 4. Paste skrip SQL ini sepenuhnya, lalu klik "Run".
-- =========================================================================================

-- 1. Pastikan status 'REKAP_BENDAHARA' terdaftar di tipe ENUM status_pengajuan
ALTER TYPE public.status_pengajuan ADD VALUE IF NOT EXISTS 'REKAP_BENDAHARA';

-- 2. Retroactive Backfill: Isi unit_id & jenjang_id untuk semua dokumen lama agar lolos RLS
UPDATE public.dokumen_pengajuan d
SET 
  unit_id = u.id,
  jenjang_id = u.jenjang_id
FROM public.unit u
WHERE d.unit = u.name AND (d.unit_id IS NULL OR d.jenjang_id IS NULL);

-- 3. Hapus kebijakan RLS lama pada tabel dokumen_pengajuan
DROP POLICY IF EXISTS "dokumen_update_policy" ON public.dokumen_pengajuan;

-- 4. Buat ulang kebijakan RLS baru yang mencakup semua wewenang secara kokoh dan langsung (Direct Query)
CREATE POLICY "dokumen_update_policy" ON public.dokumen_pengajuan
  FOR UPDATE TO authenticated
  USING (
    -- Admin & Bendahara Pusat memiliki otoritas penuh edit/approve dokumen apa saja
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('ADMINISTRATOR', 'BENDAHARA_PUSAT')
    
    -- Pembuat dokumen hanya dapat mengubah isi jika status saat ini masih berwujud 'DRAFT' atau 'REVISI'
    OR (pembuat_id = auth.uid() AND status IN ('DRAFT', 'REVISI'))
    
    -- Kepala & Bendahara Unit (Berdasarkan Unit Aktif atau tabel Multi-Role)
    OR (
      (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('KEPALA_UNIT', 'BENDAHARA_UNIT')
        AND unit_id = (SELECT unit_id FROM public.profiles WHERE id = auth.uid())
      )
      OR unit_id IN (
        SELECT unit_id FROM public.profiles_multi_role 
        WHERE user_id = auth.uid() AND role IN ('KEPALA_UNIT', 'BENDAHARA_UNIT')
      )
    )
    
    -- Kepala & Bendahara Jenjang (Dapat menyetujui dokumen di bawah jenjangnya secara otomatis)
    OR (
      (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('KEPALA_JENJANG', 'BENDAHARA_JENJANG')
        AND (
          jenjang_id = (SELECT jenjang_id FROM public.profiles WHERE id = auth.uid())
          OR unit_id IN (
            SELECT id FROM public.unit 
            WHERE jenjang_id = (SELECT jenjang_id FROM public.profiles WHERE id = auth.uid())
          )
        )
      )
      OR unit_id IN (
        SELECT u.id FROM public.unit u
        JOIN public.profiles_multi_role pmr ON pmr.unit_id = u.id
        WHERE pmr.user_id = auth.uid() AND pmr.role IN ('KEPALA_JENJANG', 'BENDAHARA_JENJANG')
      )
    )
  );

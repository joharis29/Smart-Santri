-- =========================================================================================
-- MIGRASI DATABASE: HAK AKSES & OTORITAS keamanan (RBAC & RLS) - SMART SANTRI (NON-RECURSIVE VERSION)
-- =========================================================================================
-- Skrip SQL ini mengonfigurasi Row Level Security (RLS) dan kebijakan keamanan (Policies)
-- di database Supabase berdasarkan 16 butir Daftar Otoritas baru yang telah divalidasi.
--
-- VERSI INI MENGGUNAKAN FUNGSI SECURITY DEFINER UNTUK MENGHINDARI INFINITE RECURSION
-- PADA EVALUASI KEBIJAKAN TABEL public.profiles!
--
-- CARA MENJALANKAN DI SUPABASE:
-- 1. Masuk ke Supabase Dashboard proyek Anda.
-- 2. Pilih menu "SQL Editor" di sidebar kiri.
-- 3. Klik "+ New Query".
-- 4. Paste skrip SQL ini sepenuhnya, lalu klik "Run".
-- =========================================================================================

-- =========================================================================================
-- 1. PENGATURAN AWAL & FUNGSI SECURITY DEFINER (Penyembuh Infinite Recursion)
-- =========================================================================================
-- Fungsi-fungsi ini berjalan dengan hak akses superuser (owner), sehingga dapat membaca
-- tabel public.profiles tanpa memicu / mengevaluasi kebijakan RLS tabel itu sendiri.

CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT SECURITY DEFINER AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = user_id);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_user_unit(user_id UUID)
RETURNS UUID SECURITY DEFINER AS $$
BEGIN
  RETURN (SELECT unit_id FROM public.profiles WHERE id = user_id);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_user_jenjang(user_id UUID)
RETURNS UUID SECURITY DEFINER AS $$
BEGIN
  RETURN (SELECT jenjang_id FROM public.profiles WHERE id = user_id);
END;
$$ LANGUAGE plpgsql;

-- Aktifkan RLS pada seluruh tabel
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles_multi_role ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaksi_pendapatan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kamus_kegiatan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dokumen_pengajuan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_pengajuan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dompet_dana ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_trail_logs ENABLE ROW LEVEL SECURITY;


-- =========================================================================================
-- 2. OTORITAS: MANAJEMEN PENGGUNA & MANAJEMEN PERAN (Admin Only)
-- =========================================================================================
-- Menjamin hanya Administrator yang dapat mengelola profil pengguna dan peran.

-- Hapus kebijakan lama
DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated to read multi_role" ON public.profiles_multi_role;
DROP POLICY IF EXISTS "Allow service_role to manage multi_role" ON public.profiles_multi_role;
DROP POLICY IF EXISTS "Admin manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin manage multi_role" ON public.profiles_multi_role;
DROP POLICY IF EXISTS "Public read multi_role" ON public.profiles_multi_role;

-- Kebijakan baru tabel: public.profiles
CREATE POLICY "Public read profiles" ON public.profiles 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin manage profiles" ON public.profiles 
  FOR ALL TO authenticated 
  USING (public.get_user_role(auth.uid()) = 'ADMINISTRATOR')
  WITH CHECK (public.get_user_role(auth.uid()) = 'ADMINISTRATOR');

-- Kebijakan baru tabel: public.profiles_multi_role
CREATE POLICY "Public read multi_role" ON public.profiles_multi_role 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin manage multi_role" ON public.profiles_multi_role 
  FOR ALL TO authenticated 
  USING (public.get_user_role(auth.uid()) = 'ADMINISTRATOR')
  WITH CHECK (public.get_user_role(auth.uid()) = 'ADMINISTRATOR');


-- =========================================================================================
-- 3. OTORITAS: PROGRAM / REFERENSI KEGIATAN (Admin, Bendahara Pusat & Bendahara Jenjang/Unit)
-- =========================================================================================
-- Seluruh staf terautentikasi dapat membaca, namun manajemen program hanya oleh peran di atas.

DROP POLICY IF EXISTS "Public read kamus" ON public.kamus_kegiatan;
DROP POLICY IF EXISTS "Unit members can insert kamus" ON public.kamus_kegiatan;
DROP POLICY IF EXISTS "Allowed roles manage program" ON public.kamus_kegiatan;

CREATE POLICY "Public read kamus" ON public.kamus_kegiatan 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allowed roles manage program" ON public.kamus_kegiatan
  FOR ALL TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('ADMINISTRATOR', 'BENDAHARA_PUSAT', 'BENDAHARA_JENJANG', 'BENDAHARA_UNIT')
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) IN ('ADMINISTRATOR', 'BENDAHARA_PUSAT', 'BENDAHARA_JENJANG', 'BENDAHARA_UNIT')
  );


-- =========================================================================================
-- 4. OTORITAS: INPUT PENDAPATAN (Admin, Bendahara Pusat & Bendahara Jenjang/Unit)
-- =========================================================================================
-- Menghalangi staf biasa untuk melihat maupun memasukkan transaksi pendapatan kas pesantren.

DROP POLICY IF EXISTS "Public read transaksi_pendapatan" ON public.transaksi_pendapatan;
DROP POLICY IF EXISTS "Public insert transaksi_pendapatan" ON public.transaksi_pendapatan;
DROP POLICY IF EXISTS "Public update transaksi_pendapatan" ON public.transaksi_pendapatan;
DROP POLICY IF EXISTS "Public delete transaksi_pendapatan" ON public.transaksi_pendapatan;
DROP POLICY IF EXISTS "Allowed roles read pendapatan" ON public.transaksi_pendapatan;
DROP POLICY IF EXISTS "Allowed roles insert pendapatan" ON public.transaksi_pendapatan;

CREATE POLICY "Allowed roles read pendapatan" ON public.transaksi_pendapatan
  FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('ADMINISTRATOR', 'BENDAHARA_PUSAT', 'BENDAHARA_JENJANG', 'BENDAHARA_UNIT')
  );

CREATE POLICY "Allowed roles insert pendapatan" ON public.transaksi_pendapatan
  FOR INSERT TO authenticated
  WITH CHECK (
    public.get_user_role(auth.uid()) IN ('ADMINISTRATOR', 'BENDAHARA_PUSAT', 'BENDAHARA_JENJANG', 'BENDAHARA_UNIT')
  );


-- =========================================================================================
-- 5. OTORITAS: BUAT PENGAJUAN (RKA) & RIWAYAT PENGAJUAN (READ/EDIT/APPROVE)
-- =========================================================================================
-- - Pembacaan: Admin/Pusat/Pimpinan melihat semua. User unit hanya melihat unit masing-masing.
-- - Pembuatan: Hanya Admin, Bendahara Jenjang/Unit, dan Staf.
-- - Persetujuan (Update): Admin/Pusat menyetujui semua. Kepala Unit menyetujui unitnya. Submitter hanya bisa edit Draft.

DROP POLICY IF EXISTS "Pimpinan and Pusat can read all dokumen" ON public.dokumen_pengajuan;
DROP POLICY IF EXISTS "Unit members can read their unit dokumen" ON public.dokumen_pengajuan;
DROP POLICY IF EXISTS "Pembuat can insert dokumen" ON public.dokumen_pengajuan;
DROP POLICY IF EXISTS "Pembuat can update draft dokumen" ON public.dokumen_pengajuan;
DROP POLICY IF EXISTS "Pusat can update any dokumen" ON public.dokumen_pengajuan;
DROP POLICY IF EXISTS "dokumen_read_policy" ON public.dokumen_pengajuan;
DROP POLICY IF EXISTS "dokumen_insert_policy" ON public.dokumen_pengajuan;
DROP POLICY IF EXISTS "dokumen_update_policy" ON public.dokumen_pengajuan;

-- RLS: Pembacaan Dokumen Pengajuan
CREATE POLICY "dokumen_read_policy" ON public.dokumen_pengajuan
  FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('ADMINISTRATOR', 'BENDAHARA_PUSAT', 'PIMPINAN')
    OR unit_id = public.get_user_unit(auth.uid())
    OR jenjang_id = public.get_user_jenjang(auth.uid())
  );

-- RLS: Pembuatan Dokumen (Hanya Peran Tertentu + Pengisian ID Pembuat Wajib auth.uid())
CREATE POLICY "dokumen_insert_policy" ON public.dokumen_pengajuan
  FOR INSERT TO authenticated
  WITH CHECK (
    public.get_user_role(auth.uid()) IN ('ADMINISTRATOR', 'BENDAHARA_JENJANG', 'BENDAHARA_UNIT', 'STAFF_BIDANG', 'STAFF')
    AND pembuat_id = auth.uid()
  );

-- RLS: Pengubahan/Persetujuan Status Dokumen
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
    OR (pembuat_id = auth.uid())
  );


-- =========================================================================================
-- 6. OTORITAS: ITEM PENGAJUAN (Detail Baris RKA)
-- =========================================================================================
-- RLS pada item detail mengekor langsung wewenang dokumen pengajuan induknya.

DROP POLICY IF EXISTS "Pimpinan and Pusat can read all items" ON public.item_pengajuan;
DROP POLICY IF EXISTS "Unit members can read their unit items" ON public.item_pengajuan;
DROP POLICY IF EXISTS "Pembuat can insert items to their draft" ON public.item_pengajuan;
DROP POLICY IF EXISTS "Pembuat can update items in their draft" ON public.item_pengajuan;
DROP POLICY IF EXISTS "Pembuat can delete items in their draft" ON public.item_pengajuan;
DROP POLICY IF EXISTS "item_read_policy" ON public.item_pengajuan;
DROP POLICY IF EXISTS "item_manage_policy" ON public.item_pengajuan;

CREATE POLICY "item_read_policy" ON public.item_pengajuan
  FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('ADMINISTRATOR', 'BENDAHARA_PUSAT', 'PIMPINAN')
    OR dokumen_id IN (
      SELECT id FROM public.dokumen_pengajuan 
      WHERE unit_id = public.get_user_unit(auth.uid()) 
         OR jenjang_id = public.get_user_jenjang(auth.uid())
    )
  );

CREATE POLICY "item_manage_policy" ON public.item_pengajuan
  FOR ALL TO authenticated
  USING (
    dokumen_id IN (
      SELECT id FROM public.dokumen_pengajuan 
      WHERE pembuat_id = auth.uid() AND status IN ('DRAFT', 'REVISI', 'MENUNGGU_VERIFIKASI')
    )
    OR public.get_user_role(auth.uid()) IN ('ADMINISTRATOR', 'BENDAHARA_PUSAT')
  )
  WITH CHECK (
    dokumen_id IN (
      SELECT id FROM public.dokumen_pengajuan 
      WHERE pembuat_id = auth.uid() AND status IN ('DRAFT', 'REVISI', 'MENUNGGU_VERIFIKASI')
    )
    OR public.get_user_role(auth.uid()) IN ('ADMINISTRATOR', 'BENDAHARA_PUSAT')
  );


-- =========================================================================================
-- 7. OTORITAS: BUAT REALISASI ANGGARAN (LPJ) & RIWAYAT DOKUMEN REALISASI (READ/EDIT)
-- =========================================================================================
-- Catatan: Modul Realisasi LPJ di Smart Santri menggunakan konsep Header-Detail terpadu
-- yang bersandar pada tabel dokumen_pengajuan dan item_pengajuan.
-- Kebijakan keamanannya telah terproteksi secara otomatis melalui poin (5) dan (6) di atas!
-- =========================================================================================


-- =========================================================================================
-- 8. OTORITAS: SUMBER DANA DASBOR (View Only)
-- =========================================================================================
-- Menghilangkan akses baca saldo dana dari peran STAFF / STAFF_BIDANG biasa demi keamanan informasi kas.

DROP POLICY IF EXISTS "Read dompet dana" ON public.dompet_dana;
DROP POLICY IF EXISTS "Allowed roles read dompet" ON public.dompet_dana;

CREATE POLICY "Allowed roles read dompet" ON public.dompet_dana
  FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('ADMINISTRATOR', 'PIMPINAN', 'BENDAHARA_PUSAT', 'KEPALA_JENJANG', 'KEPALA_UNIT', 'BENDAHARA_JENJANG', 'BENDAHARA_UNIT')
  );


-- =========================================================================================
-- 9. OTORITAS: AKTIVITAS REAL-TIME DASBOR (View Only vs Action)
-- =========================================================================================
-- - Pembacaan: Seluruh staf terautentikasi dapat melihat log aktivitas.
-- - Action (Manipulasi/Pembersihan Log): Hanya Administrator, Bendahara Pusat, Kepala Unit, dan Bendahara Unit.

DROP POLICY IF EXISTS "Read audit trail" ON public.audit_trail_logs;
DROP POLICY IF EXISTS "Allowed roles action audit" ON public.audit_trail_logs;
DROP POLICY IF EXISTS "Public read audit" ON public.audit_trail_logs;

CREATE POLICY "Public read audit" ON public.audit_trail_logs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allowed roles action audit" ON public.audit_trail_logs
  FOR ALL TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('ADMINISTRATOR', 'BENDAHARA_PUSAT', 'KEPALA_JENJANG', 'KEPALA_UNIT', 'BENDAHARA_JENJANG', 'BENDAHARA_UNIT')
  );

-- =========================================================================================
-- SELESAI. Konfigurasi keamanan wewenang RBAC & RLS Smart Santri versi Non-Rekursif Berhasil Dibuat!
-- =========================================================================================

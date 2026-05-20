-- =========================================================================================
-- MIGRATION SCRIPT: PENGELUARAN MANUAL (SCHEMA & TRIGGER BALANCES)
-- =========================================================================================
-- Jalankan query ini di SQL Editor Supabase Anda.
-- Skrip ini akan membuat tabel "transaksi_pengeluaran", menyetel kebijakan RLS bebas kendala,
-- serta mendefinisikan pemicu database (trigger) untuk otomatis memotong saldo dompet_dana.
-- =========================================================================================

-- 1. Buat Tabel transaksi_pengeluaran
CREATE TABLE IF NOT EXISTS transaksi_pengeluaran (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tanggal DATE NOT NULL,
  unit TEXT NOT NULL,
  sumber_dana TEXT NOT NULL,
  nominal NUMERIC NOT NULL CHECK (nominal >= 0),
  metode_pencairan TEXT NOT NULL CHECK (metode_pencairan IN ('Cash', 'Transfer')),
  nama_bank TEXT DEFAULT '-',
  keterangan TEXT,
  created_by UUID, -- UUID user penginput (opsional/bebas foreign-key agar aman jika profiles kosong)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Aktifkan Row Level Security (RLS)
ALTER TABLE transaksi_pengeluaran ENABLE ROW LEVEL SECURITY;

-- 3. Hapus Kebijakan Lama jika ada
DROP POLICY IF EXISTS "Public read transaksi_pengeluaran" ON transaksi_pengeluaran;
DROP POLICY IF EXISTS "Public insert transaksi_pengeluaran" ON transaksi_pengeluaran;
DROP POLICY IF EXISTS "Public update transaksi_pengeluaran" ON transaksi_pengeluaran;
DROP POLICY IF EXISTS "Public delete transaksi_pengeluaran" ON transaksi_pengeluaran;

-- 4. Buat Kebijakan RLS Baru (Terbuka agar tidak terkendala testing lokal)
CREATE POLICY "Public read transaksi_pengeluaran" ON transaksi_pengeluaran FOR SELECT USING (true);
CREATE POLICY "Public insert transaksi_pengeluaran" ON transaksi_pengeluaran FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update transaksi_pengeluaran" ON transaksi_pengeluaran FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete transaksi_pengeluaran" ON transaksi_pengeluaran FOR DELETE USING (true);

-- 5. Buat Fungsi Sinkronisasi PL/pgSQL
CREATE OR REPLACE FUNCTION public.sync_pengeluaran_to_dompet()
RETURNS TRIGGER SECURITY DEFINER AS $$
DECLARE
  v_unit_id UUID;
  v_jenjang_id UUID;
  v_kategori TEXT;
  v_old_kategori TEXT;
  v_old_unit_id UUID;
BEGIN
  -- A. JIKA OPERASI ADALAH INSERT ATAU UPDATE
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- 1. Tentukan kategori_dana berdasarkan sumber_dana
    IF NEW.sumber_dana ILIKE '%bos%' THEN v_kategori := 'BOS';
    ELSIF NEW.sumber_dana ILIKE '%spp%' THEN v_kategori := 'SPP';
    ELSIF NEW.sumber_dana ILIKE '%zakat%' THEN v_kategori := 'ZAKAT';
    ELSIF NEW.sumber_dana ILIKE '%infaq%' THEN v_kategori := 'INFAQ';
    ELSIF NEW.sumber_dana ILIKE '%koperasi%' THEN v_kategori := 'KOPERASI';
    ELSIF NEW.sumber_dana ILIKE '%poskestren%' THEN v_kategori := 'POSKESTREN';
    ELSIF NEW.sumber_dana ILIKE '%tabungan wajib%' THEN v_kategori := 'TABUNGAN_WAJIB';
    ELSIF NEW.sumber_dana ILIKE '%tabungan%' THEN v_kategori := 'TABUNGAN_SISWA';
    ELSIF NEW.sumber_dana ILIKE '%uang saku%' THEN v_kategori := 'UANG_SAKU';
    ELSIF NEW.sumber_dana ILIKE '%kas internal%' THEN v_kategori := 'KAS_INTERNAL';
    ELSIF NEW.sumber_dana ILIKE '%iuran non-wajib%' THEN v_kategori := 'IURAN_NON_WAJIB';
    ELSE v_kategori := 'YAYASAN';
    END IF;

    -- 2. Dapatkan unit_id dan jenjang_id berdasarkan nama unit
    SELECT id, jenjang_id INTO v_unit_id, v_jenjang_id
    FROM public.unit
    WHERE name = NEW.unit;
  END IF;

  -- B. JIKA OPERASI ADALAH DELETE ATAU UPDATE
  IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
    -- 1. Tentukan kategori_dana lama
    IF OLD.sumber_dana ILIKE '%bos%' THEN v_old_kategori := 'BOS';
    ELSIF OLD.sumber_dana ILIKE '%spp%' THEN v_old_kategori := 'SPP';
    ELSIF OLD.sumber_dana ILIKE '%zakat%' THEN v_old_kategori := 'ZAKAT';
    ELSIF OLD.sumber_dana ILIKE '%infaq%' THEN v_old_kategori := 'INFAQ';
    ELSIF OLD.sumber_dana ILIKE '%koperasi%' THEN v_old_kategori := 'KOPERASI';
    ELSIF OLD.sumber_dana ILIKE '%poskestren%' THEN v_old_kategori := 'POSKESTREN';
    ELSIF OLD.sumber_dana ILIKE '%tabungan wajib%' THEN v_old_kategori := 'TABUNGAN_WAJIB';
    ELSIF OLD.sumber_dana ILIKE '%tabungan%' THEN v_old_kategori := 'TABUNGAN_SISWA';
    ELSIF OLD.sumber_dana ILIKE '%uang saku%' THEN v_old_kategori := 'UANG_SAKU';
    ELSIF OLD.sumber_dana ILIKE '%kas internal%' THEN v_old_kategori := 'KAS_INTERNAL';
    ELSIF OLD.sumber_dana ILIKE '%iuran non-wajib%' THEN v_old_kategori := 'IURAN_NON_WAJIB';
    ELSE v_old_kategori := 'YAYASAN';
    END IF;

    -- 2. Dapatkan unit_id lama berdasarkan nama unit lama
    SELECT id INTO v_old_unit_id
    FROM public.unit
    WHERE name = OLD.unit;
  END IF;

  -- C. PROSES SALDO BERDASARKAN TIPE OPERASI (PENGELUARAN MEMOTONG SALDO!)
  IF TG_OP = 'INSERT' THEN
    -- Kurangi saldo dompet jika sudah ada, buat jika belum ada (dengan saldo nol)
    IF EXISTS (SELECT 1 FROM public.dompet_dana WHERE unit_id = v_unit_id AND kategori = v_kategori::kategori_dana) THEN
      UPDATE public.dompet_dana
      SET saldo = GREATEST(0, saldo - NEW.nominal), updated_at = NOW()
      WHERE unit_id = v_unit_id AND kategori = v_kategori::kategori_dana;
    ELSIF EXISTS (SELECT 1 FROM public.dompet_dana WHERE unit_id IS NULL AND jenjang_id = v_jenjang_id AND kategori = v_kategori::kategori_dana) THEN
      UPDATE public.dompet_dana
      SET saldo = GREATEST(0, saldo - NEW.nominal), updated_at = NOW()
      WHERE unit_id IS NULL AND jenjang_id = v_jenjang_id AND kategori = v_kategori::kategori_dana;
    ELSE
      INSERT INTO public.dompet_dana (unit_id, jenjang_id, kategori, saldo)
      VALUES (v_unit_id, v_jenjang_id, v_kategori::kategori_dana, 0);
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    -- Kembalikan/tambah saldo dompet lama (restorasi)
    IF EXISTS (SELECT 1 FROM public.dompet_dana WHERE unit_id = v_old_unit_id AND kategori = v_old_kategori::kategori_dana) THEN
      UPDATE public.dompet_dana
      SET saldo = saldo + OLD.nominal, updated_at = NOW()
      WHERE unit_id = v_old_unit_id AND kategori = v_old_kategori::kategori_dana;
    END IF;

  ELSIF TG_OP = 'UPDATE' THEN
    -- 1. Kembalikan OLD ke dompet lama (tambah saldo)
    IF EXISTS (SELECT 1 FROM public.dompet_dana WHERE unit_id = v_old_unit_id AND kategori = v_old_kategori::kategori_dana) THEN
      UPDATE public.dompet_dana
      SET saldo = saldo + OLD.nominal, updated_at = NOW()
      WHERE unit_id = v_old_unit_id AND kategori = v_old_kategori::kategori_dana;
    END IF;

    -- 2. Kurangi NEW dari dompet baru (kurangi saldo)
    IF EXISTS (SELECT 1 FROM public.dompet_dana WHERE unit_id = v_unit_id AND kategori = v_kategori::kategori_dana) THEN
      UPDATE public.dompet_dana
      SET saldo = GREATEST(0, saldo - NEW.nominal), updated_at = NOW()
      WHERE unit_id = v_unit_id AND kategori = v_kategori::kategori_dana;
    ELSIF EXISTS (SELECT 1 FROM public.dompet_dana WHERE unit_id IS NULL AND jenjang_id = v_jenjang_id AND kategori = v_kategori::kategori_dana) THEN
      UPDATE public.dompet_dana
      SET saldo = GREATEST(0, saldo - NEW.nominal), updated_at = NOW()
      WHERE unit_id IS NULL AND jenjang_id = v_jenjang_id AND kategori = v_kategori::kategori_dana;
    ELSE
      INSERT INTO public.dompet_dana (unit_id, jenjang_id, kategori, saldo)
      VALUES (v_unit_id, v_jenjang_id, v_kategori::kategori_dana, 0);
    END IF;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 6. Tautkan Trigger ke Tabel transaksi_pengeluaran
DROP TRIGGER IF EXISTS trigger_sync_pengeluaran ON public.transaksi_pengeluaran;
CREATE TRIGGER trigger_sync_pengeluaran
AFTER INSERT OR UPDATE OR DELETE ON public.transaksi_pengeluaran
FOR EACH ROW EXECUTE PROCEDURE public.sync_pengeluaran_to_dompet();

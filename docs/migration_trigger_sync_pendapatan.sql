-- =========================================================================================
-- MIGRATION SCRIPT: PENDAPATAN MANUAL SYNC TRIGGER TO WALLET BALANCES (ROBUST)
-- =========================================================================================
-- Jalankan query ini di SQL Editor Supabase Anda.
-- Skrip ini akan membuat trigger di database Supabase yang secara otomatis menyinkronkan 
-- setiap input, update, atau delete pendapatan manual dari tabel "transaksi_pendapatan" 
-- ke saldo masing-masing kategori di tabel "dompet_dana".
-- =========================================================================================

-- 1. Buat Fungsi Sinkronisasi PL/pgSQL
CREATE OR REPLACE FUNCTION public.sync_pendapatan_to_dompet()
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

  -- C. PROSES SALDO BERDASARKAN TIPE OPERASI
  IF TG_OP = 'INSERT' THEN
    -- Update saldo dompet jika sudah ada, buat jika belum ada
    IF EXISTS (SELECT 1 FROM public.dompet_dana WHERE unit_id = v_unit_id AND kategori = v_kategori::kategori_dana) THEN
      UPDATE public.dompet_dana
      SET saldo = saldo + NEW.nominal, updated_at = NOW()
      WHERE unit_id = v_unit_id AND kategori = v_kategori::kategori_dana;
    ELSIF EXISTS (SELECT 1 FROM public.dompet_dana WHERE unit_id IS NULL AND jenjang_id = v_jenjang_id AND kategori = v_kategori::kategori_dana) THEN
      UPDATE public.dompet_dana
      SET saldo = saldo + NEW.nominal, updated_at = NOW()
      WHERE unit_id IS NULL AND jenjang_id = v_jenjang_id AND kategori = v_kategori::kategori_dana;
    ELSE
      INSERT INTO public.dompet_dana (unit_id, jenjang_id, kategori, saldo)
      VALUES (v_unit_id, v_jenjang_id, v_kategori::kategori_dana, NEW.nominal);
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    -- Kurangi saldo dompet lama
    IF EXISTS (SELECT 1 FROM public.dompet_dana WHERE unit_id = v_old_unit_id AND kategori = v_old_kategori::kategori_dana) THEN
      UPDATE public.dompet_dana
      SET saldo = GREATEST(0, saldo - OLD.nominal), updated_at = NOW()
      WHERE unit_id = v_old_unit_id AND kategori = v_old_kategori::kategori_dana;
    END IF;

  ELSIF TG_OP = 'UPDATE' THEN
    -- 1. Kurangi OLD dari dompet lama
    IF EXISTS (SELECT 1 FROM public.dompet_dana WHERE unit_id = v_old_unit_id AND kategori = v_old_kategori::kategori_dana) THEN
      UPDATE public.dompet_dana
      SET saldo = GREATEST(0, saldo - OLD.nominal), updated_at = NOW()
      WHERE unit_id = v_old_unit_id AND kategori = v_old_kategori::kategori_dana;
    END IF;

    -- 2. Tambah NEW ke dompet baru
    IF EXISTS (SELECT 1 FROM public.dompet_dana WHERE unit_id = v_unit_id AND kategori = v_kategori::kategori_dana) THEN
      UPDATE public.dompet_dana
      SET saldo = saldo + NEW.nominal, updated_at = NOW()
      WHERE unit_id = v_unit_id AND kategori = v_kategori::kategori_dana;
    ELSIF EXISTS (SELECT 1 FROM public.dompet_dana WHERE unit_id IS NULL AND jenjang_id = v_jenjang_id AND kategori = v_kategori::kategori_dana) THEN
      UPDATE public.dompet_dana
      SET saldo = saldo + NEW.nominal, updated_at = NOW()
      WHERE unit_id IS NULL AND jenjang_id = v_jenjang_id AND kategori = v_kategori::kategori_dana;
    ELSE
      INSERT INTO public.dompet_dana (unit_id, jenjang_id, kategori, saldo)
      VALUES (v_unit_id, v_jenjang_id, v_kategori::kategori_dana, NEW.nominal);
    END IF;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 2. Tautkan Trigger ke Tabel transaksi_pendapatan
DROP TRIGGER IF EXISTS trigger_sync_pendapatan ON public.transaksi_pendapatan;
CREATE TRIGGER trigger_sync_pendapatan
AFTER INSERT OR UPDATE OR DELETE ON public.transaksi_pendapatan
FOR EACH ROW EXECUTE PROCEDURE public.sync_pendapatan_to_dompet();

-- =========================================================================================
-- SELESAI: Sinkronisasi Pemasukan Manual ke Dompet Dana Siap Digunakan Secara Otomatis!
-- =========================================================================================

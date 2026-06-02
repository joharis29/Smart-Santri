-- Fix trigger sinkronisasi pengeluaran agar mengizinkan angka minus dan menggunakan kolom name yang benar
CREATE OR REPLACE FUNCTION public.sync_pengeluaran_to_dompet()
RETURNS TRIGGER SECURITY DEFINER AS $$
DECLARE
  v_unit_id UUID;
  v_jenjang_id UUID;
  v_kategori TEXT;
  v_old_kategori TEXT;
  v_old_unit_id UUID;
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
      IF NEW.sumber_dana = 'SPP' OR NEW.sumber_dana = 'Dana SPP' THEN v_kategori = 'SPP';
      ELSIF NEW.sumber_dana = 'Dana BOS' THEN v_kategori = 'BOS';
      ELSIF NEW.sumber_dana = 'Dana Zakat' THEN v_kategori = 'ZAKAT';
      ELSIF NEW.sumber_dana = 'Dana Infaq' OR NEW.sumber_dana = 'Infaq Siswa' THEN v_kategori = 'INFAQ';
      ELSIF NEW.sumber_dana = 'Tabungan Siswa' THEN v_kategori = 'TABUNGAN_SISWA';
      ELSIF NEW.sumber_dana = 'Tabungan Wajib' THEN v_kategori = 'TABUNGAN_WAJIB';
      ELSIF NEW.sumber_dana = 'Uang Saku' THEN v_kategori = 'UANG_SAKU';
      ELSIF NEW.sumber_dana = 'Iuran Non-Wajib' THEN v_kategori = 'IURAN_NON_WAJIB';
      ELSIF NEW.sumber_dana = 'Kas Internal' THEN v_kategori = 'KAS_INTERNAL';
      ELSE v_kategori = 'YAYASAN';
      END IF;

      SELECT id INTO v_jenjang_id FROM jenjang WHERE name = NEW.unit LIMIT 1;
      IF v_jenjang_id IS NOT NULL THEN v_unit_id = v_jenjang_id;
      ELSE SELECT id INTO v_unit_id FROM unit WHERE name = NEW.unit LIMIT 1; END IF;

      IF TG_OP = 'UPDATE' THEN
          IF OLD.sumber_dana = 'SPP' OR OLD.sumber_dana = 'Dana SPP' THEN v_old_kategori = 'SPP';
          ELSIF OLD.sumber_dana = 'Dana BOS' THEN v_old_kategori = 'BOS';
          ELSIF OLD.sumber_dana = 'Dana Zakat' THEN v_old_kategori = 'ZAKAT';
          ELSIF OLD.sumber_dana = 'Dana Infaq' OR OLD.sumber_dana = 'Infaq Siswa' THEN v_old_kategori = 'INFAQ';
          ELSIF OLD.sumber_dana = 'Tabungan Siswa' THEN v_old_kategori = 'TABUNGAN_SISWA';
          ELSIF OLD.sumber_dana = 'Tabungan Wajib' THEN v_old_kategori = 'TABUNGAN_WAJIB';
          ELSIF OLD.sumber_dana = 'Uang Saku' THEN v_old_kategori = 'UANG_SAKU';
          ELSIF OLD.sumber_dana = 'Iuran Non-Wajib' THEN v_old_kategori = 'IURAN_NON_WAJIB';
          ELSIF OLD.sumber_dana = 'Kas Internal' THEN v_old_kategori = 'KAS_INTERNAL';
          ELSE v_old_kategori = 'YAYASAN';
          END IF;

          SELECT id INTO v_jenjang_id FROM jenjang WHERE name = OLD.unit LIMIT 1;
          IF v_jenjang_id IS NOT NULL THEN v_old_unit_id = v_jenjang_id;
          ELSE SELECT id INTO v_old_unit_id FROM unit WHERE name = OLD.unit LIMIT 1; END IF;

          IF v_old_unit_id IS NULL THEN
              UPDATE dompet_dana SET saldo = saldo + OLD.nominal, updated_at = NOW() WHERE unit_id IS NULL AND kategori = v_old_kategori::kategori_dana;
          ELSE
              UPDATE dompet_dana SET saldo = saldo + OLD.nominal, updated_at = NOW() WHERE unit_id = v_old_unit_id AND kategori = v_old_kategori::kategori_dana;
          END IF;
      END IF;

      IF v_unit_id IS NULL THEN
          UPDATE dompet_dana SET saldo = saldo - NEW.nominal, updated_at = NOW() WHERE unit_id IS NULL AND kategori = v_kategori::kategori_dana;
      ELSE
          UPDATE dompet_dana SET saldo = saldo - NEW.nominal, updated_at = NOW() WHERE unit_id = v_unit_id AND kategori = v_kategori::kategori_dana;
      END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
      IF OLD.sumber_dana = 'SPP' OR OLD.sumber_dana = 'Dana SPP' THEN v_old_kategori = 'SPP';
      ELSIF OLD.sumber_dana = 'Dana BOS' THEN v_old_kategori = 'BOS';
      ELSIF OLD.sumber_dana = 'Dana Zakat' THEN v_old_kategori = 'ZAKAT';
      ELSIF OLD.sumber_dana = 'Dana Infaq' OR OLD.sumber_dana = 'Infaq Siswa' THEN v_old_kategori = 'INFAQ';
      ELSIF OLD.sumber_dana = 'Tabungan Siswa' THEN v_old_kategori = 'TABUNGAN_SISWA';
      ELSIF OLD.sumber_dana = 'Tabungan Wajib' THEN v_old_kategori = 'TABUNGAN_WAJIB';
      ELSIF OLD.sumber_dana = 'Uang Saku' THEN v_old_kategori = 'UANG_SAKU';
      ELSIF OLD.sumber_dana = 'Iuran Non-Wajib' THEN v_old_kategori = 'IURAN_NON_WAJIB';
      ELSIF OLD.sumber_dana = 'Kas Internal' THEN v_old_kategori = 'KAS_INTERNAL';
      ELSE v_old_kategori = 'YAYASAN';
      END IF;

      SELECT id INTO v_jenjang_id FROM jenjang WHERE name = OLD.unit LIMIT 1;
      IF v_jenjang_id IS NOT NULL THEN v_old_unit_id = v_jenjang_id;
      ELSE SELECT id INTO v_old_unit_id FROM unit WHERE name = OLD.unit LIMIT 1; END IF;

      IF v_old_unit_id IS NULL THEN
          UPDATE dompet_dana SET saldo = saldo + OLD.nominal, updated_at = NOW() WHERE unit_id IS NULL AND kategori = v_old_kategori::kategori_dana;
      ELSE
          UPDATE dompet_dana SET saldo = saldo + OLD.nominal, updated_at = NOW() WHERE unit_id = v_old_unit_id AND kategori = v_old_kategori::kategori_dana;
      END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;


-- Fix trigger sinkronisasi pendapatan agar mengizinkan angka minus dan menggunakan kolom name yang benar
CREATE OR REPLACE FUNCTION public.sync_pendapatan_to_dompet()
RETURNS TRIGGER SECURITY DEFINER AS $$
DECLARE
  v_unit_id UUID;
  v_jenjang_id UUID;
  v_kategori TEXT;
  v_old_kategori TEXT;
  v_old_unit_id UUID;
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
      IF NEW.sumber_dana = 'SPP' OR NEW.sumber_dana = 'Dana SPP' THEN v_kategori = 'SPP';
      ELSIF NEW.sumber_dana = 'Dana BOS' THEN v_kategori = 'BOS';
      ELSIF NEW.sumber_dana = 'Dana Zakat' THEN v_kategori = 'ZAKAT';
      ELSIF NEW.sumber_dana = 'Dana Infaq' OR NEW.sumber_dana = 'Infaq Siswa' THEN v_kategori = 'INFAQ';
      ELSIF NEW.sumber_dana = 'Tabungan Siswa' THEN v_kategori = 'TABUNGAN_SISWA';
      ELSIF NEW.sumber_dana = 'Tabungan Wajib' THEN v_kategori = 'TABUNGAN_WAJIB';
      ELSIF NEW.sumber_dana = 'Uang Saku' THEN v_kategori = 'UANG_SAKU';
      ELSIF NEW.sumber_dana = 'Iuran Non-Wajib' THEN v_kategori = 'IURAN_NON_WAJIB';
      ELSIF NEW.sumber_dana = 'Kas Internal' THEN v_kategori = 'KAS_INTERNAL';
      ELSE v_kategori = 'YAYASAN';
      END IF;

      SELECT id INTO v_jenjang_id FROM jenjang WHERE name = NEW.unit LIMIT 1;
      IF v_jenjang_id IS NOT NULL THEN v_unit_id = v_jenjang_id;
      ELSE SELECT id INTO v_unit_id FROM unit WHERE name = NEW.unit LIMIT 1; END IF;

      IF TG_OP = 'UPDATE' THEN
          IF OLD.sumber_dana = 'SPP' OR OLD.sumber_dana = 'Dana SPP' THEN v_old_kategori = 'SPP';
          ELSIF OLD.sumber_dana = 'Dana BOS' THEN v_old_kategori = 'BOS';
          ELSIF OLD.sumber_dana = 'Dana Zakat' THEN v_old_kategori = 'ZAKAT';
          ELSIF OLD.sumber_dana = 'Dana Infaq' OR OLD.sumber_dana = 'Infaq Siswa' THEN v_old_kategori = 'INFAQ';
          ELSIF OLD.sumber_dana = 'Tabungan Siswa' THEN v_old_kategori = 'TABUNGAN_SISWA';
          ELSIF OLD.sumber_dana = 'Tabungan Wajib' THEN v_old_kategori = 'TABUNGAN_WAJIB';
          ELSIF OLD.sumber_dana = 'Uang Saku' THEN v_old_kategori = 'UANG_SAKU';
          ELSIF OLD.sumber_dana = 'Iuran Non-Wajib' THEN v_old_kategori = 'IURAN_NON_WAJIB';
          ELSIF OLD.sumber_dana = 'Kas Internal' THEN v_old_kategori = 'KAS_INTERNAL';
          ELSE v_old_kategori = 'YAYASAN';
          END IF;

          SELECT id INTO v_jenjang_id FROM jenjang WHERE name = OLD.unit LIMIT 1;
          IF v_jenjang_id IS NOT NULL THEN v_old_unit_id = v_jenjang_id;
          ELSE SELECT id INTO v_old_unit_id FROM unit WHERE name = OLD.unit LIMIT 1; END IF;

          IF v_old_unit_id IS NULL THEN
              UPDATE dompet_dana SET saldo = saldo - OLD.nominal, updated_at = NOW() WHERE unit_id IS NULL AND kategori = v_old_kategori::kategori_dana;
          ELSE
              UPDATE dompet_dana SET saldo = saldo - OLD.nominal, updated_at = NOW() WHERE unit_id = v_old_unit_id AND kategori = v_old_kategori::kategori_dana;
          END IF;
      END IF;

      IF v_unit_id IS NULL THEN
          UPDATE dompet_dana SET saldo = saldo + NEW.nominal, updated_at = NOW() WHERE unit_id IS NULL AND kategori = v_kategori::kategori_dana;
      ELSE
          UPDATE dompet_dana SET saldo = saldo + NEW.nominal, updated_at = NOW() WHERE unit_id = v_unit_id AND kategori = v_kategori::kategori_dana;
      END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
      IF OLD.sumber_dana = 'SPP' OR OLD.sumber_dana = 'Dana SPP' THEN v_old_kategori = 'SPP';
      ELSIF OLD.sumber_dana = 'Dana BOS' THEN v_old_kategori = 'BOS';
      ELSIF OLD.sumber_dana = 'Dana Zakat' THEN v_old_kategori = 'ZAKAT';
      ELSIF OLD.sumber_dana = 'Dana Infaq' OR OLD.sumber_dana = 'Infaq Siswa' THEN v_old_kategori = 'INFAQ';
      ELSIF OLD.sumber_dana = 'Tabungan Siswa' THEN v_old_kategori = 'TABUNGAN_SISWA';
      ELSIF OLD.sumber_dana = 'Tabungan Wajib' THEN v_old_kategori = 'TABUNGAN_WAJIB';
      ELSIF OLD.sumber_dana = 'Uang Saku' THEN v_old_kategori = 'UANG_SAKU';
      ELSIF OLD.sumber_dana = 'Iuran Non-Wajib' THEN v_old_kategori = 'IURAN_NON_WAJIB';
      ELSIF OLD.sumber_dana = 'Kas Internal' THEN v_old_kategori = 'KAS_INTERNAL';
      ELSE v_old_kategori = 'YAYASAN';
      END IF;

      SELECT id INTO v_jenjang_id FROM jenjang WHERE name = OLD.unit LIMIT 1;
      IF v_jenjang_id IS NOT NULL THEN v_old_unit_id = v_jenjang_id;
      ELSE SELECT id INTO v_old_unit_id FROM unit WHERE name = OLD.unit LIMIT 1; END IF;

      IF v_old_unit_id IS NULL THEN
          UPDATE dompet_dana SET saldo = saldo - OLD.nominal, updated_at = NOW() WHERE unit_id IS NULL AND kategori = v_old_kategori::kategori_dana;
      ELSE
          UPDATE dompet_dana SET saldo = saldo - OLD.nominal, updated_at = NOW() WHERE unit_id = v_old_unit_id AND kategori = v_old_kategori::kategori_dana;
      END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

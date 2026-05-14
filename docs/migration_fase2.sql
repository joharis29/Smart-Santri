-- MIGRATION SCRIPT FASE 2: KONSEP HEADER-DETAIL

-- 1. Hapus tabel lama yang tidak jadi digunakan (karena akan diganti konsep Header-Detail)
DROP TABLE IF EXISTS realisasi_dana CASCADE;
DROP TABLE IF EXISTS pengajuan_dana CASCADE;

-- 2. Buat tabel kamus_kegiatan (Untuk fitur Creatable Dropdown)
CREATE TABLE kamus_kegiatan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES unit(id) ON DELETE CASCADE,
  judul_kegiatan TEXT NOT NULL,
  kategori_coa TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(unit_id, judul_kegiatan)
);

-- 3. Buat tabel dokumen_pengajuan (Header Dokumen / Keranjang)
CREATE TABLE dokumen_pengajuan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pembuat_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  jenjang_id UUID REFERENCES jenjang(id) ON DELETE SET NULL,
  unit_id UUID REFERENCES unit(id) ON DELETE SET NULL,
  nomor_dokumen TEXT UNIQUE,
  periode_bulan INTEGER NOT NULL CHECK (periode_bulan BETWEEN 1 AND 12),
  periode_tahun INTEGER NOT NULL,
  total_nominal NUMERIC NOT NULL DEFAULT 0 CHECK (total_nominal >= 0),
  status status_pengajuan NOT NULL DEFAULT 'DRAFT',
  catatan_penolakan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Buat tabel item_pengajuan (Rincian Kegiatan di dalam Dokumen)
CREATE TABLE item_pengajuan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dokumen_id UUID NOT NULL REFERENCES dokumen_pengajuan(id) ON DELETE CASCADE,
  kategori_coa TEXT NOT NULL,
  sumber_dana TEXT NOT NULL,
  judul_kegiatan TEXT NOT NULL,
  nominal NUMERIC NOT NULL CHECK (nominal > 0),
  tanggal_kebutuhan DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Aktifkan Row Level Security (RLS)
ALTER TABLE kamus_kegiatan ENABLE ROW LEVEL SECURITY;
ALTER TABLE dokumen_pengajuan ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_pengajuan ENABLE ROW LEVEL SECURITY;

-- 6. Aturan Kebijakan (Policies) kamus_kegiatan
CREATE POLICY "Public read kamus" ON kamus_kegiatan FOR SELECT TO authenticated USING (true);
CREATE POLICY "Unit members can insert kamus" ON kamus_kegiatan FOR INSERT TO authenticated
WITH CHECK (unit_id = (SELECT unit_id FROM profiles WHERE id = auth.uid()));

-- 7. Aturan Kebijakan (Policies) dokumen_pengajuan
CREATE POLICY "Pimpinan and Pusat can read all dokumen" ON dokumen_pengajuan FOR SELECT TO authenticated
USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('PIMPINAN', 'BENDAHARA_PUSAT'));

CREATE POLICY "Unit members can read their unit dokumen" ON dokumen_pengajuan FOR SELECT TO authenticated
USING (unit_id = (SELECT unit_id FROM profiles WHERE id = auth.uid()) OR jenjang_id = (SELECT jenjang_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Pembuat can insert dokumen" ON dokumen_pengajuan FOR INSERT TO authenticated
WITH CHECK (pembuat_id = auth.uid());

CREATE POLICY "Pembuat can update draft dokumen" ON dokumen_pengajuan FOR UPDATE TO authenticated
USING (pembuat_id = auth.uid() AND status = 'DRAFT');

CREATE POLICY "Pusat can update any dokumen" ON dokumen_pengajuan FOR UPDATE TO authenticated
USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'BENDAHARA_PUSAT');

-- 8. Aturan Kebijakan (Policies) item_pengajuan
CREATE POLICY "Pimpinan and Pusat can read all items" ON item_pengajuan FOR SELECT TO authenticated
USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('PIMPINAN', 'BENDAHARA_PUSAT'));

CREATE POLICY "Unit members can read their unit items" ON item_pengajuan FOR SELECT TO authenticated
USING (dokumen_id IN (SELECT id FROM dokumen_pengajuan WHERE unit_id = (SELECT unit_id FROM profiles WHERE id = auth.uid())));

CREATE POLICY "Pembuat can insert items to their draft" ON item_pengajuan FOR INSERT TO authenticated
WITH CHECK (
  dokumen_id IN (SELECT id FROM dokumen_pengajuan WHERE pembuat_id = auth.uid() AND status = 'DRAFT')
);

CREATE POLICY "Pembuat can update items in their draft" ON item_pengajuan FOR UPDATE TO authenticated
USING (
  dokumen_id IN (SELECT id FROM dokumen_pengajuan WHERE pembuat_id = auth.uid() AND status = 'DRAFT')
);

CREATE POLICY "Pembuat can delete items in their draft" ON item_pengajuan FOR DELETE TO authenticated
USING (
  dokumen_id IN (SELECT id FROM dokumen_pengajuan WHERE pembuat_id = auth.uid() AND status = 'DRAFT')
);

-- 9. Trigger Updated_at
CREATE TRIGGER update_dokumen_pengajuan_modtime BEFORE UPDATE ON dokumen_pengajuan FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

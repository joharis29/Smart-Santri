-- ENUMS
CREATE TYPE user_role AS ENUM ('PIMPINAN', 'BENDAHARA_PUSAT', 'KEPALA_UNIT', 'BENDAHARA_UNIT', 'STAFF');
CREATE TYPE status_pengajuan AS ENUM ('DRAFT', 'MENUNGGU_KEPALA', 'MENUNGGU_PUSAT', 'DISETUJUI', 'DITOLAK', 'DICAIRKAN', 'SELESAI_REALISASI');
CREATE TYPE kategori_dana AS ENUM ('BOS', 'YAYASAN', 'SPP', 'ZAKAT', 'KOPERASI', 'POSKESTREN', 'TABUNGAN_WAJIB', 'TABUNGAN_SISWA', 'INFAQ', 'IURAN_NON_WAJIB', 'KAS_INTERNAL', 'UANG_SAKU');
CREATE TYPE status_audit_ai AS ENUM ('PENDING', 'AMAN', 'ANOMALI');

-- TABLES
CREATE TABLE jenjang (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE unit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jenjang_id UUID REFERENCES jenjang(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'STAFF',
  full_name TEXT NOT NULL,
  jenjang_id UUID REFERENCES jenjang(id) ON DELETE SET NULL,
  unit_id UUID REFERENCES unit(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE dompet_dana (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jenjang_id UUID REFERENCES jenjang(id) ON DELETE SET NULL,
  unit_id UUID REFERENCES unit(id) ON DELETE SET NULL,
  kategori kategori_dana NOT NULL,
  saldo NUMERIC NOT NULL DEFAULT 0 CHECK (saldo >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pengajuan_dana (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pemohon_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  jenjang_id UUID REFERENCES jenjang(id) ON DELETE SET NULL,
  unit_id UUID REFERENCES unit(id) ON DELETE SET NULL,
  judul_kegiatan TEXT NOT NULL,
  nominal_pengajuan NUMERIC NOT NULL CHECK (nominal_pengajuan > 0),
  status status_pengajuan NOT NULL DEFAULT 'DRAFT',
  catatan_penolakan TEXT,
  tanggal_kebutuhan DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE realisasi_dana (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pengajuan_id UUID NOT NULL REFERENCES pengajuan_dana(id) ON DELETE CASCADE,
  pemohon_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  nominal_realisasi NUMERIC NOT NULL CHECK (nominal_realisasi >= 0),
  sumber_dana_ids JSONB,
  narasi_penggunaan TEXT NOT NULL,
  bukti_nota_urls TEXT[] NOT NULL,
  status_audit_ai status_audit_ai NOT NULL DEFAULT 'PENDING',
  catatan_ai TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audit_trail_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE jenjang ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE dompet_dana ENABLE ROW LEVEL SECURITY;
ALTER TABLE pengajuan_dana ENABLE ROW LEVEL SECURITY;
ALTER TABLE realisasi_dana ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_trail_logs ENABLE ROW LEVEL SECURITY;

-- POLICIES: jenjang & unit (Everyone authenticated can read)
CREATE POLICY "Public read jenjang" ON jenjang FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read unit" ON unit FOR SELECT TO authenticated USING (true);

-- POLICIES: profiles
CREATE POLICY "Public read profiles" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- POLICIES: dompet_dana
CREATE POLICY "Read dompet dana" ON dompet_dana FOR SELECT TO authenticated USING (true);

-- POLICIES: pengajuan_dana
CREATE POLICY "Pimpinan and Pusat can read all pengajuan" ON pengajuan_dana FOR SELECT TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('PIMPINAN', 'BENDAHARA_PUSAT')
);

CREATE POLICY "Unit members can read their unit pengajuan" ON pengajuan_dana FOR SELECT TO authenticated
USING (
  unit_id = (SELECT unit_id FROM profiles WHERE id = auth.uid()) 
  OR jenjang_id = (SELECT jenjang_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Unit members can insert pengajuan" ON pengajuan_dana FOR INSERT TO authenticated
WITH CHECK (
  pemohon_id = auth.uid()
);

CREATE POLICY "Pemohon can update draft pengajuan" ON pengajuan_dana FOR UPDATE TO authenticated
USING (
  pemohon_id = auth.uid() AND status = 'DRAFT'
);

CREATE POLICY "Pusat can update any pengajuan" ON pengajuan_dana FOR UPDATE TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'BENDAHARA_PUSAT'
);

CREATE POLICY "Kepala Unit can update their unit pengajuan status" ON pengajuan_dana FOR UPDATE TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'KEPALA_UNIT'
  AND (unit_id = (SELECT unit_id FROM profiles WHERE id = auth.uid()) OR jenjang_id = (SELECT jenjang_id FROM profiles WHERE id = auth.uid()))
);

-- POLICIES: realisasi_dana
CREATE POLICY "Pimpinan and Pusat can read all realisasi" ON realisasi_dana FOR SELECT TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('PIMPINAN', 'BENDAHARA_PUSAT')
);

CREATE POLICY "Unit members can read their unit realisasi" ON realisasi_dana FOR SELECT TO authenticated
USING (
  pemohon_id IN (SELECT id FROM profiles WHERE unit_id = (SELECT unit_id FROM profiles WHERE id = auth.uid()))
);

CREATE POLICY "Pemohon can insert realisasi" ON realisasi_dana FOR INSERT TO authenticated
WITH CHECK (
  pemohon_id = auth.uid()
);

-- POLICIES: audit_trail_logs (READ ONLY for Pimpinan and Pusat)
CREATE POLICY "Read audit trail" ON audit_trail_logs FOR SELECT TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('PIMPINAN', 'BENDAHARA_PUSAT')
);
-- No insert/update/delete policies for audit_trail_logs from client, should be handled by trigger!

-- TRIGGERS FOR UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_dompet_dana_modtime BEFORE UPDATE ON dompet_dana FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_pengajuan_dana_modtime BEFORE UPDATE ON pengajuan_dana FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

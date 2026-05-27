-- Membuat tabel program_kegiatan untuk Referensi RKA
CREATE TABLE IF NOT EXISTS program_kegiatan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit TEXT NOT NULL,
  bidang TEXT NOT NULL,
  standar TEXT,
  program TEXT NOT NULL,
  nama_kegiatan TEXT NOT NULL,
  detail_kegiatan TEXT,
  pelaksana TEXT,
  sasaran TEXT,
  prioritas TEXT,
  indikator TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aktifkan Row Level Security (RLS)
ALTER TABLE program_kegiatan ENABLE ROW LEVEL SECURITY;

-- Aturan Kebijakan (Policies)
CREATE POLICY "Public read program_kegiatan" ON program_kegiatan FOR SELECT TO authenticated USING (true);
CREATE POLICY "All users can insert program_kegiatan" ON program_kegiatan FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "All users can update program_kegiatan" ON program_kegiatan FOR UPDATE TO authenticated USING (true);
CREATE POLICY "All users can delete program_kegiatan" ON program_kegiatan FOR DELETE TO authenticated USING (true);

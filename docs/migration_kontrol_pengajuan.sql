-- =========================================================================================
-- MIGRATION SCRIPT: KONTROL PENGAJUAN RKA & LPJ (GLOBAL & PER UNIT)
-- =========================================================================================
-- Jalankan query ini di SQL Editor Supabase Anda.
-- Skrip ini akan membuat tabel "kontrol_pengajuan", mengaktifkan RLS, 
-- serta mempopulasikan bendera kontrol default aktif (TRUE) untuk GLOBAL dan semua unit.
-- =========================================================================================

-- 1. Buat Tabel kontrol_pengajuan jika belum ada
CREATE TABLE IF NOT EXISTS kontrol_pengajuan (
  unit_name TEXT PRIMARY KEY,
  rka_aktif BOOLEAN DEFAULT TRUE NOT NULL,
  lpj_aktif BOOLEAN DEFAULT TRUE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_by UUID
);

-- 2. Aktifkan Keamanan Tingkat Baris (RLS)
ALTER TABLE kontrol_pengajuan ENABLE ROW LEVEL SECURITY;

-- 3. Hapus policy lama jika ada untuk menghindari konflik
DROP POLICY IF EXISTS "Allow authenticated users to read kontrol_fitur" ON kontrol_pengajuan;
DROP POLICY IF EXISTS "Allow authenticated users to update kontrol_fitur" ON kontrol_pengajuan;
DROP POLICY IF EXISTS "Allow public read kontrol_fitur" ON kontrol_pengajuan;
DROP POLICY IF EXISTS "Allow public update kontrol_fitur" ON kontrol_pengajuan;

-- 4. Buat Kebijakan Akses RLS yang Bebas Kendala
CREATE POLICY "Allow public read kontrol_fitur" 
  ON kontrol_pengajuan 
  FOR SELECT 
  USING (true);

CREATE POLICY "Allow public update kontrol_fitur" 
  ON kontrol_pengajuan 
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- 5. Masukkan Data Konfigurasi Inisial Awal (Default: Aktif/True)
INSERT INTO kontrol_pengajuan (unit_name, rka_aktif, lpj_aktif) VALUES 
  ('GLOBAL', TRUE, TRUE),
  ('Pusat (Yayasan)', TRUE, TRUE),
  ('SDIT 1', TRUE, TRUE),
  ('SDIT 2', TRUE, TRUE),
  ('MTS', TRUE, TRUE),
  ('MA', TRUE, TRUE),
  ('TK', TRUE, TRUE)
ON CONFLICT (unit_name) DO NOTHING;

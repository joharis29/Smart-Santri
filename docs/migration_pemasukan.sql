-- MIGRATION SCRIPT: PENDAPATAN MANUAL (UPDATED RLS FOR LOCAL TESTING)
-- Jalankan query ini di SQL Editor Supabase Anda untuk memperbarui kebijakan tabel transaksi_pendapatan.

-- 1. Buat Tabel transaksi_pendapatan (Jika Belum Ada)
CREATE TABLE IF NOT EXISTS transaksi_pendapatan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tanggal DATE NOT NULL,
  unit TEXT NOT NULL,
  sumber_dana TEXT NOT NULL,
  nominal NUMERIC NOT NULL CHECK (nominal >= 0),
  jenis_penerimaan TEXT NOT NULL CHECK (jenis_penerimaan IN ('Cash', 'Transfer')),
  nama_bank TEXT DEFAULT '-',
  keterangan TEXT,
  created_by UUID, -- UUID user yang menginput (opsional/bebas foreign-key agar aman jika tabel profiles kosong)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Aktifkan Row Level Security (RLS)
ALTER TABLE transaksi_pendapatan ENABLE ROW LEVEL SECURITY;

-- 3. Hapus Kebijakan Lama jika ada
DROP POLICY IF EXISTS "Public read transaksi_pendapatan" ON transaksi_pendapatan;
DROP POLICY IF EXISTS "Public insert transaksi_pendapatan" ON transaksi_pendapatan;

-- 4. Buat Kebijakan RLS Baru (Terbuka untuk semua role termasuk Anon agar tidak terkendala saat testing lokal)
-- Mengizinkan pembacaan data
CREATE POLICY "Public read transaksi_pendapatan" ON transaksi_pendapatan
  FOR SELECT USING (true);

-- Mengizinkan pemasukan data
CREATE POLICY "Public insert transaksi_pendapatan" ON transaksi_pendapatan
  FOR INSERT WITH CHECK (true);

-- 5. Hapus Kebijakan Update & Delete Lama jika ada
DROP POLICY IF EXISTS "Public update transaksi_pendapatan" ON transaksi_pendapatan;
DROP POLICY IF EXISTS "Public delete transaksi_pendapatan" ON transaksi_pendapatan;

-- Mengizinkan pengubahan data (UPDATE)
CREATE POLICY "Public update transaksi_pendapatan" ON transaksi_pendapatan
  FOR UPDATE USING (true) WITH CHECK (true);

-- Mengizinkan penghapusan data (DELETE)
CREATE POLICY "Public delete transaksi_pendapatan" ON transaksi_pendapatan
  FOR DELETE USING (true);

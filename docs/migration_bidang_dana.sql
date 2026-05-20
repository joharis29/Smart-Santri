-- =========================================================================================
-- MIGRATION SCRIPT: MANAJEMEN DINAMIS BIDANG & SUMBER DANA PER UNIT
-- =========================================================================================
-- Jalankan query ini di SQL Editor Supabase Anda.
-- Skrip ini akan membuat tabel "pengaturan_bidang" dan "pengaturan_sumber_dana",
-- mengaktifkan Row Level Security (RLS), serta mengisi seluruh data inisial bawaan.
-- =========================================================================================

-- 1. Buat Tabel pengaturan_bidang jika belum ada
CREATE TABLE IF NOT EXISTS pengaturan_bidang (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_name TEXT NOT NULL,
  nama_bidang TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(unit_name, nama_bidang)
);

-- 2. Buat Tabel pengaturan_sumber_dana jika belum ada
CREATE TABLE IF NOT EXISTS pengaturan_sumber_dana (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_name TEXT NOT NULL,
  nama_sumber_dana TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(unit_name, nama_sumber_dana)
);

-- 3. Aktifkan Row Level Security (RLS)
ALTER TABLE pengaturan_bidang ENABLE ROW LEVEL SECURITY;
ALTER TABLE pengaturan_sumber_dana ENABLE ROW LEVEL SECURITY;

-- 4. Hapus policy lama jika ada untuk menghindari konflik
DROP POLICY IF EXISTS "Allow public read bidang" ON pengaturan_bidang;
DROP POLICY IF EXISTS "Allow public all bidang" ON pengaturan_bidang;
DROP POLICY IF EXISTS "Allow public read dana" ON pengaturan_sumber_dana;
DROP POLICY IF EXISTS "Allow public all dana" ON pengaturan_sumber_dana;

-- 5. Buat Kebijakan Akses RLS yang Bebas Kendala
CREATE POLICY "Allow public read bidang" ON pengaturan_bidang FOR SELECT USING (true);
CREATE POLICY "Allow public all bidang" ON pengaturan_bidang FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read dana" ON pengaturan_sumber_dana FOR SELECT USING (true);
CREATE POLICY "Allow public all dana" ON pengaturan_sumber_dana FOR ALL USING (true) WITH CHECK (true);

-- 6. Inisialisasi Data Default: Bidang (Departemen)
INSERT INTO pengaturan_bidang (unit_name, nama_bidang) VALUES
  -- Pusat (Yayasan)
  ('Pusat (Yayasan)', 'Kesekretariatan'),
  ('Pusat (Yayasan)', 'Pendidikan'),
  ('Pusat (Yayasan)', 'Sumber Daya Insani'),
  ('Pusat (Yayasan)', 'Kesejahteraan Sosial'),
  ('Pusat (Yayasan)', 'Sarana'),
  ('Pusat (Yayasan)', 'Keuangan'),
  ('Pusat (Yayasan)', 'Penelitian Dan Pengembangan'),
  
  -- TK
  ('TK', 'Kurikulum'),
  ('TK', 'Sarana'),
  ('TK', 'Humas'),
  ('TK', 'Kesejahteraan'),
  ('TK', 'Tata Usaha (TU)'),
  ('TK', 'Bendahara'),
  ('TK', 'Bimbingan & Konseling (BK)'),
  ('TK', 'Kesantrian'),
  ('TK', 'Mudir'),

  -- Diniyah
  ('Diniyah', 'Kurikulum'),
  ('Diniyah', 'Sarana'),
  ('Diniyah', 'Humas'),
  ('Diniyah', 'Bendahara'),
  ('Diniyah', 'Kesantrian'),

  -- SDIT 1
  ('SDIT 1', 'Kurikulum'),
  ('SDIT 1', 'Tilawah & Hifdzil Qur''an (THQ)'),
  ('SDIT 1', 'Humas'),
  ('SDIT 1', 'Kesiswaan'),
  ('SDIT 1', 'Sarana'),
  ('SDIT 1', 'Tenaga Administari Sekolah (TAS)'),
  ('SDIT 1', 'Bendahara'),
  ('SDIT 1', 'Kesekretariatan'),

  -- SDIT 2
  ('SDIT 2', 'Kurikulum'),
  ('SDIT 2', 'Tilawah & Hifdzil Qur''an (THQ)'),
  ('SDIT 2', 'Humas'),
  ('SDIT 2', 'Kesiswaan'),
  ('SDIT 2', 'Sarana'),
  ('SDIT 2', 'Tenaga Administari Sekolah (TAS)'),
  ('SDIT 2', 'Bendahara'),
  ('SDIT 2', 'Kesekretariatan'),

  -- MTs
  ('MTs', 'Kurikulum'),
  ('MTs', 'Tilawah & Hifdzil Qur''an (THQ)'),
  ('MTs', 'Humas'),
  ('MTs', 'Kesantrian'),
  ('MTs', 'Sarana'),
  ('MTs', 'Perpustakaan'),
  ('MTs', 'Bimbingan & Konseling (BK)'),
  ('MTs', 'Kordinator Ekstrakurikuler'),
  ('MTs', 'Lembaga Bahasa'),
  ('MTs', 'Kordinator Pengembangan Prestasi'),
  ('MTs', 'Lab Komputer'),
  ('MTs', 'Tenaga Administari Sekolah (TAS)'),
  ('MTs', 'Bendahara'),
  ('MTs', 'Mudir'),

  -- MA
  ('MA', 'Kurikulum'),
  ('MA', 'Bimbingan & Konseling (BK)'),
  ('MA', 'Lembaga Pengembangan Bahasa Asing (LPBA)'),
  ('MA', 'Kesantrian'),
  ('MA', 'Humas'),
  ('MA', 'Kordinator Piket'),
  ('MA', 'Pembina RG-UG'),
  ('MA', 'Kordinator Ekstrakurikuler'),
  ('MA', 'Perpustakaan'),
  ('MA', 'Tilawah & Hifdzil Qur''an (THQ)'),
  ('MA', 'Mudir'),
  ('MA', 'Tenaga Administari Madrasah (TAM)'),
  ('MA', 'Operator'),
  ('MA', 'Kordinator Pengembangan Prestasi'),
  ('MA', 'Pendidik & Tenaga Kependidikan (PTK)'),
  ('MA', 'Lab Komputer'),
  ('MA', 'Lab Sains'),
  ('MA', 'Bendahara'),

  -- Asrama Putra
  ('Asrama Putra', 'Sekretaris'),
  ('Asrama Putra', 'Bendahara'),
  ('Asrama Putra', 'Pendidikan Dan Pengasuhan'),
  ('Asrama Putra', 'Kesantrian Dan Kedisiplinan'),
  ('Asrama Putra', 'Pondok Tahfidz'),
  ('Asrama Putra', 'Kesehatan Dan Kesejahteraan'),
  ('Asrama Putra', 'Sarana Dan Kebersihan Lingkungan'),

  -- Asrama Putri
  ('Asrama Putri', 'Sekretaris'),
  ('Asrama Putri', 'Bendahara'),
  ('Asrama Putri', 'Pendidikan Dan Pengasuhan'),
  ('Asrama Putri', 'Kesantrian Dan Kedisiplinan'),
  ('Asrama Putri', 'Pondok Tahfidz'),
  ('Asrama Putri', 'Kesehatan Dan Kesejahteraan'),
  ('Asrama Putri', 'Sarana Dan Kebersihan Lingkungan'),

  -- THQ
  ('THQ', 'Sekretaris'),
  ('THQ', 'Bendahara'),
  ('THQ', 'Pendidikan Dan Pengasuhan'),
  ('THQ', 'Kesantrian Dan Kedisiplinan'),
  ('THQ', 'Pondok Tahfidz'),
  ('THQ', 'Kesehatan Dan Kesejahteraan'),
  ('THQ', 'Sarana Dan Kebersihan Lingkungan'),

  -- Dapur Asrama Putra
  ('Dapur Asrama Putra', 'Pengadaan Bahan'),
  ('Dapur Asrama Putra', 'Operasional Dapur'),

  -- Dapur Asrama Putri
  ('Dapur Asrama Putri', 'Pengadaan Bahan'),
  ('Dapur Asrama Putri', 'Operasional Dapur')
ON CONFLICT (unit_name, nama_bidang) DO NOTHING;

-- 7. Inisialisasi Data Default: Sumber Dana
INSERT INTO pengaturan_sumber_dana (unit_name, nama_sumber_dana) VALUES
  -- Pusat (Yayasan)
  ('Pusat (Yayasan)', 'Dana SPP'),
  ('Pusat (Yayasan)', 'Dana Zakat'),
  ('Pusat (Yayasan)', 'Dana Wakaf'),
  ('Pusat (Yayasan)', 'Dana Infaq'),
  ('Pusat (Yayasan)', 'Laba Usaha Koperasi'),
  ('Pusat (Yayasan)', 'Laba Usaha Poskestren'),
  ('Pusat (Yayasan)', 'Tabungan Wajib'),
  ('Pusat (Yayasan)', 'Tabungan Siswa'),
  ('Pusat (Yayasan)', 'Uang Saku'),

  -- TK
  ('TK', 'Dana BOS'),
  ('TK', 'Dana Pesantren/Yayasan'),
  ('TK', 'Tabungan Siswa'),
  ('TK', 'Iuran Non-Wajib'),

  -- SDIT 1
  ('SDIT 1', 'Dana BOS'),
  ('SDIT 1', 'Dana Pesantren/Yayasan'),
  ('SDIT 1', 'Tabungan Siswa'),

  -- SDIT 2
  ('SDIT 2', 'Dana BOS'),
  ('SDIT 2', 'Dana Pesantren/Yayasan'),
  ('SDIT 2', 'Tabungan Siswa'),

  -- MTs
  ('MTs', 'Dana BOS'),
  ('MTs', 'Dana Pesantren/Yayasan'),
  ('MTs', 'Tabungan Siswa'),

  -- MA
  ('MA', 'Dana BOS'),
  ('MA', 'Dana Pesantren/Yayasan'),
  ('MA', 'Tabungan Siswa'),

  -- Diniyah
  ('Diniyah', 'Dana Pesantren/Yayasan'),
  ('Diniyah', 'Subsidi Pesantren'),
  ('Diniyah', 'Infaq Siswa'),

  -- Asrama Putra
  ('Asrama Putra', 'Dana Pesantren/Yayasan'),
  ('Asrama Putra', 'Kas Internal'),
  ('Asrama Putra', 'Uang Saku'),

  -- Asrama Putri
  ('Asrama Putri', 'Dana Pesantren/Yayasan'),
  ('Asrama Putri', 'Kas Internal'),
  ('Asrama Putri', 'Uang Saku'),

  -- THQ
  ('THQ', 'Dana Pesantren/Yayasan'),
  ('THQ', 'Uang Saku'),
  ('THQ', 'Tabungan Siswa'),

  -- Dapur Asrama Putra
  ('Dapur Asrama Putra', 'Kas Internal'),

  -- Dapur Asrama Putri
  ('Dapur Asrama Putri', 'Kas Internal')
ON CONFLICT (unit_name, nama_sumber_dana) DO NOTHING;

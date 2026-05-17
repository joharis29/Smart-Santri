-- =========================================================================
-- MIGRATION: SEED DATA MASTER JENJANG DAN UNIT KERJA PESANTREN (CORRECTED HEX UUIDS)
-- =========================================================================
-- Jalankan perintah SQL ini di SQL Editor Supabase Anda untuk mengisi
-- tabel jenjang dan unit kerja secara lengkap menggunakan karakter heksadesimal yang valid.
-- =========================================================================

-- 1. Masukkan Data Master Jenjang (Menggunakan heksadesimal valid 0-9, a-f)
INSERT INTO jenjang (id, name) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Yayasan Pusat'),
  ('22222222-2222-2222-2222-222222222222', 'Pendidikan Anak Usia Dini / Diniyah'),
  ('33333333-3333-3333-3333-333333333333', 'Pendidikan Dasar'),
  ('44444444-4444-4444-4444-444444444444', 'Pendidikan Menengah'),
  ('55555555-5555-5555-5555-555555555555', 'Sarana & Asrama')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 2. Masukkan Data Master Unit Kerja (Menggunakan heksadesimal valid 0-9, a-f)
INSERT INTO unit (id, jenjang_id, name) VALUES
  ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Pusat (Yayasan)'),
  ('b1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'TK'),
  ('c1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Diniyah'),
  ('d1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'SDIT 1'),
  ('e1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'SDIT 2'),
  ('f1111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'MTs'),
  ('a2222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'MA'),
  ('b2222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'THQ'),
  ('c2222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', 'Asrama Putra'),
  ('d2222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', 'Asrama Putri'),
  ('e2222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', 'Dapur Asrama Putra'),
  ('f2222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', 'Dapur Asrama Putri')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, jenjang_id = EXCLUDED.jenjang_id;

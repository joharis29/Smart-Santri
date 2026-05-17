-- =========================================================================
-- MIGRASI DATABASE: MENDUKUNG CONCURRENT ROLE (RANGKAP JABATAN) SMART SANTRI
-- =========================================================================
-- Skrip ini memodifikasi database Supabase agar satu akun email (satu user)
-- dapat memiliki beberapa peran (role) dan unit kerja yang berbeda sekaligus.
-- 
-- CARA MENJALANKAN:
-- 1. Buka Supabase Dashboard proyek Anda.
-- 2. Pilih menu "SQL Editor" di sidebar kiri.
-- 3. Klik "+ New Query" untuk membuat halaman editor baru.
-- 4. Tempelkan (Copy-Paste) seluruh isi skrip SQL ini ke dalam editor.
-- 5. Klik tombol "Run" di kanan bawah editor.
-- =========================================================================

-- 1. Buat tabel relasi rangkap profiles_multi_role
CREATE TABLE IF NOT EXISTS profiles_multi_role (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  unit_id UUID REFERENCES unit(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Mencegah penambahan kombinasi peran + unit yang sama persis untuk satu user
  CONSTRAINT unique_user_role_unit UNIQUE(user_id, role, unit_id)
);

-- 2. Migrasikan/Salin semua data hak akses yang ada saat ini dari tabel profiles ke tabel baru
INSERT INTO profiles_multi_role (user_id, role, unit_id)
SELECT id, role, unit_id FROM profiles
ON CONFLICT (user_id, role, unit_id) DO NOTHING;

-- 3. Aktifkan Row Level Security (RLS) pada tabel baru demi keamanan
ALTER TABLE profiles_multi_role ENABLE ROW LEVEL SECURITY;

-- 4. Buat Kebijakan RLS agar pengguna terautentikasi dapat membaca data peran rangkap
DROP POLICY IF EXISTS "Allow authenticated to read multi_role" ON profiles_multi_role;
CREATE POLICY "Allow authenticated to read multi_role" ON profiles_multi_role
  FOR SELECT TO authenticated USING (true);

-- 5. Buat Kebijakan RLS agar service_role (administrator backend) dapat mengelola penuh
DROP POLICY IF EXISTS "Allow service_role to manage multi_role" ON profiles_multi_role;
CREATE POLICY "Allow service_role to manage multi_role" ON profiles_multi_role
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =========================================================================
-- SELESAI. Selamat! Skema database Anda sekarang resmi mendukung Rangkap Jabatan.
-- =========================================================================

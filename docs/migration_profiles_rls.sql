-- =========================================================================
-- MIGRATION: AKTIVASI HAK AKSES FULL CRUD PADA TABEL PROFILES (RLS RESOLUTION)
-- =========================================================================
-- Jalankan perintah SQL ini di SQL Editor Supabase Anda untuk mengizinkan
-- Admin melakukan pembuatan, pembaruan, dan penghapusan profil secara langsung.
-- =========================================================================

-- 1. Hapus batasan foreign key ke auth.users (agar penambahan user langsung dari admin panel lancar)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2. Hapus policy update lama yang sangat membatasi (hanya mengizinkan edit profil sendiri)
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- 3. Tambah policy SELECT (jika belum ada)
DROP POLICY IF EXISTS "Public read profiles" ON profiles;
CREATE POLICY "Public read profiles" ON profiles 
FOR SELECT TO authenticated 
USING (true);

-- 4. Tambah policy INSERT (untuk pendaftaran staf baru)
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
CREATE POLICY "Enable insert for authenticated users" ON profiles 
FOR INSERT TO authenticated 
WITH CHECK (true);

-- 5. Tambah policy UPDATE (untuk edit data staf)
DROP POLICY IF EXISTS "Enable update for authenticated users" ON profiles;
CREATE POLICY "Enable update for authenticated users" ON profiles 
FOR UPDATE TO authenticated 
USING (true)
WITH CHECK (true);

-- 6. Tambah policy DELETE (untuk hapus data staf)
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON profiles;
CREATE POLICY "Enable delete for authenticated users" ON profiles 
FOR DELETE TO authenticated 
USING (true);

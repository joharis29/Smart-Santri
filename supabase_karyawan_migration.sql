-- Skrip Migrasi SQL untuk Tabel Karyawan
-- Jalankan skrip ini pada SQL Editor di Supabase Dashboard

-- 1. Buat Tabel
CREATE TABLE IF NOT EXISTS public.karyawan (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nama VARCHAR(255) NOT NULL,
    nik VARCHAR(50),
    jabatan VARCHAR(100),
    unit VARCHAR(100) NOT NULL,
    no_hp VARCHAR(20),
    email VARCHAR(255),
    alamat TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Aktifkan RLS (Row Level Security)
ALTER TABLE public.karyawan ENABLE ROW LEVEL SECURITY;

-- 3. Buat Kebijakan RLS (Policy)
-- Izinkan semua akses (SELECT, INSERT, UPDATE, DELETE) untuk pengguna yang terautentikasi (authenticated)
CREATE POLICY "Allow authenticated full access to karyawan"
ON public.karyawan
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Buat fungsi trigger untuk auto-update kolom updated_at
CREATE OR REPLACE FUNCTION update_karyawan_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = timezone('utc'::text, now());
   RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. Pasang Trigger
DROP TRIGGER IF EXISTS update_karyawan_updated_at ON public.karyawan;
CREATE TRIGGER update_karyawan_updated_at
BEFORE UPDATE ON public.karyawan
FOR EACH ROW
EXECUTE FUNCTION update_karyawan_updated_at_column();

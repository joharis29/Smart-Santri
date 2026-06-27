-- Skrip Migrasi Data: Duplikasi Pengguna ke Karyawan
-- Jalankan skrip ini pada SQL Editor di Supabase Dashboard

INSERT INTO public.karyawan (nama, jabatan, unit, email, is_active)
SELECT 
    p.full_name, 
    p.role, 
    COALESCE(u.name, 'Yayasan/Pesantren (Pusat)'), 
    p.email,
    COALESCE(p.is_active, true)
FROM public.profiles p
LEFT JOIN public.unit u ON p.unit_id = u.id
WHERE NOT EXISTS (
    SELECT 1 FROM public.karyawan k 
    WHERE k.nama = p.full_name
);

-- Jalankan script SQL ini di SQL Editor Supabase Anda
ALTER TABLE public.kontrol_pengajuan ADD COLUMN IF NOT EXISTS program_aktif BOOLEAN DEFAULT true;


-- MIGRATION SCRIPT: TABEL SALDO AWAL PERIODE

CREATE TABLE IF NOT EXISTS public.saldo_awal_periode (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tahun_ajaran_tujuan TEXT NOT NULL,
    unit_id UUID REFERENCES public.unit(id) ON DELETE CASCADE,
    jenjang_id UUID REFERENCES public.jenjang(id) ON DELETE SET NULL,
    kategori public.kategori_dana NOT NULL,
    nominal NUMERIC NOT NULL,
    disahkan_oleh UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    tanggal_pengesahan TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.saldo_awal_periode ENABLE ROW LEVEL SECURITY;

-- Policies: 
-- 1. All authenticated users can read (Ledger needs to read this)
CREATE POLICY "Read Saldo Awal" ON public.saldo_awal_periode FOR SELECT TO authenticated USING (true);

-- 2. Only Pimpinan and Pusat can insert (via Tutup Buku button)
CREATE POLICY "Insert Saldo Awal" ON public.saldo_awal_periode FOR INSERT TO authenticated
WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('PIMPINAN', 'BENDAHARA_PUSAT', 'ADMINISTRATOR')
);

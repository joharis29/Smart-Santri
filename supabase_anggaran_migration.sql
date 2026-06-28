-- 1. Create periode_anggaran table
CREATE TABLE IF NOT EXISTS public.periode_anggaran (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tahun_ajaran TEXT NOT NULL UNIQUE, -- e.g., "2024/2025"
    tanggal_mulai DATE,
    tanggal_selesai DATE,
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'AKTIF', 'DITUTUP')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Ensure only one active period exists at a time using a partial unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_periode_anggaran_aktif 
ON public.periode_anggaran (status) 
WHERE status = 'AKTIF';

-- 2. Create pagu_unit table
CREATE TABLE IF NOT EXISTS public.pagu_unit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    periode_id UUID NOT NULL REFERENCES public.periode_anggaran(id) ON DELETE CASCADE,
    unit TEXT NOT NULL,
    sumber_dana TEXT NOT NULL,
    nominal_pagu NUMERIC NOT NULL DEFAULT 0 CHECK (nominal_pagu >= 0),
    terpakai NUMERIC NOT NULL DEFAULT 0,
    sisa_pagu NUMERIC GENERATED ALWAYS AS (nominal_pagu - terpakai) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(periode_id, unit, sumber_dana)
);

-- 3. Create saldo_carryover table
CREATE TABLE IF NOT EXISTS public.saldo_carryover (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    periode_asal_id UUID NOT NULL REFERENCES public.periode_anggaran(id) ON DELETE CASCADE,
    periode_tujuan_id UUID REFERENCES public.periode_anggaran(id) ON DELETE SET NULL,
    unit TEXT NOT NULL,
    sumber_dana TEXT NOT NULL,
    nominal_saldo NUMERIC NOT NULL DEFAULT 0,
    keterangan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS Policies
ALTER TABLE public.periode_anggaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagu_unit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saldo_carryover ENABLE ROW LEVEL SECURITY;

-- Allow authenticated full access (since this is an internal admin system, 
-- fine-grained RBAC is handled in the frontend for these master tables)
CREATE POLICY "Allow authenticated full access to periode_anggaran" ON public.periode_anggaran FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access to pagu_unit" ON public.pagu_unit FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access to saldo_carryover" ON public.saldo_carryover FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Functions and Triggers for updated_at
CREATE OR REPLACE FUNCTION update_anggaran_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = timezone('utc'::text, now());
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_periode_anggaran_updated_at ON public.periode_anggaran;
CREATE TRIGGER update_periode_anggaran_updated_at
BEFORE UPDATE ON public.periode_anggaran
FOR EACH ROW
EXECUTE FUNCTION update_anggaran_updated_at_column();

DROP TRIGGER IF EXISTS update_pagu_unit_updated_at ON public.pagu_unit;
CREATE TRIGGER update_pagu_unit_updated_at
BEFORE UPDATE ON public.pagu_unit
FOR EACH ROW
EXECUTE FUNCTION update_anggaran_updated_at_column();

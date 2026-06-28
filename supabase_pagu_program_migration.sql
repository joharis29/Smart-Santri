-- 1. Create pagu_program table
CREATE TABLE IF NOT EXISTS public.pagu_program (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    periode_id UUID NOT NULL REFERENCES public.periode_anggaran(id) ON DELETE CASCADE,
    program_id UUID NOT NULL REFERENCES public.program_kegiatan(id) ON DELETE CASCADE,
    nominal_pagu NUMERIC NOT NULL DEFAULT 0 CHECK (nominal_pagu >= 0),
    terpakai NUMERIC NOT NULL DEFAULT 0,
    sisa_pagu NUMERIC GENERATED ALWAYS AS (nominal_pagu - terpakai) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(periode_id, program_id)
);

-- 2. RLS Policies
ALTER TABLE public.pagu_program ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated full access to pagu_program" ON public.pagu_program FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. Trigger for updated_at
-- Assuming update_anggaran_updated_at_column() exists from previous migration
DROP TRIGGER IF EXISTS update_pagu_program_updated_at ON public.pagu_program;
CREATE TRIGGER update_pagu_program_updated_at
BEFORE UPDATE ON public.pagu_program
FOR EACH ROW
EXECUTE FUNCTION update_anggaran_updated_at_column();

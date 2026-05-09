-- ==============================================================================
-- SCHEMA FOR FACTORES MODULE (Corrected Types)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.factores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    maestro_id BIGINT NOT NULL REFERENCES public.maestros(id),
    curso_id BIGINT NOT NULL REFERENCES public.cursos(id),
    factor NUMERIC(10, 2) DEFAULT 0,
    porcentaje NUMERIC(5, 2) DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    razon_borrado TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster searches
CREATE INDEX IF NOT EXISTS idx_factores_maestro ON public.factores(maestro_id);
CREATE INDEX IF NOT EXISTS idx_factores_curso ON public.factores(curso_id);
CREATE INDEX IF NOT EXISTS idx_factores_activo ON public.factores(activo);

-- RLS Policies (Optional but recommended)
ALTER TABLE public.factores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.factores
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON public.factores
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON public.factores
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON public.factores
    FOR DELETE USING (true);

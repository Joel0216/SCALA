-- ==============================================================================
-- SCHEMA FOR MOTIVOS MODULE (Para razones de Baja y Medio de Enterado)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.motivos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clave VARCHAR(15) UNIQUE NOT NULL,
    descripcion VARCHAR(150) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster searches
CREATE INDEX IF NOT EXISTS idx_motivos_clave ON public.motivos(clave);
CREATE INDEX IF NOT EXISTS idx_motivos_activo ON public.motivos(activo);

-- RLS Policies
ALTER TABLE public.motivos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.motivos
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON public.motivos
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON public.motivos
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON public.motivos
    FOR DELETE USING (true);

-- ==============================================================================
-- SCHEMA FOR MEDIOS DE CONTACTO ("Medio que se enteró")
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.medios_contacto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clave VARCHAR(15) UNIQUE NOT NULL,
    descripcion VARCHAR(150) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster searches
CREATE INDEX IF NOT EXISTS idx_medios_clave ON public.medios_contacto(clave);
CREATE INDEX IF NOT EXISTS idx_medios_activo ON public.medios_contacto(activo);

-- RLS Policies
ALTER TABLE public.medios_contacto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.medios_contacto
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON public.medios_contacto
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON public.medios_contacto
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON public.medios_contacto
    FOR DELETE USING (true);

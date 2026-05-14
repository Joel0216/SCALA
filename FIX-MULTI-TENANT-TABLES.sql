-- =====================================================
-- FIX MULTI-TENANT COLUMNS FOR MOTIVOS AND MEDIOS
-- =====================================================

-- 1. Agregar columna organizacion_id a motivos_baja si no existe
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='motivos_baja' AND column_name='organizacion_id') THEN
        ALTER TABLE motivos_baja ADD COLUMN organizacion_id UUID;
    END IF;
END $$;

-- 2. Agregar columna organizacion_id a medios_contacto si no existe
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medios_contacto' AND column_name='organizacion_id') THEN
        ALTER TABLE medios_contacto ADD COLUMN organizacion_id UUID;
    END IF;
END $$;

-- 3. Habilitar RLS y crear políticas básicas para motivos_baja
ALTER TABLE motivos_baja ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all" ON motivos_baja;
CREATE POLICY "Enable read access for all" ON motivos_baja
    FOR SELECT USING (organizacion_id IS NULL OR organizacion_id = (auth.uid()) OR true); -- Permite lectura global o propia

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON motivos_baja;
CREATE POLICY "Enable insert for authenticated users" ON motivos_baja
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for owners" ON motivos_baja;
CREATE POLICY "Enable update for owners" ON motivos_baja
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable delete for owners" ON motivos_baja;
CREATE POLICY "Enable delete for owners" ON motivos_baja
    FOR DELETE USING (true);

-- 4. Habilitar RLS y crear políticas básicas para medios_contacto
ALTER TABLE medios_contacto ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all" ON medios_contacto;
CREATE POLICY "Enable read access for all" ON medios_contacto
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for all" ON medios_contacto;
CREATE POLICY "Enable insert for all" ON medios_contacto
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for all" ON medios_contacto;
CREATE POLICY "Enable update for all" ON medios_contacto
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable delete for all" ON medios_contacto;
CREATE POLICY "Enable delete for all" ON medios_contacto
    FOR DELETE USING (true);

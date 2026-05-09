-- ==============================================================================
-- MIGRACIÓN: CORRECCIÓN TABLA MAESTROS Y FACTORES
-- Ejecutar esto si NO quieres borrar tus datos actuales
-- ==============================================================================

-- 1. Añadir columnas faltantes a Maestros
ALTER TABLE maestros ADD COLUMN IF NOT EXISTS direccion_1 TEXT;
ALTER TABLE maestros ADD COLUMN IF NOT EXISTS direccion_2 TEXT;
ALTER TABLE maestros ADD COLUMN IF NOT EXISTS forma_pago VARCHAR(50) DEFAULT 'POR ALUMNO';

-- 2. Sincronizar datos (opcional: mover direccion actual a direccion_1)
UPDATE maestros SET direccion_1 = direccion WHERE direccion_1 IS NULL AND direccion IS NOT NULL;

-- 3. Crear tabla de Factores (necesaria para Honorarios y Vistas)
CREATE TABLE IF NOT EXISTS factores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    maestro_id UUID REFERENCES maestros(id) ON DELETE CASCADE,
    curso_id UUID REFERENCES cursos(id) ON DELETE CASCADE,
    factor DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(maestro_id, curso_id)
);

-- 4. Asegurar RLS para la nueva tabla
ALTER TABLE factores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo anon" ON factores;
CREATE POLICY "Permitir todo anon" ON factores FOR ALL TO anon USING (true) WITH CHECK (true);

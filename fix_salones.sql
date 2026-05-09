-- 1. Agregar columna cupo a salones
ALTER TABLE salones ADD COLUMN IF NOT EXISTS cupo INTEGER DEFAULT 10;

-- 2. Crear tabla puente para instrumentos (M:N)
CREATE TABLE IF NOT EXISTS salon_instrumentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_numero VARCHAR(10) REFERENCES salones(numero) ON DELETE CASCADE,
    instrumento_clave VARCHAR(20) REFERENCES instrumentos(clave) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(salon_numero, instrumento_clave)
);

-- 3. Desactivar RLS para permitir CRUD desde la app
ALTER TABLE salones DISABLE ROW LEVEL SECURITY;
ALTER TABLE salon_instrumentos DISABLE ROW LEVEL SECURITY;

-- 4. Otorgar permisos
GRANT ALL ON TABLE salones TO anon, authenticated, service_role;
GRANT ALL ON TABLE salon_instrumentos TO anon, authenticated, service_role;

-- 5. Recargar esquema
NOTIFY pgrst, 'reload schema';

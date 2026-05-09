-- Tablas Necesarias (Cursos y Maestros deben existir)
-- CREATE TABLE IF NOT EXISTS cursos (...);
-- CREATE TABLE IF NOT EXISTS maestros (...);

-- Crear tabla grupos
CREATE TABLE IF NOT EXISTS grupos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clave VARCHAR(50) UNIQUE NOT NULL,
    curso_id BIGINT REFERENCES cursos(id) ON DELETE CASCADE,
    maestro_id BIGINT REFERENCES maestros(id) ON DELETE CASCADE,
    dia VARCHAR(20) NOT NULL,
    hora_entrada VARCHAR(10) NOT NULL, -- Formato HH.MM (ej: 17.00)
    hora_salida VARCHAR(10) NOT NULL,  -- Formato HH.MM (ej: 18.00)
    fecha_inicio DATE,
    salon VARCHAR(50),
    cupo INTEGER NOT NULL DEFAULT 10,
    alumnos_inscritos INTEGER NOT NULL DEFAULT 0,
    leccion_actual VARCHAR(255),
    fecha_leccion DATE,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    razon_borrado TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar la búsqueda
CREATE INDEX IF NOT EXISTS idx_grupos_clave ON grupos(clave);
CREATE INDEX IF NOT EXISTS idx_grupos_maestro_id ON grupos(maestro_id);
CREATE INDEX IF NOT EXISTS idx_grupos_curso_id ON grupos(curso_id);
CREATE INDEX IF NOT EXISTS idx_grupos_activo ON grupos(activo);

-- Política de RLS (Opcional, según configuración de Supabase)
-- ALTER TABLE grupos ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Permitir todo a usuarios autenticados" ON grupos FOR ALL USING (true);

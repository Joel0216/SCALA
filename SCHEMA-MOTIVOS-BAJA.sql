-- =====================================================
-- TABLA DE MOTIVOS DE BAJA - SCALA
-- =====================================================

-- Crear tabla de motivos de baja
CREATE TABLE IF NOT EXISTS motivos_baja (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(10) UNIQUE NOT NULL,
    descripcion VARCHAR(100) NOT NULL,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar motivos iniciales
INSERT INTO motivos_baja (clave, descripcion) VALUES
    ('CAC', 'CAMBIO DE CIUDAD'),
    ('ECO', 'PROBLEMAS ECONOMICOS'),
    ('SAL', 'PROBLEMAS DE SALUD'),
    ('TRA', 'PROBLEMAS DE TRABAJO'),
    ('TIE', 'FALTA DE TIEMPO'),
    ('INT', 'PERDIDA DE INTERES'),
    ('ESC', 'CAMBIO DE ESCUELA'),
    ('FAM', 'PROBLEMAS FAMILIARES'),
    ('HOR', 'INCOMPATIBILIDAD DE HORARIOS'),
    ('OTR', 'OTRO MOTIVO')
ON CONFLICT (clave) DO NOTHING;

-- Agregar columnas a la tabla alumnos si no existen
ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS motivo_baja VARCHAR(10);
ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS observaciones_baja TEXT;
ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS fecha_reingreso DATE;
ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS observaciones_reingreso TEXT;

-- Crear índice para búsquedas
CREATE INDEX IF NOT EXISTS idx_alumnos_activo ON alumnos(activo);
CREATE INDEX IF NOT EXISTS idx_alumnos_fecha_baja ON alumnos(fecha_baja);

-- Deshabilitar RLS para la tabla
ALTER TABLE motivos_baja DISABLE ROW LEVEL SECURITY;

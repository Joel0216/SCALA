-- ============================================================
-- ESQUEMA PARA BAJAS Y REINGRESOS DE ALUMNOS - SCALA
-- Arquitectura: Opción B (campo activo en tabla alumnos)
-- ============================================================
-- INSTRUCCIONES: Ejecutar este script en Supabase SQL Editor
-- ============================================================

-- ============================================================
-- PASO 1: Catálogo de Motivos de Baja
-- ============================================================
CREATE TABLE IF NOT EXISTS motivos_baja (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(10) UNIQUE NOT NULL,
    descripcion VARCHAR(150) NOT NULL,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar motivos del catálogo (basado en Excel)
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
    ('MUD', 'CAMBIO DE DOMICILIO'),
    ('VIA', 'VIAJE AL EXTRANJERO'),
    ('OTR', 'OTRO MOTIVO')
ON CONFLICT (clave) DO UPDATE SET descripcion = EXCLUDED.descripcion;

-- Deshabilitar RLS
ALTER TABLE motivos_baja DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- PASO 2: Agregar columnas de Baja/Reingreso a tabla alumnos
-- (Si ya existen, los ALTER TABLE IF NOT EXISTS no fallan)
-- ============================================================

-- Columna activo (campo principal para filtrar activos/bajas)
ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;

-- Columnas de Baja
ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS fecha_baja DATE;
ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS motivo_baja VARCHAR(10);
ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS observaciones_baja TEXT;

-- Columnas de Reingreso
ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS reingreso BOOLEAN DEFAULT false;
ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS fecha_reingreso DATE;
ALTER TABLE alumnos ADD COLUMN IF NOT EXISTS observaciones_reingreso TEXT;

-- ============================================================
-- PASO 3: Inicializar activo=true en todos los registros
-- (solo los que tengan activo = NULL)
-- ============================================================
UPDATE alumnos SET activo = true WHERE activo IS NULL;

-- ============================================================
-- PASO 4: Índices para mejorar rendimiento
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_alumnos_activo ON alumnos(activo);
CREATE INDEX IF NOT EXISTS idx_alumnos_fecha_baja ON alumnos(fecha_baja);
CREATE INDEX IF NOT EXISTS idx_alumnos_motivo_baja ON alumnos(motivo_baja);
CREATE INDEX IF NOT EXISTS idx_alumnos_credencial ON alumnos(credencial);

-- ============================================================
-- VERIFICACIÓN: Consultas de prueba (opcional, no ejecutar en producción)
-- ============================================================
-- SELECT COUNT(*) FROM alumnos WHERE activo = true;   -- Alumnos activos
-- SELECT COUNT(*) FROM alumnos WHERE activo = false;  -- Dados de baja
-- SELECT * FROM motivos_baja ORDER BY clave;          -- Catálogo de motivos

-- ============================================
-- FINAL FIX INTEGRADO (SCALA + SCALA_movil) - V3
-- ============================================

-- 1. Asegurar columnas en programacion_examenes
ALTER TABLE programacion_examenes ADD COLUMN IF NOT EXISTS alumno_id INTEGER;
ALTER TABLE programacion_examenes ADD COLUMN IF NOT EXISTS maestro_id UUID;
ALTER TABLE programacion_examenes ADD COLUMN IF NOT EXISTS calificacion NUMERIC DEFAULT 0;
ALTER TABLE programacion_examenes ADD COLUMN IF NOT EXISTS aprobado BOOLEAN DEFAULT FALSE;
ALTER TABLE programacion_examenes ADD COLUMN IF NOT EXISTS clave_examen TEXT;
ALTER TABLE programacion_examenes ADD COLUMN IF NOT EXISTS grupo_id UUID;

-- 2. Tabla de sesiones (Requerida por Scala Desktop)
CREATE TABLE IF NOT EXISTS sesiones_clase (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grupo_id UUID REFERENCES grupos(id),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    tema_visto TEXT,
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(grupo_id, fecha)
);

-- 3. Tabla de asistencias
CREATE TABLE IF NOT EXISTS asistencias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alumno_id INTEGER REFERENCES alumnos(id),
    grupo_id UUID REFERENCES grupos(id),
    sesion_id UUID REFERENCES sesiones_clase(id),
    fecha DATE DEFAULT CURRENT_DATE,
    estatus VARCHAR(20) DEFAULT 'falta',
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(alumno_id, sesion_id)
);

-- 4. VISTA DE GRUPOS COMPLETA (Para el Dashboard Móvil)
DROP VIEW IF EXISTS v_grupos_completo;
CREATE OR REPLACE VIEW v_grupos_completo AS
SELECT 
    g.id as grupo_id,
    g.id, -- Alias para compatibilidad
    g.clave as clave_grupo,
    g.clave as nombre_grupo, 
    g.maestro_id,
    m.nombre as nombre_maestro,
    g.curso_id,
    c.curso as curso_nombre,
    (g.dia || ' ' || g.hora_entrada || '-' || g.hora_salida) as horario,
    g.alumnos_inscritos,
    g.dia,
    g.hora_entrada,
    g.hora_salida,
    s.numero as salon_numero,
    g.status
FROM grupos g
LEFT JOIN maestros m ON g.maestro_id = m.id
LEFT JOIN cursos c ON g.curso_id = c.id
LEFT JOIN salones s ON g.salon_id = s.id;

-- 5. Vista de resultados de examen (Corregida con 'credencial')
CREATE OR REPLACE VIEW v_resultados_examen AS
SELECT 
    pe.id as identificador_id,
    pe.alumno_id,
    a.credencial as credencial_alumno, 
    a.nombre as nombre_alumno,
    pe.clave_examen,
    pe.fecha,
    pe.calificacion,
    pe.aprobado,
    pe.maestro_id,
    m.nombre as nombre_maestro
FROM programacion_examenes pe
LEFT JOIN alumnos a ON pe.alumno_id = a.id
LEFT JOIN maestros m ON pe.maestro_id = m.id;

-- 6. Desactivar RLS para evitar bloqueos en el desarrollo
ALTER TABLE asistencias DISABLE ROW LEVEL SECURITY;
ALTER TABLE sesiones_clase DISABLE ROW LEVEL SECURITY;
ALTER TABLE programacion_examenes DISABLE ROW LEVEL SECURITY;
ALTER TABLE grupos DISABLE ROW LEVEL SECURITY;
ALTER TABLE maestros DISABLE ROW LEVEL SECURITY;
ALTER TABLE alumnos DISABLE ROW LEVEL SECURITY;

-- 7. Permisos para las vistas
ALTER VIEW v_grupos_completo OWNER TO postgres;
ALTER VIEW v_resultados_examen OWNER TO postgres;

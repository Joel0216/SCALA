-- ==============================================================================
-- FIX-ALL-MULTI-TENANT-VISTAS.sql
-- Academia SCALA - SaaS Multi-tenant
-- ==============================================================================
-- Propósito: Asegurar que TODAS las vistas incluyan la columna organizacion_id
-- y que las tablas tengan dicha columna e índices para aislamiento total.
-- ==============================================================================

DO $$ 
DECLARE
    t TEXT;
BEGIN
    -- 1. AGREGAR organizacion_id A TODAS LAS TABLAS SI FALTA
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS organizacion_id UUID;', t);
        -- Crear índice para la columna para mejorar performance de filtrado
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I (organizacion_id);', 'idx_' || t || '_org_id', t);
    END LOOP;
END $$;

-- 2. ELIMINAR VISTAS PARA RECREARLAS
DROP VIEW IF EXISTS v_examenes_alumno CASCADE;
DROP VIEW IF EXISTS v_seguimiento_pagos CASCADE;
DROP VIEW IF EXISTS v_colegiaturas_pendientes CASCADE;
DROP VIEW IF EXISTS v_alumnos_completo CASCADE;
DROP VIEW IF EXISTS v_grupos_completo CASCADE;
DROP VIEW IF EXISTS v_honorarios_maestros CASCADE;
DROP VIEW IF EXISTS v_resultados_examen CASCADE;

-- 3. RECREAR VISTA: v_examenes_alumno
CREATE OR REPLACE VIEW v_examenes_alumno AS
SELECT 
    pe.id as examen_id,
    pe.alumno_id,
    a.credencial as credencial,
    pe.clave_examen,
    pe.fecha,
    pe.hora,
    pe.pagado,
    pe.monto as precio_unitario,
    m.nombre as maestro_nombre,
    re.calificacion,
    re.aprobo,
    re.presento,
    CASE 
        WHEN pe.pagado = false THEN 'PENDIENTE DE PAGO'
        WHEN re.calificacion IS NOT NULL THEN 'CALIFICADO'
        WHEN pe.pagado = true THEN 'PAGADO'
        ELSE 'PROGRAMADO'
    END as status,
    pe.organizacion_id
FROM programacion_examenes pe
JOIN alumnos a ON pe.alumno_id = a.id
LEFT JOIN maestros m ON pe.maestro_id = m.id
LEFT JOIN resultados_examen re ON pe.clave_examen = re.clave_examen AND pe.alumno_id = re.alumno_id;

-- 4. RECREAR VISTA: v_seguimiento_pagos
CREATE OR REPLACE VIEW v_seguimiento_pagos AS
WITH RECURSIVE meses(n) AS (
    SELECT 0 UNION ALL SELECT n + 1 FROM meses WHERE n < 11
),
alumno_ciclos AS (
    SELECT 
        ag.alumno_id, ag.grupo_clave, a.porcentaje_beca,
        COALESCE(g.fecha_inicio, '2024-01-01'::date) as inicio_grupo,
        COALESCE(c.precio_mensual, 0) as costo_base,
        m.n as n_ciclo,
        (COALESCE(g.fecha_inicio, '2024-01-01'::date) + (m.n || ' months')::interval)::date as inicio_ciclo,
        (COALESCE(g.fecha_inicio, '2024-01-01'::date) + ((m.n + 1) || ' months')::interval - ('1 day')::interval)::date as fin_ciclo,
        ag.organizacion_id
    FROM alumno_grupos ag
    JOIN alumnos a ON ag.alumno_id = a.id
    JOIN grupos g ON ag.grupo_clave = g.clave
    LEFT JOIN cursos c ON g.curso_id = c.id
    CROSS JOIN meses m
    WHERE ag.estado = 'Activo'
)
SELECT 
    ac.*,
    EXTRACT(MONTH FROM ac.inicio_ciclo)::INTEGER as mes,
    EXTRACT(YEAR FROM ac.inicio_ciclo)::INTEGER as anio,
    ROUND(ac.costo_base * (1 - COALESCE(ac.porcentaje_beca, 0) / 100.0), 2) as monto,
    CASE 
        WHEN EXISTS (SELECT 1 FROM colegiaturas col WHERE col.alumno_id = ac.alumno_id AND col.mes = EXTRACT(MONTH FROM ac.inicio_ciclo) AND col.anio = EXTRACT(YEAR FROM ac.inicio_ciclo)) THEN 'pagado'
        WHEN ac.porcentaje_beca >= 100 THEN 'pagado'
        WHEN ac.inicio_ciclo < CURRENT_DATE - interval '5 days' THEN 'deuda'
        ELSE 'futuro'
    END as estatus
FROM alumno_ciclos ac
WHERE (ac.inicio_ciclo <= CURRENT_DATE + interval '7 days') 
   OR (EXISTS (SELECT 1 FROM colegiaturas col WHERE col.alumno_id = ac.alumno_id AND col.mes = EXTRACT(MONTH FROM ac.inicio_ciclo) AND col.anio = EXTRACT(YEAR FROM ac.inicio_ciclo)));

-- 5. RECREAR VISTA: v_colegiaturas_pendientes
CREATE OR REPLACE VIEW v_colegiaturas_pendientes AS
SELECT 
    vsp.alumno_id, a.credencial as credencial, a.nombre, vsp.grupo_clave as grupo, c.curso, vsp.mes, vsp.anio, vsp.monto as precio_mensual, vsp.monto as monto_a_pagar,
    vsp.organizacion_id
FROM v_seguimiento_pagos vsp
JOIN alumnos a ON vsp.alumno_id = a.id
JOIN grupos g ON vsp.grupo_clave = g.clave
JOIN cursos c ON g.curso_id = c.id
WHERE vsp.estatus = 'deuda';

-- 6. RECREAR VISTA: v_alumnos_completo
CREATE OR REPLACE VIEW v_alumnos_completo AS
SELECT a.* FROM alumnos a;

-- 7. RECREAR VISTA: v_grupos_completo
CREATE OR REPLACE VIEW v_grupos_completo AS
SELECT 
    g.*, 
    m.nombre as maestro_nombre, 
    c.curso as nombre_curso, 
    c.grado as curso_grado
FROM grupos g
LEFT JOIN maestros m ON g.maestro_id = m.id
LEFT JOIN cursos c ON g.curso_id = c.id;

-- 8. RECREAR VISTA: v_honorarios_maestros
CREATE OR REPLACE VIEW v_honorarios_maestros AS
SELECT 
    m.id as maestro_id, m.nombre as maestro, c.curso, g.clave as grupo, g.alumnos_inscritos,
    c.precio_mensual, f.factor,
    (g.alumnos_inscritos * COALESCE(c.precio_mensual, 0) * COALESCE(f.factor, 0) / 100) as honorarios,
    m.organizacion_id
FROM maestros m
JOIN grupos g ON m.id = g.maestro_id
JOIN cursos c ON g.curso_id = c.id
LEFT JOIN factores f ON m.id = f.maestro_id AND c.id = f.curso_id;

-- 9. RECREAR VISTA: v_resultados_examen
CREATE OR REPLACE VIEW v_resultados_examen AS
SELECT 
    re.*,
    a.nombre as alumno_nombre,
    a.credencial as credencial,
    pe.fecha,
    pe.tipo_examen
FROM resultados_examen re
JOIN alumnos a ON re.alumno_id = a.id
JOIN programacion_examenes pe ON re.clave_examen = pe.clave_examen;

-- 10. ASEGURAR QUE LAS VISTAS SEAN ACCESIBLES
ALTER VIEW v_examenes_alumno OWNER TO postgres;
ALTER VIEW v_seguimiento_pagos OWNER TO postgres;
ALTER VIEW v_colegiaturas_pendientes OWNER TO postgres;
ALTER VIEW v_alumnos_completo OWNER TO postgres;
ALTER VIEW v_grupos_completo OWNER TO postgres;
ALTER VIEW v_honorarios_maestros OWNER TO postgres;
ALTER VIEW v_resultados_examen OWNER TO postgres;

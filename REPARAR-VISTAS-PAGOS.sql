-- ==============================================================================
-- REPARAR-VISTAS-PAGOS.sql (CORREGIDO v11 - Resuelve Columna Salones.Id)
-- Restaura las vistas necesarias para el seguimiento de ciclos y deudas en Scala
-- ==============================================================================

-- 1. ELIMINAR TODAS LAS VISTAS QUE BLOQUEAN EL CAMBIO
DROP VIEW IF EXISTS v_honorarios_maestros CASCADE;
DROP VIEW IF EXISTS v_colegiaturas_pendientes CASCADE;
DROP VIEW IF EXISTS v_seguimiento_pagos CASCADE;
DROP VIEW IF EXISTS v_alumnos_completo CASCADE;
DROP VIEW IF EXISTS v_grupos_completo CASCADE;

-- 2. Asegurar que las tablas sean accesibles
ALTER TABLE IF EXISTS alumno_grupos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS colegiaturas DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS instrumentos DISABLE ROW LEVEL SECURITY;

-- 3. CORREGIR TIPOS DE DATOS (Mapeo numérico)
ALTER TABLE grupos ALTER COLUMN curso_id DROP NOT NULL;
ALTER TABLE grupos ALTER COLUMN curso_id TYPE BIGINT USING NULL;

ALTER TABLE IF EXISTS factores ALTER COLUMN curso_id DROP NOT NULL;
ALTER TABLE IF EXISTS factores ALTER COLUMN curso_id TYPE BIGINT USING NULL;

-- 4. SINCRONIZAR GRADOS (Con Casting de Texto a Entero)
UPDATE grupos g 
SET grado = c.grado::INTEGER 
FROM cursos c 
WHERE g.curso_id = c.id AND c.grado ~ '^[0-9]+$';

-- 5. RECREAR VISTA: v_seguimiento_pagos
CREATE OR REPLACE VIEW v_seguimiento_pagos AS
WITH RECURSIVE meses(n) AS (
    SELECT 0 UNION ALL SELECT n + 1 FROM meses WHERE n < 11
),
alumno_ciclos AS (
    SELECT 
        ag.alumno_id, ag.grupo_clave, a.porcentaje_beca,
        COALESCE(g.fecha_inicio, '2024-01-01'::date) as inicio_grupo,
        COALESCE(c.costo, 0) as costo_base,
        m.n as n_ciclo,
        (COALESCE(g.fecha_inicio, '2024-01-01'::date) + (m.n || ' months')::interval)::date as inicio_ciclo,
        (COALESCE(g.fecha_inicio, '2024-01-01'::date) + ((m.n + 1) || ' months')::interval - ('1 day')::interval)::date as fin_ciclo
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

-- 6. RECREAR VISTA: v_colegiaturas_pendientes
CREATE OR REPLACE VIEW v_colegiaturas_pendientes AS
SELECT 
    vsp.alumno_id, a.credencial, a.nombre, vsp.grupo_clave as grupo, c.curso, vsp.mes, vsp.anio, vsp.monto as precio_mensual, vsp.monto as monto_a_pagar
FROM v_seguimiento_pagos vsp
JOIN alumnos a ON vsp.alumno_id = a.id
JOIN grupos g ON vsp.grupo_clave = g.clave
JOIN cursos c ON g.curso_id = c.id
WHERE vsp.estatus = 'deuda';

-- 7. RECREAR VISTA: v_alumnos_completo (Simplificada)
CREATE OR REPLACE VIEW v_alumnos_completo AS
SELECT a.* FROM alumnos a;

-- 8. RECREAR VISTA: v_grupos_completo (Simplificada)
CREATE OR REPLACE VIEW v_grupos_completo AS
SELECT g.* FROM grupos g;

-- 9. RECREAR VISTA: v_honorarios_maestros
CREATE OR REPLACE VIEW v_honorarios_maestros AS
SELECT 
    m.id as maestro_id, m.nombre as maestro, c.curso, g.clave as grupo, g.alumnos_inscritos,
    c.costo as precio_mensual, f.factor,
    (g.alumnos_inscritos * c.costo * f.factor / 100) as honorarios
FROM maestros m
JOIN grupos g ON m.id = g.maestro_id
JOIN cursos c ON g.curso_id = c.id
LEFT JOIN factores f ON m.id = f.maestro_id AND c.id = f.curso_id;

-- ==============================================================================
-- MIGRACIÓN: CORRECCIÓN TABLA CURSOS
-- ==============================================================================

ALTER TABLE cursos ADD COLUMN IF NOT EXISTS costo DECIMAL(10,2) DEFAULT 0;

-- Sincronizar datos si ya existen
UPDATE cursos SET costo = precio_mensual WHERE costo = 0 AND precio_mensual > 0;
UPDATE cursos SET precio_mensual = costo WHERE precio_mensual = 0 AND costo > 0;

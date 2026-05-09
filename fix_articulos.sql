-- ==============================================================================
-- MIGRACIÓN: CORRECCIÓN TABLA ARTICULOS
-- ==============================================================================

ALTER TABLE articulos ADD COLUMN IF NOT EXISTS grupo VARCHAR(100);

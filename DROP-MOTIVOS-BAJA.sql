-- ==============================================================================
-- LIMPIEZA DE TABLAS ANTIGUAS
-- ==============================================================================

-- Se elimina la tabla de motivos_baja debido a que la nueva tabla 'motivos' 
-- toma su lugar
DROP TABLE IF EXISTS public.motivos_baja;

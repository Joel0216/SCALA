-- ==============================================================================
-- MIGRACIÓN: CORRECCIÓN TABLA GRUPOS_ARTICULOS (Sincronización de Nombres)
-- ==============================================================================

-- 1. Añadir columna activo si no existe
ALTER TABLE grupos_articulos ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;

-- 2. Renombrar 'nombre' a 'grupo' para que coincida con el código JS
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='grupos_articulos' AND column_name='nombre') THEN
    ALTER TABLE grupos_articulos RENAME COLUMN nombre TO grupo;
  END IF;
END $$;

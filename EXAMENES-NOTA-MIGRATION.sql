-- ============================================================
-- ACTUALIZACIÓN: Agregar campo nota a resultados_examen
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Agregar columna nota si no existe
ALTER TABLE resultados_examen
  ADD COLUMN IF NOT EXISTS nota TEXT;

-- 2. Verificar estructura final (opcional, solo para revisar)
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'resultados_examen' ORDER BY ordinal_position;

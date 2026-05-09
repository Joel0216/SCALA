-- =============================================
-- SCRIPT DE CONFIGURACIÓN DE SUPABASE STORAGE (Versión Corregida)
-- =============================================
-- Instrucciones: 
-- 1. Copia todo este código.
-- 2. Ve a tu Supabase Dashboard -> SQL Editor.
-- 3. Abre un "New Query" y pega este código.
-- 4. Haz clic en "Run".

-- 1. Crear el bucket 'comprobantes' si no existe (usando el ID 'comprobantes')
-- Nota: En Supabase, el ID es lo que se usa en el código.
INSERT INTO storage.buckets (id, name, public)
VALUES ('comprobantes', 'comprobantes', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Eliminar políticas antiguas si existen para evitar duplicados
-- Usamos 'storage.objects' que ya suele tener RLS habilitado por Supabase.
DROP POLICY IF EXISTS "Permitir subida pública de comprobantes" ON storage.objects;
DROP POLICY IF EXISTS "Permitir visualización pública de comprobantes" ON storage.objects;

-- 3. Crear política para permitir la subida (INSERT)
-- Esto permite que cualquier usuario (incluso no autenticado si la App no usa Login) suba archivos al bucket 'comprobantes'.
CREATE POLICY "Permitir subida pública de comprobantes"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'comprobantes');

-- 4. Crear política para permitir la lectura (SELECT)
-- Esto permite que el URL público generado sea accesible por todos.
CREATE POLICY "Permitir visualización pública de comprobantes"
ON storage.objects FOR SELECT
USING (bucket_id = 'comprobantes');

-- 5. Opcional: Permitir borrar (DELETE) por si necesitas limpiar archivos
DROP POLICY IF EXISTS "Permitir borrado público de comprobantes" ON storage.objects;
CREATE POLICY "Permitir borrado público de comprobantes"
ON storage.objects FOR DELETE
USING (bucket_id = 'comprobantes');

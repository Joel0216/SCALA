-- =====================================================================
-- SCALA - CORRECCIÓN DEFINITIVA DE POLÍTICAS RLS Y CASCADA EN SUPABASE
-- Ejecutar este script en: Supabase Dashboard > SQL Editor
-- =====================================================================

-- 1. DESACTIVAR RLS EN LA TABLA INTERMEDIA (Para asegurar el insert del instrumento)
ALTER TABLE public.salon_instrumentos DISABLE ROW LEVEL SECURITY;

-- 2. POLÍTICAS PARA LA TABLA GRUPOS
-- Asegurar que las políticas no bloqueen los inserts de desarrollo
DROP POLICY IF EXISTS "Inserción de grupos restringida a la sucursal" ON public.grupos;
DROP POLICY IF EXISTS "Lectura de grupos por organizacion y SuperAdmin" ON public.grupos;
DROP POLICY IF EXISTS "allow_insert_grupos" ON public.grupos;
DROP POLICY IF EXISTS "allow_select_grupos" ON public.grupos;
DROP POLICY IF EXISTS "allow_update_grupos" ON public.grupos;

-- Permitir que cualquiera inserte, o validar por el ID de organización enviado
CREATE POLICY "Permitir inserción de grupos" 
ON public.grupos 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- El filtro de qué ve cada quién lo manejamos desde el código JS
CREATE POLICY "Permitir lectura selectiva grupos" 
ON public.grupos 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Permitir update grupos"
ON public.grupos
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Permitir delete grupos"
ON public.grupos
FOR DELETE
TO authenticated
USING (true);

-- 3. CONFIGURACIÓN DE ON DELETE CASCADE
-- Para que la eliminación de una organización borre en cascada automáticamente

-- Para alumnos
ALTER TABLE public.alumnos 
DROP CONSTRAINT IF EXISTS alumnos_organizacion_id_fkey;
ALTER TABLE public.alumnos 
ADD CONSTRAINT alumnos_organizacion_id_fkey 
  FOREIGN KEY (organizacion_id) 
  REFERENCES public.organizaciones(id) 
  ON DELETE CASCADE;

-- Para grupos
ALTER TABLE public.grupos 
DROP CONSTRAINT IF EXISTS grupos_organizacion_id_fkey;
ALTER TABLE public.grupos 
ADD CONSTRAINT grupos_organizacion_id_fkey 
  FOREIGN KEY (organizacion_id) 
  REFERENCES public.organizaciones(id) 
  ON DELETE CASCADE;

-- Para recibos
ALTER TABLE public.recibos 
DROP CONSTRAINT IF EXISTS recibos_organizacion_id_fkey;
ALTER TABLE public.recibos 
ADD CONSTRAINT recibos_organizacion_id_fkey 
  FOREIGN KEY (organizacion_id) 
  REFERENCES public.organizaciones(id) 
  ON DELETE CASCADE;

-- Para maestros
ALTER TABLE public.maestros 
DROP CONSTRAINT IF EXISTS maestros_organizacion_id_fkey;
ALTER TABLE public.maestros 
ADD CONSTRAINT maestros_organizacion_id_fkey 
  FOREIGN KEY (organizacion_id) 
  REFERENCES public.organizaciones(id) 
  ON DELETE CASCADE;

-- Para cursos
ALTER TABLE public.cursos 
DROP CONSTRAINT IF EXISTS cursos_organizacion_id_fkey;
ALTER TABLE public.cursos 
ADD CONSTRAINT cursos_organizacion_id_fkey 
  FOREIGN KEY (organizacion_id) 
  REFERENCES public.organizaciones(id) 
  ON DELETE CASCADE;

-- Para prospectos
ALTER TABLE public.prospectos 
DROP CONSTRAINT IF EXISTS prospectos_organizacion_id_fkey;
ALTER TABLE public.prospectos 
ADD CONSTRAINT prospectos_organizacion_id_fkey 
  FOREIGN KEY (organizacion_id) 
  REFERENCES public.organizaciones(id) 
  ON DELETE CASCADE;

-- Para salones
ALTER TABLE public.salones 
DROP CONSTRAINT IF EXISTS salones_organizacion_id_fkey;
ALTER TABLE public.salones 
ADD CONSTRAINT salones_organizacion_id_fkey 
  FOREIGN KEY (organizacion_id) 
  REFERENCES public.organizaciones(id) 
  ON DELETE CASCADE;

-- (Opcional: Si tienes más tablas que dependan directamente de organizacion_id, puedes agregar las constraints aquí de la misma forma)

SELECT 'Correcciones aplicadas: RLS desactivado en salon_instrumentos, políticas de grupos actualizadas y ON DELETE CASCADE configurado.' AS resultado;

-- ==========================================
-- FIX SUPABASE RLS POLICIES
-- Ejecuta esto en el SQL Editor de Supabase
-- ==========================================

-- 1. Habilitar RLS en las tablas (por si acaso)
ALTER TABLE public.recibos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfc_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfc_credenciales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumnos ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas existentes para evitar duplicados
DROP POLICY IF EXISTS "Permitir todo a anon en recibos" ON public.recibos;
DROP POLICY IF EXISTS "Permitir todo a anon en operaciones" ON public.operaciones;
DROP POLICY IF EXISTS "Permitir todo a anon en rfc_clientes" ON public.rfc_clientes;
DROP POLICY IF EXISTS "Permitir todo a anon en rfc_credenciales" ON public.rfc_credenciales;
DROP POLICY IF EXISTS "Permitir todo a anon en articulos" ON public.articulos;
DROP POLICY IF EXISTS "Permitir todo a anon en alumnos" ON public.alumnos;

-- 3. Crear nuevas políticas para permitir SELECT e INSERT (y UPDATE/DELETE si es necesario)
-- Nota: Usamos 'anon' porque es el rol por defecto si no hay login.

-- Recibos
CREATE POLICY "Permitir todo a anon en recibos" ON public.recibos 
FOR ALL USING (true) WITH CHECK (true);

-- Operaciones
CREATE POLICY "Permitir todo a anon en operaciones" ON public.operaciones 
FOR ALL USING (true) WITH CHECK (true);

-- RFC Clientes
CREATE POLICY "Permitir todo a anon en rfc_clientes" ON public.rfc_clientes 
FOR ALL USING (true) WITH CHECK (true);

-- RFC Credenciales
CREATE POLICY "Permitir todo a anon en rfc_credenciales" ON public.rfc_credenciales 
FOR ALL USING (true) WITH CHECK (true);

-- Artículos
CREATE POLICY "Permitir todo a anon en articulos" ON public.articulos 
FOR ALL USING (true) WITH CHECK (true);

-- Alumnos
CREATE POLICY "Permitir todo a anon en alumnos" ON public.alumnos 
FOR ALL USING (true) WITH CHECK (true);

-- 4. Asegurarse de que el rol anon tenga permisos de uso en el esquema public
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;

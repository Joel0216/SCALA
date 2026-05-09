-- Deshabilitar Row Level Security (RLS) en recibos_detalle
ALTER TABLE public.recibos_detalle DISABLE ROW LEVEL SECURITY;

-- Opcional: Eliminar políticas existentes para asegurar el acceso libre
DROP POLICY IF EXISTS "Enable read access for all users" ON public.recibos_detalle;
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.recibos_detalle;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.recibos_detalle;
DROP POLICY IF EXISTS "Enable delete access for all users" ON public.recibos_detalle;

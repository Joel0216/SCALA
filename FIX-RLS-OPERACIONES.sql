-- ==============================================================================
-- FIX RLS PARA OPERACIONES
-- ==============================================================================

-- La tabla nueva "operaciones" puede estar heredando RLS restrictivo 
-- o no tener políticas de RLS que permitan leer/escribir.
-- Para asegurar el libre paso temporal en el desarrollo/pruebas:

ALTER TABLE operaciones DISABLE ROW LEVEL SECURITY;
ALTER TABLE recibos_detalle DISABLE ROW LEVEL SECURITY;

-- O agregar políticas si quieres RLS activo:
-- CREATE POLICY "Permitir lectura general operaciones" ON operaciones FOR SELECT USING (true);
-- CREATE POLICY "Permitir insercion general operaciones" ON operaciones FOR INSERT WITH CHECK (true);

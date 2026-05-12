-- ==============================================================================
-- FIX-SEGURIDAD-MULTI-TENANT.sql
-- Solución para error en creación y aislamiento de datos (RLS)
-- Corrección: Se cambió "organization_id" por "organizacion_id" para coincidir con el schema.
-- ==============================================================================

-- 1. Asegurar que el ID de organizaciones sea autogenerado correctamente
ALTER TABLE organizaciones ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 2. Habilitar RLS en las tablas críticas si no lo están
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE alumnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE maestros ENABLE ROW LEVEL SECURITY;
ALTER TABLE grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE recibos ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS DE AISLAMIENTO (Multi-Tenant)
-- Nota: Estas políticas usan "organizacion_id" (con 'c') como nombre de columna.

-- Política para que usuarios solo vean su propia organización
DROP POLICY IF EXISTS "Usuarios ven su propia organizacion" ON organizaciones;
CREATE POLICY "Usuarios ven su propia organizacion" 
ON organizaciones FOR SELECT 
USING (id = ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'organizacion_id')::uuid OR ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'SuperAdmin'));

-- Permitir a SuperAdmin insertar organizaciones
DROP POLICY IF EXISTS "SuperAdmin inserta organizaciones" ON organizaciones;
CREATE POLICY "SuperAdmin inserta organizaciones" 
ON organizaciones FOR INSERT 
WITH CHECK (((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'SuperAdmin'));

-- Permitir a SuperAdmin borrar organizaciones
DROP POLICY IF EXISTS "SuperAdmin borra organizaciones" ON organizaciones;
CREATE POLICY "SuperAdmin borra organizaciones" 
ON organizaciones FOR DELETE 
USING (((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'SuperAdmin'));

-- Política para que usuarios solo vean miembros de su organización
DROP POLICY IF EXISTS "Usuarios ven miembros de su misma org" ON usuarios;
CREATE POLICY "Usuarios ven miembros de su misma org" 
ON usuarios FOR SELECT 
USING (organizacion_id = ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'organizacion_id')::uuid OR ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'SuperAdmin'));

-- Permitir inserción de usuarios
DROP POLICY IF EXISTS "Insertar usuarios" ON usuarios;
CREATE POLICY "Insertar usuarios" 
ON usuarios FOR INSERT 
WITH CHECK (
    (organizacion_id = ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'organizacion_id')::uuid) 
    OR ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'SuperAdmin')
);

-- Políticas para otras tablas críticas
DROP POLICY IF EXISTS "Acceso Multi-tenant Alumnos" ON alumnos;
CREATE POLICY "Acceso Multi-tenant Alumnos" ON alumnos
FOR ALL USING (organizacion_id = ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'organizacion_id')::uuid OR ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'SuperAdmin'));

DROP POLICY IF EXISTS "Acceso Multi-tenant Maestros" ON maestros;
CREATE POLICY "Acceso Multi-tenant Maestros" ON maestros
FOR ALL USING (organizacion_id = ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'organizacion_id')::uuid OR ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'SuperAdmin'));

DROP POLICY IF EXISTS "Acceso Multi-tenant Grupos" ON grupos;
CREATE POLICY "Acceso Multi-tenant Grupos" ON grupos
FOR ALL USING (organizacion_id = ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'organizacion_id')::uuid OR ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'SuperAdmin'));

DROP POLICY IF EXISTS "Acceso Multi-tenant Recibos" ON recibos;
CREATE POLICY "Acceso Multi-tenant Recibos" ON recibos
FOR ALL USING (organizacion_id = ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'organizacion_id')::uuid OR ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'SuperAdmin'));

-- 4. EXCEPCIÓN PARA SUPERADMIN (Opcional, si el SuperAdmin no tiene organizacion_id)
-- Si el rol es 'SuperAdmin', puede ver todo. Ya está incluido en las políticas de arriba.

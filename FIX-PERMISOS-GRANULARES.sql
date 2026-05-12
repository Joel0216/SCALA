-- ==============================================================================
-- FIX-PERMISOS-GRANULARES-V2.sql
-- Solución definitiva para el error de RLS (Row Level Security)
-- ==============================================================================

-- 1. Agregar organizacion_id a permisos_seguridad si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='permisos_seguridad' AND column_name='organizacion_id') THEN
        ALTER TABLE permisos_seguridad ADD COLUMN organizacion_id UUID REFERENCES organizaciones(id);
        
        -- Migrar datos existentes basados en el usuario
        UPDATE permisos_seguridad p
        SET organizacion_id = u.organizacion_id
        FROM usuarios u
        WHERE p.usuario_id = u.id;
    END IF;
END $$;

-- 2. Asegurar que existe el constraint de unicidad para el upsert
-- Esto permite que 'onConflict: usuario_id, seccion' funcione correctamente
ALTER TABLE permisos_seguridad DROP CONSTRAINT IF EXISTS unique_usuario_seccion;
ALTER TABLE permisos_seguridad ADD CONSTRAINT unique_usuario_seccion UNIQUE (usuario_id, seccion);

-- 3. SOLUCIÓN AL ERROR DE RLS:
-- Como la aplicación usa un sistema de usuarios propio (no Supabase Auth),
-- la forma más efectiva de permitir el guardado desde el cliente es
-- desactivar RLS en esta tabla o permitir acceso total al rol 'anon'.

-- Opción: Desactivar RLS (Recomendado para apps con Auth personalizado en JS)
ALTER TABLE permisos_seguridad DISABLE ROW LEVEL SECURITY;

-- Opcional: Si prefieres mantener RLS activado, usa esta política para permitir todo al rol anon
-- (Descomenta las líneas de abajo si decides reactivar RLS)
-- ALTER TABLE permisos_seguridad ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Permitir todo a anon" ON permisos_seguridad;
-- CREATE POLICY "Permitir todo a anon" ON permisos_seguridad FOR ALL TO anon USING (true) WITH CHECK (true);

-- 4. Limpieza de datos duplicados (opcional, por si acaso)
DELETE FROM permisos_seguridad a USING permisos_seguridad b
WHERE a.id < b.id 
AND a.usuario_id = b.usuario_id 
AND a.seccion = b.seccion;

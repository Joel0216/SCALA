-- ==============================================================================
-- MIGRACION MULTI-TENANT SCALA (SaaS Overhaul)
-- ==============================================================================

-- 1. Crear tabla de Organizaciones
CREATE TABLE IF NOT EXISTS organizaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Insertar Organización Principal (para migrar datos actuales)
INSERT INTO organizaciones (id, nombre) 
VALUES ('00000000-0000-0000-0000-000000000000', 'Sede Principal')
ON CONFLICT (id) DO NOTHING;

-- 3. Modificar tabla de Usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS organizacion_id UUID REFERENCES organizaciones(id);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email VARCHAR(150);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS username VARCHAR(50);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS password_plain TEXT; -- Para depuración inicial (opcional)

-- 4. Crear SuperAdmin Inicial
INSERT INTO usuarios (user_id, password, nombre, rol, organizacion_id, username)
VALUES ('NellyAdmin2026', '123456', 'Super Administrador', 'SuperAdmin', '00000000-0000-0000-0000-000000000000', 'NellyAdmin2026')
ON CONFLICT (user_id) DO UPDATE SET 
    password = EXCLUDED.password,
    rol = 'SuperAdmin',
    organizacion_id = '00000000-0000-0000-0000-000000000000';

-- 5. Crear tabla de Permisos (NMC)
CREATE TABLE IF NOT EXISTS permisos_seguridad (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    seccion VARCHAR(50) NOT NULL, -- 'Archivos', 'Caja', 'Reportes', 'Exámenes', 'Mantenimiento', 'Seguridad'
    permiso CHAR(1) DEFAULT 'M', -- N=None, M=Modify, C=Consult
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(usuario_id, seccion)
);

-- 6. Agregar organizacion_id a todas las tablas y migrar datos
DO $$ 
DECLARE 
    t TEXT;
    tablas TEXT[] := ARRAY[
        'alumnos', 'maestros', 'cursos', 'grupos', 'alumno_grupos', 
        'motivos_baja', 'instrumentos', 'medios_contacto', 'salones', 
        'tipos_movimiento', 'grupos_articulos', 'articulos', 
        'movimientos_inventario', 'prospectos', 'rfc_clientes', 
        'rfc_credenciales', 'recibos', 'recibos_detalle', 
        'recibos_cancelados', 'colegiaturas', 'programacion_examenes', 
        'resultados_examen'
    ];
BEGIN
    FOREACH t IN ARRAY tablas LOOP
        -- Agregar columna si no existe
        EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS organizacion_id UUID REFERENCES organizaciones(id)', t);
        
        -- Asignar todos los datos actuales a la Sede Principal
        EXECUTE format('UPDATE %I SET organizacion_id = ''00000000-0000-0000-0000-000000000000'' WHERE organizacion_id IS NULL', t);
        
        -- (Opcional) Hacer la columna NOT NULL después de migrar
        -- EXECUTE format('ALTER TABLE %I ALTER COLUMN organizacion_id SET NOT NULL', t);
    END LOOP;
END $$;

-- 7. Actualizar RLS para aislamiento de datos
-- (Asumiendo que anon tiene acceso total por ahora, pero filtraremos en el JS)
-- Si quisiéramos RLS estricto, aquí configuraríamos políticas basadas en organizacion_id.

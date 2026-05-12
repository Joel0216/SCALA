-- ==============================================================================
-- FIX-UNIQUE-CONSTRAINTS-MULTI-TENANT.sql
-- Academia SCALA - SaaS Multi-tenant
-- ==============================================================================
-- Propósito: Modificar las restricciones de unicidad para permitir aislamiento 
-- multi-tenant real. Diferentes organizaciones podrán usar las mismas claves.
-- ==============================================================================

DO $$ 
BEGIN

    -- 1. SALONES (Número)
    ALTER TABLE salones DROP CONSTRAINT IF EXISTS salones_numero_key CASCADE;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'salones_numero_org_unique') THEN
        ALTER TABLE salones ADD CONSTRAINT salones_numero_org_unique UNIQUE (numero, organizacion_id);
    END IF;

    -- 2. MAESTROS (Clave)
    ALTER TABLE maestros DROP CONSTRAINT IF EXISTS maestros_clave_key CASCADE;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'maestros_clave_org_unique') THEN
        ALTER TABLE maestros ADD CONSTRAINT maestros_clave_org_unique UNIQUE (clave, organizacion_id);
    END IF;

    -- 3. GRUPOS (Clave)
    ALTER TABLE grupos DROP CONSTRAINT IF EXISTS grupos_clave_key CASCADE;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'grupos_clave_org_unique') THEN
        ALTER TABLE grupos ADD CONSTRAINT grupos_clave_org_unique UNIQUE (clave, organizacion_id);
    END IF;

    -- 4. ALUMNOS (Credencial)
    ALTER TABLE alumnos DROP CONSTRAINT IF EXISTS alumnos_credencial_key CASCADE;
    ALTER TABLE alumnos DROP CONSTRAINT IF EXISTS alumnos_credencial1_key CASCADE;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'alumnos_credencial_org_unique') THEN
        ALTER TABLE alumnos ADD CONSTRAINT alumnos_credencial_org_unique UNIQUE (credencial, organizacion_id);
    END IF;

    -- 5. CURSOS (Nombre y Clave)
    ALTER TABLE cursos DROP CONSTRAINT IF EXISTS cursos_curso_key CASCADE;
    ALTER TABLE cursos DROP CONSTRAINT IF EXISTS cursos_clave_key CASCADE;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cursos_nombre_org_unique') THEN
        ALTER TABLE cursos ADD CONSTRAINT cursos_nombre_org_unique UNIQUE (curso, organizacion_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cursos_clave_org_unique') THEN
        ALTER TABLE cursos ADD CONSTRAINT cursos_clave_org_unique UNIQUE (clave, organizacion_id);
    END IF;

    -- 6. RECIBOS (Número)
    ALTER TABLE recibos DROP CONSTRAINT IF EXISTS recibos_numero_key CASCADE;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recibos_numero_org_unique') THEN
        ALTER TABLE recibos ADD CONSTRAINT recibos_numero_org_unique UNIQUE (numero, organizacion_id);
    END IF;

    -- 7. ARTICULOS (Clave)
    ALTER TABLE articulos DROP CONSTRAINT IF EXISTS articulos_clave_key CASCADE;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'articulos_clave_org_unique') THEN
        ALTER TABLE articulos ADD CONSTRAINT articulos_clave_org_unique UNIQUE (clave, organizacion_id);
    END IF;

    -- 8. GRUPOS DE ARTICULOS (Grupo)
    ALTER TABLE grupos_articulos DROP CONSTRAINT IF EXISTS grupos_articulos_nombre_key CASCADE;
    ALTER TABLE grupos_articulos DROP CONSTRAINT IF EXISTS grupos_articulos_grupo_key CASCADE;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'grupos_articulos_nombre_org_unique') THEN
        ALTER TABLE grupos_articulos ADD CONSTRAINT grupos_articulos_nombre_org_unique UNIQUE (grupo, organizacion_id);
    END IF;

    -- 9. RFC CLIENTES (RFC)
    ALTER TABLE rfc_clientes DROP CONSTRAINT IF EXISTS rfc_clientes_rfc_key CASCADE;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rfc_clientes_rfc_org_unique') THEN
        ALTER TABLE rfc_clientes ADD CONSTRAINT rfc_clientes_rfc_org_unique UNIQUE (rfc, organizacion_id);
    END IF;

    -- 10. INSTRUMENTOS (Clave)
    ALTER TABLE instrumentos DROP CONSTRAINT IF EXISTS instrumentos_clave_key CASCADE;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'instrumentos_clave_org_unique') THEN
        ALTER TABLE instrumentos ADD CONSTRAINT instrumentos_clave_org_unique UNIQUE (clave, organizacion_id);
    END IF;

    -- 11. MOTIVOS DE BAJA (Clave)
    ALTER TABLE motivos_baja DROP CONSTRAINT IF EXISTS motivos_baja_clave_key CASCADE;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'motivos_baja_clave_org_unique') THEN
        ALTER TABLE motivos_baja ADD CONSTRAINT motivos_baja_clave_org_unique UNIQUE (clave, organizacion_id);
    END IF;

    -- 12. MEDIOS DE CONTACTO (Clave)
    ALTER TABLE medios_contacto DROP CONSTRAINT IF EXISTS medios_contacto_clave_key CASCADE;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'medios_contacto_clave_org_unique') THEN
        ALTER TABLE medios_contacto ADD CONSTRAINT medios_contacto_clave_org_unique UNIQUE (clave, organizacion_id);
    END IF;

    -- 13. USUARIOS (user_id)
    ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_user_id_key CASCADE;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'usuarios_user_id_org_unique') THEN
        ALTER TABLE usuarios ADD CONSTRAINT usuarios_user_id_org_unique UNIQUE (user_id, organizacion_id);
    END IF;

    -- 14. RECREAR LLAVES FORÁNEAS COMPUESTAS
    -- alumno_grupos -> grupos (clave, organizacion_id)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'alumno_grupos_grupo_fkey') THEN
        ALTER TABLE alumno_grupos ADD CONSTRAINT alumno_grupos_grupo_fkey 
        FOREIGN KEY (grupo_clave, organizacion_id) REFERENCES grupos(clave, organizacion_id);
    END IF;

    -- grupos -> salones (numero, organizacion_id)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'grupos_salon_fkey') THEN
        ALTER TABLE grupos ADD CONSTRAINT grupos_salon_fkey 
        FOREIGN KEY (salon_id, organizacion_id) REFERENCES salones(numero, organizacion_id);
    END IF;

END $$;

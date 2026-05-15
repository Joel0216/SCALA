-- ============================================================
-- MIGRACIÓN: Sistema de Exámenes - Limpieza y Aislamiento Multi-tenant
-- ============================================================

DO $$ 
BEGIN
    -- 1. Asegurar organizacion_id en programacion_examenes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'programacion_examenes' AND column_name = 'organizacion_id') THEN
        ALTER TABLE programacion_examenes ADD COLUMN organizacion_id UUID;
    END IF;

    -- 2. Asegurar organizacion_id en resultados_examen
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resultados_examen' AND column_name = 'organizacion_id') THEN
        ALTER TABLE resultados_examen ADD COLUMN organizacion_id UUID;
    END IF;

    -- 3. LIMPIEZA DE DUPLICADOS antes de aplicar UNIQUE
    -- Borrar duplicados en programacion_examenes.
    -- PRIORIDAD: Mantener el registro donde alumno_id IS NULL (es el encabezado/programación)
    DELETE FROM programacion_examenes 
    WHERE id IN (
        SELECT id FROM (
            SELECT id, 
                   ROW_NUMBER() OVER (
                       PARTITION BY clave_examen, organizacion_id 
                       ORDER BY (CASE WHEN alumno_id IS NULL THEN 0 ELSE 1 END), created_at DESC
                   ) as rn
            FROM programacion_examenes
        ) t WHERE t.rn > 1
    );

    -- Borrar duplicados en resultados_examen
    DELETE FROM resultados_examen 
    WHERE id IN (
        SELECT id FROM (
            SELECT id, ROW_NUMBER() OVER (PARTITION BY clave_examen, alumno_id, organizacion_id ORDER BY created_at DESC) as rn
            FROM resultados_examen
        ) t WHERE t.rn > 1
    );

    -- 4. CONSTRAINT UNIQUE en programacion_examenes (clave_examen, organizacion_id)
    ALTER TABLE programacion_examenes DROP CONSTRAINT IF EXISTS programacion_examenes_clave_examen_key CASCADE;
    ALTER TABLE programacion_examenes DROP CONSTRAINT IF EXISTS programacion_examenes_clave_org_unique CASCADE;
    
    ALTER TABLE programacion_examenes ADD CONSTRAINT programacion_examenes_clave_org_unique UNIQUE (clave_examen, organizacion_id);

    -- 5. CONSTRAINT UNIQUE en resultados_examen (clave_examen, alumno_id, organizacion_id)
    ALTER TABLE resultados_examen DROP CONSTRAINT IF EXISTS resultados_examen_unique_v2 CASCADE;
    ALTER TABLE resultados_examen ADD CONSTRAINT resultados_examen_unique_v2 UNIQUE (clave_examen, alumno_id, organizacion_id);

END $$;

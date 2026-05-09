-- ==============================================================================
-- FIX-EXAMENES-SCHEMA.sql
-- Asegura columnas de pago y estatus para el módulo de exámenes
-- ==============================================================================

DO $$ 
BEGIN
    -- 1. Asegurar tipos de datos consistentes para alumno_id
    IF (SELECT data_type FROM information_schema.columns WHERE table_name = 'alumnos' AND column_name = 'id') = 'uuid' THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'programacion_examenes' AND column_name = 'alumno_id' AND data_type != 'uuid') THEN
            ALTER TABLE programacion_examenes ALTER COLUMN alumno_id TYPE UUID USING alumno_id::uuid;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resultados_examen' AND column_name = 'alumno_id' AND data_type != 'uuid') THEN
            ALTER TABLE resultados_examen ALTER COLUMN alumno_id TYPE UUID USING alumno_id::uuid;
        END IF;
    END IF;
END $$;

-- 2. Asegurar columnas necesarias para la UI y Pagos
ALTER TABLE programacion_examenes ADD COLUMN IF NOT EXISTS pagado BOOLEAN DEFAULT false;
ALTER TABLE programacion_examenes ADD COLUMN IF NOT EXISTS costo DECIMAL(10,2) DEFAULT 0;
ALTER TABLE programacion_examenes ADD COLUMN IF NOT EXISTS certificado VARCHAR(50);

-- 3. Asegurar que resultados_examen tenga columnas mínimas si no existen
ALTER TABLE resultados_examen ADD COLUMN IF NOT EXISTS calificacion DECIMAL(5,2);
ALTER TABLE resultados_examen ADD COLUMN IF NOT EXISTS observaciones TEXT;

-- 4. Asegurar relaciones con maestros (maestro_base_id)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'programacion_examenes_maestro_base_id_fkey') THEN
        ALTER TABLE programacion_examenes 
        ADD CONSTRAINT programacion_examenes_maestro_base_id_fkey 
        FOREIGN KEY (maestro_base_id) REFERENCES maestros(id);
    END IF;
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'No se pudo crear la FK de maestros.';
END $$;

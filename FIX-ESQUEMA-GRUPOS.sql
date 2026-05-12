-- ==============================================================================
-- FIX-ESQUEMA-GRUPOS.sql
-- Asegura que la tabla grupos tenga todas las columnas requeridas por SCALA
-- ==============================================================================

-- 1. Agregar columna 'salon' si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='grupos' AND column_name='salon') THEN
        ALTER TABLE grupos ADD COLUMN salon TEXT;
    END IF;
END $$;

-- 2. Asegurar otras columnas que suelen usarse en las consultas de grupos
DO $$ 
BEGIN
    -- salon_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='grupos' AND column_name='salon_id') THEN
        ALTER TABLE grupos ADD COLUMN salon_id TEXT;
    END IF;

    -- grado
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='grupos' AND column_name='grado') THEN
        ALTER TABLE grupos ADD COLUMN grado INTEGER DEFAULT 1;
    END IF;

    -- costo_mensual
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='grupos' AND column_name='costo_mensual') THEN
        ALTER TABLE grupos ADD COLUMN costo_mensual NUMERIC(10,2) DEFAULT 0;
    END IF;
END $$;

-- 3. Asegurar columnas en alumno_grupos
DO $$ 
BEGIN
    -- grupo_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='alumno_grupos' AND column_name='grupo_id') THEN
        ALTER TABLE alumno_grupos ADD COLUMN grupo_id UUID REFERENCES grupos(id);
    END IF;

    -- curso_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='alumno_grupos' AND column_name='curso_id') THEN
        ALTER TABLE alumno_grupos ADD COLUMN curso_id UUID REFERENCES cursos(id);
    END IF;

    -- grupo_clave
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='alumno_grupos' AND column_name='grupo_clave') THEN
        ALTER TABLE alumno_grupos ADD COLUMN grupo_clave TEXT;
    END IF;

    -- curso_clave
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='alumno_grupos' AND column_name='curso_clave') THEN
        ALTER TABLE alumno_grupos ADD COLUMN curso_clave TEXT;
    END IF;

    -- credencial_vinculada
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='alumno_grupos' AND column_name='credencial_vinculada') THEN
        ALTER TABLE alumno_grupos ADD COLUMN credencial_vinculada TEXT;
    END IF;

    -- organizacion_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='alumno_grupos' AND column_name='organizacion_id') THEN
        ALTER TABLE alumno_grupos ADD COLUMN organizacion_id UUID REFERENCES organizaciones(id);
    END IF;
END $$;

-- 4. Comentario de éxito
COMMENT ON TABLE alumno_grupos IS 'Relación entre alumnos y sus grupos inscritos';

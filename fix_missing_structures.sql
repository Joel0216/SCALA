-- Fix missing structures for SCALA and SCALA_movil

-- 1. Create sesiones_clase table for attendance tracking
CREATE TABLE IF NOT EXISTS sesiones_clase (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grupo_id UUID REFERENCES grupos(id),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    tema_visto TEXT,
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(grupo_id, fecha)
);

-- 2. Create v_resultados_examen view if it doesn't exist
-- This view aggregates results from programacion_examenes and potentially other tables
CREATE OR REPLACE VIEW v_resultados_examen AS
SELECT 
    pe.id as identificador_id,
    pe.alumno_id,
    a.credencial1 as credencial_alumno,
    a.nombre as nombre_alumno,
    pe.clave_examen,
    pe.fecha,
    pe.calificacion,
    pe.aprobado,
    pe.maestro_id,
    m.nombre as nombre_maestro,
    pe.grupo_examinado_id -- Assuming this might be added or used
FROM programacion_examenes pe
JOIN alumnos a ON pe.alumno_id = a.id
JOIN maestros m ON pe.maestro_id = m.id;

-- 3. Add column to programacion_examenes if missing (referenced in screenshot)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='programacion_examenes' AND column_name='grupo_examinado_id') THEN
        ALTER TABLE programacion_examenes ADD COLUMN grupo_examinado_id UUID REFERENCES grupos(id);
    END IF;
END $$;

-- 4. Disable RLS for the new table
ALTER TABLE sesiones_clase DISABLE ROW LEVEL SECURITY;

-- 5. Ensure asistencias table exists and is linked correctly
-- (Created earlier, but ensuring it matches mobile app needs)
CREATE TABLE IF NOT EXISTS asistencias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alumno_id UUID REFERENCES alumnos(id),
    grupo_id UUID REFERENCES grupos(id),
    sesion_id UUID REFERENCES sesiones_clase(id),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    estatus VARCHAR(20) NOT NULL, -- 'asistió', 'falta', 'retardo', 'justificada'
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(alumno_id, sesion_id)
);

ALTER TABLE asistencias DISABLE ROW LEVEL SECURITY;

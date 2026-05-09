-- Create examenes table (Modern version for mobile management)
CREATE TABLE IF NOT EXISTS examenes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clave_examen VARCHAR(50) UNIQUE NOT NULL,
    grupo_id UUID REFERENCES grupos(id) ON DELETE CASCADE,
    nombre_examen VARCHAR(100),
    duracion_minutos INTEGER DEFAULT 120,
    fecha_programada DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create calificaciones_examen table
CREATE TABLE IF NOT EXISTS calificaciones_examen (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    examen_id UUID REFERENCES examenes(id) ON DELETE CASCADE,
    alumno_id UUID REFERENCES alumnos(id) ON DELETE CASCADE,
    calificacion DECIMAL(5,2),
    asistencia_validada BOOLEAN DEFAULT false,
    observaciones TEXT,
    fecha_asentado TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(examen_id, alumno_id)
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_calificaciones_alumno ON calificaciones_examen(alumno_id);
CREATE INDEX IF NOT EXISTS idx_calificaciones_examen ON calificaciones_examen(examen_id);

COMMENT ON TABLE examenes IS 'Management of exams scheduled by groups';
COMMENT ON TABLE calificaciones_examen IS 'Student grades for specific exams, requiring attendance validation';

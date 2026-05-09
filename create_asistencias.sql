-- Create asistencias table
CREATE TABLE IF NOT EXISTS asistencias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alumno_id UUID REFERENCES alumnos(id) ON DELETE CASCADE,
    grupo_id UUID REFERENCES grupos(id) ON DELETE CASCADE,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    estatus TEXT NOT NULL CHECK (estatus IN ('Asistió', 'Faltó')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(alumno_id, grupo_id, fecha)
);

-- Indices for faster lookups
CREATE INDEX IF NOT EXISTS idx_asistencias_alumno ON asistencias(alumno_id);
CREATE INDEX IF NOT EXISTS idx_asistencias_grupo_fecha ON asistencias(grupo_id, fecha);

COMMENT ON TABLE asistencias IS 'Table to track daily student attendance';

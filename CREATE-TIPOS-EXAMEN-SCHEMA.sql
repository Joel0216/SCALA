-- Habilitar extensión para UUIDs si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- SCHEMA PARA TIPOS DE EXAMENES
CREATE TABLE IF NOT EXISTS tipos_examen (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(10) UNIQUE,
    descripcion VARCHAR(100) NOT NULL UNIQUE
);

-- Insertar valores iniciales
INSERT INTO tipos_examen (clave, descripcion) VALUES
('TE-01', 'GRADO BASICO'),
('TE-02', 'NIVEL 1'),
('TE-03', 'NIVEL 2'),
('TE-04', 'BAJO ELECTRICO'),
('TE-05', 'BATERIA'),
('TE-06', 'CANTO'),
('TE-07', 'GUITARRA ACUSTICA'),
('TE-08', 'GUITARRA ELECTRICA'),
('TE-09', 'PIANO ACUSTICO / TECLADO'),
('TE-10', 'SAXOFON'),
('TE-11', 'VIOLIN')
ON CONFLICT (descripcion) DO NOTHING;

-- Programación de Exámenes
CREATE TABLE IF NOT EXISTS programacion_examenes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumno_id INTEGER,
  credencial VARCHAR(10),
  clave_examen VARCHAR(50),
  tipo_examen VARCHAR(100),
  fecha DATE NOT NULL,
  hora TIME,
  maestro_base_id BIGINT,
  examinador1_id BIGINT,
  examinador2_id BIGINT,
  salon_id INTEGER,
  curso_nombre VARCHAR(100),
  calificacion DECIMAL(5,2),
  aprobado BOOLEAN,
  certificado VARCHAR(50),
  pagado BOOLEAN DEFAULT false,
  monto DECIMAL(10,2),
  recibo_id UUID,
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices de optimización
CREATE INDEX IF NOT EXISTS idx_examenes_alumno ON programacion_examenes(alumno_id);
CREATE INDEX IF NOT EXISTS idx_examenes_fecha ON programacion_examenes(fecha);
CREATE INDEX IF NOT EXISTS idx_examenes_clave ON programacion_examenes(clave_examen);

-- Schema de Salones para SCALA
-- EJECUTAR EN SUPABASE SQL EDITOR

DROP TABLE IF EXISTS salones CASCADE;

CREATE TABLE salones (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(10) UNIQUE NOT NULL,
    ubicacion VARCHAR(100),
    capacidad INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índice
CREATE INDEX idx_salones_numero ON salones(numero);

-- Datos de ejemplo (después los reemplazaremos con los reales del Excel)
INSERT INTO salones (numero, ubicacion, capacidad) VALUES
('1', 'Planta Baja', 10),
('2', 'Planta Baja', 8),
('3', 'Primer Piso', 12),
('4', 'Primer Piso', 10),
('5', 'Segundo Piso', 8);

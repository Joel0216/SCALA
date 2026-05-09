-- Schema de Alumnos para SCALA
-- EJECUTAR EN SUPABASE SQL EDITOR

-- Eliminar tabla existente
DROP TABLE IF EXISTS alumnos CASCADE;

-- Crear tabla alumnos
CREATE TABLE alumnos (
    id SERIAL PRIMARY KEY,
    credencial INTEGER UNIQUE NOT NULL,
    dig_ver INTEGER DEFAULT 0,
    nombre VARCHAR(200) NOT NULL,
    direccion1 VARCHAR(200),
    direccion2 VARCHAR(200),
    telefono VARCHAR(20),
    celular VARCHAR(20),
    email VARCHAR(100),
    fecha_nacimiento DATE,
    edad INTEGER,
    fecha_ingreso DATE,
    nombre_padre VARCHAR(200),
    telefono_padre VARCHAR(20),
    nombre_madre VARCHAR(200),
    telefono_madre VARCHAR(20),
    grupo_clave VARCHAR(20),
    salon VARCHAR(10),
    grado VARCHAR(50),
    beca BOOLEAN DEFAULT FALSE,
    porcentaje_beca DECIMAL(5,2) DEFAULT 0.00,
    comentario TEXT,
    reingreso BOOLEAN DEFAULT FALSE,
    instrumento_clave VARCHAR(10),
    medio_clave VARCHAR(10),
    fecha_baja DATE,
    motivo_baja VARCHAR(10),
    observaciones_baja TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_alumnos_credencial ON alumnos(credencial);
CREATE INDEX idx_alumnos_nombre ON alumnos(nombre);
CREATE INDEX idx_alumnos_grupo ON alumnos(grupo_clave);
CREATE INDEX idx_alumnos_activo ON alumnos(activo);

-- Función para obtener la siguiente credencial
CREATE OR REPLACE FUNCTION get_next_credencial()
RETURNS INTEGER AS $$
DECLARE
    max_cred INTEGER;
BEGIN
    SELECT COALESCE(MAX(credencial), 3778) INTO max_cred FROM alumnos;
    RETURN max_cred + 1;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- REDISEÑO CATÁLOGO DE OPERACIONES
-- Elimina la tabla actual y la recrea con id SERIAL PRIMARY KEY (números automáticos)
-- e incluye un flag "activo", removiendo created_at y updated_at.
-- ==============================================================================

-- 1. Eliminar la tabla actual 
DROP TABLE IF EXISTS operaciones CASCADE;

-- 2. Crear la tabla del catálogo de nuevo
CREATE TABLE operaciones (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(200) UNIQUE NOT NULL,
    precio DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    iva DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    activo BOOLEAN DEFAULT true
);

-- 3. Desactivar RLS por simplicidad (como acordado antes para no bloquear consultas JS)
ALTER TABLE operaciones DISABLE ROW LEVEL SECURITY;

-- 4. Insertar los datos base iniciales
INSERT INTO operaciones (nombre, precio, iva, activo) VALUES
('PAQUETE ABC 2013', 950.00, 0.00, true),
('ABC HOME SWEET HOME', 120.00, 0.00, true),
('ANUALIDAD', 300.00, 0.16, true),
('CANTO INFANTIL', 550.00, 1.16, true),
('COLEGIATURAS', 0.00, 0.15, true),
('CUADERNO PAUTADO DE BATERIA', 70.00, 0.16, true),
('DRUM KIDS', 200.00, 0.16, true),
('DRUM KIDS INDIVIDUAL', 850.00, 0.16, true),
('ENGLISH MUSIC', 600.00, 1.16, true),
('EXAMEN DE NIVEL 1', 0.00, 0.16, true),
('EXAMEN DE NIVEL 2', 0.00, 0.16, true),
('EXAMEN DE NIVEL 3', 0.00, 0.00, true),
('EXAMEN DE NIVEL 4', 0.00, 0.16, true),
('PAGO DE EXAMEN', 100.00, 0.00, true),
('FIGURAS MATCH', 248.00, 0.00, true),
('FIGURAS RITMICAS', 248.00, 0.00, true),
('HORAS KINDER', 180.00, 0.16, true),
('HORAS PRIMARIA', 180.00, 0.16, true),
('INICIACION Y EXPRESION ESCENICA', 700.00, 0.16, true),
('INSCRIPCION', 500.00, 0.15, true),
('MOCHILA SCALA NIÑOS', 150.00, 0.00, true),
('MONQUI KIDS', 600.00, 0.16, true),
('MONQUI TODDLER', 600.00, 0.16, true),
('METODO BABY MUSIC', 200.00, 0.16, true),
('METODO DE DRUM KIDS', 200.00, 0.16, true),
('METODO DE INICIACION MUSICAL', 300.00, 0.16, true),
('METODO DE SOLFEO', 140.00, 0.16, true),
('ON THE GO', 120.00, 0.00, true),
('PAQUETE BABY MUSIC', 450.00, 0.16, true),
('PAGO DE EVENTO', 500.00, 0.16, true),
('PIANO PREPARATORIO', 200.00, 0.16, true),
('PLAYERAS KINDERMUSIK', 60.00, 0.00, true),
('UNIFORMES KM', 60.00, 0.16, true),
('PRACTICADOR DE PIANO', 20.00, 0.00, true),
('PIANO PREPARATORIO INFANTIL', 190.00, 0.16, true),
('PENTAGRAMA', 258.00, 0.00, true),
('RE-INSCRIPCION', 550.00, 0.00, true),
('TECLADO PAPEL', 9.00, 0.15, true),
('VIOLIN INFANTIL', 200.00, 0.16, true),
('VIOLIN INFANTIL INDIVIDUAL', 550.00, 0.16, true);

SELECT COUNT(*) as total_operaciones FROM operaciones;

-- ==============================================================================
-- DATOS INICIALES PARA EL NUEVO CATÁLOGO DE "OPERACIONES"
-- Ejecutar en el Editor SQL de Supabase después de haber ejecutado 
-- el script de cambio de tablas (UPDATE-OPERACIONES.sql)
-- ==============================================================================

-- Limpiar la tabla de operaciones antes de la inserción por si se ejecuta varias veces
TRUNCATE TABLE operaciones CASCADE;

-- Insertar el catálogo de artículos/operaciones anteriores sin inventario/stock
INSERT INTO operaciones (nombre, precio, iva) VALUES
('PAQUETE ABC 2013', 950.00, 0.00),
('ABC HOME SWEET HOME', 120.00, 0.00),
('ANUALIDAD', 300.00, 0.16),
('CANTO INFANTIL', 550.00, 1.16),
('COLEGIATURAS', 0.00, 0.15),
('CUADERNO PAUTADO DE BATERIA', 70.00, 0.16),
('DRUM KIDS', 200.00, 0.16),
('DRUM KIDS INDIVIDUAL', 850.00, 0.16),
('ENGLISH MUSIC', 600.00, 1.16),
('EXAMEN DE NIVEL 1', 0.00, 0.16),
('EXAMEN DE NIVEL 2', 0.00, 0.16),
('EXAMEN DE NIVEL 3', 0.00, 0.00),
('EXAMEN DE NIVEL 4', 0.00, 0.16),
('PAGO DE EXAMEN', 100.00, 0.00),
('FIGURAS MATCH', 248.00, 0.00),
('FIGURAS RITMICAS', 248.00, 0.00),
('HORAS KINDER', 180.00, 0.16),
('HORAS PRIMARIA', 180.00, 0.16),
('INICIACION Y EXPRESION ESCENICA', 700.00, 0.16),
('INSCRIPCION', 500.00, 0.15),
('MOCHILA SCALA NIÑOS', 150.00, 0.00),
('MONQUI KIDS', 600.00, 0.16),
('MONQUI TODDLER', 600.00, 0.16),
('METODO BABY MUSIC', 200.00, 0.16),
('METODO DE DRUM KIDS', 200.00, 0.16),
('METODO DE INICIACION MUSICAL', 300.00, 0.16),
('METODO DE SOLFEO', 140.00, 0.16),
('ON THE GO', 120.00, 0.00),
('PAQUETE BABY MUSIC', 450.00, 0.16),
('PAGO DE EVENTO', 500.00, 0.16),
('PIANO PREPARATORIO', 200.00, 0.16),
('PLAYERAS KINDERMUSIK', 60.00, 0.00),
('UNIFORMES KM', 60.00, 0.16),
('PRACTICADOR DE PIANO', 20.00, 0.00),
('PIANO PREPARATORIO INFANTIL', 190.00, 0.16),
('PENTAGRAMA', 258.00, 0.00),
('RE-INSCRIPCION', 550.00, 0.00),
('TECLADO PAPEL', 9.00, 0.15),
('VIOLIN INFANTIL', 200.00, 0.16),
('VIOLIN INFANTIL INDIVIDUAL', 550.00, 0.16);

-- Verificar cantidad de registros insertados
SELECT COUNT(*) as total_operaciones FROM operaciones;

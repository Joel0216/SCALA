-- ============================================
-- DATOS: Artículos (42 registros)
-- ============================================
-- Autor: Sistema SCALA
-- Fecha: 2026-02-15
-- ============================================

-- Insertar artículos
INSERT INTO articulos (clave, descripcion, grupo, precio, iva, stock) VALUES
('ABC2013', 'Paquete ABC 2013', 'Materiales', 950.00, 0.00, 6),
('ABCHSH', 'ABC HOME SWEET HOME', 'Métodos', 120.00, 0.00, 3),
('AN', 'ANUALIDAD', 'ANUALIDAD', 300.00, 0.16, 60),
('C3', '', '', 0.00, 0.00, 0),
('CI', 'CANTO INFANTIL', 'Métodos', 550.00, 1.16, 300),
('COLEGIATURAS', 'Colegiaturas', 'Colegiaturas', 0.00, 0.15, 1),
('CEB', 'CUADERNO PAUTADO DE BATERIA', 'Métodos', 70.00, 0.16, 0),
('DK', 'Drum kids', 'Colegiaturas', 200.00, 0.16, 300),
('DKM', 'DRUM KIDS INDIVIDUAL', 'Colegiaturas', 850.00, 0.16, 300),
('EM', 'ENGLISH MUSIC', 'Colegiaturas', 600.00, 1.16, 300),
('EN1', 'EXAMEN DE NIVEL 1', 'Examen Gdo. Bas.', 0.00, 0.16, 6000),
('EN2', 'EXAMEN DE NIVEL 2', 'Colegiaturas', 0.00, 0.16, 6000),
('EN3', 'EXAMEN DE NIVEL 3', 'Colegiaturas', 0.00, 0.00, 6000),
('EN4', 'EXAMEN DE NIVEL 4', 'Colegiaturas', 0.00, 0.16, 6000),
('EP', 'PAGO DE EXAMEN', '', 100.00, 0.00, 0),
('FGM', 'FIGURAS MATCH', 'Materiales', 248.00, 0.00, 5),
('FGMR', 'FIGURAS RITMICAS', 'Materiales', 248.00, 0.00, 5),
('HK', 'HORAS KINDER', 'Otros', 180.00, 0.16, 0),
('HP', 'HORAS PRIMARIA', 'Otros', 180.00, 0.16, 0),
('IE', 'INICIACION Y EXPRESION ESCENICA', 'Colegiaturas', 700.00, 0.16, 100),
('INS', 'Inscripcion', 'Inscripciones', 500.00, 0.15, 0),
('MC', 'MOCHILA SCALA NIÑOS', 'Artic. Promocionales', 150.00, 0.00, -1),
('MK', 'MONQUI KIDS', 'Colegiaturas', 600.00, 0.16, 300),
('MT', 'MONQUI TODDLER', 'Colegiaturas', 600.00, 0.16, 0),
('MTBM', 'METODO BABY MUSIC', 'Métodos', 200.00, 0.16, -6),
('MTDK', 'METODO DE DRUM KIDS', 'Métodos', 200.00, 0.16, -15),
('MTIM', 'METODO DE INICIACION MUSICAL', 'Métodos', 300.00, 0.16, -7),
('mts', 'metodo de solfeo', 'Métodos', 140.00, 0.16, -1),
('OTG', 'ON THE GO', 'Materiales', 120.00, 0.00, 1),
('PB', 'PAQUETE BABY MUSIC', 'Métodos', 450.00, 0.16, 293),
('PE', 'PAGO DE EVENTO', 'PAGO DE EVENTO', 500.00, 0.16, 6),
('PIP', 'PIANO PREPARATORIO', 'Métodos', 200.00, 0.16, -25),
('PKM', 'PLAYERAS KINDERMUSIK', 'Materiales', 60.00, 0.00, 2),
('pkm 2', 'Uniformes KM', 'Otros', 60.00, 0.16, 3),
('pkm1', 'Uniformes KM', 'Otros', 60.00, 0.16, 3),
('PP', 'PRACTICADOR DE PIANO', 'Materiales', 20.00, 0.00, -4),
('PPI', 'PIANO PREPARATORIO INFANTIL', 'Métodos', 190.00, 0.16, -5),
('PTG', 'PENTAGRAMA', 'Materiales', 258.00, 0.00, 7),
('REI', 'RE-INSCRIPCION', 'Inscripciones', 550.00, 0.00, 0),
('TCP', 'Teclado papel', 'Materiales', 9.00, 0.15, 8),
('v', 'Violin Infantil', 'Colegiaturas', 200.00, 0.16, 300),
('VII', 'VIOLIN INFANTIL INDIVIDUAL', 'Colegiaturas', 550.00, 0.16, 300);

-- Verificar cantidad de registros insertados
SELECT COUNT(*) as total_articulos FROM articulos;

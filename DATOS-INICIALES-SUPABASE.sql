-- ============================================
-- DATOS INICIALES COMPLETOS PARA SISTEMA SCALA
-- Ejecutar en Supabase SQL Editor después del schema
-- ============================================

-- IMPORTANTE: Ejecutar primero SCALA_FULL_SCHEMA.sql
-- Luego deshabilitar RLS en todas las tablas desde el panel de Supabase

-- ============================================
-- 1. CATÁLOGOS BASE
-- ============================================

-- Motivos de Baja
INSERT INTO motivos_baja (clave, descripcion) VALUES
('CAC', 'CAMBIO DE CIUDAD'),
('ECO', 'PROBLEMAS ECONOMICOS'),
('SAL', 'PROBLEMAS DE SALUD'),
('TRA', 'PROBLEMAS DE TRABAJO'),
('TIE', 'FALTA DE TIEMPO'),
('INT', 'PERDIDA DE INTERES'),
('NQV', 'YA NO QUIERE VENIR'),
('OTR', 'OTROS MOTIVOS')
ON CONFLICT (clave) DO NOTHING;

-- Instrumentos
INSERT INTO instrumentos (clave, descripcion) VALUES
('BAAY', 'BATERIA ACUSTICA'),
('GUEL', 'GUITARRA ELECTRICA'),
('GUAC', 'GUITARRA ACUSTICA'),
('PIAN', 'PIANO'),
('TECL', 'TECLADO'),
('VIOL', 'VIOLIN'),
('CANT', 'CANTO'),
('BAJO', 'BAJO ELECTRICO'),
('SAXO', 'SAXOFON'),
('FLAU', 'FLAUTA'),
('NOTI', 'NO TIENE INSTRUMENTO')
ON CONFLICT (clave) DO NOTHING;

-- Medios de Contacto
INSERT INTO medios_contacto (clave, descripcion, tipo) VALUES
('REC', 'RECOMENDACION', 'PERSONAL'),
('FACE', 'FACEBOOK', 'REDES'),
('INST', 'INSTAGRAM', 'REDES'),
('INT', 'INTERNET', 'DIGITAL'),
('ANUN', 'ANUNCIO EXTERIOR', 'PUBLICIDAD'),
('RADI', 'RADIO', 'PUBLICIDAD'),
('PERI', 'PERIODICO', 'PUBLICIDAD'),
('FOLL', 'FOLLETO', 'PUBLICIDAD'),
('CONC', 'POR CONCIERTO', 'EVENTO'),
('EVE', 'EVENTO', 'EVENTO'),
('VOLA', 'VOLANTE', 'PUBLICIDAD'),
('REI', 'REINSCRIPCION', 'INTERNO'),
('EXPO', 'EXPO BEBE/NENE', 'EVENTO')
ON CONFLICT (clave) DO NOTHING;

-- Salones
INSERT INTO salones (numero, ubicacion, cupo, instrumentos) VALUES
('1', 'Planta Baja - Sala Piano', 6, 'Piano, Teclado'),
('2', 'Planta Baja - Sala Guitarra', 8, 'Guitarra Acústica, Guitarra Eléctrica'),
('3', 'Primer Piso - Sala Batería', 4, 'Batería'),
('4', 'Primer Piso - Sala Violín', 6, 'Violín, Cello'),
('5', 'Segundo Piso - Sala Canto', 10, 'Canto'),
('6', 'Planta Baja - Sala Grupal', 15, 'Todos'),
('7', 'Primer Piso - Sala Baby Music', 12, 'Iniciación Musical'),
('8', 'Segundo Piso - Sala Bajo', 6, 'Bajo Eléctrico')
ON CONFLICT (numero) DO NOTHING;

-- Tipos de Movimiento de Inventario
INSERT INTO tipos_movimiento (clave, descripcion, afecta_inventario, es_entrada) VALUES
('COM', 'COMPRA', true, true),
('VEN', 'VENTA', true, false),
('AJU+', 'AJUSTE ENTRADA', true, true),
('AJU-', 'AJUSTE SALIDA', true, false),
('INI', 'INVENTARIO INICIAL', true, true),
('DEV', 'DEVOLUCION', true, true),
('MER', 'MERMA', true, false)
ON CONFLICT (clave) DO NOTHING;


-- ============================================
-- 2. CURSOS (Basados en datos reales de Scala)
-- ============================================

INSERT INTO cursos (curso, descripcion, duracion_meses, precio_mensual, precio_inscripcion, nivel, activo) VALUES
-- Cursos de Piano
('PIANO PREPARATORIO', 'Piano nivel preparatorio', 12, 780.00, 200.00, 'Preparatorio', true),
('PIANO 1', 'Piano nivel 1', 12, 780.00, 200.00, 'Básico', true),
('PIANO 2', 'Piano nivel 2', 12, 780.00, 200.00, 'Básico', true),
('PIANO 3', 'Piano nivel 3', 12, 850.00, 200.00, 'Intermedio', true),
('PIANO 4', 'Piano nivel 4', 12, 850.00, 200.00, 'Intermedio', true),
('PIANO 5', 'Piano nivel 5', 12, 920.00, 200.00, 'Avanzado', true),
('PIANO 6', 'Piano nivel 6', 12, 920.00, 200.00, 'Avanzado', true),
('PIANO INFANTIL', 'Piano para niños pequeños', 12, 780.00, 200.00, 'Infantil', true),
('PIANO INDIVIDUAL', 'Clases individuales de piano', 12, 1200.00, 250.00, 'Individual', true),

-- Cursos de Guitarra Acústica
('GUITARRA ACUSTICA 1', 'Guitarra acústica nivel 1', 12, 600.00, 180.00, 'Básico', true),
('GUITARRA ACUSTICA 2', 'Guitarra acústica nivel 2', 12, 600.00, 180.00, 'Básico', true),
('GUITARRA ACUSTICA 3', 'Guitarra acústica nivel 3', 12, 650.00, 180.00, 'Intermedio', true),
('GUITARRA ACUSTICA 4', 'Guitarra acústica nivel 4', 12, 650.00, 180.00, 'Intermedio', true),
('GUITARRA ACUSTICA 5', 'Guitarra acústica nivel 5', 12, 700.00, 180.00, 'Avanzado', true),
('GUITARRA ACUSTICA 6', 'Guitarra acústica nivel 6', 12, 700.00, 180.00, 'Avanzado', true),
('GUITARRA ACUSTICA INDIVIDUAL 1', 'Guitarra acústica individual', 12, 1100.00, 220.00, 'Individual', true),

-- Cursos de Guitarra Eléctrica
('Guitarra Electrica 1', 'Guitarra eléctrica nivel 1', 12, 600.00, 180.00, 'Básico', true),
('Guitarra Electrica 2', 'Guitarra eléctrica nivel 2', 12, 600.00, 180.00, 'Básico', true),
('Guitarra Electrica 3', 'Guitarra eléctrica nivel 3', 12, 650.00, 180.00, 'Intermedio', true),
('Guitarra Electrica 4', 'Guitarra eléctrica nivel 4', 12, 650.00, 180.00, 'Intermedio', true),
('Guitarra Electrica 5', 'Guitarra eléctrica nivel 5', 12, 700.00, 180.00, 'Avanzado', true),
('Guitarra Electrica 6', 'Guitarra eléctrica nivel 6', 12, 700.00, 180.00, 'Avanzado', true),
('Guitarra Electrica Individual', 'Guitarra eléctrica individual', 12, 1100.00, 220.00, 'Individual', true),

-- Cursos de Batería
('Bateria 1', 'Batería nivel 1', 12, 780.00, 200.00, 'Básico', true),
('Bateria 2', 'Batería nivel 2', 12, 780.00, 200.00, 'Básico', true),
('Bateria 3', 'Batería nivel 3', 12, 850.00, 200.00, 'Intermedio', true),
('Bateria 4', 'Batería nivel 4', 12, 850.00, 200.00, 'Intermedio', true),
('Bateria 5', 'Batería nivel 5', 12, 920.00, 200.00, 'Avanzado', true),
('Bateria 6', 'Batería nivel 6', 12, 920.00, 200.00, 'Avanzado', true),
('BATERIA INFANTIL', 'Batería para niños', 12, 780.00, 200.00, 'Infantil', true),
('BATERIA INDIVIDUAL 1', 'Batería individual nivel 1', 12, 1200.00, 250.00, 'Individual', true),

-- Cursos de Bajo
('Bajo Electrico 1', 'Bajo eléctrico nivel 1', 12, 780.00, 200.00, 'Básico', true),
('Bajo Electrico 2', 'Bajo eléctrico nivel 2', 12, 780.00, 200.00, 'Básico', true),
('Bajo Electrico 3', 'Bajo eléctrico nivel 3', 12, 850.00, 200.00, 'Intermedio', true),
('Bajo Electrico 4', 'Bajo eléctrico nivel 4', 12, 850.00, 200.00, 'Intermedio', true),
('Bajo Individual 1', 'Bajo individual nivel 1', 12, 1200.00, 250.00, 'Individual', true),

-- Cursos de Canto
('CANTO', 'Canto grupal', 12, 590.00, 150.00, 'Básico', true),
('CANTO INDIVIDUAL', 'Canto individual', 12, 1150.00, 220.00, 'Individual', true),
('CANTO INFANTIL', 'Canto para niños', 12, 590.00, 150.00, 'Infantil', true),

-- Cursos de Violín
('VIOLIN 1', 'Violín nivel 1', 12, 900.00, 220.00, 'Básico', true),
('VIOLIN 2', 'Violín nivel 2', 12, 900.00, 220.00, 'Básico', true),
('VIOLIN 3', 'Violín nivel 3', 12, 950.00, 220.00, 'Intermedio', true),
('VIOLIN INFANTIL', 'Violín para niños', 12, 900.00, 220.00, 'Infantil', true),
('VIOLIN INDIVIDUAL', 'Violín individual', 12, 1300.00, 280.00, 'Individual', true),

-- Cursos de Teclado
('Teclado Pop 1', 'Teclado pop nivel 1', 12, 780.00, 200.00, 'Básico', true),
('Teclado Pop 2', 'Teclado pop nivel 2', 12, 780.00, 200.00, 'Básico', true),
('TECLADO INFANTIL', 'Teclado para niños', 12, 780.00, 200.00, 'Infantil', true),

-- Cursos Infantiles y Especiales
('Baby Music', 'Música para bebés (0-3 años)', 12, 780.00, 200.00, 'Bebés', true),
('DRUM KIDS', 'Batería para niños', 12, 780.00, 200.00, 'Infantil', true),
('DRUM KIDS INDIVIDUAL', 'Batería individual para niños', 12, 1200.00, 250.00, 'Individual', true),
('INICIACION MUSICAL', 'Iniciación musical para niños', 12, 600.00, 150.00, 'Iniciación', true),
('INICIACION MUSICAL 1', 'Iniciación musical nivel 1', 12, 600.00, 150.00, 'Iniciación', true),
('INICIACION MUSICAL 2', 'Iniciación musical nivel 2', 12, 600.00, 150.00, 'Iniciación', true),
('ABC Music&Me', 'Programa ABC Music & Me', 12, 780.00, 200.00, 'Bebés', true),
('ABC ENGLISH & ME', 'Programa ABC English & Me', 12, 780.00, 200.00, 'Bebés', true),
('ABC HOME SWEET HOME', 'Programa ABC Home Sweet Home', 12, 780.00, 200.00, 'Bebés', true),
('ENGLISH MUSIC', 'Música en inglés', 12, 780.00, 200.00, 'Especial', true),

-- Otros cursos
('ENSAMBLE', 'Ensamble musical', 12, 600.00, 150.00, 'Grupal', true),
('CORO NAVIDEÑO', 'Coro navideño', 3, 500.00, 100.00, 'Especial', true),
('TEORIA MUSICAL', 'Teoría y solfeo', 6, 500.00, 100.00, 'Teórico', true),
('INSCRIPCION', 'Inscripción general', 1, 0.00, 200.00, 'Administrativo', true),
('ANUALIDAD', 'Pago anual', 12, 450.00, 0.00, 'Administrativo', true)
ON CONFLICT (curso) DO NOTHING;


-- ============================================
-- 3. MAESTROS (Basados en datos reales)
-- ============================================

INSERT INTO maestros (nombre, direccion, telefono, celular, email, clave, rfc, grado, detalles_grado, fecha_ingreso, status) VALUES
('ALEJANDRINA ZAPATA', 'CALLE 51 #246 X 44 Y 46 ALTOS, MERIDA YUCATAN', '999-919-4039', '999-123-4567', 'alejandrina.zapata@scala.edu', 'AZ', 'ZAPA850615ABC', 'Licenciatura', 'ENGLISH MUSIC', '2015-10-26', 'activo'),
('ALFREDO ZAPATA', 'CALLE 51 #246 X 44 Y 46 ALTOS, MERIDA YUCATAN', '999-920-1234', '999-234-5678', 'alfredo.zapata@scala.edu', 'AF', 'ZAPA880320DEF', 'Licenciatura', 'PIANO PREPARATORIO', '2016-03-15', 'activo'),
('ANA SARMIENTO', 'CALLE 51 #244 X 44 Y 46 ALTOS, MERIDA YUCATAN', '999-921-5678', '999-345-6789', 'ana.sarmiento@scala.edu', 'AS', 'SARA900712GHI', 'Licenciatura', 'VIOLIN', '2017-08-01', 'activo'),
('ANGEL EK HAU', 'CALLE 51 #244 X 44 Y 46 ALTOS, MERIDA YUCATAN', '999-922-9012', '999-456-7890', 'angel.ek@scala.edu', 'AE', 'EKHA920505JKL', 'Técnico', 'BATERIA', '2018-01-10', 'activo'),
('ANTHONY BRAAYAN', 'CALLE 51 #246 X 44 Y 46 ALTO, MERIDA YUCATAN', '999-923-3456', '999-567-8901', 'anthony.braayan@scala.edu', 'AB', 'BRAA870815MNO', 'Técnico', 'CANTO', '2017-05-20', 'activo'),
('BRUNO DORANTES', 'CALLE 51 #244 X 44 Y 46, MERIDA YUCATAN', '999-924-7890', '999-678-9012', 'bruno.dorantes@scala.edu', 'BD', 'DORA950210PQR', 'Licenciatura', 'GUITARRA ACUSTICA', '2019-02-01', 'activo'),
('DAVID PAT', 'CALLE 51 #246 X 44 Y 46 ALTOS, MERIDA YUCATAN', '999-925-1234', '999-789-0123', 'david.pat@scala.edu', 'DP', 'PATD890625STU', 'Técnico', 'DRUM KIDS', '2016-09-15', 'activo'),
('DAVID SANCHEZ UICAB', 'CALLE 51 #246 X 44 Y 46, MERIDA YUCATAN', '999-926-5678', '999-890-1234', 'david.sanchez@scala.edu', 'DS', 'SAUD910830VWX', 'Licenciatura', 'PIANO INFANTIL', '2018-06-01', 'activo'),
('DIANA LOPEZ GONZALEZ', 'C-51 # 246 X 44 Y 46 ALTOS, MERIDA YUCATAN', '999-926-1760', '999-901-2345', 'diana.lopez@scala.edu', 'DLG', 'LOGD860415YZA', 'Licenciatura', 'ESTIMULACION MUSICAL TEMPRANA', '2017-11-10', 'activo'),
('FELIPE SILVA', 'CALLE 51 #246 X 44 Y 46 ALTOS', '999-458-6000', '999-012-3456', 'felipe.silva@scala.edu', 'FS', 'SILF930720BCD', 'Técnico', 'DRUM KIDS', '2019-08-20', 'activo'),
('GABRIELA CANCHE', 'CALLE 51 #244 X 44 Y 46 ALTOS', '999-927-9012', '999-123-4568', 'gabriela.canche@scala.edu', 'GC', 'CANG880115EFG', 'Licenciatura', 'CANTO', '2018-03-01', 'activo'),
('GERARDO MENA', 'CALLE 51 #244 X 44 Y 46 ALTOS', '999-928-3456', '999-234-5679', 'gerardo.mena@scala.edu', 'GM', 'MENG900520HIJ', 'Técnico', 'BATERIA', '2019-01-15', 'activo'),
('GIOVANNA CASTAÑEDA', 'CALLE 51 #244 X 44 Y 46 ALTOS, MERIDA YUCATAN', '999-929-7890', '999-345-6780', 'giovanna.castaneda@scala.edu', 'GC2', 'CASG920815KLM', 'Licenciatura', 'ENGLISH MUSIC', '2017-07-01', 'activo'),
('GRISSEL JUAREZ', 'CALLE 51 #246 X 44 Y 46 ALTOS', '999-930-1234', '999-456-7891', 'grissel.juarez@scala.edu', 'GJ', 'JUAG850320NOP', 'Licenciatura', 'ENGLISH MUSIC', '2016-04-10', 'activo'),
('GUADALUPE MEJIA', 'CALLE 51 #246 X 44 Y 46 ALTOS, MERIDA YUCATAN', '999-931-5678', '999-567-8902', 'guadalupe.mejia@scala.edu', 'GM2', 'MEJG880712QRS', 'Licenciatura', 'INICIACION MUSICAL', '2018-09-01', 'activo'),
('ILSIA MENA PALMA', 'CALLE 65A X 80 Y 82 #516, CENTRO', '999-449-5804', '999-678-9013', 'ilsia.mena@scala.edu', 'IM', 'MEPI910505TUV', 'Licenciatura', 'TECLADO', '2019-05-20', 'activo'),
('IVAN ALEXIS GARCIA PEREZ', 'CALLE 51 #246 X 44 Y 46 ALTOS, MERIDA YUCATAN', '999-239-6168', '999-789-0124', 'ivan.garcia@scala.edu', 'IA', 'GAPI870815WXY', 'Técnico', 'DRUM KIDS', '2016-11-01', 'activo'),
('JAIME LARA', 'CALLE 51 #246 X 44 Y 46 ALTOS, MERIDA YUCATAN', '999-932-9012', '999-890-1235', 'jaime.lara@scala.edu', 'JL', 'LARJ900210ZAB', 'Licenciatura', 'VIOLIN', '2017-02-15', 'activo'),
('JORGE JUAREZ', 'CALLE 51 #246 X 44 Y 46, MERIDA YUCATAN', '999-933-3456', '999-901-2346', 'jorge.juarez@scala.edu', 'JJ', 'JUAJ920625CDE', 'Técnico', 'DRUM KIDS', '2018-08-01', 'activo'),
('LOURDES PINEDA', 'CALLE 51 #244 X 44 Y 46 ALTOS, MERIDA YUCATAN', '999-134-0357', '999-012-3457', 'lourdes.pineda@scala.edu', 'LP', 'PINL850930FGH', 'Licenciatura', 'ENGLISH MUSIC', '2016-06-15', 'activo'),
('MARCO VALERA', 'CALLE 51 #244 X 44 Y 46 ALTOS, MERIDA YUCATAN', '999-934-7890', '999-123-4569', 'marco.valera@scala.edu', 'MV', 'VALM880315IJK', 'Licenciatura', 'PIANO PREPARATORIO', '2019-03-01', 'activo'),
('MARINA VILLAJUANA', 'CALLE 51 #246 X 44 Y 46, MERIDA YUCATAN', '999-935-1234', '999-234-5670', 'marina.villajuana@scala.edu', 'MV2', 'VILM910720LMN', 'Licenciatura', 'BABY MUSIC', '2017-09-10', 'activo'),
('MARILYN RODRIGUEZ SOSA', 'CALLE 51 #246 X 44 Y 46, MERIDA YUCATAN', '999-936-5678', '999-345-6781', 'marilyn.rodriguez@scala.edu', 'MR', 'RODM930505OPQ', 'Licenciatura', 'BABY MUSIC', '2018-04-01', 'activo'),
('MAURICIO MOCTEZUMA', 'CALLE 51 #246 X 44 Y 46 ALTOS, MERIDA YUCATAN', '999-221-8819', '999-456-7892', 'mauricio.moctezuma@scala.edu', 'MM', 'MOCM860815RST', 'Técnico', 'DRUM KIDS', '2016-12-01', 'activo'),
('MELCHOR HERRERA', 'CALLE 51 #246 X 44 Y 46 ALTOS', '999-937-9012', '999-567-8903', 'melchor.herrera@scala.edu', 'MH', 'HERM890210UVW', 'Técnico', 'TECLADO', '2019-07-15', 'activo'),
('MELISSA LOPEZ GONZALEZ', 'CALLE 51 #246 X 44 Y 46', '999-575-4961', '999-678-9014', 'melissa.lopez@scala.edu', 'MLG', 'LOGM920625XYZ', 'Licenciatura', 'BABY MUSIC', '2017-04-01', 'activo'),
('MIRIAM VAZQUEZ', 'CALLE 51 #246 X 44 Y 46 ALTOS, MERIDA YUCATAN', '999-938-3456', '999-789-0125', 'miriam.vazquez@scala.edu', 'MV3', 'VAZM850930ABC', 'Licenciatura', 'TECLADO INFANTIL', '2018-10-10', 'activo'),
('MONICA GARCIA', 'CALLE 51 #246 X 44 Y 46, MERIDA YUCATAN', '999-169-1656', '999-890-1236', 'monica.garcia@scala.edu', 'MG', 'GARM880315DEF', 'Licenciatura', 'INICIACION MUSICAL', '2016-08-01', 'activo'),
('RAUL MELENDEZ', 'CALLE 51 #246 X 44 Y 46, MERIDA YUCATAN', '999-939-7890', '999-901-2347', 'raul.melendez@scala.edu', 'RM', 'MELR910720GHI', 'Técnico', 'GUITARRA ELECTRICA', '2019-11-01', 'activo'),
('ASTRID TORRES', 'CALLE 51 #244 X 44 Y 46 ALTOS, FCO DE MONTEJO', '999-940-1234', '999-012-3458', 'astrid.torres@scala.edu', 'AT', 'TORA930505JKL', 'Licenciatura', 'BABY MUSIC', '2017-06-15', 'activo')
ON CONFLICT DO NOTHING;


-- ============================================
-- 4. GRUPOS (Ejemplos basados en estructura real)
-- ============================================

-- Primero necesitamos obtener los IDs de cursos, maestros y salones
-- Usaremos subconsultas para insertar

INSERT INTO grupos (clave, curso_id, maestro_id, salon_id, dia, hora_entrada, hora_salida, cupo, inicio, status)
SELECT 
    'PPMVMI17',
    (SELECT id FROM cursos WHERE curso = 'PIANO PREPARATORIO' LIMIT 1),
    (SELECT id FROM maestros WHERE clave = 'MV' LIMIT 1),
    (SELECT id FROM salones WHERE numero = '1' LIMIT 1),
    'Miércoles',
    '17:00',
    '18:00',
    6,
    '2024-01-15',
    'activo'
WHERE NOT EXISTS (SELECT 1 FROM grupos WHERE clave = 'PPMVMI17');

INSERT INTO grupos (clave, curso_id, maestro_id, salon_id, dia, hora_entrada, hora_salida, cupo, inicio, status)
SELECT 
    'GADTRMA17',
    (SELECT id FROM cursos WHERE curso = 'GUITARRA ACUSTICA 1' LIMIT 1),
    (SELECT id FROM maestros WHERE clave = 'BD' LIMIT 1),
    (SELECT id FROM salones WHERE numero = '2' LIMIT 1),
    'Martes',
    '17:00',
    '18:00',
    8,
    '2024-01-15',
    'activo'
WHERE NOT EXISTS (SELECT 1 FROM grupos WHERE clave = 'GADTRMA17');

INSERT INTO grupos (clave, curso_id, maestro_id, salon_id, dia, hora_entrada, hora_salida, cupo, inicio, status)
SELECT 
    'BAIGGAVI15',
    (SELECT id FROM cursos WHERE curso = 'Bateria 1' LIMIT 1),
    (SELECT id FROM maestros WHERE clave = 'GM' LIMIT 1),
    (SELECT id FROM salones WHERE numero = '3' LIMIT 1),
    'Viernes',
    '15:00',
    '16:00',
    4,
    '2024-01-15',
    'activo'
WHERE NOT EXISTS (SELECT 1 FROM grupos WHERE clave = 'BAIGGAVI15');

INSERT INTO grupos (clave, curso_id, maestro_id, salon_id, dia, hora_entrada, hora_salida, cupo, inicio, status)
SELECT 
    'VIIJLLU18',
    (SELECT id FROM cursos WHERE curso = 'VIOLIN INFANTIL' LIMIT 1),
    (SELECT id FROM maestros WHERE clave = 'JL' LIMIT 1),
    (SELECT id FROM salones WHERE numero = '4' LIMIT 1),
    'Lunes',
    '18:00',
    '19:00',
    6,
    '2024-01-15',
    'activo'
WHERE NOT EXISTS (SELECT 1 FROM grupos WHERE clave = 'VIIJLLU18');

INSERT INTO grupos (clave, curso_id, maestro_id, salon_id, dia, hora_entrada, hora_salida, cupo, inicio, status)
SELECT 
    'CAIGCSA10',
    (SELECT id FROM cursos WHERE curso = 'CANTO INFANTIL' LIMIT 1),
    (SELECT id FROM maestros WHERE clave = 'GC' LIMIT 1),
    (SELECT id FROM salones WHERE numero = '5' LIMIT 1),
    'Sábado',
    '10:00',
    '11:00',
    10,
    '2024-01-15',
    'activo'
WHERE NOT EXISTS (SELECT 1 FROM grupos WHERE clave = 'CAIGCSA10');

INSERT INTO grupos (clave, curso_id, maestro_id, salon_id, dia, hora_entrada, hora_salida, cupo, inicio, status)
SELECT 
    'BMMRSMI17',
    (SELECT id FROM cursos WHERE curso = 'Baby Music' LIMIT 1),
    (SELECT id FROM maestros WHERE clave = 'MR' LIMIT 1),
    (SELECT id FROM salones WHERE numero = '7' LIMIT 1),
    'Miércoles',
    '17:00',
    '18:00',
    12,
    '2024-01-15',
    'activo'
WHERE NOT EXISTS (SELECT 1 FROM grupos WHERE clave = 'BMMRSMI17');

INSERT INTO grupos (clave, curso_id, maestro_id, salon_id, dia, hora_entrada, hora_salida, cupo, inicio, status)
SELECT 
    'DKMMMI15',
    (SELECT id FROM cursos WHERE curso = 'DRUM KIDS' LIMIT 1),
    (SELECT id FROM maestros WHERE clave = 'MM' LIMIT 1),
    (SELECT id FROM salones WHERE numero = '3' LIMIT 1),
    'Miércoles',
    '15:00',
    '16:00',
    4,
    '2024-01-15',
    'activo'
WHERE NOT EXISTS (SELECT 1 FROM grupos WHERE clave = 'DKMMMI15');

INSERT INTO grupos (clave, curso_id, maestro_id, salon_id, dia, hora_entrada, hora_salida, cupo, inicio, status)
SELECT 
    'IMIGMMI17',
    (SELECT id FROM cursos WHERE curso = 'INICIACION MUSICAL' LIMIT 1),
    (SELECT id FROM maestros WHERE clave = 'GM2' LIMIT 1),
    (SELECT id FROM salones WHERE numero = '6' LIMIT 1),
    'Miércoles',
    '17:00',
    '18:00',
    15,
    '2024-01-15',
    'activo'
WHERE NOT EXISTS (SELECT 1 FROM grupos WHERE clave = 'IMIGMMI17');

INSERT INTO grupos (clave, curso_id, maestro_id, salon_id, dia, hora_entrada, hora_salida, cupo, inicio, status)
SELECT 
    'EMMVSA9',
    (SELECT id FROM cursos WHERE curso = 'ENGLISH MUSIC' LIMIT 1),
    (SELECT id FROM maestros WHERE clave = 'MV2' LIMIT 1),
    (SELECT id FROM salones WHERE numero = '7' LIMIT 1),
    'Sábado',
    '09:00',
    '10:00',
    12,
    '2024-01-15',
    'activo'
WHERE NOT EXISTS (SELECT 1 FROM grupos WHERE clave = 'EMMVSA9');

INSERT INTO grupos (clave, curso_id, maestro_id, salon_id, dia, hora_entrada, hora_salida, cupo, inicio, status)
SELECT 
    'TCMHLU9',
    (SELECT id FROM cursos WHERE curso = 'Teclado Pop 1' LIMIT 1),
    (SELECT id FROM maestros WHERE clave = 'MH' LIMIT 1),
    (SELECT id FROM salones WHERE numero = '1' LIMIT 1),
    'Lunes',
    '09:00',
    '10:00',
    6,
    '2024-01-15',
    'activo'
WHERE NOT EXISTS (SELECT 1 FROM grupos WHERE clave = 'TCMHLU9');


-- ============================================
-- 5. ALUMNOS (Ejemplos basados en datos reales)
-- ============================================

-- Insertar alumnos con referencias a grupos existentes
INSERT INTO alumnos (credencial1, credencial2, nombre, apellidos, edad, fecha_nacimiento, direccion1, ciudad, telefono, celular, email, nombre_padre, celular_padre, nombre_madre, celular_madre, grupo, curso, grado, fecha_ingreso, status, beca, comentario)
VALUES
('EP', 'H', 'MONROY PONCE DE LEON', 'MIRIAM', 12, '2012-05-15', 'CALLE 51 #246 X 44 Y 46', 'MERIDA YUCATAN', '625-0164', '999-123-4567', 'miriam.monroy@email.com', 'HECTOR MANUEL ISLAS LICONA', '999-234-5678', 'MARIA MONROY', '999-345-6789', 'PPMVMI17', 'PIANO PREPARATORIO', 'Preparatorio', '2024-01-15', 'activo', false, NULL),

('GA', 'D', 'FLOTA CALVILLO', 'ALEJANDRO', 14, '2010-03-20', 'CALLE 41 #440 X 58 Y 60 FRACC. FCO DE MONTEJO', 'MERIDA YUCATAN', '999-456-7890', '999-567-8901', 'alejandro.flota@email.com', 'DANIEL TREJO RUIZ', '999-678-9012', 'MARIA CALVILLO', '999-789-0123', 'GADTRMA17', 'GUITARRA ACUSTICA 1', 'Básico', '2024-01-15', 'activo', false, NULL),

('ABC', 'M', 'FERNANDEZ PERERA', 'ELIAS SANTIAGO', 4, '2020-08-10', 'Calle 34 No.260 x 55 y 57, San Ramón Norte', 'MERIDA YUCATAN', '944-8867', '999-338-3297', 'elias.fernandez@email.com', 'OSCAR FERNANDEZ RIOS', '999-338-3297', 'PAMELA PEREZ ESPAÑA', '999-121-3463', 'BMMRSMI17', 'ABC Music&Me', 'Bebés', '2024-02-01', 'activo', false, 'FALTA'),

('EE', 'M', 'ESPINOZA NAVARRETE', 'NATALIA BEATRIZ', 5, '2019-06-25', 'Calle 41B No.208 x 38 y 38A, Fco de Montejo', 'MERIDA YUCATAN', '999-900-5603', '999-900-6528', 'natalia.espinoza@email.com', 'ELMER ESPINOSA HERRERA', '999-900-5603', 'BEATRIZ NAVARRETE RAMOS', '999-900-6528', 'EMMVSA9', 'ABC ENGLISH & ME', 'Bebés', '2024-01-20', 'activo', false, NULL),

('VI', 'A', 'VIANA CARDEÑA', 'LIONEL', 8, '2016-11-30', 'Calle 25 No.264 x 26 y 28, Col. Alemán', 'MERIDA YUCATAN', '285-4360', '999-156-3091', 'lionel.viana@email.com', 'JAVIER VIANA PUERTO', '999-156-3091', 'MARTHA CARDEÑA P', '999-255-8049', 'VIIJLLU18', 'VIOLIN INFANTIL', 'Infantil', '2024-01-15', 'activo', false, NULL),

('CD', 'M', 'ARMAND UGON CETINA', 'SOFIA', 6, '2018-04-12', 'CALLE 14 #413 X 11 Y 13 FRACC- PARAISO MAYA', 'MERIDA YUCATAN', '930-6953', '999-128-6477', 'sofia.armand@email.com', 'PABLO ARMAND UGON CETINA', '999-128-6477', 'INGRID DANAHE CETINA ESTRADA', '999-956-0980', 'CAIGCSA10', 'CANTO INFANTIL', 'Infantil', '2024-02-10', 'activo', false, NULL),

('DK', 'II', 'HERNANDEZ VELAZQUEZ', 'VICTORIA', 7, '2017-09-05', 'Calle 55B No.200, Fco. De Montejo', 'MERIDA YUCATAN', '287-7809', '999-272-6311', 'victoria.hernandez@email.com', 'OSCAR HERNANDEZ', '999-272-6311', 'CRISTINA VELAZQUEZ', '999-383-4567', 'DKMMMI15', 'DRUM KIDS', 'Infantil', '2024-01-25', 'activo', false, NULL),

('IM', 'I', 'MEDINA ESTRELLA', 'SARIEL IBRAHIM', 3, '2021-02-18', 'CALLE 58 X 89 Y 91 #198 LA HERRADURA', 'MERIDA YUCATAN', '911-8331', '922-7628', 'sariel.medina@email.com', 'ISRAEL ALEJANDRO MEDINA PAT', '911-8331', 'GLORIA GUADALUPE ESTRELLA', '922-7628', 'IMIGMMI17', 'INICIACION MUSICAL', 'Iniciación', '2024-03-01', 'activo', false, NULL),

('BA', 'I', 'CRUZ AVIÑA', 'PAMELA', 10, '2014-07-22', 'CALLE 41A #277 X 36 Y 40 FCO DE M', 'MERIDA YUCATAN', '999-200-8506', '999-200-8506', 'pamela.cruz@email.com', 'IVAN ALEXIS GARCIA', '999-200-8506', 'JULIA AVIÑA', '999-200-8507', 'BAIGGAVI15', 'Bateria 1', 'Básico', '2024-01-15', 'activo', false, 'VERANO16'),

('TC', 'M', 'CRUZ AVIÑA', 'DIEGO', 12, '2012-12-08', 'CALLE 41A# 277 X 36 Y 40 FCO DE M', 'MERIDA YUCATAN', '999-200-8506', '999-200-8506', 'diego.cruz@email.com', 'IVAN ALEXIS GARCIA', '999-200-8506', 'JULIA AVIÑA', '999-200-8507', 'TCMHLU9', 'Teclado Pop 1', 'Básico', '2024-01-15', 'activo', false, 'VERANO 16'),

('PP', 'A', 'ALVAREZ ACEVEDO', 'ANNA SOFIA', 5, '2019-03-14', 'CALLE 39 #224 X 30 Y 32 FCO DE MONTEJO', 'MERIDA YUCATAN', '999-947-9672', '999-292-3529', 'anna.alvarez@email.com', 'DAVID ARMIN ALVAREZ LOPEZ', '999-947-9672', 'MAGALY ACEVEDO LEON', '999-292-3529', 'PPMVMI17', 'PIANO PREPARATORIO', 'Preparatorio', '2024-02-15', 'activo', false, NULL),

('BM', 'G', 'GALVAN PENICHE', 'PABLO', 2, '2022-06-30', 'CALLE 13F CERRADA PALMA REAL', 'MERIDA YUCATAN', '999-900-5442', '999-900-5442', 'pablo.galvan@email.com', 'PABLO GALVAN', '999-900-5442', 'KARLA PENICHE', '999-900-5443', 'BMMRSMI17', 'Baby Music', 'Bebés', '2024-03-10', 'activo', false, NULL)
ON CONFLICT DO NOTHING;


-- ============================================
-- 6. GRUPOS DE ARTÍCULOS
-- ============================================

INSERT INTO grupos_articulos (nombre, descripcion) VALUES
('INSTRUMENTOS', 'Instrumentos musicales'),
('ACCESORIOS', 'Accesorios para instrumentos'),
('LIBROS', 'Libros y métodos de estudio'),
('CUERDAS', 'Cuerdas para instrumentos'),
('BAQUETAS', 'Baquetas y mazos'),
('ATRILES', 'Atriles y soportes'),
('ESTUCHES', 'Estuches y fundas'),
('AUDIO', 'Equipos de audio'),
('UNIFORMES', 'Uniformes y playeras'),
('PAPELERIA', 'Papelería y materiales')
ON CONFLICT (nombre) DO NOTHING;

-- ============================================
-- 7. ARTÍCULOS
-- ============================================

INSERT INTO articulos (clave, descripcion, grupo_articulo_id, precio, existencia, minimo, activo)
SELECT 'GUI-AC-01', 'Guitarra Acústica Básica', id, 2500.00, 5, 2, true FROM grupos_articulos WHERE nombre = 'INSTRUMENTOS'
ON CONFLICT (clave) DO NOTHING;

INSERT INTO articulos (clave, descripcion, grupo_articulo_id, precio, existencia, minimo, activo)
SELECT 'GUI-EL-01', 'Guitarra Eléctrica Básica', id, 3500.00, 3, 1, true FROM grupos_articulos WHERE nombre = 'INSTRUMENTOS'
ON CONFLICT (clave) DO NOTHING;

INSERT INTO articulos (clave, descripcion, grupo_articulo_id, precio, existencia, minimo, activo)
SELECT 'TEC-01', 'Teclado 61 Teclas', id, 4500.00, 4, 2, true FROM grupos_articulos WHERE nombre = 'INSTRUMENTOS'
ON CONFLICT (clave) DO NOTHING;

INSERT INTO articulos (clave, descripcion, grupo_articulo_id, precio, existencia, minimo, activo)
SELECT 'VIO-01', 'Violín 4/4 Estudiante', id, 3000.00, 3, 1, true FROM grupos_articulos WHERE nombre = 'INSTRUMENTOS'
ON CONFLICT (clave) DO NOTHING;

INSERT INTO articulos (clave, descripcion, grupo_articulo_id, precio, existencia, minimo, activo)
SELECT 'BAQ-01', 'Baquetas 5A', id, 150.00, 20, 10, true FROM grupos_articulos WHERE nombre = 'BAQUETAS'
ON CONFLICT (clave) DO NOTHING;

INSERT INTO articulos (clave, descripcion, grupo_articulo_id, precio, existencia, minimo, activo)
SELECT 'BAQ-02', 'Baquetas 7A', id, 150.00, 15, 10, true FROM grupos_articulos WHERE nombre = 'BAQUETAS'
ON CONFLICT (clave) DO NOTHING;

INSERT INTO articulos (clave, descripcion, grupo_articulo_id, precio, existencia, minimo, activo)
SELECT 'CUE-GUI-01', 'Cuerdas Guitarra Acústica', id, 120.00, 30, 15, true FROM grupos_articulos WHERE nombre = 'CUERDAS'
ON CONFLICT (clave) DO NOTHING;

INSERT INTO articulos (clave, descripcion, grupo_articulo_id, precio, existencia, minimo, activo)
SELECT 'CUE-GUI-02', 'Cuerdas Guitarra Eléctrica', id, 150.00, 25, 10, true FROM grupos_articulos WHERE nombre = 'CUERDAS'
ON CONFLICT (clave) DO NOTHING;

INSERT INTO articulos (clave, descripcion, grupo_articulo_id, precio, existencia, minimo, activo)
SELECT 'CUE-VIO-01', 'Cuerdas Violín', id, 200.00, 15, 5, true FROM grupos_articulos WHERE nombre = 'CUERDAS'
ON CONFLICT (clave) DO NOTHING;

INSERT INTO articulos (clave, descripcion, grupo_articulo_id, precio, existencia, minimo, activo)
SELECT 'LIB-PIA-01', 'Método Piano Básico', id, 350.00, 10, 5, true FROM grupos_articulos WHERE nombre = 'LIBROS'
ON CONFLICT (clave) DO NOTHING;

INSERT INTO articulos (clave, descripcion, grupo_articulo_id, precio, existencia, minimo, activo)
SELECT 'LIB-GUI-01', 'Método Guitarra Básico', id, 300.00, 12, 5, true FROM grupos_articulos WHERE nombre = 'LIBROS'
ON CONFLICT (clave) DO NOTHING;

INSERT INTO articulos (clave, descripcion, grupo_articulo_id, precio, existencia, minimo, activo)
SELECT 'ATR-01', 'Atril Plegable', id, 450.00, 8, 3, true FROM grupos_articulos WHERE nombre = 'ATRILES'
ON CONFLICT (clave) DO NOTHING;

INSERT INTO articulos (clave, descripcion, grupo_articulo_id, precio, existencia, minimo, activo)
SELECT 'EST-GUI-01', 'Estuche Guitarra Acústica', id, 800.00, 5, 2, true FROM grupos_articulos WHERE nombre = 'ESTUCHES'
ON CONFLICT (clave) DO NOTHING;

INSERT INTO articulos (clave, descripcion, grupo_articulo_id, precio, existencia, minimo, activo)
SELECT 'PUA-01', 'Púas (paquete 12)', id, 80.00, 50, 20, true FROM grupos_articulos WHERE nombre = 'ACCESORIOS'
ON CONFLICT (clave) DO NOTHING;

INSERT INTO articulos (clave, descripcion, grupo_articulo_id, precio, existencia, minimo, activo)
SELECT 'MET-01', 'Metrónomo Digital', id, 350.00, 6, 3, true FROM grupos_articulos WHERE nombre = 'ACCESORIOS'
ON CONFLICT (clave) DO NOTHING;

INSERT INTO articulos (clave, descripcion, grupo_articulo_id, precio, existencia, minimo, activo)
SELECT 'AFI-01', 'Afinador Cromático', id, 250.00, 10, 5, true FROM grupos_articulos WHERE nombre = 'ACCESORIOS'
ON CONFLICT (clave) DO NOTHING;

INSERT INTO articulos (clave, descripcion, grupo_articulo_id, precio, existencia, minimo, activo)
SELECT 'CAP-01', 'Capo para Guitarra', id, 180.00, 15, 5, true FROM grupos_articulos WHERE nombre = 'ACCESORIOS'
ON CONFLICT (clave) DO NOTHING;

INSERT INTO articulos (clave, descripcion, grupo_articulo_id, precio, existencia, minimo, activo)
SELECT 'UNI-PLA-01', 'Playera Scala Niño', id, 200.00, 20, 10, true FROM grupos_articulos WHERE nombre = 'UNIFORMES'
ON CONFLICT (clave) DO NOTHING;

INSERT INTO articulos (clave, descripcion, grupo_articulo_id, precio, existencia, minimo, activo)
SELECT 'UNI-PLA-02', 'Playera Scala Adulto', id, 250.00, 15, 8, true FROM grupos_articulos WHERE nombre = 'UNIFORMES'
ON CONFLICT (clave) DO NOTHING;


-- ============================================
-- 8. PROSPECTOS
-- ============================================

INSERT INTO prospectos (fecha_atencion, nombre, apellidos, edad, telefono, email, observaciones, seguimiento) VALUES
('2024-01-10', 'CARLOS', 'MARTINEZ LOPEZ', 8, '999-111-2222', 'carlos.martinez@email.com', 'Interesado en piano', 'Llamar en una semana'),
('2024-01-12', 'MARIA', 'GONZALEZ PEREZ', 6, '999-222-3333', 'maria.gonzalez@email.com', 'Interesada en violín', 'Enviar información por email'),
('2024-01-15', 'JUAN', 'RODRIGUEZ SANCHEZ', 10, '999-333-4444', 'juan.rodriguez@email.com', 'Interesado en guitarra', 'Agendar clase muestra'),
('2024-01-18', 'ANA', 'LOPEZ GARCIA', 4, '999-444-5555', 'ana.lopez@email.com', 'Interesada en Baby Music', 'Madre llamará para inscribir'),
('2024-01-20', 'PEDRO', 'HERNANDEZ DIAZ', 12, '999-555-6666', 'pedro.hernandez@email.com', 'Interesado en batería', 'Pendiente de horarios'),
('2024-01-22', 'SOFIA', 'MARTINEZ RUIZ', 7, '999-666-7777', 'sofia.martinez@email.com', 'Interesada en canto', 'Clase muestra el sábado'),
('2024-01-25', 'DIEGO', 'GARCIA TORRES', 9, '999-777-8888', 'diego.garcia@email.com', 'Interesado en teclado', 'Esperando confirmación'),
('2024-02-01', 'VALENTINA', 'PEREZ MORALES', 5, '999-888-9999', 'valentina.perez@email.com', 'Interesada en iniciación musical', 'Inscrita para febrero'),
('2024-02-05', 'MATEO', 'SANCHEZ FLORES', 11, '999-999-0000', 'mateo.sanchez@email.com', 'Interesado en bajo eléctrico', 'Pendiente de pago'),
('2024-02-08', 'CAMILA', 'TORRES MENDEZ', 3, '999-000-1111', 'camila.torres@email.com', 'Interesada en estimulación temprana', 'Madre muy interesada')
ON CONFLICT DO NOTHING;

-- ============================================
-- 9. RFC CLIENTES
-- ============================================

INSERT INTO rfc_clientes (rfc, nombre, direccion1, direccion2, email) VALUES
('XAXX010101000', 'PUBLICO EN GENERAL', 'N/A', '', ''),
('GOMA850615ABC', 'GONZALEZ MARTINEZ AARON', 'Calle 51 #246 x 44 y 46', 'Col. Centro, Mérida', 'aaron.gonzalez@email.com'),
('SIAA900320DEF', 'SIERRA ALCOCER ARLETTE MARIA', 'Calle 60 #123 x 35 y 37', 'Col. Centro, Mérida', 'arlette.sierra@email.com'),
('PELC880712GHI', 'PEREZ LOPEZ CARLOS EDUARDO', 'Calle 45 #567 x 20 y 22', 'Fracc. Montebello', 'carlos.perez@email.com'),
('MERD920505JKL', 'MENDEZ RUIZ DIANA PATRICIA', 'Calle 30 #890 x 15 y 17', 'Col. García Ginerés', 'diana.mendez@email.com'),
('RACE870815MNO', 'RAMIREZ CHAN EDUARDO JOSE', 'Calle 25 #234 x 10 y 12', 'Col. Itzimná', 'eduardo.ramirez@email.com'),
('TOGF950210PQR', 'TORRES GOMEZ FERNANDA LUCIA', 'Calle 70 #456 x 55 y 57', 'Col. Centro', 'fernanda.torres@email.com'),
('DIHG890625STU', 'DIAZ HERRERA GABRIEL ANTONIO', 'Calle 15 #789 x 8 y 10', 'Fracc. Las Américas', 'gabriel.diaz@email.com'),
('VAPH910830VWX', 'VARGAS POOL HELENA CRISTINA', 'Calle 40 #012 x 25 y 27', 'Col. Pensiones', 'helena.vargas@email.com'),
('SACI860415YZA', 'SANTOS CRUZ IVAN ALEJANDRO', 'Calle 55 #345 x 40 y 42', 'Col. Centro', 'ivan.santos@email.com')
ON CONFLICT (rfc) DO NOTHING;

-- ============================================
-- 10. FACTORES (Relación Maestro-Curso)
-- ============================================

-- Insertar factores para algunos maestros y cursos
INSERT INTO factores (maestro_id, curso_id, factor)
SELECT m.id, c.id, 100
FROM maestros m, cursos c
WHERE m.clave = 'MV' AND c.curso = 'PIANO PREPARATORIO'
ON CONFLICT (maestro_id, curso_id) DO NOTHING;

INSERT INTO factores (maestro_id, curso_id, factor)
SELECT m.id, c.id, 100
FROM maestros m, cursos c
WHERE m.clave = 'BD' AND c.curso = 'GUITARRA ACUSTICA 1'
ON CONFLICT (maestro_id, curso_id) DO NOTHING;

INSERT INTO factores (maestro_id, curso_id, factor)
SELECT m.id, c.id, 120
FROM maestros m, cursos c
WHERE m.clave = 'GM' AND c.curso = 'Bateria 1'
ON CONFLICT (maestro_id, curso_id) DO NOTHING;

INSERT INTO factores (maestro_id, curso_id, factor)
SELECT m.id, c.id, 110
FROM maestros m, cursos c
WHERE m.clave = 'JL' AND c.curso = 'VIOLIN INFANTIL'
ON CONFLICT (maestro_id, curso_id) DO NOTHING;

INSERT INTO factores (maestro_id, curso_id, factor)
SELECT m.id, c.id, 90
FROM maestros m, cursos c
WHERE m.clave = 'GC' AND c.curso = 'CANTO INFANTIL'
ON CONFLICT (maestro_id, curso_id) DO NOTHING;

INSERT INTO factores (maestro_id, curso_id, factor)
SELECT m.id, c.id, 100
FROM maestros m, cursos c
WHERE m.clave = 'MR' AND c.curso = 'Baby Music'
ON CONFLICT (maestro_id, curso_id) DO NOTHING;

INSERT INTO factores (maestro_id, curso_id, factor)
SELECT m.id, c.id, 115
FROM maestros m, cursos c
WHERE m.clave = 'MM' AND c.curso = 'DRUM KIDS'
ON CONFLICT (maestro_id, curso_id) DO NOTHING;

INSERT INTO factores (maestro_id, curso_id, factor)
SELECT m.id, c.id, 95
FROM maestros m, cursos c
WHERE m.clave = 'GM2' AND c.curso = 'INICIACION MUSICAL'
ON CONFLICT (maestro_id, curso_id) DO NOTHING;


-- ============================================
-- 11. USUARIO ADMINISTRADOR
-- ============================================

INSERT INTO usuarios (user_id, password, nombre, rol, acceso_alumnos, acceso_caja, acceso_reportes, acceso_examenes, acceso_mantenimiento, acceso_seguridad, activo) VALUES
('admin', 'admin123', 'Administrador del Sistema', 'admin', true, true, true, true, true, true, true),
('caja', 'caja123', 'Usuario de Caja', 'caja', true, true, false, false, false, false, true),
('maestro', 'maestro123', 'Usuario Maestro', 'maestro', true, false, true, true, false, false, true)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- 12. PROGRAMACIÓN DE EXÁMENES (Ejemplos)
-- ============================================

INSERT INTO programacion_examenes (clave_examen, fecha, hora, tipo_examen, observaciones)
VALUES
('EX-2024-001', '2024-06-15', '10:00', 'Piano Básico', 'Examen de fin de curso nivel 1'),
('EX-2024-002', '2024-06-15', '11:00', 'Guitarra Básico', 'Examen de fin de curso nivel 1'),
('EX-2024-003', '2024-06-16', '10:00', 'Violín Básico', 'Examen de fin de curso nivel 1'),
('EX-2024-004', '2024-06-16', '11:00', 'Batería Básico', 'Examen de fin de curso nivel 1'),
('EX-2024-005', '2024-06-17', '10:00', 'Canto Básico', 'Examen de fin de curso nivel 1')
ON CONFLICT DO NOTHING;

-- ============================================
-- VERIFICACIÓN DE DATOS
-- ============================================

-- Ejecutar estas consultas para verificar que los datos se insertaron correctamente:
-- SELECT COUNT(*) as total_motivos FROM motivos_baja;
-- SELECT COUNT(*) as total_instrumentos FROM instrumentos;
-- SELECT COUNT(*) as total_medios FROM medios_contacto;
-- SELECT COUNT(*) as total_salones FROM salones;
-- SELECT COUNT(*) as total_cursos FROM cursos;
-- SELECT COUNT(*) as total_maestros FROM maestros;
-- SELECT COUNT(*) as total_grupos FROM grupos;
-- SELECT COUNT(*) as total_alumnos FROM alumnos;
-- SELECT COUNT(*) as total_articulos FROM articulos;
-- SELECT COUNT(*) as total_prospectos FROM prospectos;

-- ============================================
-- INSTRUCCIONES IMPORTANTES
-- ============================================
-- 
-- 1. Primero ejecutar SCALA_FULL_SCHEMA.sql en Supabase SQL Editor
-- 2. Ir a Authentication > Policies y deshabilitar RLS en TODAS las tablas
--    O ejecutar estos comandos:
--    ALTER TABLE motivos_baja DISABLE ROW LEVEL SECURITY;
--    ALTER TABLE instrumentos DISABLE ROW LEVEL SECURITY;
--    ALTER TABLE medios_contacto DISABLE ROW LEVEL SECURITY;
--    ALTER TABLE salones DISABLE ROW LEVEL SECURITY;
--    ALTER TABLE tipos_movimiento DISABLE ROW LEVEL SECURITY;
--    ALTER TABLE cursos DISABLE ROW LEVEL SECURITY;
--    ALTER TABLE maestros DISABLE ROW LEVEL SECURITY;
--    ALTER TABLE grupos DISABLE ROW LEVEL SECURITY;
--    ALTER TABLE alumnos DISABLE ROW LEVEL SECURITY;
--    ALTER TABLE alumnos_bajas DISABLE ROW LEVEL SECURITY;
--    ALTER TABLE grupos_articulos DISABLE ROW LEVEL SECURITY;
--    ALTER TABLE articulos DISABLE ROW LEVEL SECURITY;
--    ALTER TABLE movimientos_inventario_maestro DISABLE ROW LEVEL SECURITY;
--    ALTER TABLE movimientos_inventario_detalle DISABLE ROW LEVEL SECURITY;
--    ALTER TABLE recibos DISABLE ROW LEVEL SECURITY;
--    ALTER TABLE operaciones DISABLE ROW LEVEL SECURITY;
--    ALTER TABLE rfc_clientes DISABLE ROW LEVEL SECURITY;
--    ALTER TABLE programacion_examenes DISABLE ROW LEVEL SECURITY;
--    ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
--    ALTER TABLE factores DISABLE ROW LEVEL SECURITY;
--    ALTER TABLE prospectos DISABLE ROW LEVEL SECURITY;
--
-- 3. Ejecutar este archivo DATOS-INICIALES-SUPABASE.sql
-- 4. Verificar que los datos se insertaron con las consultas de verificación
--
-- ============================================
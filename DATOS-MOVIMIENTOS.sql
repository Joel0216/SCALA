-- ============================================
-- DATOS: Movimientos de Inventario
-- ============================================
-- Sistema SCALA - Movimientos Existentes
-- Fecha: 2026-02-15
-- ============================================

-- ==================== TIPOS DE MOVIMIENTO ====================
-- Catálogo de tipos extraído de: Claves Movimientos de inventiarios.png
INSERT INTO tipos_movimiento (clave, descripcion) VALUES
('AD', 'NUEVA ADQUISICIÓN'),
('DE', 'DEVOLUCIÓN'),
('ME', 'MOVTO INTERNO ENT.'),
('MS', 'MOVTO INTERNO SAL.'),
('P', 'PRÉSTAMO'),
('R', 'RECEPCION'),
('S', 'SALIDA');

-- ==================== MOVIMIENTOS ENCABEZADO (EJEMPLOS) ====================
-- Estos son registros de ejemplo. Para cargar datos reales desde XLS,
-- el usuario debe proporcionar los archivos CSV o ejecutar el script de extracción

-- Ejemplo 1: Nueva adquisición
INSERT INTO movimientos_encabezado (id, fecha, tipo_movimiento, observaciones) VALUES
(1, '2024-01-15', 'AD', 'Compra de instrumentos musicales'),
(2, '2024-01-20', 'R', 'Recepción de materiales didácticos'),
(3, '2024-02-01', 'S', 'Salida para evento escolar'),
(4, '2024-02-05', 'DE', 'Devolución de artículos defectuosos'),
(5, '2024-02-10', 'P', 'Préstamo a maestro de violín');

-- ==================== MOVIMIENTOS DETALLE (EJEMPLOS) ====================
-- Detalles correspondientes a los movimientos de ejemplo

-- Movimiento 1: Nueva Adquisición
INSERT INTO movimientos_detalle (movimiento_id, clave_articulo, cantidad, precio) VALUES
(1, 'VI', 5, 200.00),
(1, 'PIP', 10, 200.00),
(1, 'MTIM', 3, 300.00);

-- Movimiento 2: Recepción
INSERT INTO movimientos_detalle (movimiento_id, clave_articulo, cantidad, precio) VALUES
(2, 'FGM', 20, 248.00),
(2, 'FGMR', 15, 248.00),
(2, 'TCP', 50, 9.00);

-- Movimiento 3: Salida
INSERT INTO movimientos_detalle (movimiento_id, clave_articulo, cantidad, precio) VALUES
(3, 'MC', 10, 150.00),
(3, 'PKM', 15, 60.00);

-- Movimiento 4: Devolución
INSERT INTO movimientos_detalle (movimiento_id, clave_articulo, cantidad, precio) VALUES
(4, 'PP', -2, 20.00);

-- Movimiento 5: Préstamo
INSERT INTO movimientos_detalle (movimiento_id, clave_articulo, cantidad, precio) VALUES
(5, 'VII', 1, 550.00);

-- ==================== RESETEAR SECUENCIA ====================
-- Ajustar la secuencia para que el próximo ID sea correcto
SELECT setval('movimientos_encabezado_id_seq', (SELECT MAX(id) FROM movimientos_encabezado));

-- ==================== VERIFICACIÓN ====================
SELECT 
    'Datos cargados:' AS info,
    (SELECT COUNT(*) FROM tipos_movimiento) AS tipos,
    (SELECT COUNT(*) FROM movimientos_encabezado) AS movimientos,
    (SELECT COUNT(*) FROM movimientos_detalle) AS detalles;

-- ==================== NOTA IMPORTANTE ====================
/*
PARA CARGAR DATOS REALES:

1. Los archivos XLS están en: C:\Users\PC05\Downloads\Scala\Scala tablas\
   - Movimientos de Inventarios.xls (encabezados)
   - Movimientos de Inventarios Det.xls (detalles)

2. Para extraer todos los datos:
   - Exportar manualmente a CSV desde Excel
   - O proporcionar los CSV al desarrollador
   - O usar el script PowerShell: generate_movimientos_sql.ps1

3. Formato de fechas Excel:
   - Las fechas en Excel están en formato numérico (ej. 40054.0)
   - Fórmula de conversión: fecha_base + días
   - fecha_base = 1899-12-30
   - Ejemplo: 40054.0 → 2009-08-21

4. Estructura esperada del CSV de encabezados:
   Columna 1: ID (entero)
   Columna 2: Tipo de Movimiento (texto, debe existir en tipos_movimiento)
   Columna 3: Fecha (número Excel o texto YYYY-MM-DD)
   Columna 4: Observaciones (texto, opcional)

5. Estructura esperada del CSV de detalles:
   Columna 1: Movimiento ID (debe existir en encabezado)
   Columna 2: Clave Artículo (debe existir en tabla articulos)
   Columna 3: Cantidad (entero, negativo para salidas)
   Columna 4: Precio (decimal)
*/

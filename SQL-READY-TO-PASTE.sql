-- SQL-READY-TO-PASTE.sql
-- Crear tabla tipos_movimiento si no existe
CREATE TABLE IF NOT EXISTS tipos_movimiento (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(10) UNIQUE NOT NULL,
    descripcion TEXT NOT NULL,
    suma BOOLEAN NOT NULL DEFAULT TRUE
);

-- Insertar los 7 tipos de movimiento
INSERT INTO tipos_movimiento (clave, descripcion, suma) VALUES
('AD', 'NUEVA ADQUISICIÓN', TRUE),
('AJ', 'AJUSTE DE INVENTARIO', TRUE),
('DV', 'DEVOLUCIÓN', TRUE),
('TR', 'TRANSFERENCIA', FALSE),
('VE', 'VENTA', FALSE),
('PE', 'PERDIDA', FALSE),
('RO', 'ROBO', FALSE)
ON CONFLICT (clave) DO NOTHING;

-- Crear tabla movimientos_encabezado si no existe
CREATE TABLE IF NOT EXISTS movimientos_encabezado (
    id SERIAL PRIMARY KEY,
    numero INTEGER UNIQUE NOT NULL,
    fecha DATE NOT NULL,
    tipo_id INTEGER REFERENCES tipos_movimiento(id),
    observaciones TEXT,
    total DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla movimientos_detalle si no existe
CREATE TABLE IF NOT EXISTS movimientos_detalle (
    id SERIAL PRIMARY KEY,
    movimiento_id INTEGER REFERENCES movimientos_encabezado(id) ON DELETE CASCADE,
    articulo_clave VARCHAR(50) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2),
    cantidad INTEGER NOT NULL,
    subtotal DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Verificar que existan las tablas movimientos_encabezado, movimientos_detalle y articulos
-- (Estas consultas no hacen nada, solo verifican existencia)
SELECT 'tipos_movimiento' as tabla, COUNT(*) as registros FROM tipos_movimiento
UNION ALL
SELECT 'movimientos_encabezado' as tabla, COUNT(*) as registros FROM movimientos_encabezado
UNION ALL
SELECT 'movimientos_detalle' as tabla, COUNT(*) as registros FROM movimientos_detalle
UNION ALL
SELECT 'articulos' as tabla, COUNT(*) as registros FROM articulos;

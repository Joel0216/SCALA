-- ============================================
-- SCHEMA: Movimientos de Inventario
-- ============================================
-- Sistema SCALA - Módulo de Inventario
-- Fecha: 2026-02-15
-- ============================================

-- ==================== TABLA 1: TIPOS DE MOVIMIENTO ====================
--  Catálogo de tipos de movimientos (Compra, Venta, Ajuste, etc.)
CREATE TABLE IF NOT EXISTS tipos_movimiento (
    clave TEXT PRIMARY KEY,
    descripcion TEXT NOT NULL
);

-- ==================== TABLA 2: MOVIMIENTOS ENCABEZADO ====================
-- Cabecera de cada movimiento de inventario
CREATE TABLE IF NOT EXISTS movimientos_encabezado (
    id SERIAL PRIMARY KEY,
    fecha DATE,  -- Permite NULL porque algunos movimientos no tienen fecha en datos originales
    tipo_movimiento TEXT NOT NULL REFERENCES tipos_movimiento(clave),
    observaciones TEXT
);

-- ==================== TABLA 3: MOVIMIENTOS DETALLE ====================
-- Artículos incluidos en cada movimiento
-- NOTA: No usa FK en clave_articulo porque los datos históricos contienen
--       artículos que ya no existen en la tabla actual de articulos
CREATE TABLE IF NOT EXISTS movimientos_detalle (
    id SERIAL PRIMARY KEY,
    movimiento_id INTEGER NOT NULL REFERENCES movimientos_encabezado(id) ON DELETE CASCADE,
    clave_articulo TEXT NOT NULL,  -- Sin FK: permite artículos históricos
    cantidad INTEGER NOT NULL DEFAULT 0,
    precio NUMERIC(10,2) DEFAULT 0.00
);

-- ==================== ÍNDICES ====================
CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON movimientos_encabezado(fecha);
CREATE INDEX IF NOT EXISTS idx_movimientos_tipo ON movimientos_encabezado(tipo_movimiento);
CREATE INDEX IF NOT EXISTS idx_detalle_movimiento ON movimientos_detalle(movimiento_id);
CREATE INDEX IF NOT EXISTS idx_detalle_articulo ON movimientos_detalle(clave_articulo);

-- ==================== FUNCIÓN: RENUMERAR IDs DESPUÉS DE BORRAR ====================
-- Esta función borra un movimiento y renumera los IDs superiores
CREATE OR REPLACE FUNCTION renumerar_movimientos_despues_borrar(id_borrado INTEGER)
RETURNS VOID AS $$
DECLARE
    max_id INTEGER;
BEGIN
    -- 1. Borrar el movimiento (CASCADE elimina detalles)
    DELETE FROM movimientos_encabezado WHERE id = id_borrado;
    
    -- 2. Obtener max ID después del borrado
    SELECT COALESCE(MAX(id), 0) INTO max_id FROM movimientos_encabezado;
    
    -- 3. Renumerar IDs superiores
    -- Crear tabla temporal con nueva numeración
    CREATE TEMP TABLE IF NOT EXISTS temp_renumeracion AS
    SELECT 
        id AS id_original,
        ROW_NUMBER() OVER (ORDER BY id) AS id_nuevo
    FROM movimientos_encabezado
    ORDER BY id;
    
    -- 4. Actualizar IDs en encabezado
    UPDATE movimientos_encabezado e
    SET id = t.id_nuevo
    FROM temp_renumeracion t
    WHERE e.id = t.id_original AND e.id != t.id_nuevo;
    
    -- 5. Actualizar referencias en detalle
    UPDATE movimientos_detalle d
    SET movimiento_id = t.id_nuevo
    FROM temp_renumeracion t
    WHERE d.movimiento_id = t.id_original AND d.movimiento_id != t.id_nuevo;
    
    -- 6. Resetear secuencia
    PERFORM setval('movimientos_encabezado_id_seq', max_id);
    
    -- 7. Limpiar tabla temporal
    DROP TABLE IF EXISTS temp_renumeracion;
    
    RAISE NOTICE 'Movimiento % borrado. IDs renumerados correctamente.', id_borrado;
END;
$$ LANGUAGE plpgsql;

-- ==================== COMENTARIOS ====================
COMMENT ON TABLE tipos_movimiento IS 'Catálogo de tipos de movimientos de inventario';
COMMENT ON TABLE movimientos_encabezado IS 'Cabecera de movimientos de inventario (maestro)';
COMMENT ON TABLE movimientos_detalle IS 'Artículos por movimiento (detalle)';
COMMENT ON FUNCTION renumerar_movimientos_despues_borrar IS 'Borra un movimiento y renumera los IDs superiores';

-- ==================== VERIFICACIÓN ====================
SELECT 'Schema creado exitosamente' AS mensaje;

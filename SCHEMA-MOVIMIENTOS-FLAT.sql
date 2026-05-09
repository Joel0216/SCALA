-- =====================================================================
-- SCHEMA: Movimientos de Inventario (TABLA ÚNICA - CORREGIDA)
-- =====================================================================

-- 1. ELIMINAR TABLAS ANTERIORES
DROP TABLE IF EXISTS movimientos_detalle CASCADE;
DROP TABLE IF EXISTS movimientos_encabezado CASCADE;
DROP TABLE IF EXISTS movimientos_inventario_detalle CASCADE;
DROP TABLE IF EXISTS movimientos_inventario_maestro CASCADE;
DROP TABLE IF EXISTS movimientos_inventario CASCADE;

-- 2. TABLA ÚNICA
-- Nota: tipos_movimiento.clave es TEXT, articulos.id es BIGINT
CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id SERIAL PRIMARY KEY,
    numero INTEGER NOT NULL,            -- Identificador del "ticket" o movimiento
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    hora TIME NOT NULL DEFAULT CURRENT_TIME,
    tipo_id TEXT REFERENCES tipos_movimiento(clave), -- Nota: Referencia a CLAVE
    articulo_id BIGINT REFERENCES articulos(id),      -- Nota: Referencia a BIGINT (id es BIGSERIAL)
    cantidad INTEGER NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(10,2) DEFAULT 0.00,
    total DECIMAL(10,2) DEFAULT 0.00,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ÍNDICES
CREATE INDEX IF NOT EXISTS idx_mov_numero ON movimientos_inventario(numero);
CREATE INDEX IF NOT EXISTS idx_mov_fecha ON movimientos_inventario(fecha);
CREATE INDEX IF NOT EXISTS idx_mov_articulo ON movimientos_inventario(articulo_id);

-- 4. FUNCIÓN PARA ACTUALIZAR STOCK AUTOMÁTICAMENTE
CREATE OR REPLACE FUNCTION fn_actualizar_stock_flat()
RETURNS TRIGGER AS $$
DECLARE
    v_afecta TEXT;
BEGIN
    -- Obtener cómo afecta el movimiento según el catálogo (usando CLAVE)
    SELECT afecta_inventario INTO v_afecta 
    FROM tipos_movimiento 
    WHERE clave = COALESCE(NEW.tipo_id, OLD.tipo_id);

    -- Si no afecta, no hacemos nada
    IF v_afecta = 'NINGUNO' OR v_afecta IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    -- INSERT: Afectar stock (basado en 'stock' de articulos)
    IF (TG_OP = 'INSERT') THEN
        IF v_afecta = 'SUMA' THEN
            UPDATE articulos SET stock = stock + NEW.cantidad WHERE id = NEW.articulo_id;
        ELSIF v_afecta = 'RESTA' THEN
            UPDATE articulos SET stock = stock - NEW.cantidad WHERE id = NEW.articulo_id;
        END IF;
    
    -- DELETE: Revertir stock
    ELSIF (TG_OP = 'DELETE') THEN
        IF v_afecta = 'SUMA' THEN
            UPDATE articulos SET stock = stock - OLD.cantidad WHERE id = OLD.articulo_id;
        ELSIF v_afecta = 'RESTA' THEN
            UPDATE articulos SET stock = stock + OLD.cantidad WHERE id = OLD.articulo_id;
        END IF;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 5. TRIGGER
DROP TRIGGER IF EXISTS trg_actualizar_stock_flat ON movimientos_inventario;
CREATE TRIGGER trg_actualizar_stock_flat
AFTER INSERT OR DELETE ON movimientos_inventario
FOR EACH ROW
EXECUTE FUNCTION fn_actualizar_stock_flat();

-- 6. RPC RENUMERACIÓN
CREATE OR REPLACE FUNCTION renumerar_movimientos_flat(p_numero_borrado INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE movimientos_inventario 
    SET numero = numero - 1 
    WHERE numero > p_numero_borrado;
END;
$$ LANGUAGE plpgsql;

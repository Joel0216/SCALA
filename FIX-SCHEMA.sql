-- =====================================================================
-- FIX-SCHEMA.sql: Correcciones Definitivas para Scala
-- =====================================================================

-- 1. CORRECCIÓN DE CATÁLOGO DE MOTIVOS
-- Renombrar tabla si existe como 'motivos' para que coincida con el estándar 'motivos_baja'
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'motivos') THEN
        DROP TABLE IF EXISTS motivos_baja CASCADE;
        ALTER TABLE motivos RENAME TO motivos_baja;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS motivos_baja (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clave VARCHAR(10) UNIQUE NOT NULL,
    descripcion VARCHAR(200) NOT NULL,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CORRECCIÓN DE TIPOS DE MOVIMIENTO
-- Asegurar que afecta_inventario sea VARCHAR para manejar SUMA/RESTA/NINGUNO
DROP TABLE IF EXISTS tipos_movimiento CASCADE;
CREATE TABLE tipos_movimiento (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clave TEXT UNIQUE NOT NULL,
    descripcion TEXT NOT NULL,
    afecta_inventario TEXT NOT NULL DEFAULT 'NINGUNO', -- 'SUMA', 'RESTA', 'NINGUNO'
    tipo TEXT NOT NULL, -- 'ENTRADA', 'SALIDA', 'AJUSTE'
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO tipos_movimiento (clave, descripcion, afecta_inventario, tipo) VALUES
('AD', 'ADQUISICION', 'SUMA', 'ENTRADA'),
('S', 'SALIDA', 'RESTA', 'SALIDA'),
('E', 'ENTRADA', 'SUMA', 'ENTRADA'),
('AJ', 'AJUSTE', 'NINGUNO', 'AJUSTE')
ON CONFLICT (clave) DO UPDATE SET 
    afecta_inventario = EXCLUDED.afecta_inventario, 
    tipo = EXCLUDED.tipo;

-- 3. TABLA ÚNICA DE MOVIMIENTOS DE INVENTARIO
DROP TABLE IF EXISTS movimientos_inventario CASCADE;
CREATE TABLE movimientos_inventario (
    id SERIAL PRIMARY KEY,
    numero INTEGER NOT NULL,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    hora TIME NOT NULL DEFAULT CURRENT_TIME,
    tipo_id TEXT REFERENCES tipos_movimiento(clave),
    articulo_id BIGINT REFERENCES articulos(id),
    cantidad INTEGER NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(10,2) DEFAULT 0.00,
    total DECIMAL(10,2) DEFAULT 0.00,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TRIGGER DE ACTUALIZACIÓN DE STOCK
CREATE OR REPLACE FUNCTION fn_actualizar_stock_flat()
RETURNS TRIGGER AS $$
DECLARE
    v_afecta TEXT;
BEGIN
    SELECT afecta_inventario INTO v_afecta 
    FROM tipos_movimiento 
    WHERE clave = COALESCE(NEW.tipo_id, OLD.tipo_id);

    IF v_afecta = 'NINGUNO' OR v_afecta IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    IF (TG_OP = 'INSERT') THEN
        IF v_afecta = 'SUMA' THEN
            UPDATE articulos SET stock = stock + NEW.cantidad WHERE id = NEW.articulo_id;
        ELSIF v_afecta = 'RESTA' THEN
            UPDATE articulos SET stock = stock - NEW.cantidad WHERE id = NEW.articulo_id;
        END IF;
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

DROP TRIGGER IF EXISTS trg_actualizar_stock_flat ON movimientos_inventario;
CREATE TRIGGER trg_actualizar_stock_flat
AFTER INSERT OR DELETE ON movimientos_inventario
FOR EACH ROW
EXECUTE FUNCTION fn_actualizar_stock_flat();

-- 5. ADICIÓN DE FORMA DE PAGO A MAESTROS
ALTER TABLE maestros ADD COLUMN IF NOT EXISTS forma_pago VARCHAR(50) DEFAULT 'POR ALUMNO';

-- =====================================================================
-- MIGRACIÓN UNIFICADA Y SEGURA (CORRIGE ERROR 42P01)
-- =====================================================================

-- 1. Crear la nueva tabla si no existe (con UUID para articulos)
CREATE TABLE IF NOT EXISTS movimientos_inventario (
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

-- 2. Migración detectando nombres de tablas dinámicamente
DO $$
BEGIN
    -- Intentar con movimientos_inventario_maestro / detalle (UUID version)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'movimientos_inventario_detalle') THEN
        INSERT INTO movimientos_inventario (
            numero, fecha, hora, tipo_id, articulo_id, cantidad, precio_unitario, total, observaciones
        )
        SELECT 
            m.numero, m.fecha, m.hora, t.clave, d.articulo_id,
            d.cantidad, d.precio_unitario, COALESCE(d.total, d.cantidad * d.precio_unitario),
            m.observaciones
        FROM movimientos_inventario_detalle d
        JOIN movimientos_inventario_maestro m ON d.movimiento_id = m.id
        JOIN tipos_movimiento t ON m.tipo_movimiento_id = t.id
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Datos migrados desde movimientos_inventario_maestro/detalle';

    -- Intentar con movimientos_encabezado / detalle (Legacy version)
    ELSIF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'movimientos_detalle') THEN
        INSERT INTO movimientos_inventario (
            numero, fecha, hora, tipo_id, articulo_id, cantidad, precio_unitario, total, observaciones
        )
        SELECT 
            enc.id as numero, enc.fecha, '00:00:00'::TIME, enc.tipo_movimiento, art.id,
            det.cantidad, det.precio, (det.cantidad * det.precio),
            enc.observaciones
        FROM movimientos_detalle det
        JOIN movimientos_encabezado enc ON det.movimiento_id = enc.id
        JOIN articulos art ON art.clave = det.clave_articulo
        ON CONFLICT DO NOTHING;

        RAISE NOTICE 'Datos migrados desde movimientos_encabezado/detalle';
    
    ELSE
        RAISE WARNING 'No se encontraron tablas de origen. Si ya migró anteriormente, ignore este mensaje.';
    END IF;
END $$;

-- 3. Actualizar correlativo de secuencia
SELECT setval(pg_get_serial_sequence('movimientos_inventario', 'id'), COALESCE((SELECT MAX(id) FROM movimientos_inventario), 1));

-- =====================================================================
-- MIGRACIÓN ROBUSTA: De Maestro/Detalle a Tabla Única (FLAT)
-- =====================================================================

DO $$
BEGIN
    -- OPCIÓN A: Si existen las tablas con nombre "movimientos_inventario_maestro/detalle"
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'movimientos_inventario_detalle') THEN
        RAISE NOTICE 'Migrando desde movimientos_inventario_maestro/detalle...';
        
        INSERT INTO movimientos_inventario (
            numero, fecha, hora, tipo_id, articulo_id, cantidad, precio_unitario, total, observaciones
        )
        SELECT 
            m.numero,
            m.fecha,
            m.hora,
            t.clave, -- Referencia por clave (TEXT)
            d.articulo_id,
            d.cantidad,
            d.precio_unitario,
            COALESCE(d.total, d.cantidad * d.precio_unitario),
            m.observaciones
        FROM movimientos_inventario_detalle d
        JOIN movimientos_inventario_maestro m ON d.movimiento_id = m.id
        JOIN tipos_movimiento t ON m.tipo_movimiento_id = t.id
        ON CONFLICT DO NOTHING;

    -- OPCIÓN B: Si existen las tablas con nombre "movimientos_encabezado/detalle"
    ELSIF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'movimientos_detalle') THEN
        RAISE NOTICE 'Migrando desde movimientos_encabezado/detalle...';

        INSERT INTO movimientos_inventario (
            numero, fecha, hora, tipo_id, articulo_id, cantidad, precio_unitario, total, observaciones
        )
        SELECT 
            enc.id as numero,
            enc.fecha,
            '00:00:00'::TIME as hora,
            enc.tipo_movimiento as tipo_id,
            art.id as articulo_id,
            det.cantidad,
            det.precio as precio_unitario,
            (det.cantidad * det.precio) as total,
            enc.observaciones
        FROM movimientos_detalle det
        JOIN movimientos_encabezado enc ON det.movimiento_id = enc.id
        JOIN articulos art ON art.clave = det.clave_articulo
        ON CONFLICT DO NOTHING;
    
    ELSE
        RAISE WARNING 'No se encontraron tablas de origen para la migración. Verifique los nombres.';
    END IF;
END $$;

-- Actualizar secuencia
SELECT setval(pg_get_serial_sequence('movimientos_inventario', 'id'), COALESCE((SELECT MAX(id) FROM movimientos_inventario), 1));

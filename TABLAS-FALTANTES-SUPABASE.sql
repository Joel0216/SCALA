-- ============================================
-- TABLAS FALTANTES PARA SISTEMA SCALA
-- Agregar al schema existente
-- ============================================

-- Tipos de Movimiento de Inventario
CREATE TABLE tipos_movimiento (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clave VARCHAR(10) UNIQUE NOT NULL,
  descripcion VARCHAR(200) NOT NULL,
  afecta_inventario BOOLEAN DEFAULT true,
  tipo VARCHAR(20) NOT NULL, -- 'ENTRADA', 'SALIDA', 'AJUSTE'
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insertar tipos de movimiento básicos
INSERT INTO tipos_movimiento (clave, descripcion, afecta_inventario, tipo) VALUES
('AD', 'ADQUISICION', true, 'ENTRADA'),
('S', 'SALIDA', true, 'SALIDA'),
('E', 'ENTRADA', true, 'ENTRADA'),
('AJ', 'AJUSTE', true, 'AJUSTE');

-- Movimientos de Inventario (Maestro/Cabecera)
CREATE TABLE movimientos_inventario_maestro (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero SERIAL UNIQUE NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  tipo_movimiento_id UUID REFERENCES tipos_movimiento(id),
  observaciones TEXT,
  usuario_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Movimientos de Inventario (Detalle)
CREATE TABLE movimientos_inventario_detalle (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  movimiento_id UUID REFERENCES movimientos_inventario_maestro(id) ON DELETE CASCADE,
  articulo_id BIGINT REFERENCES articulos(id),
  cantidad INTEGER NOT NULL,
  precio_unitario DECIMAL(10,2),
  total DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de Alumnos Bajas (para reingresos)
CREATE TABLE alumnos_bajas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  credencial1 VARCHAR(10) NOT NULL,
  credencial2 VARCHAR(10),
  nombre VARCHAR(200) NOT NULL,
  direccion1 VARCHAR(300),
  direccion2 VARCHAR(300),
  telefono VARCHAR(20),
  celular VARCHAR(20),
  email VARCHAR(150),
  nombre_padre VARCHAR(200),
  celular_padre VARCHAR(20),
  nombre_madre VARCHAR(200),
  celular_madre VARCHAR(20),
  grupo VARCHAR(20),
  grado VARCHAR(50),
  fecha_ingreso DATE,
  fecha_baja DATE NOT NULL DEFAULT CURRENT_DATE,
  edad INTEGER,
  beca BOOLEAN DEFAULT false,
  porcentaje_beca DECIMAL(5,2),
  comentario TEXT,
  observaciones TEXT,
  instrumento_id UUID REFERENCES instrumentos(id),
  medio_entero_id UUID REFERENCES medios_contacto(id),
  motivo_baja_id UUID REFERENCES motivos_baja(id),
  reingresado BOOLEAN DEFAULT false,
  fecha_reingreso DATE,
  grupo_reingreso VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para optimización
CREATE INDEX idx_movimientos_maestro_fecha ON movimientos_inventario_maestro(fecha);
CREATE INDEX idx_movimientos_maestro_numero ON movimientos_inventario_maestro(numero);
CREATE INDEX idx_movimientos_detalle_movimiento ON movimientos_inventario_detalle(movimiento_id);
CREATE INDEX idx_movimientos_detalle_articulo ON movimientos_inventario_detalle(articulo_id);
CREATE INDEX idx_alumnos_bajas_credencial ON alumnos_bajas(credencial1);
CREATE INDEX idx_alumnos_bajas_nombre ON alumnos_bajas(nombre);
CREATE INDEX idx_alumnos_bajas_fecha ON alumnos_bajas(fecha_baja);

-- Función para actualizar existencia de artículos al crear movimiento
CREATE OR REPLACE FUNCTION actualizar_existencia_articulo()
RETURNS TRIGGER AS $$
DECLARE
    tipo_mov VARCHAR(20);
    afecta_inv BOOLEAN;
BEGIN
    -- Obtener tipo de movimiento
    SELECT tm.tipo, tm.afecta_inventario INTO tipo_mov, afecta_inv
    FROM movimientos_inventario_maestro mm
    JOIN tipos_movimiento tm ON mm.tipo_movimiento_id = tm.id
    WHERE mm.id = NEW.movimiento_id;
    
    -- Solo actualizar si afecta inventario
    IF afecta_inv THEN
        IF tipo_mov = 'ENTRADA' OR tipo_mov = 'ADQUISICION' THEN
            -- Aumentar existencia
            UPDATE articulos 
            SET existencia = existencia + NEW.cantidad,
                updated_at = NOW()
            WHERE id = NEW.articulo_id;
        ELSIF tipo_mov = 'SALIDA' THEN
            -- Disminuir existencia
            UPDATE articulos 
            SET existencia = GREATEST(0, existencia - NEW.cantidad),
                updated_at = NOW()
            WHERE id = NEW.articulo_id;
        ELSIF tipo_mov = 'AJUSTE' THEN
            -- Para ajustes, se debe especificar la cantidad final
            -- Por ahora, no hacemos nada automático
            NULL;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar existencia
CREATE TRIGGER trigger_actualizar_existencia
AFTER INSERT ON movimientos_inventario_detalle
FOR EACH ROW EXECUTE FUNCTION actualizar_existencia_articulo();

-- Función para revertir existencia al eliminar movimiento
CREATE OR REPLACE FUNCTION revertir_existencia_articulo()
RETURNS TRIGGER AS $$
DECLARE
    tipo_mov VARCHAR(20);
    afecta_inv BOOLEAN;
BEGIN
    -- Obtener tipo de movimiento
    SELECT tm.tipo, tm.afecta_inventario INTO tipo_mov, afecta_inv
    FROM movimientos_inventario_maestro mm
    JOIN tipos_movimiento tm ON mm.tipo_movimiento_id = tm.id
    WHERE mm.id = OLD.movimiento_id;
    
    -- Solo revertir si afecta inventario
    IF afecta_inv THEN
        IF tipo_mov = 'ENTRADA' OR tipo_mov = 'ADQUISICION' THEN
            -- Revertir: disminuir existencia
            UPDATE articulos 
            SET existencia = GREATEST(0, existencia - OLD.cantidad),
                updated_at = NOW()
            WHERE id = OLD.articulo_id;
        ELSIF tipo_mov = 'SALIDA' THEN
            -- Revertir: aumentar existencia
            UPDATE articulos 
            SET existencia = existencia + OLD.cantidad,
                updated_at = NOW()
            WHERE id = OLD.articulo_id;
        END IF;
    END IF;
    
    RETURN OLD;
END;
$$ language 'plpgsql';

-- Trigger para revertir existencia al eliminar
CREATE TRIGGER trigger_revertir_existencia
AFTER DELETE ON movimientos_inventario_detalle
FOR EACH ROW EXECUTE FUNCTION revertir_existencia_articulo();

-- Función para reingresar alumno desde bajas
CREATE OR REPLACE FUNCTION reingresar_alumno(
    p_baja_id UUID,
    p_grupo_nuevo VARCHAR(20),
    p_beca BOOLEAN DEFAULT false,
    p_porcentaje_beca DECIMAL(5,2) DEFAULT 0,
    p_observaciones TEXT DEFAULT ''
)
RETURNS UUID AS $$
DECLARE
    v_alumno_id UUID;
    v_baja RECORD;
BEGIN
    -- Obtener datos de la baja
    SELECT * INTO v_baja FROM alumnos_bajas WHERE id = p_baja_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Baja no encontrada';
    END IF;
    
    IF v_baja.reingresado THEN
        RAISE EXCEPTION 'Este alumno ya fue reingresado anteriormente';
    END IF;
    
    -- Crear nuevo registro de alumno
    INSERT INTO alumnos (
        credencial1, credencial2, nombre,
        direccion1, direccion2, telefono, celular, email,
        nombre_padre, celular_padre, nombre_madre, celular_madre,
        grupo, grado, fecha_ingreso,
        beca, porcentaje_beca, comentario,
        instrumento, medio_entero, status
    ) VALUES (
        v_baja.credencial1, v_baja.credencial2, v_baja.nombre,
        v_baja.direccion1, v_baja.direccion2, v_baja.telefono, v_baja.celular, v_baja.email,
        v_baja.nombre_padre, v_baja.celular_padre, v_baja.nombre_madre, v_baja.celular_madre,
        p_grupo_nuevo, v_baja.grado, CURRENT_DATE,
        p_beca, p_porcentaje_beca, p_observaciones,
        (SELECT clave FROM instrumentos WHERE id = v_baja.instrumento_id),
        (SELECT clave FROM medios_contacto WHERE id = v_baja.medio_entero_id),
        'activo'
    ) RETURNING id INTO v_alumno_id;
    
    -- Marcar baja como reingresada
    UPDATE alumnos_bajas 
    SET reingresado = true,
        fecha_reingreso = CURRENT_DATE,
        grupo_reingreso = p_grupo_nuevo
    WHERE id = p_baja_id;
    
    RETURN v_alumno_id;
END;
$$ language 'plpgsql';

-- Comentarios
COMMENT ON TABLE movimientos_inventario_maestro IS 'Cabecera de movimientos de inventario';
COMMENT ON TABLE movimientos_inventario_detalle IS 'Detalle de artículos en movimientos de inventario';
COMMENT ON TABLE tipos_movimiento IS 'Catálogo de tipos de movimiento de inventario';
COMMENT ON TABLE alumnos_bajas IS 'Registro de alumnos dados de baja para reingresos';

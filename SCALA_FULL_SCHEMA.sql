-- ============================================
-- SCHEMA COMPLETO PARA SISTEMA SCALA (ESTRUCTURA + AUTOMATIZACIÓN)
-- ============================================

-- Habilitar extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. CATÁLOGOS BASE
-- ============================================

CREATE TABLE IF NOT EXISTS motivos_baja (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clave VARCHAR(10) UNIQUE NOT NULL,
  descripcion VARCHAR(200) NOT NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS instrumentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clave VARCHAR(10) UNIQUE NOT NULL,
  descripcion VARCHAR(200) NOT NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS medios_contacto (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clave VARCHAR(10) UNIQUE NOT NULL,
  descripcion VARCHAR(200) NOT NULL,
  tipo VARCHAR(50),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS salones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero VARCHAR(20) UNIQUE NOT NULL,
  ubicacion VARCHAR(200),
  cupo INTEGER DEFAULT 10,
  instrumentos TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tipos_movimiento (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clave VARCHAR(10) UNIQUE NOT NULL,
  descripcion VARCHAR(200) NOT NULL,
  afecta_inventario BOOLEAN DEFAULT true,
  es_entrada BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 2. TABLAS MAESTRAS PRINCIPALES
-- ============================================

CREATE TABLE IF NOT EXISTS cursos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  curso VARCHAR(100) UNIQUE NOT NULL,
  descripcion TEXT,
  duracion_meses INTEGER,
  precio_mensual DECIMAL(10,2),
  precio_inscripcion DECIMAL(10,2),
  nivel VARCHAR(50),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maestros (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(200) NOT NULL,
  direccion VARCHAR(300),
  telefono VARCHAR(20),
  celular VARCHAR(20),
  email VARCHAR(150),
  clave VARCHAR(20),
  rfc VARCHAR(20),
  grado VARCHAR(100),
  detalles_grado TEXT,
  fecha_ingreso DATE,
  fecha_baja DATE,
  status VARCHAR(20) DEFAULT 'activo',
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS grupos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clave VARCHAR(20) UNIQUE NOT NULL,
  curso_id UUID REFERENCES cursos(id),
  maestro_id UUID REFERENCES maestros(id),
  salon_id UUID REFERENCES salones(id),
  dia VARCHAR(20),
  hora_entrada VARCHAR(10),
  hora_salida VARCHAR(10),
  cupo INTEGER DEFAULT 10,
  alumnos_inscritos INTEGER DEFAULT 0,
  inicio DATE,
  leccion VARCHAR(50),
  fecha_leccion DATE,
  status VARCHAR(20) DEFAULT 'activo',
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alumnos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  credencial1 VARCHAR(10) NOT NULL,
  credencial2 VARCHAR(10),
  nombre VARCHAR(200) NOT NULL,
  apellidos VARCHAR(200),
  edad INTEGER,
  fecha_nacimiento DATE,
  direccion1 VARCHAR(300),
  direccion2 VARCHAR(300),
  ciudad VARCHAR(100),
  codigo_postal VARCHAR(10),
  telefono VARCHAR(20),
  celular VARCHAR(20),
  email VARCHAR(150),
  nombre_padre VARCHAR(200),
  celular_padre VARCHAR(20),
  nombre_madre VARCHAR(200),
  celular_madre VARCHAR(20),
  rfc_tutor VARCHAR(13),
  grupo_id UUID REFERENCES grupos(id),
  grupo VARCHAR(20),
  curso VARCHAR(100),
  grado VARCHAR(50),
  instrumento_id UUID REFERENCES instrumentos(id),
  fecha_ingreso DATE,
  fecha_baja DATE,
  motivo_baja VARCHAR(50),
  status VARCHAR(20) DEFAULT 'activo',
  beca BOOLEAN DEFAULT false,
  porcentaje_beca DECIMAL(5,2),
  medio_entero_id UUID REFERENCES medios_contacto(id),
  comentario TEXT,
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(credencial1, credencial2)
);

CREATE TABLE IF NOT EXISTS alumnos_bajas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumno_original_id UUID REFERENCES alumnos(id),
  credencial1 VARCHAR(10),
  credencial2 VARCHAR(10),
  nombre VARCHAR(200),
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
  fecha_baja DATE DEFAULT CURRENT_DATE,
  edad INTEGER,
  comentario TEXT,
  observaciones TEXT,
  beca BOOLEAN,
  porcentaje_beca DECIMAL(5,2),
  instrumento_id UUID REFERENCES instrumentos(id),
  medio_entero_id UUID REFERENCES medios_contacto(id),
  motivo_baja_id UUID REFERENCES motivos_baja(id),
  reingresado BOOLEAN DEFAULT false,
  fecha_reingreso DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 3. INVENTARIOS
-- ============================================

CREATE TABLE IF NOT EXISTS grupos_articulos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(100) UNIQUE NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS articulos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clave VARCHAR(20) UNIQUE NOT NULL,
  descripcion VARCHAR(200) NOT NULL,
  grupo_articulo_id UUID REFERENCES grupos_articulos(id),
  precio DECIMAL(10,2) NOT NULL,
  existencia INTEGER DEFAULT 0,
  minimo INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS movimientos_inventario_maestro (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero SERIAL UNIQUE NOT NULL,
  fecha DATE DEFAULT CURRENT_DATE,
  tipo_movimiento_id UUID REFERENCES tipos_movimiento(id),
  referencia VARCHAR(100),
  observaciones TEXT,
  usuario_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS movimientos_inventario_detalle (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  movimiento_id UUID REFERENCES movimientos_inventario_maestro(id) ON DELETE CASCADE,
  articulo_id BIGINT REFERENCES articulos(id),
  cantidad INTEGER NOT NULL,
  precio_unitario DECIMAL(10,2),
  costo_total DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 4. CAJA Y FINANZAS
-- ============================================

CREATE TABLE IF NOT EXISTS recibos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero SERIAL UNIQUE NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  hora TIME DEFAULT CURRENT_TIME,
  precio_bruto DECIMAL(10,2),
  subtotal DECIMAL(10,2),
  descuento DECIMAL(10,2),
  iva DECIMAL(10,2),
  iva_porcentaje DECIMAL(5,2),
  total DECIMAL(10,2),
  efectivo DECIMAL(10,2),
  tarjeta DECIMAL(10,2),
  tarjeta_referencia TEXT,
  monto_recibido DECIMAL(10,2),
  requiere_factura BOOLEAN DEFAULT false,
  rfc_factura VARCHAR(13),
  nombre_factura VARCHAR(200),
  direccion_factura TEXT,
  cancelado BOOLEAN DEFAULT false,
  fecha_cancelacion TIMESTAMP,
  motivo_cancelacion TEXT,
  usuario_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS operaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recibo_id UUID REFERENCES recibos(id) ON DELETE CASCADE,
  operacion TEXT NOT NULL,
  tipo VARCHAR(50),
  credencial VARCHAR(10),
  alumno_id UUID REFERENCES alumnos(id),
  grupo VARCHAR(20),
  cantidad INTEGER DEFAULT 1,
  monto DECIMAL(10,2) NOT NULL,
  descuento DECIMAL(10,2) DEFAULT 0,
  iva DECIMAL(10,2) DEFAULT 0,
  neto DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rfc_clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfc VARCHAR(13) UNIQUE NOT NULL,
  nombre VARCHAR(200) NOT NULL,
  direccion1 VARCHAR(300),
  direccion2 VARCHAR(300),
  email VARCHAR(150),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 5. EXÁMENES
-- ============================================

CREATE TABLE IF NOT EXISTS programacion_examenes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clave_examen VARCHAR(50) NOT NULL,
  fecha DATE NOT NULL,
  hora VARCHAR(10),
  tipo_examen VARCHAR(50),
  salon_id UUID REFERENCES salones(id),
  maestro_base_id UUID REFERENCES maestros(id),
  examinador1_id UUID REFERENCES maestros(id),
  examinador2_id UUID REFERENCES maestros(id),
  alumno_id UUID REFERENCES alumnos(id),
  credencial VARCHAR(20),
  nombre_alumno VARCHAR(200),
  grado_alumno VARCHAR(50),
  recibo_pago VARCHAR(20),
  monto_pago DECIMAL(10,2),
  presento BOOLEAN DEFAULT false,
  aprobo BOOLEAN DEFAULT false,
  certificado VARCHAR(50),
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 6. OTROS
-- ============================================

CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  nombre VARCHAR(200) NOT NULL,
  rol VARCHAR(50) DEFAULT 'usuario',
  acceso_alumnos BOOLEAN DEFAULT false,
  acceso_caja BOOLEAN DEFAULT false,
  acceso_reportes BOOLEAN DEFAULT false,
  acceso_examenes BOOLEAN DEFAULT false,
  acceso_mantenimiento BOOLEAN DEFAULT false,
  acceso_seguridad BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS factores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  maestro_id UUID REFERENCES maestros(id),
  curso_id UUID REFERENCES cursos(id),
  factor INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(maestro_id, curso_id)
);

CREATE TABLE IF NOT EXISTS prospectos (
  id SERIAL PRIMARY KEY,
  fecha_atencion DATE DEFAULT CURRENT_DATE,
  nombre VARCHAR(200) NOT NULL,
  apellidos VARCHAR(200),
  edad INTEGER,
  telefono VARCHAR(20),
  email VARCHAR(150),
  interes_curso_id UUID REFERENCES cursos(id),
  medio_id UUID REFERENCES medios_contacto(id),
  observaciones TEXT,
  seguimiento TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- DATOS INICIALES
INSERT INTO tipos_movimiento (clave, descripcion, afecta_inventario, es_entrada) VALUES
('COM', 'COMPRA', true, true),
('VEN', 'VENTA', true, false),
('AJU+', 'AJUSTE ENTRADA', true, true),
('AJU-', 'AJUSTE SALIDA', true, false),
('INI', 'INVENTARIO INICIAL', true, true)
ON CONFLICT (clave) DO NOTHING;

-- ============================================
-- 7. TRIGGERS Y FUNCIONES DE AUTOMATIZACIÓN
-- ============================================

-- 1. Función para actualizar fecha de modificación (updated_at)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para activar updated_at en las tablas clave
CREATE TRIGGER update_alumnos_mod AFTER UPDATE ON alumnos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_maestros_mod AFTER UPDATE ON maestros FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_articulos_mod AFTER UPDATE ON articulos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_grupos_mod AFTER UPDATE ON grupos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. Automatización de Inventario
CREATE OR REPLACE FUNCTION actualizar_existencia_articulo()
RETURNS TRIGGER AS $$
DECLARE
    v_afecta BOOLEAN;
    v_es_entrada BOOLEAN;
BEGIN
    -- Obtener configuración del tipo de movimiento desde la cabecera
    SELECT tm.afecta_inventario, tm.es_entrada 
    INTO v_afecta, v_es_entrada
    FROM movimientos_inventario_maestro mm
    JOIN tipos_movimiento tm ON mm.tipo_movimiento_id = tm.id
    WHERE mm.id = NEW.movimiento_id;
    
    -- Lógica: Si afecta inventario, sumar o restar según 'es_entrada'
    IF v_afecta THEN
        IF v_es_entrada THEN
            UPDATE articulos SET existencia = existencia + NEW.cantidad, updated_at = NOW() WHERE id = NEW.articulo_id;
        ELSE
            UPDATE articulos SET existencia = GREATEST(0, existencia - NEW.cantidad), updated_at = NOW() WHERE id = NEW.articulo_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_actualizar_existencia
AFTER INSERT ON movimientos_inventario_detalle
FOR EACH ROW EXECUTE FUNCTION actualizar_existencia_articulo();

-- 3. Contador Automático de Alumnos en Grupos
CREATE OR REPLACE FUNCTION actualizar_contador_alumnos()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE grupos SET alumnos_inscritos = alumnos_inscritos + 1 WHERE id = NEW.grupo_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE grupos SET alumnos_inscritos = GREATEST(0, alumnos_inscritos - 1) WHERE id = OLD.grupo_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.grupo_id IS DISTINCT FROM NEW.grupo_id THEN
        -- Si cambia de grupo: restar del viejo, sumar al nuevo
        UPDATE grupos SET alumnos_inscritos = GREATEST(0, alumnos_inscritos - 1) WHERE id = OLD.grupo_id;
        UPDATE grupos SET alumnos_inscritos = alumnos_inscritos + 1 WHERE id = NEW.grupo_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_contador_alumnos
AFTER INSERT OR UPDATE OR DELETE ON alumnos
FOR EACH ROW EXECUTE FUNCTION actualizar_contador_alumnos();

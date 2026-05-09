-- ==============================================================================
-- SCALA DATABASE INITIALIZATION (MEGA SCRIPT V5.0 - TOTAL SYNC)
-- Basado en los requisitos exactos de los archivos .js (Alumnos, Maestros, Cursos)
-- ==============================================================================

-- 0. LIMPIEZA TOTAL
-- ==============================================================================
DROP VIEW IF EXISTS v_seguimiento_pagos CASCADE;
DROP TABLE IF EXISTS alumnos_bajas CASCADE;
DROP TABLE IF EXISTS resultados_examen CASCADE;
DROP TABLE IF EXISTS programacion_examenes CASCADE;
DROP TABLE IF EXISTS colegiaturas CASCADE;
DROP TABLE IF EXISTS recibos_detalle CASCADE;
DROP TABLE IF EXISTS recibos CASCADE;
DROP TABLE IF EXISTS rfc_credenciales CASCADE;
DROP TABLE IF EXISTS rfc_clientes CASCADE;
DROP TABLE IF EXISTS prospectos CASCADE;
DROP TABLE IF EXISTS movimientos_inventario_detalle CASCADE;
DROP TABLE IF EXISTS movimientos_inventario_maestro CASCADE;
DROP TABLE IF EXISTS articulos CASCADE;
DROP TABLE IF EXISTS grupos_articulos CASCADE;
DROP TABLE IF EXISTS alumno_grupos CASCADE;
DROP TABLE IF EXISTS alumnos CASCADE;
DROP TABLE IF EXISTS grupos CASCADE;
DROP TABLE IF EXISTS maestros CASCADE;
DROP TABLE IF EXISTS cursos CASCADE;
DROP TABLE IF EXISTS tipos_movimiento CASCADE;
DROP TABLE IF EXISTS salones CASCADE;
DROP TABLE IF EXISTS medios_contacto CASCADE;
DROP TABLE IF EXISTS instrumentos CASCADE;
DROP TABLE IF EXISTS motivos_baja CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. APARTADO: CATÁLOGOS DE SOPORTE
-- ==============================================================================

CREATE TABLE motivos_baja (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clave VARCHAR(10) UNIQUE NOT NULL,
    descripcion VARCHAR(200) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE instrumentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clave VARCHAR(20) UNIQUE NOT NULL,
    descripcion VARCHAR(200) NOT NULL,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE medios_contacto (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clave VARCHAR(20) UNIQUE NOT NULL,
    descripcion VARCHAR(200) NOT NULL,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE salones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero VARCHAR(10) UNIQUE NOT NULL,
    ubicacion VARCHAR(200),
    cupo INTEGER DEFAULT 10,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE salon_instrumentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salon_numero VARCHAR(10) REFERENCES salones(numero) ON DELETE CASCADE,
    instrumento_clave VARCHAR(20) REFERENCES instrumentos(clave) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(salon_numero, instrumento_clave)
);

CREATE TABLE tipos_movimiento (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clave VARCHAR(10) UNIQUE NOT NULL,
    descripcion VARCHAR(200) NOT NULL,
    afecta_inventario VARCHAR(20) DEFAULT 'NINGUNO', -- SUMA, RESTA, NINGUNO
    activo BOOLEAN DEFAULT true
);

-- 3. APARTADO: ARCHIVOS (SINCRO CON JS)
-- ==============================================================================

CREATE TABLE cursos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    curso VARCHAR(100) UNIQUE NOT NULL,
    clave VARCHAR(20) UNIQUE,
    descripcion TEXT,
    costo DECIMAL(10,2) DEFAULT 0, -- Sincro con cursos.js
    precio_mensual DECIMAL(10,2) DEFAULT 0,
    precio_inscripcion DECIMAL(10,2) DEFAULT 0,
    iva DECIMAL(5,2) DEFAULT 0.16,
    grado VARCHAR(50),
    tipo_examen VARCHAR(100), -- Usado en cursos-alta.js
    curso_siguiente_id UUID REFERENCES cursos(id),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE maestros (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clave VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    direccion TEXT, -- General
    direccion_1 TEXT, -- Sincro con maestros.js
    direccion_2 TEXT, -- Sincro con maestros.js
    telefono VARCHAR(20),
    celular VARCHAR(20),
    email VARCHAR(150),
    rfc VARCHAR(13),
    grado VARCHAR(100),
    detalles_grado TEXT,
    fecha_ingreso DATE,
    forma_pago VARCHAR(50) DEFAULT 'POR ALUMNO', -- Sincro con maestros.js
    observaciones TEXT,
    status VARCHAR(20) DEFAULT 'activo',
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE factores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    maestro_id UUID REFERENCES maestros(id) ON DELETE CASCADE,
    curso_id UUID REFERENCES cursos(id) ON DELETE CASCADE,
    factor DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(maestro_id, curso_id)
);

CREATE TABLE grupos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clave VARCHAR(50) UNIQUE NOT NULL,
    curso_id UUID REFERENCES cursos(id),
    maestro_id UUID REFERENCES maestros(id),
    salon_id VARCHAR(10) REFERENCES salones(numero),
    dia VARCHAR(10),
    hora_entrada TIME,
    hora_salida TIME,
    cupo INTEGER DEFAULT 10,
    alumnos_inscritos INTEGER DEFAULT 0,
    fecha_inicio DATE,
    grado INTEGER DEFAULT 1,
    tipo_pago_maestro VARCHAR(20) DEFAULT 'ALUMNO',
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE alumnos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    credencial INTEGER UNIQUE NOT NULL, -- Serial manual en JS
    dig_ver INTEGER DEFAULT 0,
    nombre VARCHAR(200) NOT NULL,
    apellidos VARCHAR(200),
    direccion1 TEXT,
    direccion2 TEXT,
    celular VARCHAR(20),
    telefono VARCHAR(20),
    email VARCHAR(150),
    fecha_nacimiento DATE,
    fecha_ingreso DATE DEFAULT CURRENT_DATE,
    fecha_baja DATE,
    motivo_baja_id UUID REFERENCES motivos_baja(id),
    edad INTEGER,
    nombre_padre VARCHAR(200),
    telefono_padre VARCHAR(20),
    nombre_madre VARCHAR(200),
    telefono_madre VARCHAR(20),
    grupo_clave VARCHAR(50),
    salon VARCHAR(50),
    beca BOOLEAN DEFAULT false,
    porcentaje_beca DECIMAL(10,2) DEFAULT 0,
    instrumento_clave VARCHAR(50),
    medio_clave VARCHAR(50),
    comentario TEXT,
    grado INTEGER DEFAULT 1,
    activo BOOLEAN DEFAULT true,
    reingreso BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE alumno_grupos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alumno_id UUID REFERENCES alumnos(id),
    grupo_clave VARCHAR(50) REFERENCES grupos(clave),
    credencial_vinculada INTEGER,
    grado INTEGER DEFAULT 1,
    estado VARCHAR(20) DEFAULT 'Activo',
    fecha_inscripcion DATE DEFAULT CURRENT_DATE,
    fecha_baja DATE,
    motivo_baja VARCHAR(100),
    observaciones_baja TEXT,
    observaciones_reingreso TEXT,
    UNIQUE(alumno_id, grupo_clave)
);

-- 4. APARTADO: INVENTARIO Y OTROS
-- ==============================================================================

CREATE TABLE grupos_articulos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grupo VARCHAR(100) UNIQUE NOT NULL, -- Sincro con JS (antes nombre)
    descripcion TEXT,
    activo BOOLEAN DEFAULT true, -- Sincro con JS
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE articulos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clave VARCHAR(50) UNIQUE NOT NULL,
    descripcion VARCHAR(200) NOT NULL,
    grupo VARCHAR(100), -- Sincro con JS (antes grupo_articulo_id)
    grupo_articulo_id UUID REFERENCES grupos_articulos(id),
    precio DECIMAL(10,2) NOT NULL,
    iva DECIMAL(5,2) DEFAULT 0.16,
    stock INTEGER DEFAULT 0,
    minimo INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE movimientos_inventario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero INTEGER NOT NULL,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    hora TIME NOT NULL DEFAULT CURRENT_TIME,
    tipo_id VARCHAR(50), -- Sincro con JS (guarda la clave)
    articulo_id UUID REFERENCES articulos(id),
    cantidad INTEGER NOT NULL,
    precio_unitario DECIMAL(10,2),
    iva_importe DECIMAL(10,2) DEFAULT 0,
    total_linea DECIMAL(10,2),
    total DECIMAL(10,2),
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para stock automático
CREATE OR REPLACE FUNCTION funcion_actualizar_stock()
RETURNS TRIGGER AS $$
DECLARE
    v_afecta VARCHAR(20);
BEGIN
    SELECT afecta_inventario INTO v_afecta FROM tipos_movimiento WHERE clave = NEW.tipo_id;
    IF v_afecta = 'SUMA' THEN
        UPDATE articulos SET stock = COALESCE(stock,0) + NEW.cantidad WHERE id = NEW.articulo_id;
    ELSIF v_afecta = 'RESTA' THEN
        UPDATE articulos SET stock = COALESCE(stock,0) - NEW.cantidad WHERE id = NEW.articulo_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_stock_inventario
AFTER INSERT ON movimientos_inventario
FOR EACH ROW EXECUTE FUNCTION funcion_actualizar_stock();

CREATE TABLE prospectos (
    id SERIAL PRIMARY KEY,
    fecha_atencion DATE NOT NULL DEFAULT CURRENT_DATE,
    nombre VARCHAR(200) NOT NULL,
    telefono VARCHAR(20),
    direccion VARCHAR(300),
    curso_id UUID REFERENCES cursos(id),
    medio_id UUID REFERENCES medios_contacto(id),
    recomienda VARCHAR(200),
    dia_preferente1 VARCHAR(20),
    hora_preferente1 VARCHAR(20),
    se_inscribio VARCHAR(10) DEFAULT 'No',
    sigue_interesado VARCHAR(10) DEFAULT 'Si',
    nota TEXT,
    atendio VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE alumnos_bajas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alumno_id UUID REFERENCES alumnos(id),
    credencial INTEGER,
    nombre VARCHAR(200),
    fecha_ingreso DATE,
    fecha_baja DATE DEFAULT CURRENT_DATE,
    motivo_baja_id UUID REFERENCES motivos_baja(id),
    motivo_descripcion TEXT,
    comentario TEXT,
    reingresado BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. APARTADO: FINANZAS Y EXÁMENES
-- ==============================================================================

CREATE TABLE rfc_clientes (
    rfc VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    direccion VARCHAR(255),
    correo VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE rfc_credenciales (
    id SERIAL PRIMARY KEY,
    rfc VARCHAR(50) REFERENCES rfc_clientes(rfc) ON DELETE CASCADE,
    credencial INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE recibos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero INTEGER UNIQUE NOT NULL,
    fecha DATE DEFAULT CURRENT_DATE,
    total DECIMAL(10,2) NOT NULL,
    total_descuento DECIMAL(10,2) DEFAULT 0,
    efectivo DECIMAL(10,2) DEFAULT 0,
    tarjeta DECIMAL(10,2) DEFAULT 0,
    metodo_pago VARCHAR(50),
    cliente_nombre VARCHAR(200),
    cliente_rfc VARCHAR(50),
    cancelado BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para recibos cancelados (usada en cobros.js)
CREATE TABLE IF NOT EXISTS recibos_cancelados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_id UUID,
    numero INTEGER,
    fecha_recibo TIMESTAMP WITH TIME ZONE,
    cliente_nombre VARCHAR(200),
    total DECIMAL(10,2),
    motivo_cancelacion TEXT,
    fecha_cancelacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE recibos_detalle (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recibo_id UUID REFERENCES recibos(id) ON DELETE CASCADE,
    operacion VARCHAR(200) NOT NULL,
    credencial INTEGER,
    alumno_id UUID REFERENCES alumnos(id),
    cantidad INTEGER DEFAULT 1,
    monto DECIMAL(10,2) NOT NULL,
    descuento DECIMAL(10,2) DEFAULT 0, -- Sincro con alumnos.js
    neto DECIMAL(10,2) NOT NULL,
    grupo VARCHAR(50), -- Sincro con alumnos.js
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE colegiaturas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alumno_id UUID REFERENCES alumnos(id),
    recibo_id UUID REFERENCES recibos(id),
    mes INTEGER NOT NULL,
    anio INTEGER NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    pagado BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(alumno_id, anio, mes)
);

CREATE TABLE programacion_examenes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alumno_id UUID REFERENCES alumnos(id),
    credencial VARCHAR(10),
    clave_examen VARCHAR(50),
    fecha DATE NOT NULL,
    hora TIME,
    maestro_base_id UUID REFERENCES maestros(id),
    examinador1_id UUID REFERENCES maestros(id),
    examinador2_id UUID REFERENCES maestros(id),
    salon_id UUID REFERENCES salones(id),
    grupo_id UUID REFERENCES grupos(id),
    calificacion DECIMAL(5,2),
    aprobado BOOLEAN,
    pagado BOOLEAN DEFAULT false,
    monto DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE resultados_examen (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alumno_id UUID REFERENCES alumnos(id),
    clave_examen VARCHAR(50),
    calificacion DECIMAL(5,2),
    aprobo BOOLEAN,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. SEGURIDAD Y VISTAS
-- ==============================================================================

CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(50) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    rol VARCHAR(50) DEFAULT 'usuario',
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE VIEW v_seguimiento_pagos AS
WITH RECURSIVE meses(n) AS (
    SELECT 0 UNION ALL SELECT n + 1 FROM meses WHERE n < 11
),
alumno_ciclos AS (
    SELECT 
        ag.alumno_id, ag.grupo_clave, a.porcentaje_beca,
        COALESCE(g.fecha_inicio, '2024-01-01'::date) as inicio_grupo,
        COALESCE(c.precio_mensual, 0) as costo_base,
        m.n as n_ciclo,
        (COALESCE(g.fecha_inicio, '2024-01-01'::date) + (m.n || ' months')::interval)::date as inicio_ciclo
    FROM alumno_grupos ag
    JOIN alumnos a ON ag.alumno_id = a.id
    JOIN grupos g ON ag.grupo_clave = g.clave
    LEFT JOIN cursos c ON g.curso_id = c.id
    CROSS JOIN meses m
    WHERE ag.estado = 'Activo'
)
SELECT 
    ac.*,
    EXTRACT(MONTH FROM ac.inicio_ciclo)::INTEGER as mes,
    EXTRACT(YEAR FROM ac.inicio_ciclo)::INTEGER as anio,
    ROUND(ac.costo_base * (1 - COALESCE(ac.porcentaje_beca, 0) / 100.0), 2) as monto_calculado,
    CASE 
        WHEN EXISTS (SELECT 1 FROM colegiaturas col WHERE col.alumno_id = ac.alumno_id AND col.mes = EXTRACT(MONTH FROM ac.inicio_ciclo) AND col.anio = EXTRACT(YEAR FROM ac.inicio_ciclo)) THEN 'pagado'
        WHEN ac.porcentaje_beca >= 100 THEN 'pagado'
        WHEN ac.inicio_ciclo < CURRENT_DATE - interval '5 days' THEN 'deuda'
        ELSE 'futuro'
    END as estatus
FROM alumno_ciclos ac;

CREATE OR REPLACE VIEW v_colegiaturas_pendientes AS
SELECT 
    vsp.alumno_id, a.credencial, a.nombre, vsp.grupo_clave as grupo, c.curso, vsp.mes, vsp.anio, 
    vsp.costo_base as precio_mensual, vsp.monto_calculado as monto_a_pagar
FROM v_seguimiento_pagos vsp
JOIN alumnos a ON vsp.alumno_id = a.id
JOIN grupos g ON vsp.grupo_clave = g.clave
JOIN cursos c ON g.curso_id = c.id
WHERE vsp.estatus = 'deuda';

CREATE OR REPLACE VIEW v_honorarios_maestros AS
SELECT 
    m.id as maestro_id, m.nombre as maestro, c.curso, g.clave as grupo, g.alumnos_inscritos,
    c.precio_mensual as precio_mensual, COALESCE(f.factor, 0) as factor,
    (g.alumnos_inscritos * c.precio_mensual * COALESCE(f.factor, 0) / 100) as honorarios
FROM maestros m
JOIN grupos g ON m.id = g.maestro_id
JOIN cursos c ON g.curso_id = c.id
LEFT JOIN factores f ON m.id = f.maestro_id AND c.id = f.curso_id;

-- 7. TRIGGERS Y POLÍTICAS (RLS GLOBAL)
-- ==============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cursos_modtime BEFORE UPDATE ON cursos FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_maestros_modtime BEFORE UPDATE ON maestros FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_grupos_modtime BEFORE UPDATE ON grupos FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_alumnos_modtime BEFORE UPDATE ON alumnos FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ==============================================================================
-- AUTOMATIZACIÓN DE GRADOS (CURSOS -> GRUPOS -> ALUMNOS)
-- ==============================================================================

CREATE OR REPLACE FUNCTION fn_obtener_grado_curso(p_curso_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_grado_txt TEXT;
BEGIN
    SELECT grado INTO v_grado_txt FROM cursos WHERE id = p_curso_id;
    IF v_grado_txt IS NULL THEN RETURN 1; END IF;

    IF v_grado_txt ILIKE '%PRIM%' THEN RETURN 1;
    ELSIF v_grado_txt ILIKE '%SEG%' THEN RETURN 2;
    ELSIF v_grado_txt ILIKE '%TER%' THEN RETURN 3;
    ELSIF v_grado_txt ILIKE '%CUA%' THEN RETURN 4;
    ELSIF v_grado_txt ILIKE '%QUI%' THEN RETURN 5;
    ELSIF v_grado_txt ILIKE '%SEX%' THEN RETURN 6;
    ELSE
        BEGIN
            RETURN COALESCE(NULLIF(regexp_replace(v_grado_txt, '\D', '', 'g'), '')::INTEGER, 1);
        EXCEPTION WHEN OTHERS THEN RETURN 1; END;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION tr_grupos_auto_grado()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.grado IS NULL OR NEW.grado = 1 THEN
        NEW.grado = fn_obtener_grado_curso(NEW.curso_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_grupos_grado ON grupos;
CREATE TRIGGER trigger_grupos_grado BEFORE INSERT OR UPDATE OF curso_id ON grupos FOR EACH ROW EXECUTE FUNCTION tr_grupos_auto_grado();

CREATE OR REPLACE FUNCTION tr_alumno_grupos_auto_grado()
RETURNS TRIGGER AS $$
BEGIN
    SELECT g.grado INTO NEW.grado FROM grupos g WHERE g.clave = NEW.grupo_clave;
    IF NEW.grado IS NULL THEN NEW.grado = 1; END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_alumno_grupos_grado ON alumno_grupos;
CREATE TRIGGER trigger_alumno_grupos_grado BEFORE INSERT ON alumno_grupos FOR EACH ROW EXECUTE FUNCTION tr_alumno_grupos_auto_grado();

DO $$ 
DECLARE 
    t TEXT;
BEGIN
    FOR t IN (SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('DROP POLICY IF EXISTS "Permitir todo anon" ON public.%I', t);
        EXECUTE format('CREATE POLICY "Permitir todo anon" ON public.%I FOR ALL TO anon USING (true) WITH CHECK (true)', t);
    END LOOP;
END $$;

-- 8. DATOS INICIALES
-- ==============================================================================

INSERT INTO tipos_movimiento (clave, descripcion, tipo) VALUES 
('ENT', 'ENTRADA POR COMPRA', 'ENTRADA'),
('SAL', 'SALIDA POR VENTA', 'SALIDA'),
('AJU', 'AJUSTE DE INVENTARIO', 'AJUSTE');

INSERT INTO motivos_baja (clave, descripcion) VALUES 
('CAC', 'CAMBIO DE CIUDAD'), ('ECO', 'PROBLEMAS ECONÓMICOS'), ('SAL', 'PROBLEMAS DE SALUD');

INSERT INTO medios_contacto (clave, descripcion) VALUES 
('FB', 'FACEBOOK'), ('IG', 'INSTAGRAM'), ('RE', 'RECOMENDACIÓN');

-- ============================================
-- SCALA SYSTEM UPDATE - COMPREHENSIVE SCHEMA
-- ============================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. NEW TABLES

-- Configuration for Teacher Payments
CREATE TABLE IF NOT EXISTS config_pago_maestro (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('ALUMNO', 'HORA')),
    instrumento VARCHAR(100), -- Opcional, para overrides por instrumento
    escalon_1 DECIMAL(10,2) DEFAULT 250.00,
    escalon_2 DECIMAL(10,2) DEFAULT 250.00,
    escalon_3 DECIMAL(10,2) DEFAULT 260.00,
    escalon_4 DECIMAL(10,2) DEFAULT 270.00,
    valor_hora DECIMAL(10,2) DEFAULT 175.00,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attendance Tracking
CREATE TABLE IF NOT EXISTS asistencias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grupo_id UUID REFERENCES grupos(id) ON DELETE CASCADE,
    alumno_id INTEGER REFERENCES alumnos(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    estado VARCHAR(20) DEFAULT 'ASISTENCIA', -- ASISTENCIA, FALTA, RETARDO
    asistio BOOLEAN DEFAULT true, -- Legacy field
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(grupo_id, alumno_id, fecha)
);

-- Teacher Session Tracking (for "Start Class" logic)
CREATE TABLE IF NOT EXISTS sesiones_clase (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grupo_id UUID REFERENCES grupos(id) ON DELETE CASCADE,
    maestro_id INTEGER REFERENCES maestros(id) ON DELETE CASCADE,
    fecha DATE DEFAULT CURRENT_DATE,
    hora_inicio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    hora_fin TIMESTAMP WITH TIME ZONE,
    estatus VARCHAR(20) DEFAULT 'INICIADA', -- INICIADA, FINALIZADA
    UNIQUE(grupo_id, fecha)
);

-- Teacher Payments (Historic)
CREATE TABLE IF NOT EXISTS pagos_maestros (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    maestro_id INTEGER REFERENCES maestros(id),
    periodo_mes INTEGER NOT NULL,
    periodo_anio INTEGER NOT NULL,
    instrumento TEXT,
    horas_o_alumnos NUMERIC DEFAULT 0,
    importe_base NUMERIC DEFAULT 0,
    otros_cargos NUMERIC DEFAULT 0,
    otros_abonos NUMERIC DEFAULT 0,
    subtotal NUMERIC DEFAULT 0,
    iva NUMERIC DEFAULT 0, -- 16%
    retencion_isr NUMERIC DEFAULT 0, -- 10%
    retencion_iva NUMERIC DEFAULT 0, -- 2/3 of IVA
    total NUMERIC DEFAULT 0,
    pago_neto NUMERIC DEFAULT 0,
    notas TEXT,
    generado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    usuario_id UUID -- Quien lo generó
);

-- Others Charges/Credits for Teacher Payments
CREATE TABLE IF NOT EXISTS otros_cargos_abonos_maestro (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pago_maestro_id UUID REFERENCES pagos_maestros(id) ON DELETE CASCADE,
    tipo VARCHAR(10) CHECK (tipo IN ('CARGO', 'ABONO')),
    monto NUMERIC NOT NULL,
    descripcion TEXT,
    fecha DATE DEFAULT CURRENT_DATE
);

-- Shared RFC Registry
CREATE TABLE IF NOT EXISTS rfc_asociados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rfc VARCHAR(13) UNIQUE NOT NULL,
    nombre_contribuyente TEXT NOT NULL,
    email_factura TEXT,
    direccion_factura TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Relation Alumnos <-> RFC
CREATE TABLE IF NOT EXISTS alumnos_rfc (
    alumno_id INTEGER REFERENCES alumnos(id) ON DELETE CASCADE,
    rfc_asociado_id UUID REFERENCES rfc_asociados(id) ON DELETE CASCADE,
    PRIMARY KEY (alumno_id, rfc_asociado_id)
);

-- 3. UPDATES TO EXISTING TABLES

-- Table: grupos
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='grupos' AND column_name='tipo_pago_maestro') THEN
        ALTER TABLE grupos ADD COLUMN tipo_pago_maestro VARCHAR(20) DEFAULT 'ALUMNO';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='grupos' AND column_name='salon_id') THEN
        -- Link to salones table using 'numero' as the primary key reference (confirmed VARCHAR)
        ALTER TABLE grupos ADD COLUMN salon_id VARCHAR(20) REFERENCES salones(numero);
    END IF;
END $$;

-- Table: cursos
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cursos' AND column_name='tipo_pago_maestro_sugerido') THEN
        ALTER TABLE cursos ADD COLUMN tipo_pago_maestro_sugerido VARCHAR(20) DEFAULT 'ALUMNO';
    END IF;
END $$;

-- Table: recibos
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recibos' AND column_name='porcentaje_recargo_tardio') THEN
        ALTER TABLE recibos ADD COLUMN porcentaje_recargo_tardio NUMERIC DEFAULT 10;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recibos' AND column_name='monto_recargo') THEN
        ALTER TABLE recibos ADD COLUMN monto_recargo NUMERIC DEFAULT 0;
    END IF;
END $$;

-- 4. RLS POLICIES (Example for asistencias)
ALTER TABLE asistencias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins and Secretaries can manage attendance" ON asistencias;
CREATE POLICY "Admins and Secretaries can manage attendance" 
ON asistencias FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

ALTER TABLE pagos_maestros ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage teacher payments" ON pagos_maestros;
CREATE POLICY "Admins can manage teacher payments" 
ON pagos_maestros FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 5. INITIAL DATA
INSERT INTO config_pago_maestro (tipo, escalon_1, escalon_2, escalon_3, escalon_4, valor_hora)
VALUES ('ALUMNO', 250, 250, 260, 270, 175)
ON CONFLICT DO NOTHING;

-- Map suggesting payment types to existing instruments/courses (example)
UPDATE cursos SET tipo_pago_maestro_sugerido = 'HORA' WHERE curso ILIKE '%Violín%' OR curso ILIKE '%Canto%' OR curso ILIKE '%Baile%' OR curso ILIKE '%Teatro%' OR curso ILIKE '%Saxofón%';
UPDATE cursos SET tipo_pago_maestro_sugerido = 'ALUMNO' WHERE curso ILIKE '%Guitarra%' OR curso ILIKE '%Bajo%' OR curso ILIKE '%Batería%' OR curso ILIKE '%Piano%' OR curso ILIKE '%Teclado%';

-- 6. FUNCTIONS

-- Function to check for salon overlaps
CREATE OR REPLACE FUNCTION check_salon_overlap()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM grupos
        WHERE id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        AND salon_id = NEW.salon_id
        AND dia = NEW.dia
        AND activo = true
        AND (
            (NEW.hora_entrada::TIME, NEW.hora_salida::TIME) OVERLAPS (hora_entrada::TIME, hora_salida::TIME)
        )
    ) THEN
        RAISE EXCEPTION 'El salón ya está ocupado en ese horario para este día.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for salon overlap
DROP TRIGGER IF EXISTS trigger_salon_overlap ON grupos;
CREATE TRIGGER trigger_salon_overlap
BEFORE INSERT OR UPDATE ON grupos
FOR EACH ROW EXECUTE FUNCTION check_salon_overlap();

-- =====================================================
-- AUTOMATIC ENROLLMENT COUNTER
-- =====================================================

-- Ensure alumnos_inscritos has a valid default
ALTER TABLE grupos ALTER COLUMN alumnos_inscritos SET DEFAULT 0;
UPDATE grupos SET alumnos_inscritos = 0 WHERE alumnos_inscritos IS NULL;

-- Function to update enrollment count
CREATE OR REPLACE FUNCTION update_grupo_alumnos_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE grupos 
        SET alumnos_inscritos = (
            SELECT count(*) 
            FROM alumno_grupos 
            WHERE grupo_clave = NEW.grupo_clave AND estado = 'Activo'
        )
        WHERE clave = NEW.grupo_clave;
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Update for the old group if it changed
        IF (OLD.grupo_clave <> NEW.grupo_clave OR OLD.estado <> NEW.estado) THEN
            UPDATE grupos 
            SET alumnos_inscritos = (
                SELECT count(*) 
                FROM alumno_grupos 
                WHERE grupo_clave = OLD.grupo_clave AND estado = 'Activo'
            )
            WHERE clave = OLD.grupo_clave;
            
            UPDATE grupos 
            SET alumnos_inscritos = (
                SELECT count(*) 
                FROM alumno_grupos 
                WHERE grupo_clave = NEW.grupo_clave AND estado = 'Activo'
            )
            WHERE clave = NEW.grupo_clave;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE grupos 
        SET alumnos_inscritos = (
            SELECT count(*) 
            FROM alumno_grupos 
            WHERE grupo_clave = OLD.grupo_clave AND estado = 'Activo'
        )
        WHERE clave = OLD.grupo_clave;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger on alumno_grupos
DROP TRIGGER IF EXISTS trig_update_grupo_alumnos_count ON alumno_grupos;
CREATE TRIGGER trig_update_grupo_alumnos_count
AFTER INSERT OR UPDATE OR DELETE ON alumno_grupos
FOR EACH ROW EXECUTE FUNCTION update_grupo_alumnos_count();

-- Initial sync
UPDATE grupos g
SET alumnos_inscritos = (
    SELECT count(*) 
    FROM alumno_grupos ag 
    WHERE ag.grupo_clave = g.clave AND ag.estado = 'Activo'
);

-- =====================================================
-- EXPOSED FUNCTIONS FOR APP (RPC Fallbacks)
-- =====================================================

CREATE OR REPLACE FUNCTION increment_grupo_alumnos(p_grupo_clave TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE grupos
    SET alumnos_inscritos = COALESCE(alumnos_inscritos, 0) + 1
    WHERE clave = p_grupo_clave;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_grupo_alumnos(p_grupo_clave TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE grupos
    SET alumnos_inscritos = GREATEST(0, COALESCE(alumnos_inscritos, 0) - 1)
    WHERE clave = p_grupo_clave;
END;
$$ LANGUAGE plpgsql;

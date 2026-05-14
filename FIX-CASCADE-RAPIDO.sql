-- =====================================================
-- FIX RÁPIDO: Desbloquear borrado de organizaciones
-- Ejecutar en el SQL Editor de Supabase
-- =====================================================

-- PASO 1: La tabla que está bloqueando AHORA MISMO
ALTER TABLE alumno_grupos DROP CONSTRAINT IF EXISTS alumno_grupos_alumno_id_fkey;
ALTER TABLE alumno_grupos ADD CONSTRAINT alumno_grupos_alumno_id_fkey 
    FOREIGN KEY (alumno_id) REFERENCES alumnos(id) ON DELETE CASCADE;

-- PASO 2: Otras tablas hijas de alumnos que podrían bloquear después
ALTER TABLE colegiaturas DROP CONSTRAINT IF EXISTS colegiaturas_alumno_id_fkey;
ALTER TABLE colegiaturas ADD CONSTRAINT colegiaturas_alumno_id_fkey 
    FOREIGN KEY (alumno_id) REFERENCES alumnos(id) ON DELETE CASCADE;

ALTER TABLE programacion_examenes DROP CONSTRAINT IF EXISTS programacion_examenes_alumno_id_fkey;
ALTER TABLE programacion_examenes ADD CONSTRAINT programacion_examenes_alumno_id_fkey 
    FOREIGN KEY (alumno_id) REFERENCES alumnos(id) ON DELETE CASCADE;

ALTER TABLE alumnos_bajas DROP CONSTRAINT IF EXISTS alumnos_bajas_alumno_id_fkey;
ALTER TABLE alumnos_bajas ADD CONSTRAINT alumnos_bajas_alumno_id_fkey 
    FOREIGN KEY (alumno_id) REFERENCES alumnos(id) ON DELETE CASCADE;

ALTER TABLE cambios_alumnos DROP CONSTRAINT IF EXISTS cambios_alumnos_alumno_id_fkey;
ALTER TABLE cambios_alumnos ADD CONSTRAINT cambios_alumnos_alumno_id_fkey 
    FOREIGN KEY (alumno_id) REFERENCES alumnos(id) ON DELETE CASCADE;

ALTER TABLE resultados_examen DROP CONSTRAINT IF EXISTS resultados_examen_alumno_id_fkey;
ALTER TABLE resultados_examen ADD CONSTRAINT resultados_examen_alumno_id_fkey 
    FOREIGN KEY (alumno_id) REFERENCES alumnos(id) ON DELETE CASCADE;

-- PASO 3: Tablas hijas de recibos
ALTER TABLE recibos_detalle DROP CONSTRAINT IF EXISTS recibos_detalle_recibo_id_fkey;
ALTER TABLE recibos_detalle ADD CONSTRAINT recibos_detalle_recibo_id_fkey 
    FOREIGN KEY (recibo_id) REFERENCES recibos(id) ON DELETE CASCADE;

ALTER TABLE recibos_detalle DROP CONSTRAINT IF EXISTS recibos_detalle_alumno_id_fkey;
ALTER TABLE recibos_detalle ADD CONSTRAINT recibos_detalle_alumno_id_fkey 
    FOREIGN KEY (alumno_id) REFERENCES alumnos(id) ON DELETE CASCADE;

ALTER TABLE operaciones DROP CONSTRAINT IF EXISTS operaciones_recibo_id_fkey;
ALTER TABLE operaciones ADD CONSTRAINT operaciones_recibo_id_fkey 
    FOREIGN KEY (recibo_id) REFERENCES recibos(id) ON DELETE CASCADE;

ALTER TABLE operaciones DROP CONSTRAINT IF EXISTS operaciones_alumno_id_fkey;
ALTER TABLE operaciones ADD CONSTRAINT operaciones_alumno_id_fkey 
    FOREIGN KEY (alumno_id) REFERENCES alumnos(id) ON DELETE CASCADE;

ALTER TABLE colegiaturas DROP CONSTRAINT IF EXISTS colegiaturas_recibo_id_fkey;
ALTER TABLE colegiaturas ADD CONSTRAINT colegiaturas_recibo_id_fkey 
    FOREIGN KEY (recibo_id) REFERENCES recibos(id) ON DELETE CASCADE;

-- PASO 4: Tablas hijas de maestros y cursos
ALTER TABLE factores DROP CONSTRAINT IF EXISTS factores_maestro_id_fkey;
ALTER TABLE factores ADD CONSTRAINT factores_maestro_id_fkey 
    FOREIGN KEY (maestro_id) REFERENCES maestros(id) ON DELETE CASCADE;

ALTER TABLE factores DROP CONSTRAINT IF EXISTS factores_curso_id_fkey;
ALTER TABLE factores ADD CONSTRAINT factores_curso_id_fkey 
    FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE;

ALTER TABLE grupos DROP CONSTRAINT IF EXISTS grupos_curso_id_fkey;
ALTER TABLE grupos ADD CONSTRAINT grupos_curso_id_fkey 
    FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE;

ALTER TABLE grupos DROP CONSTRAINT IF EXISTS grupos_maestro_id_fkey;
ALTER TABLE grupos ADD CONSTRAINT grupos_maestro_id_fkey 
    FOREIGN KEY (maestro_id) REFERENCES maestros(id) ON DELETE CASCADE;

-- PASO 5: Tablas hijas de artículos
ALTER TABLE movimientos_inventario DROP CONSTRAINT IF EXISTS movimientos_inventario_articulo_id_fkey;
ALTER TABLE movimientos_inventario ADD CONSTRAINT movimientos_inventario_articulo_id_fkey 
    FOREIGN KEY (articulo_id) REFERENCES articulos(id) ON DELETE CASCADE;

-- PASO 6: RFC
ALTER TABLE rfc_credenciales DROP CONSTRAINT IF EXISTS rfc_credenciales_rfc_fkey;
ALTER TABLE rfc_credenciales ADD CONSTRAINT rfc_credenciales_rfc_fkey 
    FOREIGN KEY (rfc) REFERENCES rfc_clientes(rfc) ON DELETE CASCADE;

-- Refrescar caché
NOTIFY pgrst, 'reload schema';

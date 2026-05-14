-- =====================================================
-- FIX: CASCADE DELETE FOR ORGANIZATIONS
-- SCALA System - Borrado completo de organizaciones
-- =====================================================

-- PARTE 1: Relaciones DIRECTAS con organizaciones(id)
-- Estas son las tablas que tienen organizacion_id apuntando a organizaciones

DO $$
DECLARE
    tbl TEXT;
    fk_name TEXT;
    direct_tables TEXT[] := ARRAY[
        'usuarios', 'alumnos', 'maestros', 'grupos', 'cursos',
        'salones', 'prospectos', 'articulos', 'recibos',
        'motivos_baja', 'medios_contacto', 'instrumentos',
        'permisos_seguridad', 'colegiaturas', 'programacion_examenes',
        'asistencias', 'sesiones_clase', 'alumnos_bajas',
        'cambios_alumnos', 'resultados_examen', 'rfc_clientes',
        'grupos_articulos', 'movimientos_inventario', 'factores',
        'recibos_cancelados', 'operaciones', 'recibos_detalle',
        'login_history', 'tipos_movimiento'
    ];
BEGIN
    FOREACH tbl IN ARRAY direct_tables LOOP
        -- Verificar que la tabla existe Y tiene la columna organizacion_id
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = tbl AND column_name = 'organizacion_id' AND table_schema = 'public'
        ) THEN
            -- Buscar y eliminar cualquier FK existente de organizacion_id en esta tabla
            FOR fk_name IN (
                SELECT tc.constraint_name
                FROM information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                WHERE tc.constraint_type = 'FOREIGN KEY' 
                AND kcu.column_name = 'organizacion_id'
                AND tc.table_name = tbl
                AND tc.table_schema = 'public'
            ) LOOP
                EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', tbl, fk_name);
                RAISE NOTICE 'Eliminada FK: %.%', tbl, fk_name;
            END LOOP;

            -- Re-crear con CASCADE
            EXECUTE format(
                'ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (organizacion_id) REFERENCES organizaciones(id) ON DELETE CASCADE',
                tbl, tbl || '_organizacion_id_fkey'
            );
            RAISE NOTICE 'Creada CASCADE FK para: %', tbl;
        END IF;
    END LOOP;
END $$;


-- PARTE 2: Relaciones INDIRECTAS (tablas hijas que dependen de tablas con organizacion_id)
-- Cuando se borra una organización → se borran alumnos → deben borrarse alumno_grupos, colegiaturas, etc.

DO $$
DECLARE
    fk_name TEXT;
BEGIN
    -- alumno_grupos → alumnos(id)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alumno_grupos') THEN
        FOR fk_name IN (
            SELECT tc.constraint_name FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'alumno_grupos' AND kcu.column_name = 'alumno_id' AND tc.constraint_type = 'FOREIGN KEY'
        ) LOOP
            EXECUTE format('ALTER TABLE alumno_grupos DROP CONSTRAINT %I', fk_name);
        END LOOP;
        ALTER TABLE alumno_grupos ADD CONSTRAINT alumno_grupos_alumno_id_fkey 
            FOREIGN KEY (alumno_id) REFERENCES alumnos(id) ON DELETE CASCADE;
        RAISE NOTICE 'CASCADE: alumno_grupos → alumnos';
    END IF;

    -- colegiaturas → alumnos(id)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'colegiaturas') THEN
        FOR fk_name IN (
            SELECT tc.constraint_name FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'colegiaturas' AND kcu.column_name = 'alumno_id' AND tc.constraint_type = 'FOREIGN KEY'
        ) LOOP
            EXECUTE format('ALTER TABLE colegiaturas DROP CONSTRAINT %I', fk_name);
        END LOOP;
        ALTER TABLE colegiaturas ADD CONSTRAINT colegiaturas_alumno_id_fkey 
            FOREIGN KEY (alumno_id) REFERENCES alumnos(id) ON DELETE CASCADE;
        RAISE NOTICE 'CASCADE: colegiaturas → alumnos';
    END IF;

    -- colegiaturas → recibos(id)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'colegiaturas') THEN
        FOR fk_name IN (
            SELECT tc.constraint_name FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'colegiaturas' AND kcu.column_name = 'recibo_id' AND tc.constraint_type = 'FOREIGN KEY'
        ) LOOP
            EXECUTE format('ALTER TABLE colegiaturas DROP CONSTRAINT %I', fk_name);
        END LOOP;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'colegiaturas' AND column_name = 'recibo_id') THEN
            ALTER TABLE colegiaturas ADD CONSTRAINT colegiaturas_recibo_id_fkey 
                FOREIGN KEY (recibo_id) REFERENCES recibos(id) ON DELETE CASCADE;
            RAISE NOTICE 'CASCADE: colegiaturas → recibos';
        END IF;
    END IF;

    -- recibos_detalle → recibos(id)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'recibos_detalle') THEN
        FOR fk_name IN (
            SELECT tc.constraint_name FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'recibos_detalle' AND kcu.column_name = 'recibo_id' AND tc.constraint_type = 'FOREIGN KEY'
        ) LOOP
            EXECUTE format('ALTER TABLE recibos_detalle DROP CONSTRAINT %I', fk_name);
        END LOOP;
        ALTER TABLE recibos_detalle ADD CONSTRAINT recibos_detalle_recibo_id_fkey 
            FOREIGN KEY (recibo_id) REFERENCES recibos(id) ON DELETE CASCADE;
        RAISE NOTICE 'CASCADE: recibos_detalle → recibos';
    END IF;

    -- recibos_detalle → alumnos(id)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'recibos_detalle') THEN
        FOR fk_name IN (
            SELECT tc.constraint_name FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'recibos_detalle' AND kcu.column_name = 'alumno_id' AND tc.constraint_type = 'FOREIGN KEY'
        ) LOOP
            EXECUTE format('ALTER TABLE recibos_detalle DROP CONSTRAINT %I', fk_name);
        END LOOP;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recibos_detalle' AND column_name = 'alumno_id') THEN
            ALTER TABLE recibos_detalle ADD CONSTRAINT recibos_detalle_alumno_id_fkey 
                FOREIGN KEY (alumno_id) REFERENCES alumnos(id) ON DELETE CASCADE;
            RAISE NOTICE 'CASCADE: recibos_detalle → alumnos';
        END IF;
    END IF;

    -- operaciones → recibos(id)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'operaciones') THEN
        FOR fk_name IN (
            SELECT tc.constraint_name FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'operaciones' AND kcu.column_name = 'recibo_id' AND tc.constraint_type = 'FOREIGN KEY'
        ) LOOP
            EXECUTE format('ALTER TABLE operaciones DROP CONSTRAINT %I', fk_name);
        END LOOP;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operaciones' AND column_name = 'recibo_id') THEN
            ALTER TABLE operaciones ADD CONSTRAINT operaciones_recibo_id_fkey 
                FOREIGN KEY (recibo_id) REFERENCES recibos(id) ON DELETE CASCADE;
            RAISE NOTICE 'CASCADE: operaciones → recibos';
        END IF;
    END IF;

    -- operaciones → alumnos(id)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'operaciones') THEN
        FOR fk_name IN (
            SELECT tc.constraint_name FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'operaciones' AND kcu.column_name = 'alumno_id' AND tc.constraint_type = 'FOREIGN KEY'
        ) LOOP
            EXECUTE format('ALTER TABLE operaciones DROP CONSTRAINT %I', fk_name);
        END LOOP;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operaciones' AND column_name = 'alumno_id') THEN
            ALTER TABLE operaciones ADD CONSTRAINT operaciones_alumno_id_fkey 
                FOREIGN KEY (alumno_id) REFERENCES alumnos(id) ON DELETE CASCADE;
            RAISE NOTICE 'CASCADE: operaciones → alumnos';
        END IF;
    END IF;

    -- programacion_examenes → alumnos(id)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'programacion_examenes') THEN
        FOR fk_name IN (
            SELECT tc.constraint_name FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'programacion_examenes' AND kcu.column_name = 'alumno_id' AND tc.constraint_type = 'FOREIGN KEY'
        ) LOOP
            EXECUTE format('ALTER TABLE programacion_examenes DROP CONSTRAINT %I', fk_name);
        END LOOP;
        ALTER TABLE programacion_examenes ADD CONSTRAINT programacion_examenes_alumno_id_fkey 
            FOREIGN KEY (alumno_id) REFERENCES alumnos(id) ON DELETE CASCADE;
        RAISE NOTICE 'CASCADE: programacion_examenes → alumnos';
    END IF;

    -- alumnos_bajas → alumnos(id)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alumnos_bajas') THEN
        FOR fk_name IN (
            SELECT tc.constraint_name FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'alumnos_bajas' AND kcu.column_name = 'alumno_id' AND tc.constraint_type = 'FOREIGN KEY'
        ) LOOP
            EXECUTE format('ALTER TABLE alumnos_bajas DROP CONSTRAINT %I', fk_name);
        END LOOP;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alumnos_bajas' AND column_name = 'alumno_id') THEN
            ALTER TABLE alumnos_bajas ADD CONSTRAINT alumnos_bajas_alumno_id_fkey 
                FOREIGN KEY (alumno_id) REFERENCES alumnos(id) ON DELETE CASCADE;
            RAISE NOTICE 'CASCADE: alumnos_bajas → alumnos';
        END IF;
    END IF;

    -- cambios_alumnos → alumnos(id)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cambios_alumnos') THEN
        FOR fk_name IN (
            SELECT tc.constraint_name FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'cambios_alumnos' AND kcu.column_name = 'alumno_id' AND tc.constraint_type = 'FOREIGN KEY'
        ) LOOP
            EXECUTE format('ALTER TABLE cambios_alumnos DROP CONSTRAINT %I', fk_name);
        END LOOP;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cambios_alumnos' AND column_name = 'alumno_id') THEN
            ALTER TABLE cambios_alumnos ADD CONSTRAINT cambios_alumnos_alumno_id_fkey 
                FOREIGN KEY (alumno_id) REFERENCES alumnos(id) ON DELETE CASCADE;
            RAISE NOTICE 'CASCADE: cambios_alumnos → alumnos';
        END IF;
    END IF;

    -- resultados_examen → alumnos(id)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'resultados_examen') THEN
        FOR fk_name IN (
            SELECT tc.constraint_name FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'resultados_examen' AND kcu.column_name = 'alumno_id' AND tc.constraint_type = 'FOREIGN KEY'
        ) LOOP
            EXECUTE format('ALTER TABLE resultados_examen DROP CONSTRAINT %I', fk_name);
        END LOOP;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resultados_examen' AND column_name = 'alumno_id') THEN
            ALTER TABLE resultados_examen ADD CONSTRAINT resultados_examen_alumno_id_fkey 
                FOREIGN KEY (alumno_id) REFERENCES alumnos(id) ON DELETE CASCADE;
            RAISE NOTICE 'CASCADE: resultados_examen → alumnos';
        END IF;
    END IF;

    -- grupos → cursos(id)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'grupos') THEN
        FOR fk_name IN (
            SELECT tc.constraint_name FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'grupos' AND kcu.column_name = 'curso_id' AND tc.constraint_type = 'FOREIGN KEY'
        ) LOOP
            EXECUTE format('ALTER TABLE grupos DROP CONSTRAINT %I', fk_name);
        END LOOP;
        ALTER TABLE grupos ADD CONSTRAINT grupos_curso_id_fkey 
            FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE;
        RAISE NOTICE 'CASCADE: grupos → cursos';
    END IF;

    -- grupos → maestros(id)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'grupos') THEN
        FOR fk_name IN (
            SELECT tc.constraint_name FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'grupos' AND kcu.column_name = 'maestro_id' AND tc.constraint_type = 'FOREIGN KEY'
        ) LOOP
            EXECUTE format('ALTER TABLE grupos DROP CONSTRAINT %I', fk_name);
        END LOOP;
        ALTER TABLE grupos ADD CONSTRAINT grupos_maestro_id_fkey 
            FOREIGN KEY (maestro_id) REFERENCES maestros(id) ON DELETE CASCADE;
        RAISE NOTICE 'CASCADE: grupos → maestros';
    END IF;

    -- factores → maestros(id)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'factores') THEN
        FOR fk_name IN (
            SELECT tc.constraint_name FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'factores' AND kcu.column_name = 'maestro_id' AND tc.constraint_type = 'FOREIGN KEY'
        ) LOOP
            EXECUTE format('ALTER TABLE factores DROP CONSTRAINT %I', fk_name);
        END LOOP;
        ALTER TABLE factores ADD CONSTRAINT factores_maestro_id_fkey 
            FOREIGN KEY (maestro_id) REFERENCES maestros(id) ON DELETE CASCADE;
        RAISE NOTICE 'CASCADE: factores → maestros';
    END IF;

    -- factores → cursos(id)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'factores') THEN
        FOR fk_name IN (
            SELECT tc.constraint_name FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'factores' AND kcu.column_name = 'curso_id' AND tc.constraint_type = 'FOREIGN KEY'
        ) LOOP
            EXECUTE format('ALTER TABLE factores DROP CONSTRAINT %I', fk_name);
        END LOOP;
        ALTER TABLE factores ADD CONSTRAINT factores_curso_id_fkey 
            FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE;
        RAISE NOTICE 'CASCADE: factores → cursos';
    END IF;

    -- movimientos_inventario → articulos(id)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'movimientos_inventario') THEN
        FOR fk_name IN (
            SELECT tc.constraint_name FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'movimientos_inventario' AND kcu.column_name = 'articulo_id' AND tc.constraint_type = 'FOREIGN KEY'
        ) LOOP
            EXECUTE format('ALTER TABLE movimientos_inventario DROP CONSTRAINT %I', fk_name);
        END LOOP;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'movimientos_inventario' AND column_name = 'articulo_id') THEN
            ALTER TABLE movimientos_inventario ADD CONSTRAINT movimientos_inventario_articulo_id_fkey 
                FOREIGN KEY (articulo_id) REFERENCES articulos(id) ON DELETE CASCADE;
            RAISE NOTICE 'CASCADE: movimientos_inventario → articulos';
        END IF;
    END IF;

    -- rfc_credenciales → rfc_clientes(rfc)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rfc_credenciales') THEN
        FOR fk_name IN (
            SELECT tc.constraint_name FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'rfc_credenciales' AND kcu.column_name = 'rfc' AND tc.constraint_type = 'FOREIGN KEY'
        ) LOOP
            EXECUTE format('ALTER TABLE rfc_credenciales DROP CONSTRAINT %I', fk_name);
        END LOOP;
        ALTER TABLE rfc_credenciales ADD CONSTRAINT rfc_credenciales_rfc_fkey 
            FOREIGN KEY (rfc) REFERENCES rfc_clientes(rfc) ON DELETE CASCADE;
        RAISE NOTICE 'CASCADE: rfc_credenciales → rfc_clientes';
    END IF;

END $$;

-- Refrescar el caché del esquema
NOTIFY pgrst, 'reload schema';

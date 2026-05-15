/**
 * reportes-engine.js - Motor de Consultas para el Sistema de Reportes de Scala
 * Contiene la lógica de extracción de datos para todos los reportes.
 */

const applyStatus = (query, status) => {
    if (status === 'activo') return query.eq('activo', true);
    if (status === 'inactivo') return query.eq('activo', false);
    return query;
};

const ReportEngine = {
    // ==========================================
    // 1. CATEGORÍA: ALUMNOS Y MATRÍCULA
    // ==========================================

    // Listado de Alumnos (Variante 1: Ordenado por nombre, 2: Por credencial, 3: Por curso)
    listado_alumnos: async (db, variante = 1) => {
        let query = SessionManager.applyIsolation(
            db.from('alumnos').select('credencial, nombre, grupo_clave, instrumento_clave, celular')
        ).eq('activo', true);
        
        if (variante === 1) query = query.order('nombre', { ascending: true });
        else if (variante === 2) query = query.order('credencial', { ascending: true });
        else if (variante === 3) query = query.order('grupo_clave', { ascending: true }).order('nombre', { ascending: true });

        const { data, error } = await query;
        if (error) throw error;
        return data.map(d => ({
            CREDENCIAL: d.credencial,
            NOMBRE: d.nombre,
            GRUPO: d.grupo_clave,
            INSTRUMENTO: d.instrumento_clave,
            CELULAR: d.celular
        }));
    },

    // Alumnos Ingresos (Nuevos/Altas)
    alumnos_ingresos: async (db, inicio, fin) => {
        const { data, error } = await SessionManager.applyIsolation(
            db.from('alumnos').select('credencial, nombre, fecha_ingreso, celular, grupo_clave')
        )
            .gte('fecha_ingreso', inicio)
            .lte('fecha_ingreso', fin)
            .order('fecha_ingreso', { ascending: true });
        if (error) throw error;
        return data.map(d => ({
            CREDENCIAL: d.credencial,
            NOMBRE: d.nombre,
            FECHA_INGRESO: d.fecha_ingreso,
            CELULAR: d.celular,
            GRUPO: d.grupo_clave
        }));
    },

    // Alumnos por Instrumento
    alumnos_por_instrumento: async (db) => {
        const { data, error } = await SessionManager.applyIsolation(
            db.from('alumnos').select('credencial, nombre, instrumento_clave, grupo_clave')
        )
            .eq('activo', true)
            .order('instrumento_clave', { ascending: true })
            .order('nombre', { ascending: true });
        if (error) throw error;
        return data.map(d => ({
            CREDENCIAL: d.credencial,
            NOMBRE: d.nombre,
            INSTRUMENTO: d.instrumento_clave,
            GRUPO: d.grupo_clave
        }));
    },

    // Alumnos Baja
    alumnos_baja: async (db, inicio, fin) => {
        const { data: motivos } = await SessionManager.applyIsolation(
            db.from('motivos_baja').select('clave, descripcion')
        );
        const mapaMotivos = {};
        if (motivos) motivos.forEach(m => mapaMotivos[m.clave] = m.descripcion);

        const { data, error } = await SessionManager.applyIsolation(
            db.from('alumnos').select('credencial, nombre, fecha_baja, motivo_baja_id, grupo_clave')
        )
            .eq('activo', false)
            .gte('fecha_baja', inicio)
            .lte('fecha_baja', fin)
            .order('fecha_baja', { ascending: true });
        if (error) throw error;
        
        return data.map(d => ({
            CREDENCIAL: d.credencial,
            NOMBRE: d.nombre,
            FECHA_BAJA: d.fecha_baja,
            MOTIVO: mapaMotivos[d.motivo_baja_id] || d.motivo_baja_id || 'No especificado',
            GRUPO: d.grupo_clave
        }));
    },

    // ==========================================
    // 2. CATEGORÍA: CONTROL ACADÉMICO
    // ==========================================

    // Listas de Asistencia con resumen de faltas/asistencias
    listas_asistencia: async (db, inicio, fin) => {
        // 1. Obtener alumnos activos
        const { data: alumnos, error: errA } = await SessionManager.applyIsolation(
            db.from('alumnos').select('id, credencial, nombre, grupo_clave')
        )
            .eq('activo', true)
            .order('grupo_clave', { ascending: true })
            .order('nombre', { ascending: true });
        
        if (errA) throw errA;

        // 2. Obtener asistencias en el periodo
        const { data: asistencias, error: errAs } = await SessionManager.applyIsolation(
            db.from('asistencias').select('alumno_id, estado')
        )
            .gte('fecha', inicio)
            .lte('fecha', fin);
        
        if (errAs) console.warn('Error cargando asistencias:', errAs);

        // 3. Agrupar asistencias por alumno
        const stats = {};
        if (asistencias) {
            asistencias.forEach(as => {
                if (!stats[as.alumno_id]) stats[as.alumno_id] = { P: 0, F: 0, R: 0, Rep: 0 };
                const est = as.estado?.toUpperCase();
                // Mapeo flexible para cubrir diferentes formas de registrar
                if (est === 'ASISTENCIA' || est === 'PRESENTE' || est === 'P') stats[as.alumno_id].P++;
                else if (est === 'FALTA' || est === 'AUSENTE' || est === 'F') stats[as.alumno_id].F++;
                else if (est === 'RETARDO' || est === 'R') stats[as.alumno_id].R++;
                else if (est === 'REPOSICION' || est === 'REP') stats[as.alumno_id].Rep++;
            });
        }

        return alumnos.map(d => {
            const s = stats[d.id] || { P: 0, F: 0, R: 0, Rep: 0 };
            return {
                CREDENCIAL: d.credencial,
                NOMBRE: d.nombre,
                GRUPO: d.grupo_clave,
                RESUMEN: `P:${s.P} F:${s.F} R:${s.R}${s.Rep > 0 ? ' Rep:' + s.Rep : ''}`
            };
        });
    },

    // Programación de Exámenes
    programacion_examenes: async (db) => {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await SessionManager.applyIsolation(
            db.from('programacion_examenes').select('*')
        )
            .gte('fecha', today)
            .order('fecha', { ascending: true });
        if (error) throw error;
        
        return data.map(d => ({
            ID_EXAMEN: d.id,
            TIPO: d.tipo_examen || 'Desconocido',
            FECHA: d.fecha,
            HORA: d.hora,
            ALUMNO: d.alumno_nombre || d.alumno_id,
            ESTATUS: d.estatus
        }));
    },

    // Alumnos para Nivel Superior (Separando queries por seguridad)
    alumnos_nivel_superior: async (db) => {
        // 1. Obtener exámenes aprobados
        const { data: examenes, error: errE } = await SessionManager.applyIsolation(
            db.from('programacion_examenes').select('alumno_id, calificacion, tipo_examen')
        )
            .gte('calificacion', 60)
            .order('calificacion', { ascending: false });
            
        if (errE) throw errE;
        if (!examenes || examenes.length === 0) return [];

        // 2. Obtener nombres de alumnos
        const idsAlumnos = [...new Set(examenes.map(e => e.alumno_id))];
        const { data: alumnos, error: errA } = await db.from('alumnos').select('id, nombre').in('id', idsAlumnos);
        
        const mapaAlumnos = {};
        if (alumnos) alumnos.forEach(a => mapaAlumnos[a.id] = a.nombre);
        
        return examenes.map(d => ({
            ALUMNO: mapaAlumnos[d.alumno_id] || 'N/A',
            TIPO_EXAMEN: d.tipo_examen,
            CALIFICACION: d.calificacion
        }));
    },

    // ==========================================
    // 3. CATEGORÍA: COBRANZA Y FINANZAS
    // ==========================================

    corte_caja_diario: async (db, fecha, variante = 3) => {
        // 1. Obtener recibos del día (cabecera)
        let queryRecibos = SessionManager.applyIsolation(
            db.from('recibos').select('id, numero, fecha, efectivo, tarjeta, cancelado')
        )
            .eq('fecha', fecha)
            .eq('cancelado', false);
        
        const { data: recibos, error: errR } = await queryRecibos;
        if (errR) throw errR;
        if (!recibos || recibos.length === 0) return [];

        // 2. Obtener operaciones de esos recibos (detalle)
        const idsRecibos = recibos.map(r => r.id);
        const { data: operaciones, error: errO } = await db.from('operaciones')
            .select('recibo_id, operacion, neto, credencial')
            .in('recibo_id', idsRecibos);
        
        if (errO) throw errO;

        // 3. Cruzar datos en JS
        const mapaRecibos = {};
        recibos.forEach(r => mapaRecibos[r.id] = r);

        let finalData = operaciones.map(op => {
            const r = mapaRecibos[op.recibo_id];
            return {
                RECIBO: r.numero,
                FECHA: r.fecha,
                CREDENCIAL: op.credencial,
                DETALLE: op.operacion,
                MONTO: op.neto,
                EFECTIVO: r.efectivo || 0,
                TARJETA: r.tarjeta || 0
            };
        });

        if (variante === 1) finalData = finalData.filter(d => d.EFECTIVO > 0);
        else if (variante === 2) finalData = finalData.filter(d => d.TARJETA > 0);

        return finalData;
    },

    // Análisis de Ingresos
    analisis_ingresos: async (db, inicio, fin) => {
        const { data, error } = await SessionManager.applyIsolation(
            db.from('recibos').select('fecha, total')
        )
            .gte('fecha', inicio)
            .lte('fecha', fin)
            .eq('cancelado', false);
        if (error) throw error;
        
        const meses = {};
        data.forEach(d => {
            const mes = d.fecha.substring(0, 7); 
            if (!meses[mes]) meses[mes] = 0;
            meses[mes] += parseFloat(d.total) || 0;
        });
        
        return Object.keys(meses).sort().map(mes => ({
            MES: mes,
            TOTAL_INGRESOS: meses[mes]
        }));
    },

    // Deudores
    deudores: async (db, mes_corte) => {
        const fechaCorte = new Date(mes_corte + '-01T00:00:00'); 
        
        const { data: alumnos, error: errA } = await SessionManager.applyIsolation(
            db.from('alumnos').select('id, credencial, nombre, fecha_ingreso, grupo_clave')
        )
            .eq('activo', true)
            .not('fecha_ingreso', 'is', null);
        if (errA) throw errA;
        
        const { data: pagos, error: errP } = await SessionManager.applyIsolation(
            db.from('operaciones').select('recibo_id, operacion, recibos!inner(alumno_id, cancelado)')
        )
            .ilike('operacion', '%Colegiatura%')
            .eq('recibos.cancelado', false);
            
        if (errP) throw errP;
        
        const pagosPorAlumno = {};
        if (pagos) {
            pagos.forEach(p => {
                const aId = p.recibos?.alumno_id;
                if (!pagosPorAlumno[aId]) pagosPorAlumno[aId] = 0;
                pagosPorAlumno[aId]++;
            });
        }
        
        const deudoresList = [];
        alumnos.forEach(a => {
            const fIngreso = new Date(a.fecha_ingreso + 'T00:00:00');
            if (fIngreso > fechaCorte) return;
            
            let mesesEsperados = (fechaCorte.getFullYear() - fIngreso.getFullYear()) * 12 + 
                                 (fechaCorte.getMonth() - fIngreso.getMonth()) + 1;
                                 
            if (mesesEsperados < 0) mesesEsperados = 0;
            
            const mesesPagados = pagosPorAlumno[a.id] || 0;
            const mesesDeuda = mesesEsperados - mesesPagados;
            
            if (mesesDeuda > 0) {
                deudoresList.push({
                    CREDENCIAL: a.credencial,
                    NOMBRE: a.nombre,
                    GRUPO: a.grupo_clave,
                    FECHA_INGRESO: a.fecha_ingreso,
                    MESES_DEUDA: mesesDeuda
                });
            }
        });
        
        return deudoresList;
    },

    // Pagos Adelantados
    pagos_adelantados: async (db) => {
        const { data: opData, error: errOp } = await SessionManager.applyIsolation(
            db.from('operaciones').select('operacion, neto, recibos!inner(fecha, cancelado, alumnos(nombre))')
        )
            .ilike('operacion', '%Adelantad%')
            .eq('recibos.cancelado', false);
            
        if (errOp) throw errOp;
        return opData.map(d => ({
            FECHA_PAGO: d.recibos.fecha,
            ALUMNO: d.recibos.alumnos?.nombre,
            CONCEPTO: d.operacion,
            MONTO: parseFloat(d.neto) || 0
        }));
    },

    // ==========================================
    // 4. CATEGORÍA: MAESTROS E INVENTARIOS
    // ==========================================

    reporte_mensual_maestros: async (db) => {
        const { data, error } = await SessionManager.applyIsolation(
            db.from('grupos').select('clave, alumnos_inscritos, maestros(nombre), cursos(curso)')
        )
            .eq('activo', true);
            
        if (error) throw error;
        
        return data.map(d => ({
            MAESTRO: d.maestros?.nombre || 'Sin Asignar',
            GRUPO: d.clave,
            CURSO: d.cursos?.curso,
            ALUMNOS: d.alumnos_inscritos
        })).sort((a,b) => a.MAESTRO.localeCompare(b.MAESTRO));
    },

    // Artículos Vendidos
    articulos_vendidos: async (db, inicio, fin) => {
        const { data, error } = await SessionManager.applyIsolation(
            db.from('operaciones').select('operacion, cantidad, neto, recibos!inner(fecha, cancelado)')
        )
            .gte('recibos.fecha', inicio)
            .lte('recibos.fecha', fin)
            .eq('recibos.cancelado', false)
            .not('operacion', 'ilike', '%Colegiatura%')
            .not('operacion', 'ilike', '%Inscripci%');
            
        if (error) throw error;
        return data.map(d => ({
            FECHA: d.recibos.fecha,
            ARTICULO: d.operacion,
            CANTIDAD: d.cantidad,
            MONTO_VENTA: parseFloat(d.neto)
        }));
    },

    // Stock Crítico (< 5 unidades)
    stock_critico: async (db) => {
        const { data, error } = await SessionManager.applyIsolation(
            db.from('articulos').select('clave, descripcion, stock, precio')
        )
            .lt('stock', 5)
            .order('stock', { ascending: true });
        if (error) throw error;
        
        return data.map(d => ({
            CLAVE: d.clave,
            ARTICULO: d.descripcion,
            EXISTENCIA: d.stock,
            PRECIO: d.precio
        }));
    }
};

window.ReportEngine = ReportEngine;

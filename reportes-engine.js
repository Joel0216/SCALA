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
        let query = SessionManager.applyIsolation(db.from('alumnos').select('credencial, nombre, grupo_clave, instrumento_clave, celular')).eq('activo', true);
        
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
        const { data, error } = await SessionManager.applyIsolation(db.from('alumnos'))
            .select('credencial, nombre, fecha_ingreso, celular, grupo_clave')
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
        const { data, error } = await SessionManager.applyIsolation(db.from('alumnos'))
            .select('credencial, nombre, instrumento_clave, grupo_clave')
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
        // Obtenemos los motivos para mapearlos en memoria, ya que en la tabla alumnos motivo_baja es un VARCHAR
        const { data: motivos } = await SessionManager.applyIsolation(db.from('motivos_baja').select('clave, descripcion'));
        const mapaMotivos = {};
        if (motivos) motivos.forEach(m => mapaMotivos[m.clave] = m.descripcion);

        const { data, error } = await SessionManager.applyIsolation(db.from('alumnos'))
            .select('credencial, nombre, fecha_baja, motivo_baja, grupo_clave')
            .eq('activo', false)
            .gte('fecha_baja', inicio)
            .lte('fecha_baja', fin)
            .order('fecha_baja', { ascending: true });
        if (error) throw error;
        
        return data.map(d => ({
            CREDENCIAL: d.credencial,
            NOMBRE: d.nombre,
            FECHA_BAJA: d.fecha_baja,
            MOTIVO: mapaMotivos[d.motivo_baja] || d.motivo_baja || 'No especificado',
            GRUPO: d.grupo_clave
        }));
    },

    // ==========================================
    // 2. CATEGORÍA: CONTROL ACADÉMICO
    // ==========================================

    // Listas de Asistencia (Agrupado por grupo/salon)
    listas_asistencia: async (db) => {
        // Obtenemos los alumnos activos y los agrupamos por grupo
        const { data, error } = await SessionManager.applyIsolation(db.from('alumnos'))
            .select('credencial, nombre, grupo_clave')
            .eq('activo', true)
            .order('grupo_clave', { ascending: true })
            .order('nombre', { ascending: true });
        if (error) throw error;
        return data.map(d => ({
            CREDENCIAL: d.credencial,
            NOMBRE: d.nombre,
            GRUPO: d.grupo_clave
        }));
    },

    // Programación de Exámenes
    programacion_examenes: async (db) => {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await SessionManager.applyIsolation(db.from('programacion_examenes'))
            .select('*, tipos_examen(tipo)')
            .gte('fecha', today)
            .order('fecha', { ascending: true });
        if (error) throw error;
        
        return data.map(d => ({
            ID_EXAMEN: d.id,
            TIPO: d.tipos_examen?.tipo || 'Desconocido',
            FECHA: d.fecha,
            HORA: d.hora,
            ALUMNO: d.alumno_nombre || d.alumno_id, // Depende del esquema, asumiendo nombre o id
            ESTATUS: d.estatus
        }));
    },

    // Alumnos para Nivel Superior
    alumnos_nivel_superior: async (db) => {
        const { data, error } = await SessionManager.applyIsolation(db.from('programacion_examenes'))
            .select('alumno_id, alumnos(nombre), calificacion, tipo_examen')
            .gte('calificacion', 60)
            .order('calificacion', { ascending: false });
            
        if (error) throw error;
        
        return data.map(d => ({
            ALUMNO: d.alumnos?.nombre,
            TIPO_EXAMEN: d.tipo_examen,
            CALIFICACION: d.calificacion
        }));
    },

    // ==========================================
    // 3. CATEGORÍA: COBRANZA Y FINANZAS
    // ==========================================

    corte_caja_diario: async (db, fecha, variante = 3) => {
        let query = SessionManager.applyIsolation(db.from('recibos').select('numero, fecha, total, efectivo, tarjeta, operaciones(operacion)'))
            .eq('fecha', fecha)
            .eq('cancelado', false);
        
        let { data, error } = await query;
        if (error) throw error;
        
        let filteredData = data;
        if (variante === 1) {
            filteredData = data.filter(d => (parseFloat(d.efectivo) || 0) > 0).map(d => ({
                RECIBO: d.numero, FECHA: d.fecha, EFECTIVO: parseFloat(d.efectivo) || 0
            }));
        } else if (variante === 2) {
            filteredData = data.filter(d => (parseFloat(d.tarjeta) || 0) > 0).map(d => ({
                RECIBO: d.numero, FECHA: d.fecha, TARJETA_TRANSF: (parseFloat(d.tarjeta) || 0)
            }));
        } else {
            filteredData = data.map(d => ({
                RECIBO: d.numero, FECHA: d.fecha, EFECTIVO: parseFloat(d.efectivo) || 0, 
                TARJETA_TRANSF: (parseFloat(d.tarjeta) || 0), 
                TOTAL: parseFloat(d.total) || 0
            }));
        }
        
        return filteredData;
    },

    // Análisis de Ingresos
    analisis_ingresos: async (db, inicio, fin) => {
        const { data, error } = await SessionManager.applyIsolation(db.from('recibos'))
            .select('fecha, total')
            .gte('fecha', inicio)
            .lte('fecha', fin)
            .eq('cancelado', false);
        if (error) throw error;
        
        // Agrupar por mes
        const meses = {};
        data.forEach(d => {
            const mes = d.fecha.substring(0, 7); // YYYY-MM
            if (!meses[mes]) meses[mes] = 0;
            meses[mes] += parseFloat(d.total) || 0;
        });
        
        return Object.keys(meses).sort().map(mes => ({
            MES: mes,
            TOTAL_INGRESOS: meses[mes]
        }));
    },

    // Deudores (Crítico)
    deudores: async (db, mes_corte) => {
        const fechaCorte = new Date(mes_corte + '-01T00:00:00'); // YYYY-MM-01
        
        // 1. Obtener alumnos activos
        const { data: alumnos, error: errA } = await SessionManager.applyIsolation(db.from('alumnos').select('id, nombre, instrumento_clave'))
            .select('id, credencial, nombre, fecha_ingreso, grupo_clave')
            .eq('activo', true)
            .not('fecha_ingreso', 'is', null);
        if (errA) throw errA;
        
        // 2. Obtener colegiaturas pagadas
        const { data: pagos, error: errP } = await SessionManager.applyIsolation(db.from('operaciones').select('*'))
            .select('recibo_id, operacion, recibos!inner(alumno_id, cancelado)')
            .ilike('operacion', '%Colegiatura%')
            .eq('recibos.cancelado', false);
            
        if (errP) throw errP;
        
        // Contar pagos por alumno
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
        const { data: opData, error: errOp } = await SessionManager.applyIsolation(db.from('operaciones').select('*'))
            .select('operacion, neto, recibos!inner(fecha, cancelado, alumnos(nombre))')
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

    // Reporte Mensual de Maestros
    reporte_mensual_maestros: async (db) => {
        // En lugar de v_honorarios_maestros, calculamos desde grupos y factores
        const { data, error } = await SessionManager.applyIsolation(db.from('grupos').select('*'))
            .select('clave, alumnos_inscritos, maestros(nombre), cursos(curso)')
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
        const { data, error } = await SessionManager.applyIsolation(db.from('operaciones').select('*'))
            .select('operacion, cantidad, neto, recibos!inner(fecha, cancelado)')
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
        const { data, error } = await SessionManager.applyIsolation(db.from('articulos').select('*'))
            .select('clave, descripcion, stock, precio')
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

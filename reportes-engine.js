/**
 * reportes-engine.js - Motor de Consultas para el Sistema de Reportes de Scala
 * 
 * COLUMNAS REALES VERIFICADAS:
 *   alumnos: credencial, nombre, grupo_clave, instrumento_clave, celular, activo,
 *            fecha_ingreso, fecha_baja, motivo_baja (VARCHAR texto/clave), grado
 *   asistencias: alumno_id, grupo_id, fecha, estatus ('Asistió'/'Faltó'), observaciones (texto RETARDO/REPOSICIÓN)
 *   programacion_examenes: id, alumno_id, tipo_examen, fecha, hora, calificacion, aprobado
 *   recibos: id, numero, fecha, efectivo, tarjeta, total, cancelado, metodo_pago, organizacion_id
 *   recibos_detalle: recibo_id, operacion, credencial, cantidad, monto, descuento, iva, neto, alumno_id, grupo
 *   grupos: id, clave, curso_id, maestro_id, alumnos_inscritos, activo
 *   articulos: id, clave, descripcion, stock, precio
 *   organizaciones: id, nombre
 * 
 * org_override: null = usar SessionManager (comportamiento normal)
 *               'ALL' = sin filtro de org (SuperAdmin ve todo)
 *               '<uuid>' = filtrar estrictamente por esa organización
 */

const ReportEngine = {

    // Helper interno: aplica filtro de organización según org_override
    // Robusto: si falla el filtro por org (tabla sin columna) devuelve query sin filtro extra
    _applyOrg: function(query, org_override) {
        try {
            if (org_override === 'ALL') {
                // SuperAdmin ve todo — sin filtro adicional
                return query;
            }
            if (org_override && org_override !== 'ALL') {
                // SuperAdmin eligió una org específica
                return query.eq('organizacion_id', org_override);
            }
            // Comportamiento normal: aplicar aislamiento de sesión
            return SessionManager.applyIsolation(query);
        } catch(e) {
            console.warn('_applyOrg falló, retornando query sin filtro:', e.message);
            return query;
        }
    },

    // Helper: agrega columna ORGANIZACIÓN a cada fila cuando org_override === 'ALL'
    _addOrg: function(row, orgNombre, org_override) {
        if (org_override === 'ALL' && orgNombre) {
            return { ORGANIZACIÓN: orgNombre, ...row };
        }
        return row;
    },

    // Carga mapa id->nombre de organizaciones (para etiquetar filas en modo ALL)
    _cargarMapaOrgs: async function(db) {
        try {
            const { data } = await db.from('organizaciones').select('id, nombre');
            const mapa = {};
            if (data) data.forEach(o => mapa[o.id] = o.nombre);
            return mapa;
        } catch(e) {
            return {};
        }
    },

    // ==========================================
    // 1. CATEGORÍA: ALUMNOS Y MATRÍCULA
    // ==========================================

    listado_alumnos: async function(db, variante, org_override) {
        variante = variante || 1;
        org_override = org_override || null;

        const mapaOrgs = org_override === 'ALL' ? await this._cargarMapaOrgs(db) : {};

        let query = this._applyOrg(
            db.from('alumnos').select('credencial, nombre, grupo_clave, instrumento_clave, celular, organizacion_id'),
            org_override
        ).eq('activo', true);

        if (variante === 1) query = query.order('nombre', { ascending: true });
        else if (variante === 2) query = query.order('credencial', { ascending: true });
        else if (variante === 3) query = query.order('grupo_clave', { ascending: true }).order('nombre', { ascending: true });

        const { data, error } = await query;
        if (error) throw error;
        if (!data || data.length === 0) return [];

        return data.map(d => this._addOrg({
            CREDENCIAL: d.credencial,
            NOMBRE: d.nombre,
            GRUPO: d.grupo_clave || '',
            INSTRUMENTO: d.instrumento_clave || '',
            CELULAR: d.celular || ''
        }, mapaOrgs[d.organizacion_id], org_override));
    },

    alumnos_ingresos: async function(db, inicio, fin, org_override) {
        org_override = org_override || null;
        const mapaOrgs = org_override === 'ALL' ? await this._cargarMapaOrgs(db) : {};

        const { data, error } = await this._applyOrg(
            db.from('alumnos').select('credencial, nombre, fecha_ingreso, celular, grupo_clave, organizacion_id'),
            org_override
        ).gte('fecha_ingreso', inicio).lte('fecha_ingreso', fin).order('fecha_ingreso', { ascending: true });

        if (error) throw error;
        if (!data || data.length === 0) return [];

        return data.map(d => this._addOrg({
            CREDENCIAL: d.credencial,
            NOMBRE: d.nombre,
            FECHA_INGRESO: d.fecha_ingreso,
            CELULAR: d.celular || '',
            GRUPO: d.grupo_clave || ''
        }, mapaOrgs[d.organizacion_id], org_override));
    },

    alumnos_por_instrumento: async function(db, org_override) {
        org_override = org_override || null;
        const mapaOrgs = org_override === 'ALL' ? await this._cargarMapaOrgs(db) : {};

        const { data, error } = await this._applyOrg(
            db.from('alumnos').select('credencial, nombre, instrumento_clave, grupo_clave, organizacion_id'),
            org_override
        ).eq('activo', true).order('instrumento_clave', { ascending: true }).order('nombre', { ascending: true });

        if (error) throw error;
        if (!data || data.length === 0) return [];

        return data.map(d => this._addOrg({
            CREDENCIAL: d.credencial,
            NOMBRE: d.nombre,
            INSTRUMENTO: d.instrumento_clave || 'Sin instrumento',
            GRUPO: d.grupo_clave || ''
        }, mapaOrgs[d.organizacion_id], org_override));
    },

    // CORREGIDO: la BD usa motivo_baja_id (UUID FK) → lookup por id en motivos_baja
    alumnos_baja: async function(db, inicio, fin, org_override) {
        org_override = org_override || null;
        const mapaOrgs = org_override === 'ALL' ? await this._cargarMapaOrgs(db) : {};

        // 1. Cargar catálogo de motivos — buscar por 'id' (UUID) → descripcion
        let mapaMotivos = {};
        try {
            const { data: motivos } = await db.from('motivos_baja').select('id, clave, descripcion');
            if (motivos) {
                motivos.forEach(m => {
                    mapaMotivos[m.id] = m.descripcion || m.clave || '';
                    if (m.clave) mapaMotivos[m.clave] = m.descripcion || m.clave || '';
                });
            }
        } catch(e) {
            console.warn('No se pudo cargar catálogo motivos_baja:', e.message);
        }

        // 2. Consultar alumnos dados de baja — columna correcta en producción: motivo_baja_id (UUID)
        const { data, error } = await this._applyOrg(
            db.from('alumnos').select('credencial, nombre, fecha_baja, motivo_baja_id, grupo_clave, organizacion_id'),
            org_override
        ).eq('activo', false).gte('fecha_baja', inicio).lte('fecha_baja', fin).order('fecha_baja', { ascending: true });

        if (error) throw error;
        if (!data || data.length === 0) return [];

        return data.map(d => this._addOrg({
            CREDENCIAL: d.credencial,
            NOMBRE: d.nombre,
            FECHA_BAJA: d.fecha_baja,
            MOTIVO: mapaMotivos[d.motivo_baja_id] || d.motivo_baja_id || 'No especificado',
            GRUPO: d.grupo_clave || ''
        }, mapaOrgs[d.organizacion_id], org_override));
    },

    // ==========================================
    // 2. CATEGORÍA: CONTROL ACADÉMICO
    // ==========================================

    // CORREGIDO: usa estatus ('Asistió'/'Faltó') + observaciones (RETARDO/REPOSICIÓN)
    listas_asistencia: async function(db, inicio, fin, org_override) {
        org_override = org_override || null;
        const mapaOrgs = org_override === 'ALL' ? await this._cargarMapaOrgs(db) : {};

        // 1. Alumnos activos
        const { data: alumnos, error: errA } = await this._applyOrg(
            db.from('alumnos').select('id, credencial, nombre, grupo_clave, organizacion_id'),
            org_override
        ).eq('activo', true).order('grupo_clave', { ascending: true }).order('nombre', { ascending: true });

        if (errA) throw errA;
        if (!alumnos || alumnos.length === 0) return [];

        // 2. Asistencias del periodo — columnas: estatus + observaciones
        let asistencias = [];
        try {
            const { data: asData, error: errAs } = await this._applyOrg(
                db.from('asistencias').select('alumno_id, estatus, observaciones'),
                org_override
            ).gte('fecha', inicio).lte('fecha', fin);

            if (!errAs) asistencias = asData || [];
            else console.warn('Error cargando asistencias:', errAs.message);
        } catch(e) {
            console.warn('Tabla asistencias no disponible:', e.message);
        }

        // 3. Estadísticas por alumno
        const stats = {};
        asistencias.forEach(as => {
            if (!stats[as.alumno_id]) stats[as.alumno_id] = { P: 0, F: 0, R: 0, Rep: 0 };
            const est = (as.estatus || '').trim();
            const obs = (as.observaciones || '').toUpperCase();
            // Clasificar: REPOSICIÓN y RETARDO van en observaciones
            if (obs.includes('REPOSICIÓN') || obs.includes('REPOSICION')) {
                stats[as.alumno_id].Rep++;
            } else if (obs.includes('RETARDO')) {
                stats[as.alumno_id].R++;
            } else if (est === 'Asistió' || est === 'Asistio') {
                stats[as.alumno_id].P++;
            } else if (est === 'Faltó' || est === 'Falto') {
                stats[as.alumno_id].F++;
            }
        });

        return alumnos.map(d => {
            const s = stats[d.id] || { P: 0, F: 0, R: 0, Rep: 0 };
            return this._addOrg({
                CREDENCIAL: d.credencial,
                NOMBRE: d.nombre,
                GRUPO: d.grupo_clave || '',
                PRESENTE: s.P,
                FALTA: s.F,
                RETARDO: s.R,
                REPOSICIÓN: s.Rep,
                RESUMEN: `P:${s.P} F:${s.F} R:${s.R} Rep:${s.Rep}`
            }, mapaOrgs[d.organizacion_id], org_override);
        });
    },

    programacion_examenes: async function(db, org_override) {
        org_override = org_override || null;
        const mapaOrgs = org_override === 'ALL' ? await this._cargarMapaOrgs(db) : {};
        const today = new Date().toISOString().split('T')[0];

        // Intento 1: con organizacion_id
        let examenes = null;
        let usaOrgCol = true;
        try {
            const { data, error } = await this._applyOrg(
                db.from('programacion_examenes').select('id, tipo_examen, fecha, hora, alumno_id, calificacion, aprobado, organizacion_id'),
                org_override
            ).gte('fecha', today).order('fecha', { ascending: true });
            if (error) throw error;
            examenes = data;
        } catch(e) {
            console.warn('programacion_examenes sin org col, reintentando:', e.message);
            usaOrgCol = false;
            // Intento 2: sin organizacion_id
            const { data, error } = await SessionManager.applyIsolation(
                db.from('programacion_examenes').select('id, tipo_examen, fecha, hora, alumno_id, calificacion, aprobado')
            ).gte('fecha', today).order('fecha', { ascending: true });
            if (error) throw error;
            examenes = data;
        }

        if (!examenes || examenes.length === 0) return [];

        const idsAlumnos = [...new Set(examenes.map(e => e.alumno_id).filter(Boolean))];
        let mapaAlumnos = {};
        if (idsAlumnos.length > 0) {
            const { data: alumnos } = await SessionManager.applyIsolation(
                db.from('alumnos').select('id, nombre')
            ).in('id', idsAlumnos);
            if (alumnos) alumnos.forEach(a => mapaAlumnos[a.id] = a.nombre);
        }

        return examenes.map(d => this._addOrg({
            ID_EXAMEN: d.id,
            TIPO: d.tipo_examen || 'General',
            FECHA: d.fecha,
            HORA: d.hora || '',
            ALUMNO: mapaAlumnos[d.alumno_id] || 'N/A',
            CALIFICACION: d.calificacion != null ? d.calificacion : '—',
            APROBADO: d.aprobado === true ? 'Sí' : d.aprobado === false ? 'No' : 'Pendiente'
        }, usaOrgCol ? mapaOrgs[d.organizacion_id] : null, org_override));
    },

    alumnos_nivel_superior: async function(db, org_override) {
        org_override = org_override || null;
        const mapaOrgs = org_override === 'ALL' ? await this._cargarMapaOrgs(db) : {};

        // Intento 1: con organizacion_id
        let examenes = null;
        let usaOrgCol = true;
        try {
            const { data, error } = await this._applyOrg(
                db.from('programacion_examenes').select('alumno_id, calificacion, tipo_examen, organizacion_id'),
                org_override
            ).gte('calificacion', 60).order('calificacion', { ascending: false });
            if (error) throw error;
            examenes = data;
        } catch(e) {
            console.warn('nivel_superior sin org col, reintentando:', e.message);
            usaOrgCol = false;
            const { data, error } = await SessionManager.applyIsolation(
                db.from('programacion_examenes').select('alumno_id, calificacion, tipo_examen')
            ).gte('calificacion', 60).order('calificacion', { ascending: false });
            if (error) throw error;
            examenes = data;
        }

        if (!examenes || examenes.length === 0) return [];

        const idsAlumnos = [...new Set(examenes.map(e => e.alumno_id).filter(Boolean))];
        let mapaAlumnos = {};
        if (idsAlumnos.length > 0) {
            const { data: alumnos } = await SessionManager.applyIsolation(
                db.from('alumnos').select('id, nombre, grupo_clave')
            ).in('id', idsAlumnos);
            if (alumnos) alumnos.forEach(a => mapaAlumnos[a.id] = { nombre: a.nombre, grupo: a.grupo_clave });
        }

        return examenes.map(d => this._addOrg({
            ALUMNO: mapaAlumnos[d.alumno_id]?.nombre || 'N/A',
            GRUPO: mapaAlumnos[d.alumno_id]?.grupo || '',
            TIPO_EXAMEN: d.tipo_examen || '',
            CALIFICACION: d.calificacion
        }, usaOrgCol ? mapaOrgs[d.organizacion_id] : null, org_override));
    },

    // ==========================================
    // 3. CATEGORÍA: COBRANZA Y FINANZAS
    // ==========================================

    corte_caja_diario: async function(db, inicio, fin, variante, org_override) {
        variante = variante || 3;
        org_override = org_override || null;
        const mapaOrgs = org_override === 'ALL' ? await this._cargarMapaOrgs(db) : {};

        const { data: recibos, error: errR } = await this._applyOrg(
            db.from('recibos').select('id, numero, fecha, efectivo, tarjeta, total, cancelado, metodo_pago, organizacion_id'),
            org_override
        ).gte('fecha', inicio).lte('fecha', fin).eq('cancelado', false);

        if (errR) throw errR;
        if (!recibos || recibos.length === 0) return [];

        const idsRecibos = recibos.map(r => r.id);
        const { data: detalles, error: errD } = await SessionManager.applyIsolation(
            db.from('recibos_detalle').select('recibo_id, operacion, neto, credencial, cantidad, monto, grupo')
        ).in('recibo_id', idsRecibos);

        if (errD) throw errD;

        const mapaRecibos = {};
        recibos.forEach(r => mapaRecibos[r.id] = r);

        let finalData = (detalles || []).map(op => {
            const r = mapaRecibos[op.recibo_id] || {};
            return this._addOrg({
                RECIBO: r.numero,
                FECHA: r.fecha,
                CREDENCIAL: op.credencial || '',
                DETALLE: op.operacion,
                GRUPO: op.grupo || '',
                MONTO: parseFloat(op.neto) || 0,
                EFECTIVO: parseFloat(r.efectivo) || 0,
                TARJETA: parseFloat(r.tarjeta) || 0,
                METODO: r.metodo_pago || ''
            }, mapaOrgs[r.organizacion_id], org_override);
        });

        if (variante === 1) finalData = finalData.filter(d => d.EFECTIVO > 0);
        else if (variante === 2) finalData = finalData.filter(d => d.TARJETA > 0);

        return finalData;
    },

    analisis_ingresos: async function(db, inicio, fin, org_override) {
        org_override = org_override || null;
        const mapaOrgs = org_override === 'ALL' ? await this._cargarMapaOrgs(db) : {};

        const { data, error } = await this._applyOrg(
            db.from('recibos').select('fecha, total, organizacion_id'),
            org_override
        ).gte('fecha', inicio).lte('fecha', fin).eq('cancelado', false);

        if (error) throw error;
        if (!data || data.length === 0) return [];

        // Agrupar por mes (y por org si es ALL)
        const meses = {};
        data.forEach(d => {
            const mes = d.fecha.substring(0, 7);
            const orgNombre = mapaOrgs[d.organizacion_id] || '';
            const key = org_override === 'ALL' ? `${mes}|${orgNombre}` : mes;
            if (!meses[key]) meses[key] = { mes, org: orgNombre, total: 0, recibos: 0 };
            meses[key].total += parseFloat(d.total) || 0;
            meses[key].recibos++;
        });

        return Object.keys(meses).sort().map(key => {
            const m = meses[key];
            const row = { MES: m.mes, NUM_RECIBOS: m.recibos, TOTAL_INGRESOS: m.total };
            if (org_override === 'ALL') return { ORGANIZACIÓN: m.org, ...row };
            return row;
        });
    },

    deudores: async function(db, mes_corte, org_override) {
        org_override = org_override || null;
        const mapaOrgs = org_override === 'ALL' ? await this._cargarMapaOrgs(db) : {};
        const fechaCorte = new Date(mes_corte + '-01T00:00:00');

        const { data: alumnos, error: errA } = await this._applyOrg(
            db.from('alumnos').select('id, credencial, nombre, fecha_ingreso, grupo_clave, organizacion_id'),
            org_override
        ).eq('activo', true).not('fecha_ingreso', 'is', null);

        if (errA) throw errA;
        if (!alumnos || alumnos.length === 0) return [];

        let pagosPorAlumno = {};
        try {
            const { data: colegs, error: errC } = await this._applyOrg(
                db.from('colegiaturas').select('alumno_id'), org_override
            );
            if (!errC && colegs) {
                colegs.forEach(c => {
                    if (!pagosPorAlumno[c.alumno_id]) pagosPorAlumno[c.alumno_id] = 0;
                    pagosPorAlumno[c.alumno_id]++;
                });
            }
        } catch(e) {
            console.warn('Tabla colegiaturas no disponible:', e.message);
        }

        const deudoresList = [];
        alumnos.forEach(a => {
            const fIngreso = new Date(a.fecha_ingreso + 'T00:00:00');
            if (fIngreso > fechaCorte) return;

            let mesesEsperados = (fechaCorte.getFullYear() - fIngreso.getFullYear()) * 12
                + (fechaCorte.getMonth() - fIngreso.getMonth()) + 1;
            if (mesesEsperados < 0) mesesEsperados = 0;

            const mesesPagados = pagosPorAlumno[a.id] || 0;
            const mesesDeuda = mesesEsperados - mesesPagados;

            if (mesesDeuda > 0) {
                deudoresList.push(this._addOrg({
                    CREDENCIAL: a.credencial,
                    NOMBRE: a.nombre,
                    GRUPO: a.grupo_clave || '',
                    FECHA_INGRESO: a.fecha_ingreso,
                    MESES_ESPERADOS: mesesEsperados,
                    MESES_PAGADOS: mesesPagados,
                    MESES_DEUDA: mesesDeuda
                }, mapaOrgs[a.organizacion_id], org_override));
            }
        });

        return deudoresList;
    },

    pagos_adelantados: async function(db, org_override) {
        org_override = org_override || null;
        const mapaOrgs = org_override === 'ALL' ? await this._cargarMapaOrgs(db) : {};

        const { data: detalles, error: errD } = await this._applyOrg(
            db.from('recibos_detalle').select('recibo_id, operacion, neto, credencial, alumno_id'),
            org_override
        ).ilike('operacion', '%Adelantad%');

        if (errD) throw errD;
        if (!detalles || detalles.length === 0) return [];

        const idsRecibos = [...new Set(detalles.map(d => d.recibo_id).filter(Boolean))];
        let mapaRecibos = {};
        if (idsRecibos.length > 0) {
            const { data: recibos } = await this._applyOrg(
                db.from('recibos').select('id, fecha, cancelado, organizacion_id'), org_override
            ).in('id', idsRecibos);
            if (recibos) recibos.filter(r => !r.cancelado).forEach(r => mapaRecibos[r.id] = r);
        }

        const idsAlumnos = [...new Set(detalles.map(d => d.alumno_id).filter(Boolean))];
        let mapaAlumnos = {};
        if (idsAlumnos.length > 0) {
            const { data: alumnos } = await this._applyOrg(
                db.from('alumnos').select('id, nombre'), org_override
            ).in('id', idsAlumnos);
            if (alumnos) alumnos.forEach(a => mapaAlumnos[a.id] = a.nombre);
        }

        return detalles
            .filter(d => mapaRecibos[d.recibo_id])
            .map(d => {
                const r = mapaRecibos[d.recibo_id];
                return this._addOrg({
                    FECHA_PAGO: r?.fecha || '',
                    CREDENCIAL: d.credencial || '',
                    ALUMNO: mapaAlumnos[d.alumno_id] || 'N/A',
                    CONCEPTO: d.operacion,
                    MONTO: parseFloat(d.neto) || 0
                }, mapaOrgs[r?.organizacion_id], org_override);
            });
    },

    // ==========================================
    // 4. CATEGORÍA: MAESTROS E INVENTARIOS
    // ==========================================

    reporte_mensual_maestros: async function(db, org_override) {
        org_override = org_override || null;
        const mapaOrgs = org_override === 'ALL' ? await this._cargarMapaOrgs(db) : {};

        const { data: grupos, error: errG } = await this._applyOrg(
            db.from('grupos').select('id, clave, alumnos_inscritos, maestro_id, curso_id, organizacion_id'),
            org_override
        ).eq('activo', true);

        if (errG) throw errG;
        if (!grupos || grupos.length === 0) return [];

        const idsMaestros = [...new Set(grupos.map(g => g.maestro_id).filter(Boolean))];
        let mapaMaestros = {};
        if (idsMaestros.length > 0) {
            const { data: maestros } = await this._applyOrg(
                db.from('maestros').select('id, nombre'), org_override
            ).in('id', idsMaestros);
            if (maestros) maestros.forEach(m => mapaMaestros[m.id] = m.nombre);
        }

        const idsCursos = [...new Set(grupos.map(g => g.curso_id).filter(Boolean))];
        let mapaCursos = {};
        if (idsCursos.length > 0) {
            // CORREGIDO: intentar columna 'curso', fallback a 'nombre'
            const { data: cursos } = await this._applyOrg(
                db.from('cursos').select('id, curso, nombre'), org_override
            ).in('id', idsCursos);
            if (cursos) cursos.forEach(c => mapaCursos[c.id] = c.curso || c.nombre || '');
        }

        return grupos.map(d => this._addOrg({
            MAESTRO: mapaMaestros[d.maestro_id] || 'Sin Asignar',
            GRUPO: d.clave,
            CURSO: mapaCursos[d.curso_id] || '',
            ALUMNOS: d.alumnos_inscritos || 0
        }, mapaOrgs[d.organizacion_id], org_override))
            .sort((a, b) => a.MAESTRO.localeCompare(b.MAESTRO));
    },

    articulos_vendidos: async function(db, inicio, fin, org_override) {
        org_override = org_override || null;
        const mapaOrgs = org_override === 'ALL' ? await this._cargarMapaOrgs(db) : {};

        const { data: recibos, error: errR } = await this._applyOrg(
            db.from('recibos').select('id, fecha, organizacion_id'),
            org_override
        ).gte('fecha', inicio).lte('fecha', fin).eq('cancelado', false);

        if (errR) throw errR;
        if (!recibos || recibos.length === 0) return [];

        const idsRecibos = recibos.map(r => r.id);
        const mapaRecibos = {};
        recibos.forEach(r => mapaRecibos[r.id] = r);

        const { data: detalles, error: errD } = await SessionManager.applyIsolation(
            db.from('recibos_detalle').select('recibo_id, operacion, cantidad, neto')
        ).in('recibo_id', idsRecibos);

        if (errD) throw errD;

        return (detalles || [])
            .filter(d => {
                const op = (d.operacion || '').toUpperCase();
                return !op.includes('COLEGIATURA') && !op.includes('INSCRIPCI');
            })
            .map(d => {
                const r = mapaRecibos[d.recibo_id] || {};
                return this._addOrg({
                    FECHA: r.fecha || '',
                    ARTICULO: d.operacion,
                    CANTIDAD: d.cantidad || 1,
                    MONTO_VENTA: parseFloat(d.neto) || 0
                }, mapaOrgs[r.organizacion_id], org_override);
            });
    },

    stock_critico: async function(db, org_override) {
        org_override = org_override || null;
        const mapaOrgs = org_override === 'ALL' ? await this._cargarMapaOrgs(db) : {};

        const { data, error } = await this._applyOrg(
            db.from('articulos').select('clave, descripcion, stock, precio, organizacion_id'),
            org_override
        ).lt('stock', 5).order('stock', { ascending: true });

        if (error) throw error;
        if (!data || data.length === 0) return [];

        return data.map(d => this._addOrg({
            CLAVE: d.clave,
            ARTICULO: d.descripcion,
            EXISTENCIA: d.stock,
            PRECIO: d.precio
        }, mapaOrgs[d.organizacion_id], org_override));
    }
};

window.ReportEngine = ReportEngine;

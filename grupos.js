/**
 * grupos.js - Módulo de Grupos (Versión Final Corregida)
 * Optimizada para Electron con Supabase y Ventanas Emergentes
 */

// NOTA: NO declarar 'let supabase' o 'const supabase' aquí para evitar SyntaxError.
// Se asume que supabase-config.js provee window.supabase

var g_cursos = [];
var g_maestros = [];
var g_salones = [];
var g_grupos = [];
var g_grupoActual = null;
var g_moduloInicializado = false;

// Variables para paginación en búsqueda
var g_paginaActual = 1;
var g_totalPaginas = 1;
var g_totalResultados = 0;
var g_terminoBusqueda = '';
var g_resultadosBusqueda = [];

document.addEventListener('DOMContentLoaded', async function () {
    console.log('Grupos.js: Cargando...');

    // Iniciar con todo en blanco
    limpiarFormularioPrincipal();

    try {
        if (typeof waitForSupabase === 'function') {
            await waitForSupabase(10000);
        }
        await inicializarModulo();
    } catch (err) {
        console.error('Error inicializando módulo de grupos:', err);
        // Intentar inicializar de todas formas si existe window.supabase
        if (window.supabase) inicializarModulo();
    }

    // Reloj
    setInterval(function () {
        const el = document.getElementById('datetime');
        if (el) el.textContent = new Date().toLocaleString('es-MX');
    }, 1000);
});

function limpiarFormularioPrincipal() {
    const ids = ['clave', 'curso', 'cursoDisplay', 'dia', 'maestro', 'maestroDisplay', 'horaEntrada', 'horaSalida', 'salon', 'cupo', 'alumnos', 'inicio', 'leccion', 'fechaLeccion'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (el.tagName === 'SELECT') {
                if (id === 'dia') el.value = 'LU';
                else el.value = '';
            }
            else if (id === 'cupo') el.value = '0';
            else if (id === 'alumnos') el.value = '0';
            else el.value = '';
        }
    });

    const asistBtn = document.getElementById('asistenciaBtn');
    if (asistBtn) asistBtn.disabled = true;

    g_grupoActual = null;
}

async function inicializarModulo() {
    if (g_moduloInicializado) return;
    g_moduloInicializado = true;

    try {
        await cargarCatalogos();
        await cargarGrupos();
        configurarListenersClave();
        console.log('Grupos.js: Inicializado correctamente.');
    } catch (e) {
        console.error('Error:', e);
    }
}

async function cargarCatalogos() {
    const client = window.supabase || (typeof getSupabase === 'function' ? getSupabase() : null);
    if (!client) return;

    let resC = { data: [] }, resM = { data: [] };
    try { resC = await client.from('cursos').select().order('curso'); } catch (e) { console.warn('Cursos:', e); }
    try { resM = await client.from('maestros').select().order('nombre'); } catch (e) { console.warn('Maestros:', e); }

    if (resC.data) {
        g_cursos = resC.data;
        llenarSelect('curso', g_cursos, 'id', 'curso');
        llenarSelect('editCurso', g_cursos, 'id', 'curso'); // Fill edit select
    }
    if (resM.data) {
        g_maestros = resM.data;
        llenarSelect('maestro', g_maestros, 'id', 'nombre');
        llenarSelect('editMaestro', g_maestros, 'id', 'nombre'); // Fill edit select
    }
}

function llenarSelect(id, data, valKey, textKey) {
    const select = document.getElementById(id);
    if (!select) return;
    select.innerHTML = '<option value="">-- Seleccione --</option>';
    data.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item[valKey];
        opt.textContent = (textKey === 'numero' ? 'Salón ' : '') + item[textKey];
        select.appendChild(opt);
    });
}

async function cargarGrupos() {
    const client = window.supabase || (typeof getSupabase === 'function' ? getSupabase() : null);
    if (!client) return;
    const { data, error } = await client.from('grupos').select('*, maestros(nombre), cursos(curso, clave, grado)').order('clave', { ascending: true });
    if (error) {
        console.error('Error cargando grupos:', error);
        return;
    }
    if (data) g_grupos = data;
}

// --- FUNCIONES GLOBALES ---

window.mostrarGrupo = function (grupo) {
    if (!grupo) return;
    g_grupoActual = grupo;

    const setV = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };

    setV('clave', grupo.clave);
    setV('curso', grupo.curso_id || grupo.cursoId);
    setV('dia', grupo.dia || 'LU');
    setV('maestro', grupo.maestro_id || grupo.maestroId);
    setV('horaEntrada', grupo.hora_entrada);
    setV('horaSalida', grupo.hora_salida);
    setV('salon', grupo.salon_id || grupo.salon);
    setV('cupo', grupo.cupo);
    setV('alumnos', grupo.alumnos_inscritos || 0);
    setV('inicio', grupo.fecha_inicio);
    setV('leccion', grupo.leccion || 'Null');
    setV('fechaLeccion', grupo.fecha_leccion);
    setV('grado', grupo.grado || 1);
    
    const asistBtn = document.getElementById('asistenciaBtn');
    if (asistBtn) asistBtn.disabled = false;

    // Llenar los display de Curso y Maestro
    const idCurso = grupo.curso_id || grupo.cursoId;
    const curso = g_cursos.find(c => c.id == idCurso);
    setV('cursoDisplay', curso ? curso.curso : (grupo.cursos?.curso || ''));

    const idMaestro = grupo.maestro_id || grupo.maestroId;
    const maestro = g_maestros.find(m => m.id == idMaestro);
    setV('maestroDisplay', maestro ? maestro.nombre : (grupo.maestros?.nombre || ''));

    console.log('Grupo cargado:', grupo.clave, '| ID:', grupo.id, '| tipo ID:', typeof grupo.id);

    // Refrescar contador de inscritos en vivo
    refrescarContadorAlumnos(grupo.clave);
};

async function refrescarContadorAlumnos(clave) {
    const client = window.supabase || (typeof getSupabase === 'function' ? getSupabase() : null);
    if (!client || !clave) return;

    try {
        // CORRECCIÓN: Contar desde alumno_grupos con estado 'Activo'
        const { count, error } = await client
            .from('alumno_grupos')
            .select('*', { count: 'exact', head: true })
            .eq('grupo_clave', clave)
            .eq('estado', 'Activo');

        if (!error && count !== null) {
            const el = document.getElementById('alumnos');
            if (el) el.value = count;

            // Sincronizar en tabla grupos si hay diferencia
            if (g_grupoActual && g_grupoActual.clave === clave && g_grupoActual.alumnos_inscritos !== count) {
                await client.from('grupos').update({ alumnos_inscritos: count }).eq('clave', clave);
                g_grupoActual.alumnos_inscritos = count;
            }
        }
    } catch (e) {
        console.warn('Error refrescando contador:', e);
    }
}

window.abrirModalBusqueda = function () {
    // Abrir el listado en ventana externa
    window.open('grupos-listado.html', 'ListadoGrupos', 'width=1150,height=750,resizable=yes');
};

window.cerrarModalBusqueda = function () { };
window.cerrarModalResultados = function () { };

window.buscarGrupos = async function () {
    const client = window.supabase || (typeof getSupabase === 'function' ? getSupabase() : null);
    if (!client) return;

    const termino = document.getElementById('searchInput').value.trim();
    if (!termino) return alert('Ingrese un término de búsqueda.');

    g_terminoBusqueda = termino;
    g_paginaActual = 1;

    await cargarResultadosBusqueda();
};

async function cargarResultadosBusqueda() {
    const client = window.supabase || (typeof getSupabase === 'function' ? getSupabase() : null);
    if (!client) return;

    const termino = g_terminoBusqueda;
    const pagina = g_paginaActual;
    const limite = 100;
    const desde = (pagina - 1) * limite;

    // Mostrar loader
    const body = document.getElementById('bodyResultados');
    body.innerHTML = '<tr><td colspan="7" style="text-align:center;">Buscando...</td></tr>';
    document.getElementById('modalResultados').style.display = 'block';

    try {
        // Primero obtener el total de resultados
        let countRes = await client.from('grupos')
            .select('*', { count: 'exact', head: true })
            .eq('activo', true)
            .or(`clave.ilike.%${termino}%,maestros.nombre.ilike.%${termino}%`);

        if (countRes.error) {
            // Fallback sin maestro
            countRes = await client.from('grupos')
                .select('*', { count: 'exact', head: true })
                .eq('activo', true)
                .ilike('clave', `%${termino}%`);
        }

        if (countRes.error) throw countRes.error;

        g_totalResultados = countRes.count || 0;
        g_totalPaginas = Math.ceil(g_totalResultados / limite);

        // Ahora obtener los datos paginados
        let res = await client.from('grupos')
            .select('*, maestros!inner(nombre), cursos(curso)')
            .eq('activo', true)
            .or(`clave.ilike.%${termino}%,maestros.nombre.ilike.%${termino}%`)
            .range(desde, desde + limite - 1)
            .order('clave', { ascending: true });

        let data = res.data;
        let error = res.error;

        if (error) {
            // Fallback
            const res2 = await client.from('grupos')
                .select('*, maestros(nombre), cursos(curso)')
                .eq('activo', true)
                .ilike('clave', `%${termino}%`)
                .range(desde, desde + limite - 1)
                .order('clave', { ascending: true });
            data = res2.data;
            error = res2.error;
        }

        if (error) throw error;

        body.innerHTML = '';
        if (!data || data.length === 0) {
            body.innerHTML = '<tr><td colspan="7" style="text-align:center;">No se encontraron grupos registrados.</td></tr>';
            actualizarControlesPaginacion();
            return;
        }

        g_resultadosBusqueda = data;

        data.forEach(g => {
            const tr = document.createElement('tr');
            tr.style.cursor = 'pointer';
            tr.innerHTML = `
                <td>${g.clave || ''}</td>
                <td>${g.cursos?.curso || ''}</td>
                <td style="text-align:center; font-weight:bold;">${g.grado || 1}</td>
                <td>${g.maestros?.nombre || ''}</td>
                <td>${g.dia || ''}</td>
                <td>${g.hora_entrada || ''}</td>
                <td>${g.salon_id || ''}</td>
                <td>${g.cupo || 0}</td>
            `;
            tr.onclick = () => {
                window.seleccionarGrupoInterno(g);
            };
            body.appendChild(tr);
        });

        actualizarControlesPaginacion();

    } catch (e) {
        console.error('Error en búsqueda:', e);
        body.innerHTML = `<tr><td colspan="7" style="text-align:center; color:red;">Error: ${e.message}</td></tr>`;
    }
}

function actualizarControlesPaginacion() {
    const controles = document.getElementById('paginacionControles');
    const info = document.getElementById('infoPagina');

    if (g_totalPaginas <= 1) {
        controles.style.display = 'none';
        return;
    }

    controles.style.display = 'flex';
    info.textContent = `Página ${g_paginaActual} de ${g_totalPaginas}`;

    // Habilitar/deshabilitar botones
    document.querySelector('button[onclick="irPrimeraPagina()"]').disabled = g_paginaActual === 1;
    document.querySelector('button[onclick="irPaginaAnterior()"]').disabled = g_paginaActual === 1;
    document.querySelector('button[onclick="irPaginaSiguiente()"]').disabled = g_paginaActual === g_totalPaginas;
    document.querySelector('button[onclick="irUltimaPagina()"]').disabled = g_paginaActual === g_totalPaginas;
}

function irPrimeraPagina() {
    if (g_paginaActual > 1) {
        g_paginaActual = 1;
        cargarResultadosBusqueda();
    }
}

function irPaginaAnterior() {
    if (g_paginaActual > 1) {
        g_paginaActual--;
        cargarResultadosBusqueda();
    }
}

function irPaginaSiguiente() {
    if (g_paginaActual < g_totalPaginas) {
        g_paginaActual++;
        cargarResultadosBusqueda();
    }
}

function irUltimaPagina() {
    if (g_paginaActual < g_totalPaginas) {
        g_paginaActual = g_totalPaginas;
        cargarResultadosBusqueda();
    }
}

window.seleccionarGrupoInterno = function (grupo) {
    if (g_contextoSeleccion === 'destino_borrado') {
        document.getElementById('borradoGrupoDestinoClave').value = grupo.clave;
        window.g_grupoDestinoBorrado = grupo;
        window.cerrarModalBusqueda();
        window.cerrarModalResultados();
        g_contextoSeleccion = 'main'; // reset
        return;
    }
    if (g_contextoSeleccion.startsWith('destino_borrado_alumno_')) {
        const inscripcionId = g_contextoSeleccion.split('_').pop();
        document.getElementById(`destino_alumno_${inscripcionId}`).value = grupo.clave;
        document.querySelector(`input[name="accion_borrado_${inscripcionId}"][value="cambio"]`).checked = true;
        
        if (!window.g_destinosAlumnosBorrado) window.g_destinosAlumnosBorrado = {};
        window.g_destinosAlumnosBorrado[inscripcionId] = grupo;
        
        window.cerrarModalBusqueda();
        window.cerrarModalResultados();
        g_contextoSeleccion = 'main'; // reset
        return;
    }

    window.mostrarGrupo(grupo);
    window.cerrarModalBusqueda();
    window.cerrarModalResultados();
};

window.abrirListado = function () {
    if (!g_grupoActual || !g_grupoActual.clave) return alert('Cargue un grupo primero.');
    const w = 900; const h = 700;
    const l = (screen.width - w) / 2;
    const t = (screen.height - h) / 2;
    window.open(`anexo-b.html?clave=${g_grupoActual.clave}`, 'AnexoB', `width=${w},height=${h},left=${l},top=${t},resizable=yes,scrollbars=yes`);
};

window.borrarGrupo = async function () {
    if (!g_grupoActual) return alert('Debe cargar un grupo.');
    
    const client = window.supabase || (typeof getSupabase === 'function' ? getSupabase() : null);
    if (!client) return;

    try {
        const { data: alumnosActivos, error } = await client
            .from('alumno_grupos')
            .select('id, alumno_id, credencial_vinculada, alumnos(nombre)')
            .eq('grupo_clave', g_grupoActual.clave)
            .eq('estado', 'Activo');

        if (error) throw error;

        if (alumnosActivos && alumnosActivos.length > 0) {
            window.g_alumnosBorrado = alumnosActivos;
            window.g_destinosAlumnosBorrado = {};
            document.getElementById('textoOpcionesBorrado').textContent = `Este grupo tiene ${alumnosActivos.length} alumno(s) inscrito(s) activo(s). ¿Qué desea hacer con ellos antes de eliminar el grupo?`;
            
            // Generar tabla de estudiantes
            const tbody = document.getElementById('divEstudiantesBorrado');
            let html = '';
            alumnosActivos.forEach((a) => {
                const nombreStr = a.alumnos ? a.alumnos.nombre : 'Alumno ' + a.alumno_id;
                html += `
                    <tr>
                        <td style="padding: 5px; width: 40%; font-size: 11px;">${nombreStr}</td>
                        <td style="padding: 5px; width: 40%;">
                            <label style="display:flex; align-items:center; gap:5px;">
                                <input type="radio" name="accion_borrado_${a.id}" value="cambio">
                                <input type="text" id="destino_alumno_${a.id}" readonly style="width: 120px;" placeholder="Buscar...">
                                <button type="button" onclick="abrirSelectorGrupoDestinoAlumno('${a.id}')" style="padding: 2px 5px; cursor: pointer;">🔍</button>
                            </label>
                        </td>
                        <td style="padding: 5px; width: 20%;">
                            <label style="display:flex; align-items:center; gap:5px;">
                                <input type="radio" name="accion_borrado_${a.id}" value="baja" checked> Baja
                            </label>
                        </td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;

            document.getElementById('modalOpcionesBorrado').style.display = 'block';
        } else {
            document.getElementById('modalBorrar').style.display = 'block';
        }
    } catch (e) {
        console.error('Error verificando alumnos:', e);
        document.getElementById('modalBorrar').style.display = 'block';
    }
};

window.activarEdicion = function () {
    if (!g_grupoActual) return alert('Cargue un grupo.');
    document.getElementById('editClave').value = g_grupoActual.clave;
    document.getElementById('editCurso').value = g_grupoActual.curso_id;
    document.getElementById('editMaestro').value = g_grupoActual.maestro_id;
    document.getElementById('editDia').value = g_grupoActual.dia;
    document.getElementById('editHoraEntrada').value = g_grupoActual.hora_entrada;
    document.getElementById('editHoraSalida').value = g_grupoActual.hora_salida;
    document.getElementById('editInicio').value = g_grupoActual.inicio || g_grupoActual.fecha_inicio;
    document.getElementById('editSalon').value = g_grupoActual.salon_id || g_grupoActual.salon || '';
    document.getElementById('editSalonSearch').value = g_grupoActual.salon_id || g_grupoActual.salon || '';
    document.getElementById('editCupo').value = g_grupoActual.cupo || 0;
    document.getElementById('editGrado').value = g_grupoActual.grado || 1;
    document.getElementById('editStatus').value = g_grupoActual.activo === false ? 'false' : 'true';
    document.getElementById('editTipoPago').value = g_grupoActual.tipo_pago_maestro || 'ALUMNO';
    document.getElementById('editCostoMensual').value = g_grupoActual.costo_mensual || 0;
    document.getElementById('modalEdicion').style.display = 'block';
};

window.abrirAltas = function () { document.getElementById('modalAltas').style.display = 'block'; };

window.terminar = function () {
    // Regresar al menú anterior SIN cerrar la app
    window.location.href = 'archivos.html';
};

// --- FORMULA DE CLAVE AUTOMATICA ---

window.generarClave = function (tipo) {
    const prefix = tipo === 'edit' ? 'edit' : 'alta';
    const cId = document.getElementById(`${prefix}Curso`)?.value;
    const mId = document.getElementById(`${prefix}Maestro`)?.value;
    const dia = document.getElementById(`${prefix}Dia`)?.value;
    const hIn = document.getElementById(`${prefix}HoraEntrada`)?.value;

    console.log(`Generando clave (${tipo}):`, { cId, mId, dia, hIn });

    if (!cId || !mId || !dia || !hIn) {
        if (document.getElementById(`${prefix}Clave`)) document.getElementById(`${prefix}Clave`).value = '';
        return;
    }

    const curso = g_cursos.find(c => c.id == cId);
    const maestro = g_maestros.find(m => m.id == mId);

    // CodCurso (3 letras)
    const cod = (curso?.codigo || curso?.clave || curso?.curso || 'XXX').substring(0, 3).toUpperCase();

    // IniMaestro (3 letras: primera de cada palabra)
    let ini = 'XXX';
    if (maestro) {
        const pal = maestro.nombre.trim().split(/\s+/);
        ini = pal.map(w => w[0]).join('').substring(0, 3);
    }
    ini = ini.padEnd(3, 'X').substring(0, 3).toUpperCase();

    // Dia (LU/MA/etc) + Hora (2 dígitos de entrada)
    const hora = (hIn || '').split(':')[0] || '00';

    const clave = `${cod}${ini}${dia.substring(0, 2).toUpperCase()}${hora.padStart(2, '0')}`;
    if (document.getElementById(`${prefix}Clave`)) document.getElementById(`${prefix}Clave`).value = clave;
};

function configurarListenersClave() {
    ['alta', 'edit'].forEach(m => {
        ['Dia', 'HoraEntrada'].forEach(f => {
            const el = document.getElementById(`${m}${f}`);
            if (el) el.onchange = () => window.generarClave(m);
        });

        // Predictivos
        setupPredictivo(m, 'Curso');
        setupPredictivo(m, 'Maestro');
    });
}

function setupPredictivo(prefix, cat) {
    const s = document.getElementById(`${prefix}${cat}Search`);
    const h = document.getElementById(`${prefix}${cat}`);
    const l = document.getElementById(`${prefix}${cat}Suggestions`);
    if (!s) return;

    s.oninput = () => {
        const v = s.value.toUpperCase();
        l.innerHTML = '';
        if (!v) { l.style.display = 'none'; return; }
        const data = cat === 'Curso' ? g_cursos : g_maestros;
        const field = cat === 'Curso' ? 'curso' : 'nombre';

        const filtered = data.filter(x => x[field].toUpperCase().includes(v));
        filtered.forEach(x => {
            const d = document.createElement('div');
            d.textContent = x[field];
            d.onclick = () => {
                s.value = x[field];
                h.value = x.id;
                l.style.display = 'none';
                window.generarClave(prefix);
            };
            l.appendChild(d);
        });
        l.style.display = filtered.length ? 'block' : 'none';
    };
}

// --- CRUD ---

window.guardarAlta = async function () {
    const client = window.supabase || (typeof getSupabase === 'function' ? getSupabase() : null);
    if (!client) return;

    const data = {
        clave: document.getElementById('altaClave').value,
        curso_id: document.getElementById('altaCurso').value || null,
        maestro_id: document.getElementById('altaMaestro').value || null,
        dia: document.getElementById('altaDia').value,
        hora_entrada: document.getElementById('altaHoraEntrada').value,
        hora_salida: document.getElementById('altaHoraSalida').value,
        fecha_inicio: document.getElementById('altaInicio').value || null,
        salon_id: document.getElementById('altaSalon').value || null,
        cupo: parseInt(document.getElementById('altaCupo').value) || 10,
        grado: parseInt(document.getElementById('altaGrado').value) || 1,
        activo: true,
        costo_mensual: parseFloat(document.getElementById('altaCostoMensual').value) || 0
    };

    // Obtener precio del catálogo de cursos
    const cursoObj = g_cursos.find(c => String(c.id) === String(data.curso_id));
    if (cursoObj && data.costo_mensual === 0) {
        data.costo_mensual = cursoObj.precio_mensual || cursoObj.costo || 0;
    }

    if (data.cupo > 4 && data.tipo_pago_maestro === 'ALUMNO') {
        if (!confirm('Los grupos de pago por alumno suelen tener un cupo máximo de 4. ¿Desea continuar?')) return;
    }

    // Validación de traslape
    const hayConflicto = await validarTraslapeSalon(data.salon_id, data.dia, data.hora_entrada, data.hora_salida);
    if (hayConflicto) return alert('Error: El salón ya está ocupado en ese horario por otro grupo.');

    const { error } = await client.from('grupos').insert([data]);
    if (!error) { alert('Grupo guardado exitosamente.'); location.reload(); }
    else { alert('Error: ' + error.message); }
};

window.guardarEdicion = async function () {
    const client = window.supabase || (typeof getSupabase === 'function' ? getSupabase() : null);
    if (!client) return;

    const data = {
        clave: document.getElementById('editClave').value,
        curso_id: document.getElementById('editCurso').value || null,
        maestro_id: document.getElementById('editMaestro').value || null,
        dia: document.getElementById('editDia').value,
        hora_entrada: document.getElementById('editHoraEntrada').value,
        hora_salida: document.getElementById('editHoraSalida').value,
        fecha_inicio: document.getElementById('editInicio').value || null,
        salon_id: document.getElementById('editSalon').value || null,
        cupo: parseInt(document.getElementById('editCupo').value) || 0,
        grado: parseInt(document.getElementById('editGrado').value) || 1,
        activo: document.getElementById('editStatus').value === 'true',
        tipo_pago_maestro: document.getElementById('editTipoPago').value,
        costo_mensual: parseFloat(document.getElementById('editCostoMensual').value) || 0
    };

    const { error } = await client.from('grupos').update(data).eq('id', g_grupoActual.id);
    if (!error) { alert('Grupo actualizado exitosamente.'); location.reload(); }
    else { alert('Error: ' + error.message); }
};

window.cerrarOpcionesBorrar = function(completo = false) {
    document.getElementById('modalOpcionesBorrado').style.display = 'none';
    if (completo) {
        const tbody = document.getElementById('divEstudiantesBorrado');
        if (tbody) tbody.innerHTML = '';
        window.g_alumnosBorrado = null;
        window.g_destinosAlumnosBorrado = null;
        window.g_transicionesBorrado = null;
    }
};

window.cerrarModalCierreCiclo = function() {
    document.getElementById('modalCierreCiclo').style.display = 'none';
};

window.desactivarGrupo = async function() {
    if (!g_grupoActual) return alert('Debe cargar un grupo primero.');
    const client = window.supabase || (typeof getSupabase === 'function' ? getSupabase() : null);
    if (!client) return;

    try {
        // 1. Obtener alumnos activos
        const { data: inscritos, error: errI } = await client
            .from('alumno_grupos')
            .select('id, alumno_id, alumnos(nombre, credencial)')
            .eq('grupo_clave', g_grupoActual.clave)
            .eq('estado', 'Activo');

        if (errI) throw errI;

        if (!inscritos || inscritos.length === 0) {
            const siDesactivar = await mostrarConfirm(`[Diagnóstico SCALA] El grupo ${g_grupoActual.clave} no tiene alumnos activos.\n\n¿Desea desactivarlo de todos modos?`);
            if (siDesactivar) {
                await client.from('grupos').update({ activo: false }).eq('id', g_grupoActual.id);
                await mostrarAlerta('Grupo desactivado exitosamente.');
                location.reload();
            }
            return;
        }

        // 2. Obtener Calificaciones (Se buscan todos los exámenes vinculados al grupo)
        const { data: programaciones, error: errP } = await client
            .from('programacion_examenes')
            .select('clave_examen, tipo_examen')
            .eq('grupo_id', g_grupoActual.id);

        if (errP) throw errP;

        let resultados = [];
        if (programaciones && programaciones.length > 0) {
            const claves = programaciones.map(p => p.clave_examen);
            const { data: resData, error: errR } = await client
                .from('resultados_examen')
                .select('alumno_id, calificacion, aprobo, clave_examen')
                .in('clave_examen', claves);
            
            if (errR) throw errR;
            resultados = resData || [];
        }

        // 3. Mapear datos para el modal
        const alumnosMap = {};
        inscritos.forEach(ins => {
            // Buscar si hay resultados para este alumno en este grupo
            // Si hay varios, preferimos el que tenga mayor calificación
            const resAlum = resultados
                .filter(r => r.alumno_id === ins.alumno_id)
                .sort((a, b) => (b.calificacion || 0) - (a.calificacion || 0));
            
            const res = resAlum.length > 0 ? resAlum[0] : null;

            alumnosMap[ins.alumno_id] = {
                inscripcionId: ins.id,
                alumnoId: ins.alumno_id,
                nombre: ins.alumnos?.nombre || 'S/N',
                credencial: ins.alumnos?.credencial || '',
                calificacion: (res && res.calificacion !== null) ? res.calificacion : null,
                pasa: (res && res.calificacion !== null) ? (res.calificacion >= 70) : false
            };
        });

        window.g_cierreAlumnos = Object.values(alumnosMap);
        window.g_cierreDestinos = {}; // { alumnoId: { clave, grado } }
        
        mostrarModalCierre();

    } catch (e) {
        console.error('Error al iniciar desactivación:', e);
        alert('Error: ' + e.message);
    }
};

function mostrarModalCierre() {
    const tbody = document.getElementById('bodyCierreCiclo');
    tbody.innerHTML = '';

    window.g_cierreAlumnos.forEach(alum => {
        const destino = window.g_cierreDestinos[alum.alumnoId];
        const colorEstado = alum.pasa ? '#22c55e' : '#ef4444';
        const textoEstado = alum.pasa ? 'APROBADO' : 'REPROBADO';
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div style="font-weight:bold;">${alum.nombre}</div>
                <div style="font-size:0.8rem; color:#666;">${alum.credencial}</div>
            </td>
            <td style="text-align:center; font-weight:bold; font-size:1.1rem;">
                ${alum.calificacion !== null ? alum.calificacion : '--'}
            </td>
            <td style="text-align:center;">
                <span style="background:${colorEstado}; color:white; padding:4px 8px; border-radius:4px; font-size:0.75rem; font-weight:bold;">
                    ${textoEstado}
                </span>
            </td>
            <td style="text-align:center;">
                <select class="premium-input" style="padding:4px; font-size:0.85rem;" 
                    onchange="cambiarAccionCierre('${alum.alumnoId}', this.value)" 
                    id="accion_${alum.alumnoId}">
                    <option value="promover" ${alum.pasa ? 'selected' : ''}>Promover</option>
                    <option value="repetir" ${!alum.pasa ? 'selected' : ''}>Repetir</option>
                </select>
            </td>
            <td>
                <div id="containerDistino_${alum.alumnoId}" style="display:${alum.pasa ? 'flex' : 'none'}; gap:10px; align-items:center;">
                    <input type="text" readonly class="premium-input" style="flex:1; font-size:0.85rem;" 
                        placeholder="Buscar Grupo..." id="inputDestino_${alum.alumnoId}"
                        value="${destino ? destino.clave : ''}">
                    <button class="premium-btn btn-primary" style="padding:4px 10px;" 
                        onclick="abrirSelectorDestinoCierre('${alum.alumnoId}')">🔍</button>
                </div>
                <div id="repeatInfo_${alum.alumnoId}" style="display:${!alum.pasa ? 'block' : 'none'}; color:#666; font-size:0.85rem; font-style:italic;">
                    Permanecerá en ${g_grupoActual.clave} (Activo)
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('modalCierreCiclo').style.display = 'block';
    const btnSave = document.getElementById('btnEjecutarCierre');
    if (btnSave) {
        btnSave.style.display = 'block';
        btnSave.disabled = false;
        btnSave.textContent = 'GUARDAR';
    }
}

window.cambiarAccionCierre = function(alumnoId, accion) {
    const container = document.getElementById(`containerDistino_${alumnoId}`);
    const repeatInfo = document.getElementById(`repeatInfo_${alumnoId}`);
    if (accion === 'promover') {
        container.style.display = 'flex';
        repeatInfo.style.display = 'none';
    } else {
        container.style.display = 'none';
        repeatInfo.style.display = 'block';
    }
};

window.abrirSelectorDestinoCierre = function(alumnoId) {
    window.g_idAlumnoSeleccion = alumnoId;
    window.g_contextoSeleccion = 'destino_cierre_ciclo';
    
    // Calcular grado sugerido basado estrictamente en el curso del grupo actual
    const gradoCurso = g_grupoActual?.cursos?.grado;
    const gradoGrupo = g_grupoActual?.grado;
    const gradoActual = parseInt(gradoCurso || gradoGrupo) || 1;
    
    // Si aprueba, va al siguiente (máximo 6), si no, se queda en el mismo
    const alumData = window.g_cierreAlumnos.find(a => a.alumnoId === alumnoId);
    const accion = document.getElementById(`accion_${alumnoId}`)?.value;
    
    const gradoDestino = (accion === 'promover') ? (gradoActual < 6 ? gradoActual + 1 : 6) : gradoActual;
    
    console.log(`Abriendo buscador para promoción: Grado Actual ${gradoActual} -> Grado Destino ${gradoDestino}`);
    
    const popup = window.open(`grupos-listado.html?grado=${gradoDestino}`, 'ListadoGrupos', 'width=1150,height=750,resizable=yes');
};

// Modificar window.seleccionarGrupo (si existe) o interceptar la selección
// Nota: grupos.js suele recibir un evento postMessage o define una función global que grupos-listado llama.
// Si grupos-listado llama a window.opener.seleccionarGrupoListado, debemos agregar esa función.

window.seleccionarGrupoInterno = function (grupo) {
    console.log('seleccionarGrupoInterno Contexto:', g_contextoSeleccion, 'Grupo:', grupo.clave);
    
    if (window.g_contextoSeleccion === 'destino_cierre_ciclo') {
        const alumId = window.g_idAlumnoSeleccion;
        window.g_cierreDestinos[alumId] = { clave: grupo.clave, grado: grupo.grado };
        const input = document.getElementById(`inputDestino_${alumId}`);
        if (input) input.value = grupo.clave;
        return;
    }

    if (g_contextoSeleccion.startsWith('destino_borrado_alumno_')) {
        const inscId = g_contextoSeleccion.replace('destino_borrado_alumno_', '');
        const alum = window.g_alumnosBorrado.find(a => a.id == inscId);
        if (!window.g_destinosAlumnosBorrado) window.g_destinosAlumnosBorrado = {};
        window.g_destinosAlumnosBorrado[alum.id] = grupo;
        const input = document.getElementById('inputDestino_' + alum.id);
        if (input) input.value = grupo.clave;
        return;
    }

    // Default: Mostrar grupo
    mostrarGrupo(grupo);
};

window.seleccionarGrupoListado = window.seleccionarGrupoInterno;

window.ejecutarCierreCiclo = async function() {
    const client = window.supabase || (typeof getSupabase === 'function' ? getSupabase() : null);
    if (!client) return;

    const btn = document.getElementById('btnEjecutarCierre');
    btn.disabled = true;
    btn.textContent = 'Procesando...';

    try {
        let promovidos = 0;
        let repetidores = 0;

        for (const alum of window.g_cierreAlumnos) {
            const accion = document.getElementById(`accion_${alum.alumnoId}`).value;
            
            if (accion === 'promover') {
                const destino = window.g_cierreDestinos[alum.alumnoId];
                if (!destino) {
                    btn.disabled = false;
                    btn.textContent = 'PROCESAR CAMBIOS Y FINALIZAR';
                    return alert(`Debe seleccionar un grupo destino para el alumno ${alum.nombre}.`);
                }

                // 1. Obtener grado actual
                const { data: dAlum, error: errA } = await client.from('alumnos').select('grado').eq('id', alum.alumnoId).maybeSingle();
                if (errA || !dAlum) {
                    console.warn(`No se pudo obtener el grado actual para ${alum.nombre}, se usará 1 por defecto.`);
                }
                
                // Si promueve, incrementamos grado (máximo 6)
                const gradoBase = parseInt(dAlum?.grado) || 1;
                const nuevoGrado = gradoBase < 6 ? gradoBase + 1 : 6;
                
                await client.from('alumnos').update({ 
                    grado: nuevoGrado,
                    grupo_clave: destino.clave 
                }).eq('id', alum.alumnoId);

                // 2. Finalizar inscripción anterior
                await client.from('alumno_grupos')
                    .update({ estado: 'Finalizado' })
                    .eq('id', alum.inscripcionId);

                // 3. Crear nueva inscripción (Buscando costo sugerido)
                const { data: gDest } = await client.from('grupos').select('costo_mensual, curso_id, cursos(precio_mensual, costo)').eq('clave', destino.clave).maybeSingle();
                const costoSugerido = gDest ? (gDest.costo_mensual || (gDest.cursos ? (gDest.cursos.precio_mensual || gDest.cursos.costo) : 0)) : 0;

                await client.from('alumno_grupos').insert({
                    alumno_id: alum.alumnoId,
                    grupo_clave: destino.clave,
                    grado: nuevoGrado,
                    estado: 'Activo',
                    costo_mensual: costoSugerido,
                    fecha_inscripcion: new Date().toISOString().split('T')[0]
                });

                promovidos++;
            } else {
                // Alumno repite: se queda en el mismo grupo actual
                // No cambiamos su inscripción, se mantiene 'Activo' en este grupo.
                repetidores++;
            }
        }

        // Si todos se fueron, desactivar el grupo
        if (repetidores === 0 && promovidos > 0) {
            await client.from('grupos').update({ activo: false }).eq('id', g_grupoActual.id);
            alert(`Ciclo cerrado. El grupo ${g_grupoActual.clave} se ha desactivado automáticamente porque no quedan alumnos.`);
        } else {
            alert(`Cierre parcial completado.\n${promovidos} alumnos promovidos.\n${repetidores} alumnos permanecen en este grupo.`);
        }

        location.reload();

    } catch (e) {
        console.error('Error procesando cierre de ciclo:', e);
        alert('Ocurrió un error: ' + e.message);
        btn.disabled = false;
        btn.textContent = 'PROCESAR CAMBIOS Y FINALIZAR';
    }
};

window.toggleGrupoDestino = function(show) {
    document.getElementById('divGrupoDestino').style.display = show ? 'block' : 'none';
};

window.abrirSelectorGrupoDestinoAlumno = function(inscripcionId) {
    g_contextoSeleccion = 'destino_borrado_alumno_' + inscripcionId;
    window.open('grupos-listado.html', 'ListadoGrupos', 'width=1150,height=750,resizable=yes');
};

window.procesarBorradoConAlumnos = async function() {
    let transiciones = [];
    const alumnos = window.g_alumnosBorrado || [];

    for (const a of alumnos) {
        const accion = document.querySelector(`input[name="accion_borrado_${a.id}"]:checked`).value;
        if (accion === 'cambio') {
            const destinoObj = window.g_destinosAlumnosBorrado && window.g_destinosAlumnosBorrado[a.id];
            if (!destinoObj) {
                return alert(`Debe seleccionar un grupo destino para el alumno ${a.alumnos ? a.alumnos.nombre : a.id} o marcarlo para Baja.`);
            }
            if (destinoObj.clave === g_grupoActual.clave) {
                return alert(`El grupo destino para el alumno ${a.alumnos ? a.alumnos.nombre : a.id} no puede ser el mismo que se va a borrar.`);
            }
            if ((destinoObj.alumnos_inscritos || 0) >= (destinoObj.cupo || 0)) {
                return alert(`El destino ${destinoObj.clave} seleccionado para ${a.alumnos ? a.alumnos.nombre : a.id} está lleno. Por favor, asigne otro grupo o dalo de baja.`);
            }
            transiciones.push({ inscripcionId: a.id, alumnoId: a.alumno_id, accion: 'cambio', grupoDestino: destinoObj.clave });
        } else {
            transiciones.push({ inscripcionId: a.id, alumnoId: a.alumno_id, accion: 'baja' });
        }
    }
    
    window.g_transicionesBorrado = transiciones;
    window.cerrarOpcionesBorrar();
    
    document.getElementById('modalBorrar').style.display = 'block';
};

window.confirmarBorrado = async function () {
    const client = window.supabase || (typeof getSupabase === 'function' ? getSupabase() : null);
    if (!client) return;
    
    // Procesar transición de alumnos si existen y hay algo en el arreglo
    if (window.g_transicionesBorrado && window.g_transicionesBorrado.length > 0) {
        const fechaHoy = new Date().toISOString().split('T')[0];
        const razonOriginal = document.getElementById('razonBorrado').value.trim();
        const observacionesBaja = razonOriginal ? `GRUPO BORRADO: ${razonOriginal}` : 'BAJA AUTOMATICA POR BORRADO DE GRUPO';

        for (const t of window.g_transicionesBorrado) {
            if (t.accion === 'cambio') {
                await client.from('alumno_grupos').update({
                    grupo_clave: t.grupoDestino,
                    estado: 'Activo'
                }).eq('id', t.inscripcionId);
                
                await client.from('alumnos').update({
                    grupo_clave: t.grupoDestino 
                }).eq('id', t.alumnoId);
            } else if (t.accion === 'baja') {
                await client.from('alumno_grupos').delete().eq('id', t.inscripcionId);
                
                await client.from('alumnos').update({
                    activo: false,
                    fecha_baja: fechaHoy,
                    motivo_baja: 'OTR'
                }).eq('id', t.alumnoId);
            }
        }
    }

    // Borrar registros dependientes ANTES del grupo (orden importa por FK constraints)
    // 1. Asistencias del grupo
    await client.from('asistencias').delete().eq('grupo_id', g_grupoActual.id);

    // 2. Sesiones de clase del grupo (FK: sesiones_clase_grupo_id_fkey)
    await client.from('sesiones_clase').delete().eq('grupo_id', g_grupoActual.id);

    // 3. Inscripciones restantes en alumno_grupos
    await client.from('alumno_grupos').delete().eq('grupo_clave', g_grupoActual.clave);

    // 4. Borrado definitivo del grupo
    const { error } = await client.from('grupos').delete().eq('id', g_grupoActual.id);
    if (!error) { 
        alert('Grupo eliminado exitosamente.'); 
        location.reload(); 
    } else { 
        alert('Error: ' + error.message); 
    }
};


window.cancelarAltas = () => document.getElementById('modalAltas').style.display = 'none';
window.cancelarEdicion = () => document.getElementById('modalEdicion').style.display = 'none';
window.cancelarBorrado = () => { 
    document.getElementById('modalBorrar').style.display = 'none'; 
    window.g_opcionBorradoActiva = null; 
    window.cerrarOpcionesBorrar(true); 
};

// Funciones de cierre de Modal (Corrección de errores)
window.cerrarModalEdicion = function() {
    document.getElementById('modalEdicion').style.display = 'none';
};
window.cerrarModalBorrar = function() {
    document.getElementById('modalBorrar').style.display = 'none';
};
window.cerrarModalOpcionesBorrado = function() {
    window.cerrarOpcionesBorrar(true);
};

// --- SELECCION DESDE MODALES EXTERNOS ---
var g_contextoSeleccion = 'alta';

window.abrirModalSeleccionCurso = function (contexto) {
    g_contextoSeleccion = contexto;
    const w = 1000, h = 700;
    const l = (screen.width - w) / 2, t = (screen.height - h) / 2;
    window.open('cursos-lista.html', 'SeleccionCurso', `width=${w},height=${h},left=${l},top=${t},resizable=yes,scrollbars=yes`);
};

window.abrirModalSeleccionMaestro = function (contexto) {
    g_contextoSeleccion = contexto;
    const w = 1000, h = 700;
    const l = (screen.width - w) / 2, t = (screen.height - h) / 2;
    window.open('maestros-lista.html', 'SeleccionMaestro', `width=${w},height=${h},left=${l},top=${t},resizable=yes,scrollbars=yes`);
};

window.recibirCursoSeleccionado = function (param) {
    let id = (typeof param === 'object') ? param.id : param;
    let nombre = (typeof param === 'object') ? param.curso : '';

    if (!nombre) {
        const curso = g_cursos.find(c => c.id == id);
        if (curso) nombre = curso.curso;
    }

    if (g_contextoSeleccion === 'main') {
        const hidden = document.getElementById('curso');
        if (hidden) hidden.value = id;
        const display = document.getElementById('cursoDisplay');
        if (display) display.value = nombre || id;
    } else {
        const searchInput = document.getElementById(`${g_contextoSeleccion}CursoSearch`);
        if (searchInput) searchInput.value = nombre || '';
        const hiddenInput = document.getElementById(`${g_contextoSeleccion}Curso`);
        if (hiddenInput) hiddenInput.value = id;

        // Auto-asignar grado desde el curso
        const gradoInput = document.getElementById(`${g_contextoSeleccion}Grado`);
        if (gradoInput) {
            const curso = g_cursos.find(c => c.id == id);
            if (curso && curso.grado) {
                // Convertir grado a número si es posible (ej: "PRIMERO" -> 1, o si es "1" -> 1)
                let gVal = curso.grado;
                if (gVal.toLowerCase().includes('prim')) gVal = 1;
                else if (gVal.toLowerCase().includes('seg')) gVal = 2;
                else if (gVal.toLowerCase().includes('ter')) gVal = 3;
                else if (gVal.toLowerCase().includes('cua')) gVal = 4;
                else if (gVal.toLowerCase().includes('qui')) gVal = 5;
                else if (gVal.toLowerCase().includes('sex')) gVal = 6;
                gradoInput.value = gVal;
            }
        }

        window.generarClave(g_contextoSeleccion);
    }
}

// Alias para compatibilidad
window.cargarDatosCurso = window.recibirCursoSeleccionado;

window.cargarDatosMaestro = function (maestro) {
    if (!maestro) return;

    let id = (typeof maestro === 'object') ? maestro.id : maestro;
    let nombre = (typeof maestro === 'object') ? maestro.nombre : '';

    if (!nombre) {
        const m = g_maestros.find(x => x.id == id);
        if (m) nombre = m.nombre;
    }

    if (g_contextoSeleccion === 'main') {
        const hidden = document.getElementById('maestro');
        if (hidden) hidden.value = id;
        const display = document.getElementById('maestroDisplay');
        if (display) display.value = nombre || id;
    } else {
        const searchInput = document.getElementById(`${g_contextoSeleccion}MaestroSearch`);
        if (searchInput) searchInput.value = nombre || '';
        const hiddenInput = document.getElementById(`${g_contextoSeleccion}Maestro`);
        if (hiddenInput) hiddenInput.value = id;
        window.generarClave(g_contextoSeleccion);
    }
};

window.mostrarMaestro = window.cargarDatosMaestro;
window.seleccionarMaestro = window.cargarDatosMaestro;
window.cargarMaestroDesdeVentana = window.cargarDatosMaestro;

// ==============================
// BUSCADOR MODAL DE SALONES (LUPA)
// ==============================
window.abrirModalSeleccionSalon = function (modo) {
    window._modoSeleccionSalon = modo; // 'main', 'alta' o 'edit'
    document.getElementById('modalSeleccionSalon').style.display = 'flex';
    document.getElementById('inputBuscarSalon').value = '';
    buscarSalonesModal();
    setTimeout(() => document.getElementById('inputBuscarSalon').focus(), 100);
};

window.cerrarModalSeleccionSalon = function () {
    document.getElementById('modalSeleccionSalon').style.display = 'none';
};

window.buscarSalonesModal = async function () {
    const term = document.getElementById('inputBuscarSalon').value.trim();
    const client = window.supabase || (typeof getSupabase === 'function' ? getSupabase() : null);
    if (!client) return;

    const tbody = document.getElementById('tablaSalonesModal');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Buscando...</td></tr>';

    try {
        let query = client.from('salones').select('*').eq('activo', true);
        if (term) {
            if (!isNaN(parseInt(term))) {
                query = query.or(`numero.eq.${term},ubicacion.ilike.%${term}%`);
            } else {
                query = query.ilike('ubicacion', `%${term}%`);
            }
        }

        const { data, error } = await query.order('numero').limit(50);
        if (error) throw error;

        tbody.innerHTML = '';
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No se encontraron salones</td></tr>';
            return;
        }

        data.forEach(item => {
            const tr = document.createElement('tr');
            tr.style.cursor = 'pointer';
            tr.onclick = () => seleccionarSalonModal(item.numero, item.cupo);
            tr.innerHTML = `
                <td>${item.numero}</td>
                <td>${item.ubicacion || ''}</td>
                <td>${item.cupo || 0}</td>
            `;
            tr.onmouseover = function () { this.style.backgroundColor = '#000080'; this.style.color = 'white'; };
            tr.onmouseout = function () { this.style.backgroundColor = ''; this.style.color = ''; };
            tbody.appendChild(tr);
        });
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:red;">Error: ${e.message}</td></tr>`;
    }
};

window.seleccionarSalonModal = function (numero, cupo) {
    const m = window._modoSeleccionSalon;
    if (m === 'alta') {
        document.getElementById('altaSalon').value = numero;
        document.getElementById('altaSalonSearch').value = 'Salón ' + numero;
        document.getElementById('altaCupo').value = cupo;
    } else if (m === 'edit') {
        document.getElementById('editSalon').value = numero;
        document.getElementById('editSalonSearch').value = 'Salón ' + numero;
        document.getElementById('editCupo').value = cupo;
    } else {
        document.getElementById('salon').value = numero;
        document.getElementById('cupo').value = cupo;
    }
    cerrarModalSeleccionSalon();
};

// ==============================
// ASISTENCIAS
// ==============================
// ==============================
// ASISTENCIAS (MODO CALENDARIO)
// ==============================
var g_sesionesGrupo = [];
var g_asistenciasGrupo = [];
var g_alumnosGrupo = [];

window.abrirModalAsistencia = async function () {
    if (!g_grupoActual) return;
    document.getElementById('modalAsistencia').style.display = 'block';
    
    document.getElementById('listaAlumnosAsistencia').innerHTML = '<div style="padding: 10px; color: #666;">Cargando...</div>';
    document.getElementById('contenedorCalendarioAsistencia').innerHTML = '<div style="color: #666; text-align: center; margin-top: 50px;">👈 Seleccione un alumno para ver sus asistencias</div>';
    document.getElementById('infoAvisoAsistencia').style.display = 'none';

    const client = window.supabase || (typeof getSupabase === 'function' ? getSupabase() : null);
    if (!client) return;

    try {
        // 1. Obtener sesiones de clase
        const { data: sesiones } = await client
            .from('sesiones_clase')
            .select('fecha')
            .eq('grupo_id', g_grupoActual.id)
            .order('fecha', { ascending: true });

        g_sesionesGrupo = (sesiones || []).map(s => s.fecha);
        console.log(`[Asistencias] ${g_sesionesGrupo.length} sesiones encontradas para grupo ID: ${g_grupoActual.id}`);

        // 2. Obtener alumnos activos
        const { data: rawAlumnos } = await client
            .from('alumno_grupos')
            .select('alumno_id, alumnos(id, nombre)')
            .eq('grupo_clave', g_grupoActual.clave)
            .eq('estado', 'Activo');

        g_alumnosGrupo = (rawAlumnos || []).map(ra => ra.alumnos).filter(a => a != null);

        // 3. Obtener asistencias
        const { data: asistencias } = await client
            .from('asistencias')
            .select('*')
            .eq('grupo_id', g_grupoActual.id);
            
        g_asistenciasGrupo = asistencias || [];

        // 4. Obtener deudores del grupo
        const { data: deudores } = await client
            .from('v_colegiaturas_pendientes')
            .select('alumno_id')
            .eq('grupo', g_grupoActual.clave);
        g_deudoresGrupo = (deudores || []).map(d => String(d.alumno_id));

        renderizarListaAlumnos();

        // Mostrar aviso
        if (g_sesionesGrupo.length > 24) {
            document.getElementById('infoAvisoAsistencia').style.display = 'block';
            document.getElementById('infoAvisoAsistencia').style.backgroundColor = '#f8d7da';
            document.getElementById('infoAvisoAsistencia').style.color = '#721c24';
            document.getElementById('textoAvisoAsistencia').innerHTML = `Supera el límite de 24 clases (<b>${g_sesionesGrupo.length}</b> regs).`;
        } else if (g_sesionesGrupo.length === 24) {
            document.getElementById('infoAvisoAsistencia').style.display = 'block';
            document.getElementById('infoAvisoAsistencia').style.backgroundColor = '#d4edda';
            document.getElementById('infoAvisoAsistencia').style.color = '#155724';
            document.getElementById('textoAvisoAsistencia').innerHTML = `Se han completado las 24 clases.`;
        }

    } catch (e) {
        document.getElementById('listaAlumnosAsistencia').innerHTML = `<div style="padding: 10px; color: red;">Error: ${e.message}</div>`;
    }
};

window.cerrarModalAsistencia = function () {
    document.getElementById('modalAsistencia').style.display = 'none';
};

function renderizarListaAlumnos() {
    const contenedor = document.getElementById('listaAlumnosAsistencia');
    contenedor.innerHTML = '';

    if (g_alumnosGrupo.length === 0) {
        contenedor.innerHTML = '<div style="padding: 10px; color: #666;">No hay alumnos inscritos/activos.</div>';
        return;
    }

    g_alumnosGrupo.forEach(al => {
        let cntA = 0, cntR = 0, cntF = 0, cntRep = 0;
        const asistAlumno = g_asistenciasGrupo.filter(a => String(a.alumno_id) === String(al.id));
        
        g_sesionesGrupo.forEach(fecha => {
            // Comparación robusta
            const fechaLimpia = typeof fecha === 'string' ? fecha.split('T')[0] : fecha;
            const asis = asistAlumno.find(a => {
                const aFecha = typeof a.fecha === 'string' ? a.fecha.split('T')[0] : a.fecha;
                return aFecha === fechaLimpia;
            });
            if (asis) {
                const obsStr = (asis.observaciones || '').toUpperCase();
                if (asis.asistio) {
                    if (obsStr.includes("REPOSICIÓN") || obsStr.includes("REPOSICION")) cntRep++;
                    else if (obsStr.includes("RETARDO")) cntR++;
                    else cntA++;
                } else {
                    cntF++;
                }
            }
        });

        const cntPagable = cntA + cntRep; // Total pagable para el maestro

        const div = document.createElement('div');
        div.style.padding = '8px 10px';
        div.style.borderBottom = '1px solid #eee';
        div.style.cursor = 'pointer';
        
        const esDeudor = g_deudoresGrupo.includes(String(al.id));
        const badgeDeudor = esDeudor ? '<span style="background:red; color:white; font-size:9px; padding:1px 4px; border-radius:3px; margin-left:5px; font-weight:bold;">DEUDOR</span>' : '';

        div.innerHTML = `
            <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 3px;">
                ${al.nombre} ${badgeDeudor}
            </div>
            <div style="font-size: 10px; display: flex; flex-wrap: wrap; gap: 5px;">
                <span style="color: #16a34a; font-weight: bold;" title="Asistencias Pagables (A + Rep)">P: ${cntPagable}</span>
                <span style="color: #6b7280; font-size: 9px;" title="Detalle">(${cntA}A, ${cntRep}Rep)</span>
                <span style="color: #ea580c; font-weight: bold;" title="Retardos">R: ${cntR}</span>
                <span style="color: #dc2626; font-weight: bold;" title="Faltas">F: ${cntF}</span>
            </div>
        `;
        
        div.onmouseover = function() { if (this.className !== 'selected') this.style.backgroundColor = '#f0f0f0'; };
        div.onmouseout = function() { if (this.className !== 'selected') this.style.backgroundColor = ''; };
        
        div.onclick = function() {
            Array.from(contenedor.children).forEach(c => {
                c.className = '';
                c.style.backgroundColor = '';
                c.style.color = '';
                c.style.fontWeight = 'normal';
            });
            this.className = 'selected';
            this.style.backgroundColor = '#dfdfdf';
            this.style.color = 'black';
            this.style.fontWeight = 'bold';
            
            document.getElementById('headerCalendarioAsistencia').textContent = `Asistencias: ${al.nombre}`;
            renderizarCalendarioAlumno(al.id);
        };
        
        contenedor.appendChild(div);
    });
}

function renderizarCalendarioAlumno(alumnoId) {
    const cont = document.getElementById('contenedorCalendarioAsistencia');
    cont.innerHTML = '';
    
    if (g_sesionesGrupo.length === 0) {
        cont.innerHTML = '<div style="color: #666; text-align: center; margin-top: 50px;">El grupo no tiene sesiones de clase.</div>';
        return;
    }

    const meses = new Map();
    g_sesionesGrupo.forEach(fechaStr => {
        const mesStr = fechaStr.substring(0, 7);
        if (!meses.has(mesStr)) {
            meses.set(mesStr, []);
        }
        meses.get(mesStr).push(fechaStr);
    });

    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.gap = '20px';
    wrapper.style.alignItems = 'flex-start';

    const nombreMeses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const asistAlumno = g_asistenciasGrupo.filter(a => String(a.alumno_id) === String(alumnoId));

    let contA = 0;
    let contR = 0;
    let contF = 0;
    let contRep = 0;

    for (let [mesKey, sesionesMes] of meses.entries()) {
        const [year, month] = mesKey.split('-');
        const mesIndex = parseInt(month, 10) - 1;
        
        const mesCont = document.createElement('div');
        mesCont.style.display = 'flex';
        mesCont.style.flexDirection = 'column';
        
        const title = document.createElement('div');
        title.textContent = nombreMeses[mesIndex] + (year !== new Date().getFullYear().toString() ? ` ${year}` : '');
        title.style.textAlign = 'center';
        title.style.fontWeight = 'bold';
        title.style.marginBottom = '8px';
        title.style.color = '#555';
        mesCont.appendChild(title);
        
        const primerDia = new Date(year, mesIndex, 1);
        let diaAjustado = primerDia.getDay(); // 0(Dom) a 6(Sab)
        const ultimoDia = new Date(year, mesIndex + 1, 0).getDate();
        
        const gridCont = document.createElement('div');
        gridCont.style.display = 'grid';
        gridCont.style.gridGap = '3px';
        gridCont.style.gridTemplateColumns = 'repeat(7, 24px)';

        // Añadir encabezado D L M M J V S
        const daysHeader = document.createElement('div');
        daysHeader.style.display = 'grid';
        daysHeader.style.gridTemplateColumns = 'repeat(7, 24px)';
        daysHeader.style.gridGap = '3px';
        daysHeader.style.marginBottom = '2px';
        ['D', 'L', 'M', 'M', 'J', 'V', 'S'].forEach(d => {
             const ddiv = document.createElement('div');
             ddiv.textContent = d;
             ddiv.style.textAlign = 'center';
             ddiv.style.fontSize = '10px';
             ddiv.style.color = '#888';
             daysHeader.appendChild(ddiv);
        });
        mesCont.appendChild(daysHeader);

        for (let i = 0; i < diaAjustado; i++) {
            const empty = document.createElement('div');
            gridCont.appendChild(empty);
        }
        
        for (let d = 1; d <= ultimoDia; d++) {
            const fechaActualStr = `${year}-${month}-${String(d).padStart(2, '0')}`;
            const box = document.createElement('div');
            box.style.width = '24px';
            box.style.height = '24px';
            box.style.borderRadius = '3px';
            box.style.display = 'flex';
            box.style.alignItems = 'center';
            box.style.justifyContent = 'center';
            box.style.fontSize = '11px';
            box.style.fontWeight = 'bold';
            box.style.color = '#777'; // Color atenuado para días sin clase
            box.style.backgroundColor = '#f1f1f1'; // Fondo default
            box.textContent = d; // Mostrar número todos los días
            
            if (sesionesMes.includes(fechaActualStr)) {
                // Día con clase programada
                box.style.color = '#333';
                // Comparación robusta de fecha (string YYYY-MM-DD)
                const asis = asistAlumno.find(a => {
                    const aFecha = typeof a.fecha === 'string' ? a.fecha.split('T')[0] : a.fecha;
                    return aFecha === fechaActualStr;
                });
                let estadoStr = "Sin lista pasada";
                let obsStr = "";
                
                box.style.backgroundColor = '#d1d5db'; // clase sin lista
                box.style.color = '#555';
                
                if (asis) {
                    obsStr = (asis.observaciones || '').toUpperCase();
                    box.style.color = 'white';
                    if (asis.asistio) {
                        if (obsStr.includes("REPOSICIÓN") || obsStr.includes("REPOSICION")) {
                            box.style.backgroundColor = '#9333ea';
                            estadoStr = "Reposición";
                            contRep++;
                        } else if (obsStr.includes("RETARDO")) {
                            box.style.backgroundColor = '#f97316';
                            estadoStr = "Retardo";
                            contR++;
                        } else {
                            box.style.backgroundColor = '#22c55e';
                            estadoStr = "Asistencia";
                            contA++;
                        }
                    } else {
                        box.style.backgroundColor = '#ef4444';
                        estadoStr = "Falta";
                        contF++;
                    }
                }
                
                box.onmousemove = (e) => mostrarTooltip(e, fechaActualStr, estadoStr, obsStr);
                box.onmouseleave = ocultarTooltip;
                box.onclick = () => { if (obsStr) alert(`Observación para ${fechaActualStr} (${estadoStr}):\n\n${obsStr}`); else alert(`Estado para ${fechaActualStr}: ${estadoStr}\n\n(No hay observaciones)`); };
                box.style.cursor = 'pointer';
                box.style.boxShadow = 'inset 0 0 0 1px rgba(0,0,0,0.1)';
            }
            gridCont.appendChild(box);
        }
        
        mesCont.appendChild(gridCont);
        wrapper.appendChild(mesCont);
    }
    
    cont.appendChild(wrapper);

    // Actualizar contadores
    document.getElementById('totalesAsistencia').style.display = 'flex';
    document.getElementById('totalA').textContent = contA;
    document.getElementById('totalR').textContent = contR;
    document.getElementById('totalF').textContent = contF;
    const repEl = document.getElementById('totalRep');
    if (repEl) repEl.textContent = contRep;
}

function mostrarTooltip(e, fecha, estado, obs) {
    const tooltipObj = document.getElementById('tooltipAsistencia');
    if (!tooltipObj) return;
    document.getElementById('ttFecha').textContent = fecha;
    document.getElementById('ttEstado').textContent = estado;
    document.getElementById('ttObs').textContent = obs ? 'Obs: ' + obs : '';
    
    tooltipObj.style.display = 'block';
    tooltipObj.style.left = (e.pageX + 10) + 'px';
    tooltipObj.style.top = (e.pageY + 10) + 'px';
}

function ocultarTooltip() {
    const tooltipObj = document.getElementById('tooltipAsistencia');
    if (tooltipObj) tooltipObj.style.display = 'none';
}

// ==============================
// VALIDACION TRASLAPE
// ==============================
window.validarTraslapeSalon = async function (salonId, dia, hEntrada, hSalida, grupoIdIgnorar = null) {
    const client = window.supabase || (typeof getSupabase === 'function' ? getSupabase() : null);
    if (!client || !salonId || !dia || !hEntrada || !hSalida) return false;

    try {
        let query = client.from('grupos')
            .select('id, hora_entrada, hora_salida')
            .eq('salon_id', salonId)
            .eq('dia', dia)
            .eq('activo', true);

        if (grupoIdIgnorar) query = query.neq('id', grupoIdIgnorar);

        const { data, error } = await query;
        if (error) throw error;

        // Verificar traslape de tiempos
        const overlapping = data.some(g => {
            // Un traslape ocurre si (E1 < S2) Y (S1 > E2)
            return (hEntrada < g.hora_salida && hSalida > g.hora_entrada);
        });

        return overlapping;
    } catch (e) {
        console.error('Error validando traslape:', e);
        return false;
    }
};

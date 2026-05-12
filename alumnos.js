// =====================================================
// MÓDULO DE ALUMNOS - SCALA
// =====================================================

var db = null;
var alumnosInscritosGeneral = [];
var g_gruposPendientesAlta = []; // Para "carrito" de grupos en Altas
var gruposCache = [];
var salonesCache = [];
var motivosCache = [];
var alumnoSeleccionado = null;
var alumnoEditando = null;

// Variables para paginación en búsqueda
var g_paginaActualAlumnos = 1;
var g_totalPaginasAlumnos = 1;
var g_totalResultadosAlumnos = 0;
var g_terminoBusquedaAlumnos = '';
var g_resultadosBusquedaAlumnos = [];

// MODAL STATE TRACKING
var g_modalActual = null;
var g_seguimientoCache = []; // Para el modal de detalle de pagos
var g_inscripcionesActivas = [];
var g_cursoMap = {};

// =====================================================
// INICIALIZACIÓN
// =====================================================
document.addEventListener('DOMContentLoaded', async function () {
    console.log('Inicializando módulo de alumnos...');

    try {
        if (typeof waitForSupabase === 'function') {
            db = await waitForSupabase();
        } else {
            db = window.supabaseClient || window.supabase || (typeof getSupabase === 'function' ? getSupabase() : null);
        }

        if (db) {
            console.log('✓ Supabase conectado');
            await cargarGrupos();
            // await cargarInstrumentos(); // 404 - Table does not exist
            await cargarMedios();
            // await cargarSalones();      // 404 - Table does not exist
            await cargarMotivos();
        } else {
            console.error('❌ Supabase NO disponible');
        }
    } catch (err) {
        console.error('Error durante la inicialización:', err);
    }

    if (typeof habilitarInputs === 'function') {
        habilitarInputs();
    }
});

/**
 * Sincroniza manualmente el contador de alumnos_inscritos de un grupo
 * basándose en la tabla alumno_grupos (Estado: Activo)
 */
async function sincronizarContadorGrupo(clave) {
    if (!db || !clave) return;
    try {
        const { count, error } = await db
            .from('alumno_grupos')
            .select('*', { count: 'exact', head: true })
            .eq('grupo_clave', clave)
            .eq('estado', 'Activo');

        if (!error && count !== null) {
            const { error: updErr } = await db
                .from('grupos')
                .update({ alumnos_inscritos: count })
                .eq('clave', clave);

            if (updErr) throw updErr;
            console.log(`✓ Sincronizado ${clave}: ${count} alumnos`);
        } else if (error) {
            throw error;
        }
    } catch (e) {
        console.error(`❌ Error sincronizando ${clave}:`, e);
    }
}

// =====================================================
// FUNCIONES DE CARGA DE DATOS
// =====================================================
async function cargarGrupos() {
    if (!db) return;

    try {
        var result = await SessionManager.applyIsolation(db.from('grupos').select('id, clave, curso_id, cursos(curso)')).order('clave');
        if (result.error) {
            console.error('Error cargando grupos:', result.error);
            return;
        }

        gruposCache = result.data || [];
        console.log(gruposCache.length + ' grupos cargados');

        // Llenar selects de grupo
        var selectGrupo = document.getElementById('grupo');
        var selectNuevoGrupo = document.getElementById('selectNuevoGrupo');

        if (selectGrupo) {
            selectGrupo.innerHTML = '<option value="">-- Seleccione Grupo --</option>';
            for (var i = 0; i < gruposCache.length; i++) {
                var g = gruposCache[i];
                var opt = document.createElement('option');
                opt.value = g.clave;
                opt.textContent = g.clave + ' - ' + (g.cursos ? g.cursos.curso : '');
                selectGrupo.appendChild(opt);
            }
        }

        if (selectNuevoGrupo) {
            selectNuevoGrupo.innerHTML = '<option value="">-- Seleccione nuevo grupo --</option>';
            for (var j = 0; j < gruposCache.length; j++) {
                var gr = gruposCache[j];
                var opt2 = document.createElement('option');
                opt2.value = gr.clave;
                opt2.textContent = gr.clave + ' - ' + (gr.cursos ? gr.cursos.curso : '');
                selectNuevoGrupo.appendChild(opt2);
            }
        }
    } catch (e) {
        console.error('Error:', e);
    }
}

async function cargarInstrumentos() {
    if (!db) return;
    var select = document.getElementById('instrumento');
    if (!select) return;

    try {
        // Quitamos el filtro de activo por ahora para asegurar que se vean todos
        var result = await SessionManager.applyIsolation(db.from('instrumentos').select('id, clave, descripcion')).order('descripcion');
        if (result.error) return;

        select.innerHTML = '<option value="">-- Seleccione --</option>';
        for (var i = 0; i < result.data.length; i++) {
            var inst = result.data[i];
            var opt = document.createElement('option');
            opt.value = inst.clave;
            opt.textContent = inst.clave + ' - ' + inst.descripcion;
            select.appendChild(opt);
        }
    } catch (e) {
        console.error('Error:', e);
    }
}

async function cargarMedios() {
    if (!db) return;
    var select = document.getElementById('medio');
    if (!select) return;

    try {
        var result = await SessionManager.applyIsolation(db.from('medios_contacto').select('id, clave, descripcion')).eq('activo', true).order('clave');
        if (result.error) return;

        select.innerHTML = '<option value="">-- Seleccione --</option>';
        for (var i = 0; i < result.data.length; i++) {
            var m = result.data[i];
            var opt = document.createElement('option');
            opt.value = m.clave;
            opt.textContent = m.clave + ' - ' + m.descripcion;
            select.appendChild(opt);
        }
    } catch (e) {
        console.error('Error:', e);
    }
}

async function cargarSalones() {
    if (!db) return;

    try {
        var result = await SessionManager.applyIsolation(db.from('salones').select('*')).order('numero');
        if (result.error) {
            console.error('Error cargando salones:', result.error);
            // Usar datos de ejemplo si no hay tabla
            salonesCache = [
                { numero: '1', ubicacion: 'Planta Baja' },
                { numero: '2', ubicacion: 'Planta Baja' },
                { numero: '3', ubicacion: 'Primer Piso' },
                { numero: '4', ubicacion: 'Primer Piso' },
                { numero: '5', ubicacion: 'Segundo Piso' }
            ];
            return;
        }
        salonesCache = result.data || [];
        console.log(salonesCache.length + ' salones cargados');
    } catch (e) {
        console.error('Error:', e);
        // Datos de ejemplo
        salonesCache = [
            { numero: '1', ubicacion: 'Planta Baja' },
            { numero: '2', ubicacion: 'Planta Baja' },
            { numero: '3', ubicacion: 'Primer Piso' }
        ];
    }
}

async function cargarMotivos() {
    if (!db) return;

    try {
        var result = await SessionManager.applyIsolation(db.from('motivos_baja').select('*')).order('clave');
        if (result.error) {
            console.error('Error cargando motivos:', result.error);
            // Usar datos por defecto
            motivosCache = [
                { clave: 'CAC', descripcion: 'CAMBIO DE CIUDAD' },
                { clave: 'ECO', descripcion: 'PROBLEMAS ECONOMICOS' },
                { clave: 'SAL', descripcion: 'PROBLEMAS DE SALUD' },
                { clave: 'TRA', descripcion: 'PROBLEMAS DE TRABAJO' },
                { clave: 'TIE', descripcion: 'FALTA DE TIEMPO' },
                { clave: 'INT', descripcion: 'PERDIDA DE INTERES' },
                { clave: 'OTR', descripcion: 'OTRO MOTIVO' }
            ];
        } else {
            motivosCache = result.data || [];
        }
        console.log(motivosCache.length + ' motivos cargados');

        // Llenar select de motivos
        var selectMotivo = document.getElementById('selectMotivoBaja');
        if (selectMotivo) {
            selectMotivo.innerHTML = '<option value="">-- Seleccione el motivo --</option>';
            for (var i = 0; i < motivosCache.length; i++) {
                var m = motivosCache[i];
                var opt = document.createElement('option');
                opt.value = m.clave;
                opt.textContent = m.clave + ' - ' + m.descripcion;
                selectMotivo.appendChild(opt);
            }
        }
    } catch (e) {
        console.error('Error:', e);
        motivosCache = [
            { clave: 'CAC', descripcion: 'CAMBIO DE CIUDAD' },
            { clave: 'ECO', descripcion: 'PROBLEMAS ECONOMICOS' },
            { clave: 'SAL', descripcion: 'PROBLEMAS DE SALUD' },
            { clave: 'TRA', descripcion: 'PROBLEMAS DE TRABAJO' }
        ];
    }
}

// =====================================================
// SELECTOR DE SALÓN
// =====================================================
function abrirSelectorSalon() {
    var modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'modalSalon';

    var html = '<div class="modal-content" style="max-width:500px;">' +
        '<h2>Seleccionar Salón</h2>' +
        '<div style="max-height:350px;overflow-y:auto;">' +
        '<table style="width:100%;border-collapse:collapse;">' +
        '<thead><tr style="background:#008B8B;color:#fff;">' +
        '<th style="padding:10px;">Salón</th>' +
        '<th style="padding:10px;">Ubicación</th>' +
        '</tr></thead><tbody>';

    for (var i = 0; i < salonesCache.length; i++) {
        var s = salonesCache[i];
        html += '<tr onclick="seleccionarSalon(\'' + s.numero + '\', \'' + (s.ubicacion || '') + '\')" ' +
            'style="cursor:pointer;border-bottom:1px solid #ddd;" ' +
            'onmouseover="this.style.background=\'#e0f7fa\'" onmouseout="this.style.background=\'#fff\'">' +
            '<td style="padding:10px;text-align:center;font-weight:bold;">' + s.numero + '</td>' +
            '<td style="padding:10px;">' + (s.ubicacion || '') + '</td>' +
            '</tr>';
    }

    html += '</tbody></table></div>' +
        '<div class="modal-buttons" style="margin-top:15px;">' +
        '<button class="btn" onclick="cerrarModal()">Cancelar</button>' +
        '</div></div>';

    modal.innerHTML = html;
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

function seleccionarSalon(numero, ubicacion) {
    var salonInput = document.getElementById('salon');
    var ubicacionInput = document.getElementById('salonUbicacion');

    if (salonInput) salonInput.value = numero;
    if (ubicacionInput) ubicacionInput.value = ubicacion;

    cerrarModal();
}

// =====================================================
// SELECTOR DE INSTRUMENTOS (MODAL LUPA)
// =====================================================
window.abrirSelectorInstrumento = function () {
    if (g_modalActual && g_modalActual !== 'modalSelectorInstrumentos') {
        console.warn('Ya hay un modal abierto:', g_modalActual);
        return;
    }
    
    var modal = document.getElementById('modalSelectorInstrumentos');
    if (modal) {
        modal.classList.add('active'); // CSS flag
        modal.style.display = 'flex';
        g_modalActual = 'modalSelectorInstrumentos';
        document.getElementById('inputBuscarInstrumento').value = '';
        buscarInstrumentosModal();
    }
};

window.cerrarSelectorInstrumento = function () {
    var modal = document.getElementById('modalSelectorInstrumentos');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
        g_modalActual = null;
    }
};

window.buscarInstrumentosModal = async function () {
    const term = document.getElementById('inputBuscarInstrumento').value.trim();
    if (!window.db) return;

    const tbody = document.getElementById('tablaInstrumentosModal');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="2" style="text-align:center;">Buscando...</td></tr>';

    try {
        let query = window.db.from('instrumentos').select('*');
        
        // El usuario solicitó traer todos los registros activos
        query = query.eq('activo', true);

        if (term) query = query.or(`clave.ilike.%${term}%,descripcion.ilike.%${term}%`);

        // Aumentamos el límite significativamente para asegurar que entren todos los registros
        const { data, error } = await query.order('descripcion').limit(500);
        if (error) throw error;

        tbody.innerHTML = '';
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="2" style="text-align:center;">No se encontraron instrumentos</td></tr>';
            return;
        }

        data.forEach(item => {
            const tr = document.createElement('tr');
            tr.style.cursor = 'pointer';
            tr.onclick = () => seleccionarInstrumento(item.clave, item.descripcion);
            tr.innerHTML = `<td>${item.clave}</td><td>${item.descripcion}</td>`;
            tr.onmouseover = function () { this.style.backgroundColor = '#000080'; this.style.color = 'white'; };
            tr.onmouseout = function () { this.style.backgroundColor = ''; this.style.color = ''; };
            tbody.appendChild(tr);
        });
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="2" style="text-align:center;color:red;">Error: ${e.message}</td></tr>`;
    }
};

window.seleccionarInstrumento = function (clave, desc) {
    var inClave = document.getElementById('instrumento_clave');
    var inDesc = document.getElementById('instrumento_desc');
    if (inClave) inClave.value = clave;
    if (inDesc) inDesc.value = desc;
    cerrarSelectorInstrumento();
};

// =====================================================
// VALIDACIONES
// =====================================================
function soloNumeros(input) {
    input.value = input.value.replace(/[^0-9]/g, '');
}

function validarPorcentaje(input) {
    var valor = input.value.replace(/[^0-9.]/g, '');
    var partes = valor.split('.');

    if (partes.length > 2) {
        valor = partes[0] + '.' + partes.slice(1).join('');
    }

    if (partes[1] && partes[1].length > 2) {
        valor = partes[0] + '.' + partes[1].substring(0, 2);
    }

    var num = parseFloat(valor);
    if (num > 100) {
        valor = '100';
    }

    input.value = valor;
}

function togglePorcentaje() {
    var beca = document.getElementById('beca');
    var porcentaje = document.getElementById('porcentaje');
    if (beca && porcentaje) {
        porcentaje.disabled = !beca.checked;
        if (!beca.checked) {
            porcentaje.value = '0.00%';
        }
    }
}

function calcularEdad() {
    var fechaNac = document.getElementById('fechaNacimiento');
    var edadInput = document.getElementById('edad');
    if (fechaNac && fechaNac.value && edadInput) {
        var hoy = new Date();
        var nacimiento = new Date(fechaNac.value);
        var edad = hoy.getFullYear() - nacimiento.getFullYear();
        var m = hoy.getMonth() - nacimiento.getMonth();
        if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
            edad--;
        }
        edadInput.value = edad;
    }
}

// =====================================================
// BÚSQUEDA DE ALUMNOS (ESTILO WINDOWS - REDIRIGIDO A STANDARDIZED LIST)
// =====================================================
function buscarAlumno() {
    window.open('alumnos-lista.html', 'AlumnosLista', 'width=1000,height=700');
}

function cerrarModalBusquedaAlumno() {
    // legacy
}

function cerrarModalResultadosAlumno() {
    document.getElementById('modalResultadosAlumno').style.display = 'none';
}

async function ejecutarBusquedaAlumno() {
    var termino = document.getElementById('inputBusquedaAlumno').value.trim().toUpperCase();

    if (!termino) {
        await mostrarAlerta('Ingrese un nombre o credencial para buscar');
        return;
    }

    cerrarModalBusquedaAlumno();

    g_terminoBusquedaAlumnos = termino;
    g_paginaActualAlumnos = 1;

    await cargarResultadosBusquedaAlumno();
}

async function cargarResultadosBusquedaAlumno() {
    const termino = g_terminoBusquedaAlumnos;
    const pagina = g_paginaActualAlumnos;
    const limite = 100;
    const desde = (pagina - 1) * limite;

    // Mostrar modal de resultados con mensaje de carga
    var tbody = document.getElementById('bodyResultadosAlumno');
    tbody.innerHTML = '<tr><td colspan="2" style="text-align:center;">Buscando...</td></tr>';
    document.getElementById('tituloResultadosAlumno').textContent = "Resultados de Búsqueda";
    document.getElementById('modalResultadosAlumno').style.display = 'block';

    if (!db) {
        tbody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:red;">Error: No hay conexión a la base de datos</td></tr>';
        return;
    }

    try {
        // Obtener total de resultados
        const countResult = await SessionManager.applyIsolation(db.from('alumnos').select('*', { count: 'exact', head: true }))
            .eq('activo', true)
            .or('nombre.ilike.%' + termino + '%,credencial::text.ilike.%' + termino + '%');

        if (countResult.error) throw countResult.error;

        g_totalResultadosAlumnos = countResult.count || 0;
        g_totalPaginasAlumnos = Math.ceil(g_totalResultadosAlumnos / limite);

        // Obtener datos paginados
        var result = await SessionManager.applyIsolation(db.from('alumnos').select('*'))
            .eq('activo', true)
            .or('nombre.ilike.%' + termino + '%,credencial::text.ilike.%' + termino + '%')
            .order('nombre')
            .range(desde, desde + limite - 1);

        if (result.error) {
            tbody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:red;">Error: ' + result.error.message + '</td></tr>';
            return;
        }

        if (!result.data || result.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="2" style="text-align:center;">No se encontraron alumnos registrados.</td></tr>';
            actualizarControlesPaginacionAlumnos();
            return;
        }

        mostrarResultadosAlumnoWindows(result.data, termino);
        actualizarControlesPaginacionAlumnos();
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:red;">Error: ' + e.message + '</td></tr>';
    }
}

function mostrarResultadosAlumnoWindows(resultados, termino) {
    var tbody = document.getElementById('bodyResultadosAlumno');
    tbody.innerHTML = '';

    document.getElementById('tituloResultadosAlumno').textContent = "Resultados de Búsqueda ('" + termino + "')";

    window._resultadosBusquedaAlumno = resultados;

    for (var i = 0; i < resultados.length; i++) {
        var alumno = resultados[i];
        var tr = document.createElement('tr');
        tr.style.cursor = 'pointer';
        tr.onclick = function () {
            var idx = parseInt(this.getAttribute('data-index'));
            var alumnoSel = window._resultadosBusquedaAlumno[idx];
            cerrarModalResultadosAlumno();
            mostrarAlumno(alumnoSel);
        };
        tr.setAttribute('data-index', i);
        tr.innerHTML = '<td>' + (alumno.nombre || '') + '</td><td>' + alumno.credencial + '</td>';
        tbody.appendChild(tr);
    }

    // El modal ya está mostrado desde ejecutarBusquedaAlumno
}

function actualizarControlesPaginacionAlumnos() {
    const controles = document.getElementById('paginacionControlesAlumnos');
    const info = document.getElementById('infoPaginaAlumnos');

    if (g_totalPaginasAlumnos <= 1) {
        controles.style.display = 'none';
        return;
    }

    controles.style.display = 'flex';
    info.textContent = `Página ${g_paginaActualAlumnos} de ${g_totalPaginasAlumnos} `;

    // Habilitar/deshabilitar botones
    document.querySelector('button[onclick="irPrimeraPaginaAlumnos()"]').disabled = g_paginaActualAlumnos === 1;
    document.querySelector('button[onclick="irPaginaAnteriorAlumnos()"]').disabled = g_paginaActualAlumnos === 1;
    document.querySelector('button[onclick="irPaginaSiguienteAlumnos()"]').disabled = g_paginaActualAlumnos === g_totalPaginasAlumnos;
    document.querySelector('button[onclick="irUltimaPaginaAlumnos()"]').disabled = g_paginaActualAlumnos === g_totalPaginasAlumnos;
}

function irPrimeraPaginaAlumnos() {
    if (g_paginaActualAlumnos > 1) {
        g_paginaActualAlumnos = 1;
        cargarResultadosBusquedaAlumno();
    }
}

function irPaginaAnteriorAlumnos() {
    if (g_paginaActualAlumnos > 1) {
        g_paginaActualAlumnos--;
        cargarResultadosBusquedaAlumno();
    }
}

function irPaginaSiguienteAlumnos() {
    if (g_paginaActualAlumnos < g_totalPaginasAlumnos) {
        g_paginaActualAlumnos++;
        cargarResultadosBusquedaAlumno();
    }
}

function irUltimaPaginaAlumnos() {
    if (g_paginaActualAlumnos < g_totalPaginasAlumnos) {
        g_paginaActualAlumnos = g_totalPaginasAlumnos;
        cargarResultadosBusquedaAlumno();
    }
}

function actualizarVistaGruposPendientes() {
    const tbody = document.getElementById('listaGruposPendientes');
    if (!tbody) return;

    if (g_gruposPendientesAlta.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:10px;">No hay grupos seleccionados</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    g_gruposPendientesAlta.forEach((g, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="padding:5px; text-align:center;">${g.clave}</td>
            <td style="padding:5px; text-align:center;">${g.salon_id || ''}</td>
            <td style="padding:5px; text-align:center;">${g.horario || ''}</td>
            <td style="padding:5px; text-align:center;">
                <button type="button" class="btn-action" style="padding:2px 5px; background:#d9534f; color:white; border:none; cursor:pointer;" onclick="removerGrupoPendiente(${index})">Remover</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function removerGrupoPendiente(index) {
    g_gruposPendientesAlta.splice(index, 1);
    actualizarVistaGruposPendientes();
}

function agregarGrupoAlCarrito(grupo) {
    // Evitar duplicados
    if (g_gruposPendientesAlta.some(g => g.clave === grupo.clave)) {
        mostrarAlerta('Este grupo ya está en la lista de inscripción.');
        return;
    }

    g_gruposPendientesAlta.push({
        id: grupo.id,
        clave: grupo.clave,
        salon_id: grupo.salon_id,
        grado: grupo.cursos ? grupo.cursos.grado : 1, // Obtener grado del curso
        horario: (grupo.hora_entrada || '') + ' - ' + (grupo.hora_salida || '')
    });
    actualizarVistaGruposPendientes();
    cerrarSelectorGrupo();
}

function mostrarAlumno(alumno) {
    alumnoSeleccionado = alumno;

    setVal('credencial', alumno.credencial);
    setVal('digito', alumno.dig_ver || 0);
    setVal('nombre', alumno.nombre);
    setVal('direccion1', alumno.direccion1);
    setVal('direccion2', alumno.direccion2);
    setVal('celular', alumno.celular);
    setVal('telefono', alumno.telefono);
    setVal('email', alumno.email);
    setVal('fechaNacimiento', formatearFecha(alumno.fecha_nacimiento));
    setVal('fechaIngreso', formatearFecha(alumno.fecha_ingreso));
    setVal('edad', alumno.edad);
    setVal('nombrePadre', alumno.nombre_padre);
    setVal('celularPadre', alumno.telefono_padre);
    setVal('nombreMadre', alumno.nombre_madre);
    setVal('celularMadre', alumno.telefono_madre);
    
    // Grado Dinámico: EL CURSO MANDA SOBRE EL ALUMNO
    let gradoCalculado = alumno.grado || '1';
    if (window.g_inscripcionesActivas && window.g_inscripcionesActivas.length > 0) {
        const ag = window.g_inscripcionesActivas[0];
        const infoGrupo = ag.grupos || {};
        // Buscar en el mapa de cursos global por el ID vinculado al grupo
        const cursoInfo = (window.g_cursoMap && infoGrupo.curso_id) ? window.g_cursoMap[String(infoGrupo.curso_id)] : null;
        
        if (cursoInfo) {
            gradoCalculado = cursoInfo.grado; // Si hay curso, su grado es la ley
        } else {
            gradoCalculado = infoGrupo.grado || ag.grado || alumno.grado;
        }
    }
    setVal('grado', gradoCalculado || '1');
    setVal('gradoActual', gradoCalculado || '1');
    setVal('comentario', alumno.comentario);
    setVal('instrumento_clave', alumno.instrumento_clave);
    setVal('instrumento', alumno.instrumento_clave);
    if (alumno.instrumento_clave && window.db) {
        window.db.from('instrumentos').select('descripcion').eq('clave', alumno.instrumento_clave).maybeSingle()
            .then(res => {
                if (res.data) setVal('instrumento_desc', res.data.descripcion);
            }).catch(e => console.warn('Instrumento no encontrado:', e.message));
    }
    setVal('medio', alumno.medio_clave);
    if (alumno.medio_clave && window.db) {
        window.db.from('medios_contacto').select('descripcion').eq('clave', alumno.medio_clave).maybeSingle()
            .then(res => {
                if (res.data) setVal('medio', res.data.descripcion);
            }).catch(e => console.warn('Medio no encontrado:', e.message));
    }

    setCheck('beca', alumno.beca);
    setVal('porcentaje', (alumno.porcentaje_beca || 0).toFixed(2) + '%');
    setCheck('reingreso', alumno.reingreso);

    // Cargar Grupos Inscritos
    cargarGruposInscritos(alumno.id);

    // Cargar Último Pago (campo de resumen)
    cargarUltimoPago(alumno.id);

    // Cargar Historial Completo de Pagos y Exámenes
    cargarHistorialPagos(alumno.id);
    cargarHistorialExamenes(alumno.id);

    console.log('Alumno mostrado:', alumno.nombre);
}

/**
 * Carga el historial de exámenes del alumno desde la vista v_examenes_alumno
 */
async function cargarHistorialExamenes(alumnoId) {
    const tbody = document.getElementById('bodyHistorialExamenes');
    if (!tbody || !db || !alumnoId) return;

    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Cargando exámenes...</td></tr>';

    try {
        const { data, error } = await SessionManager.applyIsolation(db.from('v_examenes_alumno').select('*'))
            .eq('alumno_id', alumnoId)
            .order('fecha', { ascending: false });

        if (error) throw error;

        tbody.innerHTML = '';
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px;">Sin registro de exámenes</td></tr>';
            return;
        }

        data.forEach(ex => {
            const tr = document.createElement('tr');
            const statusClass = ex.status === 'PAGADO' ? 'status-green' : (ex.status === 'CALIFICADO' ? 'status-blue' : 'status-red');
            
            // Botón de pago si está pendiente
            let btnPagar = '';
            if (ex.status === 'PENDIENTE DE PAGO') {
                const precio = ex.precio_unitario || 0;
                btnPagar = `<button class="premium-btn btn-primary" style="padding: 2px 8px; font-size: 11px; margin-left: 10px;" onclick="irAPagarExamen('${alumnoId}', '${ex.clave_examen}', ${precio}, '${ex.examen_id}')">PAGAR</button>`;
            }

            tr.innerHTML = `
                <td style="text-align:center;">${ex.credencial}</td>
                <td style="text-align:center;">${ex.clave_examen}</td>
                <td style="text-align:center;">${formatearFecha(ex.fecha)}</td>
                <td style="text-align:center;">${ex.hora}</td>
                <td>${ex.maestro_nombre || '—'}</td>
                <td style="text-align:center; font-weight:bold;">${ex.calificacion || '—'}</td>
                <td style="text-align:center;">
                    <div style="display:flex; align-items:center; justify-content:center;">
                        <span class="status-pill ${statusClass}">${ex.status}</span>
                        ${btnPagar}
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error('Error cargando exámenes:', e);
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:red;">Error al cargar datos</td></tr>';
    }
}

/**
 * Redirige al módulo de cobros con los datos del examen
 */
window.irAPagarExamen = function(alumnoId, clave, costo, examenId) {
    // Usamos 'monto' para compatibilidad con el receptor de cobros.js
    const concepto = encodeURIComponent(`EXAMEN ${clave}`);
    // Corrección de ruta: cobros.html está en la misma carpeta raíz que alumnos.html
    const url = `cobros.html?alumno_id=${alumnoId}&concepto=${concepto}&monto=${costo}&tipo=EXAMEN&ref_id=${examenId}&iva=0`;
    window.location.href = url;
}

/**
 * Busca el último pago (recibo) del alumno y muestra fecha y monto
 */
async function cargarUltimoPago(alumnoId) {
    if (!db || !alumnoId) return;

    const fechaEl = document.getElementById('ultimoPagoFecha');
    const montoEl = document.getElementById('ultimoPagoMonto');

    if (fechaEl) fechaEl.value = 'Buscando...';
    if (montoEl) montoEl.value = '...';

    try {
        // Buscar el recibo más reciente en recibos_detalle para este alumno
        // Unimos con la tabla recibos (cabecera) para obtener la fecha y total
        const { data, error } = await SessionManager.applyIsolation(db.from('recibos_detalle').select(`
                recibo_id,
                neto,
                recibos (
                    fecha,
                    total,
                    cancelado
                )
            `))
            .eq('alumno_id', alumnoId)
            .eq('recibos.cancelado', false)
            .order('created_at', { ascending: false })
            .limit(1);

        if (error) throw error;

        if (data && data.length > 0) {
            const pago = data[0];
            const fechaRecibo = pago.recibos ? pago.recibos.fecha : null;
            const montoRecibo = pago.neto; // Usamos el neto de la línea de detalle o el total del recibo? 
            // El usuario pidió "información de su último pago". Generalmente se refiere a la fecha y monto total cobrado.
            
            if (fechaEl) fechaEl.value = formatearFecha(fechaRecibo);
            if (montoEl) montoEl.value = '$' + (parseFloat(montoRecibo) || 0).toFixed(2);
        } else {
            if (fechaEl) fechaEl.value = 'Ninguno';
            if (montoEl) montoEl.value = '$0.00';
        }
    } catch (e) {
        console.error('Error al cargar último pago:', e);
        if (fechaEl) fechaEl.value = 'Error';
    }
}

async function cargarGruposInscritos(alumnoId) {
    const tbody = document.getElementById('bodyGruposInscritos');
    if (!tbody || !db) return;

    try {
        const { data: inscripciones, error: errInsc } = await SessionManager.applyIsolation(db.from('alumno_grupos').select('id, alumno_id, grupo_id, curso_id, grupo_clave, curso_clave, estado, grupos(id, curso_id, grado, costo_mensual, salon_id, salon, hora_entrada, hora_salida)'))
            .eq('alumno_id', alumnoId)
            .in('estado', ['Activo', 'activo', 'Finalizado', 'finalizado']);

        if (errInsc) throw errInsc;

        // 2. Obtener cursos para mapear nombres y grados (Resiliencia con String IDs)
        const { data: todosLosCursos } = await SessionManager.applyIsolation(db.from('cursos').select('*'));
        const cursoMap = {};
        if (todosLosCursos) todosLosCursos.forEach(c => { cursoMap[String(c.id)] = c; });

        // Guardar en window para mostrarAlumno
        window.g_inscripcionesActivas = inscripciones || [];
        window.g_cursoMap = cursoMap;

        // 3. Obtener SEGUIMIENTO de pagos
        const { data: seguimiento } = await SessionManager.applyIsolation(db.from('v_seguimiento_pagos').select('*'))
            .eq('alumno_id', alumnoId);

        g_seguimientoCache = seguimiento || [];

        tbody.innerHTML = '';

        if (!inscripciones || inscripciones.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 10px;">Sin grupos activos</td></tr>';
        } else {
            inscripciones.forEach(g => {
                const infoGrupo = g.grupos || {};
                const cursoIdKey = String(infoGrupo.curso_id || '');
                const cursoInfo = cursoMap[cursoIdKey] || {};
                
                // FALLBACK: Si no hay curso vinculado, usar datos del grupo
                const nombreCurso = cursoInfo.curso || (infoGrupo.cursos ? infoGrupo.cursos.curso : (infoGrupo.curso || 'Sin curso vinculado'));
                const gradoAMostrar = cursoInfo.grado || infoGrupo.grado || g.grado || '1';
                const costoBase = cursoInfo.costo || (infoGrupo.cursos ? infoGrupo.cursos.precio_mensual : (infoGrupo.costo_mensual || 0));
                
                // Mapeo de datos del grupo
                const salon = infoGrupo.salon_id || infoGrupo.salon || '-';
                const horario = (infoGrupo.hora_entrada || '') + ' - ' + (infoGrupo.hora_salida || '');
                
                // Costo mensual real (Costo - Beca)
                const porcentajeBeca = alumnoSeleccionado ? (alumnoSeleccionado.porcentaje_beca || 0) : 0;
                const costoFinal = costoBase * (1 - porcentajeBeca / 100);
                
                // Estatus de pago para este grupo específico
                const segGrupo = g_seguimientoCache.filter(s => s.grupo_clave === g.grupo_clave);
                
                const tieneDeuda = segGrupo.some(s => s.estatus === 'deuda');
                const iconColor = tieneDeuda ? '#ef4444' : '#10b981';
                const iconAnimation = tieneDeuda ? 'animation: pulse 2s infinite;' : '';

                const calendarHtml = `
                    <div class="calendar-status" onclick="abrirDetallePagos('${g.grupo_clave}', '${nombreCurso}')" 
                         style="cursor:pointer; display:inline-flex; align-items:center; gap:8px; padding:6px 12px; border-radius:8px; background:var(--bg-secondary); border:1px solid var(--border-color); ${iconAnimation}">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        <span style="font-size:0.8rem; font-weight:600; color:${iconColor};">${tieneDeuda ? 'DEUDOR' : 'AL CORRIENTE'}</span>
                    </div>
                `;

                // Estilo para grupos finalizados
                const esFinalizado = g.estado.toLowerCase() === 'finalizado';
                const opacity = esFinalizado ? 'opacity: 0.6;' : '';
                const badgeEstado = esFinalizado ? '<br><span style="background:#6b7280; color:white; font-size:9px; padding:2px 6px; border-radius:10px;">FINALIZADO</span>' : '';

                const tr = document.createElement('tr');
                tr.style.cssText = opacity;
                tr.innerHTML = `
                    <td style="padding: 10px; text-align: center;">${g.credencial_vinculada || ''}</td>
                    <td style="padding: 10px; text-align: center; font-weight: 600;">
                        ${g.grupo_clave}${badgeEstado}<br>
                        <small style="color:var(--text-muted); font-weight:normal;">${nombreCurso}</small>
                    </td>
                    <td style="padding: 10px; text-align: center;">${salon}</td>
                    <td style="padding: 10px; text-align: center;">${horario}</td>
                    <td style="padding: 10px; text-align: center; font-weight: bold; color: var(--primary-color);">${gradoAMostrar}</td>
                    <td style="padding: 10px; text-align: center;">${calendarHtml}</td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (e) {
        console.error('Error cargando grupos inscritos:', e);
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red; padding: 10px;">Error: ${e.message}</td></tr>`;
    }
}

function obtenerUbicacionSalon(numero) {
    if (!numero) return '';
    for (var i = 0; i < salonesCache.length; i++) {
        if (salonesCache[i].numero == numero) {
            return salonesCache[i].ubicacion || '';
        }
    }
    return '';
}

function setVal(id, valor) {
    var el = document.getElementById(id);
    if (el) el.value = valor || '';
}

function setCheck(id, valor) {
    var el = document.getElementById(id);
    if (el) el.checked = valor || false;
}

function formatearFecha(fecha) {
    if (!fecha) return '';
    var d = new Date(fecha);
    var dia = String(d.getDate()).padStart(2, '0');
    var mes = String(d.getMonth() + 1).padStart(2, '0');
    var anio = d.getFullYear();
    return dia + '/' + mes + '/' + anio;
}

function obtenerNombreGrupo(clave) {
    for (var i = 0; i < gruposCache.length; i++) {
        if (gruposCache[i].clave === clave) {
            return gruposCache[i].cursos ? gruposCache[i].cursos.curso : '';
        }
    }
    return '';
}

function cerrarModal() {
    var modales = document.querySelectorAll('.modal');
    for (var i = 0; i < modales.length; i++) {
        modales[i].remove();
    }
    if (typeof habilitarInputs === 'function') habilitarInputs();
}

// =====================================================
// LISTA DE ALUMNOS (REDIRIGIDO A STANDARDIZED LIST)
// =====================================================
function listaAlumnos() {
    window.open('alumnos-lista.html', 'AlumnosLista', 'width=1000,height=700');
}

async function cargarListaCompleta() {
    var contenedor = document.getElementById('contenedorLista');

    if (!db) {
        contenedor.innerHTML = '<p>No hay conexión a la base de datos</p>';
        return;
    }

    try {
        var result = await SessionManager.applyIsolation(db.from('alumnos').select('*')).eq('activo', true).order('nombre');

        if (result.error) {
            contenedor.innerHTML = '<p>Error: ' + result.error.message + '</p>';
            return;
        }

        if (!result.data || result.data.length === 0) {
            contenedor.innerHTML = '<p>No hay alumnos registrados</p>';
            return;
        }

        window._listaAlumnos = result.data;

        var html = '<table style="width:100%;border-collapse:collapse;">' +
            '<thead><tr style="background:#333;color:#fff;position:sticky;top:0;">' +
            '<th style="padding:8px;">Cred.</th>' +
            '<th style="padding:8px;">Nombre</th>' +
            '<th style="padding:8px;">Grupo</th>' +
            '<th style="padding:8px;">Celular</th>' +
            '</tr></thead><tbody>';

        for (var i = 0; i < result.data.length; i++) {
            var a = result.data[i];
            html += '<tr onclick="seleccionarDeLista(' + i + ')" style="cursor:pointer;border-bottom:1px solid #ddd;">' +
                '<td style="padding:6px;">' + a.credencial + '</td>' +
                '<td style="padding:6px;">' + (a.nombre || '') + '</td>' +
                '<td style="padding:6px;">' + (a.grupo_clave || '') + '</td>' +
                '<td style="padding:6px;">' + (a.celular || '') + '</td>' +
                '</tr>';
        }

        html += '</tbody></table>';
        contenedor.innerHTML = html;

    } catch (e) {
        contenedor.innerHTML = '<p>Error: ' + e.message + '</p>';
    }
}

function seleccionarDeLista(index) {
    var alumno = window._listaAlumnos[index];
    cerrarModal();
    mostrarAlumno(alumno);
}

// =====================================================
// ALTA DE ALUMNOS
// =====================================================
async function guardarAlta() {
    var nombre = document.getElementById('nombre');
    if (!nombre || !nombre.value.trim()) {
        await mostrarAlerta('El nombre es obligatorio');
        return;
    }

    if (!db) {
        await mostrarAlerta('No hay conexión a la base de datos');
        return;
    }

    // Obtener siguiente credencial
    var maxResult = await SessionManager.applyIsolation(db.from('alumnos').select('credencial')).order('credencial', { ascending: false }).limit(1);
    var nuevaCredencial = 3779;
    if (maxResult.data && maxResult.data.length > 0) {
        nuevaCredencial = maxResult.data[0].credencial + 1;
    }

    var datos = {
        credencial: nuevaCredencial,
        dig_ver: 0,
        nombre: nombre.value.trim().toUpperCase(),
        direccion1: getVal('direccion1'),
        direccion2: getVal('direccion2'),
        celular: getVal('celular'),
        telefono: getVal('telefono'),
        email: getVal('email'),
        fecha_nacimiento: getVal('fechaNacimiento') || null,
        edad: parseInt(getVal('edad')) || null,
        fecha_ingreso: getVal('fechaIngreso') || new Date().toISOString().split('T')[0],
        nombre_padre: getVal('nombrePadre'),
        telefono_padre: getVal('celularPadre'),
        nombre_madre: getVal('nombreMadre'),
        telefono_madre: getVal('celularMadre'),
        grupo_clave: g_gruposPendientesAlta.length > 0 ? g_gruposPendientesAlta[0].clave : '',
        salon: g_gruposPendientesAlta.length > 0 ? (g_gruposPendientesAlta[0].salon_id || g_gruposPendientesAlta[0].salon) : '',
        comentario: getVal('comentario'),
        reingreso: document.getElementById('reingreso') ? document.getElementById('reingreso').checked : false,
        instrumento_clave: getVal('instrumento_clave'),
        medio_clave: getVal('medio'),
        beca: document.getElementById('beca') ? document.getElementById('beca').checked : false,
        porcentaje_beca: parseFloat(getVal('porcentaje').replace('%', '')) || 0,
        grado: g_gruposPendientesAlta.length > 0 ? g_gruposPendientesAlta[0].grado : 1,
        activo: true
    };

    try {
        // 1. Guardar Alumno
        // Agregar ID de organización
        datos.organizacion_id = SessionManager.getCurrentUser()?.organizacion_id;

        const { data: alumnoCreated, error: errorAlumno } = await db.from('alumnos').insert([datos]).select();
        
        if (errorAlumno) {
            console.error('Error Supabase (Alumnos):', errorAlumno);
            let msg = errorAlumno.message || 'Error desconocido';
            if (errorAlumno.details) msg += ' - ' + errorAlumno.details;
            if (errorAlumno.hint) msg += ' - ' + errorAlumno.hint;
            throw new Error(msg);
        }

        if (!alumnoCreated || alumnoCreated.length === 0) {
            throw new Error('No se recibió confirmación del alumno creado.');
        }

        const newAlumnoId = alumnoCreated[0].id;

        // 2. Guardar Inscripciones en alumno_grupos
        if (g_gruposPendientesAlta.length > 0) {
            const inscripciones = g_gruposPendientesAlta.map(g => ({
                alumno_id: newAlumnoId,
                grupo_clave: g.clave,
                credencial_vinculada: datos.credencial,
                grado: g.grado || 1,
                estado: 'Activo'
            }));

            const { error: errorGrupos } = await db.from('alumno_grupos').insert(inscripciones);
            
            if (errorGrupos) {
                console.error('Error Supabase (Grupos):', errorGrupos);
                throw new Error('Alumno creado, pero falló la inscripción a grupos: ' + errorGrupos.message);
            }

            // Sincronizar contadores
            for (const g of g_gruposPendientesAlta) {
                 await sincronizarContadorGrupo(g.clave);
            }
        }

        await mostrarAlerta('Alumno guardado exitosamente con sus grupos');
        window.location.href = 'alumnos.html';
    } catch (e) {
        console.error('Fallo en guardarAlta:', e);
        // MOSTRAR ALERTA OBLIGATORIA CON DETALLE
        await mostrarAlerta('FALLO EN ALTA: ' + e.message);
    }
}

function getVal(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
}

async function cancelarAlta() {
    var confirma = await mostrarConfirm('¿Cancelar el alta del alumno?');
    if (confirma) {
        window.location.href = 'alumnos.html';
    }
}

// =====================================================
// EXPOSICIÓN DE FUNCIONES PARA VENTANAS AMIGAS
// =====================================================
window.cargarAlumnoDesdeVentana = async function (alumno) {
    if (alumno && alumno.id) {
        console.log('Recibido alumno desde ventana:', alumno);
        // Asignación explícita a la variable global
        alumnoSeleccionado = alumno;
        
        // 1. Cargar grupos primero para que el grado sea el correcto
        await cargarGruposInscritos(alumno.id);
        
        // 2. Mostrar datos en la ficha
        mostrarAlumno(alumno);
        window.focus();
        // Disparar evento para actualizar UI si es necesario
        // habilitarBotones(true); // Si existiera
    } else {
        console.error('Alumno recibido incompleto:', alumno);
        mostrarAlerta('Error: Los datos del alumno seleccionado están incompletos.');
    }
};

// =====================================================
// EDICIÓN DE ALUMNOS
// =====================================================
function irAEdicion() {
    if (!alumnoSeleccionado) {
        mostrarAlerta('Primero busque y seleccione un alumno');
        return;
    }
    sessionStorage.setItem('alumnoEditar', JSON.stringify(alumnoSeleccionado));
    window.location.href = 'alumnos-edicion.html';
}

function buscarParaEditar() {
    buscarAlumno();
}

async function guardarEdicion() {
    if (!alumnoEditando) {
        await mostrarAlerta('No hay alumno seleccionado para editar');
        return;
    }

    if (!db) {
        await mostrarAlerta('No hay conexión a la base de datos');
        return;
    }

    var datos = {
        nombre: getVal('nombre').toUpperCase(),
        direccion1: getVal('direccion1'),
        direccion2: getVal('direccion2'),
        celular: getVal('celular'),
        telefono: getVal('telefono'),
        email: getVal('email'),
        fecha_nacimiento: getVal('fechaNacimiento') || null,
        nombre_padre: getVal('nombrePadre'),
        telefono_padre: getVal('celularPadre'),
        nombre_madre: getVal('nombreMadre'),
        telefono_madre: getVal('celularMadre'),
        comentario: getVal('comentario'),
        reingreso: document.getElementById('reingreso') ? document.getElementById('reingreso').checked : false,
        instrumento_clave: getVal('instrumento_clave'),
        medio_clave: getVal('medio'),
        beca: document.getElementById('beca') ? document.getElementById('beca').checked : false,
        porcentaje_beca: parseFloat(getVal('porcentaje').replace('%', '')) || 0,
    };

    try {
        var result = await SessionManager.applyIsolation(db.from('alumnos').update(datos)).eq('id', alumnoEditando.id);

        if (result.error) {
            await mostrarAlerta('Error al guardar: ' + result.error.message);
            return;
        }

        await mostrarAlerta('Datos actualizados correctamente');
        window.location.href = 'alumnos.html';
    } catch (e) {
        await mostrarAlerta('Error: ' + e.message);
    }
}

async function cancelarEdicion() {
    var confirma = await mostrarConfirm('¿Cancelar la edición?');
    if (confirma) {
        window.location.href = 'alumnos.html';
    }
}

// =====================================================
// BAJA DE ALUMNOS CON MOTIVO
// =====================================================
async function cargarGruposActivosParaBaja(alumnoId) {
    const listContainer = document.getElementById('bajaGruposActivosList');
    if (!listContainer) return;
    listContainer.innerHTML = 'Cargando grupos...';

    try {
        const { data, error } = await SessionManager.applyIsolation(db
            .from('alumno_grupos')
            .select(`
                *,
                grupos (
                    *,
                    cursos (
                        curso,
                        costo,
                        grado
                    )
                )
            `))
            .eq('alumno_id', alumnoId)
            .eq('estado', 'Activo');

        if (error) throw error;

        if (!data || data.length === 0) {
            listContainer.innerHTML = '<p style="color:red">El alumno no tiene grupos activos.</p>';
            return;
        }

        let html = '<div style="margin-top:10px;">';
        data.forEach(g => {
            html += `
                <div style="border:1px solid #ccc; padding:8px; margin-bottom:5px; border-radius:4px; display:flex; justify-content:space-between; align-items:center; background: white;">
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; width: 100%;">
                        <input type="checkbox" name="grupoBaja" value="${g.id}" data-clave="${g.grupo_clave}" style="width: 20px; height: 20px;">
                        <span><strong>${g.grupo_clave}</strong> (${g.credencial_vinculada || 'Sin cred.'})</span>
                    </label>
                </div>
            `;
        });
        listContainer.innerHTML = html;

        // --- SECCIÓN DE PROMOCIÓN REMOVIDA (Solicitud Usuario) ---
        const seccionProm = document.getElementById('seccionPromocion');
        if (seccionProm) seccionProm.style.display = 'none';
        // --------------------------------------------------------
    } catch (e) {
        console.error('Error cargando grupos para baja:', e);
        listContainer.innerHTML = '<p style="color:red">Error al cargar grupos.</p>';
    }
}

async function procesarBajaMasiva() {
    const listContainer = document.getElementById('bajaGruposActivosList');
    const checkboxes = listContainer.querySelectorAll('input[type="checkbox"]:checked');

    const hasGroups = listContainer.querySelector('input[type="checkbox"]');
    
    if (hasGroups && checkboxes.length === 0) {
        await mostrarAlerta('El alumno tiene grupos activos. Debe seleccionar al menos uno para procesar el retiro.');
        return;
    }

    const motivo = document.getElementById('selectMotivoBaja').value;
    const observaciones = document.getElementById('descripcionBaja').value.trim();

    if (!motivo) {
        await mostrarAlerta('Por favor, seleccione un motivo de baja válido.');
        return;
    }

    const message = hasGroups 
        ? `¿Está seguro de procesar el retiro del alumno de los ${checkboxes.length} grupo(s) seleccionados?` 
        : `El alumno no tiene grupos activos. ¿Desea marcarlo como INACTIVO globalmente?`;

    const confirma = await mostrarConfirm(message);
    if (!confirma) {
        return;
    }

    const promotes = document.getElementById('chkPromover')?.checked || false;
    const nuevoGrado = document.getElementById('nuevoGradoBaja')?.value;
    const nextCursoId = document.getElementById('idSiguienteBaja')?.value;

    let errores = [];
    let procesados = 0;

    for (const cb of checkboxes) {
        const inscripcionId = cb.value;
        const grupoClave = cb.getAttribute('data-clave');

        try {
            const { error } = await SessionManager.applyIsolation(db
                .from('alumno_grupos')
                .update({
                    estado: 'Baja',
                    fecha_baja: new Date().toISOString().split('T')[0],
                    motivo_baja: motivo || null,
                    observaciones_baja: observaciones || null
                }))
                .eq('id', inscripcionId);

            if (error) throw error;

            // Sincronizar contador
            await sincronizarContadorGrupo(grupoClave);

            procesados++;
        } catch (e) {
            console.error(`Error en baja de ${grupoClave}:`, e);
            errores.push(grupoClave);
        }
    }

    // Después de procesar todas las bajas, verificar si al alumno le quedan grupos ACTIVOS
    if (alumnoSeleccionado) {
        try {
            const { data: activosRestantes } = await SessionManager.applyIsolation(db
                .from('alumno_grupos')
                .select('id'))
                .eq('alumno_id', alumnoSeleccionado.id)
                .eq('estado', 'Activo');

            if (!activosRestantes || activosRestantes.length === 0) {
                // Si ya no tiene grupos activos, marcar al alumno como inactivo globalmente
                console.log('El alumno no tiene más grupos activos. Marcando como inactivo...');
                await SessionManager.applyIsolation(db.from('alumnos').update({
                    activo: promotes, // CORREGIDO: si se promueve queda activo, si no, inactivo
                    fecha_baja: promotes ? null : new Date().toISOString().split('T')[0],
                    motivo_baja_id: (motivo && motivo.length > 5) ? motivo : null,
                    grado: promotes && nuevoGrado ? nuevoGrado : alumnoSeleccionado.grado
                })).eq('id', alumnoSeleccionado.id);

                // INSERTAR EN HISTÓRICO DE BAJAS
                if (!promotes) {
                    await db.from('alumnos_bajas').insert([{
                        alumno_id: alumnoSeleccionado.id,
                        credencial: alumnoSeleccionado.credencial,
                        nombre: alumnoSeleccionado.nombre,
                        fecha_ingreso: alumnoSeleccionado.fecha_ingreso,
                        fecha_baja: new Date().toISOString().split('T')[0],
                        motivo_baja_id: (motivo && motivo.length > 10) ? motivo : null,
                        motivo_descripcion: observaciones,
                        comentario: 'Baja automática desde sistema',
                        organizacion_id: SessionManager.getCurrentUser()?.organizacion_id
                    }]);
                }
            }

            // --- LÓGICA DE PROMOCIÓN ACTUALIZAR ALUMNO ---
            if (promotes) {
                const updateAl = {
                    activo: true,
                    grado: nuevoGrado || alumnoSeleccionado.grado,
                    fecha_baja: null,
                    motivo_baja_id: null
                };
                await SessionManager.applyIsolation(db.from('alumnos').update(updateAl)).eq('id', alumnoSeleccionado.id);
                console.log('Alumno promovido a grado:', nuevoGrado);
            }
        } catch (err) {
            console.error('Error actualizando estado global del alumno:', err);
        }

        await mostrarAlerta('Baja procesada exitosamente.' + (promotes ? ' El alumno ha sido promovido.' : ''));
        cargarGruposInscritos(alumnoSeleccionado.id);
    }
    cerrarModalBaja();
}

function cerrarModalBaja() {
    const modal = document.getElementById('modalBaja');
    if (modal) {
        modal.style.display = 'none';
        g_modalActual = null;
    }
}

async function confirmarBaja() {
    if (!alumnoSeleccionado) {
        await mostrarAlerta('Primero busque y seleccione un alumno');
        return;
    }

    if (g_modalActual) {
        await mostrarAlerta('Cierre la ventana actual antes de abrir otra operación.');
        return;
    }

    // Mostrar información en el modal
    if (document.getElementById('bajaNombreAlumno')) document.getElementById('bajaNombreAlumno').textContent = alumnoSeleccionado.nombre;
    if (document.getElementById('bajaCredencial')) document.getElementById('bajaCredencial').textContent = alumnoSeleccionado.credencial;

    // Cargar grupos activos para seleccionar
    await cargarGruposActivosParaBaja(alumnoSeleccionado.id);

    // Cargar motivos de baja
    const { data: motivos, error: errM } = await SessionManager.applyIsolation(db.from('motivos_baja').select('*'));
    const selectMotivo = document.getElementById('selectMotivoBaja');
    if (selectMotivo && motivos) {
        selectMotivo.innerHTML = '<option value="">-- Seleccione un motivo --</option>';
        motivos.forEach(m => {
            selectMotivo.innerHTML += `<option value="${m.id}">${m.descripcion}</option>`;
        });
    }

    if (document.getElementById('selectMotivoBaja')) document.getElementById('selectMotivoBaja').value = '';
    if (document.getElementById('descripcionBaja')) document.getElementById('descripcionBaja').value = '';

    const modal = document.getElementById('modalBaja');
    if (modal) {
        modal.style.display = 'flex';
        g_modalActual = 'modalBaja';
        
        // Aseguramos que la sección de promoción esté oculta al abrir
        const seccionProm = document.getElementById('seccionPromocion');
        if (seccionProm) seccionProm.style.display = 'none';
    }
}

// =====================================================
// CAMBIO DE GRUPO
// =====================================================
async function abrirCambioGrupo() {
    if (!alumnoSeleccionado) {
        await mostrarAlerta('Primero busque y seleccione un alumno.');
        return;
    }

    if (g_modalActual) {
        await mostrarAlerta('Cierre la ventana actual antes de abrir otra operación.');
        return;
    }

    document.getElementById('cambioAlumnoNombre').textContent = alumnoSeleccionado.nombre;
    document.getElementById('cambioAlumnoCred').textContent = alumnoSeleccionado.credencial;

    // Limpiar campos
    document.getElementById('cambioNuevoGrupoClave').value = '';
    document.getElementById('cambioNuevoGrupoId').value = '';

    const listContainer = document.getElementById('cambioGruposOrigenList');
    listContainer.innerHTML = 'Cargando...';

    try {
        const { data, error } = await SessionManager.applyIsolation(db
            .from('alumno_grupos')
            .select('id, grupo_clave, credencial_vinculada'))
            .eq('alumno_id', alumnoSeleccionado.id)
            .eq('estado', 'Activo');

        if (error) throw error;

        if (!data || data.length === 0) {
            listContainer.innerHTML = '<p style="color:red">No hay grupos activos para cambiar.</p>';
            return;
        }

        let html = '';
        data.forEach(g => {
            html += `
                <div style="padding: 10px; border-bottom: 1px solid #eee;">
                    <label style="cursor:pointer; display:flex; gap:10px; align-items:center;">
                        <input type="radio" name="grupoOrigen" value="${g.id}" data-clave="${g.grupo_clave}" style="width:18px; height:18px;">
                        <span><strong>${g.grupo_clave}</strong> (${g.credencial_vinculada || 'Sin cred.'})</span>
                    </label>
                </div>
            `;
        });
        listContainer.innerHTML = html;
        const modal = document.getElementById('modalCambioGrupo');
        if (modal) {
            modal.style.display = 'flex';
            g_modalActual = 'modalCambioGrupo';
        }
    } catch (err) {
        console.error('Error cargando grupos origen:', err);
        listContainer.innerHTML = 'Error al cargar grupos.';
    }
}

function cerrarModalCambio() {
    const modal = document.getElementById('modalCambioGrupo');
    if (modal) {
        modal.style.display = 'none';
        g_modalActual = null;
    }
}

function abrirSelectorGrupoCambio() {
    // Abrir el selector de grupos existente
    if (typeof abrirSelectorGrupo === 'function') {
        abrirSelectorGrupo();
    } else {
        const modal = document.getElementById('modalSelectorGrupos');
        if (modal) modal.style.display = 'flex';
        if (typeof buscarGruposModal === 'function') buscarGruposModal();
    }
}

async function guardarCambioGrupoDefinitivo() {
    const radioSelected = document.querySelector('input[name="grupoOrigen"]:checked');
    if (!radioSelected) return alert('Seleccione el grupo actual que desea cambiar.');

    const origenInscripcionId = radioSelected.value;
    const origenClave = radioSelected.getAttribute('data-clave');
    const destinoClave = document.getElementById('cambioNuevoGrupoClave').value;

    if (!destinoClave) {
        await mostrarAlerta('Seleccione el nuevo grupo de destino.');
        return;
    }
    if (origenClave === destinoClave) {
        await mostrarAlerta('El grupo de destino es el mismo que el de origen.');
        return;
    }

    const confirma = await mostrarConfirm(`¿Confirmar cambio del grupo ${origenClave} al grupo ${destinoClave}?`);
    if (!confirma) return;

    try {
        // 1. Verificar cupo del destino
        const { data: gDest, error: dErr } = await SessionManager.applyIsolation(db.from('grupos').select('id, cupo, alumnos_inscritos')).eq('clave', destinoClave).single();
        if (dErr) throw dErr;

        if ((gDest.alumnos_inscritos || 0) >= (gDest.cupo || 0)) {
            await mostrarAlerta('El grupo de destino no tiene cupo disponible.');
            return;
        }

        // 2. Ejecutar cambio (Update record)
        const { error: updErr } = await SessionManager.applyIsolation(db.from('alumno_grupos').update({
            grupo_clave: destinoClave,
            updated_at: new Date().toISOString()
        })).eq('id', origenInscripcionId);

        if (updErr) throw updErr;

        // Sincronizar contadores
        await sincronizarContadorGrupo(origenClave);
        await sincronizarContadorGrupo(destinoClave);

        await mostrarAlerta('Cambio de grupo realizado con éxito.');
        cerrarModalCambio();
        cargarGruposInscritos(alumnoSeleccionado.id);
    } catch (err) {
        console.error('Error en cambio de grupo:', err);
        alert('Error: ' + err.message);
    }
}

function limpiarFormulario() {
    var inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="date"], input[type="number"], input[type="time"]');
    for (var i = 0; i < inputs.length; i++) {
        inputs[i].value = '';
    }
    var checks = document.querySelectorAll('input[type="checkbox"]');
    for (var j = 0; j < checks.length; j++) {
        checks[j].checked = false;
    }
    
    var selects = document.querySelectorAll('select');
    for (var k = 0; k < selects.length; k++) {
        selects[k].selectedIndex = 0;
    }

    // Limpiar campos de último pago
    if (document.getElementById('ultimoPagoFecha')) document.getElementById('ultimoPagoFecha').value = '';
    if (document.getElementById('ultimoPagoMonto')) document.getElementById('ultimoPagoMonto').value = '';

    // Reset hidden IDs and data
    const hiddenIds = ['cambioNuevoGrupoId', 'reingresoNuevoGrupoId', 'instrumento_clave', 'altaCurso', 'altaMaestro', 'altaSalon'];
    hiddenIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
}

// =====================================
// REINGRESO
// =====================================
// REINGRESO
// =====================================
async function abrirReingreso() {
    if (!alumnoSeleccionado) {
        await mostrarAlerta('Primero busque y seleccione un alumno.');
        return;
    }

    if (g_modalActual) {
        await mostrarAlerta('Cierre la ventana actual antes de abrir otra operación.');
        return;
    }

    document.getElementById('reingresoNombre').textContent = alumnoSeleccionado.nombre;
    document.getElementById('reingresoCredencial').textContent = alumnoSeleccionado.credencial;

    // Limpiar campos de nuevo grupo EXPLICITAMENTE
    const claveEl = document.getElementById('reingresoNuevoGrupoClave');
    const idEl = document.getElementById('reingresoNuevoGrupoId');
    if (claveEl) claveEl.value = '';
    if (idEl) idEl.value = '';

    const listContainer = document.getElementById('reingresoGruposList');
    listContainer.innerHTML = 'Cargando grupos anteriores...';

    try {
        const { data, error } = await SessionManager.applyIsolation(db
            .from('alumno_grupos')
            .select('id, grupo_clave, credencial_vinculada'))
            .eq('alumno_id', alumnoSeleccionado.id)
            .eq('estado', 'Baja');

        if (error) throw error;

        if (!data || data.length === 0) {
            listContainer.innerHTML = '<p style="color:#666; padding:10px; text-align:center;">Sin historial de grupos anteriores.</p>';
        } else {
            let html = '';
            for (const g of data) {
                // VERIFICAR CUPO
            const { data: gData } = await SessionManager.applyIsolation(db.from('grupos').select('id, cupo, alumnos_inscritos')).eq('clave', g.grupo_clave).single();
                let isFull = false;
                if (gData && (gData.alumnos_inscritos || 0) >= (gData.cupo || 0)) {
                    isFull = true;
                }

                if (isFull) {
                    html += `
                        <div style="border-bottom:1px solid #eee; padding:8px; display:flex; align-items:center; gap:10px; opacity:0.5; background:#f9f9f9;">
                            <input type="checkbox" name="grupoReingreso" value="${g.id}" data-clave="${g.grupo_clave}" style="width:18px; height:18px;" disabled title="Grupo lleno">
                            <div style="color:#999;">
                                <strong>${g.grupo_clave} (Lleno)</strong> 
                                <span style="font-size:0.85em;">(${g.credencial_vinculada || 'Sin credencial'})</span>
                            </div>
                        </div>
                    `;
                } else {
                    html += `
                        <div style="border-bottom:1px solid #eee; padding:8px; display:flex; align-items:center; gap:10px;">
                            <input type="checkbox" name="grupoReingreso" value="${g.id}" data-clave="${g.grupo_clave}" style="width:18px; height:18px;">
                            <div>
                                <strong>${g.grupo_clave}</strong> 
                                <span style="font-size:0.85em; color: #666;">(${g.credencial_vinculada || 'Sin credencial'})</span>
                            </div>
                        </div>
                    `;
                }
            }
            listContainer.innerHTML = html;
        }
        const modal = document.getElementById('modalReingreso');
        if (modal) {
            modal.style.display = 'flex';
            g_modalActual = 'modalReingreso';
        }
    } catch (err) {
        console.error('Error al abrir reingreso:', err);
        listContainer.innerHTML = 'Error al cargar historial.';
    }
}

function cerrarModalReingreso() {
    const modal = document.getElementById('modalReingreso');
    if (modal) {
        modal.style.display = 'none';
        g_modalActual = null;
    }
}

window.abrirSelectorGrupoReingreso = function () {
    window.abrirSelectorGrupo(); // Reutiliza el buscador existente
}

async function procesarReingresoMasivo() {
    const listContainer = document.getElementById('reingresoGruposList');
    const checkboxes = listContainer.querySelectorAll('input[type="checkbox"]:checked');
    const nuevoGrupoClave = document.getElementById('reingresoNuevoGrupoClave').value;
    const nuevoGrupoId = document.getElementById('reingresoNuevoGrupoId').value;

    if (checkboxes.length === 0 && !nuevoGrupoClave) {
        await mostrarAlerta('Seleccione un grupo anterior para reactivar o elija uno nuevo.');
        return;
    }

    const observaciones = document.getElementById('observacionesReingreso').value.trim();
    const confirma = await mostrarConfirm('¿Confirmar el proceso de reingreso del alumno?');
    if (!confirma) return;

    let procesados = 0;
    let cupoLleno = [];

    // CASO 1: Reingreso a grupos anteriores
    for (const cb of checkboxes) {
        const inscripcionId = cb.value;
        const clave = cb.getAttribute('data-clave');

        try {
            const { data: gData } = await SessionManager.applyIsolation(db.from('grupos').select('id, cupo, alumnos_inscritos')).eq('clave', clave).single();
            if (gData && (gData.alumnos_inscritos || 0) >= (gData.cupo || 0)) {
                cupoLleno.push(clave);
                continue;
            }

            const { error: updErr } = await SessionManager.applyIsolation(db.from('alumno_grupos').update({
                estado: 'Activo',
                fecha_baja: null,
                motivo_baja_id: null,
                observaciones_reingreso: observaciones,
                fecha_inscripcion: new Date().toISOString().split('T')[0]
            })).eq('id', inscripcionId);

            if (updErr) throw updErr;

            // Sincronizar contador
            await sincronizarContadorGrupo(clave);

            procesados++;
        } catch (e) {
            console.error('Error reingreso anterior:', e);
        }
    }

    // CASO 2: Reingreso a un grupo completamente nuevo
    if (nuevoGrupoClave) {
        try {
            const { data: gData } = await SessionManager.applyIsolation(db.from('grupos').select('id, cupo, alumnos_inscritos')).eq('clave', nuevoGrupoClave).single();
            if (gData && (gData.alumnos_inscritos || 0) >= (gData.cupo || 0)) {
                cupoLleno.push(nuevoGrupoClave);
            } else {
                // Crear nueva inscripción
                const { error: insErr } = await db.from('alumno_grupos').insert([{
                    alumno_id: alumnoSeleccionado.id,
                    grupo_clave: nuevoGrupoClave,
                    estado: 'Activo',
                    credencial_vinculada: alumnoSeleccionado.credencial,
                    fecha_inscripcion: new Date().toISOString().split('T')[0],
                    observaciones_reingreso: 'REINGRESO NUEVO: ' + observaciones,
                    organizacion_id: SessionManager.getCurrentUser()?.organizacion_id
                }]);

                if (insErr) throw insErr;

                // Sincronizar contador
                await sincronizarContadorGrupo(nuevoGrupoClave);

                procesados++;
            }
        } catch (e) {
            console.error('Error reingreso nuevo grupo:', e);
        }
    }

    if (procesados > 0 && alumnoSeleccionado) {
        try {
            await SessionManager.applyIsolation(db.from('alumnos').update({
                activo: true,
                fecha_baja: null,
                motivo_baja_id: null
            })).eq('id', alumnoSeleccionado.id);
            console.log('Alumno marcado como activo tras reingreso.');
        } catch (err) {
            console.error('Error al reactivar alumno:', err);
        }
    }

    if (cupoLleno.length > 0) {
        await mostrarAlerta(`Proceso terminado. Se reingresó a ${procesados} grupo(s). Los siguientes no tenían cupo: ${cupoLleno.join(', ')}`);
    } else {
        await mostrarAlerta('Reingreso procesado exitosamente.');
    }

    cerrarModalReingreso();
    cargarGruposInscritos(alumnoSeleccionado.id);
}

// =====================================================
// CARGAR ALUMNO PARA EDICIÓN
// =====================================================
if (window.location.href.indexOf('alumnos-edicion') >= 0) {
    document.addEventListener('DOMContentLoaded', function () {
        var alumnoStr = sessionStorage.getItem('alumnoEditar');
        if (alumnoStr) {
            alumnoEditando = JSON.parse(alumnoStr);
            sessionStorage.removeItem('alumnoEditar');

            setTimeout(function () {
                setVal('credencial', alumnoEditando.credencial);
                setVal('digito', alumnoEditando.dig_ver || 0);
                setVal('nombre', alumnoEditando.nombre);
                setVal('direccion1', alumnoEditando.direccion1);
                setVal('direccion2', alumnoEditando.direccion2);
                setVal('celular', alumnoEditando.celular);
                setVal('telefono', alumnoEditando.telefono);
                setVal('email', alumnoEditando.email);
                setVal('fechaNacimiento', alumnoEditando.fecha_nacimiento);
                setVal('fechaIngreso', formatearFecha(alumnoEditando.fecha_ingreso));
                setVal('edad', alumnoEditando.edad);
                setVal('nombrePadre', alumnoEditando.nombre_padre);
                setVal('celularPadre', alumnoEditando.telefono_padre);
                setVal('nombreMadre', alumnoEditando.nombre_madre);
                setVal('celularMadre', alumnoEditando.celularMadre);
                setVal('grupoClave', alumnoEditando.grupo_clave);
                setVal('grupoNombre', obtenerNombreGrupo(alumnoEditando.grupo_clave));
                setVal('salon', alumnoEditando.salon || alumnoEditando.salon_id);
                setVal('grado', alumnoEditando.grado);
                setCheck('beca', alumnoEditando.beca);
                const pct = (alumnoEditando.porcentaje_beca || 0).toFixed(2) + '%';
                setVal('porcentaje', pct);
                
                // Habilitar input de porcentaje si tiene beca
                const pctInput = document.getElementById('porcentaje');
                if (pctInput) pctInput.disabled = !alumnoEditando.beca;

                setVal('comentario', alumnoEditando.comentario);

                var instSelect = document.getElementById('instrumento');
                if (instSelect) instSelect.value = alumnoEditando.instrumento_clave || '';

                var medioSelect = document.getElementById('medio');
                if (medioSelect) medioSelect.value = alumnoEditando.medio_clave || '';

                setCheck('beca', alumnoEditando.beca);
                setCheck('reingreso', alumnoEditando.reingreso);

                var info = document.getElementById('infoAlumno');
                var editandoNombre = document.getElementById('editandoNombre');
                if (info && editandoNombre) {
                    editandoNombre.textContent = alumnoEditando.nombre;
                    info.style.display = 'block';
                }

                calcularEdad();
            }, 600);
        }
    });
}

// ==============================
// LUPA (BUSCADOR MODAL) DE GRUPOS
// ==============================
window.abrirSelectorGrupo = function () {
    const modal = document.getElementById('modalSelectorGrupos');
    if (!modal) return;
    modal.style.display = 'flex';
    document.getElementById('inputBuscarGrupo').value = '';
    buscarGruposModal(); // auto-buscar
    setTimeout(() => document.getElementById('inputBuscarGrupo').focus(), 100);
};

window.cerrarSelectorGrupo = function () {
    const modal = document.getElementById('modalSelectorGrupos');
    if (modal) {
        modal.style.display = 'none';
        // Solo quitamos g_modalActual si este modal NO fue abierto como secundario
        // (por ejemplo, desde Cambio de Grupo o Reingreso)
        const activeModals = document.querySelectorAll('.premium-modal.active');
        if (activeModals.length === 0) {
            g_modalActual = null;
        }
    }
};

window.buscarGruposModal = async function () {
    const term = document.getElementById('inputBuscarGrupo').value.trim();
    if (!window.db) return;

    const tbody = document.getElementById('tablaGruposModal');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Buscando...</td></tr>';

    try {
        let query = SessionManager.applyIsolation(window.db.from('grupos').select('id, clave, cursos!inner(curso, grado), salon_id, cupo, alumnos_inscritos')).eq('activo', true);
        if (term) query = query.ilike('clave', `%${term}%`);

        // FILTRO: No mostrar grupos donde el alumno YA ESTÁ ACTIVO
        if (window.g_inscripcionesActivas && window.g_inscripcionesActivas.length > 0) {
            const clavesActivas = window.g_inscripcionesActivas.map(ins => ins.grupo_clave);
            query = query.not('clave', 'in', `(${clavesActivas.join(',')})`);
        }

        // Aumentamos el límite para asegurar que se vean todos los grupos activos
        const { data, error } = await query.order('clave').limit(500);
        if (error) throw error;

        tbody.innerHTML = '';
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No se encontraron grupos</td></tr>';
            return;
        }

        data.forEach(item => {
            const tr = document.createElement('tr');

            const trCupo = item.cupo || 0;
            const trInscritos = item.alumnos_inscritos || 0;
            const disp = trCupo - trInscritos;
            const lleno = disp <= 0;

            const cursoStr = item.cursos ? item.cursos.curso : '';
            const salonStr = item.salon_id || '';

            tr.innerHTML = `
                <td style="padding:5px; text-align:center;">${item.clave}</td>
                <td>${cursoStr}</td>
                <td>Salón ${salonStr}</td>
                <td style="font-weight:bold; color: ${lleno ? 'red' : 'green'};">${disp}</td>
            `;

            if (lleno) {
                tr.style.opacity = '0.5';
                tr.title = 'Grupo sin cupo disponible';
            } else {
                tr.style.cursor = 'pointer';
                tr.onmouseover = function () { this.style.backgroundColor = '#000080'; this.style.color = 'white'; };
                tr.onmouseout = function () { this.style.backgroundColor = ''; this.style.color = ''; };
                tr.onclick = () => {
                    if (window.location.href.includes('alumnos-alta.html')) {
                        agregarGrupoAlCarrito(item);
                    } else {
                        seleccionarGrupoModal(item.id, item.clave, salonStr);
                    }
                };
            }
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error("Error buscando grupos: ", e);
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:red;">Error: ${e.message}</td></tr>`;
    }
};

window.seleccionarGrupoModal = function (grupoId, grupoClave, salon) {
    const modalCambio = document.getElementById('modalCambioGrupo');
    if (modalCambio && modalCambio.style.display === 'block') {
        if (document.getElementById('cambioNuevoGrupoId')) document.getElementById('cambioNuevoGrupoId').value = grupoId;
        if (document.getElementById('cambioNuevoGrupoClave')) document.getElementById('cambioNuevoGrupoClave').value = grupoClave;
        cerrarSelectorGrupo();
        return;
    }

    const modalReingreso = document.getElementById('modalReingreso');
    if (modalReingreso && (modalReingreso.style.display === 'block' || modalReingreso.style.display === 'flex')) {
        if (document.getElementById('reingresoNuevoGrupoId')) document.getElementById('reingresoNuevoGrupoId').value = grupoId;
        if (document.getElementById('reingresoNuevoGrupoClave')) document.getElementById('reingresoNuevoGrupoClave').value = grupoClave;
        cerrarSelectorGrupo();
        return;
    }

    if (document.getElementById('grupo_id')) document.getElementById('grupo_id').value = grupoId;
    if (document.getElementById('grupo')) document.getElementById('grupo').value = grupoClave;
    if (document.getElementById('grupoSearch')) document.getElementById('grupoSearch').value = grupoClave;
    if (document.getElementById('grupoClave')) document.getElementById('grupoClave').value = grupoClave;

    if (document.getElementById('salon')) {
        document.getElementById('salon').value = salon || '';
    }

    cerrarSelectorGrupo();
};

// ==============================
// LUPA (BUSCADOR MODAL) DE INSTRUMENTOS
// ==============================
window.abrirSelectorInstrumento = function () {
    const modal = document.getElementById('modalSelectorInstrumentos');
    if (!modal) return;
    modal.style.display = 'flex';
    document.getElementById('inputBuscarInstrumento').value = '';
    buscarInstrumentosModal(); // auto-buscar
    setTimeout(() => document.getElementById('inputBuscarInstrumento').focus(), 100);
};

window.cerrarSelectorInstrumento = function () {
    const modal = document.getElementById('modalSelectorInstrumentos');
    if (modal) modal.style.display = 'none';
};

window.buscarInstrumentosModal = async function () {
    const term = document.getElementById('inputBuscarInstrumento').value.trim();
    if (!window.db) return;

    const tbody = document.getElementById('tablaInstrumentosModal');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="2" style="text-align:center;">Buscando...</td></tr>';

    try {
        let query = window.db.from('instrumentos').select('clave, descripcion').eq('activo', true);
        if (term) {
            query = query.or(`clave.ilike.%${term}%,descripcion.ilike.%${term}%`);
        }

        const { data, error } = await query.order('descripcion').limit(50);
        if (error) throw error;

        tbody.innerHTML = '';
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="2" style="text-align:center;">No se encontraron instrumentos</td></tr>';
            return;
        }

        data.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="padding:5px; text-align:center;">${item.clave}</td>
                <td>${item.descripcion}</td>
            `;
            tr.style.cursor = 'pointer';
            tr.onmouseover = function () { this.style.backgroundColor = '#000080'; this.style.color = 'white'; };
            tr.onmouseout = function () { this.style.backgroundColor = ''; this.style.color = ''; };
            tr.onclick = () => {
                seleccionarInstrumentoModal(item.clave, item.descripcion);
            };
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error("Error buscando instrumentos: ", e);
        tbody.innerHTML = `<tr><td colspan="2" style="text-align:center;color:red;">Error: ${e.message}</td></tr>`;
    }
};


window.seleccionarInstrumentoModal = function (instClave, instDesc) {
    if (document.getElementById('instrumento_clave')) document.getElementById('instrumento_clave').value = instClave;
    if (document.getElementById('instrumento_desc')) document.getElementById('instrumento_desc').value = instDesc;

    cerrarSelectorInstrumento();
};

// =====================================================
// HISTORIALES: PAGOS Y EXÁMENES
// =====================================================

async function cargarHistorialPagos(alumnoId) {
    const tbody = document.getElementById('bodyHistorialPagos');
    if (!tbody || !db || !alumnoId) return;

    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Cargando historial...</td></tr>';

    try {
        // 1. Obtener pagos realizados
        const { data: pagos, error: pagosErr } = await db
            .from('recibos_detalle')
            .select(`
                monto,
                descuento,
                operacion,
                grupo,
                recibos!inner (
                    id,
                    numero,
                    fecha,
                    cancelado
                )
            `)
            .eq('alumno_id', alumnoId)
            .eq('recibos.cancelado', false)
            .order('created_at', { ascending: false });

        if (pagosErr) throw pagosErr;

        // 2. Obtener deudas pendientes
        const { data: deudas, error: deudasErr } = await db
            .from('v_colegiaturas_pendientes')
            .select('*')
            .eq('alumno_id', alumnoId);

        if (deudasErr) console.error('Error cargando deudas:', deudasErr);

        tbody.innerHTML = '';
        
        // --- RENDERIZAR DEUDAS PRIMERO (O ARRIBA) ---
        if (deudas && deudas.length > 0) {
            deudas.forEach(deuda => {
                const tr = document.createElement('tr');
                tr.style.backgroundColor = 'rgba(255, 0, 0, 0.05)';
                
                // Botón para pagar deuda (incluso si ya no está en el grupo)
                const btnPagarDeuda = `<button class="premium-btn btn-primary" style="padding:2px 10px; font-size:10px; border-radius:15px; margin-top:5px;" 
                                        onclick="window.irAPagar('${alumnoId}', '${deuda.monto_a_pagar}', 'Colegiatura ${deuda.mes}/${deuda.anio}', '${deuda.mes}', '${deuda.anio}')">PAGAR</button>`;

                tr.innerHTML = `
                    <td style="text-align:center; font-weight:bold; color:red;">PENDIENTE</td>
                    <td style="text-align:center; color:red;">-</td>
                    <td style="text-align:right;">$${(deuda.precio_mensual || 0).toFixed(2)}</td>
                    <td style="text-align:right;">$${(deuda.precio_mensual || 0).toFixed(2)}</td>
                    <td style="text-align:right; font-weight:bold; color:red;">$${(deuda.monto_a_pagar || 0).toFixed(2)}</td>
                    <td style="text-align:center;">${deuda.grupo || ''}</td>
                    <td style="font-size: 0.8rem; color:red; font-weight:bold;">
                        DEUDA: COLEGIATURA ${deuda.mes}/${deuda.anio}
                    </td>
                    <td style="text-align:center; color:red; font-weight:bold;">
                        <div style="display:flex; flex-direction:column; align-items:center;">
                            DEUDOR
                            ${btnPagarDeuda}
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }

        // --- RENDERIZAR PAGOS REALIZADOS ---
        if ((!pagos || pagos.length === 0) && (!deudas || deudas.length === 0)) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Sin historial de pagos ni deudas registradas</td></tr>';
            return;
        }

        if (pagos) {
            pagos.forEach(pago => {
                const montoPagado = parseFloat(pago.neto || pago.monto || 0);
                const descuentoMonto = parseFloat(pago.descuento || 0);
                const precioBruto = montoPagado + descuentoMonto;
                const descPorc = precioBruto > 0 ? (descuentoMonto / precioBruto * 100).toFixed(0) : 0;

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="text-align:center;">${pago.recibos ? (pago.recibos.fecha || '') : ''}</td>
                    <td style="text-align:center;">${pago.recibos ? pago.recibos.numero : ''}</td>
                    <td style="text-align:right;">$${(precioBruto || 0).toFixed(2)}</td>
                    <td style="text-align:right; color:red;">-$${(descuentoMonto || 0).toFixed(2)} (${descPorc}%)</td>
                    <td style="text-align:right; font-weight:bold;">$${(montoPagado || 0).toFixed(2)}</td>
                    <td style="text-align:center;">${pago.grupo || ''}</td>
                    <td style="font-size: 0.8rem;">${pago.operacion || ''}</td>
                    <td style="text-align:center; color:green;">✓ PAGADO</td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (e) {
        console.error('Error cargando historial de pagos:', e);
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:red;">Error: ${e.message}</td></tr>`;
    }
}

/**
 * Redirige a la caja con parámetros para pagar una deuda
 */
window.irAPagar = async (id, monto, concepto, mes, anio) => {
    const data = {
        alumno_id: id,
        monto: monto,
        concepto: concepto,
        mes: mes,
        anio: anio,
        timestamp: Date.now()
    };
    localStorage.setItem('pago_pendiente', JSON.stringify(data));
    
    // Intentar redirigir con params (por si acaso) y fallback a localStorage
    window.location.href = `cobros.html?alumno_id=${id}&monto=${monto}&concepto=${encodeURIComponent(concepto)}&mes=${mes}&anio=${anio}`;
};



function parseMesAño(operacion) {
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    let mes = "";
    let año = "";
    
    const up = operacion.toLowerCase();
    
    // Buscar año (4 dígitos)
    const añoMatch = operacion.match(/\b(20\d{2})\b/);
    if (añoMatch) año = añoMatch[1];
    
    // Buscar mes
    for (let m of meses) {
        if (up.includes(m.toLowerCase())) {
            mes = m;
            break;
        }
    }
    
    // Si no hay mes, intentar buscar número de mes si es formato 01/24 etc
    if (!mes) {
        const mesNumMatch = operacion.match(/\b(0[1-9]|1[0-2])\b/);
        if (mesNumMatch) {
            mes = meses[parseInt(mesNumMatch[1]) - 1];
        }
    }
    
    return { mes, año };
}

// =====================================================
// DETALLE DE PAGOS (MODAL CALENDARIO)
// =====================================================
window.abrirDetallePagos = function(grupoClave, nombreCurso) {
    const modal = document.getElementById('modalDetallePagos');
    const tbody = document.getElementById('bodyDetallePagos');
    const lblNombre = document.getElementById('detallePagoNombre');
    const lblCiclo = document.getElementById('detallePagoCiclo');
    
    if (!modal || !tbody || !alumnoSeleccionado) return;
    
    lblNombre.textContent = alumnoSeleccionado.nombre;
    lblCiclo.textContent = `${grupoClave} - ${nombreCurso}`;
    
    tbody.innerHTML = '';
    
    const hoy = new Date();
    const limiteFuturo = new Date();
    limiteFuturo.setDate(hoy.getDate() + 7);

    // Filtrar: Mostrar si está pagado, es deuda, o si es futuro pero inicia en menos de 7 días
    const segGrupo = g_seguimientoCache.filter(s => {
        if (s.grupo_clave !== grupoClave) return false;
        if (s.estatus === 'pagado' || s.estatus === 'deuda') return true;
        
        const fechaInicio = new Date(s.inicio_ciclo);
        return fechaInicio <= limiteFuturo;
    });
    
    segGrupo.forEach(s => {
        const tr = document.createElement('tr');
        
        let estatusHtml = '';
        let accionHtml = '';
        
        if (s.estatus === 'pagado') {
            estatusHtml = '<span class="badge badge-success" style="background:#10b981; color:white; padding:4px 8px; border-radius:4px;">PAGADO</span>';
        } else if (s.estatus === 'deuda') {
            estatusHtml = '<span class="badge badge-danger" style="background:#ef4444; color:white; padding:4px 8px; border-radius:4px;">DEUDA</span>';
            accionHtml = `<div style="display: flex; gap: 8px; justify-content: center;">
                            <button class="premium-btn btn-primary" style="padding:5px 12px; font-size:11px; border-radius:15px;" 
                                onclick="cerrarModalDetallePagos(); window.irAPagar('${alumnoSeleccionado.id}', '${s.monto_calculado}', 'Colegiatura ${s.mes}/${s.anio}', '${s.mes}', '${s.anio}')">PAGAR</button>
                            <button class="premium-btn" style="background: #e91e63; color: white; border: none; padding: 5px 12px; font-size: 11px; border-radius: 15px; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.2);" 
                                onclick="procesarVacaciones('${alumnoSeleccionado.id}', ${s.mes}, ${s.anio}, '${grupoClave}', '${nombreCurso}')">VACACIONES</button>
                          </div>`;
        } else if (s.estatus === 'vacaciones') {
            estatusHtml = '<span class="badge badge-warning" style="background:#f59e0b; color:white; padding:4px 8px; border-radius:4px;">VACACIONES</span>';
        } else {
            estatusHtml = '<span class="badge badge-secondary" style="background:#9ca3af; color:white; padding:4px 8px; border-radius:4px;">FUTURO</span>';
        }
        
        // Formatear rango de fechas
        const fInicio = s.inicio_ciclo ? new Date(s.inicio_ciclo + 'T00:00:00').toLocaleDateString('es-MX') : 'N/A';
        const fFin = s.fin_ciclo ? new Date(s.fin_ciclo + 'T00:00:00').toLocaleDateString('es-MX') : 'N/A';

        tr.innerHTML = `
            <td style="text-align:center;">${s.mes}/${s.anio}</td>
            <td style="text-align:center; font-size:0.85rem;">${fInicio} - ${fFin}</td>
            <td style="text-align:center;">${estatusHtml}</td>
            <td style="text-align:right;">$${parseFloat(s.monto_calculado || 0).toFixed(2)}</td>
            <td style="text-align:center;">${accionHtml}</td>
        `;
        tbody.appendChild(tr);
    });
    
    modal.style.display = 'flex';
    g_modalActual = 'modalDetallePagos';
};

window.cerrarModalDetallePagos = function() {
    const modal = document.getElementById('modalDetallePagos');
    if (modal) {
        modal.style.display = 'none';
        g_modalActual = null;
    }
};

window.procesarVacaciones = async function(alumnoId, mes, anio, grupoClave, nombreCurso) {
    const confirma = await mostrarConfirm(`¿Desea anular la colegiatura de ${mes}/${anio} por concepto de VACACIONES?`);
    if (!confirma) return;

    try {
        const { error } = await db.from('colegiaturas').upsert({
            alumno_id: alumnoId,
            mes: mes,
            anio: anio,
            monto: 0,
            pagado: true,
            anulado: true
        }, { onConflict: 'alumno_id, anio, mes' });

        if (error) throw error;

        await mostrarAlerta('Mes marcado como VACACIONES (Anulado).');
        
        // RECARGAR DATOS DEL SERVIDOR (Vital para que el estatus cambie)
        if (typeof window.cargarGruposInscritos === 'function') {
            await window.cargarGruposInscritos(alumnoId);
        }

        // Recargar el detalle
        abrirDetallePagos(grupoClave, nombreCurso);
        
    } catch (e) {
        console.error('Error al procesar vacaciones:', e);
        mostrarAlerta('Error: ' + e.message);
    }
};

// =====================================================
// VARIABLES GLOBALES
// =====================================================
var db = null;
var alumnoSeleccionado = null;
var gruposCache = [];
var motivosCache = [];
var _ventanaBajas = null; // Referencia a la ventana listado-bajas

// Variables para paginación de búsqueda
var g_paginaActualBajas = 1;
var g_totalPaginasBajas = 1;
var g_terminoBusquedaBajas = '';
var g_resultadosTotalesBajas = 0;

// =====================================================
// INICIALIZACIÓN
// =====================================================
document.addEventListener('DOMContentLoaded', async function () {
    console.log('Inicializando módulo de bajas...');

    try {
        if (typeof waitForSupabase === 'function') {
            db = await waitForSupabase();
        } else {
            db = window.supabaseClient || window.supabase || (typeof getSupabase === 'function' ? getSupabase() : null);
        }

        if (db) {
            console.log('✓ Supabase conectado en bajas');
            await cargarGrupos();
            await cargarMotivos();
        } else {
            console.error('❌ Supabase NO disponible');
        }
    } catch (err) {
        console.error('Error durante la inicialización:', err);
    }

    actualizarFechaHora();
    setInterval(actualizarFechaHora, 1000);

    if (typeof habilitarInputs === 'function') habilitarInputs();
});

function actualizarFechaHora() {
    var ahora = new Date();
    var datetime = document.getElementById('datetime');
    if (datetime) {
        var dia = String(ahora.getDate()).padStart(2, '0');
        var mes = String(ahora.getMonth() + 1).padStart(2, '0');
        var anio = ahora.getFullYear();
        var horas = ahora.getHours();
        var minutos = String(ahora.getMinutes()).padStart(2, '0');
        var segundos = String(ahora.getSeconds()).padStart(2, '0');
        var ampm = horas >= 12 ? 'p. m.' : 'a. m.';
        horas = horas % 12 || 12;
        datetime.textContent = dia + '/' + mes + '/' + anio + ' ' +
            String(horas).padStart(2, '0') + ':' + minutos + ':' + segundos + ' ' + ampm;
    }
}

// =====================================================
// CARGA DE DATOS
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

        // Llenar select de nuevo grupo para reingreso
        var selectNuevoGrupo = document.getElementById('selectNuevoGrupo');
        if (selectNuevoGrupo) {
            selectNuevoGrupo.innerHTML = '<option value="">-- Seleccione nuevo grupo --</option>';
            for (var i = 0; i < gruposCache.length; i++) {
                var g = gruposCache[i];
                var opt = document.createElement('option');
                opt.value = g.clave;
                opt.textContent = g.clave + ' - ' + (g.cursos ? g.cursos.curso : '');
                selectNuevoGrupo.appendChild(opt);
            }
        }
    } catch (e) {
        console.error('Error:', e);
    }
}

async function cargarMotivos() {
    try {
        const { data, error } = await SessionManager.applyIsolation(db.from('motivos_baja').select('*')).eq('activo', true).order('clave');
        if (error) {
            console.error('Error cargando motivos:', error);
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
            return;
        }
        motivosCache = data || [];
        console.log(motivosCache.length + ' motivos cargados');
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

function obtenerNombreGrupo(clave) {
    for (var i = 0; i < gruposCache.length; i++) {
        if (gruposCache[i].clave === clave) {
            return gruposCache[i].cursos ? gruposCache[i].cursos.curso : '';
        }
    }
    return '';
}

function obtenerDescripcionMotivo(clave) {
    for (var i = 0; i < motivosCache.length; i++) {
        if (motivosCache[i].clave === clave) {
            return motivosCache[i].descripcion;
        }
    }
    return '';
}

// =====================================================
// BÚSQUEDA DE ALUMNOS DADOS DE BAJA
// =====================================================
// =====================================================
// BÚSQUEDA: Abre listado-bajas.html como ventana emergente
// ==================== BÚSQUEDA DE ALUMNOS DADOS DE BAJA ====================
function buscarAlumnoBaja() {
    listarBajas();
}

// Recibir alumno seleccionado de la ventana emergente (doble clic en listado-bajas)
window.cargarAlumnoBajaDesdeVentana = function (alumno) {
    if (alumno && alumno.id) {
        alumnoSeleccionado = alumno;
        mostrarAlumnoBaja(alumno);
        window.focus();
    } else {
        alert('Error: datos del alumno incompletos.');
    }
};

// Alias para compatibilidad con listado-bajas.js
window.cargarAlumnoDesdeVentana = window.cargarAlumnoBajaDesdeVentana;


// =====================================================
// MOSTRAR DATOS DEL ALUMNO DADO DE BAJA
// =====================================================
function mostrarAlumnoBaja(alumno) {
    alumnoSeleccionado = alumno;

    setVal('credencial', alumno.credencial);
    setVal('digito', alumno.dig_ver || 0);
    setVal('celular', alumno.celular || alumno.telefono_celular);
    setVal('telefono', alumno.telefono);
    setVal('nombre', alumno.nombre);
    setVal('fechaIngreso', formatearFecha(alumno.fecha_ingreso));
    setVal('direccion1', alumno.direccion1);
    setVal('direccion2', alumno.direccion2);
    setVal('fechaNacimiento', formatearFecha(alumno.fecha_nacimiento));
    setVal('edad', alumno.edad);

    const reingresoEl = document.getElementById('reingreso');
    if (reingresoEl) reingresoEl.checked = !!alumno.reingreso;

    setVal('email', alumno.email);
    setVal('nombrePadre', alumno.nombre_padre);
    setVal('celularPadre', alumno.telefono_padre);
    setVal('nombreMadre', alumno.nombre_madre);
    setVal('celularMadre', alumno.telefono_madre);
    setVal('grupoClave', alumno.grupo_clave);

    const nombreGrupo = (alumno.grupos?.cursos?.curso) || obtenerNombreGrupo(alumno.grupo_clave);
    setVal('grupoNombre', nombreGrupo);
    setVal('salon', alumno.salon || alumno.salon_id || '');
    setVal('salonUbicacion', alumno.grupos?.salon_id || alumno.grupos?.salon || '');

    setVal('comentario', alumno.comentario);
    setVal('instrumento', alumno.instrumento_clave);
    setVal('medio', alumno.medio_clave);
    setVal('gradoActual', alumno.grado || '1');

    // Estos valores ahora vienen del registro de baja (alumno_grupos)
    setVal('motivoClave', alumno.motivo_baja);

    const descMotivo = (alumno.motivos_baja?.descripcion) || obtenerDescripcionMotivo(alumno.motivo_baja);
    setVal('motivoDescripcion', descMotivo);

    setVal('fechaBaja', formatearFecha(alumno.fecha_baja));

    // Cargar historial de grupos para la nueva tabla
    cargarHistorialGruposBajas(alumno.id);

    // Cargar Pagos y Exámenes
    cargarHistorialPagos(alumno.id);
    cargarHistorialExamenes(alumno.id);

    console.log('Alumno dado de baja seleccionado:', alumno.nombre);
}

async function cargarHistorialGruposBajas(alumnoId) {
    const tbody = document.getElementById('bodyHistorialGrupos');
    if (!tbody) return;

    try {
        const { data, error } = await SessionManager.applyIsolation(db
            .from('alumno_grupos'))
            .select('*')
            .eq('alumno_id', alumnoId)
            .eq('estado', 'Baja');

        if (error) throw error;

        tbody.innerHTML = '';
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 10px;">Sin historial de grupos</td></tr>';
            return;
        }

        data.forEach(g => {
            const tr = document.createElement('tr');
            const f_baja = g.fecha_baja ? g.fecha_baja.split('-').reverse().join('/') : '-';

            tr.innerHTML = `
                <td style="padding: 5px; text-align: center;"><strong>${g.grupo_clave}</strong></td>
                <td style="padding: 5px; text-align: center; font-weight: bold;">${g.grado || '1'}</td>
                <td style="padding: 5px; text-align: center;">${f_baja}</td>
                <td style="padding: 5px; text-align: center;">${g.motivo_baja || '-'}</td>
                <td style="padding: 5px; font-size: 0.85em;">${g.observaciones_baja || ''}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error('Error cargando historial de bajas:', e);
    }
}

function setVal(id, valor) {
    var el = document.getElementById(id);
    if (el) el.value = valor || '';
}

function formatearFecha(fecha) {
    if (!fecha) return '';
    var d = new Date(fecha);
    var dia = String(d.getDate()).padStart(2, '0');
    var mes = String(d.getMonth() + 1).padStart(2, '0');
    var anio = d.getFullYear();
    return dia + '/' + mes + '/' + anio;
}

// =====================================================
// LISTADO DE BAJAS
// =====================================================
// =====================================================
// LISTADO DE BAJAS: Abre la ventana emergente mostrando TODOS
// =====================================================
function listarBajas() {
    var width = 980, height = 700;
    var left = Math.round((screen.width - width) / 2);
    var top = Math.round((screen.height - height) / 2);

    window.open(
        'listado-bajas.html', 'ListaBajas',
        'width=' + width + ',height=' + height +
        ',top=' + top + ',left=' + left +
        ',resizable=yes,scrollbars=yes'
    );
}

// =====================================================
// REINGRESO DE ALUMNOS
// =====================================================
// =====================================================
// REINGRESO DE ALUMNOS (AVANZADO)
// =====================================================
var _grupoSeleccionadoReingreso = null; // Para la tabla

async function reingresarAlumno() {
    if (!alumnoSeleccionado) {
        await mostrarAlerta('Primero busque y seleccione un alumno dado de baja');
        return;
    }

    // Modal Info
    document.getElementById('reingresoNombre').textContent = alumnoSeleccionado.nombre;
    document.getElementById('reingresoCredencial').textContent = alumnoSeleccionado.credencial;

    // Limpiar estados
    _grupoSeleccionadoReingreso = null;
    limpiarSeleccionNuevoGrupo();
    document.getElementById('observacionesReingreso').value = '';

    // Cargar tabla de historial en el modal
    await cargarTablaReingreso(alumnoSeleccionado.id);

    document.getElementById('modalReingreso').style.display = 'block';
}

async function cargarTablaReingreso(alumnoId) {
    const tbody = document.getElementById('reingresoHistorialBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Cargando...</td></tr>';

    try {
        const { data, error } = await SessionManager.applyIsolation(db
            .from('alumno_grupos'))
            .select('*')
            .eq('alumno_id', alumnoId)
            .eq('estado', 'Baja');

        if (error) throw error;

        tbody.innerHTML = '';
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No tiene grupos anteriores.</td></tr>';
            return;
        }

        for (const g of data) {
            const { data: gData } = await SessionManager.applyIsolation(db.from('grupos').select('cupo, alumnos_inscritos')).eq('clave', g.grupo_clave).single();
            let isFull = false;
            if (gData && (gData.alumnos_inscritos || 0) >= (gData.cupo || 0)) {
                isFull = true;
            }

            const tr = document.createElement('tr');
            if (isFull) {
                tr.style.cursor = 'not-allowed';
                tr.style.opacity = '0.5';
                tr.style.background = '#f9f9f9';
                tr.title = 'Grupo lleno';
            } else {
                tr.style.cursor = 'pointer';
                tr.onclick = () => seleccionarFilaReingreso(tr, g);
            }

            const f_baja = g.fecha_baja ? g.fecha_baja.split('-').reverse().join('/') : '-';

            tr.innerHTML = `
                <td style="padding:5px; border:1px solid #ccc; text-align:center;"><strong>${g.grupo_clave} ${isFull ? '<span style="color:red;font-size:0.8em;">(Lleno)</span>' : ''}</strong></td>
                <td style="padding:5px; border:1px solid #ccc; text-align:center;">${f_baja}</td>
                <td style="padding:5px; border:1px solid #ccc;">${g.motivo_baja || ''}</td>
            `;
            tbody.appendChild(tr);
        }
    } catch (e) {
        console.error('Error tabla reingreso:', e);
    }
}

function seleccionarFilaReingreso(tr, grupo) {
    // Quitar resaltado de otros
    const rows = document.querySelectorAll('#reingresoHistorialBody tr');
    rows.forEach(r => r.style.background = 'white');
    rows.forEach(r => r.style.color = 'black');

    // Resaltar esta
    tr.style.background = '#000080';
    tr.style.color = 'white';

    _grupoSeleccionadoReingreso = grupo;

    // Si elige de la tabla, limpiar el buscador de "nuevo"
    limpiarSeleccionNuevoGrupo();
}

// Selector de "Nuevo Grupo"
function abrirSelectorNuevoGrupo() {
    document.getElementById('modalSelectorGrupo').style.display = 'block';
    document.getElementById('inputBuscarGrupo').value = '';
    filtrarGruposReingreso();
}

function cerrarSelectorNuevoGrupo() {
    document.getElementById('modalSelectorGrupo').style.display = 'none';
}

function cerrarModalReingreso() {
    const modal = document.getElementById('modalReingreso');
    if (modal) modal.style.display = 'none';
}

function filtrarGruposReingreso() {
    const term = document.getElementById('inputBuscarGrupo').value.toUpperCase();
    const tbody = document.getElementById('tbodyGruposReingreso');
    tbody.innerHTML = '';

    const filtrados = gruposCache.filter(g => g.clave.includes(term));
    filtrados.forEach(g => {
        const tr = document.createElement('tr');
        tr.style.cursor = 'pointer';
        tr.innerHTML = `<td style="padding:5px; border-bottom:1px solid #eee;"><strong>${g.clave}</strong> - ${g.cursos?.curso || ''}</td>`;
        tr.onclick = () => {
            document.getElementById('reingresoNuevoGrupoClave').value = g.clave;
            document.getElementById('reingresoNuevoGrupoId').value = g.id;

            const detalle = document.getElementById('reingresoNuevoGrupoDetalle');
            if (detalle) {
                detalle.textContent = `${g.cursos?.curso || ''} - Grado: ${g.grado || 1}`;
                detalle.style.display = 'block';
            }

            // Si elige uno nuevo, quitar el resaltado de la tabla
            _grupoSeleccionadoReingreso = null;
            const rows = document.querySelectorAll('#reingresoHistorialBody tr');
            rows.forEach(r => r.style.background = 'white');
            rows.forEach(r => r.style.color = 'black');

            cerrarSelectorNuevoGrupo();
        };
        tbody.appendChild(tr);
    });
}

function limpiarSeleccionNuevoGrupo() {
    document.getElementById('reingresoNuevoGrupoClave').value = '';
    document.getElementById('reingresoNuevoGrupoId').value = '';
    const det = document.getElementById('reingresoNuevoGrupoDetalle');
    if (det) {
        det.textContent = '';
        det.style.display = 'none';
    }
}

async function confirmarReingresoAvanzado() {
    const nuevoGrupoId = document.getElementById('reingresoNuevoGrupoId').value;
    const nuevoGrupoClave = document.getElementById('reingresoNuevoGrupoClave').value;
    const observaciones = document.getElementById('observacionesReingreso').value.trim();

    const grupoFinal = _grupoSeleccionadoReingreso || (nuevoGrupoClave ? { grupo_clave: nuevoGrupoClave } : null);

    if (!grupoFinal) {
        return alert('Debe seleccionar un grupo de la tabla o elegir uno nuevo.');
    }

    // VALIDACIONES DE REINGRESO
    if (!grupoFinal) {
        alert('Error: No se pudo identificar el grupo seleccionado.');
        return;
    }

    // 1. Validar cupo
    const inscritos = grupoFinal.alumnos_inscritos || 0;
    const cupo = grupoFinal.cupo || 0;
    if (inscritos >= cupo && cupo > 0) {
        alert(`Error: El grupo ${grupoFinal.clave} está lleno (${inscritos}/${cupo}).`);
        return;
    }

    // 2. Validar restricciones académicas si es un grupo NUEVO
    if (!_grupoSeleccionadoReingreso) {
        const gradoAlumno = parseInt(alumnoSeleccionado.grado) || 1;
        const cursoAlumno = alumnoSeleccionado.curso_id || alumnoSeleccionado.instrumento_clave; // Depende de cómo se guarde
        
        const gradoNuevo = parseInt(grupoFinal.grado) || 1;
        const cursoNuevo = grupoFinal.curso_id;

        // Si no es grado 1, debe ser mismo grado y curso
        if (gradoNuevo !== 1) {
            // Verificar si es el mismo curso y grado que tenía
            const mismoGrado = (gradoNuevo === gradoAlumno);
            // Nota: Aquí la comparación de curso puede ser flexible dependiendo de si se usa curso_id o instrumento_clave
            // Por ahora priorizamos grado 1 o coincidencia exacta.
            if (!mismoGrado) {
                alert(`Error: Para reingresar a un grupo que no es de Grado 1, debe ser del mismo grado que el alumno (${gradoAlumno}).`);
                return;
            }
        }
    }

    const confirma = await mostrarConfirm(`¿Confirmar reingreso al grupo ${grupoFinal.grupo_clave || grupoFinal.clave}?`);
    if (!confirma) return;

    try {
        const fechaHoy = new Date().toISOString().split('T')[0];

        // 1. Si es de la tabla (re-activar) o ya tiene historial
        let agId = _grupoSeleccionadoReingreso ? _grupoSeleccionadoReingreso.id : null;

        if (!agId) {
            // Verificar si ya existe un registro para este alumno y grupo (evitar duplicado)
            const { data: existAg } = await SessionManager.applyIsolation(db.from('alumno_grupos'))
                .select('id')
                .eq('alumno_id', alumnoSeleccionado.id)
                .eq('grupo_clave', nuevoGrupoClave)
                .maybeSingle();
            
            if (existAg) agId = existAg.id;
        }

        if (agId) {
            // Actualizar registro existente (Cambio de INSERT a UPDATE)
            const { error } = await SessionManager.applyIsolation(db.from('alumno_grupos').update({
                estado: 'Activo',
                fecha_baja: null,
                motivo_baja: null,
                observaciones_baja: null,
                fecha_inscripcion: fechaHoy,
                observaciones_reingreso: observaciones || 'REINGRESO ACTUALIZADO'
            })).eq('id', agId);

            if (error) throw error;
        }
        else {
            // Insertar nuevo registro (Solo si no existía)
            const { error } = await db.from('alumno_grupos').insert([{
                alumno_id: alumnoSeleccionado.id,
                grupo_clave: nuevoGrupoClave,
                estado: 'Activo',
                credencial_vinculada: alumnoSeleccionado.credencial,
                fecha_inscripcion: fechaHoy,
                observaciones_reingreso: 'REINGRESO NUEVO: ' + observaciones,
                organizacion_id: SessionManager.getCurrentUser()?.organizacion_id
            }]);

            if (error) throw error;
        }

        // 3. Actualizar estado global del alumno
        const { error: errorAl } = await SessionManager.applyIsolation(db.from('alumnos').update({
            activo: true,
            reingreso: true,
            grupo_clave: grupoFinal.grupo_clave || grupoFinal.clave,
            fecha_baja: null,
            motivo_baja_id: null
        })).eq('id', alumnoSeleccionado.id);

        if (errorAl) {
            console.error('Error al actualizar alumno (PATCH):', errorAl);
            throw new Error(`No se pudo actualizar el estado del alumno: ${errorAl.message}`);
        }

        // 4. Actualizar contador del grupo
        const { count } = await SessionManager.applyIsolation(db.from('alumno_grupos'))
            .select('*', { count: 'exact', head: true })
            .eq('grupo_clave', grupoFinal.grupo_clave)
            .eq('estado', 'Activo');
            
        if (count !== null) {
            await SessionManager.applyIsolation(db.from('grupos').update({
                alumnos_inscritos: count
            })).eq('clave', grupoFinal.grupo_clave);
        }

        // 5. Lógica de Beca 100% (Exámenes y Pagos)
        if (alumnoSeleccionado.porcentaje_beca === 100) {
            console.log('Aplicando beneficios de beca 100% a exámenes...');
            await SessionManager.applyIsolation(db.from('programacion_examenes'))
                .update({ 
                    pagado: true, 
                    monto: 0 
                })
                .eq('alumno_id', alumnoSeleccionado.id)
                .eq('pagado', false);
        }

        await mostrarAlerta('Reingreso procesado exitosamente.');
        cerrarModalReingreso();
        window.location.reload(); // Recargar para ver cambios
    } catch (e) {
        console.error('Error reingreso:', e);
        alert('Error al procesar: ' + e.message);
    }
}

// =====================================================
// UTILIDADES
// =====================================================
function limpiarFormulario() {
    var inputs = document.querySelectorAll('input[type="text"]');
    for (var i = 0; i < inputs.length; i++) {
        inputs[i].value = '';
    }
}

// Cerrar modales con Escape
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        cerrarModalReingreso();
        cerrarSelectorNuevoGrupo();
    }
});

// Cerrar modales al hacer clic fuera
window.onclick = function (event) {
    if (event.target.classList.contains('modal-windows') ||
        event.target.classList.contains('premium-modal')) {
        event.target.style.display = 'none';
    }
};

window.volverArchivos = function() {
    const ref = document.referrer ? document.referrer.toLowerCase() : '';
    if (ref.includes('archivos.html')) {
        window.location.href = 'archivos.html';
    } else if (ref.includes('consulta-bajas.html')) {
        window.location.href = 'consulta-bajas.html';
    } else {
        window.location.href = 'archivos.html';
    }
}



// =====================================================
// HISTORIALES: PAGOS Y EXÁMENES
// =====================================================

async function cargarHistorialPagos(alumnoId) {
    const tbody = document.getElementById('bodyHistorialPagos');
    if (!tbody || !db || !alumnoId) return;

    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Cargando historial...</td></tr>';

    try {
        const { data, error } = await SessionManager.applyIsolation(db
            .from('recibos_detalle'))
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

        if (error) throw error;

        tbody.innerHTML = '';
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Sin historial de pagos registrados</td></tr>';
            return;
        }

        data.forEach(pago => {
            const montoPagado = parseFloat(pago.monto || 0);
            const descuentoMonto = parseFloat(pago.descuento || 0);
            const precioBruto = montoPagado + descuentoMonto;
            const descPorc = precioBruto > 0 ? (descuentoMonto / precioBruto * 100).toFixed(0) : 0;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="text-align:center;">${pago.recibos ? formatearFecha(pago.recibos.fecha) : ''}</td>
                <td style="text-align:center;">${pago.recibos ? pago.recibos.numero : ''}</td>
                <td style="text-align:right;">$${precioBruto.toFixed(2)}</td>
                <td style="text-align:right; color:red;">-$${descuentoMonto.toFixed(2)} (${descPorc}%)</td>
                <td style="text-align:right; font-weight:bold;">$${montoPagado.toFixed(2)}</td>
                <td style="text-align:center;">${pago.grupo || ''}</td>
                <td style="font-size: 0.8rem;">${pago.operacion}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error('Error cargando historial de pagos:', e);
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:red;">Error: ${e.message}</td></tr>`;
    }
}

window.irAPagarExamen = async (progExamenId, monto, claveExamen) => {
    if (!alumnoSeleccionado) {
        alert('No hay un alumno seleccionado.');
        return;
    }

    const data = {
        alumno_id: alumnoSeleccionado.id,
        monto: monto,
        concepto: `PAGO DE EXAMEN: ${claveExamen}`,
        ref_id: progExamenId,
        tipo: 'EXAMEN',
        timestamp: Date.now()
    };

    localStorage.setItem('pago_pendiente', JSON.stringify(data));
    
    // Redirigir con parámetros robustos
    const url = `cobros.html?alumno_id=${alumnoSeleccionado.id}&monto=${monto}&concepto=${encodeURIComponent('PAGO DE EXAMEN: ' + claveExamen)}&ref_id=${progExamenId}&tipo=EXAMEN`;
    window.location.href = url;
};

async function cargarHistorialExamenes(alumnoId) {
    const tbody = document.getElementById('bodyHistorialExamenes');
    if (!tbody || !db || !alumnoId) return;
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Cargando historial de exámenes...</td></tr>';
    
    try {
        // Consultar programaciones 
        let query = SessionManager.applyIsolation(db.from('programacion_examenes'))
            .select('*, maestros!maestro_base_id(nombre)')
            .eq('alumno_id', alumnoId);
        
        const { data: progs, error: err } = await query;
        if (err) throw err;

        // Obtener resultados previos
        const { data: results } = await SessionManager.applyIsolation(db.from('resultados_examen').select('*')).eq('alumno_id', alumnoId);
        
        tbody.innerHTML = '';
        if ((!progs || progs.length === 0) && (!results || results.length === 0)) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Sin registro de exámenes</td></tr>';
            return;
        }

        const mapEx = {};
        
        // Resultados históricos (Sin programación activa necesaria)
        if (results) results.forEach(r => {
            mapEx[r.clave_examen] = { 
                id: null,
                clave: r.clave_examen, 
                fecha: r.created_at, 
                maestro: '-', 
                calif: r.calificacion || '--', 
                pagado: true,
                status: `<div class="calendar-status" style="background:#f3f4f6; border:1px solid #d1d5db; cursor:default;">
                            <span style="font-size:0.75rem; color:#6b7280; font-weight:700;">HISTÓRICO</span>
                         </div>` 
            };
        });

        // Programaciones activas (Tienen prioridad para pago y estatus real)
        if (progs) progs.forEach(p => {
            const estatusColor = p.pagado ? '#10b981' : '#ef4444';
            const estatusTexto = p.pagado ? 'PAGADO' : 'PENDIENTE';
            
            const calendarHtml = `
                <div class="calendar-status" onclick="abrirDetalleExamen('${p.clave_examen}')" 
                     style="cursor:pointer; display:inline-flex; align-items:center; gap:8px; padding:6px 12px; border-radius:8px; background:var(--bg-secondary); border:1px solid var(--border-color);">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${estatusColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <span style="font-size:0.8rem; font-weight:600; color:${estatusColor};">${estatusTexto}</span>
                </div>`;

            mapEx[p.clave_examen] = { 
                id: p.id,
                clave: p.clave_examen, 
                tipo: p.tipo_examen,
                fecha: p.fecha, 
                hora: p.hora, 
                maestro: p.maestros?.nombre || '-', 
                calif: p.calificacion || '--', 
                costo: p.monto || 0,
                pagado: p.pagado,
                status: calendarHtml 
            };
        });

        window.g_examenesCache = mapEx;

        // Renderizar tabla
        Object.values(mapEx).sort((a,b) => new Date(b.fecha) - new Date(a.fecha)).forEach(ex => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="text-align:center;">${alumnoSeleccionado.credencial}</td>
                <td style="text-align:center; font-weight:bold;">${ex.clave}</td>
                <td style="text-align:center;">${formatearFecha(ex.fecha)}</td>
                <td style="text-align:center;">${ex.hora || '-'}</td>
                <td style="text-align:center;">${ex.maestro}</td>
                <td style="text-align:center; font-weight:bold;">${ex.calif}</td>
                <td style="text-align:center;">${ex.status}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error('Error en cargarHistorialExamenes:', e);
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:red;">Error: ${e.message}</td></tr>`;
    }
}

window.abrirDetalleExamen = function(claveExamen) {
    if (!claveExamen || claveExamen === 'null') return;
    
    const modal = document.getElementById('modalDetalleExamen');
    if (!modal) return;
    
    const ex = window.g_examenesCache && window.g_examenesCache[claveExamen];
    if (!ex) {
        alert('Detalle del examen no encontrado en caché local.');
        return;
    }
    
    try {
        const nombreAlumno = alumnoSeleccionado ? `${alumnoSeleccionado.nombre} ${alumnoSeleccionado.apellidos || ''}`.trim() : 'Desconocido';
        
        document.getElementById('detalleExamenNombre').textContent = nombreAlumno;
        document.getElementById('detExClaveTop').textContent = ex.clave;
        
        const tbody = document.getElementById('bodyDetalleExamen');
        tbody.innerHTML = '';
        
        const tr = document.createElement('tr');
        
        const estatusColor = ex.pagado ? '#10b981' : '#ef4444';
        const estatusBg = ex.pagado ? '#d1fae5' : '#fee2e2';
        const estatusTexto = ex.pagado ? 'PAGADO' : 'PENDIENTE';
        const costoNum = parseFloat(ex.costo) || 0;
        
        // Formatear monto
        let montoHtml = '';
        if (ex.pagado || costoNum > 0) {
            montoHtml = `$${costoNum.toFixed(2)}`;
        } else {
            montoHtml = `<div style="display:flex; align-items:center; justify-content:flex-end;">
                            <span style="margin-right:4px;">$</span>
                            <input type="number" id="inputCostoExamen_${ex.id}" class="premium-input" style="width: 80px; text-align: right; padding: 4px; font-size: 0.9rem;" placeholder="0.00" min="1" step="0.5">
                         </div>`;
        }

        // Formatear botón o texto de pagado
        let accionHtml = '';
        if (ex.pagado) {
            accionHtml = `<span style="color:#10b981; font-weight:bold;">✓ PAGADO</span>`;
        } else if (costoNum > 0) {
            accionHtml = `<button class="premium-btn" style="padding: 4px 12px; font-size: 0.85rem;" onclick="cerrarModalDetalleExamen(); irAPagarExamen('${ex.id}', ${costoNum}, '${ex.clave}')">
                PAGAR
            </button>`;
        } else {
            accionHtml = `<button class="premium-btn" style="padding: 4px 12px; font-size: 0.85rem;" onclick="irAPagarExamenConInput('${ex.id}', '${ex.clave}')">
                PAGAR
            </button>`;
        }
        
        tr.innerHTML = `
            <td style="text-align:center;">
                <strong>${ex.clave}</strong><br>
                <span style="font-size:0.8em; color:var(--text-muted);">${ex.tipo || 'N/A'}</span>
            </td>
            <td style="text-align:center;">
                ${formatearFecha(ex.fecha)}<br>
                <span style="font-size:0.8em; color:var(--text-muted);">${ex.hora || 'Por definir'}</span>
            </td>
            <td style="text-align:center;">
                <span style="background:${estatusBg}; color:${estatusColor}; padding:2px 8px; border-radius:12px; font-size:0.8em; font-weight:600;">
                    ${estatusTexto}
                </span>
            </td>
            <td style="text-align:right; font-weight:bold; vertical-align: middle;">
                ${montoHtml}
            </td>
            <td style="text-align:center;">
                ${accionHtml}
            </td>
        `;
        
        tbody.appendChild(tr);
        modal.style.display = 'flex';
    } catch (e) {
        alert('Error al mostrar detalle del examen: ' + e.message);
    }
};

window.irAPagarExamenConInput = async (id, clave) => {
    const input = document.getElementById(`inputCostoExamen_${id}`);
    const costo = parseFloat(input?.value) || 0;
    if (costo <= 0) {
        alert('Por favor ingrese un monto válido mayor a 0.');
        input?.focus();
        return;
    }
    
    // Guardar en Supabase para que quede registrado el nuevo precio
    try {
        const { error } = await db.from('programacion_examenes').update({ monto: costo }).eq('id', id);
        if (error) throw error;
        
        // Actualizar caché
        if (window.g_examenesCache && window.g_examenesCache[clave]) {
            window.g_examenesCache[clave].costo = costo;
        }
        
        cerrarModalDetalleExamen();
        irAPagarExamen(id, costo, clave);
    } catch (e) {
        alert('Error al actualizar el costo: ' + e.message);
    }
};

window.cerrarModalDetalleExamen = function() {
    const modal = document.getElementById('modalDetalleExamen');
    if (modal) modal.style.display = 'none';
};

function parseMesAño(operacion) {
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    let mes = "";
    let año = "";
    const up = operacion.toLowerCase();
    const añoMatch = operacion.match(/\b(20\d{2})\b/);
    if (añoMatch) año = añoMatch[1];
    for (let m of meses) {
        if (up.includes(m.toLowerCase())) {
            mes = m;
            break;
        }
    }
    if (!mes) {
        const mesNumMatch = operacion.match(/\b(0[1-9]|1[0-2])\b/);
        if (mesNumMatch) mes = meses[parseInt(mesNumMatch[1]) - 1];
    }
    return { mes, año };
}

// Inicializar Supabase
var supabase = null;
let examenes = [];
let registroActual = 0;
let esNuevo = false;
let g_maestros = [];
let g_grupos = [];
let g_campoBuscadorMaestroActual = '';

// Referencias a elementos del DOM (se inicializarán después de cargar el DOM)
let claveInput, fechaInput, horaInput, salonSelect, costoInput, grupoInput, grupoIdInput, maestroInput, examinador1Input, examinador2Input, registroSpan, totalSpan, bodyResultados;

// IDs guardados para FK
let _maestroBaseId = null;
let _examinador1Id = null;
let _examinador2Id = null;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM cargado, inicializando programación de exámenes...');
    
    // Asignar referencias al DOM
    claveInput = document.getElementById('claveExamen');
    fechaInput = document.getElementById('fechaExamen');
    horaInput = document.getElementById('horaExamen');
    salonSelect = document.getElementById('salonExamen');
    costoInput = document.getElementById('costoExamen');
    grupoInput = document.getElementById('grupoExamen');
    grupoIdInput = document.getElementById('grupoExamenId');
    maestroInput = document.getElementById('maestroBase');
    examinador1Input = document.getElementById('examinador1');
    examinador2Input = document.getElementById('examinador2');
    registroSpan = document.getElementById('registroActual');
    totalSpan = document.getElementById('totalRegistros');
    bodyResultados = document.getElementById('bodyResultados');

    // Event Listeners
    document.getElementById('btnNuevo')?.addEventListener('click', nuevoExamen);
    document.getElementById('btnGuardar')?.addEventListener('click', guardarExamen);
    document.getElementById('btnCancelar')?.addEventListener('click', cancelarExamen);
    document.getElementById('btnBorrar')?.addEventListener('click', borrarExamen);
    document.getElementById('btnTerminar')?.addEventListener('click', () => { window.location.href = 'examenes-menu.html'; });
    
    document.getElementById('btnPrimero')?.addEventListener('click', () => mostrarRegistro(0));
    document.getElementById('btnUltimo')?.addEventListener('click', () => mostrarRegistro(examenes.length - 1));
    document.getElementById('btnAnterior')?.addEventListener('click', () => { if (registroActual > 0) mostrarRegistro(registroActual - 1); });
    document.getElementById('btnSiguiente')?.addEventListener('click', () => { if (registroActual < examenes.length - 1) mostrarRegistro(registroActual + 1); });
    document.getElementById('btnBuscarRegistro')?.addEventListener('click', () => {
        const num = parseInt(document.getElementById('inputRegistro').value);
        if (num > 0 && num <= examenes.length) mostrarRegistro(num - 1);
    });
    
    document.getElementById('btnBuscar')?.addEventListener('click', () => {
        if (document.getElementById('modalBuscadorExamenes')) {
            document.getElementById('modalBuscadorExamenes').style.display = 'flex';
            const inputB = document.getElementById('inputBusquedaExamen');
            if (inputB) { inputB.value = ''; inputB.focus(); }
            filtrarExamenes('');
        }
    });

    try {
        await new Promise(r => setTimeout(r, 500));
        if (typeof waitForSupabase === 'function') {
            supabase = await waitForSupabase(10000);
            console.log('✓ Supabase conectado');
            await cargarCatalogos();
            await cargarExamenes();
        }
    } catch (e) {
        console.error('Error conectando a Supabase:', e);
    }
    actualizarFechaHora();
    setInterval(actualizarFechaHora, 1000);
});

// Cargar catálogos (Maestros, Salones, Grupos)
async function cargarCatalogos() {
    if (!supabase) return;
    try {
        const { data: maestros } = await SessionManager.applyIsolation(supabase.from('maestros').select('id, nombre, clave')).eq('activo', true).order('nombre');
        g_maestros = maestros || [];

        const { data: salones, error: errorSalones } = await SessionManager.applyIsolation(supabase.from('salones').select('numero')).order('numero');
        if (!errorSalones && salonSelect) {
            salonSelect.innerHTML = '<option value="">Seleccione...</option>';
            salones.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s.numero;
                opt.textContent = s.numero;
                salonSelect.appendChild(opt);
            });
        }

        const { data: grupos } = await SessionManager.applyIsolation(supabase.from('grupos').select('id, clave, maestro_id, maestros(id,nombre,clave), cursos(curso)')).order('clave');
        g_grupos = grupos || [];
    } catch (error) { console.error('Error cargando catálogos:', error); }
}

// Cargar exámenes
async function cargarExamenes() {
    if (!supabase) return;
    try {
        const { data: dataMaestros } = await SessionManager.applyIsolation(supabase.from('maestros').select('id, nombre, clave'));
        const mapMaestros = {};
        if (dataMaestros) dataMaestros.forEach(m => mapMaestros[m.id] = { nombre: m.nombre, clave: m.clave });

        const { data, error } = await SessionManager.applyIsolation(supabase.from('programacion_examenes').select('id, clave_examen, fecha, hora, salon_id, maestro_base_id, examinador1_id, examinador2_id, grupo_id, clave_acceso, monto, grupos(id,clave,cursos(curso))'))
            .is('alumno_id', null)
            .order('clave_examen');
        if (error) throw error;

        const clavesVistas = new Set();
        const examenesUnicos = [];
        if (data) {
            data.forEach(row => {
                if (!clavesVistas.has(row.clave_examen)) {
                    clavesVistas.add(row.clave_examen);
                    const grupoInfo = row.grupos;
                    examenesUnicos.push({
                        id: row.id,
                        clave: row.clave_examen,
                        fecha: row.fecha || '',
                        hora: row.hora || '',
                        salon: row.salon_id ? String(row.salon_id) : '',
                        maestroBase: mapMaestros[row.maestro_base_id]?.nombre || '',
                        maestroBaseId: row.maestro_base_id,
                        examinador1: mapMaestros[row.examinador1_id]?.nombre || '',
                        examinador1Id: row.examinador1_id,
                        examinador2: mapMaestros[row.examinador2_id]?.nombre || '',
                        examinador2Id: row.examinador2_id,
                        grupoId: row.grupo_id || '',
                        grupoNombre: grupoInfo?.clave || '',
                        curso: grupoInfo?.cursos?.curso || '',
                        claveAcceso: row.clave_acceso || '',
                        monto: row.monto || 0
                    });
                }
            });
        }
        examenes = examenesUnicos;
        if (totalSpan) totalSpan.textContent = examenes.length;
        const inputReg = document.getElementById('inputRegistro');
        if (inputReg) inputReg.max = examenes.length || 1;
        if (examenes.length > 0) { restablecerEstadoVista(); mostrarRegistro(0); }
        else nuevoExamen();
    } catch (error) { console.error('Error cargando exámenes:', error); }
}

// Mostrar registro
function mostrarRegistro(index) {
    if (index >= 0 && index < examenes.length) {
        registroActual = index;
        const ex = examenes[index];
        if (claveInput) claveInput.value = ex.clave;
        if (fechaInput) fechaInput.value = ex.fecha;
        if (horaInput) horaInput.value = ex.hora;
        if (salonSelect) salonSelect.value = ex.salon;
        if (costoInput) costoInput.value = (ex.monto || 0).toFixed(2);
        if (grupoInput) grupoInput.value = ex.grupoNombre;
        if (grupoIdInput) grupoIdInput.value = ex.grupoId;
        if (maestroInput) maestroInput.value = ex.maestroBase;
        if (examinador1Input) examinador1Input.value = ex.examinador1;
        if (examinador2Input) examinador2Input.value = ex.examinador2;
        _maestroBaseId = ex.maestroBaseId;
        _examinador1Id = ex.examinador1Id;
        _examinador2Id = ex.examinador2Id;
        actualizarContador();
    }
}

function actualizarContador() {
    if (registroSpan) registroSpan.textContent = examenes.length > 0 ? registroActual + 1 : 0;
    if (totalSpan) totalSpan.textContent = examenes.length;
    const input = document.getElementById('inputRegistro');
    if (input) input.value = registroActual + 1;
}

function restablecerEstadoVista() {
    esNuevo = false;
    document.getElementById('btnGuardar').style.display = 'none';
    const btnCancelar = document.getElementById('btnCancelar');
    if (btnCancelar) btnCancelar.style.display = 'none';
    const btnNuevo = document.getElementById('btnNuevo');
    if (btnNuevo) btnNuevo.style.display = 'inline-block';
}

function limpiarFormulario() {
    if (claveInput) claveInput.value = '';
    if (fechaInput) fechaInput.value = '';
    if (horaInput) horaInput.value = '';
    if (salonSelect) salonSelect.value = '';
    if (costoInput) costoInput.value = '0.00';
    if (grupoInput) grupoInput.value = '';
    if (grupoIdInput) grupoIdInput.value = '';
    if (maestroInput) maestroInput.value = '';
    if (examinador1Input) examinador1Input.value = '';
    if (examinador2Input) examinador2Input.value = '';
    _maestroBaseId = null; _examinador1Id = null; _examinador2Id = null;
}

function cancelarExamen() {
    if (examenes.length > 0) mostrarRegistro(registroActual);
    else limpiarFormulario();
    restablecerEstadoVista();
}

async function nuevoExamen() {
    limpiarFormulario();
    if (claveInput) {
        claveInput.value = 'Generando...';
        try {
            if (supabase) {
                const { data } = await SessionManager.applyIsolation(supabase.from('programacion_examenes').select('clave_examen')).order('clave_examen', { ascending: false }).limit(1);
                let nextNum = 1;
                if (data && data.length > 0) {
                    const match = data[0].clave_examen.match(/EX-(\d+)/);
                    if (match) nextNum = parseInt(match[1]) + 1;
                }
                claveInput.value = `EX-${String(nextNum).padStart(3, '0')}`;
            }
        } catch (e) { claveInput.value = ''; }
    }
    esNuevo = true;
    document.getElementById('btnNuevo').style.display = 'none';
    document.getElementById('btnGuardar').style.display = 'inline-block';
    const btnCancelar = document.getElementById('btnCancelar');
    if (btnCancelar) btnCancelar.style.display = 'inline-block';
}

function generarClaveAcceso() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let clave = '';
    for (let i = 0; i < 6; i++) clave += chars[Math.floor(Math.random() * chars.length)];
    return clave;
}

async function guardarExamen() {
    if (!supabase) return;
    const btnGuardar = document.getElementById('btnGuardar');
    if (btnGuardar) btnGuardar.disabled = true;

    try {
        const clave = claveInput.value.trim();
        if (!clave || clave === 'Generando...') { alert('La clave es obligatoria'); if (btnGuardar) btnGuardar.disabled = false; return; }

        const horaStr = horaInput.value.trim();
        const fecha = fechaInput.value || null;
        const salon = salonSelect.value || null;
        const costo = parseFloat(costoInput.value) || 0;

        if (horaStr && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(horaStr)) { alert('La hora del examen es inválida.'); if (btnGuardar) btnGuardar.disabled = false; return; }

        if (salon && fecha && horaStr) {
            const { data: confData, error: confErr } = await supabase.rpc('check_salon_examen_disponible', {
                p_salon: salon, p_fecha: fecha, p_hora: horaStr + ':00', p_excluir_clave: clave
            });
            if (!confErr && confData && !confData.disponible) {
                alert('⚠️ Conflicto de salón: ' + confData.motivo);
                if (btnGuardar) btnGuardar.disabled = false;
                return;
            }
        }

        const buscarMaestroId = async (nombre) => {
            if (!nombre) return null;
            const { data } = await SessionManager.applyIsolation(supabase.from('maestros')).select('id').eq('nombre', nombre).limit(1);
            return data && data[0] ? data[0].id : null;
        };

        const maestroId = _maestroBaseId || await buscarMaestroId(maestroInput.value);
        const exam1Id = _examinador1Id || await buscarMaestroId(examinador1Input.value);
        const exam2Id = _examinador2Id || await buscarMaestroId(examinador2Input.value);
        const grupoId = grupoIdInput.value || null;

        const examenData = {
            clave_examen: clave,
            fecha: fecha,
            hora: horaStr || null,
            salon_id: salon,
            maestro_base_id: maestroId,
            examinador1_id: exam1Id,
            examinador2_id: exam2Id,
            grupo_id: grupoId,
            monto: costo,
        };

        const { data: existente } = await SessionManager.applyIsolation(supabase.from('programacion_examenes').select('id, clave_acceso')).eq('clave_examen', clave).limit(1);
        
        if (existente && existente.length > 0) {
            const { error } = await SessionManager.applyIsolation(supabase.from('programacion_examenes').update(examenData)).eq('clave_examen', clave);
            if (error) throw error;
            alert('✅ Examen actualizado correctamente');
        } else {
            examenData.clave_acceso = generarClaveAcceso();
            examenData.organizacion_id = SessionManager.getCurrentUser()?.organizacion_id;
            const { data: newExam, error } = await supabase.from('programacion_examenes').insert([examenData]).select();
            if (error) throw error;
            
            if (grupoId) {
                const { data: alumnosGrupo } = await SessionManager.applyIsolation(supabase.from('alumno_grupos'))
                    .select('alumno_id')
                    .eq('grupo_clave', grupoInput.value)
                    .or('estado.eq.Activo,estado.eq.activo');

                if (alumnosGrupo && alumnosGrupo.length > 0) {
                    const studentIds = alumnosGrupo.map(a => a.alumno_id).filter(Boolean);
                    
                    // 1. Consultar cuáles alumnos ya tienen un registro en resultados_examen para esta clave
                    const { data: existingRecords } = await supabase.from('resultados_examen')
                        .select('alumno_id')
                        .eq('clave_examen', clave)
                        .in('alumno_id', studentIds);

                    const existingSet = new Set(existingRecords?.map(r => r.alumno_id) || []);

                    // 2. Filtrar para insertar únicamente a los que no tienen registro previo
                    const nuevosAlumnos = alumnosGrupo.filter(a => a.alumno_id && !existingSet.has(a.alumno_id));

                    if (nuevosAlumnos.length > 0) {
                        const insertData = nuevosAlumnos.map(a => ({
                            clave_examen: clave,
                            alumno_id: a.alumno_id,
                            organizacion_id: SessionManager.getCurrentUser()?.organizacion_id
                        }));
                        const { error: errorRes } = await supabase.from('resultados_examen').insert(insertData);
                        if (errorRes) console.error('Error vinculando alumnos:', errorRes);
                    }
                }
            }
            alert(`✅ Examen guardado.\n🔑 Clave de acceso: ${examenData.clave_acceso}`);
        }
        await cargarExamenes();
        restablecerEstadoVista();
    } catch (error) {
        alert('Error al guardar: ' + error.message);
    } finally {
        if (btnGuardar) btnGuardar.disabled = false;
    }
}

async function borrarExamen() {
    if (!supabase || examenes.length === 0) return;
    const clave = claveInput.value.trim();
    if (!clave) return;

    if (await mostrarConfirm(`¿Está seguro de eliminar el examen ${clave}? Esta acción borrará también el registro de los alumnos.`)) {
        try {
            const { error } = await SessionManager.applyIsolation(supabase.from('programacion_examenes').delete()).eq('clave_examen', clave);
            if (error) throw error;
            await mostrarAlerta('Examen eliminado correctamente');
            await cargarExamenes();
            if (registroActual >= examenes.length) registroActual = Math.max(0, examenes.length - 1);
            mostrarRegistro(registroActual);
        } catch (e) { await mostrarAlerta('Error al borrar: ' + e.message); }
    }
}

function actualizarFechaHora() {
    const ahora = new Date();
    const dia = String(ahora.getDate()).padStart(2, '0');
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const anio = ahora.getFullYear();
    let horas = ahora.getHours();
    const minutos = String(ahora.getMinutes()).padStart(2, '0');
    const segundos = String(ahora.getSeconds()).padStart(2, '0');
    const ampm = horas >= 12 ? 'p. m.' : 'a. m.';
    horas = horas % 12 || 12;
    const el = document.getElementById('datetime');
    if (el) el.textContent = `${dia}/${mes}/${anio} ${String(horas).padStart(2,'0')}:${minutos}:${segundos} ${ampm}`;
}

// BUSCADORES
function abrirBuscadorGrupo() {
    const input = document.getElementById('inputBuscadorGrupo');
    if (input) input.value = '';
    filtrarGruposBuscador('');
    const modal = document.getElementById('modalBuscadorGrupo');
    if (modal) { modal.style.display = 'flex'; setTimeout(() => input && input.focus(), 50); }
}

function filtrarGruposBuscador(termino) {
    termino = (termino || '').trim().toUpperCase();
    const tbody = document.getElementById('listaGruposBuscador');
    if (!tbody) return;
    let resultados = g_grupos.filter(g => (g.clave || '').toUpperCase().includes(termino) || (g.cursos?.curso || '').toUpperCase().includes(termino));
    tbody.innerHTML = '';
    if (!resultados.length) { tbody.innerHTML = `<tr><td colspan="3" style="padding:10px;text-align:center;color:#999;">Sin resultados</td></tr>`; return; }
    resultados.forEach(g => {
        const tr = document.createElement('tr');
        tr.style.cursor = 'pointer';
        tr.innerHTML = `<td style="padding:8px;font-weight:bold;">${g.clave}</td><td style="padding:8px;">${g.cursos?.curso || ''}</td><td style="padding:8px;font-size:12px;">${g.maestros?.nombre || ''}</td>`;
        tr.onclick = () => seleccionarGrupo(g);
        tbody.appendChild(tr);
    });
}

function seleccionarGrupo(grupo) {
    if (grupoInput) grupoInput.value = grupo.clave;
    if (grupoIdInput) grupoIdInput.value = grupo.id;
    if (grupo.maestros) { if (maestroInput) maestroInput.value = grupo.maestros.nombre; _maestroBaseId = grupo.maestros.id; }
    document.getElementById('modalBuscadorGrupo').style.display = 'none';
}

function abrirBuscadorMaestro(campo) {
    g_campoBuscadorMaestroActual = campo;
    const w = 1000, h = 700;
    const l = (screen.width - w) / 2, t = (screen.height - h) / 2;
    window.open('maestros-lista.html', 'SeleccionMaestro', `width=${w},height=${h},left=${l},top=${t},resizable=yes,scrollbars=yes`);
}

function filtrarMaestrosBuscador(termino) {
    termino = (termino || '').trim().toUpperCase();
    const tbody = document.getElementById('listaMaestrosBuscador');
    if (!tbody) return;
    let resultados = g_maestros.filter(m => m.nombre.toUpperCase().includes(termino));
    tbody.innerHTML = '';
    resultados.forEach(m => {
        const tr = document.createElement('tr');
        tr.style.cursor = 'pointer';
        tr.innerHTML = `<td style="padding:8px;border-bottom:1px solid #e2e8f0;">${m.nombre}</td>`;
        tr.onclick = () => {
            const campo = document.getElementById(g_campoBuscadorMaestroActual);
            if (campo) campo.value = m.nombre;
            if (g_campoBuscadorMaestroActual === 'maestroBase') _maestroBaseId = m.id;
            else if (g_campoBuscadorMaestroActual === 'examinador1') _examinador1Id = m.id;
            else if (g_campoBuscadorMaestroActual === 'examinador2') _examinador2Id = m.id;
            document.getElementById('modalBuscadorMaestro').style.display = 'none';
        };
        tbody.appendChild(tr);
    });
}

function filtrarExamenes(termino) {
    termino = (termino || '').trim().toUpperCase();
    let resultados = examenes.filter(e => (e.clave || '').toUpperCase().includes(termino));
    if (!bodyResultados) return;
    bodyResultados.innerHTML = '';
    if (!resultados.length) { bodyResultados.innerHTML = '<tr><td colspan="3" style="text-align:center;padding:10px;">No resultados</td></tr>'; return; }
    resultados.forEach(ex => {
        const tr = document.createElement('tr');
        tr.style.cursor = 'pointer';
        tr.innerHTML = `<td style="padding:8px;"><strong>${ex.clave}</strong></td><td style="padding:8px;">${ex.fecha}</td><td style="padding:8px;">${ex.grupoNombre}</td>`;
        tr.onclick = () => {
            const index = examenes.findIndex(e => e.clave === ex.clave);
            if (index !== -1) mostrarRegistro(index);
            document.getElementById('modalBuscadorExamenes').style.display = 'none';
        };
        bodyResultados.appendChild(tr);
    });
}

// EXPORTAR FUNCIONES PARA VENTANAS EXTERNAS O MODALES
window.cargarDatosMaestro = function (maestro) {
    if (!maestro) return;
    const campo = document.getElementById(g_campoBuscadorMaestroActual);
    if (campo) campo.value = maestro.nombre;
    if (g_campoBuscadorMaestroActual === 'maestroBase') _maestroBaseId = maestro.id;
    else if (g_campoBuscadorMaestroActual === 'examinador1') _examinador1Id = maestro.id;
    else if (g_campoBuscadorMaestroActual === 'examinador2') _examinador2Id = maestro.id;
};
window.abrirBuscadorMaestro = abrirBuscadorMaestro;
window.abrirBuscadorGrupo = abrirBuscadorGrupo;
window.filtrarMaestrosBuscador = filtrarMaestrosBuscador;
window.filtrarGruposBuscador = filtrarGruposBuscador;
window.filtrarExamenes = filtrarExamenes;

window.addEventListener('message', (event) => {
    if (event.data?.type === 'MAESTRO_SELECCIONADO') {
        window.cargarDatosMaestro(event.data.maestro);
        const modal = document.getElementById('modalBuscadorMaestro');
        if (modal) modal.style.display = 'none';
    }
});

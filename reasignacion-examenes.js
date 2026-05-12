// Reasignación de Exámenes - Conectado a Supabase
let supabase = null;
let examenes = [];
let registroActual = 0;
let examenSeleccionado = null;

// DOM refs
const claveInput = document.getElementById('claveExamen');
const maestroInput = document.getElementById('maestroBase');
const fechaActualInput = document.getElementById('fechaActual');
const horaActualInput = document.getElementById('horaActual');
const salonActualInput = document.getElementById('salonActual');
const grupoInput = document.getElementById('grupoExamen');
const examinador1Input = document.getElementById('examinador1');
const examinador2Input = document.getElementById('examinador2');
const registroSpan = document.getElementById('registroActual');
const totalSpan = document.getElementById('totalRegistros');
const bodyResultados = document.getElementById('bodyResultados');
const btnReasignar = document.getElementById('btnReasignar');

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await new Promise(r => setTimeout(r, 500));
        if (typeof waitForSupabase === 'function') {
            supabase = await waitForSupabase(10000);
            console.log('✓ Supabase conectado - reasignacion-examenes');
            await cargarCatalogos();
            await cargarExamenes();
        }
    } catch (e) { console.error('Error conectando:', e); }
    actualizarFechaHora();
    setInterval(actualizarFechaHora, 1000);
});

async function cargarCatalogos() {
    if (!supabase) return;
    // Cargar salones para el modal de reasignación
    const { data: salones } = await SessionManager.applyIsolation(supabase.from('salones')).select('numero').order('numero');
    const nuevoSalonSel = document.getElementById('nuevoSalon');
    if (nuevoSalonSel && salones) {
        nuevoSalonSel.innerHTML = '<option value="">— Sin cambio —</option>';
        salones.forEach(s => {
            const o = document.createElement('option');
            o.value = s.numero;
            o.textContent = s.numero;
            nuevoSalonSel.appendChild(o);
        });
    }
}

async function cargarExamenes() {
    if (!supabase) return;
    try {
        const { data: dataMaestros } = await SessionManager.applyIsolation(supabase.from('maestros')).select('id, nombre');
        const mapMaestros = {};
        if (dataMaestros) dataMaestros.forEach(m => mapMaestros[m.id] = m.nombre);

        const { data, error } = await SessionManager.applyIsolation(supabase
            .from('programacion_examenes'))
            .select('id, clave_examen, fecha, hora, salon_id, maestro_base_id, examinador1_id, examinador2_id, grupo_id, grupos(clave, cursos(curso))')
            .order('clave_examen');
        if (error) throw error;

        const clavesVistas = new Set();
        examenes = [];
        if (data) {
            data.forEach(row => {
                if (!clavesVistas.has(row.clave_examen)) {
                    clavesVistas.add(row.clave_examen);
                    const g = row.grupos;
                    examenes.push({
                        clave: row.clave_examen,
                        fecha: row.fecha || '',
                        hora: row.hora || '',
                        salon: row.salon_id ? String(row.salon_id) : '',
                        maestroBase: mapMaestros[row.maestro_base_id] || '',
                        examinador1: mapMaestros[row.examinador1_id] || '',
                        examinador2: mapMaestros[row.examinador2_id] || '',
                        grupoNombre: g?.clave || '',
                    });
                }
            });
        }
        if (totalSpan) totalSpan.textContent = examenes.length;
        const inputReg = document.getElementById('inputRegistro');
        if (inputReg) inputReg.max = examenes.length || 1;
        if (examenes.length > 0) mostrarRegistro(0);
    } catch (e) { console.error('Error:', e); }
}

function mostrarRegistro(index) {
    if (index >= 0 && index < examenes.length) {
        registroActual = index;
        examenSeleccionado = examenes[index];
        const ex = examenSeleccionado;
        if (claveInput) claveInput.value = ex.clave;
        if (maestroInput) maestroInput.value = ex.maestroBase;
        if (fechaActualInput) fechaActualInput.value = ex.fecha;
        if (horaActualInput) horaActualInput.value = ex.hora;
        if (salonActualInput) salonActualInput.value = ex.salon;
        if (grupoInput) grupoInput.value = ex.grupoNombre;
        if (examinador1Input) examinador1Input.value = ex.examinador1;
        if (examinador2Input) examinador2Input.value = ex.examinador2;
        if (btnReasignar) btnReasignar.disabled = false;
        actualizarContador();
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
    const el = document.getElementById('fechaHora');
    if (el) el.textContent = `${dia}/${mes}/${anio} ${String(horas).padStart(2,'0')}:${minutos}:${segundos} ${ampm}`;
}

function actualizarContador() {
    if (registroSpan) registroSpan.textContent = examenes.length > 0 ? registroActual + 1 : 0;
    if (totalSpan) totalSpan.textContent = examenes.length;
    const input = document.getElementById('inputRegistro');
    if (input) input.value = registroActual + 1;
}

// Filtrar en el modal
function filtrarExamenes(termino) {
    termino = (termino || '').trim().toUpperCase();
    let resultados = termino
        ? examenes.filter(e =>
            (e.clave || '').toUpperCase().includes(termino) ||
            (e.grupoNombre || '').toUpperCase().includes(termino))
        : [...examenes];
    if (!bodyResultados) return;
    bodyResultados.innerHTML = '';
    if (!resultados.length) {
        bodyResultados.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:10px;">Sin resultados</td></tr>';
        return;
    }
    resultados.forEach(ex => {
        const tr = document.createElement('tr');
        tr.style.cursor = 'pointer';
        tr.onmouseover = () => tr.style.background = '#f0f9ff';
        tr.onmouseout = () => tr.style.background = '';
        tr.innerHTML = `
            <td style="padding:8px;border-bottom:1px solid #eee;"><strong>${ex.clave}</strong></td>
            <td style="padding:8px;border-bottom:1px solid #eee;">${ex.fecha || ''}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;">${ex.hora || ''}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;">${ex.grupoNombre || ''}</td>`;
        tr.onclick = () => {
            const idx = examenes.findIndex(e => e.clave === ex.clave);
            if (idx !== -1) mostrarRegistro(idx);
            document.getElementById('modalBuscadorExamenes').style.display = 'none';
        };
        bodyResultados.appendChild(tr);
    });
}

// Abrir modal reasignación
function abrirModalReasignar() {
    if (!examenSeleccionado) { alert('Primero seleccione un examen'); return; }
    // Pre-cargar con valores actuales
    const nf = document.getElementById('nuevaFecha');
    const nh = document.getElementById('nuevaHora');
    const ns = document.getElementById('nuevoSalon');
    if (nf) nf.value = examenSeleccionado.fecha || '';
    if (nh) nh.value = examenSeleccionado.hora || '';
    if (ns) ns.value = examenSeleccionado.salon || '';
    const msg = document.getElementById('mensajeConflicto');
    if (msg) { msg.style.display = 'none'; msg.textContent = ''; }
    document.getElementById('modalReasignar').style.display = 'flex';
}

// Confirmar reasignación
document.getElementById('btnConfirmarReasignacion')?.addEventListener('click', async () => {
    if (!supabase || !examenSeleccionado) return;
    const nuevaFecha = document.getElementById('nuevaFecha').value;
    const nuevaHora = document.getElementById('nuevaHora').value;
    const nuevoSalon = document.getElementById('nuevoSalon').value;
    const msgEl = document.getElementById('mensajeConflicto');

    if (!nuevaFecha && !nuevaHora && !nuevoSalon) {
        alert('No ha modificado ningún campo.');
        return;
    }

    const fechaFinal = nuevaFecha || examenSeleccionado.fecha;
    const horaFinal = nuevaHora || examenSeleccionado.hora;
    const salonFinal = nuevoSalon || examenSeleccionado.salon;

    // Verificar conflicto si hay fecha, hora y salón
    if (fechaFinal && horaFinal && salonFinal) {
        try {
            const { data: confData, error: confErr } = await supabase.rpc('check_salon_examen_disponible', {
                p_salon: salonFinal,
                p_fecha: fechaFinal,
                p_hora: horaFinal + ':00',
                p_excluir_clave: examenSeleccionado.clave
            });
            if (!confErr && confData && !confData.disponible) {
                if (msgEl) {
                    msgEl.textContent = '⚠️ ' + confData.motivo;
                    msgEl.style.display = 'block';
                }
                return;
            }
        } catch (e) {
            console.warn('No se pudo verificar disponibilidad:', e.message);
        }
    }

    // Guardar cambios
    try {
        const updateData = {};
        if (nuevaFecha) updateData.fecha = nuevaFecha;
        if (nuevaHora) updateData.hora = nuevaHora;
        if (nuevoSalon) updateData.salon_id = nuevoSalon;

        const { error } = await SessionManager.applyIsolation(supabase
            .from('programacion_examenes'))
            .update(updateData)
            .eq('clave_examen', examenSeleccionado.clave);
        if (error) throw error;

        alert('✅ Examen reasignado correctamente');
        document.getElementById('modalReasignar').style.display = 'none';
        await cargarExamenes();
    } catch (e) {
        alert('Error al reasignar: ' + e.message);
    }
});

// Botones
document.getElementById('btnBuscar')?.addEventListener('click', () => {
    const inputB = document.getElementById('inputBusquedaExamen');
    if (inputB) { inputB.value = ''; filtrarExamenes(''); }
    document.getElementById('modalBuscadorExamenes').style.display = 'flex';
    if (inputB) setTimeout(() => inputB.focus(), 50);
});

document.getElementById('btnReasignar')?.addEventListener('click', abrirModalReasignar);
document.getElementById('btnTerminar')?.addEventListener('click', () => { window.location.href = 'examenes-menu.html'; });
document.getElementById('btnPrimero')?.addEventListener('click', () => mostrarRegistro(0));
document.getElementById('btnUltimo')?.addEventListener('click', () => mostrarRegistro(examenes.length - 1));
document.getElementById('btnAnterior')?.addEventListener('click', () => { if (registroActual > 0) mostrarRegistro(registroActual - 1); });
document.getElementById('btnSiguiente')?.addEventListener('click', () => { if (registroActual < examenes.length - 1) mostrarRegistro(registroActual + 1); });
document.getElementById('btnBuscarRegistro')?.addEventListener('click', () => {
    const num = parseInt(document.getElementById('inputRegistro').value);
    if (num > 0 && num <= examenes.length) mostrarRegistro(num - 1);
});

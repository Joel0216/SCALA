// Relación de Exámenes - Conectado a Supabase
var supabase = null;
let examenes = [];
let registroActual = 0;

// DOM refs
const claveInput = document.getElementById('claveExamen');
const fechaInput = document.getElementById('fechaExamen');
const horaInput = document.getElementById('horaExamen');
const salonInput = document.getElementById('salonExamen');
const maestroInput = document.getElementById('maestroBase');
const examinador1Input = document.getElementById('examinador1');
const examinador2Input = document.getElementById('examinador2');
const grupoInput = document.getElementById('grupoExamen');
const registroSpan = document.getElementById('registroActual');
const totalSpan = document.getElementById('totalRegistros');
const bodyAlumnos = document.getElementById('bodyAlumnos');
const bodyResultados = document.getElementById('bodyResultados');

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await new Promise(r => setTimeout(r, 500));
        if (typeof waitForSupabase === 'function') {
            supabase = await waitForSupabase(10000);
            console.log('✓ Supabase conectado - relacion-examenes');
            await cargarExamenes();
        }
    } catch (e) { console.error('Error conectando:', e); }
    actualizarFechaHora();
    setInterval(actualizarFechaHora, 1000);
});

async function cargarExamenes() {
    if (!supabase) return;
    try {
        const { data: dataMaestros } = await SessionManager.applyIsolation(supabase.from('maestros').select('id, nombre, clave'));
        const mapMaestros = {};
        if (dataMaestros) dataMaestros.forEach(m => mapMaestros[m.id] = { nombre: m.nombre, clave: m.clave });

        const { data, error } = await SessionManager.applyIsolation(supabase
            .from('programacion_examenes').select('id, clave_examen, fecha, hora, salon_id, maestro_base_id, examinador1_id, examinador2_id, grupo_id, grupos(clave, cursos(curso))'))
            .is('alumno_id', null)
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
                        salon: row.salon_id || '',
                        maestroBase: mapMaestros[row.maestro_base_id]?.nombre || '',
                        examinador1: mapMaestros[row.examinador1_id]?.nombre || '',
                        examinador2: mapMaestros[row.examinador2_id]?.nombre || '',
                        grupoNombre: g?.clave || '',
                        grupoId: row.grupo_id || null,
                        curso: g?.cursos?.curso || ''
                    });
                }
            });
        }
        if (totalSpan) totalSpan.textContent = examenes.length;
        const inputReg = document.getElementById('inputRegistro');
        if (inputReg) inputReg.max = examenes.length || 1;
        if (examenes.length > 0) mostrarRegistro(0);
    } catch (e) { console.error('Error cargando exámenes:', e); }
}

async function mostrarRegistro(index) {
    if (index >= 0 && index < examenes.length) {
        registroActual = index;
        const ex = examenes[index];
        if (claveInput) claveInput.value = ex.clave;
        if (fechaInput) fechaInput.value = ex.fecha;
        if (horaInput) horaInput.value = ex.hora;
        if (salonInput) salonInput.value = ex.salon;
        if (maestroInput) maestroInput.value = ex.maestroBase;
        if (examinador1Input) examinador1Input.value = ex.examinador1;
        if (examinador2Input) examinador2Input.value = ex.examinador2;
        if (grupoInput) grupoInput.value = ex.grupoNombre;
        actualizarContador();
        await cargarAlumnosExamen(ex.clave);
    }
}

async function cargarAlumnosExamen(clave) {
    if (!supabase || !bodyAlumnos) return;
    bodyAlumnos.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:12px;">Cargando...</td></tr>';
    try {
        // Intentar cargar resultados ya guardados
        const { data: resultados, error: errRes } = await SessionManager.applyIsolation(supabase
            .from('resultados_examen').select(`
                id, clave_examen, alumno_id, presento, aprobo, calificacion, nota, hora_calificacion,
                alumnos(credencial, nombre),
                maestros_calificador:maestros!maestro_calificador_id(nombre, clave)
            `))
            .eq('clave_examen', clave)
            .order('alumno_id');

        if (errRes && errRes.code === '42P01') {
            bodyAlumnos.innerHTML = '<tr><td colspan="9" style="text-align:center;color:#f59e0b;padding:12px;">⚠️ Ejecute el SQL de migración en Supabase.</td></tr>';
            return;
        }

        if (!errRes && resultados && resultados.length > 0) {
            // Hay resultados guardados: mostrarlos
            mostrarAlumnosTabla(resultados);
            return;
        }

        // Sin resultados: cargar alumnos del grupo del examen (para pre-visualizar)
        const examen = examenes.find(e => e.clave === clave);
        if (!examen || !examen.grupoNombre) {
            bodyAlumnos.innerHTML = '<tr><td colspan="9" style="text-align:center;color:#666;padding:12px;">No hay alumnos registrados para este examen</td></tr>';
            return;
        }

        const { data: agData, error: errAg } = await SessionManager.applyIsolation(supabase
            .from('alumno_grupos').select('alumno_id'))
            .eq('grupo_clave', examen.grupoNombre)
            .eq('estado', 'Activo');

        if (errAg || !agData || agData.length === 0) {
            bodyAlumnos.innerHTML = '<tr><td colspan="9" style="text-align:center;color:#666;padding:12px;">El examen aún no ha sido aplicado — no hay calificaciones</td></tr>';
            return;
        }

        const alumnoIds = agData.map(a => a.alumno_id);
        const { data: alumnosDatos, error: errAl } = await SessionManager.applyIsolation(supabase
            .from('alumnos').select('id, credencial, nombre'))
            .in('id', alumnoIds)
            .eq('activo', true);

        if (errAl || !alumnosDatos || alumnosDatos.length === 0) {
            bodyAlumnos.innerHTML = '<tr><td colspan="9" style="text-align:center;color:#666;padding:12px;">El examen aún no ha sido aplicado — no hay calificaciones</td></tr>';
            return;
        }

        // Mostrar alumnos del grupo como pendientes (sin calificación aún)
        const fakeResultados = alumnosDatos
            .map(a => ({
                id: null,
                alumnos: a,
                presento: null,
                aprobo: null,
                calificacion: null,
                nota: null,
                hora_calificacion: null,
                maestros_calificador: null,
            }));
        mostrarAlumnosTabla(fakeResultados, true);
    } catch (e) {
        console.error('Error cargando alumnos:', e);
        bodyAlumnos.innerHTML = `<tr><td colspan="9" style="text-align:center;color:red;padding:12px;">Error: ${e.message}</td></tr>`;
    }
}

function mostrarAlumnosTabla(alumnos, pendiente = false) {
    bodyAlumnos.innerHTML = '';
    if (!alumnos.length) {
        bodyAlumnos.innerHTML = '<tr><td colspan="10" style="text-align:center;color:#666;padding:12px;">No hay alumnos en este grupo</td></tr>';
        return;
    }

    alumnos.forEach(r => {
        const tr = document.createElement('tr');
        const calif = r.calificacion !== null ? r.calificacion : '';
        const horaCalif = r.hora_calificacion ? new Date(r.hora_calificacion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--';
        
        // Determinar badge de aprobado
        let aproboBadge = '';
        if (r.calificacion !== null) {
            const esAprobado = r.calificacion >= 60; // O la lógica que prefieras
            aproboBadge = esAprobado ? '<span style="color:green;">✓</span>' : '<span style="color:red;">✗</span>';
        }

        tr.innerHTML = `
            <td style="text-align:center;">►</td>
            <td>${r.maestros_calificador?.nombre || 'Pendiente'}</td>
            <td>${r.maestros_calificador?.clave || '--'}</td>
            <td>${horaCalif}</td>
            <td><b>${r.alumnos?.credencial || ''}</b></td>
            <td>${r.alumnos?.nombre || ''}</td>
            <td style="text-align:center;">
                <input type="checkbox" ${r.presento ? 'checked' : ''} disabled
                    style="cursor:not-allowed; opacity:0.8;">
            </td>
            <td style="text-align:center;">
                <input type="checkbox" ${r.aprobo ? 'checked' : ''} disabled
                    style="cursor:not-allowed; opacity:0.8;">
                <div style="font-size:10px;">${aproboBadge}</div>
            </td>
            <td style="text-align:center; font-weight:bold;">
                ${calif !== '' ? calif : '<span style="color:#aaa;">—</span>'}
            </td>
            <td style="color:#555;font-size:11px;">${r.nota || ''}</td>`;
        bodyAlumnos.appendChild(tr);
    });
}

async function actualizarCalificacion(input) {
    if (!supabase || !input.dataset.id) return;
    const val = parseFloat(input.value);
    const alumnoId = input.dataset.alumnoId;

    try {
        const { error } = await SessionManager.applyIsolation(supabase.from('resultados_examen').update({ calificacion: val })).eq('id', input.dataset.id);
        if (error) throw error;
        
        // Si la calificación es aprobatoria (>= 60 o 6), sugerir marcar como aprobado?
        // El usuario dijo "ponga la calificacion aprobatoria pasaea al grado 2"
        // Asumimos que si pone >= 6 (o 60 si es escala 100), podemos preguntar o automatizar.
    } catch (e) {
        alert('Error: ' + e.message);
    }
}

async function actualizarAprobado(chk) {
    if (!supabase || !chk.dataset.id) return;
    const aprobado = chk.checked;
    const alumnoId = chk.dataset.alumnoId;

    try {
        const { error } = await SessionManager.applyIsolation(supabase.from('resultados_examen').update({ aprobo: aprobado })).eq('id', chk.dataset.id);
        if (error) throw error;

        if (aprobado) {
            // Verificar calificación mínima de 70 para promover
            const { data: resEx } = await SessionManager.applyIsolation(supabase.from('resultados_examen').select('calificacion')).eq('id', chk.dataset.id).single();
            if (resEx && resEx.calificacion >= 70) {
                await promoverGrado(alumnoId);
            } else if (resEx) {
                alert('Nota: Se marcó como aprobado, pero el grado no se incrementará automáticamente porque la calificación es menor a 70.');
            }
        }
    } catch (e) {
        chk.checked = !aprobado;
        alert('Error: ' + e.message);
    }
}

async function promoverGrado(alumnoId) {
    if (!supabase || !alumnoId) return;

    try {
        // 1. Obtener grado actual
        const { data: alumno, error: errAl } = await SessionManager.applyIsolation(supabase.from('alumnos').select('grado_actual, grupo_clave')).eq('id', alumnoId).single();
        if (errAl) throw errAl;

        let gradoActual = parseInt(alumno.grado_actual) || 1;
        if (gradoActual < 6) {
            let nuevoGrado = gradoActual + 1;

            // 2. Actualizar alumno globalmente
            const { error: errUpd } = await SessionManager.applyIsolation(supabase.from('alumnos').update({ 
                grado_actual: nuevoGrado,
                fecha_grado_actualizada: new Date().toISOString()
            })).eq('id', alumnoId);
            if (errUpd) throw errUpd;

            // 3. Actualizar inscripción activa (alumno_grupos)
            if (alumno.grupo_clave) {
                const { error: errInsc } = await SessionManager.applyIsolation(supabase.from('alumno_grupos')
                    .update({ grado: nuevoGrado }))
                    .eq('alumno_id', alumnoId)
                    .eq('grupo_clave', alumno.grupo_clave)
                    .eq('estado', 'Activo');
                if (errInsc) console.warn('No se pudo actualizar grado en alumno_grupos:', errInsc);
            }

            console.log(`Alumno ${alumnoId} promovido del grado ${gradoActual} al grado ${nuevoGrado}`);
        }
    } catch (e) {
        console.error('Error en promoción de grado:', e);
    }
}

async function actualizarEstado(chk, campo) {
    if (!supabase) return;
    try {
        const obj = {};
        obj[campo] = chk.checked;
        const { error } = await SessionManager.applyIsolation(supabase.from('resultados_examen').update(obj)).eq('id', chk.dataset.id);
        if (error) throw error;
    } catch (e) {
        console.error('Error actualizando:', e);
        chk.checked = !chk.checked;
        alert('No se pudo guardar el cambio: ' + e.message);
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

function actualizarContador() {
    if (registroSpan) registroSpan.textContent = examenes.length > 0 ? registroActual + 1 : 0;
    if (totalSpan) totalSpan.textContent = examenes.length;
    const input = document.getElementById('inputRegistro');
    if (input) input.value = registroActual + 1;
}

// Filtrado del modal de búsqueda
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
        bodyResultados.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:10px;">Sin resultados</td></tr>';
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
            <td style="padding:8px;border-bottom:1px solid #eee;">${ex.grupoNombre || ''}</td>`;
        tr.onclick = () => {
            const idx = examenes.findIndex(e => e.clave === ex.clave);
            if (idx !== -1) mostrarRegistro(idx);
            document.getElementById('modalBuscadorExamenes').style.display = 'none';
        };
        bodyResultados.appendChild(tr);
    });
}

// Botones
document.getElementById('btnBuscar')?.addEventListener('click', () => {
    const inputB = document.getElementById('inputBusquedaExamen');
    if (inputB) { inputB.value = ''; filtrarExamenes(''); }
    document.getElementById('modalBuscadorExamenes').style.display = 'flex';
    if (inputB) setTimeout(() => inputB.focus(), 50);
});

document.getElementById('btnTerminar')?.addEventListener('click', () => { window.location.href = 'examenes-menu.html'; });
document.getElementById('btnPrimero')?.addEventListener('click', () => mostrarRegistro(0));
document.getElementById('btnUltimo')?.addEventListener('click', () => mostrarRegistro(examenes.length - 1));
document.getElementById('btnAnterior')?.addEventListener('click', () => { if (registroActual > 0) mostrarRegistro(registroActual - 1); });
document.getElementById('btnSiguiente')?.addEventListener('click', () => { if (registroActual < examenes.length - 1) mostrarRegistro(registroActual + 1); });
document.getElementById('btnBuscarRegistro')?.addEventListener('click', () => {
    const num = parseInt(document.getElementById('inputRegistro').value);
    if (num > 0 && num <= examenes.length) mostrarRegistro(num - 1);
});

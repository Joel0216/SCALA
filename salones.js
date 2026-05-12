/**
 * salones.js - Módulo de Salones
 * Gestiona salones y sus instrumentos asociados (M:N).
 */

let g_salonActual = null;          // null si es nuevo, o el numero de salón si estamos editando
let g_modoEdicion = false;
let g_instrumentosAsignados = [];  // Array de { clave, descripcion }

document.addEventListener('DOMContentLoaded', async () => {
    limpiarFormulario();

    // Validaciones de Cupo
    const cupoInput = document.getElementById('cupo');
    if (cupoInput) {
        cupoInput.addEventListener('input', function() {
            // Eliminar cualquier cosa que no sea número
            this.value = this.value.replace(/[^0-9]/g, '');
            // Asegurar que no sea negativo (aunque el regex anterior ya ayuda)
            if (parseInt(this.value) < 0) this.value = '0';
        });
    }

    if (typeof window.waitForSupabase === 'function') {
        await window.waitForSupabase(5000);
    }
});

function getClient() {
    if (!window.supabase) {
        mostrarAlerta('No se pudo conectar a la base de datos.');
        return null;
    }
    return window.supabase;
}

// ==============================
// RUTINAS DE UI
// ==============================
function limpiarFormulario() {
    g_salonActual = null;
    g_instrumentosAsignados = [];

    document.getElementById('numero').value = '';
    document.getElementById('ubicacion').value = '';
    document.getElementById('cupo').value = '0';

    document.getElementById('btnEditar').disabled = true;
    document.getElementById('btnBorrar').disabled = true;

    cambiarModoEdicion(false);
    renderInstrumentos();
}

function cambiarModoEdicion(edicion) {
    g_modoEdicion = edicion;
    const isNew = g_salonActual === null && edicion;

    // Solo se permite editar el número si es uno NUEVO
    const inputNumero = document.getElementById('numero');
    inputNumero.readOnly = !isNew;
    inputNumero.style.backgroundColor = isNew ? '#fff' : '#e0e0e0';

    const inputs = ['ubicacion', 'cupo'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        el.readOnly = !edicion;
        el.style.backgroundColor = edicion ? '#fff' : '#e0e0e0';
    });

    if (edicion) {
        if (isNew) inputNumero.focus();
        else document.getElementById('ubicacion').focus();

        document.getElementById('btnGroupPrincipal').style.display = 'none';
        document.getElementById('btnGroupEdicion').style.display = 'flex';
        document.getElementById('btnAgregarInst').style.display = 'inline-block';
    } else {
        document.getElementById('btnGroupPrincipal').style.display = 'flex';
        document.getElementById('btnGroupEdicion').style.display = 'none';
        document.getElementById('btnAgregarInst').style.display = 'none';

        const tieneDato = document.getElementById('numero').value.trim() !== '';
        document.getElementById('btnEditar').disabled = !tieneDato;
        document.getElementById('btnBorrar').disabled = !tieneDato;
    }

    renderInstrumentos();
}

function renderInstrumentos() {
    const tbody = document.getElementById('tablaInstrumentos');
    tbody.innerHTML = '';

    if (g_instrumentosAsignados.length === 0) {
        tbody.innerHTML = '<tr id="rowVaciaInst"><td colspan="3" style="text-align: center;">Sin instrumentos asignados.</td></tr>';
        return;
    }

    g_instrumentosAsignados.forEach((inst, index) => {
        const tr = document.createElement('tr');

        let actionHtml = '';
        if (g_modoEdicion) {
            actionHtml = `<button class="delete-row-btn" onclick="quitarInstrumento(${index})">Eliminar</button>`;
        }

        tr.innerHTML = `
            <td>${inst.clave}</td>
            <td>${inst.descripcion}</td>
            <td style="text-align: center;">${actionHtml}</td>
        `;
        tbody.appendChild(tr);
    });
}

function quitarInstrumento(index) {
    if (!g_modoEdicion) return;
    g_instrumentosAsignados.splice(index, 1);
    renderInstrumentos();
}

// ==============================
// FLUJO CRUD PRINCIPAL
// ==============================
function nuevo() {
    limpiarFormulario();
    cambiarModoEdicion(true);
}

function editar() {
    if (!g_salonActual) return;
    cambiarModoEdicion(true);
}

function cancelar() {
    if (g_salonActual) {
        // Recargar datos originales para deshacer cambios
        cargarSalon(g_salonActual);
    } else {
        limpiarFormulario();
    }
}

window.terminar = function terminar() {
    window.location.href = 'otros-catalogos.html';
};

async function guardar() {
    const numeroStr = document.getElementById('numero').value.trim();
    const ubicacion = document.getElementById('ubicacion').value.trim().toUpperCase();
    const cupoStr = document.getElementById('cupo').value.trim();

    if (!numeroStr) return await mostrarAlerta('El número del salón es obligatorio.');
    if (!ubicacion) return await mostrarAlerta('La ubicación es obligatoria.');

    const numero = parseInt(numeroStr);
    const cupo = parseInt(cupoStr) || 0;

    if (cupo < 0) return await mostrarAlerta('El cupo no puede ser negativo.');

    const client = getClient();
    if (!client) return;

    try {
        if (!g_salonActual) {
            // NUEVO
            const { data: verif } = await SessionManager.applyIsolation(client.from('salones').select('numero')).eq('numero', numero).single();
            if (verif) {
                return await mostrarAlerta(`El salón número ${numero} ya existe.`);
            }

            const { error: insertErr } = await client.from('salones').insert([{ 
                numero, 
                ubicacion, 
                cupo,
                organizacion_id: SessionManager.getCurrentUser()?.organizacion_id
            }]);
            if (insertErr) throw insertErr;
        } else {
            // EDICIÓN
            const { error: updateErr } = await client.from('salones').update({ ubicacion, cupo }).eq('numero', g_salonActual);
            if (updateErr) throw updateErr;
        }

        // GUARDAR RELACIONES DE INSTRUMENTOS
        // 1. Borrar todas las relaciones actuales de este salón
        const { error: delRelErr } = await client.from('salon_instrumentos').delete().eq('salon_numero', numero);
        if (delRelErr) throw delRelErr;

        // 2. Insertar las nuevas relaciones
        if (g_instrumentosAsignados.length > 0) {
            const rels = g_instrumentosAsignados.map(inst => ({
                salon_numero: numero,
                instrumento_clave: inst.clave
            }));
            const { error: insRelErr } = await client.from('salon_instrumentos').insert(rels);
            if (insRelErr) throw insRelErr;
        }

        await mostrarAlerta(`Salón ${numero} guardado correctamente.`);
        cargarSalon(numero); // Recarga para salir del modo edición limpiamente
    } catch (e) {
        console.error(e);
        await mostrarAlerta(`Error al guardar: ${e.message}`);
    }
}

async function borrar() {
    if (!g_salonActual) return;

    const seguro = await mostrarConfirm(`¿Está completamente seguro de eliminar el Salón ${g_salonActual}?`);
    if (!seguro) return;

    const client = getClient();
    if (!client) return;

    try {
        // La tabla salon_instrumentos tiene ON DELETE CASCADE, por lo que se borran solos
        const { error } = await client.from('salones').delete().eq('numero', g_salonActual);
        if (error) throw error;

        await mostrarAlerta('Salón eliminado con éxito.');
        limpiarFormulario();
    } catch (e) {
        console.error(e);
        await mostrarAlerta(`Error: No se pudo eliminar. ${e.message}`);
    }
}

// ==============================
// BUSCADOR MODAL DE SALONES
// ==============================
window.abrirModalBusquedaSalones = function () {
    document.getElementById('modalBusquedaSalones').style.display = 'flex';
    document.getElementById('inputBuscarSalones').value = '';
    document.getElementById('bodyBusquedaSalones').innerHTML = '';
    setTimeout(() => document.getElementById('inputBuscarSalones').focus(), 100);
    buscarSalonesEmergente();
};

window.cerrarBusquedaSalones = function () {
    document.getElementById('modalBusquedaSalones').style.display = 'none';
};

window.buscarSalonesEmergente = async function () {
    const term = document.getElementById('inputBuscarSalones').value.trim();
    const client = getClient();
    if (!client) return;

    const tbody = document.getElementById('bodyBusquedaSalones');
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Buscando...</td></tr>';

    try {
        let query = SessionManager.applyIsolation(client.from('salones').select('*'));
        if (term) {
            // Intenta buscar por numero si es un numero, sino por ubicacion
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
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No se encontró similitud</td></tr>';
            return;
        }

        data.forEach(item => {
            const tr = document.createElement('tr');
            tr.onclick = () => {
                cerrarBusquedaSalones();
                cargarSalon(item.numero);
            };
            tr.innerHTML = `
                <td>${item.numero}</td>
                <td>${item.ubicacion || ''}</td>
                <td>${item.cupo || 0}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:red;">Error: ${e.message}</td></tr>`;
    }
};

window.cargarSalon = async function (numero) {
    const client = getClient();
    if (!client) return;

    try {
        const { data: salon, error: esalon } = await SessionManager.applyIsolation(client.from('salones').select('*')).eq('numero', numero).single();
        if (esalon) throw esalon;

        // Cargar instrumentos
        const { data: rels, error: erels } = await client
            .from('salon_instrumentos')
            .select(`
                instrumento_clave,
                instrumentos!inner(descripcion)
            `)
            .eq('salon_numero', numero);

        if (erels) throw erels;

        g_salonActual = salon.numero;
        document.getElementById('numero').value = salon.numero;
        document.getElementById('ubicacion').value = salon.ubicacion || '';
        document.getElementById('cupo').value = salon.cupo || 0;

        g_instrumentosAsignados = rels.map(r => ({
            clave: r.instrumento_clave,
            descripcion: r.instrumentos.descripcion
        }));

        cambiarModoEdicion(false); // Refresca UI a solo lectura
    } catch (e) {
        console.error(e);
        mostrarAlerta(`Error al cargar el salón: ${e.message}`);
    }
};

// ==============================
// BUSCADOR MODAL DE INSTRUMENTOS
// ==============================
window.abrirBusquedaInstrumento = function () {
    if (!g_modoEdicion) return;
    document.getElementById('modalBusquedaInstrumento').style.display = 'flex';
    document.getElementById('inputBuscarInstrumento').value = '';
    buscarInstrumentosEmergente();
    setTimeout(() => document.getElementById('inputBuscarInstrumento').focus(), 100);
};

window.cerrarBusquedaInstrumento = function () {
    document.getElementById('modalBusquedaInstrumento').style.display = 'none';
};

window.buscarInstrumentosEmergente = async function () {
    const term = document.getElementById('inputBuscarInstrumento').value.trim();
    const client = getClient();
    if (!client) return;

    const tbody = document.getElementById('bodyBusquedaInstrumento');
    tbody.innerHTML = '<tr><td colspan="2" style="text-align:center;">Buscando...</td></tr>';

    try {
        let query = SessionManager.applyIsolation(client.from('instrumentos').select('*')).eq('activo', true);
        if (term) query = query.or(`clave.ilike.%${term}%,descripcion.ilike.%${term}%`);

        const { data, error } = await query.order('descripcion').limit(50);
        if (error) throw error;

        tbody.innerHTML = '';
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="2" style="text-align:center;">No se encontraron instrumentos</td></tr>';
            return;
        }

        data.forEach(item => {
            const tr = document.createElement('tr');
            tr.onclick = () => seleccionarInstrumento(item.clave, item.descripcion);
            tr.innerHTML = `<td>${item.clave}</td><td>${item.descripcion}</td>`;
            tbody.appendChild(tr);
        });
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="2" style="text-align:center;color:red;">Error: ${e.message}</td></tr>`;
    }
};

window.seleccionarInstrumento = function (clave, descripcion) {
    const existe = g_instrumentosAsignados.find(i => i.clave === clave);
    if (existe) {
        // No alert if you just want smooth UX, or alert safely:
        cerrarBusquedaInstrumento();
        setTimeout(() => mostrarAlerta('El instrumento ya está asignado a este salón.'), 100);
        return;
    }

    g_instrumentosAsignados.push({ clave, descripcion });
    renderInstrumentos();
    cerrarBusquedaInstrumento();
};

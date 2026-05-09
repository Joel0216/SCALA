/**
 * instrumentos.js - Módulo de Instrumentos Musicales
 * Crea, busca y borra instrumentos. La clave se autogenera.
 */

let g_instrumentoActual = null;
let g_modoEdicion = false;

document.addEventListener('DOMContentLoaded', async () => {
    // Iniciar con todo en blanco
    limpiarFormulario();

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
    g_instrumentoActual = null;
    document.getElementById('clave').value = '';
    document.getElementById('descripcion').value = '';
    document.getElementById('btnBorrar').disabled = true;
    cambiarModoEdicion(false);
}

function cambiarModoEdicion(edicion) {
    g_modoEdicion = edicion;
    const desc = document.getElementById('descripcion');

    if (edicion) {
        desc.readOnly = false;
        desc.style.backgroundColor = '#fff';
        desc.focus();

        document.getElementById('btnGroupPrincipal').style.display = 'none';
        document.getElementById('btnGroupEdicion').style.display = 'flex';
    } else {
        desc.readOnly = true;
        desc.style.backgroundColor = '#e0e0e0';

        document.getElementById('btnGroupPrincipal').style.display = 'flex';
        document.getElementById('btnGroupEdicion').style.display = 'none';

        const tieneDato = document.getElementById('clave').value.trim() !== '';
        document.getElementById('btnBorrar').disabled = !tieneDato;
    }
}

// ==============================
// GENERADOR DE CLAVES
// ==============================
function generarClave() {
    // Solo generar si es uno nuevo
    if (g_instrumentoActual) return;

    // Regla pedida: "BATER. ACUST. YAMAHA" -> "BAAY" (Primeras letras usualmente)
    // Para simplificar una clave limpia y sin chocar, tomaremos la primera letra de hasta 4 palabras, o las primeras 4 letras de la primera palabra.
    const desc = document.getElementById('descripcion').value.toUpperCase().trim();
    if (!desc) {
        document.getElementById('clave').value = '';
        return;
    }

    const words = desc.split(/[\s.-]+/).filter(w => w.length > 0);
    let clave = '';

    if (words.length >= 4) {
        clave = words[0][0] + words[1][0] + words[2][0] + words[3][0];
    } else if (words.length === 3) {
        clave = words[0].substring(0, 2) + words[1][0] + words[2][0];
    } else if (words.length === 2) {
        clave = words[0].substring(0, 2) + words[1].substring(0, 2);
    } else {
        clave = words[0].substring(0, 4);
    }

    // Asegurarse que es max de 4 o 5 letras
    document.getElementById('clave').value = clave.substring(0, 4).toUpperCase();
}

// ==============================
// FLUJO CRUD PRINCIPAL
// ==============================
function nuevo() {
    limpiarFormulario();
    cambiarModoEdicion(true);
}

function cancelar() {
    limpiarFormulario();
}

window.terminar = function () {
    window.location.href = 'archivos.html';
};

async function guardar() {
    const clave = document.getElementById('clave').value.trim();
    const desc = document.getElementById('descripcion').value.trim().toUpperCase();

    if (!clave || !desc) {
        return await mostrarAlerta('La descripción es requerida para generar la clave.');
    }

    const client = getClient();
    if (!client) return;

    try {
        // En "Nuevo", hay que verificar si la clave generada ya existe para evitar choques PK
        if (!g_instrumentoActual) {
            const { data: verif, error: verifError } = await client.from('instrumentos').select('clave').eq('clave', clave).maybeSingle();
            if (verif) {
                return await mostrarAlerta(`La clave '${clave}' ya existe. Prueba añadir un detalle extra a tu descripción.`);
            }

            const { error: insertErr } = await client.from('instrumentos').insert([{ clave: clave, descripcion: desc }]);
            if (insertErr) throw insertErr;
            await mostrarAlerta(`Instrumento guardado correctamente con clave ${clave}`);
        } else {
            // Edición de una descripción existente (La clave primaria NO cambia)
            const { error: updateErr } = await client.from('instrumentos').update({ descripcion: desc }).eq('clave', clave);
            if (updateErr) throw updateErr;
            await mostrarAlerta('Datos actualizados correctamente.');
        }

        limpiarFormulario();
    } catch (e) {
        console.error(e);
        await mostrarAlerta(`Error al guardar: ${e.message}`);
    }
}

async function borrar() {
    const clave = document.getElementById('clave').value;
    if (!clave) return;

    const seguro = await mostrarConfirm(`¿Está completamente seguro de eliminar el instrumento [${clave}]?`);
    if (!seguro) return;

    const client = getClient();
    if (!client) return;

    try {
        const { error } = await client.from('instrumentos').delete().eq('clave', clave);
        if (error) throw error;

        await mostrarAlerta('Instrumento eliminado con éxito.');
        limpiarFormulario();
    } catch (e) {
        console.error(e);
        await mostrarAlerta(`Error: No se pudo eliminar el instrumento. Puede estar asociado a salones. ${e.message}`);
    }
}


// ==============================
// BUSCADOR MODAL DE INSTRUMENTOS
// ==============================
window.abrirModalBusqueda = function () {
    document.getElementById('modalBusqueda').style.display = 'flex';
    document.getElementById('inputBusqueda').value = '';
    document.getElementById('bodyBusqueda').innerHTML = '';
    setTimeout(() => document.getElementById('inputBusqueda').focus(), 100);
    // Auto-search by default like previous models
    buscarDatosEmergente();
};

window.cerrarModalBusqueda = function () {
    document.getElementById('modalBusqueda').style.display = 'none';
};

window.buscarDatosEmergente = async function () {
    const term = document.getElementById('inputBusqueda').value.trim();
    const client = getClient();
    if (!client) return;

    const tbody = document.getElementById('bodyBusqueda');
    tbody.innerHTML = '<tr><td colspan="2" style="text-align:center;">Buscando...</td></tr>';

    try {
        let query = client.from('instrumentos').select('*').eq('activo', true);
        if (term) {
            query = query.or(`clave.ilike.%${term}%,descripcion.ilike.%${term}%`);
        }

        const { data, error } = await query.order('descripcion').limit(50);
        if (error) throw error;

        tbody.innerHTML = '';
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="2" style="text-align:center;">No se encontró similitud</td></tr>';
            return;
        }

        data.forEach(item => {
            const tr = document.createElement('tr');
            tr.onclick = () => aplicarFiltro(item);
            tr.innerHTML = `
                <td>${item.clave || ''}</td>
                <td>${item.descripcion || ''}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="2" style="text-align:center;color:red;">Error: ${e.message}</td></tr>`;
    }
};

function aplicarFiltro(obj) {
    limpiarFormulario();
    g_instrumentoActual = obj;
    document.getElementById('clave').value = obj.clave;
    document.getElementById('descripcion').value = obj.descripcion;
    cerrarModalBusqueda();
    cambiarModoEdicion(true); // Se carga habilitando edición instantánea sobre la descripción

    // Alarma para indicar que se está editando 
    document.getElementById('btnBorrar').disabled = false;
}

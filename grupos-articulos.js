/**
 * grupos-articulos.js - Módulo de Grupos de Artículos
 */

let g_grupoActual = null;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Grupos de Artículos: Inicializando...');

    // Reloj
    setInterval(() => {
        const el = document.getElementById('datetime');
        if (el) el.textContent = new Date().toLocaleString('es-MX');
    }, 1000);

    limpiarFormulario();
});

function getClient() {
    return window.supabase || (typeof getSupabase === 'function' ? getSupabase() : null);
}

// ==============================
// FLUJO DE "NUEVO"
// ==============================

function iniciarNuevo() {
    limpiarFormulario();
    document.getElementById('btnNuevo').classList.add('hidden');
    document.getElementById('btnGuardar').classList.remove('hidden');
    document.getElementById('btnCancelar').classList.remove('hidden');

    const nombreInput = document.getElementById('nombre');
    nombreInput.readOnly = false;
    document.getElementById('btnBorrar').disabled = true;
    nombreInput.focus();
}

function cancelarNuevo() {
    limpiarFormulario();
    document.getElementById('btnNuevo').classList.remove('hidden');
    document.getElementById('btnGuardar').classList.add('hidden');
    document.getElementById('btnCancelar').classList.add('hidden');

    document.getElementById('nombre').readOnly = true;
}

async function guardarNuevo() {
    const nombre = document.getElementById('nombre').value.trim();

    if (!nombre) return await mostrarAlerta('Por favor, introduzca un nombre de grupo.');

    const client = getClient();
    if (!client) return await mostrarAlerta('Problema con conexión a Supabase.');

    try {
        const { error } = await client.from('grupos_articulos').insert([{
            grupo: nombre,
            activo: true,
            organizacion_id: SessionManager.getCurrentUser()?.organizacion_id
        }]);

        if (error) throw error;

        await mostrarAlerta('Grupo agregado exitosamente.');
        cancelarNuevo();
    } catch (e) {
        console.error(e);
        await mostrarAlerta('Error guardando: ' + e.message);
    }
}

// ==============================
// FLUJO DE BÚSQUEDA Y PAGINACIÓN
// ==============================

let g_gruposBusqueda = [];
let g_paginaActual = 1;
let g_rowsPorPagina = 100;
let g_totalRegistros = 0;
let g_indexSeleccionado = -1;

async function abrirModalBusqueda() {
    document.getElementById('searchModal').style.display = 'block';
    const s = document.getElementById('searchInput');
    s.value = '';
    setTimeout(() => s.focus(), 100);
    g_paginaActual = 1;
    await buscarGrupos(1);
}

function cerrarModalBusqueda() {
    document.getElementById('searchModal').style.display = 'none';
}

async function buscarGrupos(pagina = g_paginaActual) {
    g_paginaActual = pagina;
    const termino = document.getElementById('searchInput').value.trim();
    const client = getClient();
    if (!client) return;

    const tbody = document.getElementById('bodyResultados');
    tbody.innerHTML = '<tr><td colspan="2" style="text-align:center;">Consultando base de datos...</td></tr>';

    try {
        const from = (g_paginaActual - 1) * g_rowsPorPagina;
        const to = from + g_rowsPorPagina - 1;
        let query = SessionManager.applyIsolation(client.from('grupos_articulos').select('*', { count: 'exact' }));

        if (termino) {
            query = query.ilike('grupo', `%${termino}%`);
        }

        const { data, error, count } = await query
            .order('grupo', { ascending: true })
            .range(from, to);

        if (error) throw error;

        g_totalRegistros = count || 0;
        g_gruposBusqueda = data || [];
        g_indexSeleccionado = -1;

        mostrarResultadosTabla();
        actualizarPaginadorNativo();
    } catch (e) {
        await mostrarAlerta('Error en búsqueda: ' + e.message);
    }
}

function mostrarResultadosTabla() {
    const tbody = document.getElementById('bodyResultados');
    tbody.innerHTML = '';

    if (!g_gruposBusqueda || g_gruposBusqueda.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2" style="text-align:center; padding:20px;">No se encontraron grupos</td></tr>';
        return;
    }

    g_gruposBusqueda.forEach((g, idx) => {
        const tr = document.createElement('tr');
        if (idx === g_indexSeleccionado) tr.classList.add('selected');

        tr.onclick = () => {
            seleccionarFila(idx);
            seleccionarGrupo(g);
        };

        tr.innerHTML = `
            <td style="padding: 2px 4px; border: 1px solid #d4d0c8;">${g.grupo}</td>
        `;
        tbody.appendChild(tr);
    });
}

function seleccionarFila(index) {
    if (index < 0 || index >= g_gruposBusqueda.length) return;
    g_indexSeleccionado = index;
    // Removido re-render para no perder el foco rapido al seleccionar (cerrará el modal inmediato)
}

function actualizarPaginadorNativo() {
    const totalPaginas = Math.max(1, Math.ceil(g_totalRegistros / g_rowsPorPagina));
    const textoPagina = `Página ${g_paginaActual} de ${totalPaginas} - ${g_totalRegistros} registros totales`;

    document.getElementById('paginaActualInput').value = g_paginaActual;
    const elRegTotal = document.getElementById('regTotal');
    if (elRegTotal) elRegTotal.textContent = textoPagina;

    const elInfoCentral = document.getElementById('infoPaginaCentral');
    if (elInfoCentral) elInfoCentral.textContent = textoPagina;
}

// Funciones de navegación de paginación
window.irPaginaPrimera = () => { if (g_paginaActual > 1) buscarGrupos(1); };
window.irPaginaAnterior = () => { if (g_paginaActual > 1) buscarGrupos(g_paginaActual - 1); };
window.irPaginaSiguiente = () => {
    const totalPaginas = Math.ceil(g_totalRegistros / g_rowsPorPagina);
    if (g_paginaActual < totalPaginas) buscarGrupos(g_paginaActual + 1);
};
window.irPaginaUltima = () => {
    const totalPaginas = Math.ceil(g_totalRegistros / g_rowsPorPagina);
    if (g_paginaActual < totalPaginas) buscarGrupos(totalPaginas);
};

function seleccionarGrupo(g) {
    g_grupoActual = g;
    cerrarModalBusqueda();

    document.getElementById('grupoId').value = g.id;
    document.getElementById('nombre').value = g.grupo;

    document.getElementById('nombre').readOnly = true;
}

// ==============================
// FLUJO DE BORRADO
// ==============================

async function borrarGrupo() {
    if (!g_grupoActual) return await mostrarAlerta('Primero busque un grupo para borrar.');

    const confirmacion = await mostrarConfirm('¿Está seguro de que desea borrar este grupo?');
    if (!confirmacion) return;

    const client = getClient();
    if (!client) return;

    try {
        const { error } = await SessionManager.applyIsolation(client.from('grupos_articulos').delete()).eq('id', g_grupoActual.id);
        if (error) throw error;

        await mostrarAlerta('Grupo eliminado exitosamente.');
        limpiarFormulario();
    } catch (e) {
        await mostrarAlerta('Error al eliminar: ' + e.message);
    }
}

// ==============================
// UTILS
// ==============================

function limpiarFormulario() {
    g_grupoActual = null;
    document.getElementById('grupoId').value = '';
    document.getElementById('nombre').value = '';
    document.getElementById('nombre').readOnly = true;
}

function terminar() {
    window.location.href = 'archivos.html';
}

// ==============================
// LÓGICA DE ARRASTRE (DRAGGABLE)
// ==============================

function makeDraggable(elementId, handleId) {
    const el = document.getElementById(elementId);
    const handle = document.getElementById(handleId);
    if (!el || !handle) return;

    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    handle.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;

        let newTop = el.offsetTop - pos2;
        let newLeft = el.offsetLeft - pos1;

        el.style.top = newTop + "px";
        el.style.left = newLeft + "px";
        el.style.margin = "0"; // Deshabilita el auto margin si se mueve manualmente
        el.style.position = "absolute";
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    makeDraggable('searchModalContent', 'modalHeader');
});

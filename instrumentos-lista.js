/**
 * instrumentos-lista.js - Paginación y búsqueda de instrumentos
 */
let g_instrumentos = [];
let g_indexSeleccionado = -1;

// Variables de paginación
let g_paginaActual = 1;
let g_rowsPorPagina = 100;
let g_totalRegistros = 0;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await window.waitForSupabase(30000);
        await cargarDatos(1);
    } catch (err) {
        console.error('Error fatal de inicio:', err);
    }

    // Eventos
    const setupEvent = (id, evt, fn) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener(evt, fn);
    };

    setupEvent('buscarInput', 'input', filtrarInstrumentos);
    setupEvent('btnClose', 'click', () => window.close());

    setupEvent('btnFirst', 'click', () => seleccionarFila(0));
    setupEvent('btnLast', 'click', () => seleccionarFila(g_instrumentos.length - 1));
    setupEvent('btnPrev', 'click', () => seleccionarFila(g_indexSeleccionado - 1));
    setupEvent('btnNext', 'click', () => seleccionarFila(g_indexSeleccionado + 1));
});

async function cargarDatos(pagina = 1) {
    g_paginaActual = pagina;
    const tbody = document.getElementById('tablaInstrumentos');
    if (tbody) tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Consultando base de datos...</td></tr>';

    try {
        const client = await window.waitForSupabase(30000);
        const from = (g_paginaActual - 1) * g_rowsPorPagina;
        const to = from + g_rowsPorPagina - 1;

        const term = document.getElementById('buscarInput')?.value.trim() || '';
        let query = client.from('instrumentos').select('*', { count: 'exact' });

        if (term) {
            query = query.or(`clave.ilike.%${term}%,descripcion.ilike.%${term}%`);
        }

        const { data, error, count } = await query
            .order('clave', { ascending: true })
            .range(from, to);

        if (error) throw error;

        g_totalRegistros = count || 0;
        g_instrumentos = data || [];

        renderTabla();
        actualizarPaginador();

    } catch (err) {
        console.error('Error instrumentos:', err);
        mostrarError(`Error de carga: ${err.message}`);
    }
}

function renderTabla() {
    const tbody = document.getElementById('tablaInstrumentos');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (g_instrumentos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:20px;">No hay registros disponibles</td></tr>';
        return;
    }

    g_instrumentos.forEach((m, idx) => {
        const tr = document.createElement('tr');
        if (idx === g_indexSeleccionado) tr.classList.add('selected');

        tr.onclick = () => {
            seleccionarFila(idx);
            if (window.opener && !window.opener.closed) {
                if (typeof window.opener.cargarDatosDesdeVentana === 'function') {
                    window.opener.cargarDatosDesdeVentana(m);
                    window.close();
                }
            }
        };

        tr.innerHTML = `
            <td class="selector-cell"><div class="selected-indicator"></div></td>
            <td>${m.clave || ''}</td>
            <td>${m.descripcion || ''}</td>
        `;
        tbody.appendChild(tr);
    });
}

function actualizarPaginador() {
    const totalPaginas = Math.ceil(g_totalRegistros / g_rowsPorPagina);
    
    document.getElementById('currentPage').value = g_paginaActual;
    document.getElementById('regTotal').textContent = `de ${totalPaginas} - ${g_totalRegistros} totales`;

    document.getElementById('btnFirst').disabled = g_paginaActual === 1;
    document.getElementById('btnPrev').disabled = g_paginaActual === 1;
    document.getElementById('btnNext').disabled = g_paginaActual === totalPaginas;
    document.getElementById('btnLast').disabled = g_paginaActual === totalPaginas;
}

function filtrarInstrumentos() {
    clearTimeout(window.searchT);
    window.searchT = setTimeout(() => cargarDatos(1), 300);
}

function seleccionarFila(idx) {
    if (idx < 0 || idx >= g_instrumentos.length) return;
    g_indexSeleccionado = idx;
    renderTabla();
    const rows = document.querySelectorAll('#tablaInstrumentos tr');
    if (rows[idx]) rows[idx].scrollIntoView({ block: 'nearest' });
}

function mostrarError(m) {
    const tb = document.getElementById('tablaInstrumentos');
    if (tb) tb.innerHTML = `<tr><td colspan="3" style="text-align:center; color:red;">${m}</td></tr>`;
}

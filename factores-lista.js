/**
 * factores-lista.js - Standardized Pagination Version
 */
let g_factores = [];
let g_indexSeleccionado = -1;

// Variables de paginación
let g_paginaActual = 1;
let g_rowsPorPagina = 100;
let g_totalRegistros = 0;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Factores-Lista: Iniciando...');

    // Inyectar dependencia de paginación
    if (!window.renderPaginador) {
        const sc = document.createElement('script');
        sc.src = 'utils-pagination.js';
        document.body.appendChild(sc);
    }

    try {
        await window.waitForSupabase(30000);
        await cargarDatos(1);
    } catch (err) {
        console.error('Error fatal:', err);
    }

    // Eventos
    const setupEvent = (id, evt, fn) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener(evt, fn);
    };

    setupEvent('buscarInput', 'input', filtrarFactores);
    setupEvent('btnClose', 'click', () => window.close());

    setupEvent('btnFirst', 'click', () => seleccionarFila(0));
    setupEvent('btnLast', 'click', () => seleccionarFila(g_factores.length - 1));
    setupEvent('btnPrev', 'click', () => seleccionarFila(g_indexSeleccionado - 1));
    setupEvent('btnNext', 'click', () => seleccionarFila(g_indexSeleccionado + 1));
});

async function cargarDatos(pagina = 1) {
    g_paginaActual = pagina;
    const tbody = document.getElementById('tablaFactores');
    if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Cargando...</td></tr>';

    try {
        const client = await window.waitForSupabase(30000);
        const from = (g_paginaActual - 1) * g_rowsPorPagina;
        const to = from + g_rowsPorPagina - 1;

        const term = document.getElementById('buscarInput')?.value.trim() || '';

        // Consulta con joins a maestros y cursos
        let query = client.from('factores').select(`
            *,
            maestros!inner (nombre),
            cursos!inner (curso)
        `, { count: 'exact' }).eq('activo', true);

        if (term) {
            // Búsqueda en los campos del join
            query = query.or(`maestros.nombre.ilike.%${term}%,cursos.curso.ilike.%${term}%`);
        }

        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) throw error;

        g_totalRegistros = count || 0;

        // Mapear datos para que el renderizado funcione con los nombres esperados
        g_factores = (data || []).map(f => ({
            ...f,
            maestro: f.maestros?.nombre || '',
            curso: f.cursos?.curso || ''
        }));

        renderTabla();
        actualizarPaginadorFactores();

    } catch (err) {
        console.error('Error factores:', err);
    }
}

function renderTabla() {
    const tbody = document.getElementById('tablaFactores');
    if (!tbody) return;
    tbody.innerHTML = '';

    g_factores.forEach((f, idx) => {
        const tr = document.createElement('tr');
        if (idx === g_indexSeleccionado) tr.classList.add('selected');

        tr.onclick = () => {
            seleccionarFila(idx);
            if (window.opener && !window.opener.closed) {
                if (typeof window.opener.seleccionarFactor === 'function') {
                    window.opener.seleccionarFactor(f);
                    window.close();
                }
            }
        };

        tr.innerHTML = `
            <td class="selector-cell"><div class="selected-indicator"></div></td>
            <td>${f.maestro || ''}</td>
            <td>${f.curso || ''}</td>
            <td style="text-align:right;">${(f.factor || 0).toFixed(2)}</td>
            <td style="text-align:right;">${(f.porcentaje || 0).toFixed(2)} %</td>
        `;
        tbody.appendChild(tr);
    });
}

function actualizarPaginadorFactores() {
    if (typeof window.renderPaginador === 'function') {
        const totalPaginas = Math.ceil(g_totalRegistros / g_rowsPorPagina);
        window.renderPaginador('pg-nav-inner', g_totalRegistros, g_paginaActual, g_rowsPorPagina, p => cargarDatos(p));

        const cp = document.getElementById('currentPage');
        if (cp) cp.value = g_paginaActual;
        const rt = document.getElementById('regTotal');
        if (rt) rt.textContent = `de ${totalPaginas} - ${g_totalRegistros} totales`;
    }
}

function filtrarFactores() {
    clearTimeout(window.searchT);
    window.searchT = setTimeout(() => cargarDatos(1), 300);
}

function seleccionarFila(idx) {
    if (idx < 0 || idx >= g_factores.length) return;
    g_indexSeleccionado = idx;
    renderTabla();
}

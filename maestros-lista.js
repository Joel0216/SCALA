/**
 * maestros-lista.js - Standardized Pagination Version
 */
let g_maestros = [];
let g_indexSeleccionado = -1;

// Variables de paginación
let g_paginaActual = 1;
let g_rowsPorPagina = 100;
let g_totalRegistros = 0;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Maestros-Lista: Iniciando...');

    // Inyectar dependencia de paginación si no existe
    if (!window.renderPaginador) {
        const sc = document.createElement('script');
        sc.src = 'utils-pagination.js';
        document.body.appendChild(sc);
    }

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

    setupEvent('buscarInput', 'input', filtrarMaestros);
    setupEvent('btnClose', 'click', () => window.close());

    setupEvent('btnFirst', 'click', () => seleccionarFila(0));
    setupEvent('btnLast', 'click', () => seleccionarFila(g_maestros.length - 1));
    setupEvent('btnPrev', 'click', () => seleccionarFila(g_indexSeleccionado - 1));
    setupEvent('btnNext', 'click', () => seleccionarFila(g_indexSeleccionado + 1));
});

async function cargarDatos(pagina = 1) {
    console.log(`Cargando maestros (Pág ${pagina})...`);
    g_paginaActual = pagina;
    const tbody = document.getElementById('tablaMaestros');
    if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Consultando base de datos...</td></tr>';

    try {
        const client = await window.waitForSupabase(30000);
        const from = (g_paginaActual - 1) * g_rowsPorPagina;
        const to = from + g_rowsPorPagina - 1;

        const term = document.getElementById('buscarInput')?.value.trim() || '';
        let query = client.from('maestros').select('*', { count: 'exact' });

        if (term) {
            query = query.or(`clave.ilike.%${term}%,nombre.ilike.%${term}%`);
        }

        const { data, error, count } = await query
            .order('nombre', { ascending: true })
            .range(from, to);

        if (error) throw error;

        g_totalRegistros = count || 0;
        g_maestros = data || [];

        renderTabla();
        actualizarPaginadorMaestros();

    } catch (err) {
        console.error('Error maestros:', err);
        mostrarError(`Error de carga: ${err.message}`);
    }
}

function renderTabla() {
    const tbody = document.getElementById('tablaMaestros');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (g_maestros.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">No hay registros disponibles</td></tr>';
        return;
    }

    g_maestros.forEach((m, idx) => {
        const tr = document.createElement('tr');
        if (idx === g_indexSeleccionado) tr.classList.add('selected');

        tr.onclick = () => {
            seleccionarFila(idx);
            if (window.opener && !window.opener.closed) {
                const functions = ['cargarMaestroDesdeVentana', 'mostrarMaestro', 'seleccionarMaestro', 'cargarDatosMaestro'];
                for (let fn of functions) {
                    if (typeof window.opener[fn] === 'function') {
                        window.opener[fn](m);
                        window.close();
                        return;
                    }
                }
            }
        };

        const fechaIng = m.fecha_ingreso ? formatearFecha(m.fecha_ingreso) : 'N/A';
        const direccion = m.direccion_1 || m.direccion || '';

        tr.innerHTML = `
            <td class="selector-cell"><div class="selected-indicator"></div></td>
            <td>${m.clave || ''}</td>
            <td>${m.nombre || ''}</td>
            <td>${m.telefono || ''}</td>
            <td>${direccion}</td>
            <td>${fechaIng}</td>
        `;
        tbody.appendChild(tr);
    });
}

function actualizarPaginadorMaestros() {
    if (typeof window.renderPaginador === 'function') {
        let container = document.getElementById('pg-ui-maestros');
        if (!container) {
            const old = document.querySelector('.pagination-nav');
            if (old) old.style.display = 'none';
            container = document.createElement('div');
            container.id = 'pg-ui-maestros';
            document.querySelector('.main-container')?.appendChild(container);
        }

        const totalPaginas = Math.ceil(g_totalRegistros / g_rowsPorPagina);
        const info = document.createElement('div');
        info.style.textAlign = 'center';
        info.style.marginBottom = '5px';
        info.style.fontWeight = 'bold';
        info.style.fontSize = '12px';
        info.textContent = `Página ${g_paginaActual} de ${totalPaginas} - ${g_totalRegistros} registros totales`;

        container.innerHTML = '';
        container.appendChild(info);

        const navCont = document.createElement('div');
        navCont.id = 'pg-nav-inner';
        container.appendChild(navCont);

        window.renderPaginador('pg-nav-inner', g_totalRegistros, g_paginaActual, g_rowsPorPagina, p => cargarDatos(p));

        const cp = document.getElementById('currentPage');
        if (cp) cp.value = g_paginaActual;
        const rt = document.getElementById('regTotal');
        if (rt) rt.textContent = `de ${totalPaginas} - ${g_totalRegistros} totales`;
    }
}

function filtrarMaestros() {
    clearTimeout(window.searchT);
    window.searchT = setTimeout(() => cargarDatos(1), 300);
}

function seleccionarFila(idx) {
    if (idx < 0 || idx >= g_maestros.length) return;
    g_indexSeleccionado = idx;
    renderTabla();
    const rows = document.querySelectorAll('#tablaMaestros tr');
    if (rows[idx]) rows[idx].scrollIntoView({ block: 'nearest' });
}

function mostrarError(m) {
    const tb = document.getElementById('tablaMaestros');
    if (tb) tb.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red;">${m}</td></tr>`;
}

function formatearFecha(fecha) {
    if (!fecha) return '';
    const d = new Date(fecha + 'T00:00:00');
    return String(d.getDate()).padStart(2, '0') + '/' +
        String(d.getMonth() + 1).padStart(2, '0') + '/' +
        d.getFullYear();
}

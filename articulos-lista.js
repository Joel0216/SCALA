/**
 * articulos-lista.js - Standardized Pagination Version
 */
let g_articulos = [];
let g_indexSeleccionado = -1;

// Variables de paginación
let g_paginaActual = 1;
let g_rowsPorPagina = 100;
let g_totalRegistros = 0;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Articulos-Lista: Iniciando...');

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

    setupEvent('buscarInput', 'input', filtrarArticulos);
    setupEvent('btnClose', 'click', () => window.close());

    setupEvent('btnFirst', 'click', () => seleccionarFila(0));
    setupEvent('btnLast', 'click', () => seleccionarFila(g_articulos.length - 1));
    setupEvent('btnPrev', 'click', () => seleccionarFila(g_indexSeleccionado - 1));
    setupEvent('btnNext', 'click', () => seleccionarFila(g_indexSeleccionado + 1));
});

async function cargarDatos(pagina = 1) {
    console.log(`Cargando artículos (Pág ${pagina})...`);
    g_paginaActual = pagina;
    const tbody = document.getElementById('tablaArticulos');
    if (tbody) tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Consultando base de datos...</td></tr>';

    try {
        const client = await window.waitForSupabase(30000);
        const from = (g_paginaActual - 1) * g_rowsPorPagina;
        const to = from + g_rowsPorPagina - 1;

        const term = document.getElementById('buscarInput')?.value.trim() || '';
        let query = SessionManager.applyIsolation(client.from('articulos').select('*', { count: 'exact' }));

        if (term) {
            query = query.or(`clave.ilike.%${term}%,descripcion.ilike.%${term}%`);
        }

        const { data, error, count } = await query
            .order('descripcion', { ascending: true })
            .range(from, to);

        if (error) throw error;

        g_totalRegistros = count || 0;
        g_articulos = data || [];

        renderTabla();
        actualizarPaginadorArticulos();

    } catch (err) {
        console.error('Error artículos:', err);
        mostrarError(`Error de carga: ${err.message}`);
    }
}

function renderTabla() {
    const tbody = document.getElementById('tablaArticulos');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (g_articulos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px;">No hay registros disponibles</td></tr>';
        return;
    }

    g_articulos.forEach((a, idx) => {
        const tr = document.createElement('tr');
        if (idx === g_indexSeleccionado) tr.classList.add('selected');

        tr.onclick = () => {
            seleccionarFila(idx);
            if (window.opener && !window.opener.closed) {
                const functions = ['recibirArticuloSeleccionado', 'cargarDatosArticulo', 'seleccionarArticulo', 'mostrarArticulo'];
                for (let fn of functions) {
                    if (typeof window.opener[fn] === 'function') {
                        window.opener[fn](a);
                        window.close();
                        return;
                    }
                }
            }
        };

        const precio = (a.precio || 0).toFixed(2);
        const iva = (a.iva || 0.16).toFixed(2);

        tr.innerHTML = `
            <td class="selector-cell"><div class="selected-indicator"></div></td>
            <td>${a.clave || ''}</td>
            <td>${a.descripcion || ''}</td>
            <td>${a.grupo || ''}</td>
            <td style="text-align:right;">$ ${precio}</td>
            <td style="text-align:center;">${iva}</td>
            <td style="text-align:center;">${a.stock || 0}</td>
        `;
        tbody.appendChild(tr);
    });
}

function actualizarPaginadorArticulos() {
    if (typeof window.renderPaginador === 'function') {
        let container = document.getElementById('pg-ui-articulos');
        if (!container) {
            const old = document.querySelector('.pagination-nav');
            if (old) old.style.display = 'none';
            container = document.createElement('div');
            container.id = 'pg-ui-articulos';
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

function filtrarArticulos() {
    clearTimeout(window.searchT);
    window.searchT = setTimeout(() => cargarDatos(1), 300);
}

function seleccionarFila(idx) {
    if (idx < 0 || idx >= g_articulos.length) return;
    g_indexSeleccionado = idx;
    renderTabla();
    const rows = document.querySelectorAll('#tablaArticulos tr');
    if (rows[idx]) rows[idx].scrollIntoView({ block: 'nearest' });
}

function mostrarError(m) {
    const tb = document.getElementById('tablaArticulos');
    if (tb) tb.innerHTML = `<tr><td colspan="7" style="text-align:center; color:red;">${m}</td></tr>`;
}

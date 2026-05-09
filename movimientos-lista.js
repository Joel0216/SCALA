/**
 * movimientos-lista.js - Standardized Pagination Version
 */
let g_movimientos = [];
let g_indexSeleccionado = -1;

// Variables de paginación
let g_paginaActual = 1;
let g_rowsPorPagina = 100;
let g_totalRegistros = 0;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Movimientos-Lista: Iniciando...');

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

    setupEvent('buscarInput', 'input', filtrarMovimientos);
    setupEvent('btnClose', 'click', () => window.close());

    setupEvent('btnFirst', 'click', () => seleccionarFila(0));
    setupEvent('btnLast', 'click', () => seleccionarFila(g_movimientos.length - 1));
    setupEvent('btnPrev', 'click', () => seleccionarFila(g_indexSeleccionado - 1));
    setupEvent('btnNext', 'click', () => seleccionarFila(g_indexSeleccionado + 1));
});

async function cargarDatos(pagina = 1) {
    console.log(`Cargando movimientos (Pág ${pagina})...`);
    g_paginaActual = pagina;
    const tbody = document.getElementById('tablaMovimientos');
    if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Consultando base de datos...</td></tr>';

    try {
        const client = await window.waitForSupabase(30000);
        const from = (g_paginaActual - 1) * g_rowsPorPagina;
        const to = from + g_rowsPorPagina - 1;

        const term = document.getElementById('buscarInput')?.value.trim() || '';
        let query = client.from('movimientos_inventario').select(`
            numero,
            fecha,
            tipo_id,
            observaciones,
            total_linea,
            total,
            tipo:tipos_movimiento(descripcion)
        `, { count: 'exact' });

        if (term) {
            if (/^\d+$/.test(term)) {
                query = query.or(`numero.eq.${term},observaciones.ilike.%${term}%`);
            } else {
                query = query.ilike('observaciones', `%${term}%`);
            }
        }

        const { data, error, count } = await query
            .order('numero', { ascending: false })
            .range(from, to);

        if (error) throw error;

        // Group rows manually to replicate distinct movements
        const agrupados = new Map();
        (data || []).forEach(row => {
            if (!agrupados.has(row.numero)) {
                agrupados.set(row.numero, {
                    numero: row.numero,
                    fecha: row.fecha,
                    tipo: row.tipo?.descripcion || row.tipo_id,
                    observaciones: row.observaciones || '',
                    total: 0
                });
            }
            agrupados.get(row.numero).total += parseFloat(row.total_linea || row.total || 0);
        });

        g_movimientos = Array.from(agrupados.values()).sort((a, b) => b.numero - a.numero);
        g_totalRegistros = count || 0; // The count logic isn't perfectly exact due to flat table grouped by numero, but close enough for pagination UX

        renderTabla();
        actualizarPaginadorMovimientos();

    } catch (err) {
        console.error('Error movimientos:', err);
        mostrarError(`Error de carga: ${err.message}`);
    }
}

function renderTabla() {
    const tbody = document.getElementById('tablaMovimientos');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (g_movimientos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">No hay registros disponibles</td></tr>';
        return;
    }

    g_movimientos.forEach((m, idx) => {
        const tr = document.createElement('tr');
        if (idx === g_indexSeleccionado) tr.classList.add('selected');

        tr.onclick = () => {
            seleccionarFila(idx);
            if (window.opener && !window.opener.closed) {
                if (typeof window.opener.cargarMovimientoDesdeBusqueda === 'function') {
                    window.opener.cargarMovimientoDesdeBusqueda(m.numero);
                    window.close();
                    return;
                }
            }
        };

        const fechaStr = m.fecha ? m.fecha.split('T')[0].split('-').reverse().join('/') : '';

        tr.innerHTML = `
            <td class="selector-cell"><div class="selected-indicator"></div></td>
            <td style="text-align:center;"><strong>${m.numero}</strong></td>
            <td style="text-align:center;">${fechaStr}</td>
            <td>${m.tipo}</td>
            <td><div style="max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${m.observaciones}</div></td>
            <td style="text-align:right; font-weight:bold;">$${m.total.toFixed(2)}</td>
        `;
        tbody.appendChild(tr);
    });
}

function actualizarPaginadorMovimientos() {
    if (typeof window.renderPaginador === 'function') {
        let container = document.getElementById('pg-ui-movimientos');
        if (!container) {
            const old = document.querySelector('.pagination-nav');
            if (old) old.style.display = 'none';
            container = document.createElement('div');
            container.id = 'pg-ui-movimientos';
            document.querySelector('.main-container')?.appendChild(container);
        }

        // To fake count when grouping flat records, limit totalPages logically if records run out
        if (g_movimientos.length < g_rowsPorPagina) {
            g_totalRegistros = (g_paginaActual - 1) * g_rowsPorPagina + g_movimientos.length;
        }

        const totalPaginas = Math.ceil(g_totalRegistros / g_rowsPorPagina);
        const info = document.createElement('div');
        info.style.textAlign = 'center';
        info.style.marginBottom = '5px';
        info.style.fontWeight = 'bold';
        info.style.fontSize = '12px';
        info.textContent = `Página ${g_paginaActual} de ${totalPaginas || 1} - ${g_totalRegistros} registros totales`;

        container.innerHTML = '';
        container.appendChild(info);

        const navCont = document.createElement('div');
        navCont.id = 'pg-nav-inner';
        container.appendChild(navCont);

        window.renderPaginador('pg-nav-inner', g_totalRegistros, g_paginaActual, g_rowsPorPagina, p => cargarDatos(p));

        const cp = document.getElementById('currentPage');
        if (cp) cp.value = g_paginaActual;
        const rt = document.getElementById('regTotal');
        if (rt) rt.textContent = `de ${totalPaginas || 1} - ${g_totalRegistros} totales`;
    }
}

function filtrarMovimientos() {
    clearTimeout(window.searchT);
    window.searchT = setTimeout(() => cargarDatos(1), 300);
}

function seleccionarFila(idx) {
    if (idx < 0 || idx >= g_movimientos.length) return;
    g_indexSeleccionado = idx;
    renderTabla();
    const rows = document.querySelectorAll('#tablaMovimientos tr');
    if (rows[idx]) rows[idx].scrollIntoView({ block: 'nearest' });
}

function mostrarError(m) {
    const tb = document.getElementById('tablaMovimientos');
    if (tb) tb.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red;">${m}</td></tr>`;
}

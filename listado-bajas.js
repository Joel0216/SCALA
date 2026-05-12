/**
 * listado-bajas.js - Standardized Pagination Version
 */
let g_bajas = [];
let g_indexSeleccionado = -1;
let g_motivosCache = [];

// Variables de paginación
let g_paginaActual = 1;
let g_rowsPorPagina = 100;
let g_totalRegistros = 0;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Bajas-Lista: Iniciando...');

    // Inyectar dependencia de paginación
    if (!window.renderPaginador) {
        const sc = document.createElement('script');
        sc.src = 'utils-pagination.js';
        document.body.appendChild(sc);
    }

    try {
        const client = await window.waitForSupabase(30000);
        await cargarMotivos(client);
        await cargarDatos(1);
    } catch (err) {
        console.error('Error fatal:', err);
    }

    // Eventos
    const setupEvent = (id, evt, fn) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener(evt, fn);
    };

    setupEvent('buscarInput', 'input', filtrarBajas);
    setupEvent('btnClose', 'click', () => window.close());

    setupEvent('btnFirst', 'click', () => seleccionarFila(0));
    setupEvent('btnLast', 'click', () => seleccionarFila(g_bajas.length - 1));
    setupEvent('btnPrev', 'click', () => seleccionarFila(g_indexSeleccionado - 1));
    setupEvent('btnNext', 'click', () => seleccionarFila(g_indexSeleccionado + 1));
});

async function cargarMotivos(db) {
    try {
        const { data, error } = await SessionManager.applyIsolation(db.from('motivos_baja').select('clave, descripcion'));
        g_motivosCache = data || [];
    } catch (e) { console.error('Error motivos:', e); }
}

async function cargarDatos(pagina = 1) {
    g_paginaActual = pagina;
    const tbody = document.getElementById('tablaBajas');
    if (tbody) tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Cargando bajas...</td></tr>';

    try {
        const client = await window.waitForSupabase(30000);
        const from = (g_paginaActual - 1) * g_rowsPorPagina;
        const to = from + g_rowsPorPagina - 1;

        const term = document.getElementById('buscarInput')?.value.trim() || '';

        // Consultar directamente desde alumnos para incluir a los que no tienen grupo
        let query = SessionManager.applyIsolation(client.from('alumnos').select('*', { count: 'exact' }))
            .eq('activo', false); // Solo alumnos inactivos (bajas)

        if (term) {
            if (/^\d+$/.test(term)) {
                query = query.or(`credencial.eq.${term},nombre.ilike.%${term}%`);
            } else {
                query = query.ilike('nombre', `%${term}%`);
            }
        }

        const { data, error, count } = await query
            .order('fecha_baja', { ascending: false, nullsFirst: false }) 
            .range(from, to);

        if (error) throw error;

        g_totalRegistros = count || 0;

        // Mapear al mismo formato usado en UI
        g_bajas = (data || []).map(item => {
            return {
                ...item,
                id: item.id,
                inscripcion_id: item.id, 
                grupo_clave: item.grupo_clave || '---', 
                fecha_baja: item.fecha_baja,
                motivo_baja: item.motivo_baja,
                observaciones_baja: item.comentario,
                _raw: item
            };
        });

        renderTabla();
        actualizarPaginadorBajas();

    } catch (err) {
        console.error('Error al cargar listado de bajas:', err);
        if (tbody) tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:red;">Error: ${err.message}</td></tr>`;
    }
}

function renderTabla() {
    const tbody = document.getElementById('tablaBajas');
    if (!tbody) return;
    tbody.innerHTML = '';

    g_bajas.forEach((b, idx) => {
        const tr = document.createElement('tr');
        if (idx === g_indexSeleccionado) tr.classList.add('selected');

        tr.onclick = () => {
            seleccionarFila(idx);
            if (window.opener && !window.opener.closed) {
                if (typeof window.opener.cargarAlumnoDesdeVentana === 'function') {
                    window.opener.cargarAlumnoDesdeVentana(b);
                    window.close();
                }
            }
        };

        const fIng = b.fecha_ingreso ? formatearFecha(b.fecha_ingreso) : '';
        const fBaja = b.fecha_baja ? formatearFecha(b.fecha_baja) : '';
        const motivo = g_motivosCache.find(m => m.clave === b.motivo_baja)?.descripcion || b.motivo_baja || '';

        tr.innerHTML = `
            <td class="selector-cell"><div class="selected-indicator"></div></td>
            <td>${b.credencial || ''}</td>
            <td>${b.nombre || ''}</td>
            <td>${b.grupo_clave || ''}</td>
            <td>${fIng}</td>
            <td>${b.grado || ''}</td>
            <td>${fBaja}</td>
            <td>${motivo}</td>
        `;
        tbody.appendChild(tr);
    });
}

function actualizarPaginadorBajas() {
    if (typeof window.renderPaginador === 'function') {
        const totalPaginas = Math.ceil(g_totalRegistros / g_rowsPorPagina);
        window.renderPaginador('pg-nav-inner', g_totalRegistros, g_paginaActual, g_rowsPorPagina, p => cargarDatos(p));

        const cp = document.getElementById('currentPage');
        if (cp) cp.value = g_paginaActual;
        const rt = document.getElementById('regTotal');
        if (rt) rt.textContent = `de ${totalPaginas} - ${g_totalRegistros} totales`;
    }
}

function filtrarBajas() {
    clearTimeout(window.searchT);
    window.searchT = setTimeout(() => cargarDatos(1), 300);
}

function seleccionarFila(idx) {
    if (idx < 0 || idx >= g_bajas.length) return;
    g_indexSeleccionado = idx;
    renderTabla();
}

function formatearFecha(fecha) {
    if (!fecha) return '';
    const d = new Date(fecha + 'T00:00:00');
    return String(d.getDate()).padStart(2, '0') + '/' +
        String(d.getMonth() + 1).padStart(2, '0') + '/' +
        d.getFullYear();
}

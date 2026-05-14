/**
 * horarios.js - Módulo de Horarios (Solo Lectura)
 * Muestra los horarios como una cuadrícula a partir de la tabla 'grupos'.
 */

let g_paginaActual = 1;
const g_rowsPorPagina = 20; // Aproximadamente el alto del grid para que no estorbe
let g_totalRegistros = 0;
let g_terminoBusqueda = '';

document.addEventListener('DOMContentLoaded', async () => {
    // Reloj
    setInterval(() => {
        const el = document.getElementById('topTitle');
        if (el && !g_terminoBusqueda) {
            el.textContent = 'TODOS LOS HORARIOS - ' + new Date().toLocaleString('es-MX', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            });
        }
    }, 1000);

    // Inicializar Supabase y cargar 
    if (typeof window.waitForSupabase === 'function') {
        await window.waitForSupabase(5000);
    }
    await cargarHorarios();
});

function getClient() {
    if (!window.supabase) {
        mostrarAlerta('No se pudo conectar a la base de datos (Supabase no está listo).');
        return null;
    }
    return window.supabase;
}

// ==============================
// CARGA PRINCIPAL (GRID)
// ==============================
async function cargarHorarios(pagina = g_paginaActual) {
    g_paginaActual = pagina;
    const client = getClient();
    if (!client) return;

    const grid = document.getElementById('gridBody');
    grid.innerHTML = '<div class="grid-row"><div colspan="12" style="text-align:center; padding:10px;">Cargando...</div></div>';

    try {
        const from = (g_paginaActual - 1) * g_rowsPorPagina;
        const to = from + g_rowsPorPagina - 1;

        // Armar consulta sobre grupos
        let query = SessionManager.applyIsolation(client.from('grupos')
            .select('*, maestros!inner(nombre), cursos!inner(curso)', { count: 'exact' }))
            .eq('activo', true);

        // Si hay una búsqueda activa (de la ventana modal)
        if (g_terminoBusqueda) {
            query = query.or(`clave.ilike.%${g_terminoBusqueda}%,maestros.nombre.ilike.%${g_terminoBusqueda}%`);
        }

        const { data, error, count } = await query
            .order('clave', { ascending: true })
            .range(from, to);

        if (error) {
            // Fallback si la relación de inner falla por llaves huérfanas
            const res2 = await SessionManager.applyIsolation(client.from('grupos')
                .select('*, maestros(nombre), cursos(curso)', { count: 'exact' }))
                .eq('activo', true)
                .ilike('clave', `%${g_terminoBusqueda}%`)
                .order('clave', { ascending: true })
                .range(from, to);

            if (res2.error) throw res2.error;
            renderGrid(res2.data);
            g_totalRegistros = res2.count || 0;
        } else {
            renderGrid(data);
            g_totalRegistros = count || 0;
        }

        actualizarPaginador();

    } catch (e) {
        console.error(e);
        grid.innerHTML = `<div class="grid-row"><div colspan="12" style="text-align:center; color:red; padding:10px;">Error: ${e.message}</div></div>`;
    }
}

function renderGrid(data) {
    const grid = document.getElementById('gridBody');
    grid.innerHTML = '';

    if (!data || data.length === 0) {
        grid.innerHTML = '<div class="grid-row"><div colspan="12" style="text-align:center; padding:10px;">No hay horarios registrados.</div></div>';
        return;
    }

    data.forEach((g) => {
        const row = document.createElement('div');
        row.className = 'grid-row';

        // Formateo de fechas: Inicio
        let strInicio = '';
        if (g.fecha_inicio) {
            const d = new Date(g.fecha_inicio);
            strInicio = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
        }

        // Formateo de fechas: Fecha Lección
        let strFL = '';
        if (g.fecha_leccion) {
            const d = new Date(g.fecha_leccion);
            strFL = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
        }

        row.innerHTML = `
            <div>►</div>
            <div>${g.dia || ''}</div>
            <div>${g.hora_entrada ? g.hora_entrada.substring(0, 5) : ''}</div>
            <div>${g.clave || ''}</div>
            <div>${g.maestros?.nombre || ''}</div>
            <div>${g.salon_id || g.salon || ''}</div>
            <div>${g.cupo || ''}</div>
            <div>${g.alumnos_inscritos || 0}</div>
            <div>${strInicio}</div>
            <div>${g.leccion_actual || ''}</div>
            <div>${strFL}</div>
            <div></div> <!-- Espacio sobrante a la derecha -->
        `;

        // Efecto click - Actualizar Header si es que tiene curso
        row.onclick = () => {
            document.querySelectorAll('.grid-row').forEach(r => r.classList.remove('selected'));
            row.classList.add('selected');
            const titulo = document.getElementById('topTitle');
            if (titulo) titulo.textContent = g.cursos?.curso || g.clave;
        };

        grid.appendChild(row);
    });

    // Rellenar visualmente con filas vacías grises para dar el efecto de tabla de Windows antigua
    const rowsToFill = g_rowsPorPagina - data.length;
    for (let i = 0; i < rowsToFill; i++) {
        const emptyRow = document.createElement('div');
        emptyRow.className = 'grid-row empty-row';
        emptyRow.innerHTML = `
            <div></div><div></div><div></div><div></div><div></div><div></div>
            <div></div><div></div><div></div><div></div><div></div><div></div>
        `;
        grid.appendChild(emptyRow);
    }
}

// ==============================
// PAGINACIÓN DE LA CUADRÍCULA
// ==============================
function actualizarPaginador() {
    const totalPaginas = Math.max(1, Math.ceil(g_totalRegistros / g_rowsPorPagina));
    document.getElementById('paginaActualInput').value = g_paginaActual;
    const info = document.getElementById('infoPaginaCentral');
    if (info) info.textContent = `Página ${g_paginaActual} de ${totalPaginas} - ${g_totalRegistros} registros`;
}

window.irPaginaPrimera = () => { if (g_paginaActual > 1) cargarHorarios(1); };
window.irPaginaAnterior = () => { if (g_paginaActual > 1) cargarHorarios(g_paginaActual - 1); };
window.irPaginaSiguiente = () => {
    const totalPaginas = Math.ceil(g_totalRegistros / g_rowsPorPagina);
    if (g_paginaActual < totalPaginas) cargarHorarios(g_paginaActual + 1);
};
window.irPaginaUltima = () => {
    const totalPaginas = Math.ceil(g_totalRegistros / g_rowsPorPagina);
    if (g_paginaActual < totalPaginas) cargarHorarios(totalPaginas);
};

// ==============================
// BUSCADOR MODAL
// ==============================
window.abrirModalBusqueda = function () {
    document.getElementById('modalBusqueda').style.display = 'flex';
    document.getElementById('inputBusqueda').value = '';
    document.getElementById('bodyBusqueda').innerHTML = '';
    setTimeout(() => document.getElementById('inputBusqueda').focus(), 100);
};

window.cerrarModalBusqueda = function () {
    document.getElementById('modalBusqueda').style.display = 'none';
};

window.limpiarBusquedaEmergente = function () {
    document.getElementById('inputBusqueda').value = '';
    g_terminoBusqueda = '';
    document.getElementById('topTitle').textContent = 'TODOS LOS HORARIOS';
    cargarHorarios(1);
    cerrarModalBusqueda();
};

window.buscarHorariosEmergente = async function () {
    const term = document.getElementById('inputBusqueda').value.trim();
    if (!term) return await mostrarAlerta('Ingresa algo para buscar.');

    const client = getClient();
    if (!client) return;

    const tbody = document.getElementById('bodyBusqueda');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Buscando...</td></tr>';

    try {
        let { data, error } = await SessionManager.applyIsolation(client.from('grupos')
            .select('clave, dia, hora_entrada, maestros!inner(nombre), cursos!inner(curso)'))
            .eq('activo', true)
            .or(`clave.ilike.%${term}%,maestros.nombre.ilike.%${term}%`)
            .order('clave')
            .limit(50);

        if (error) {
            // Fallback iterativo 
            const fallback = await SessionManager.applyIsolation(client.from('grupos')
                .select('clave, dia, hora_entrada, maestros(nombre), cursos(curso)'))
                .eq('activo', true)
                .ilike('clave', `%${term}%`)
                .order('clave')
                .limit(50);
            if (fallback.error) throw fallback.error;
            data = fallback.data;
        }

        tbody.innerHTML = '';
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No se encontró similitud</td></tr>';
            return;
        }

        data.forEach(h => {
            const tr = document.createElement('tr');
            tr.onclick = () => aplicarFiltro(term, h);
            tr.innerHTML = `
                <td>${h.clave || ''}</td>
                <td>${h.maestros?.nombre || ''}</td>
                <td>${h.cursos?.curso || ''}</td>
                <td>${h.dia || ''}</td>
                <td>${h.hora_entrada ? h.hora_entrada.substring(0, 5) : ''}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:red;">Error: ${e.message}</td></tr>`;
    }
};

function aplicarFiltro(term, obj) {
    // Al seleccionar algo de la lista emergente, usamos el término para filtrar la tabla principal
    g_terminoBusqueda = obj.clave; // Busqueda exacta en la grid principal por la clave del que le picó
    cerrarModalBusqueda();
    cargarHorarios(1);
}

// ==============================
// BOTÓN TERMINAR
// ==============================
window.terminar = function () {
    window.location.href = 'archivos.html';
};

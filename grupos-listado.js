/**
 * grupos-listado.js - Senior Pagination Version
 */
let g_grupos = [];
let g_gruposFiltrados = [];
let g_indexSeleccionado = -1;
let g_cursos = [];
let g_maestros = [];

// Variables de paginación
let g_paginaActual = 1;
let g_rowsPorPagina = 100;
let g_totalRegistros = 0;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Grupos-Listado: Iniciando...');

    // Inyectar dependencia de paginación si no existe
    if (!window.renderPaginador) {
        const sc = document.createElement('script');
        sc.src = 'utils-pagination.js';
        document.body.appendChild(sc);
    }

    try {
        const supabase = await window.waitForSupabase(30000);
        await cargarCatalogos();
        await cargarDatos(1);
    } catch (err) {
        console.error('Error fatal de inicio:', err);
    }

    // Eventos
    const setupEvent = (id, evt, fn) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener(evt, fn);
    };

    setupEvent('mainSearch', 'input', filtrarGrupos);
    setupEvent('btnClose', 'click', () => window.close());
    setupEvent('btnGuardar', 'click', guardarCambios);
    setupEvent('btnEliminar', 'click', eliminarGrupo);

    setupEvent('btnFirst', 'click', () => seleccionarFila(0));
    setupEvent('btnLast', 'click', () => seleccionarFila(g_gruposFiltrados.length - 1));
    setupEvent('btnPrev', 'click', () => seleccionarFila(g_indexSeleccionado - 1));
    setupEvent('btnNext', 'click', () => seleccionarFila(g_indexSeleccionado + 1));
});

async function cargarCatalogos() {
    try {
        const client = await window.waitForSupabase(30000);
        const [{ data: cursos }, { data: maestros }] = await Promise.all([
            SessionManager.applyIsolation(client.from('cursos').select('id, curso, nombre, clave, grado')).order('curso'),
            SessionManager.applyIsolation(client.from('maestros').select('id, nombre')).order('nombre')
        ]);

        g_cursos = cursos || [];
        g_maestros = maestros || [];

        const selC = document.getElementById('editCurso');
        const selM = document.getElementById('editMaestro');

        if (selC) {
            selC.innerHTML = g_cursos.map(c => `<option value="${c.id}">${c.curso || c.nombre}</option>`).join('');
        }
        if (selM) {
            selM.innerHTML = g_maestros.map(m => `<option value="${m.id}">${m.nombre}</option>`).join('');
        }
    } catch (err) { console.error('Error catálogos:', err); }
}

async function cargarDatos(pagina = 1) {
    console.log(`Cargando grupos (Pág ${pagina})...`);
    g_paginaActual = pagina;
    const tbody = document.getElementById('tbodyGrupos');
    if (tbody) tbody.innerHTML = '<tr><td colspan="14" style="text-align:center;">Consultando base de datos...</td></tr>';

    try {
        const client = await window.waitForSupabase(30000);
        const from = (g_paginaActual - 1) * g_rowsPorPagina;
        const to = from + g_rowsPorPagina - 1;

        const params = new URLSearchParams(window.location.search);
        const gradoFiltro = params.get('grado');

        const term = document.getElementById('mainSearch')?.value.trim() || '';
        let query = SessionManager.applyIsolation(client.from('grupos').select('*', { count: 'exact' }));

        if (gradoFiltro) {
            query = query.eq('grado', gradoFiltro);
        }

        if (term && term.length >= 2) {
            query = query.or(`clave.ilike.%${term}%,salon.ilike.%${term}%`);
        }

        const { data, error, count } = await query
            .order('clave', { ascending: true })
            .range(from, to);

        if (error) throw error;

        g_totalRegistros = count || 0;

        g_grupos = (data || []).map(g => {
            // Buscamos el curso. Intentamos coincidencia por ID (flexible tipo) o por clave si aplica.
            const cursoId = g.curso_id || g.cursoId;
            const curso = g_cursos.find(c => String(c.id) == String(cursoId));
            const maestroId = g.maestro_id || g.maestroId;
            const maestro = g_maestros.find(m => String(m.id) == String(maestroId));
            const insc = g.alumnos_inscritos || 0;
            const cupo = g.cupo || 0;

            return {
                ...g,
                nombre_curso: curso ? (curso.curso || curso.nombre) : (g.curso_nombre || 'N/A'),
                grado: curso ? (curso.grado || g.grado || '') : (g.grado || ''),
                nombre_maestro: maestro ? maestro.nombre : 'N/A',
                inscritos: insc,
                disponibles: cupo - insc,
                ocupacion: cupo > 0 ? Math.round((insc / cupo) * 100) : 0,
                horario_fmt: `${g.hora_entrada || ''} - ${g.hora_salida || ''}`,
                salon: g.salon || '-',
                status_text: (g.activo === true || g.activo === 1) ? 'Activo' : 'Inactivo'
            };
        });

        g_gruposFiltrados = [...g_grupos];
        renderTabla();
        actualizarPaginadorGrupos();

    } catch (err) {
        console.error('Error grupos:', err);
        mostrarError(`Error de carga: ${err.message}`);
    }
}

function renderTabla() {
    const tbody = document.getElementById('tbodyGrupos');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (g_gruposFiltrados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="14" style="text-align:center; padding:20px;">No hay registros disponibles</td></tr>';
        return;
    }

    g_gruposFiltrados.forEach((g, idx) => {
        const tr = document.createElement('tr');
        if (idx === g_indexSeleccionado) tr.classList.add('selected');

        // Comportamiento solicitado: Click selecciona, rellena form principal y opcionalmente cierra
        tr.onclick = () => {
            seleccionarFila(idx);
            if (window.opener && typeof window.opener.seleccionarGrupoInterno === 'function') {
                window.opener.seleccionarGrupoInterno(g);
                window.close(); // Cerramos para flujo ágil como alumnos-lista.js
            } else if (window.opener && typeof window.opener.mostrarGrupo === 'function') {
                window.opener.mostrarGrupo(g);
                window.close(); 
            }
        };

        tr.ondblclick = () => abrirEdicion(g);

        tr.innerHTML = `
            <td class="selector-cell"><div class="selected-indicator"></div></td>
            <td>${g.clave || ''}</td>
            <td style="font-weight:bold;">${g.nombre_curso}</td>
            <td style="text-align:center; color:#2563eb; font-weight:bold;">${g.grado}</td>
            <td>${g.nombre_maestro}</td>
            <td>${g.dia || ''}</td>
            <td>${g.horario_fmt}</td>
            <td>${g.salon || ''}</td>
            <td>${g.cupo || 0}</td>
            <td style="color:blue; font-weight:bold;">${g.inscritos}</td>
            <td style="color:${g.disponibles > 0 ? 'green' : 'red'}">${g.disponibles}</td>
            <td>${g.ocupacion}%</td>
            <td>${g.fecha_inicio || ''}</td>
            <td style="color:${g.activo ? 'green' : 'gray'}">${g.status_text}</td>
        `;
        tbody.appendChild(tr);
    });
}

function actualizarPaginadorGrupos() {
    if (typeof window.renderPaginador === 'function') {
        let container = document.getElementById('pg-ui-grupos');
        if (!container) {
            const old = document.querySelector('.pagination-nav');
            if (old) old.style.display = 'none';
            container = document.createElement('div');
            container.id = 'pg-ui-grupos';
            document.querySelector('.main-container')?.appendChild(container);
        }

        // Info de registros totales
        const totalPaginas = Math.ceil(g_totalRegistros / g_rowsPorPagina);
        const info = document.createElement('div');
        info.style.textAlign = 'center';
        info.style.marginBottom = '5px';
        info.style.fontWeight = 'bold';
        info.textContent = `Página ${g_paginaActual} de ${totalPaginas} - ${g_totalRegistros} registros totales`;

        container.innerHTML = '';
        container.appendChild(info);

        const navCont = document.createElement('div');
        navCont.id = 'pg-nav-inner';
        container.appendChild(navCont);

        window.renderPaginador('pg-nav-inner', g_totalRegistros, g_paginaActual, g_rowsPorPagina, p => cargarDatos(p));
    }
}

function filtrarGrupos() {
    clearTimeout(window.searchT);
    window.searchT = setTimeout(() => cargarDatos(1), 500);
}

function seleccionarFila(idx) {
    if (idx < 0 || idx >= g_gruposFiltrados.length) return;
    g_indexSeleccionado = idx;
    renderTabla();
    const rows = document.querySelectorAll('#tbodyGrupos tr');
    if (rows[idx]) rows[idx].scrollIntoView({ block: 'nearest' });
}

function abrirEdicion(g) {
    const setV = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    setV('editClave', g.clave);
    setV('editCurso', g.curso_id);
    setV('editMaestro', g.maestro_id);
    setV('editDia', g.dia);
    setV('editHentrada', g.hora_entrada);
    setV('editHsalida', g.hora_salida);
    setV('editSalon', g.salon);
    setV('editCupo', g.cupo);
    const cb = document.getElementById('editActivo');
    if (cb) cb.checked = !!g.activo;

    const modal = document.getElementById('editModal');
    if (modal) modal.style.display = 'block';
}

async function guardarCambios() {
    try {
        const client = await window.waitForSupabase(30000);
        const clave = document.getElementById('editClave').value;
        const upd = {
            curso_id: document.getElementById('editCurso').value,
            maestro_id: document.getElementById('editMaestro').value,
            dia: document.getElementById('editDia').value,
            hora_entrada: document.getElementById('editHentrada').value,
            hora_salida: document.getElementById('editHsalida').value,
            salon: document.getElementById('editSalon').value,
            cupo: parseInt(document.getElementById('editCupo').value) || 0,
            activo: document.getElementById('editActivo').checked
        };

        const { error } = await client.from('grupos').update(upd).eq('clave', clave);
        if (error) throw error;
        alert('Guardado.');
        document.getElementById('editModal').style.display = 'none';
        cargarDatos(g_paginaActual);
    } catch (e) { alert('Error: ' + e.message); }
}

async function eliminarGrupo() {
    if (!confirm('¿Eliminar grupo?')) return;
    try {
        const client = await window.waitForSupabase(30000);
        const { error } = await client.from('grupos').delete().eq('clave', document.getElementById('editClave').value);
        if (error) throw error;
        document.getElementById('editModal').style.display = 'none';
        cargarDatos(1);
    } catch (e) { alert('Error: ' + e.message); }
}

function mostrarError(m) {
    const tb = document.getElementById('tbodyGrupos');
    if (tb) tb.innerHTML = `<tr><td colspan="14" style="text-align:center; color:red;">${m}</td></tr>`;
}

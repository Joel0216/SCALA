// Módulo de Cursos
var db = null; // Changed to var to be accessible via window.opener
let cursos = [];
let cursoSeleccionado = null;
let modoNuevo = false;

// Variables para paginación en búsqueda
let g_paginaActualCursos = 1;
let g_totalPaginasCursos = 1;
let g_totalResultadosCursos = 0;
let g_terminoBusquedaCursos = '';
let g_resultadosBusquedaCursos = [];

// Inicializar
document.addEventListener('DOMContentLoaded', async () => {
    console.log('=== INICIALIZANDO MÓDULO CURSOS ===');

    try {
        if (typeof waitForSupabase === 'function') {
            db = await waitForSupabase();
        } else {
            db = window.supabaseClient || window.supabase || (typeof getSupabase === 'function' ? getSupabase() : null);
        }

        // EXPOSE DB TO WINDOW for child windows (like cursos-lista)
        window.db = db;

        if (db) {
            console.log('✓ Supabase disponible en cursos');
            await cargarCursos();
        } else {
            console.error('❌ Supabase NO disponible');
        }
    } catch (err) {
        console.error('Error durante la inicialización:', err);
    }

    actualizarFechaHora();
    setInterval(actualizarFechaHora, 1000);

    configurarValidaciones();

    const cursoInput = document.getElementById('curso');
    if (cursoInput) {
        cursoInput.addEventListener('input', generarClaveAutomatica);
    }

    // Configurar auto-carga en modal cuando cambia dropdown de curso
    const editCursoSelect = document.getElementById('editCurso');
    if (editCursoSelect) {
        editCursoSelect.addEventListener('change', cargarDatosCursoEnModal);
    }

    if (typeof habilitarInputs === 'function') habilitarInputs();
});




async function cargarCursos() {
    if (!db) return;
    try {
        // Eliminar límite - traer TODOS los cursos (117+)
        const { data, error } = await db.from('cursos').select('*').order('curso').range(0, 1000);
        if (error) {
            console.error('Error cargando cursos:', error);
        } else {
            cursos = data || [];
            console.log(`✓ ${cursos.length} cursos cargados`);
            poblarDropdownCursoPrincipal();
        }
    } catch (e) {
        console.error('Error:', e);
    }
}

function actualizarFechaHora() {
    const ahora = new Date();
    const dia = String(ahora.getDate()).padStart(2, '0');
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const anio = ahora.getFullYear();
    let horas = ahora.getHours();
    const minutos = String(ahora.getMinutes()).padStart(2, '0');
    const segundos = String(ahora.getSeconds()).padStart(2, '0');
    const ampm = horas >= 12 ? 'PM' : 'AM';
    horas = horas % 12 || 12;

    document.getElementById('datetime').textContent =
        `${dia}/${mes}/${anio} ${horas}:${minutos}:${segundos} ${ampm}`;
}

function configurarValidaciones() {
    // Validaciones si son necesarias
}

function generarClaveAutomatica() {
    const nombreInput = document.getElementById('curso');
    const claveInput = document.getElementById('clave');
    if (!nombreInput || !claveInput) return;

    const nombre = nombreInput.value.trim().toUpperCase();
    const claveUnica = generarClaveUnicaParaCurso(nombre);
    claveInput.value = claveUnica;
}

// Generar clave base para un curso
function generarClaveParaCurso(nombreCurso) {
    const nombre = nombreCurso.trim().toUpperCase();
    if (!nombre) return '';

    const palabras = nombre.split(' ').filter(p => p.length > 0);
    if (palabras.length === 1) return palabras[0].substring(0, 2);
    return palabras[0].charAt(0) + palabras[1].charAt(0);
}

// Generar clave única (desambigua si ya existe en la lista cargada)
function generarClaveUnicaParaCurso(nombreCurso, excludeId = null) {
    const claveBase = generarClaveParaCurso(nombreCurso);
    if (!claveBase) return '';

    const lista = excludeId ? cursos.filter(c => c.id !== excludeId) : cursos;
    const clavesExistentes = lista.map(c => c.clave);

    if (!clavesExistentes.includes(claveBase)) return claveBase;

    let contador = 1;
    while (clavesExistentes.includes(claveBase + contador)) contador++;
    return claveBase + contador;
}

// Poblar dropdown principal de Curso - ahora es text input, no hacemos nada
function poblarDropdownCursoPrincipal() {
    // curso es ahora un text input - no se puebla como select
}

// Poblar dropdown de Curso Siguiente en el modal de edición
function poblarDropdownCursoSiguiente() {
    const select = document.getElementById('editCursoSiguiente');
    if (!select) return;
    
    select.innerHTML = '<option value="">-- Ninguno (Fin de cadena) --</option>';
    cursos.forEach(c => {
        const option = document.createElement('option');
        option.value = c.id;
        option.textContent = (c.grado ? `[${c.grado}] ` : '') + c.curso;
        select.appendChild(option);
    });
}



function limpiarFormulario() {
    ['curso', 'costo', 'clave'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    document.getElementById('iva').value = '0.16';
    cursoSeleccionado = null;
    modoNuevo = false;
    document.getElementById('btnBorrar').disabled = true;
    document.getElementById('btnEditar').disabled = true;
}

function deshabilitarCampos() {
    ['curso', 'costo'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = true;
    });
}

function habilitarCamposFormulario() {
    ['curso', 'costo', 'clave'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = false;
    });
}

function cargarDatosCurso(curso) {
    cursoSeleccionado = curso;
    modoNuevo = false;
    document.getElementById('curso').value = curso.curso || '';
    document.getElementById('costo').value = curso.costo != null ? parseFloat(curso.costo).toFixed(2) : (curso.precio_mensual ? parseFloat(curso.precio_mensual).toFixed(2) : '');
    document.getElementById('clave').value = curso.clave || '';
    document.getElementById('iva').value = '0.16';
    document.getElementById('grado').value = curso.grado || '';
    
    // document.getElementById('nombreCursoSiguiente').value = cursoSiguiente ? cursoSiguiente.curso : 'Ninguno';

    deshabilitarCampos();
    document.getElementById('btnBorrar').disabled = false;
    document.getElementById('btnEditar').disabled = false;
}
// Expose globally so cursos-lista.html can call it
window.cargarDatosCurso = cargarDatosCurso;

function nuevoCurso() {
    limpiarFormulario();
    modoNuevo = true;
    habilitarCamposFormulario();
    document.getElementById('curso').focus();
    const btnNuevo = document.getElementById('btnNuevo');
    btnNuevo.textContent = 'Guardar';
    btnNuevo.onclick = guardarNuevoCurso;
    document.getElementById('btnCancelarNuevo').style.display = 'inline-block';
    document.getElementById('btnBorrar').disabled = true;
    document.getElementById('btnEditar').disabled = true;
    document.getElementById('btnReporte').disabled = true;

    const formSection = document.querySelector('.form-section');
    if (formSection) formSection.style.border = '2px solid #008B8B';
}

function cancelarNuevo() {
    const btnNuevo = document.getElementById('btnNuevo');
    btnNuevo.textContent = 'Nuevo';
    btnNuevo.onclick = nuevoCurso;
    document.getElementById('btnCancelarNuevo').style.display = 'none';
    limpiarFormulario();
    deshabilitarCampos();
    document.getElementById('btnReporte').disabled = false;
    modoNuevo = false;

    const formSection = document.querySelector('.form-section');
    if (formSection) formSection.style.border = '';
}

async function guardarNuevoCurso() {
    if (!db) { await mostrarAlerta('Error: Base de datos no conectada'); return; }
    const curso = document.getElementById('curso').value.trim();
    const costo = document.getElementById('costo').value.trim();
    const clave = document.getElementById('clave').value.trim();
    const errores = [];
    if (!curso) errores.push('- Curso');
    if (!costo) errores.push('- Costo');
    if (!clave) errores.push('- Clave');
    if (errores.length > 0) {
        await mostrarAlerta('Complete los campos obligatorios:\n\n' + errores.join('\n'));
        return;
    }
    const datos = {
        curso: curso.toUpperCase(),
        costo: parseFloat(costo) || 0,
        clave: clave.toUpperCase(),
        iva: 0.16,
    };
    try {
        const { error } = await db.from('cursos').insert([datos]);
        if (error) throw error;
        await mostrarAlerta(`Curso guardado\n\nCurso: ${datos.curso}\nClave: ${datos.clave}`);
        await cargarCursos();
        cancelarNuevo();
    } catch (err) {
        if (err.code === '23505') {
            await mostrarAlerta(`Error: La clave "${datos.clave}" ya existe.\n\nCambia manualmente la clave en el campo Clave.`);
        } else {
            await mostrarAlerta('Error al guardar: ' + err.message);
        }
    }
}

// ========== BUSCAR CURSO (abre lista estándar) ==========
function buscarCurso() {
    if (modoNuevo) cancelarNuevo();
    window.open('cursos-lista.html', 'CursosLista', 'width=1000,height=700');
}

// Función global para recibir selección de cursos-lista.html (fallback por ID)
window.recibirCursoSeleccionado = function (cursoId) {
    const curso = cursos.find(c => c.id === cursoId);
    if (curso) cargarDatosCurso(curso);
};

// ========== EDITAR CURSO (ABRE MODAL) ==========
function editarCurso() {
    if (!cursoSeleccionado) {
        mostrarAlerta('Primero seleccione un curso para editar');
        return;
    }

    document.getElementById('editCurso').value = cursoSeleccionado.curso || '';
    document.getElementById('editClave').value = cursoSeleccionado.clave || '';
    document.getElementById('editCosto').value = cursoSeleccionado.costo != null ? parseFloat(cursoSeleccionado.costo).toFixed(2) : (cursoSeleccionado.precio_mensual ? parseFloat(cursoSeleccionado.precio_mensual).toFixed(2) : '');
     // document.getElementById('editIva').value = '0.16';
    document.getElementById('editGrado').value = cursoSeleccionado.grado || '';

    document.getElementById('modalEdicion').style.display = 'block';
    document.getElementById('editCurso').focus();
}

function cancelarEdicion() {
    document.getElementById('modalEdicion').style.display = 'none';
}

// Auto-generar clave en modal al escribir nombre
function cargarDatosCursoEnModal() {
    const nombreCurso = document.getElementById('editCurso')?.value || '';
    if (nombreCurso) {
        const clave = generarClaveUnicaParaCurso(nombreCurso, cursoSeleccionado?.id);
        document.getElementById('editClave').value = clave;
    }
}

async function guardarEdicion() {
    if (!db || !cursoSeleccionado) {
        await mostrarAlerta('Error: No hay curso seleccionado');
        return;
    }

    const curso = document.getElementById('editCurso').value.trim();
    const costo = document.getElementById('editCosto').value.trim();
    const clave = document.getElementById('editClave').value.trim();

    const errores = [];
    if (!curso) errores.push('- Curso');
    if (!costo) errores.push('- Costo');
    if (!clave) errores.push('- Clave');

    if (errores.length > 0) {
        await mostrarAlerta('Complete los campos obligatorios:\n\n' + errores.join('\n'));
        return;
    }

    const datos = {
        curso: curso.toUpperCase(),
        costo: parseFloat(costo) || 0,
        clave: clave.toUpperCase(),
        iva: 0.16,
        grado: document.getElementById('editGrado').value.trim()
    };

    try {
        const { error } = await db.from('cursos').update(datos).eq('id', cursoSeleccionado.id);
        if (error) throw error;

        await mostrarAlerta(`Curso actualizado\n\nCurso: ${datos.curso}\nClave: ${datos.clave}`);
        await cargarCursos();

        cursoSeleccionado = { ...cursoSeleccionado, ...datos };
        cargarDatosCurso(cursoSeleccionado);
        cancelarEdicion();

    } catch (err) {
        await mostrarAlerta('Error al actualizar: ' + err.message);
    }
}

// ========== BORRADO ==========
async function borrarCurso() {
    if (!cursoSeleccionado) {
        await mostrarAlerta('Primero seleccione un curso para borrar');
        return;
    }
    document.getElementById('mensajeBorrar').textContent =
        `¿Está seguro de que desea borrar el curso "${cursoSeleccionado.curso}"?`;
    document.getElementById('razonBorrado').value = '';
    document.getElementById('modalBorrar').style.display = 'block';
    document.getElementById('razonBorrado').focus();
}

function cancelarBorrado() {
    document.getElementById('modalBorrar').style.display = 'none';
}

async function confirmarBorrado() {
    const razon = document.getElementById('razonBorrado').value.trim();
    if (!razon) {
        await mostrarAlerta('Debe proporcionar una razón para el borrado');
        return;
    }
    if (!db || !cursoSeleccionado) {
        await mostrarAlerta('Error: No hay curso seleccionado');
        return;
    }
    try {
        const { error } = await db.from('cursos').delete().eq('id', cursoSeleccionado.id);
        if (error) throw error;
        await mostrarAlerta('Curso eliminado correctamente');
        document.getElementById('modalBorrar').style.display = 'none';
        await cargarCursos();
        limpiarFormulario();
        deshabilitarCampos();
        document.getElementById('btnEditar').disabled = true;
    } catch (err) {
        await mostrarAlerta('Error al eliminar: ' + err.message);
    }
}

function generarReporte() {
    window.location.href = 'reportes-cursos.html';
}

function terminar() {
    window.location.href = 'archivos.html';
}

window.onclick = function (event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
};

// ==================== FUNCIONES DE BÚSQUEDA (modal antiguo - no se usa si usamos cursos-lista.html) ====================
function cerrarModalBusquedaCurso() {
    const el = document.getElementById('modalBusquedaCurso');
    if (el) el.style.display = 'none';
}

function cerrarModalResultadosCurso() {
    const el = document.getElementById('modalResultadosCurso');
    if (el) el.style.display = 'none';
}

async function ejecutarBusquedaCurso() {
    const termino = document.getElementById('inputBusquedaCurso')?.value.trim().toUpperCase() || '';
    const tipoFiltro = document.getElementById('filtroBusquedaTipo')?.value || '';
    cerrarModalBusquedaCurso();
    g_terminoBusquedaCursos = termino;
    g_paginaActualCursos = 1;
    await cargarResultadosBusquedaCurso();
}

async function cargarResultadosBusquedaCurso() {
    const termino = g_terminoBusquedaCursos;
    const pagina = g_paginaActualCursos;
    const limite = 100;
    const desde = (pagina - 1) * limite;

    const tbody = document.getElementById('bodyResultadosCurso');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="2" style="text-align:center;">Buscando...</td></tr>';
    const titleEl = document.getElementById('tituloResultadosCurso');
    if (titleEl) titleEl.textContent = 'Resultados de Búsqueda';
    const modalRes = document.getElementById('modalResultadosCurso');
    if (modalRes) modalRes.style.display = 'block';

    if (!db) {
        tbody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:red;">Error: No hay conexión</td></tr>';
        return;
    }

    try {
        let query = db.from('cursos').select('*').order('curso').range(desde, desde + limite - 1);
        if (termino) query = query.or(`clave.ilike.%${termino}%,curso.ilike.%${termino}%`);

        const result = await query;
        if (result.error) {
            tbody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:red;">Error: ' + result.error.message + '</td></tr>';
            return;
        }
        if (!result.data || result.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="2" style="text-align:center;">No se encontraron cursos.</td></tr>';
            return;
        }
        g_totalResultadosCursos = result.data.length;
        g_totalPaginasCursos = 1;
        mostrarResultadosCurso(result.data, termino);
        actualizarControlesPaginacionCursos();
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:red;">Error: ' + e.message + '</td></tr>';
    }
}

function mostrarResultadosCurso(resultados, termino) {
    const tbody = document.getElementById('bodyResultadosCurso');
    tbody.innerHTML = '';
    const titleEl = document.getElementById('tituloResultadosCurso');
    if (titleEl) titleEl.textContent = "Resultados ('" + termino + "')";
    resultados.forEach(curso => {
        const tr = document.createElement('tr');
        tr.style.cursor = 'pointer';
        tr.onclick = () => {
            cerrarModalResultadosCurso();
            cargarDatosCurso(curso);
        };
        tr.innerHTML = `<td>${curso.clave || ''}</td><td>${curso.curso || ''}</td>`;
        tbody.appendChild(tr);
    });
}

function actualizarControlesPaginacionCursos() {
    const controles = document.getElementById('paginacionControlesCursos');
    const info = document.getElementById('infoPaginaCursos');
    if (!controles) return;
    if (g_totalPaginasCursos <= 1) { controles.style.display = 'none'; return; }
    controles.style.display = 'flex';
    if (info) info.textContent = `Página ${g_paginaActualCursos} de ${g_totalPaginasCursos}`;
}

function irPrimeraPaginaCursos() { if (g_paginaActualCursos > 1) { g_paginaActualCursos = 1; cargarResultadosBusquedaCurso(); } }
function irPaginaAnteriorCursos() { if (g_paginaActualCursos > 1) { g_paginaActualCursos--; cargarResultadosBusquedaCurso(); } }
function irPaginaSiguienteCursos() { if (g_paginaActualCursos < g_totalPaginasCursos) { g_paginaActualCursos++; cargarResultadosBusquedaCurso(); } }
function irUltimaPaginaCursos() { if (g_paginaActualCursos < g_totalPaginasCursos) { g_paginaActualCursos = g_totalPaginasCursos; cargarResultadosBusquedaCurso(); } }

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        cancelarBorrado();
        cancelarEdicion();
    }
});

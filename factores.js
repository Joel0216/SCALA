// Variables globales
let factores = [];
let maestros = [];
let cursos = [];
let currentIndex = 0;
let modoEdicion = false;
let factorActual = null;
let db = null; // Instancia de Supabase

// Variables para paginación de búsqueda
let g_paginaActualFactores = 1;
let g_totalPaginasFactores = 1;
let g_terminoBusquedaFactores = '';
let g_resultadosTotalesFactores = 0;

// =====================================================
// INICIALIZACIÓN
// =====================================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Inicializando módulo de Factores...');

    try {
        if (typeof waitForSupabase === 'function') {
            db = await waitForSupabase();
        } else {
            db = window.supabaseClient || window.supabase || (typeof getSupabase === 'function' ? getSupabase() : null);
        }

        if (db) {
            console.log('✓ Supabase conectado');
            // Exponer BD para ventanas hijas (importante para factores-lista)
            window.db = db;

            // Inicializar fecha/hora
            actualizarFechaHora();
            setInterval(actualizarFechaHora, 1000);

            // Cargar catálogos y datos
            await loadMaestros();
            await loadCursos();
            await loadFactores(); // Carga inicial
        } else {
            console.error('❌ Supabase NO disponible');
            alert('No hay conexión a la base de datos. Verifique su configuración.');
            return; // Exit if DB is not available
        }
    } catch (err) {
        console.error('Error durante la inicialización:', err);
        alert('Error durante la inicialización: ' + err.message);
        return; // Exit on error
    }

    // Configurar listeners
    setupEventListeners();

    // Estado inicial de UI
    desactivarModoEdicion();
    // if (factores.length > 0) {
    //     mostrarFactor(0);
    // } else {
    //     limpiarFormulario();
    // }

    // Solicitud usuario: Mostrar siempre formulario limpio al iniciar
    limpiarFormulario();

    // Ajustar navegación visual aunque no mostremos datos
    if (factores.length > 0) {
        document.getElementById('currentRecord').textContent = '1';
        document.getElementById('inputRegistro').value = '1';
    } else {
        document.getElementById('currentRecord').textContent = '0';
        document.getElementById('inputRegistro').value = '0';
    }
});

function actualizarFechaHora() {
    const el = document.getElementById('datetime');
    if (el) {
        const now = new Date();
        el.textContent = now.toLocaleString('es-MX', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
        });
    }
}

// =====================================================
// CARGA DE DATOS
// =====================================================
async function loadMaestros() {
    try {
        const { data, error } = await db
            .from('maestros')
            .select('*')
            .order('nombre', { ascending: true });

        if (error) throw error;
        maestros = data || [];

        // Llenar select
        const select = document.getElementById('maestro');
        select.innerHTML = '<option value="">-- Seleccione un maestro --</option>';
        maestros.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.id; // ID (BIGINT)
            opt.textContent = m.nombre;
            opt.dataset.id = m.id; // Store ID
            select.appendChild(opt);
        });
    } catch (e) {
        console.error('Error cargando maestros:', e);
        alert('Error al cargar maestros: ' + e.message);
    }
}

async function loadCursos() {
    try {
        const { data, error } = await db
            .from('cursos')
            .select('*')
            .order('curso', { ascending: true });

        if (error) throw error;
        cursos = data || [];

        // Llenar select
        const select = document.getElementById('curso');
        select.innerHTML = '<option value="">-- Seleccione un curso --</option>';
        cursos.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id; // ID (BIGINT)
            opt.textContent = c.curso;
            opt.dataset.id = c.id; // Store ID
            select.appendChild(opt);
        });
    } catch (e) {
        console.error('Error cargando cursos:', e);
        alert('Error al cargar cursos: ' + e.message);
    }
}

async function loadFactores() {
    try {
        const { data, error } = await db
            .from('factores')
            .select(`
                *,
                maestros!maestro_id(id, nombre, fecha_ingreso),
                cursos!curso_id(id, curso)
            `)
            .order('id', { ascending: true });

        if (error) throw error;

        factores = data || [];

        // Actualizar contadores
        document.getElementById('totalRecords').textContent = factores.length;
        // El contador del panel de maestros debería mostrar el total del catálogo, no 1
        document.getElementById('totalMaestros').textContent = maestros.length;

    } catch (e) {
        console.error('Error cargando factores:', e);
        alert('Error al cargar factores: ' + e.message);
    }
}

// =====================================================
// NAVEGACIÓN Y VISUALIZACIÓN
// =====================================================
function mostrarFactor(index) {
    if (index < 0 || index >= factores.length) return;

    currentIndex = index;
    factorActual = factores[index];

    // Llenar campos
    // Llenar campos
    if (factorActual.maestro_id) document.getElementById('maestro').value = String(factorActual.maestro_id);
    if (factorActual.curso_id) document.getElementById('curso').value = String(factorActual.curso_id);

    document.getElementById('factor').value = factorActual.factor;
    document.getElementById('porcentaje').value = (factorActual.factor / 100).toFixed(2) + '%';

    // Llenar detalles del maestro (readonly)
    // Nota: al cambiar el select arriba, NO se dispara el evento 'change' automáticamente en JS puro
    // por lo tanto, debemos llamar manualmente a llenarDetalles con los datos que YA tenemos del join.
    if (factorActual.maestros) {
        llenarDetallesMaestro(factorActual.maestros);

        // Sincronizar navegación interna de maestros con el maestro actual
        // Buscar índice en array maestros
        const mIdx = maestros.findIndex(m => String(m.id) === String(factorActual.maestro_id));
        if (mIdx >= 0) {
            document.getElementById('inputRegistroMaestro').value = mIdx + 1;
        }
    } else {
        llenarDetallesMaestro(null);
    }

    // Actualizar UI navegación
    document.getElementById('currentRecord').textContent = index + 1;
    document.getElementById('inputRegistro').value = index + 1;

    // Habilitar borrar
    document.getElementById('borrarBtn').disabled = false;
}

function llenarDetallesMaestro(maestroData) {
    if (!maestroData) {
        document.getElementById('nombreMaestro').value = '';
        document.getElementById('grado').value = '';
        document.getElementById('detallesGrado').value = '';
        document.getElementById('fechaIngreso').value = '';
        return;
    }
    document.getElementById('nombreMaestro').value = maestroData.nombre || '';
    document.getElementById('grado').value = maestroData.grado || '';
    document.getElementById('detallesGrado').value = maestroData.detalles_grado || '';
    document.getElementById('fechaIngreso').value = maestroData.fecha_ingreso ? formatearFecha(maestroData.fecha_ingreso) : '';
}

function formatearFecha(fecha) {
    if (!fecha) return '';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-MX');
}

function setupEventListeners() {
    const maestroSelect = document.getElementById('maestro');
    maestroSelect.addEventListener('change', (e) => {
        const id = e.target.value;
        const maestro = maestros.find(m => String(m.id) === String(id));
        llenarDetallesMaestro(maestro);
    });

    const factorInput = document.getElementById('factor');
    factorInput.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value) || 0;
        document.getElementById('porcentaje').value = (val / 100).toFixed(2) + '%';
    });
}

// =====================================================
// NUEVO / EDICIÓN / GUARDAR
// =====================================================
function activarModoEdicion() {
    modoEdicion = true;
    factorActual = null;
    limpiarFormulario();
    llenarDetallesMaestro(null);

    document.getElementById('maestro').disabled = false;
    document.getElementById('curso').disabled = false;
    document.getElementById('factor').disabled = false;

    const btnNuevo = document.getElementById('nuevoBtn');
    btnNuevo.textContent = 'Guardar';
    btnNuevo.onclick = guardarFactor;

    const btnCancelar = document.getElementById('cancelarBtn');
    btnCancelar.style.display = 'inline-block';

    document.getElementById('borrarBtn').disabled = true;
    document.getElementById('factoresForm').classList.add('modo-edicion');
}

function cancelarNuevo() {
    modoEdicion = false;
    document.getElementById('factoresForm').classList.remove('modo-edicion');

    const btnNuevo = document.getElementById('nuevoBtn');
    btnNuevo.textContent = 'Nuevo';
    btnNuevo.onclick = activarModoEdicion;

    document.getElementById('cancelarBtn').style.display = 'none';

    document.getElementById('maestro').disabled = true;
    document.getElementById('curso').disabled = true;
    document.getElementById('factor').disabled = true;

    if (factores.length > 0) {
        mostrarFactor(currentIndex);
    } else {
        limpiarFormulario();
    }
}

async function guardarFactor() {
    const maestroId = document.getElementById('maestro').value;
    const cursoId = document.getElementById('curso').value;
    const factorVal = document.getElementById('factor').value;

    if (!maestroId || !cursoId || !factorVal) {
        alert('Todos los campos son obligatorios.');
        return;
    }

    const factorNum = parseFloat(factorVal);
    const porcentajeNum = factorNum / 100;

    try {
        const nuevoFactor = {
            maestro_id: maestroId,
            curso_id: cursoId,
            factor: factorNum,
            porcentaje: porcentajeNum,
            activo: true
        };

        const { data, error } = await db
            .from('factores')
            .insert([nuevoFactor])
            .select();

        if (error) throw error;

        alert('Factor guardado correctamente.');
        await loadFactores();
        cancelarNuevo();

        if (factores.length > 0) {
            mostrarFactor(factores.length - 1);
        }

    } catch (e) {
        console.error('Error insertando factor:', e);
        alert('Error al guardar: ' + e.message);
    }
}

function limpiarFormulario() {
    document.getElementById('maestro').value = '';
    document.getElementById('curso').value = '';
    document.getElementById('factor').value = '0';
    document.getElementById('porcentaje').value = '0.00%';
    llenarDetallesMaestro(null);
}

function desactivarModoEdicion() {
    modoEdicion = false;
    const btnNuevo = document.getElementById('nuevoBtn');
    if (btnNuevo) {
        btnNuevo.textContent = 'Nuevo';
        btnNuevo.onclick = activarModoEdicion;
    }
    const btnCancel = document.getElementById('cancelarBtn');
    if (btnCancel) btnCancel.style.display = 'none';

    document.getElementById('maestro').disabled = true;
    document.getElementById('curso').disabled = true;
    document.getElementById('factor').disabled = true;
}

// =====================================================
// BÚSQUEDA (Ventana Independiente Estilo Alumnos)
// =====================================================
function abrirModalBusqueda() {
    var width = 980, height = 700;
    var left = Math.round((screen.width - width) / 2);
    var top = Math.round((screen.height - height) / 2);

    window.open(
        'factores-lista.html', 'ListaFactores',
        'width=' + width + ',height=' + height +
        ',top=' + top + ',left=' + left +
        ',resizable=yes,scrollbars=yes'
    );
}

// Recibir factor seleccionado de la ventana emergente
window.seleccionarFactor = function (factorMaestro) {
    if (!factorMaestro) return;

    console.log('Factor recibido:', factorMaestro);

    // El objeto recibido 'factorMaestro' viene de la vista factores_maestros
    // Necesitamos cargar el factor completo desde la tabla 'factores' para tener todos los datos.
    cargarFactorPorId(factorMaestro.id);
};

async function cargarFactorPorId(id) {
    try {
        const { data, error } = await db
            .from('factores')
            .select(`
                *,
                maestros!maestro_id(id, nombre, fecha_ingreso),
                cursos!curso_id(id, curso)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        if (data) {
            // Buscar si ya está en nuestro array local
            const idx = factores.findIndex(f => f.id === data.id);
            if (idx >= 0) {
                factores[idx] = data;
                mostrarFactor(idx);
            } else {
                factores.push(data);
                mostrarFactor(factores.length - 1);
            }
            window.focus();
        }
    } catch (e) {
        console.error('Error cargando factor por ID:', e);
    }
}

// =====================================================
// BORRADO (Soft Delete)
// =====================================================
function borrarFactor() {
    if (!factorActual || !factorActual.id) return;
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
        alert('La razón del borrado es OBLIGATORIA.');
        return;
    }

    try {
        const { error } = await db
            .from('factores')
            .update({
                activo: false,
                razon_borrado: razon
            })
            .eq('id', factorActual.id);

        if (error) throw error;

        alert('Factor borrado correctamente.');
        cancelarBorrado();
        await loadFactores();

        if (factores.length > 0) {
            mostrarFactor(0);
        } else {
            limpiarFormulario();
            desactivarModoEdicion();
        }

    } catch (e) {
        console.error('Error borrando:', e);
        alert('Error al borrar: ' + e.message);
    }
}

// =====================================================
// NAVEGACIÓN DE MAESTROS (PANEL INTERNO)
// =====================================================
function navegarMaestroSiguiente() {
    const select = document.getElementById('maestro');
    if (select.selectedIndex < select.options.length - 1) {
        select.selectedIndex++;
        select.dispatchEvent(new Event('change'));
    }
}
function navegarMaestroAnterior() {
    const select = document.getElementById('maestro');
    if (select.selectedIndex > 1) {
        select.selectedIndex--;
        select.dispatchEvent(new Event('change'));
    }
}
function navegarMaestroPrimero() {
    const select = document.getElementById('maestro');
    if (select.options.length > 1) {
        select.selectedIndex = 1;
        select.dispatchEvent(new Event('change'));
    }
}
function navegarMaestroUltimo() {
    const select = document.getElementById('maestro');
    if (select.options.length > 1) {
        select.selectedIndex = select.options.length - 1;
        select.dispatchEvent(new Event('change'));
    }
}
function navegarMaestroRegistro() { } // Placeholder

// Asegurar que las funciones estén disponibles globalmente para onclick
window.borrarFactor = borrarFactor;
window.cancelarBorrado = cancelarBorrado;
window.confirmarBorrado = confirmarBorrado;
window.navegarMaestroSiguiente = navegarMaestroSiguiente;
window.navegarMaestroAnterior = navegarMaestroAnterior;
window.navegarMaestroPrimero = navegarMaestroPrimero;
window.navegarMaestroUltimo = navegarMaestroUltimo;
window.abrirModalBusqueda = abrirModalBusqueda;
window.activarModoEdicion = activarModoEdicion;
window.cancelarNuevo = cancelarNuevo;
window.guardarFactor = guardarFactor;
window.navegarMaestroRegistro = navegarMaestroRegistro;
window.mostrarFactor = mostrarFactor;

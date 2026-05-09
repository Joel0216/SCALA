/**
 * catalogo-instrumentos.js - CRUD de Instrumentos con Supabase
 */
var db = null;
let instrumentoSeleccionado = null;
let modoNuevo = false;
let instrumentosExistentes = [];

// Referencias a elementos del DOM
const claveInput = document.getElementById('claveInstrumento');
const descripcionInput = document.getElementById('descripcionInstrumento');

const btnNuevo = document.getElementById('btnNuevo');
const btnGuardar = document.getElementById('btnGuardar');
const btnCancelarNuevo = document.getElementById('btnCancelarNuevo');
const btnBuscar = document.getElementById('btnBuscar');
const btnBorrar = document.getElementById('btnBorrar');
const btnTerminar = document.getElementById('btnTerminar');

// Inicializar
document.addEventListener('DOMContentLoaded', async () => {
    try {
        if (typeof waitForSupabase === 'function') {
            db = await waitForSupabase();
        } else {
            db = window.supabaseClient || window.supabase || (typeof getSupabase === 'function' ? getSupabase() : null);
        }

        window.db = db;

        if (db) {
            await cargarInstrumentosExistentes();
        }
    } catch (err) {
        console.error('Error inicializando:', err);
    }

    // Configura reloj
    setInterval(() => {
        const datetime = document.getElementById('datetime');
        if (datetime) datetime.textContent = new Date().toLocaleString('es-MX');
    }, 1000);
});

// Cargar instrumentos existentes para validación de clave única
async function cargarInstrumentosExistentes() {
    if (!db) return;
    const { data, error } = await db.from('instrumentos').select('clave');
    if (!error && data) {
        instrumentosExistentes = data.map(i => i.clave);
    }
}

// Generación automática de clave
descripcionInput.addEventListener('input', () => {
    if (modoNuevo) {
        const desc = descripcionInput.value;
        claveInput.value = calcularClaveUnica(desc);
    }
});

// Función para calcular clave única (PNO, GTR, etc.)
function calcularClaveUnica(descripcion) {
    descripcion = descripcion.trim().toUpperCase();
    if (!descripcion) return '';

    const palabras = descripcion.split(' ').filter(p => p.length > 0);
    let claveBase = '';

    if (palabras.length === 1) {
        claveBase = descripcion.substring(0, 3).replace(/[^A-Z]/g, '');
    } else if (palabras.length === 2) {
        claveBase = palabras[0].substring(0, 2) + palabras[1].charAt(0);
    } else {
        claveBase = palabras[0].charAt(0) + palabras[1].charAt(0) + palabras[2].charAt(0);
    }

    if (!claveBase) return '';

    let claveUnica = claveBase;
    let contador = 1;

    // Resolver colisiones
    while (instrumentosExistentes.includes(claveUnica)) {
        claveUnica = claveBase.substring(0, 3 - contador.toString().length) + contador;
        contador++;
    }

    return claveUnica;
}

// Botón Nuevo
btnNuevo.addEventListener('click', () => {
    modoNuevo = true;
    instrumentoSeleccionado = null;
    
    claveInput.value = '';
    descripcionInput.value = '';
    
    claveInput.readOnly = true; // Clave automática
    descripcionInput.disabled = false;
    descripcionInput.focus();

    btnNuevo.style.display = 'none';
    btnGuardar.style.display = 'inline-block';
    btnCancelarNuevo.style.display = 'inline-block';
    
    btnBuscar.disabled = true;
    btnBorrar.disabled = true;
});

// Botón Cancelar
btnCancelarNuevo.addEventListener('click', () => {
    modoNuevo = false;
    instrumentoSeleccionado = null;
    
    claveInput.value = '';
    descripcionInput.value = '';
    
    claveInput.readOnly = true;
    descripcionInput.disabled = true;

    btnNuevo.style.display = 'inline-block';
    btnGuardar.style.display = 'none';
    btnCancelarNuevo.style.display = 'none';
    
    btnBuscar.disabled = false;
    btnBorrar.disabled = true;
});

// Botón Guardar
btnGuardar.addEventListener('click', async () => {
    const clave = claveInput.value.trim().toUpperCase();
    const descripcion = descripcionInput.value.trim().toUpperCase();

    if (!descripcion) {
        await mostrarAlerta('Por favor ingrese una descripción.');
        return;
    }

    try {
        const { data, error } = await db.from('instrumentos').insert([{
            clave: clave,
            descripcion: descripcion,
            activo: true
        }]).select();

        if (error) throw error;

        await mostrarAlerta('Instrumento guardado correctamente.');
        await cargarInstrumentosExistentes();
        btnCancelarNuevo.click();

    } catch (error) {
        if (error.code === '23505') {
            await mostrarAlerta('Error: La clave generada ya existe.');
        } else {
            await mostrarAlerta('Error al guardar: ' + error.message);
        }
    }
});

// Botón Buscar
btnBuscar.addEventListener('click', () => {
    if (modoNuevo) btnCancelarNuevo.click();
    window.open('instrumentos-lista.html', 'InstrumentosLista', 'width=800,height=600');
});

// Cargar datos desde ventana emergente
window.cargarDatosDesdeVentana = function(instrumento) {
    instrumentoSeleccionado = instrumento;
    claveInput.value = instrumento.clave || '';
    descripcionInput.value = instrumento.descripcion || '';
    
    descripcionInput.disabled = true;
    btnBorrar.disabled = false;
};

// Botón Borrar
btnBorrar.addEventListener('click', async () => {
    if (!instrumentoSeleccionado) return;
    
    if (await mostrarConfirm(`¿Está seguro de que desea borrar el instrumento "${instrumentoSeleccionado.descripcion}"?`)) {
        confirmarBorrado();
    }
});

async function confirmarBorrado() {
    try {
        const { error } = await db.from('instrumentos').delete().eq('clave', instrumentoSeleccionado.clave);
        if (error) throw error;

        await mostrarAlerta('Instrumento eliminado permanentemente.');
        await cargarInstrumentosExistentes();
        btnCancelarNuevo.click();
    } catch (error) {
        await mostrarAlerta('Error al borrar: ' + error.message);
    }
}

// Botón Terminar
btnTerminar.addEventListener('click', () => {
    window.location.href = 'otros-catalogos.html';
});

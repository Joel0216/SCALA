// Módulo de Catálogo de Medios
var db = null;
let medioSeleccionado = null;
let modoNuevo = false;
let mediosExistentes = [];

// Referencias a elementos del DOM
const claveInput = document.getElementById('claveMedio');
const descripcionInput = document.getElementById('descripcionMedio');

const btnNuevo = document.getElementById('btnNuevo');
const btnGuardar = document.getElementById('btnGuardar');
const btnCancelarNuevo = document.getElementById('btnCancelarNuevo');
const btnBuscar = document.getElementById('btnBuscar');
const btnBorrar = document.getElementById('btnBorrar');
const btnTerminar = document.getElementById('btnTerminar');
const modalBorrar = document.getElementById('modalBorrar');

// Inicializar
document.addEventListener('DOMContentLoaded', async () => {
    try {
        if (typeof waitForSupabase === 'function') {
            db = await waitForSupabase();
        } else {
            db = window.supabaseClient || window.supabase;
        }

        window.db = db;

        if (db) {
            await cargarMediosExistentes();
        }
    } catch (err) {
        console.error('Error inicializando supabase:', err);
    }
});

// Cargar medios existentes para validación de clave única
async function cargarMediosExistentes() {
    if (!db) return;
    try {
        const { data, error } = await SessionManager.applyIsolation(db.from('medios_contacto').select('clave'));
        if (!error && data) {
            mediosExistentes = data.map(m => m.clave);
        }
    } catch (e) {
        console.error('Error cargando medios:', e);
    }
}

// Generación automática de clave
descripcionInput.addEventListener('input', () => {
    if (modoNuevo) {
        const desc = descripcionInput.value;
        claveInput.value = calcularClaveUnica(desc);
    }
});

// Función pura para calcular clave única
function calcularClaveUnica(descripcion) {
    descripcion = descripcion.trim().toUpperCase();
    if (!descripcion) return '';

    // Dividir en palabras (hasta 4 letras para la clave)
    const palabras = descripcion.split(' ').filter(p => p.length > 0);
    let claveBase = '';

    if (palabras.length === 1) {
        claveBase = descripcion.substring(0, 4).replace(/[^A-Z]/g, '');
    } else if (palabras.length === 2) {
        claveBase = palabras[0].substring(0, 2) + palabras[1].substring(0, 2);
    } else if (palabras.length === 3) {
        claveBase = palabras[0].substring(0, 2) + palabras[1].charAt(0) + palabras[2].charAt(0);
    } else {
        claveBase = palabras[0].charAt(0) + palabras[1].charAt(0) + palabras[2].charAt(0) + palabras[3].charAt(0);
    }

    claveBase = claveBase.substring(0, 10); // Limitar a 10 char por seguridad
    if(!claveBase) return '';

    let claveUnica = claveBase;
    let contador = 1;

    // Resolver colisiones
    while (mediosExistentes.includes(claveUnica)) {
        claveUnica = claveBase.substring(0, 10 - contador.toString().length) + contador;
        contador++;
    }

    return claveUnica;
}

// Botón Nuevo
btnNuevo.addEventListener('click', () => {
    modoNuevo = true;
    medioSeleccionado = null;
    
    claveInput.value = '';
    descripcionInput.value = '';
    
    descripcionInput.disabled = false;
    descripcionInput.focus();

    btnNuevo.style.display = 'none';
    btnGuardar.style.display = 'inline-block';
    btnCancelarNuevo.style.display = 'inline-block';
    
    btnBuscar.disabled = true;
    btnBorrar.disabled = true;
    btnTerminar.disabled = true;
});

// Botón Cancelar Nuevo
btnCancelarNuevo.addEventListener('click', () => {
    modoNuevo = false;
    medioSeleccionado = null;
    
    claveInput.value = '';
    descripcionInput.value = '';
    descripcionInput.disabled = true;

    btnNuevo.style.display = 'inline-block';
    btnGuardar.style.display = 'none';
    btnCancelarNuevo.style.display = 'none';
    
    btnBuscar.disabled = false;
    btnBorrar.disabled = true;
    btnTerminar.disabled = false;
});

// Botón Guardar
btnGuardar.addEventListener('click', async () => {
    if (!db) {
        await mostrarAlerta('Error: Base de datos no conectada');
        return;
    }

    const descripcion = descripcionInput.value.trim().toUpperCase();
    const clave = claveInput.value.trim().toUpperCase();

    if (!descripcion || !clave) {
        await mostrarAlerta('Por favor proporcione una descripción.');
        return;
    }

    try {
        const datos = {
            clave: clave,
            descripcion: descripcion,
            activo: true,
            organizacion_id: SessionManager.getCurrentUser()?.organizacion_id
        };

        const { error } = await db.from('medios_contacto').insert([datos]);
        
        if (error) throw error;

        await mostrarAlerta('✓ Medio guardado exitosamente.');
        
        // Recargar referencias
        await cargarMediosExistentes();

        // Restaurar botones
        btnCancelarNuevo.click();

    } catch (error) {
        if (error.code === '23505') {
            await mostrarAlerta('❌ Error: La clave ya existe. Intente con otra descripción.');
        } else {
            await mostrarAlerta('❌ Error al guardar: ' + error.message);
        }
    }
});

// Botón Buscar
btnBuscar.addEventListener('click', () => {
    if (modoNuevo) btnCancelarNuevo.click();
    window.open('medios-lista.html', 'MediosLista', 'width=800,height=600');
});

// Llamada desde ventana medios-lista.html
window.cargarDatosDesdeVentana = function(medio) {
    medioSeleccionado = medio;
    
    claveInput.value = medio.clave || '';
    descripcionInput.value = medio.descripcion || '';
    
    descripcionInput.disabled = true; // Solo lectura
    
    btnBorrar.disabled = false;
};

// Botón Borrar
btnBorrar.addEventListener('click', async () => {
    if (!medioSeleccionado) return;
    document.getElementById('mensajeBorrar').innerHTML = `¿Está seguro de que desea borrar el medio <strong>${medioSeleccionado.descripcion}</strong>?`;
    modalBorrar.style.display = 'block';
});

// Modal Borrar Cancelar
window.cancelarBorrado = function() {
    modalBorrar.style.display = 'none';
};

// Modal Borrar Confirmar
window.confirmarBorrado = async function() {
    if (!db || !medioSeleccionado) return;

    try {
        const { error } = await db.from('medios_contacto').delete().eq('id', medioSeleccionado.id);
        
        if (error) throw error;

        modalBorrar.style.display = 'none';
        await mostrarAlerta('✓ Medio eliminado permanentemente.');

        // Restablecer ventana
        btnCancelarNuevo.click();
        await cargarMediosExistentes();

    } catch (error) {
        modalBorrar.style.display = 'none';
        await mostrarAlerta('❌ Error al eliminar: ' + error.message);
    }
};

// Botón Terminar
btnTerminar.addEventListener('click', () => {
    window.location.href = 'otros-catalogos.html';
});

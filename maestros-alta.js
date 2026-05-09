// Inicializar Supabase
let supabase = null;

// Esperar a que se cargue la librería de Supabase
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM cargado, inicializando alta de maestros...');

    try {
        await new Promise(r => setTimeout(r, 500));
        if (typeof waitForSupabase === 'function') {
            supabase = await waitForSupabase(10000);
            console.log('✓ Supabase conectado');
        }
    } catch (e) {
        console.error('Error conectando a Supabase:', e);
    }

    // Actualizar fecha y hora
    actualizarFechaHora();
    setInterval(actualizarFechaHora, 1000);

    // Establecer fecha de ingreso automáticamente
    const fechaIngresoInput = document.getElementById('fechaIngreso');
    if (fechaIngresoInput) {
        const hoy = new Date();
        fechaIngresoInput.value = hoy.toISOString().split('T')[0];
    }

    // Event listener para generar clave automáticamente
    const nombreInput = document.getElementById('nombre');
    if (nombreInput) {
        nombreInput.addEventListener('input', generarClave);
    }

    console.log('Inicialización de alta de maestros completa');
});

// Actualizar fecha y hora
function actualizarFechaHora() {
    const ahora = new Date();
    const dia = String(ahora.getDate()).padStart(2, '0');
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const anio = ahora.getFullYear();
    let horas = ahora.getHours();
    const minutos = String(ahora.getMinutes()).padStart(2, '0');
    const segundos = String(ahora.getSeconds()).padStart(2, '0');
    const ampm = horas >= 12 ? 'p. m.' : 'a. m.';
    horas = horas % 12 || 12;
    const horasStr = String(horas).padStart(2, '0');

    const datetime = document.getElementById('datetime');
    if (datetime) {
        datetime.textContent = `${dia}/${mes}/${anio} ${horasStr}:${minutos}:${segundos} ${ampm}`;
    }
}

// Generar clave automáticamente basada en el nombre
function generarClave() {
    const nombreInput = document.getElementById('nombre');
    const claveInput = document.getElementById('clave');

    if (!nombreInput || !claveInput) return;

    const nombre = nombreInput.value.trim().toUpperCase();

    if (!nombre) {
        claveInput.value = '';
        return;
    }

    // Dividir el nombre en palabras
    const palabras = nombre.split(' ').filter(p => p.length > 0);

    let clave = '';

    if (palabras.length === 1) {
        // Si solo hay una palabra, tomar las primeras 2 letras
        clave = palabras[0].substring(0, 2);
    } else if (palabras.length === 2) {
        // Si hay 2 palabras (nombre y apellido), tomar primera letra de cada una
        // Ejemplo: "Denice Martinez" -> "DM"
        clave = palabras[0].charAt(0) + palabras[1].charAt(0);
    } else if (palabras.length >= 3) {
        // Si hay 3 o más palabras, tomar primera letra del primer nombre y primer apellido
        // Ejemplo: "Joel Antonio Pool Martinez" -> "JP"
        // Asumimos que los primeros nombres son hasta encontrar un apellido común
        // Por simplicidad, tomamos primera letra de la primera palabra y primera letra de la penúltima palabra
        clave = palabras[0].charAt(0) + palabras[palabras.length - 2].charAt(0);
    }

    claveInput.value = clave;
}

// Validar campos obligatorios
function validarCampos() {
    const nombre = document.getElementById('nombre').value.trim();
    const direccion1 = document.getElementById('direccion1').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const rfc = document.getElementById('rfc').value.trim();
    const fechaIngreso = document.getElementById('fechaIngreso').value;

    const errores = [];

    if (!nombre) {
        errores.push('- Nombre');
    }

    if (!direccion1) {
        errores.push('- Dirección');
    }

    if (!telefono) {
        errores.push('- Teléfono');
    } else if (telefono.length < 10) {
        errores.push('- Teléfono (debe tener 10 dígitos)');
    }

    if (!rfc) {
        errores.push('- RFC');
    } else if (rfc.length !== 13) {
        errores.push('- RFC (debe tener 13 caracteres)');
    }

    if (!fechaIngreso) {
        errores.push('- Fecha de Ingreso');
    }

    if (errores.length > 0) {
        await mostrarAlerta('Por favor complete los siguientes campos obligatorios:\n\n' + errores.join('\n'));
        return false;
    }

    return true;
}

// Guardar maestro
async function guardarMaestro() {
    if (!supabase) {
        alert('Error: Base de datos no conectada');
        return;
    }

    // Validar campos obligatorios
    if (!validarCampos()) {
        return;
    }

    const maestroData = {
        nombre: document.getElementById('nombre').value.trim().toUpperCase(),
        direccion: document.getElementById('direccion1').value.trim() +
            (document.getElementById('direccion2').value.trim() ?
                '\n' + document.getElementById('direccion2').value.trim() : ''),
        telefono: document.getElementById('telefono').value.trim(),
        celular: document.getElementById('celular').value.trim(),
        email: document.getElementById('email').value.trim().toLowerCase(),
        grado: document.getElementById('grado').value.trim(),
        detalles_grado: document.getElementById('detallesGrado').value.trim().toUpperCase(),
        fecha_ingreso: document.getElementById('fechaIngreso').value,
        observaciones: document.getElementById('observaciones').value.trim(),
        status: 'activo'
    };

    // Generar clave si no existe
    const claveInput = document.getElementById('clave');
    if (claveInput && claveInput.value) {
        maestroData.clave = claveInput.value.toUpperCase();
    }

    // Agregar RFC si está presente
    const rfcInput = document.getElementById('rfc');
    if (rfcInput && rfcInput.value) {
        maestroData.rfc = rfcInput.value.toUpperCase();
    }

    try {
        console.log('Guardando maestro:', maestroData);

        const { data, error } = await supabase
            .from('maestros')
            .insert([maestroData])
            .select();

        if (error) throw error;

        await mostrarAlerta(`Maestro dado de alta correctamente\n\nNombre: ${maestroData.nombre}\nClave: ${maestroData.clave || 'N/A'}\nFecha de Ingreso: ${maestroData.fecha_ingreso}`);

        // Preguntar si desea dar de alta otro maestro
        if (await mostrarConfirm('¿Desea dar de alta otro maestro?')) {
            limpiarFormulario();
        } else {
            window.location.href = 'maestros.html';
        }
    } catch (error) {
        console.error('Error guardando maestro:', error);
        await mostrarAlerta('Error al guardar el maestro: ' + error.message);
    }
}

// Limpiar formulario
function limpiarFormulario() {
    document.getElementById('nombre').value = '';
    document.getElementById('clave').value = '';
    document.getElementById('direccion1').value = '';
    document.getElementById('direccion2').value = '';
    document.getElementById('telefono').value = '';
    document.getElementById('celular').value = '';
    document.getElementById('email').value = '';
    document.getElementById('rfc').value = '';
    document.getElementById('grado').value = '';
    document.getElementById('detallesGrado').value = '';
    document.getElementById('observaciones').value = '';

    // Restablecer fecha de ingreso a hoy
    const fechaIngresoInput = document.getElementById('fechaIngreso');
    if (fechaIngresoInput) {
        const hoy = new Date();
        fechaIngresoInput.value = hoy.toISOString().split('T')[0];
    }

    // Enfocar en el campo nombre
    const nombreInput = document.getElementById('nombre');
    if (nombreInput) {
        nombreInput.focus();
    }
}

// Cancelar alta
async function cancelarAlta() {
    if (await mostrarConfirm('¿Está seguro de cancelar el alta del maestro?\n\nSe perderán todos los datos ingresados.')) {
        window.location.href = 'maestros.html';
    }
}

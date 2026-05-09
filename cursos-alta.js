// Inicializar Supabase
let supabase = null;
let cursosExistentes = [];

// Esperar a que se cargue la librería de Supabase
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM cargado, inicializando alta de cursos...');

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

    // Cargar cursos existentes para el dropdown
    if (supabase) {
        await cargarCursosExistentes();
        await cargarTiposExamenParaCurso();
    }

    // Event listener para generar clave automáticamente
    const cursoInput = document.getElementById('curso');
    if (cursoInput) {
        cursoInput.addEventListener('input', generarClave);
    }

    console.log('Inicialización de alta de cursos completa');
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

// Cargar cursos existentes para el dropdown
async function cargarCursosExistentes() {
    if (!supabase) return;

    try {
        const { data, error } = await supabase
            .from('cursos')
            .select('id, curso')
            .order('curso', { ascending: true });

        if (error) throw error;

        cursosExistentes = data || [];

        const select = document.getElementById('cursoSiguiente');
        if (select) {
            select.innerHTML = '<option value="">-- Ninguno (Fin de cadena) --</option>';
            cursosExistentes.forEach(curso => {
                const option = document.createElement('option');
                option.value = curso.id;
                option.textContent = curso.curso;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error cargando cursos:', error);
    }
}

// Cargar tipos de examen para el select del curso
async function cargarTiposExamenParaCurso() {
    if (!supabase) return;
    try {
        const { data, error } = await supabase
            .from('tipos_examen')
            .select('id, descripcion')
            .order('descripcion');
        if (error) throw error;
        const select = document.getElementById('tipoExamenCurso');
        if (select && data) {
            select.innerHTML = '<option value="">(Ninguno / General)</option>';
            data.forEach(t => {
                const opt = document.createElement('option');
                opt.value = t.descripcion; // Usamos descripcion como valor para coincidir con el filtro
                opt.textContent = t.descripcion;
                select.appendChild(opt);
            });
        }
    } catch (error) {
        console.error('Error cargando tipos de examen:', error);
    }
}

// Generar clave automáticamente basada en el nombre del curso
function generarClave() {
    const cursoInput = document.getElementById('curso');
    const claveInput = document.getElementById('clave');

    if (!cursoInput || !claveInput) return;

    const nombreCurso = cursoInput.value.trim().toUpperCase();

    if (!nombreCurso) {
        claveInput.value = '';
        return;
    }

    // Dividir el nombre en palabras
    const palabras = nombreCurso.split(' ').filter(p => p.length > 0);

    let clave = '';

    // Verificar si la última palabra es un número
    const ultimaPalabra = palabras[palabras.length - 1];
    const esNumero = !isNaN(ultimaPalabra);

    if (esNumero && palabras.length > 1) {
        // Ejemplo: "Piano Infantil 1" -> "P1"
        // Tomar primera letra de la primera palabra + número
        clave = palabras[0].charAt(0) + ultimaPalabra;
    } else if (palabras.length === 1) {
        // Una sola palabra: tomar las primeras 2 letras
        // Ejemplo: "BALLET" -> "BA"
        clave = nombreCurso.substring(0, 2);
    } else {
        // Dos o más palabras sin número: tomar iniciales
        // Ejemplo: "Bajo Electrico" -> "BE"
        clave = palabras[0].charAt(0) + palabras[1].charAt(0);
    }

    // Buscar si ya existe esta categoría (clave) en cursos existentes
    const cursoConMismaClave = cursosExistentes.find(c => {
        const palabrasCurso = c.curso.toUpperCase().split(' ');
        const primeraPalabra = palabrasCurso[0];
        return primeraPalabra === palabras[0];
    });

    if (cursoConMismaClave) {
        // Si existe un curso con la misma primera palabra, usar su clave
        // Esto asegura que "Bajo Electrico 1", "Bajo Electrico 2", etc. tengan la misma clave "BE"
        const palabrasCursoExistente = cursoConMismaClave.curso.toUpperCase().split(' ');
        if (palabrasCursoExistente.length >= 2) {
            clave = palabrasCursoExistente[0].charAt(0) + palabrasCursoExistente[1].charAt(0);
        }
    }

    claveInput.value = clave;
}

// Validar campos obligatorios
function validarCampos() {
    const curso = document.getElementById('curso').value.trim();
    const costo = document.getElementById('costo').value;
    const iva = document.getElementById('iva').value;

    const errores = [];

    if (!curso) {
        errores.push('- Curso');
    }

    if (!costo || parseFloat(costo) <= 0) {
        errores.push('- Costo (debe ser mayor a 0)');
    }

    if (!iva || parseFloat(iva) < 0) {
        errores.push('- IVA (debe ser 0 o mayor)');
    }

    if (errores.length > 0) {
        await mostrarAlerta('Por favor complete los siguientes campos obligatorios:\n\n' + errores.join('\n'));
        return false;
    }

    return true;
}

// Guardar curso
async function guardarCurso() {
    if (!supabase) {
        alert('Error: Base de datos no conectada');
        return;
    }

    // Validar campos obligatorios
    if (!validarCampos()) {
        return;
    }

    const cursoData = {
        curso: document.getElementById('curso').value.trim().toUpperCase(),
        precio_mensual: parseFloat(document.getElementById('costo').value),
        precio_inscripcion: parseFloat(document.getElementById('recargo').value) || 0,
        grado: document.getElementById('grado').value.trim(),
        descripcion: document.getElementById('descripcion').value.trim(),
        activo: true
    };

    // Agregar clave si existe
    const claveInput = document.getElementById('clave');
    if (claveInput && claveInput.value) {
        cursoData.clave = claveInput.value.toUpperCase();
    }

    // Agregar tipo de examen si está seleccionado
    const tipoExamenSelect = document.getElementById('tipoExamenCurso');
    if (tipoExamenSelect && tipoExamenSelect.value) {
        cursoData.tipo_examen = tipoExamenSelect.value;
    }

    // Agregar curso siguiente si está seleccionado
    const cursoSiguienteSelect = document.getElementById('cursoSiguiente');
    if (cursoSiguienteSelect && cursoSiguienteSelect.value) {
        cursoData.curso_siguiente_id = cursoSiguienteSelect.value;
    }

    try {
        console.log('Guardando curso:', cursoData);

        const { data, error } = await supabase
            .from('cursos')
            .insert([cursoData])
            .select();

        if (error) throw error;

        await mostrarAlerta(`Curso dado de alta correctamente\n\nNombre: ${cursoData.curso}\nClave: ${cursoData.clave || 'N/A'}\nCosto: $${cursoData.precio_mensual.toFixed(2)}`);

        // Preguntar si desea dar de alta otro curso
        if (await mostrarConfirm('¿Desea dar de alta otro curso?')) {
            limpiarFormulario();
            await cargarCursosExistentes(); // Recargar lista de cursos
        } else {
            window.location.href = 'cursos.html';
        }
    } catch (error) {
        console.error('Error guardando curso:', error);
        await mostrarAlerta('Error al guardar el curso: ' + error.message);
    }
}

// Limpiar formulario
function limpiarFormulario() {
    document.getElementById('curso').value = '';
    document.getElementById('clave').value = '';
    document.getElementById('costo').value = '';
    document.getElementById('iva').value = '0.16';
    document.getElementById('recargo').value = '0.00';
    document.getElementById('grado').value = '';
    document.getElementById('cursoSiguiente').value = '';
    document.getElementById('descripcion').value = '';

    // Enfocar en el campo curso
    const cursoInput = document.getElementById('curso');
    if (cursoInput) {
        cursoInput.focus();
    }
}

// Cancelar alta
async function cancelarAlta() {
    if (await mostrarConfirm('¿Está seguro de cancelar el alta del curso?\n\nSe perderán todos los datos ingresados.')) {
        window.location.href = 'cursos.html';
    }
}

// Inicializar Supabase
let supabase = null;
let gruposArticulos = [];

// Esperar a que se cargue la librería de Supabase
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM cargado, inicializando alta de artículos...');

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

    // Cargar grupos de artículos para el dropdown
    if (supabase) await cargarGruposArticulos();

    // Enfocar en el campo clave
    document.getElementById('clave').focus();

    console.log('Inicialización de alta de artículos completa');
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

// Cargar grupos de artículos desde Supabase
async function cargarGruposArticulos() {
    if (!supabase) return;

    try {
        const { data, error } = await supabase
            .from('grupos_articulos')
            .select('id, nombre')
            .order('nombre', { ascending: true });

        if (error) throw error;

        gruposArticulos = data || [];
        console.log(`✓ ${gruposArticulos.length} grupos de artículos cargados`);

        // Llenar el dropdown
        const select = document.getElementById('grupo');
        select.innerHTML = '<option value="">-- Seleccione un grupo --</option>';

        gruposArticulos.forEach(grupo => {
            const option = document.createElement('option');
            option.value = grupo.id;
            option.textContent = grupo.nombre;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error cargando grupos de artículos:', error);
        alert('Error al cargar grupos de artículos: ' + error.message);
    }
}

// Validar campos obligatorios
function validarCampos() {
    const clave = document.getElementById('clave').value.trim();
    const descripcion = document.getElementById('descripcion').value.trim();
    const grupo = document.getElementById('grupo').value;
    const precio = document.getElementById('precio').value;

    const errores = [];

    if (!clave) {
        errores.push('- Clave');
    }

    if (!descripcion) {
        errores.push('- Descripción');
    }

    if (!grupo) {
        errores.push('- Grupo');
    }

    if (!precio || parseFloat(precio) < 0) {
        errores.push('- Precio (debe ser 0 o mayor)');
    }

    if (errores.length > 0) {
        alert('Por favor complete los siguientes campos obligatorios:\n\n' + errores.join('\n'));
        return false;
    }

    return true;
}

// Verificar si la clave ya existe
async function verificarClaveExistente(clave) {
    if (!supabase) return false;

    try {
        const { data, error } = await supabase
            .from('articulos')
            .select('clave')
            .eq('clave', clave.toUpperCase())
            .single();

        if (error && error.code !== 'PGRST116') {
            // PGRST116 = No rows found (esto es lo que queremos)
            throw error;
        }

        return data !== null;
    } catch (error) {
        console.error('Error verificando clave:', error);
        return false;
    }
}

// Guardar artículo
async function guardarArticulo() {
    if (!supabase) {
        alert('Error: Base de datos no conectada');
        return;
    }

    // Validar campos obligatorios
    if (!validarCampos()) {
        return;
    }

    const clave = document.getElementById('clave').value.trim().toUpperCase();

    // Verificar si la clave ya existe
    const claveExiste = await verificarClaveExistente(clave);
    if (claveExiste) {
        alert(`Error: La clave "${clave}" ya existe.\n\nPor favor use una clave diferente.`);
        document.getElementById('clave').focus();
        return;
    }

    const articuloData = {
        clave: clave,
        descripcion: document.getElementById('descripcion').value.trim().toUpperCase(),
        grupo_articulo_id: document.getElementById('grupo').value,
        precio: parseFloat(document.getElementById('precio').value),
        existencia: parseInt(document.getElementById('stock').value) || 0,
        minimo: parseInt(document.getElementById('stockMinimo').value) || 0,
        activo: true
    };

    try {
        console.log('Guardando artículo:', articuloData);

        const { data, error } = await supabase
            .from('articulos')
            .insert([articuloData])
            .select();

        if (error) throw error;

        // Obtener el nombre del grupo para mostrarlo
        const grupoSeleccionado = gruposArticulos.find(g => g.id === articuloData.grupo_articulo_id);
        const nombreGrupo = grupoSeleccionado ? grupoSeleccionado.nombre : 'N/A';

        await mostrarAlerta(`Artículo dado de alta correctamente\n\nClave: ${articuloData.clave}\nDescripción: ${articuloData.descripcion}\nGrupo: ${nombreGrupo}\nPrecio: $${articuloData.precio.toFixed(2)}\nStock: ${articuloData.existencia}`);

        // Preguntar si desea dar de alta otro artículo
        if (await mostrarConfirm('¿Desea dar de alta otro artículo?')) {
            limpiarFormulario();
        } else {
            window.location.href = 'articulos.html';
        }
    } catch (error) {
        console.error('Error guardando artículo:', error);
        await mostrarAlerta('Error al guardar el artículo: ' + error.message);
    }
}

// Limpiar formulario
function limpiarFormulario() {
    document.getElementById('clave').value = '';
    document.getElementById('descripcion').value = '';
    document.getElementById('grupo').value = '';
    document.getElementById('precio').value = '';
    document.getElementById('stock').value = '0';
    document.getElementById('stockMinimo').value = '0';

    // Enfocar en el campo clave
    const claveInput = document.getElementById('clave');
    if (claveInput) {
        claveInput.focus();
    }
}

// Cancelar alta
async function cancelarAlta() {
    if (await mostrarConfirm('¿Está seguro de cancelar el alta del artículo?\n\nSe perderán todos los datos ingresados.')) {
        window.location.href = 'articulos.html';
    }
}

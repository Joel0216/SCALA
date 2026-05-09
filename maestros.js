// Módulo de Maestros
var db = null; // Changed to var to be accessible via window.opener
let maestros = [];
let maestroSeleccionado = null;
let modoNuevo = false;

// Variables para paginación en búsqueda
let g_paginaActualMaestros = 1;
let g_totalPaginasMaestros = 1;
let g_totalResultadosMaestros = 0;
let g_terminoBusquedaMaestros = '';
let g_resultadosBusquedaMaestros = [];

// Inicializar
document.addEventListener('DOMContentLoaded', async () => {
    console.log('=== INICIALIZANDO MÓDULO MAESTROS ===');

    try {
        if (typeof waitForSupabase === 'function') {
            db = await waitForSupabase();
        } else {
            db = window.supabaseClient || window.supabase || (typeof getSupabase === 'function' ? getSupabase() : null);
        }

        // EXPOSE DB TO WINDOW for child windows (like maestros-lista)
        window.db = db;

        if (db) {
            console.log('✓ Supabase disponible en maestros');
            await cargarMaestros();
        } else {
            console.error('❌ Supabase NO disponible');
        }
    } catch (err) {
        console.error('Error durante la inicialización:', err);
    }

    actualizarFechaHora();
    setInterval(actualizarFechaHora, 1000);

    // Configurar validación de teléfono (solo números)
    configurarValidacionTelefono();

    // Configurar generación automática de clave (Nuevo)
    const nombreInput = document.getElementById('nombre');
    if (nombreInput) {
        nombreInput.addEventListener('input', () => {
            const nombre = nombreInput.value;
            const clave = calcularClaveUnica(nombre);
            document.getElementById('clave').value = clave;
        });
    }

    // Configurar generación automática de clave (Editar)
    const editNombreInput = document.getElementById('editNombre');
    if (editNombreInput) {
        editNombreInput.addEventListener('input', () => {
            const nombre = editNombreInput.value;
            // Excluir el maestro actual de la validación de duplicados
            const excludeId = maestroSeleccionado ? maestroSeleccionado.id : null;
            const clave = calcularClaveUnica(nombre, excludeId);
            document.getElementById('editClave').value = clave;
        });
    }

    // Deshabilitar campos al inicio
    deshabilitarCampos();

    if (typeof habilitarInputs === 'function') habilitarInputs();
});

// Función pura para calcular clave única
function calcularClaveUnica(nombre, excludeId = null) {
    nombre = nombre.trim().toUpperCase();
    if (!nombre) return '';

    // Dividir el nombre en palabras
    const palabras = nombre.split(' ').filter(p => p.length > 0);
    let claveBase = '';

    if (palabras.length === 1) {
        claveBase = palabras[0].substring(0, 2);
    } else if (palabras.length === 2) {
        claveBase = palabras[0].charAt(0) + palabras[1].charAt(0);
    } else if (palabras.length === 3) {
        claveBase = palabras[0].charAt(0) + palabras[1].charAt(0);
    } else if (palabras.length >= 4) {
        claveBase = palabras[0].charAt(0) + palabras[palabras.length - 2].charAt(0);
    }

    // Filtrar lista para excluir el actual (si estamos editando)
    const listaVerificacion = excludeId
        ? maestros.filter(m => m.id !== excludeId)
        : maestros;

    // Buscar claves duplicadas
    const clavesExistentes = listaVerificacion
        .map(m => m.clave);

    let claveUnica = claveBase;
    let contador = 0;

    if (clavesExistentes.includes(claveBase)) {
        // ... (misma lógica de desempate) ...
        if (palabras.length >= 4) {
            claveUnica = palabras[0].charAt(0) + palabras[1].charAt(0) + palabras[palabras.length - 2].charAt(0);
        } else if (palabras.length === 3) {
            claveUnica = palabras[0].charAt(0) + palabras[1].charAt(0) + palabras[2].charAt(0);
        } else {
            contador = 1;
            while (clavesExistentes.includes(claveUnica + contador)) {
                contador++;
            }
            if (contador > 0) claveUnica = claveBase + contador;
        }

        // Re-verificar
        if (clavesExistentes.includes(claveUnica)) {
            contador = 1;
            while (clavesExistentes.includes(claveUnica + contador)) {
                contador++;
            }
            claveUnica = claveUnica + contador;
        }
    }

    return claveUnica;
}

// (Removiendo la antigua generarClaveAutomatica ya que la reemplazamos con la nueva lógica)
// ...

// Cargar maestros desde la base de datos
async function cargarMaestros() {
    if (!db) return;

    try {
        const { data, error } = await db
            .from('maestros')
            .select('*')
            .order('nombre');

        if (error) {
            console.error('Error cargando maestros:', error);
        } else {
            maestros = data || [];
            console.log(`✓ ${maestros.length} maestros cargados`);
        }
    } catch (e) {
        console.error('Error:', e);
    }
}

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

    const datetime = document.getElementById('datetime');
    if (datetime) {
        datetime.textContent = `${dia}/${mes}/${anio} ${String(horas).padStart(2, '0')}:${minutos}:${segundos} ${ampm}`;
    }
}

// Configurar validación de teléfono (solo números)
function configurarValidacionTelefono() {
    const telefonoInput = document.getElementById('telefono');
    if (telefonoInput) {
        telefonoInput.addEventListener('input', function (e) {
            // Remover todo lo que no sea número
            this.value = this.value.replace(/[^0-9]/g, '');
        });

        telefonoInput.addEventListener('keypress', function (e) {
            // Solo permitir números
            if (!/[0-9]/.test(e.key)) {
                e.preventDefault();
            }
        });
    }

    // También para el campo de edición
    const editTelefonoInput = document.getElementById('editTelefono');
    if (editTelefonoInput) {
        editTelefonoInput.addEventListener('input', function (e) {
            this.value = this.value.replace(/[^0-9]/g, '');
        });

        editTelefonoInput.addEventListener('keypress', function (e) {
            if (!/[0-9]/.test(e.key)) {
                e.preventDefault();
            }
        });
    }
}

// (Función generarClaveAutomatica antigua eliminada)

// Deshabilitar campos del formulario
function deshabilitarCampos() {
    const campos = ['nombre', 'direccion1', 'telefono', 'email', 'rfc', 'formaPago'];
    campos.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = true;
    });
}

// Habilitar campos del formulario
function habilitarCamposFormulario() {
    const campos = ['nombre', 'direccion1', 'telefono', 'email', 'rfc', 'formaPago'];
    campos.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = false;
    });
}

// Limpiar formulario
function limpiarFormulario() {
    ['nombre', 'direccion1', 'telefono', 'clave', 'email', 'rfc', 'fechaIngreso'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    
    // Reset select to default
    const formaPago = document.getElementById('formaPago');
    if (formaPago) formaPago.value = 'POR ALUMNO';

    maestroSeleccionado = null;
    modoNuevo = false;

    // Deshabilitar botones de editar y borrar
    document.getElementById('btnEditar').disabled = true;
    document.getElementById('btnBorrar').disabled = true;
}

// Cargar datos de un maestro en el formulario
function cargarDatosMaestro(maestro) {
    maestroSeleccionado = maestro;
    modoNuevo = false;

    document.getElementById('nombre').value = maestro.nombre || '';
    document.getElementById('telefono').value = maestro.telefono || '';
    document.getElementById('clave').value = maestro.clave || '';
    document.getElementById('email').value = maestro.email || '';
    document.getElementById('rfc').value = maestro.rfc || '';
    document.getElementById('direccion1').value = maestro.direccion_1 || maestro.direccion || '';
    
    const formaPago = document.getElementById('formaPago');
    if (formaPago) formaPago.value = maestro.forma_pago || 'POR ALUMNO';

    // Fecha de ingreso
    const fi = maestro.fecha_ingreso || '';
    if (fi) {
        const d = new Date(fi + 'T00:00:00');
        const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        document.getElementById('fechaIngreso').value =
            String(d.getDate()).padStart(2, '0') + '-' + meses[d.getMonth()] + '-' + d.getFullYear();
    } else {
        document.getElementById('fechaIngreso').value = '';
    }

    // Deshabilitar campos (solo lectura)
    deshabilitarCampos();

    // Habilitar botones de editar y borrar
    document.getElementById('btnEditar').disabled = false;
    document.getElementById('btnBorrar').disabled = false;
}

// ==================== BOTÓN NUEVO ====================
async function nuevoMaestro() {
    limpiarFormulario();
    modoNuevo = true;

    // Habilitar campos para edición
    habilitarCamposFormulario();

    // Establecer fecha de ingreso automáticamente
    const ahora = new Date();
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    document.getElementById('fechaIngreso').value =
        `${String(ahora.getDate()).padStart(2, '0')}-${meses[ahora.getMonth()]}-${ahora.getFullYear()}`;

    // Enfocar en el campo nombre
    document.getElementById('nombre').focus();

    // Cambiar el botón Nuevo a Guardar
    const btnNuevo = document.getElementById('btnNuevo');
    btnNuevo.textContent = 'Guardar';
    btnNuevo.onclick = guardarNuevoMaestro;

    // Mostrar botón Cancelar
    document.getElementById('btnCancelarNuevo').style.display = 'inline-block';

    // Deshabilitar botones de editar, borrar y buscar
    document.getElementById('btnEditar').disabled = true;
    document.getElementById('btnBorrar').disabled = true;
    document.getElementById('btnBuscar').disabled = true;
}

// Cancelar nuevo maestro
function cancelarNuevo() {
    // Restaurar botón Nuevo
    const btnNuevo = document.getElementById('btnNuevo');
    btnNuevo.textContent = 'Nuevo';
    btnNuevo.onclick = nuevoMaestro;

    // Ocultar botón Cancelar
    document.getElementById('btnCancelarNuevo').style.display = 'none';

    // Limpiar y deshabilitar campos
    limpiarFormulario();
    deshabilitarCampos();

    // Habilitar botón buscar
    document.getElementById('btnBuscar').disabled = false;

    modoNuevo = false;
}

// Guardar nuevo maestro
async function guardarNuevoMaestro() {
    if (!db) {
        await mostrarAlerta('Error: Base de datos no conectada');
        return;
    }

    // Validar campos obligatorios
    const nombre = document.getElementById('nombre').value.trim();
    const direccion1 = document.getElementById('direccion1').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const clave = document.getElementById('clave').value.trim();

    const errores = [];
    if (!nombre) errores.push('- Nombre');
    if (!direccion1) errores.push('- Dirección');
    if (!telefono) errores.push('- Teléfono');
    if (!clave) errores.push('- Clave');

    if (errores.length > 0) {
        await mostrarAlerta('Por favor complete los campos obligatorios:\n\n' + errores.join('\n'));
        return;
    }

    // Fecha ISO
    const fechaHoy = new Date().toISOString().split('T')[0];

    // Preparar datos — solo columnas que existen en la tabla
    const datos = {
        nombre: nombre.toUpperCase(),
        direccion_1: direccion1.toUpperCase(),
        telefono: telefono,
        clave: clave.toUpperCase(),
        email: document.getElementById('email').value.trim().toLowerCase() || null,
        rfc: document.getElementById('rfc').value.trim().toUpperCase() || null,
        fecha_ingreso: fechaHoy,
        forma_pago: document.getElementById('formaPago').value,
        activo: true
    };

    try {
        const { data, error } = await db.from('maestros').insert([datos]).select();

        if (error) throw error;

        await mostrarAlerta(`Maestro guardado correctamente\n\nNombre: ${datos.nombre}\nClave: ${datos.clave}`);

        // Recargar maestros
        await cargarMaestros();

        // Restaurar botón Nuevo
        const btnNuevo = document.getElementById('btnNuevo');
        btnNuevo.textContent = 'Nuevo';
        btnNuevo.onclick = nuevoMaestro;

        document.getElementById('btnCancelarNuevo').style.display = 'none';
        document.getElementById('btnBuscar').disabled = false;

        limpiarFormulario();
        deshabilitarCampos();

    } catch (error) {
        console.error("Error saving:", error);
        if (error.message.includes('duplicate key') || error.code === '23505') {
            await mostrarAlerta(`Error: La CLAVE "${datos.clave}" ya existe.\n\nPor favor, escriba una clave diferente o modifique el nombre.`);
        } else {
            await mostrarAlerta('Error al guardar: ' + error.message);
        }
    }
}

// ==================== BOTÓN EDITAR ====================
function editarMaestro() {
    if (!maestroSeleccionado) {
        mostrarAlerta('Primero busque y seleccione un maestro');
        return;
    }

    document.getElementById('editNombre').value = maestroSeleccionado.nombre || '';
    document.getElementById('editClave').value = maestroSeleccionado.clave || '';
    document.getElementById('editFechaIngreso').value = maestroSeleccionado.fecha_ingreso || '';
    document.getElementById('editTelefono').value = maestroSeleccionado.telefono || '';
    document.getElementById('editEmail').value = maestroSeleccionado.email || '';
    document.getElementById('editRfc').value = maestroSeleccionado.rfc || '';
    document.getElementById('editDireccion1').value = maestroSeleccionado.direccion_1 || maestroSeleccionado.direccion || '';
    document.getElementById('editDireccion2').value = maestroSeleccionado.direccion_2 || '';
    
    const editFormaPago = document.getElementById('editFormaPago');
    if (editFormaPago) editFormaPago.value = maestroSeleccionado.forma_pago || 'POR ALUMNO';

    // Activo checkbox
    const chkActivo = document.getElementById('editActivo');
    if (chkActivo) chkActivo.checked = maestroSeleccionado.activo !== false;

    document.getElementById('modalEdicion').style.display = 'block';
    document.getElementById('editNombre').focus();
}

// Cancelar edición
function cancelarEdicion() {
    document.getElementById('modalEdicion').style.display = 'none';
}

// Guardar edición
async function guardarEdicion() {
    if (!db || !maestroSeleccionado) {
        await mostrarAlerta('Error: No hay maestro seleccionado');
        return;
    }

    const nombre = document.getElementById('editNombre').value.trim();
    const direccion1 = document.getElementById('editDireccion1').value.trim();
    const telefono = document.getElementById('editTelefono').value.trim();
    const rfc = document.getElementById('editRfc').value.trim();
    const chkActivo = document.getElementById('editActivo');
    const activo = chkActivo ? chkActivo.checked : (maestroSeleccionado.activo !== false);

    if (!nombre || !direccion1 || !telefono) {
        await mostrarAlerta('Nombre, Dirección y Teléfono son obligatorios');
        return;
    }

    const datos = {
        nombre: nombre.toUpperCase(),
        direccion_1: direccion1.toUpperCase(),
        telefono: telefono,
        clave: document.getElementById('editClave').value.trim().toUpperCase(),
        email: document.getElementById('editEmail').value.trim().toLowerCase() || null,
        rfc: rfc.toUpperCase() || null,
        forma_pago: document.getElementById('editFormaPago').value,
        activo: activo
    };

    try {
        const { error } = await db.from('maestros').update(datos).eq('id', maestroSeleccionado.id);

        if (error) throw error;

        document.getElementById('modalEdicion').style.display = 'none';
        await mostrarAlerta('Maestro actualizado correctamente');

        await cargarMaestros();
        maestroSeleccionado = { ...maestroSeleccionado, ...datos };
        cargarDatosMaestro(maestroSeleccionado);

    } catch (error) {
        if (error.message.includes('duplicate key') || error.code === '23505') {
            await mostrarAlerta(`Error: La CLAVE "${datos.clave}" ya existe.`);
        } else {
            await mostrarAlerta('Error al actualizar: ' + error.message);
        }
    }
}

// ==================== BOTÓN BUSCAR ====================
function buscarMaestro() {
    // Si está en modo nuevo, cancelar primero
    if (modoNuevo) {
        cancelarNuevo();
    }
    window.open('maestros-lista.html', 'MaestrosLista', 'width=1000,height=700');
}

// Funciones de modales antiguos eliminadas (cerrarModalBusqueda, aceptarBusqueda, mostrarResultadosBusqueda, cerrarModalResultados)

// ==================== BOTÓN BORRAR ====================
async function borrarMaestro() {
    if (!maestroSeleccionado) {
        await mostrarAlerta('Primero busque y seleccione un maestro para borrar');
        return;
    }

    // Mostrar modal de confirmación
    document.getElementById('mensajeBorrar').textContent =
        `¿Está seguro de que desea borrar al maestro "${maestroSeleccionado.nombre}"?`;
    document.getElementById('razonBorrado').value = ''; // field is present but maybe not needed for hard delete, kept for consistency
    document.getElementById('modalBorrar').style.display = 'block';
    // Hide 'razonBorrado' input if hard delete doesn't need a reason? 
    // User didn't ask to remove the input, just to delete from DB. 
    // We can ignore the reason or log it elsewhere if we had a log table, 
    // but for now we just HARD DELETE.
    document.getElementById('razonBorrado').focus();
}

function cancelarBorrado() {
    document.getElementById('modalBorrar').style.display = 'none';
}

async function confirmarBorrado() {
    // Razon input is still there, we can check it or ignore it. 
    // User wants hard delete.

    if (!db || !maestroSeleccionado) {
        await mostrarAlerta('Error: No hay maestro seleccionado');
        return;
    }

    try {
        // Hard Delete as requested by user ("se borre en la base de datos")
        // This frees up the 'clave' so it can be reused.
        const { error } = await db.from('maestros')
            .delete()
            .eq('id', maestroSeleccionado.id);

        if (error) throw error;

        // CERRAR MODAL ANTES DE MOSTRAR ALERTA
        document.getElementById('modalBorrar').style.display = 'none';

        await mostrarAlerta('Maestro eliminado permanentemente');

        // Recargar maestros
        await cargarMaestros();

        // Limpiar formulario se visualiza vacio
        limpiarFormulario();
        deshabilitarCampos();

    } catch (error) {
        // En caso de error, cerramos modal también
        document.getElementById('modalBorrar').style.display = 'none';
        await mostrarAlerta('Error al eliminar: ' + error.message);
    }
}

// ==================== BOTÓN TERMINAR ====================
function terminar() {
    window.location.href = 'archivos.html';
}

// Cerrar modales al hacer clic fuera
window.onclick = function (event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
};

// ==================== FUNCIONES DE BÚSQUEDA ====================
function cerrarModalBusquedaMaestro() {
    document.getElementById('modalBusquedaMaestro').style.display = 'none';
}

function cerrarModalResultadosMaestro() {
    document.getElementById('modalResultadosMaestro').style.display = 'none';
}

async function ejecutarBusquedaMaestro() {
    const termino = document.getElementById('inputBusquedaMaestro').value.trim().toUpperCase();

    if (!termino) {
        await mostrarAlerta('Ingrese un nombre para buscar');
        return;
    }

    cerrarModalBusquedaMaestro();

    g_terminoBusquedaMaestros = termino;
    g_paginaActualMaestros = 1;

    await cargarResultadosBusquedaMaestro();
}

async function cargarResultadosBusquedaMaestro() {
    const termino = g_terminoBusquedaMaestros;
    const pagina = g_paginaActualMaestros;
    const limite = 100;
    const desde = (pagina - 1) * limite;

    // Mostrar modal de resultados con mensaje de carga
    const tbody = document.getElementById('bodyResultadosMaestro');
    tbody.innerHTML = '<tr><td colspan="2" style="text-align:center;">Buscando...</td></tr>';
    document.getElementById('tituloResultadosMaestro').textContent = "Resultados de Búsqueda";
    document.getElementById('modalResultadosMaestro').style.display = 'block';

    if (!db) {
        tbody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:red;">Error: No hay conexión a la base de datos</td></tr>';
        return;
    }

    try {
        // Obtener total de resultados
        const countResult = await db.from('maestros')
            .select('*', { count: 'exact', head: true })
            .ilike('nombre', `%${termino}%`);

        if (countResult.error) throw countResult.error;

        g_totalResultadosMaestros = countResult.count || 0;
        g_totalPaginasMaestros = Math.ceil(g_totalResultadosMaestros / limite);

        // Obtener datos paginados
        const result = await db.from('maestros')
            .select('*')
            .ilike('nombre', `%${termino}%`)
            .order('nombre')
            .range(desde, desde + limite - 1);

        if (result.error) {
            tbody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:red;">Error: ' + result.error.message + '</td></tr>';
            return;
        }

        if (!result.data || result.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="2" style="text-align:center;">No se encontraron maestros registrados.</td></tr>';
            actualizarControlesPaginacionMaestros();
            return;
        }

        mostrarResultadosMaestro(result.data, termino);
        actualizarControlesPaginacionMaestros();
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:red;">Error: ' + e.message + '</td></tr>';
    }
}

function mostrarResultadosMaestro(resultados, termino) {
    const tbody = document.getElementById('bodyResultadosMaestro');
    tbody.innerHTML = '';

    document.getElementById('tituloResultadosMaestro').textContent = "Resultados de Búsqueda ('" + termino + "')";

    window._resultadosBusquedaMaestro = resultados;

    resultados.forEach((maestro, i) => {
        const tr = document.createElement('tr');
        tr.style.cursor = 'pointer';
        tr.onclick = () => {
            cerrarModalResultadosMaestro();
            mostrarMaestro(maestro);
        };
        tr.innerHTML = `
            <td>${maestro.nombre || ''}</td>
            <td>${maestro.especialidad || ''}</td>
        `;
        tbody.appendChild(tr);
    });
}

function actualizarControlesPaginacionMaestros() {
    const controles = document.getElementById('paginacionControlesMaestros');
    const info = document.getElementById('infoPaginaMaestros');

    if (g_totalPaginasMaestros <= 1) {
        controles.style.display = 'none';
        return;
    }

    controles.style.display = 'flex';
    info.textContent = `Página ${g_paginaActualMaestros} de ${g_totalPaginasMaestros}`;

    // Habilitar/deshabilitar botones
    document.querySelector('button[onclick="irPrimeraPaginaMaestros()"]').disabled = g_paginaActualMaestros === 1;
    document.querySelector('button[onclick="irPaginaAnteriorMaestros()"]').disabled = g_paginaActualMaestros === 1;
    document.querySelector('button[onclick="irPaginaSiguienteMaestros()"]').disabled = g_paginaActualMaestros === g_totalPaginasMaestros;
    document.querySelector('button[onclick="irUltimaPaginaMaestros()"]').disabled = g_paginaActualMaestros === g_totalPaginasMaestros;
}

function irPrimeraPaginaMaestros() {
    if (g_paginaActualMaestros > 1) {
        g_paginaActualMaestros = 1;
        cargarResultadosBusquedaMaestro();
    }
}

function irPaginaAnteriorMaestros() {
    if (g_paginaActualMaestros > 1) {
        g_paginaActualMaestros--;
        cargarResultadosBusquedaMaestro();
    }
}

function irPaginaSiguienteMaestros() {
    if (g_paginaActualMaestros < g_totalPaginasMaestros) {
        g_paginaActualMaestros++;
        cargarResultadosBusquedaMaestro();
    }
}

function irUltimaPaginaMaestros() {
    if (g_paginaActualMaestros < g_totalPaginasMaestros) {
        g_paginaActualMaestros = g_totalPaginasMaestros;
        cargarResultadosBusquedaMaestro();
    }
}

// Manejar tecla Enter en búsqueda
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        cancelarEdicion();
        cancelarBorrado();
    }
});

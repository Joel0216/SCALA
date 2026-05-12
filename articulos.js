/**
 * articulos.js - Módulo de Gestión de Artículos
 */

let db = null;
let articulosCache = [];
let articuloSeleccionado = null;
let modoNuevo = false;

// ==================== INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Artículos: Inicializando...');

    try {
        if (typeof waitForSupabase === 'function') {
            db = await waitForSupabase();
        } else {
            db = window.supabaseClient || window.supabase || (typeof getSupabase === 'function' ? getSupabase() : null);
        }

        if (db) {
            console.log('✓ Supabase conectado');
            await cargarGrupos();
            await cargarArticulosCache();
        } else {
            console.error('❌ Supabase no disponible');
        }
    } catch (err) {
        console.error('Error inicialización:', err);
    }

    actualizarFechaHora();
    setInterval(actualizarFechaHora, 1000);

    // Configurar validación de inputs numéricos
    configurarValidacionNumerica();
    
    // Configurar generación automática de clave
    configurarAutoClave();
});

function configurarValidacionNumerica() {
    const numericos = ['precio', 'stock', 'minimo', 'editPrecio', 'editMinimo'];
    numericos.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('keydown', (e) => {
                // Bloquear '-', 'e', 'E', '+', '.' (dependiendo si es entero o decimal)
                const invalidos = ['-', 'e', 'E', '+'];
                if (invalidos.includes(e.key)) {
                    e.preventDefault();
                }
            });
            el.addEventListener('paste', (e) => {
                const data = e.clipboardData.getData('text');
                if (/[^0-9.]/.test(data)) {
                    e.preventDefault();
                }
            });
        }
    });
}

function configurarAutoClave() {
    const desc = document.getElementById('descripcion');
    if (desc) {
        desc.addEventListener('input', () => {
            if (modoNuevo) {
                generarClaveAutomatica(desc.value);
            }
        });
    }
}

function generarClaveAutomatica(desc) {
    if (!desc) {
        document.getElementById('clave').value = '';
        return;
    }

    // Tomar las primeras letras de cada palabra significativa
    const palabras = desc.trim().toUpperCase().split(/\s+/);
    let claveBase = palabras.map(p => p[0]).join('').substring(0, 5);
    
    // Si solo hay una palabra, tomar las primeras 3-4 letras
    if (palabras.length === 1) {
        claveBase = palabras[0].substring(0, 4);
    }

    // Generar clave única con sufijo si es necesario
    const claveFinal = generarClaveUnica(claveBase);
    document.getElementById('clave').value = claveFinal;
}

function generarClaveUnica(base) {
    let clave = base;
    let contador = 1;
    
    // Verificar si la clave ya existe en el cache
    while (articulosCache.some(a => a.clave === clave)) {
        clave = base + contador;
        contador++;
    }
    
    return clave;
}

async function cargarGrupos() {
    if (!db) return;
    try {
        const { data, error } = await SessionManager.applyIsolation(db.from('grupos_articulos').select('grupo')).order('grupo');
        if (error) throw error;

        const selects = [document.getElementById('grupo'), document.getElementById('editGrupo')];
        selects.forEach(sel => {
            if (!sel) return;
            sel.innerHTML = '<option value="">-- Seleccionar --</option>';
            data.forEach(g => {
                const opt = document.createElement('option');
                opt.value = g.grupo;
                opt.textContent = g.grupo;
                sel.appendChild(opt);
            });
        });
    } catch (e) {
        console.warn('Error cargando grupos:', e);
    }
}

async function cargarArticulosCache() {
    if (!db) return;
    try {
        const { data, error } = await SessionManager.applyIsolation(db.from('articulos').select('*')).order('clave');
        if (error) throw error;
        articulosCache = data || [];
        console.log(`✓ ${articulosCache.length} artículos en cache`);
    } catch (e) {
        console.error('Error cache:', e);
    }
}

function actualizarFechaHora() {
    const el = document.getElementById('datetime');
    if (el) el.textContent = new Date().toLocaleString('es-MX', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    });
}

// ==================== CRUD OPERATIONS ====================

function limpiarFormulario() {
    articuloSeleccionado = null;
    const campos = ['clave', 'descripcion', 'grupo', 'precio', 'iva', 'stock'];
    campos.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = (id === 'iva') ? '0.16' : (id === 'precio' || id === 'stock' ? '0' : '');
    });
    deshabilitarCampos();
    document.getElementById('btnEditar').disabled = true;
    document.getElementById('btnBorrar').disabled = true;
}

function habilitarCampos(edicion = false) {
    const campos = ['precio', 'grupo', 'iva', 'descripcion', 'stock'];
    campos.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = false;
    });
    // La clave siempre es readonly ahora porque se genera sola
    document.getElementById('clave').readOnly = true;
}

function deshabilitarCampos() {
    const campos = ['clave', 'precio', 'grupo', 'iva', 'descripcion', 'stock'];
    campos.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.disabled = true;
            if (id === 'clave') el.readOnly = true;
        }
    });
}

function nuevoArticulo() {
    if (modoNuevo) {
        guardarNuevo();
        return;
    }
    limpiarFormulario();
    modoNuevo = true;
    habilitarCampos(false);
    
    const btn = document.getElementById('btnNuevo');
    btn.textContent = 'GUARDAR';
    btn.classList.add('btn-secondary');
    document.getElementById('btnCancelarNuevo').style.display = 'inline-flex';
    
    document.getElementById('descripcion').focus();
}

function cancelarNuevo() {
    modoNuevo = false;
    const btn = document.getElementById('btnNuevo');
    btn.textContent = 'NUEVO';
    btn.classList.remove('btn-secondary');
    document.getElementById('btnCancelarNuevo').style.display = 'none';
    limpiarFormulario();
}

async function guardarNuevo() {
    const clave = document.getElementById('clave').value.trim().toUpperCase();
    const descripcion = document.getElementById('descripcion').value.trim().toUpperCase();
    const grupo = document.getElementById('grupo').value;
    const precio = parseFloat(document.getElementById('precio').value) || 0;
    const iva = parseFloat(document.getElementById('iva').value) || 0;
    const stock = parseInt(document.getElementById('stock').value) || 0;

    if (!clave || !descripcion || !grupo) {
        alert('Clave, Descripción y Grupo son campos requeridos.');
        return;
    }

    try {
        const { error } = await db.from('articulos').insert([{
            clave, descripcion, grupo, precio, iva, stock,
            organizacion_id: SessionManager.getCurrentUser()?.organizacion_id
        }]);
        if (error) throw error;

        alert('Artículo creado exitosamente');
        await cargarArticulosCache();
        cancelarNuevo();
    } catch (e) {
        alert('Error: ' + e.message);
    }
}

function editarArticulo() {
    if (!articuloSeleccionado) return;
    
    document.getElementById('editClave').value = articuloSeleccionado.clave;
    document.getElementById('editDescripcion').value = articuloSeleccionado.descripcion;
    document.getElementById('editGrupo').value = articuloSeleccionado.grupo;
    document.getElementById('editPrecio').value = articuloSeleccionado.precio;
    document.getElementById('editIva').value = articuloSeleccionado.iva;
    document.getElementById('editStock').value = articuloSeleccionado.stock;

    document.getElementById('modalEdicion').style.display = 'flex';
}

function cancelarEdicion() {
    document.getElementById('modalEdicion').style.display = 'none';
}

async function guardarEdicion() {
    const id = articuloSeleccionado.id;
    const descripcion = document.getElementById('editDescripcion').value.trim().toUpperCase();
    const grupo = document.getElementById('editGrupo').value;
    const precio = parseFloat(document.getElementById('editPrecio').value) || 0;
    const iva = parseFloat(document.getElementById('editIva').value) || 0;
    const stock = parseInt(document.getElementById('editStock').value) || 0;

    try {
        const { error } = await SessionManager.applyIsolation(db.from('articulos').update({
            descripcion, grupo, precio, iva, stock
        })).eq('id', id);
        if (error) throw error;

        alert('Cambios guardados');
        cancelarEdicion();
        await cargarArticulosCache();
        
        // Actualizar vista principal
        const updated = articulosCache.find(a => a.id === id);
        if (updated) cargarArticulo(updated);
    } catch (e) {
        alert('Error: ' + e.message);
    }
}

function borrarArticulo() {
    if (!articuloSeleccionado) return;
    document.getElementById('mensajeBorrar').textContent = `¿Desea eliminar el artículo ${articuloSeleccionado.clave}?`;
    document.getElementById('modalBorrar').style.display = 'flex';
}

function cancelarBorrado() {
    document.getElementById('modalBorrar').style.display = 'none';
}

async function confirmarBorrado() {
    try {
        const { error } = await SessionManager.applyIsolation(db.from('articulos').delete()).eq('id', articuloSeleccionado.id);
        if (error) throw error;
        alert('Artículo eliminado');
        cancelarBorrado();
        limpiarFormulario();
        await cargarArticulosCache();
    } catch (e) {
        alert('Error: ' + e.message);
    }
}

// ==================== SEARCH MODAL ====================

async function abrirModalBusqueda() {
    document.getElementById('modalBusqueda').style.display = 'flex';
    document.getElementById('inputBusquedaArticulo').value = '';
    
    // Cargar todos por defecto
    await buscarArticulosModal('');
    
    setTimeout(() => document.getElementById('inputBusquedaArticulo').focus(), 100);
}

function cerrarModalBusqueda() {
    document.getElementById('modalBusqueda').style.display = 'none';
}

async function buscarArticulosModal(overrideTerm = null) {
    const termInput = document.getElementById('inputBusquedaArticulo');
    const term = (overrideTerm !== null ? overrideTerm : termInput.value).trim().toUpperCase();
    const tbody = document.getElementById('bodyResultadosArticulos');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Buscando...</td></tr>';

    try {
        let query = SessionManager.applyIsolation(db.from('articulos').select('*'));
        if (term) {
            query = query.or(`clave.ilike.%${term}%,descripcion.ilike.%${term}%`);
        }
        const { data, error } = await query.order('clave').limit(100);
        if (error) throw error;

        tbody.innerHTML = '';
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No se encontraron artículos</td></tr>';
            return;
        }

        data.forEach(a => {
            const tr = document.createElement('tr');
            tr.style.cursor = 'pointer';
            tr.onclick = () => {
                cargarArticulo(a);
                cerrarModalBusqueda();
            };
            tr.innerHTML = `
                <td><strong>${a.clave}</strong></td>
                <td>${a.descripcion}</td>
                <td>${a.grupo}</td>
                <td style="text-align:center;">${a.stock}</td>
                <td style="text-align:right;">$${a.precio.toFixed(2)}</td>
                <td style="text-align:center;">${a.iva}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red;">Error: ${e.message}</td></tr>`;
    }
}

function cargarArticulo(a) {
    articuloSeleccionado = a;
    document.getElementById('clave').value = a.clave;
    document.getElementById('descripcion').value = a.descripcion;
    document.getElementById('grupo').value = a.grupo;
    document.getElementById('precio').value = a.precio;
    document.getElementById('iva').value = a.iva;
    document.getElementById('stock').value = a.stock;

    deshabilitarCampos();
    document.getElementById('btnEditar').disabled = false;
    document.getElementById('btnBorrar').disabled = false;
}

function terminar() {
    window.location.href = 'archivos.html';
}

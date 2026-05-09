// =====================================================================
//  movimientos-inventario-new.js  — v5 DEFINITIVO
//  Supabase + Vanilla JS  |  Sistema SCALA
//
//  Tablas:
//    tipos_movimiento          → id UUID, clave, descripcion, afecta_inventario, activo
//    articulos                 → id BIGINT, clave, descripcion, precio, stock
//    movimientos_inventario    → id SERIAL, numero INTEGER, fecha DATE, hora TIME,
//                                 tipo_id TEXT, articulo_id BIGINT, cantidad, precio_unitario,
//                                 total, observaciones
//
//  REGLA DE ORO: NUNCA se modifica articulos.existencia desde JS.
//  El trigger trigger_actualizar_stock lo hace automáticamente.
// =====================================================================

// ── Variables globales ────────────────────────────────────────────────
let db = null;
let modoEdicion = false;          // false = solo visualización / true = nuevo / búsqueda
let modoNuevo = false;            // true cuando se está creando un nuevo movimiento
let movimientoActual = null;      // { id, numero } del movimiento guardado/cargado
let articulosCache = [];          // catálogo local (solo lectura)
let tiposCache = [];              // catálogo de tipos (solo lectura)
let detallesTemporal = [];        // filas pendientes de guardar

// ── Punto de entrada ─────────────────────────────────────────────────
window.onload = initMovimientosInventario;

async function initMovimientosInventario() {
    console.log('[MOV] 🚀 Iniciando Módulo Movimientos de Inventario...');
    ocultarError();

    // Obtener cliente Supabase (viene de supabase-config.js)
    db = window.supabaseClient || window.supabase || null;
    if (!db && typeof waitForSupabase === 'function') {
        try { db = await waitForSupabase(8000); } catch (_) { db = null; }
    }
    if (!db) {
        mostrarError('⚠ No se pudo conectar con Supabase. Revisa supabase-config.js.');
        configurarEstadoBotonesInicial();
        return;
    }

    // Reloj en tiempo real
    actualizarFechaHora();
    setInterval(actualizarFechaHora, 1000);

    // Cargar catálogos en paralelo
    await Promise.all([
        cargarTiposMovimiento().catch(e => mostrarError('Error tipos: ' + e.message)),
        cargarArticulos().catch(e => mostrarError('Error artículos: ' + e.message))
    ]);

    // Eventos campo artículo
    const elClave = document.getElementById('claveArticulo');
    if (elClave) {
        elClave.addEventListener('blur', buscarArticuloPorClave);
        elClave.addEventListener('keypress', e => { if (e.key === 'Enter') buscarArticuloPorClave(); });
    }
    const elCantidad = document.getElementById('cantidad');
    if (elCantidad) {
        elCantidad.addEventListener('keypress', e => { if (e.key === 'Enter') agregarArticulo(); });
    }

    // Evento para descripción — clic abre el buscador modal
    const elDesc = document.getElementById('descripcionArticulo');
    if (elDesc) {
        elDesc.addEventListener('click', abrirBuscadorArticulos);
    }

    // Estado inicial: solo Buscar y Terminar habilitados
    configurarEstadoBotonesInicial();
    console.log(`[MOV] ✓ Listo — ${tiposCache.length} tipos, ${articulosCache.length} artículos`);
}

// ── Reloj ─────────────────────────────────────────────────────────────
function actualizarFechaHora() {
    const n = new Date();
    const hh = n.getHours();
    const ampm = hh >= 12 ? 'p. m.' : 'a. m.';
    const h12 = String(hh % 12 || 12).padStart(2, '0');
    const mm = String(n.getMinutes()).padStart(2, '0');
    const ss = String(n.getSeconds()).padStart(2, '0');
    const dd = String(n.getDate()).padStart(2, '0');
    const mo = String(n.getMonth() + 1).padStart(2, '0');
    const el = document.getElementById('datetime');
    if (el) el.textContent = `${dd}/${mo}/${n.getFullYear()} ${h12}:${mm}:${ss} ${ampm}`;
}

// ── Mensajes de error ─────────────────────────────────────────────────
function mostrarError(msg) {
    const d = document.getElementById('error-msg');
    if (d) { d.textContent = msg; d.style.display = 'block'; }
    console.error('[MOV ERROR]', msg);
}
function ocultarError() {
    const d = document.getElementById('error-msg');
    if (d) { d.textContent = ''; d.style.display = 'none'; }
}

// ── Acceso rápido a elementos ────────────────────────────────────────
const G = id => document.getElementById(id);

// ── Catálogos ─────────────────────────────────────────────────────────
async function cargarTiposMovimiento() {
    const { data, error } = await db
        .from('tipos_movimiento')
        .select('clave, descripcion, afecta_inventario')
        .eq('activo', true)
        .order('clave');
    if (error) throw error;

    tiposCache = data || [];
    const sel = G('tipoMovimiento');
    sel.innerHTML = '<option value="">-- Seleccione --</option>';
    tiposCache.forEach(t => {
        const o = document.createElement('option');
        o.value = t.clave;                        // Usar CLAVE como identificador
        o.textContent = `${t.clave} — ${t.descripcion}`;
        sel.appendChild(o);
    });
    console.log(`[MOV] ✓ ${tiposCache.length} tipos cargados`);
}

async function cargarArticulos() {
    // Intentar buscar tanto iva como iva_porcentaje por robustez
    const { data, error } = await db
        .from('articulos')
        .select('id, clave, descripcion, precio, stock, iva')
        .order('clave');
    if (error) throw error;

    articulosCache = data || [];
    poblarDatalistArticulos();
    console.log(`[MOV] ✓ ${articulosCache.length} artículos en caché (IVA cargado)`);
}

function poblarDatalistArticulos() {
    const dl = G('listaArticulosDesc');
    if (!dl) return;
    dl.innerHTML = '';
    articulosCache.forEach(a => {
        const opt = document.createElement('option');
        opt.value = a.descripcion;
        dl.appendChild(opt);
    });
}

function buscarArticuloPorClave() {
    const elClave = G('claveArticulo');
    if (!elClave) return;
    const claveStr = elClave.value.trim().toUpperCase();
    if (!claveStr) {
        limpiarInputsArticulo();
        return;
    }
    const art = articulosCache.find(a => a.clave === claveStr);
    if (art) {
        seleccionarArticulo(art);
    } else {
        mostrarToast('Artículo no encontrado', 'warn');
        limpiarInputsArticulo();
        elClave.value = claveStr;
        elClave.focus();
    }
}

function seleccionarArticulo(art) {
    if (!art) return;
    G('claveArticulo').value = art.clave;
    G('claveArticulo').dataset.articuloId = art.id;
    G('descripcionArticulo').value = art.descripcion;
    G('precio').value = parseFloat(art.precio || 0).toFixed(2);
    // Convertir decimal de DB (0.16) a formato de input (16.00%)
    const ivaDec = parseFloat(art.iva !== undefined ? art.iva : (art.iva_porcentaje || 0));
    const ivaPorc = (ivaDec > 0 && ivaDec < 1) ? ivaDec * 100 : ivaDec;
    G('iva').value = parseFloat(ivaPorc || 0).toFixed(2);

    G('cantidad').value = 1;
    const tipoId = G('tipoMovimiento')?.value;
    const tipoObj = tiposCache.find(t => t.clave === tipoId);
    if (tipoObj && tipoObj.afecta_inventario === 'RESTA') {
        const stockActual = art.existencia ?? art.stock ?? 0;
        const yaEnLista = detallesTemporal.find(d => d.articulo_id.toString() === art.id.toString());
        const maxPermitido = stockActual - (yaEnLista ? yaEnLista.cantidad : 0);
        G('cantidad').max = maxPermitido > 0 ? maxPermitido : 0;
    } else {
        G('cantidad').removeAttribute('max');
    }

    G('cantidad').focus();
    console.log(`[MOV] ✓ Artículo seleccionado: ${art.descripcion}`);
}

// ── Máquina de estados de botones ─────────────────────────────────────
function iluminarBoton(btn, activar) {
    if (!btn) return;
    if (activar) {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
        btn.classList.add('btn-activo');
    } else {
        btn.disabled = true;
        btn.style.opacity = '0.42';
        btn.style.cursor = 'not-allowed';
        btn.classList.remove('btn-activo');
    }
}

/** Estado inicial: pantalla en blanco, sin movimiento */
function configurarEstadoBotonesInicial() {
    // Botones visibles
    mostrarBoton('btnNuevo', true);
    mostrarBoton('btnCancelarNuevo', false);
    mostrarBoton('btnGuardar', false);

    // Habilitación
    iluminarBoton(G('btnNuevo'), true);
    iluminarBoton(G('btnGuardar'), false);
    iluminarBoton(G('btnBuscar'), true);
    iluminarBoton(G('btnBorrarOperacion'), false);

    // Terminar: siempre disponible
    const t = G('btnTerminar');
    if (t) { t.disabled = false; t.style.opacity = '1'; t.style.cursor = 'pointer'; }

    // Limpiar pantalla sin renderizar nada
    limpiarCamposHeader();
    detallesTemporal = [];
    renderTablaDetalles();
    setFieldsEditable(false);
}

/** Modo Nuevo activado */
function configurarEstadoModoNuevo() {
    mostrarBoton('btnNuevo', false);
    mostrarBoton('btnCancelarNuevo', true);
    mostrarBoton('btnGuardar', true);

    iluminarBoton(G('btnCancelarNuevo'), true);
    iluminarBoton(G('btnGuardar'), true);
    iluminarBoton(G('btnBuscar'), false);
    iluminarBoton(G('btnBorrarOperacion'), false);
}

/** Con movimiento cargado (tras guardar o buscar) */
function configurarEstadoConMovimiento() {
    mostrarBoton('btnNuevo', true);
    mostrarBoton('btnCancelarNuevo', false);
    mostrarBoton('btnGuardar', false);

    iluminarBoton(G('btnNuevo'), true);
    iluminarBoton(G('btnGuardar'), false);
    iluminarBoton(G('btnBuscar'), true);
    iluminarBoton(G('btnBorrarOperacion'), true);
}

function mostrarBoton(id, visible) {
    const el = G(id);
    if (el) el.style.display = visible ? 'inline-flex' : 'none';
}

function setFieldsEditable(on) {
    // Fecha
    const fec = G('fecha');
    if (fec) fec.readOnly = !on;

    // Observaciones
    const obs = G('observaciones');
    if (obs) obs.readOnly = !on;

    // Select tipo
    const sel = G('tipoMovimiento');
    if (sel) sel.disabled = !on;

    // Inputs artículo
    const ca = G('claveArticulo');
    if (ca) ca.readOnly = !on;
    const cant = G('cantidad');
    if (cant) cant.readOnly = !on;

    // Botón agregar artículo
    const btnAg = document.querySelector('.btn-agregar-articulo');
    if (btnAg) btnAg.disabled = !on;

    // Opacidad panel artículos
    const panelArt = document.querySelector('.panel-articulos');
    if (panelArt) panelArt.style.opacity = on ? '1' : '0.7';

    modoEdicion = on;
}

// ── Nuevo Movimiento ──────────────────────────────────────────────────
async function nuevoMovimiento() {
    ocultarError();
    modoNuevo = true;
    movimientoActual = null;
    detallesTemporal = [];

    // Número sugerido
    await mostrarNumeroSiguiente();

    // Fecha de hoy (formato yyyy-mm-dd para input[type=date])
    const hoy = new Date();
    const dd = String(hoy.getDate()).padStart(2, '0');
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const yyyy = hoy.getFullYear();
    G('fecha').value = `${yyyy}-${mm}-${dd}`;

    // Hora actual
    const hh = String(hoy.getHours()).padStart(2, '0');
    const min = String(hoy.getMinutes()).padStart(2, '0');
    if (G('hora')) G('hora').value = `${hh}:${min}`;

    // Limpiar demás campos
    G('tipoMovimiento').value = '';
    G('observaciones').value = '';
    limpiarInputsArticulo();
    renderTablaDetalles();

    setFieldsEditable(true);
    configurarEstadoModoNuevo();

    // Foco en el tipo de movimiento
    G('tipoMovimiento').focus();
    console.log('[MOV] Modo Nuevo activado');
}

async function mostrarNumeroSiguiente() {
    const el = G('numeroMovimiento');
    if (el) el.value = '...';
    if (!db) return;
    try {
        const { data } = await db
            .from('movimientos_inventario')
            .select('numero')
            .order('numero', { ascending: false })
            .limit(1);
        if (el) el.value = (data && data.length) ? data[0].numero + 1 : 1;
    } catch (_) {
        if (el) el.value = '(auto)';
    }
}

async function cancelarNuevo() {
    if (modoNuevo && detallesTemporal.length > 0) {
        const resp = await mostrarConfirm('¿Cancelar el nuevo movimiento?\nSe perderán todos los datos ingresados.');
        if (!resp) return;
    }
    modoNuevo = false;
    detallesTemporal = [];
    configurarEstadoBotonesInicial();
}

function limpiarCamposHeader() {
    ['numeroMovimiento', 'fecha', 'observaciones'].forEach(id => {
        const el = G(id);
        if (el) el.value = '';
    });
    if (G('hora')) G('hora').value = '';
    const sel = G('tipoMovimiento');
    if (sel) sel.value = '';
    limpiarInputsArticulo();
}

// ── Limpiar solo artículos ─────────────────────────────────────────────
async function limpiarTodo() {
    if (detallesTemporal.length > 0) {
        const resp = await mostrarConfirm('¿Limpiar todos los artículos de la lista?');
        if (!resp) return;
    }
    detallesTemporal = [];
    G('observaciones').value = '';
    limpiarInputsArticulo();
    renderTablaDetalles();
    mostrarToast('Lista de artículos limpiada', 'ok');
}

// ── Validación estricta de cantidad ───────────────────────────────────
function validarCantidadInput(input) {
    // 1. Solo permitir números
    input.value = input.value.replace(/[^0-9]/g, '');
    let val = parseInt(input.value);

    // No forzar un mínimo mientras escribe (podría estar borrando para escribir otro número)
    if (isNaN(val)) return;

    // 2. Validación de Stock Máximo
    const tipoId = G('tipoMovimiento')?.value;
    const tipoObj = tiposCache.find(t => t.clave === tipoId);

    if (tipoObj && tipoObj.afecta_inventario === 'RESTA') {
        const articuloId = G('claveArticulo')?.dataset.articuloId;
        const artObj = articulosCache.find(a => a.id.toString() === (articuloId || '').toString());

        if (artObj) {
            const stockActual = artObj.stock ?? artObj.existencia ?? 0;
            // Calcular cuánto hay ya en la tabla temporal para este artículo
            const yaEnLista = detallesTemporal.find(d => d.articulo_id.toString() === articuloId.toString());
            const maxPermitido = stockActual - (yaEnLista ? yaEnLista.cantidad : 0);

            if (val > maxPermitido) {
                input.value = maxPermitido > 0 ? maxPermitido : '';
                mostrarToast(`Excede stock disponible. Máximo: ${maxPermitido}`, 'warn');
            }
        }
    }
}

function limpiarInputsArticulo() {
    if (G('claveArticulo')) G('claveArticulo').value = '';
    if (G('descripcionArticulo')) G('descripcionArticulo').value = '';
    if (G('cantidad')) G('cantidad').value = '1';
    if (G('precio')) G('precio').value = '0.00';
    if (G('iva')) G('iva').value = '0.00';
    if (G('claveArticulo')) delete G('claveArticulo').dataset.articuloId;
}

// ── Agregar artículo a la tabla temporal ──────────────────────────────
function agregarArticulo() {
    const claveEl = G('claveArticulo');
    const articuloId = claveEl?.dataset.articuloId;
    const clave = claveEl?.value.trim().toUpperCase() || '';
    const descripcion = G('descripcionArticulo')?.value.trim() || '';
    const cantidad = parseInt(G('cantidad')?.value) || 0;
    const precioUnitario = parseFloat(G('precio')?.value) || 0;
    const ivaPorcentaje = parseFloat(G('iva')?.value) || 0;

    if (!articuloId || !clave) {
        mostrarToast('⚠ Primero busca una clave de artículo válida', 'warn');
        G('claveArticulo')?.focus();
        return;
    }
    if (cantidad <= 0) {
        mostrarToast('⚠ La cantidad debe ser mayor a 0', 'warn');
        G('cantidad')?.focus();
        return;
    }

    // --- VALIDACIÓN DE STOCK ---
    const tipoId = G('tipoMovimiento')?.value;
    const tipoObj = tiposCache.find(t => t.clave === tipoId); // Buscar por clave
    const artObj = articulosCache.find(a => a.id.toString() === articuloId.toString());

    if (tipoObj && tipoObj.afecta_inventario === 'RESTA') {
        const stockActual = artObj ? (artObj.stock ?? artObj.existencia ?? 0) : 0;
        // Calcular cuánto hay ya en la tabla temporal para este artículo
        const yaEnLista = detallesTemporal.find(d => d.articulo_id.toString() === articuloId.toString());
        const cantTotal = cantidad + (yaEnLista ? yaEnLista.cantidad : 0);

        if (cantTotal > stockActual) {
            mostrarToast(`⚠ No queda de este articulo.\nDisponible: ${stockActual}\nRequerido: ${cantTotal}`, 'error');
            G('cantidad')?.focus();
            return;
        }
    }

    // Cálculos
    const subtotal = cantidad * precioUnitario;
    const ivaImporte = subtotal * (ivaPorcentaje / 100);
    const totalLinea = subtotal + ivaImporte;

    // Si ya existe en la lista → ofrecer sumar
    const existente = detallesTemporal.find(d => d.articulo_id === articuloId);
    if (existente) {
        existente.cantidad += cantidad;
        existente.subtotal = existente.cantidad * existente.precio_unitario;
        existente.iva_importe = existente.subtotal * (existente.iva_porcentaje / 100);
        existente.total_linea = existente.subtotal + existente.iva_importe;
        // Por compatibilidad conservamos la propiedad total
        existente.total = existente.total_linea;
    } else {
        detallesTemporal.push({
            articulo_id: articuloId,       // UUID → FK detalle
            clave,
            descripcion,
            cantidad,
            precio_unitario: precioUnitario,
            iva_porcentaje: ivaPorcentaje,
            subtotal: subtotal,
            iva_importe: ivaImporte,
            total_linea: totalLinea,
            total: totalLinea // Compatibilidad
        });
    }

    renderTablaDetalles();
    limpiarInputsArticulo();
    G('claveArticulo')?.focus();
}

// ── Render tabla de detalles ───────────────────────────────────────────
function renderTablaDetalles() {
    const tbody = G('detallesBody');
    if (!tbody) return;

    if (!detallesTemporal.length) {
        tbody.innerHTML = '<tr class="no-data"><td colspan="8">No hay artículos agregados</td></tr>';
        if (G('subtotalGeneral')) G('subtotalGeneral').textContent = '$0.00';
        if (G('totalIva')) G('totalIva').textContent = '$0.00';
        if (G('totalGeneral')) G('totalGeneral').textContent = '$0.00';
        return;
    }

    let html = '';
    let subtotalGeneral = 0;
    let totalIva = 0;
    let granTotal = 0;

    detallesTemporal.forEach((it, i) => {
        // Fallbacks por si hay datos viejos en memoria
        const st = it.subtotal ?? (it.cantidad * it.precio_unitario);
        const ivPorc = it.iva_porcentaje ?? 0;
        const ivImp = it.iva_importe ?? (st * (ivPorc / 100));
        const tl = it.total_linea ?? (st + ivImp);

        subtotalGeneral += st;
        totalIva += ivImp;
        granTotal += tl;

        // Solo mostrar botón eliminar si estamos en modo nuevo/edicion
        const btnEliminar = modoEdicion
            ? `<button class="btn-eliminar-fila" onclick="eliminarDetalle(${i})" title="Quitar artículo">✕</button>`
            : `<span style="color:#999;font-size:11px;">—</span>`;
        html += `
        <tr>
          <td><strong>${it.clave}</strong></td>
          <td>${it.descripcion}</td>
          <td style="text-align:center">${it.cantidad}</td>
          <td style="text-align:right">$${it.precio_unitario.toFixed(2)}</td>
          <td style="text-align:right">$${st.toFixed(2)}</td>
          <td style="text-align:center">${ivPorc}%</td>
          <td style="text-align:right">$${ivImp.toFixed(2)}</td>
          <td style="text-align:right;font-weight:bold">$${tl.toFixed(2)}</td>
          <td style="text-align:center">${btnEliminar}</td>
        </tr>`;
    });

    tbody.innerHTML = html;
    if (G('subtotalGeneral')) G('subtotalGeneral').textContent = `$${subtotalGeneral.toFixed(2)}`;
    if (G('totalIva')) G('totalIva').textContent = `$${totalIva.toFixed(2)}`;
    if (G('totalGeneral')) G('totalGeneral').textContent = `$${granTotal.toFixed(2)}`;
}

async function eliminarDetalle(i) {
    const item = detallesTemporal[i];
    if (!item) return;
    const resp = await mostrarConfirm(`¿Quitar "${item.clave}" de la lista?`);
    if (resp) {
        detallesTemporal.splice(i, 1);
        renderTablaDetalles();
    }
}

// ── Guardar Movimiento ────────────────────────────────────────────────
async function guardarMovimiento() {
    ocultarError();
    if (!db) { mostrarError('Sin conexión con la base de datos'); return; }

    const fechaVal = G('fecha')?.value || '';
    const tipoId = G('tipoMovimiento')?.value || '';
    const obs = G('observaciones')?.value.trim() || '';

    // Validaciones
    if (!fechaVal) {
        mostrarToast('⚠ Ingresa la fecha del movimiento', 'warn');
        G('fecha')?.focus(); return;
    }
    if (!tipoId) {
        mostrarToast('⚠ Selecciona el tipo de movimiento', 'warn');
        G('tipoMovimiento')?.focus(); return;
    }
    if (!detallesTemporal.length) {
        mostrarToast('⚠ Agrega al menos un artículo antes de guardar', 'warn'); return;
    }
    const resp = await mostrarConfirm(`¿Guardar este movimiento con ${detallesTemporal.length} artículo(s)?`);
    if (!resp) return;

    try {
        // Hora actual en formato HH:MM:SS
        const ahora = new Date();
        const horaStr = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}:${String(ahora.getSeconds()).padStart(2, '0')}`;

        // Obtener el número de movimiento (el que está en el input)
        const numMov = parseInt(G('numeroMovimiento')?.value) || 1;

        // INSERT múltiple en tabla única
        const filas = detallesTemporal.map(d => ({
            numero: numMov,
            fecha: fechaVal,
            hora: horaStr,
            tipo_id: tipoId,
            articulo_id: d.articulo_id,
            cantidad: d.cantidad,
            precio_unitario: d.precio_unitario,
            iva_importe: d.iva_importe || 0,
            total_linea: d.total_linea || d.total,
            total: d.total_linea || d.total, // El total tradicional
            observaciones: obs || null
        }));

        const { error: eDetalle } = await db
            .from('movimientos_inventario')
            .insert(filas);
        if (eDetalle) throw eDetalle;

        console.log(`[MOV] ✓ ${filas.length} registros guardados en tabla única. Stock actualizado.`);

        // Actualizar estado
        movimientoActual = { numero: numMov };
        modoNuevo = false;

        setFieldsEditable(false);
        configurarEstadoConMovimiento();

        // Recargar artículos para tener existencias actualizadas
        await cargarArticulos().catch(() => { });

        mostrarToast(`✅ Movimiento guardado correctamente #${numMov}`, 'ok');

    } catch (err) {
        console.error('[MOV] ❌ Error guardando:', err);
        mostrarError('Error al guardar: ' + (err.message || JSON.stringify(err)));
    }
}

// ── Buscar Movimiento (Estilo Windows Alumnos) ──────────────────────────────────────────
async function buscarMovimiento() {
    ocultarError();
    if (!db) return;
    window.open('movimientos-lista.html', 'MovimientosLista', 'width=1000,height=700');
}

function cerrarBuscador() {
    const m = G('modalBusqueda');
    if (m) m.style.display = 'none';
}

function cerrarResultadosBusqueda() {
    const m = G('modalResultadosBusqueda');
    if (m) m.style.display = 'none';
}

async function ejecutarBusqueda() {
    const btn = document.querySelector('.btn-busqueda');
    if (btn) btn.disabled = true;
    const body = G('resultadosBusquedaBody');
    if (body) body.innerHTML = '<tr><td colspan="5" style="text-align:center;">🔍 Buscando...</td></tr>';

    try {
        const fechaDesde = G('filtroFechaDesde').value;
        const fechaHasta = G('filtroFechaHasta').value;
        const texto = G('filtroTexto').value.trim();

        let query = db
            .from('movimientos_inventario')
            .select(`
                numero,
                fecha,
                tipo_id,
                observaciones,
                total_linea,
                total,
                tipo:tipos_movimiento(descripcion)
            `);

        if (fechaDesde) query = query.gte('fecha', fechaDesde);
        if (fechaHasta) query = query.lte('fecha', fechaHasta);
        if (texto) {
            const isNum = !isNaN(parseInt(texto));
            if (isNum) {
                query = query.or(`numero.eq.${parseInt(texto)},observaciones.ilike.%${texto}%`);
            } else {
                query = query.ilike('observaciones', `%${texto}%`);
            }
        }

        const { data, error } = await query;
        if (error) throw error;

        // Cerrar primer modal, abrir modal de resultados
        cerrarBuscador();
        const mRes = G('modalResultadosBusqueda');
        if (mRes) mRes.style.display = 'flex';

        // Agrupar
        const agrupados = new Map();
        (data || []).forEach(row => {
            if (!agrupados.has(row.numero)) {
                agrupados.set(row.numero, {
                    numero: row.numero,
                    fecha: row.fecha,
                    tipo: row.tipo?.descripcion || row.tipo_id,
                    observaciones: row.observaciones || '',
                    total: 0
                });
            }
            agrupados.get(row.numero).total += parseFloat(row.total_linea || row.total || 0);
        });

        const resultados = Array.from(agrupados.values()).sort((a, b) => b.numero - a.numero);

        if (resultados.length === 0) {
            if (body) body.innerHTML = '<tr class="no-data"><td colspan="5">No se encontraron movimientos</td></tr>';
            return;
        }

        if (body) body.innerHTML = '';
        resultados.forEach(r => {
            const tr = document.createElement('tr');
            tr.style.cursor = 'pointer';
            tr.innerHTML = `
                <td style="text-align:center"><strong>${r.numero}</strong></td>
                <td style="text-align:center">${formatearFechaA_ddmmyyyy(r.fecha) || ''}</td>
                <td>${r.tipo}</td>
                <td><div style="max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${r.observaciones}</div></td>
                <td style="text-align:right; font-weight:bold;">$${r.total.toFixed(2)}</td>
            `;
            tr.ondblclick = () => {
                cerrarResultadosBusqueda();
                cargarMovimientoDesdeBusqueda(r.numero);
            };
            if (body) body.appendChild(tr);
        });

    } catch (err) {
        console.error('[MOV] Error búsqueda:', err);
        if (body) body.innerHTML = `<tr><td colspan="5" style="color:red; text-align:center;">Error: ${err.message}</td></tr>`;
    } finally {
        if (btn) btn.disabled = false;
    }
}

async function cargarMovimientoDesdeBusqueda(numero) {
    cerrarBuscador();
    console.log(`[MOV] 🔍 Cargando #${numero} desde buscador...`);

    try {
        const { data, error } = await db
            .from('movimientos_inventario')
            .select(`
                *,
                tipo:tipos_movimiento ( clave, descripcion, afecta_inventario ),
                articulo:articulos ( clave, descripcion )
            `)
            .eq('numero', numero);

        if (error) throw error;
        if (!data || data.length === 0) return;

        // Tomar datos comunes del primer registro
        const first = data[0];
        movimientoActual = { numero: first.numero };

        if (G('numeroMovimiento')) G('numeroMovimiento').value = first.numero;
        if (G('fecha')) G('fecha').value = first.fecha || '';
        if (G('hora')) G('hora').value = first.hora ? first.hora.slice(0, 5) : '';
        if (G('observaciones')) G('observaciones').value = first.observaciones || '';
        if (first.tipo && G('tipoMovimiento')) G('tipoMovimiento').value = first.tipo.clave;

        // Reconstruir detalles desde todas las filas
        detallesTemporal = data.map(row => ({
            articulo_id: row.articulo_id,
            clave: row.articulo?.clave || '?',
            descripcion: row.articulo?.descripcion || '?',
            cantidad: row.cantidad,
            precio_unitario: parseFloat(row.precio_unitario || 0),
            total: parseFloat(row.total || 0)
        }));

        modoNuevo = false;
        setFieldsEditable(false);
        renderTablaDetalles();
        configurarEstadoConMovimiento();

        mostrarToast(`✓ Movimiento #${first.numero} cargado`, 'ok');

    } catch (err) {
        console.error('[MOV] ❌ Error cargando:', err);
        mostrarError('No se pudo cargar el movimiento: ' + err.message);
    }
}

// ── Borrar Movimiento ─────────────────────────────────────────────────
async function borrarMovimiento() {
    ocultarError();
    if (!movimientoActual) {
        mostrarToast('⚠ No hay ningún movimiento cargado para borrar', 'warn'); return;
    }
    if (!db) return;

    const num = movimientoActual.numero;
    const confirm1 = await mostrarConfirm(
        `⚠ ¿BORRAR el movimiento #${num}?\n\n` +
        `• Se eliminarán todas las filas asociadas a este número.\n` +
        `• El trigger revierte automáticamente las existencias.\n` +
        `• Esta acción es IRREVERSIBLE.`
    );
    if (!confirm1) return;

    try {
        // Borrar todas las filas que compartan el número
        const { error } = await db
            .from('movimientos_inventario')
            .delete()
            .eq('numero', num);
        if (error) throw error;

        console.log(`[MOV] ✓ Movimiento #${num} eliminado (trigger revirtió existencias)`);

        // Renumerar
        try {
            await db.rpc('renumerar_movimientos_flat', { p_numero_borrado: num });
        } catch (rpcErr) {
            console.warn('[MOV] ⚠ No se pudo renumerar:', rpcErr.message);
        }

        mostrarToast(`✅ Movimiento #${num} eliminado correctamente`, 'ok');

        movimientoActual = null;
        modoNuevo = false;
        detallesTemporal = [];
        await cargarArticulos().catch(() => { });
        configurarEstadoBotonesInicial();

    } catch (err) {
        console.error('[MOV] ❌ Error borrando:', err);
        mostrarError('Error al borrar: ' + err.message);
    }
}

// ── Terminar / Salir ──────────────────────────────────────────────────
async function terminar() {
    if (modoNuevo && detallesTemporal.length > 0) {
        const resp = await mostrarConfirm('⚠ Hay datos sin guardar.\n¿Salir de todas formas?');
        if (!resp) return;
    }
    if (window.history.length > 1) {
        history.back();
    } else {
        modoNuevo = false;
        movimientoActual = null;
        detallesTemporal = [];
        configurarEstadoBotonesInicial();
    }
}

// ── Gestión de Tipos (CRUD) ───────────────────────────────────────────
async function abrirGestionTipos() {
    const m = G('modalGestionTipos');
    if (m) m.style.display = 'flex';
    limpiarFormTipo();
    await cargarListaTipos();
}

function cerrarGestionTipos() {
    const m = G('modalGestionTipos');
    if (m) m.style.display = 'none';
}

async function cargarListaTipos() {
    const tbSuma = G('listaTiposSumaBody');
    const tbResta = G('listaTiposRestaBody');
    const tbNinguno = G('listaTiposNingunoBody');

    if (!tbSuma || !tbResta || !tbNinguno) return;

    tbSuma.innerHTML = '<tr><td colspan="4" style="text-align:center;">Cargando...</td></tr>';
    tbResta.innerHTML = '<tr><td colspan="4" style="text-align:center;">Cargando...</td></tr>';
    tbNinguno.innerHTML = '<tr><td colspan="4" style="text-align:center;">Cargando...</td></tr>';

    try {
        const { data, error } = await db.from('tipos_movimiento').select('*').order('clave');
        if (error) throw error;

        tbSuma.innerHTML = '';
        tbResta.innerHTML = '';
        tbNinguno.innerHTML = '';

        data.forEach(t => {
            const tr = document.createElement('tr');
            const colorEfecto = t.afecta_inventario === 'SUMA' ? '#10b981' : (t.afecta_inventario === 'RESTA' ? '#ef4444' : '#6b7280');
            tr.innerHTML = `
                <td><strong>${t.clave}</strong></td>
                <td>${t.descripcion} ${t.activo ? '' : '<span style="color:red;">(INACTIVO)</span>'}</td>
                <td style="color:${colorEfecto}; font-weight:bold;">${t.afecta_inventario}</td>
                <td>
                    <button class="btn-mini-edit" onclick="editarTipo('${t.clave}')">✏️</button>
                    <button class="btn-mini-del" onclick="eliminarTipo('${t.clave}')">🗑</button>
                </td>
            `;
            if (t.afecta_inventario === 'SUMA') tbSuma.appendChild(tr);
            else if (t.afecta_inventario === 'RESTA') tbResta.appendChild(tr);
            else tbNinguno.appendChild(tr);
        });

        if (!tbSuma.hasChildNodes()) tbSuma.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#999;">Sin entradas</td></tr>';
        if (!tbResta.hasChildNodes()) tbResta.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#999;">Sin salidas</td></tr>';
        if (!tbNinguno.hasChildNodes()) tbNinguno.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#999;">Sin ajustes</td></tr>';
    } catch (err) {
        tbSuma.innerHTML = `<tr><td colspan="4" style="color:red;">Error: ${err.message}</td></tr>`;
        tbResta.innerHTML = ''; tbNinguno.innerHTML = '';
    }
}

function limpiarFormTipo() {
    G('tipoIdEdit').value = '';
    G('tipoClave').value = '';
    G('tipoDescripcion').value = '';
    G('tipoAfecta').value = 'SUMA';
    G('tipoClave').focus();
}

async function editarTipo(clave) {
    try {
        const { data, error } = await db
            .from('tipos_movimiento')
        G('tipoIdEdit').value = data.clave; // Guardamos la clave original
        G('tipoClave').value = data.clave;
        G('tipoDescripcion').value = data.descripcion;
        G('tipoAfecta').value = data.afecta_inventario;
        G('tipoDescripcion').focus(); // Foco a descripción para que pueda typear y regenerar clave
    } catch (_) { mostrarToast('Error al cargar tipo para editar', 'error'); }
}

async function guardarTipo() {
    const id = G('tipoIdEdit').value; // Clave original
    const clave = G('tipoClave').value.trim().toUpperCase(); // La que vamos a guardar
    const desc = G('tipoDescripcion').value.trim().toUpperCase();
    const afecta = G('tipoAfecta').value;

    if (!clave || !desc) {
        mostrarToast('⚠ Clave y descripción son obligatorias', 'warn'); return;
    }

    try {
        let res;
        if (id) {
            // Si hay ID original (estamos editando), actualizamos
            res = await db.from('tipos_movimiento')
                .update({ clave, descripcion: desc, afecta_inventario: afecta })
                .eq('clave', id);
        } else {
            // Nuevo tipo
            res = await db.from('tipos_movimiento')
                .insert([{ clave, descripcion: desc, afecta_inventario: afecta, activo: true }]);
        }

        if (res.error) throw res.error;

        mostrarToast('✅ Tipo guardado correctamente', 'ok');
        limpiarFormTipo();
        await cargarListaTipos();
        await cargarTiposMovimiento(); // Actualizar select principal
    } catch (err) {
        mostrarToast(`Error al guardar: ${err.message}`, 'error');
    }
}

async function eliminarTipo(clave) {
    const resp = await mostrarConfirm('¿Seguro que deseas eliminar este tipo de movimiento?\nSolo se podrá eliminar si no tiene movimientos asociados.');
    if (!resp) return;

    try {
        const { error } = await db.from('tipos_movimiento').delete().eq('clave', clave);
        if (error) {
            if (error.code === '23503') throw new Error('No se puede eliminar porque tiene movimientos asociados. Desactívalo en su lugar.');
            throw error;
        }
        mostrarToast('✅ Tipo eliminado', 'ok');
        await cargarListaTipos();
        await cargarTiposMovimiento();
    } catch (err) {
        mostrarToast('Error: ' + err.message, 'error');
    }
}

// ── Toast flotante ────────────────────────────────────────────────────
function mostrarToast(msg, tipo = 'ok') {
    const prev = G('_mi_toast');
    if (prev) prev.remove();

    const t = document.createElement('div');
    t.id = '_mi_toast';

    const colores = {
        ok: { bg: '#10b981', borde: '#059669' },
        warn: { bg: '#f59e0b', borde: '#d97706' },
        error: { bg: '#ef4444', borde: '#dc2626' }
    };
    const c = colores[tipo] || colores.ok;

    Object.assign(t.style, {
        position: 'fixed',
        bottom: '28px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: c.bg,
        color: '#fff',
        border: `1px solid ${c.borde}`,
        borderRadius: '10px',
        padding: '12px 28px',
        fontSize: '14px',
        fontWeight: 'bold',
        fontFamily: "'Segoe UI', Arial, sans-serif",
        zIndex: '9999',
        boxShadow: '0 6px 20px rgba(0,0,0,0.35)',
        opacity: '1',
        transition: 'opacity 0.35s ease',
        textAlign: 'center',
        maxWidth: '90vw',
        whiteSpace: 'pre-line',
        letterSpacing: '0.3px'
    });

    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => {
        t.style.opacity = '0';
        setTimeout(() => t.remove(), 380);
    }, 3500);
}

// ── Auto-generar Clave Única de Tipo de Movimiento ───────────────────
// Regla:
//   1 palabra  → primeras 2 letras ("Devolucion" → "DE")
//   2+ palabras → primera letra de TODAS las palabras ("MOVTO INTERNO ENT." → "MIE")
// Si ya existe en la BD, se añade un número (ej: DE1, DE2)
let objTimeout = null;

async function autoGenerarClaveTipo(descripcion) {
    const claveInput = G('tipoClave');
    if (!claveInput) return;

    // Solo auto-generar si estamos creando uno nuevo (sin ID de edición original)
    const idEdit = G('tipoIdEdit')?.value;
    if (idEdit) return; // Si está editando, no le cambiamos la clave mientras escribe para evitar problemas, la cambia el usuario si quiere

    clearTimeout(objTimeout);

    // Limpiar caracteres no alfabéticos
    const textoLimpio = descripcion.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    const palabras = textoLimpio.trim().toUpperCase().split(/\s+/).filter(Boolean);
    let claveBase = '';

    if (palabras.length === 0) {
        claveInput.value = '';
        return;
    } else if (palabras.length === 1) {
        claveBase = palabras[0].substring(0, 2);
    } else {
        claveBase = palabras.map(p => p[0]).join('');
        if (claveBase.length > 4) {
            claveBase = palabras[0][0] + palabras[palabras.length - 1][0]; // muy largo → primera + última
        }
    }

    // Limitar longitud base para dejar espacio para el número
    claveBase = claveBase.substring(0, 3);
    claveInput.value = claveBase + '...'; // indicador de carga

    // Debounce de 400ms para no saturar la BD al escribir rápido
    objTimeout = setTimeout(async () => {
        if (!db) {
            claveInput.value = claveBase;
            return;
        }

        try {
            // Obtener todas las claves actuales que empiecen con esta base para buscar números
            const { data, error } = await db
                .from('tipos_movimiento')
                .select('clave')
                .ilike('clave', `${claveBase}%`);

            if (error) throw error;

            const clavesExistentes = (data || []).map(r => r.clave.toUpperCase());
            let nuevaClave = claveBase;
            let contador = 1;

            while (clavesExistentes.includes(nuevaClave)) {
                nuevaClave = `${claveBase}${contador}`;
                contador++;
            }

            claveInput.value = nuevaClave.substring(0, 5); // maxlength
        } catch (err) {
            console.error('Error al generar clave única:', err);
            claveInput.value = claveBase;
        }
    }, 400);
}

// ── Modal de Búsqueda de Artículos ────────────────────────────────────
function abrirBuscadorArticulos() {
    if (!modoNuevo) {
        mostrarToast('Debe hacer clic en "Nuevo" para agregar artículos', 'warn');
        return;
    }
    const modal = G('modalBuscadorArticulos');
    const busqueda = G('busquedaArticuloModal');
    if (!modal) return;

    // Limpiar búsqueda y renderizar todos
    if (busqueda) busqueda.value = '';
    renderArticulosModal(articulosCache);

    modal.style.display = 'flex';
    if (busqueda) setTimeout(() => busqueda.focus(), 100);
}

function cerrarBuscadorArticulos() {
    const modal = G('modalBuscadorArticulos');
    if (modal) modal.style.display = 'none';
}

function filtrarArticulosModal(texto) {
    const q = (texto || '').toLowerCase().trim();
    if (!q) {
        renderArticulosModal(articulosCache);
        return;
    }
    const filtrados = articulosCache.filter(a =>
        a.clave.toLowerCase().includes(q) ||
        a.descripcion.toLowerCase().includes(q)
    );
    renderArticulosModal(filtrados);
}

function renderArticulosModal(listaOri) {
    const tbody = G('articulosModalBody');
    if (!tbody) return;

    const tipoId = G('tipoMovimiento')?.value;
    const tipoObj = tiposCache.find(t => t.clave === tipoId);
    const esResta = tipoObj && tipoObj.afecta_inventario === 'RESTA';

    // Filtrar los que ya no tienen stock disponible si es RESTA
    const lista = (listaOri || []).filter(art => {
        if (!esResta) return true;
        const stockOriginal = art.existencia ?? art.stock ?? 0;
        const yaEnLista = detallesTemporal.find(d => d.articulo_id.toString() === art.id.toString());
        const stockRestante = stockOriginal - (yaEnLista ? yaEnLista.cantidad : 0);
        return stockRestante > 0;
    });

    if (!lista || lista.length === 0) {
        tbody.innerHTML = '<tr class="no-data"><td colspan="5">Sin resultados o agotados</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    lista.forEach(art => {
        const tr = document.createElement('tr');
        tr.style.cursor = 'pointer';
        const stockOriginal = art.existencia ?? art.stock ?? 0;
        const yaEnLista = detallesTemporal.find(d => d.articulo_id.toString() === art.id.toString());
        const stockRestante = esResta ? (stockOriginal - (yaEnLista ? yaEnLista.cantidad : 0)) : stockOriginal;

        const colorStock = stockRestante <= 0 ? 'color:red;' : (stockRestante < 5 ? 'color:orange;' : '');
        const ivaDec = parseFloat(art.iva !== undefined ? art.iva : (art.iva_porcentaje || 0));
        const ivaPorc = (ivaDec > 0 && ivaDec < 1) ? ivaDec * 100 : ivaDec;
        tr.innerHTML = `
            <td><strong>${art.clave}</strong></td>
            <td>${art.descripcion}</td>
            <td>$${parseFloat(art.precio || 0).toFixed(2)}</td>
            <td>${parseFloat(ivaPorc || 0).toFixed(2)}%</td>
            <td style="${colorStock}">${stockRestante}</td>
        `;
        tr.addEventListener('click', () => {
            seleccionarArticulo(art);
            cerrarBuscadorArticulos();
        });
        // Hover highlight
        tr.addEventListener('mouseenter', () => tr.style.background = '#e8f4fd');
        tr.addEventListener('mouseleave', () => tr.style.background = '');
        tbody.appendChild(tr);
    });
}

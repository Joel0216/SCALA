/**
 * cobros.js - Core logic for Payments Module
 */

let db = null;
let currentStudent = null;
let currentOperation = null;
let paymentData = {
    efectivo: 0,
    tarjeta: 0,
    reference: ''
};

// Datos iniciales por defecto para el catálogo de operaciones (se inserta si la tabla está vacía)
const DEFAULT_OPERATIONS = [
    { nombre: 'PAQUETE ABC 2013', precio: 950.00, iva: 0.00, activo: true },
    { nombre: 'ABC HOME SWEET HOME', precio: 120.00, iva: 0.00, activo: true },
    { nombre: 'ANUALIDAD', precio: 300.00, iva: 0.16, activo: true },
    { nombre: 'CANTO INFANTIL', precio: 550.00, iva: 1.16, activo: true },
    { nombre: 'COLEGIATURAS', precio: 0.00, iva: 0.15, activo: true },
    { nombre: 'CUADERNO PAUTADO DE BATERIA', precio: 70.00, iva: 0.16, activo: true },
    { nombre: 'DRUM KIDS', precio: 200.00, iva: 0.16, activo: true },
    { nombre: 'DRUM KIDS INDIVIDUAL', precio: 850.00, iva: 0.16, activo: true },
    { nombre: 'ENGLISH MUSIC', precio: 600.00, iva: 1.16, activo: true },
    { nombre: 'EXAMEN DE NIVEL 1', precio: 0.00, iva: 0.16, activo: true },
    { nombre: 'EXAMEN DE NIVEL 2', precio: 0.00, iva: 0.16, activo: true },
    { nombre: 'EXAMEN DE NIVEL 3', precio: 0.00, iva: 0.00, activo: true },
    { nombre: 'EXAMEN DE NIVEL 4', precio: 0.00, iva: 0.16, activo: true },
    { nombre: 'PAGO DE EXAMEN', precio: 100.00, iva: 0.00, activo: true },
    { nombre: 'FIGURAS MATCH', precio: 248.00, iva: 0.00, activo: true },
    { nombre: 'FIGURAS RITMICAS', precio: 248.00, iva: 0.00, activo: true },
    { nombre: 'HORAS KINDER', precio: 180.00, iva: 0.16, activo: true },
    { nombre: 'HORAS PRIMARIA', precio: 180.00, iva: 0.16, activo: true },
    { nombre: 'INICIACION Y EXPRESION ESCENICA', precio: 700.00, iva: 0.16, activo: true },
    { nombre: 'INSCRIPCION', precio: 500.00, iva: 0.15, activo: true },
    { nombre: 'MOCHILA SCALA NIÑOS', precio: 150.00, iva: 0.00, activo: true },
    { nombre: 'MONQUI KIDS', precio: 600.00, iva: 0.16, activo: true },
    { nombre: 'MONQUI TODDLER', precio: 600.00, iva: 0.16, activo: true },
    { nombre: 'METODO BABY MUSIC', precio: 200.00, iva: 0.16, activo: true },
    { nombre: 'METODO DE DRUM KIDS', precio: 200.00, iva: 0.16, activo: true },
    { nombre: 'METODO DE INICIACION MUSICAL', precio: 300.00, iva: 0.16, activo: true },
    { nombre: 'METODO DE SOLFEO', precio: 140.00, iva: 0.16, activo: true },
    { nombre: 'ON THE GO', precio: 120.00, iva: 0.00, activo: true },
    { nombre: 'PAQUETE BABY MUSIC', precio: 450.00, iva: 0.16, activo: true },
    { nombre: 'PAGO DE EVENTO', precio: 500.00, iva: 0.16, activo: true },
    { nombre: 'PIANO PREPARATORIO', precio: 200.00, iva: 0.16, activo: true },
    { nombre: 'PLAYERAS KINDERMUSIK', precio: 60.00, iva: 0.00, activo: true },
    { nombre: 'UNIFORMES KM', precio: 60.00, iva: 0.16, activo: true },
    { nombre: 'PRACTICADOR DE PIANO', precio: 20.00, iva: 0.00, activo: true },
    { nombre: 'PIANO PREPARATORIO INFANTIL', precio: 190.00, iva: 0.16, activo: true },
    { nombre: 'PENTAGRAMA', precio: 258.00, iva: 0.00, activo: true },
    { nombre: 'RE-INSCRIPCION', precio: 550.00, iva: 0.00, activo: true },
    { nombre: 'TECLADO PAPEL', precio: 9.00, iva: 0.15, activo: true },
    { nombre: 'VIOLIN INFANTIL', precio: 200.00, iva: 0.16, activo: true },
    { nombre: 'VIOLIN INFANTIL INDIVIDUAL', precio: 550.00, iva: 0.16, activo: true }
];

let lookupTitleText = "";
let operationsList = []; // List of operations in the current receipt

let lookupTableHeaders = [];

// Pagination and Lookup state (Restored)
let lookupCurrentPage = 1;
let lookupTotalRecords = 0;
const lookupRowsPerPage = 20;
let lookupSearchTerm = '';
let lookupFn = null;
let lookupSelect = null;

// Search Pagination state
let searchCurrentPage = 1;
let searchTotalRecords = 0;
const searchRowsPerPage = 100;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Inicializando Cobros...');

    try {
        if (typeof waitForSupabase === 'function') {
            db = await waitForSupabase();
        } else {
            db = window.supabaseClient || window.supabase || (typeof getSupabase === 'function' ? getSupabase() : null);
        }

        if (db) {
            console.log('✓ Supabase conectado');
            await initModule();

            // Check for URL parameters (Debt/Student redirect)
            setTimeout(async () => {
                console.log('Checking for URL parameters...');
                await initFromUrlParams();
            }, 500);

            // Check if we should open modal/route automatically via query string
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('view') === 'cancelled') {
                window.location.href = 'recibos_cancelados.html';
                return;
            }
            if (urlParams.get('view') === 'consulta') {
                openSearchTransactionModal();
            }
        } else {
            console.error('× Supabase NO disponible');
            if (typeof mostrarAlerta === 'function') {
                await mostrarAlerta('Error: No se pudo conectar a la base de datos.');
            } else {
                alert('Error: No se pudo conectar a la base de datos.');
            }
        }
    } catch (err) {
        console.error('Error inicializando:', err);
    }
});

/**
 * Captura parámetros de URL para autollanado de cobranza
 */
async function initFromUrlParams() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        let alumnoId = urlParams.get('alumno_id');
        let monto = urlParams.get('monto');
        let concepto = urlParams.get('concepto');
        let mes = urlParams.get('mes');
        let anio = urlParams.get('anio');

        let refId = urlParams.get('ref_id');
        let tipo = urlParams.get('tipo');
        let ivaParam = urlParams.get('iva');

        // FALLBACK: Revisar localStorage por si se perdieron los params en un redirect
        if (!alumnoId) {
            const pending = localStorage.getItem('pago_pendiente');
            if (pending) {
                const data = JSON.parse(pending);
                // Solo usar si es reciente (menos de 30 segundos)
                if (Date.now() - data.timestamp < 30000) {
                    alumnoId = data.alumno_id;
                    monto = data.monto;
                    concepto = data.concepto;
                    mes = data.mes;
                    anio = data.anio;
                    refId = data.ref_id;
                    tipo = data.tipo;
                    ivaParam = data.iva;
                    console.log('✓ Cargando deuda desde localStorage');
                }
                localStorage.removeItem('pago_pendiente');
            }
        }

        if (!alumnoId) return;

        console.log('✓ Detectado alumno_id en URL:', alumnoId);

        // 1. Asignar recibo automáticamente si no tiene uno
        const reciboInput = document.getElementById('currentReceiptNo');
        if (!reciboInput.value) {
            await assignNextReceipt();
        }

        // 2. Buscar datos del alumno
        const { data: student, error } = await SessionManager.applyIsolation(db.from('alumnos'))
            .select('*')
            .eq('id', alumnoId)
            .maybeSingle();

        if (error || !student) {
            console.error('Error cargando alumno desde URL:', error);
            return;
        }

        // 3. Seleccionar alumno
        const selected = await selectStudent(student);
        if (!selected) return;

        // 4. Si hay monto y concepto, agregarlos como operación
        if (monto && concepto) {
            const mockOp = {
                id: 'debt-' + Date.now(),
                nombre: concepto.toUpperCase(),
                precio: parseFloat(monto) || 0, // Fallback a 0 para evitar NaN
                iva: ivaParam !== null ? parseFloat(ivaParam) : 0.16, // Usar iva de la URL o default
                is_colegiatura: true,
                mes: mes,
                anio: anio,
                ref_id: refId,
                tipo: tipo,
                alumno_id: alumnoId,
                locked: parseFloat(monto) > 0 
            };
            
            // Si es mensualidad o anualidad, inyectar metadatos
            if (concepto.toUpperCase().includes('COLEGIATURA')) {
                mockOp.is_colegiatura = true;
            } else if (concepto.toUpperCase().includes('ANUALIDAD')) {
                mockOp.is_anualidad = true;
            } else if (tipo === 'EXAMEN') {
                mockOp.is_colegiatura = false; 
                mockOp.is_examen = true;
                mockOp.iva = 0; // Forzar 0 IVA para exámenes si no se especificó
            }

            await addOperationToReceipt(mockOp);
            console.log('✓ Operación de deuda agregada automáticamente');
            
            if (typeof mostrarAlerta === 'function') {
                await mostrarAlerta(`Se ha cargado automáticamente la deuda: ${concepto}`);
            }
        }
    } catch (e) {
        console.error('Error en initFromUrlParams:', e);
    }
}

/**
 * Global function to open a modal by ID
 * @param {string} id 
 */
function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.style.display = 'flex';
        console.log(`✓ Modal abierto: ${id}`);
    } else {
        console.error(`× Modal no encontrado: ${id}`);
    }
}

async function initModule() {
    updateDateTime();
    setInterval(updateDateTime, 1000);

    // Event Listeners with defensive checks
    const addListener = (id, event, fn) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener(event, fn);
    };

    addListener('btnAsignarRecibo', 'click', assignNextReceipt);
    addListener('lookupStudent', 'click', openStudentLookup);
    addListener('lookupOperation', 'click', openOperationLookup);
    addListener('btnEfectivo', 'click', () => openPaymentModal('efectivo'));
    addListener('btnTarjeta', 'click', () => openPaymentModal('tarjeta'));
    addListener('btnTransferencia', 'click', () => openPaymentModal('transferencia'));
    addListener('btnFinishCash', 'click', finishCashPayment);
    addListener('btnFinishCard', 'click', finishCardPayment);
    addListener('btnFinishTrans', 'click', finishTransPayment);
    addListener('btnGuardarImprimir', 'click', saveAndPrint);

    addListener('btnSalir', 'click', () => {
        console.log('Saliendo a caja.html...');
        window.location.href = 'caja.html';
    });
    addListener('btnCancelar', 'click', () => {
        location.reload();
    });

    addListener('lookupOperation', 'contextmenu', (e) => {
        e.preventDefault();
        const reciboVal = document.getElementById('currentReceiptNo');
        if (!reciboVal || !reciboVal.value) {
            return alert('PRIMERO DEBE "ASIGNAR RECIBO".');
        }
        if (!currentStudent) {
            return alert('PRIMERO DEBE SELECCIONAR UN ALUMNO ANTES DE AGREGAR OPERACIONES.');
        }
        openNewOperationModal();
    });

    // Modal New Operation
    addListener('btnCancelNewOp', 'click', () => closeDialog('modalNewOperation'));
    addListener('btnSaveNewOp', 'click', saveNewOperation);

    // Modal Search and Cancelled History
    addListener('lookupTransaction', 'click', () => {
        searchCurrentPage = 1;
        openModal('modalSearchTransaction');
        doSearchTransaction();
    });
    addListener('btnDoSearch', 'click', () => {
        searchCurrentPage = 1;
        doSearchTransaction();
    });
    addListener('btnOpenCancelledModal', 'click', () => {
        window.location.href = 'recibos_cancelados.html';
    });
    addListener('btnDoCancelledSearch', 'click', () => {
        cancelledCurrentPage = 1;
        searchCancelledReceipts();
    });
    addListener('cancelledSearchInput', 'keypress', (e) => {
        if (e.key === 'Enter') {
            cancelledCurrentPage = 1;
            searchCancelledReceipts();
        }
    });

    // Cancelled Pagination Listeners
    addListener('btnCancelPagFirst', 'click', () => {
        if (cancelledCurrentPage > 1) {
            cancelledCurrentPage = 1;
            searchCancelledReceipts();
        }
    });
    addListener('btnCancelPagPrev', 'click', () => {
        if (cancelledCurrentPage > 1) {
            cancelledCurrentPage--;
            searchCancelledReceipts();
        }
    });
    addListener('btnCancelPagNext', 'click', () => {
        const totalPaginas = Math.ceil(cancelledTotalRecords / cancelledRowsPerPage) || 1;
        if (cancelledCurrentPage < totalPaginas) {
            cancelledCurrentPage++;
            searchCancelledReceipts();
        }
    });
    addListener('btnCancelPagLast', 'click', () => {
        const totalPaginas = Math.ceil(cancelledTotalRecords / cancelledRowsPerPage) || 1;
        if (cancelledCurrentPage < totalPaginas) {
            cancelledCurrentPage = totalPaginas;
            searchCancelledReceipts();
        }
    });

    // Modal Close Buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) closeDialog(modal.id);
        });
    });
    // Removed btnPrintPreview listener here because doPrint is undefined and it crashes initModule

    // Preview Actions removed

    // Pagination Buttons
    addListener('btnPagFirst', 'click', () => irPagina(1));
    addListener('btnPagPrev', 'click', () => irPagina(lookupCurrentPage - 1));
    addListener('btnPagNext', 'click', () => irPagina(lookupCurrentPage + 1));
    addListener('btnPagLast', 'click', () => {
        const totalPaginas = Math.ceil(lookupTotalRecords / lookupRowsPerPage);
        irPagina(totalPaginas);
    });
    addListener('btnDoSearch', 'click', () => irPagina(1));
    addListener('lookupSearchInput', 'keyup', (e) => {
        if (e.key === 'Enter') irPagina(1);
    });

    addListener('btnLookupNuevo', 'click', () => {
        closeDialog('modalLookup');
        openNewOperationModal();
    });

    // Search Pagination Buttons
    addListener('btnSearchPagFirst', 'click', () => irPaginaBusqueda(1));
    addListener('btnSearchPagPrev', 'click', () => irPaginaBusqueda(searchCurrentPage - 1));
    addListener('btnSearchPagNext', 'click', () => irPaginaBusqueda(searchCurrentPage + 1));
    addListener('btnSearchPagLast', 'click', () => {
        const totalPaginas = Math.ceil(searchTotalRecords / searchRowsPerPage);
        irPaginaBusqueda(totalPaginas);
    });
    addListener('searchTransactionInput', 'keyup', (e) => {
        if (e.key === 'Enter') irPaginaBusqueda(1);
    });

    // Input logic
    addListener('cashAmountReceived', 'input', calculateChange);

    // Modal Cancel Buttons
    addListener('btnCancelCash', 'click', () => closeDialog('modalEfectivo'));
    addListener('btnCancelCard', 'click', () => closeDialog('modalTarjeta'));
    addListener('btnCancelTrans', 'click', () => closeDialog('modalTransferencia'));

    // Draggable
    if (typeof makeDraggable === 'function') {
        makeDraggable('lookupModalContent', 'lookupHeader');
    }

    // Force disabled state on load
    document.getElementById('lookupStudent').disabled = true;
    document.getElementById('lookupOperation').disabled = true;
    document.getElementById('btnEfectivo').disabled = true;
    document.getElementById('btnTarjeta').disabled = true;
    document.getElementById('btnTransferencia').disabled = true; // Added for transfer
    document.getElementById('btnGuardarImprimir').disabled = true;

    // Modales de Pago
    document.getElementById('btnEfectivo').addEventListener('click', () => openPaymentModal('efectivo'));
    document.getElementById('btnTarjeta').addEventListener('click', () => openPaymentModal('tarjeta'));
    document.getElementById('btnTransferencia').addEventListener('click', () => openPaymentModal('transferencia'));

    document.getElementById('btnCancelCash').addEventListener('click', () => closeDialog('modalEfectivo'));
    document.getElementById('btnCancelCard').addEventListener('click', () => closeDialog('modalTarjeta'));
    document.getElementById('btnCancelTrans').addEventListener('click', () => closeDialog('modalTransferencia'));

    document.getElementById('btnFinishCash').addEventListener('click', finishCashPayment);
    document.getElementById('btnFinishCard').addEventListener('click', finishCardPayment);
    document.getElementById('btnFinishTrans').addEventListener('click', finishTransPayment);

    // Input logic
    const cashAmtRaw = document.getElementById('cashAmountReceived');
    if (cashAmtRaw) cashAmtRaw.addEventListener('input', calculateChange);
    
    // Some discount fields might be missing in some HTML versions - check before adding listener
    const cashDisc = document.getElementById('cashDiscountPercent');
    if (cashDisc) cashDisc.addEventListener('input', calculateChange);
    
    const cardDisc = document.getElementById('cardDiscountPercent');
    if (cardDisc) cardDisc.addEventListener('input', calculateCardChange);

    console.log('✓ Modulo inicializado');
}

function updateDateTime() {
    const now = new Date();
    const dateStr = now.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

    const dInput = document.getElementById('currentDate');
    const tInput = document.getElementById('currentTime');
    if (dInput) dInput.value = dateStr;
    if (tInput) tInput.value = timeStr;
}

// --- RECEIPT LOGIC ---
async function assignNextReceipt() {
    try {
        const { data, error } = await SessionManager.applyIsolation(db.from('recibos')).select('numero').order('numero', { ascending: false }).limit(1);
        if (error) throw error;

        let lastNo = 0;
        if (data && data.length > 0) {
            lastNo = data[0].numero;
        }

        document.getElementById('currentReceiptNo').value = (lastNo + 1);

        // Visual Feedback for the button
        const btn = document.getElementById('btnAsignarRecibo');
        if (btn) {
            btn.classList.add('btn-active-glow');
            btn.textContent = 'RECIBO ASIGNADO ✓';
        }

        // Habilitar controles principales
        document.getElementById('lookupStudent').disabled = false;

        // document.getElementById('lookupOperation').disabled = false; // Se activa al seleccionar un alumno
        console.log('✓ Recibo asignado:', lastNo + 1);
    } catch (e) {
        console.error('Error asignando recibo:', e);
        alert('Error al obtener el siguiente número de recibo');
    }
}

// --- LOOKUP LOGIC ---
function openStudentLookup() {
    const reciboVal = document.getElementById('currentReceiptNo').value;
    if (!reciboVal) {
        alert('PRIMERO DEBE "ASIGNAR RECIBO" ANTES DE ELEGIR UN ALUMNO.');
        return;
    }
    openLookup('Alumnos', ['Credencial', 'Alumno', 'Ingreso'], searchStudents, selectStudent, { hideNew: true });
}

function openOperationLookup() {
    const reciboVal = document.getElementById('currentReceiptNo').value;
    if (!reciboVal) {
        alert('PRIMERO DEBE "ASIGNAR RECIBO".');
        return;
    }
    if (!currentStudent) {
        alert('PRIMERO DEBE SELECCIONAR UN ALUMNO ANTES DE BUSCAR O AGREGAR OPERACIONES.');
        return;
    }
    openLookup('Operaciones', ['Nombre', 'Precio', 'IVA', 'Activo'], searchOperations, selectOperation, { hideNew: true, readOnly: true });
}

function openRfcLookup() {
    openLookup('RFC Clientes', ['RFC', 'Nombre'], searchRfcs, selectRfc);
}

function openLookup(title, headers, searchFn, selectFn, options = {}) {
    lookupFn = searchFn;
    lookupSelect = selectFn;
    lookupTableHeaders = headers;
    lookupCurrentPage = 1;
    lookupSearchTerm = '';
    lookupTitleText = title;

    const modal = document.getElementById('modalLookup');
    document.getElementById('lookupTitle').textContent = `Buscar ${title}`;

    const btnNuevo = document.getElementById('btnLookupNuevo');
    if (btnNuevo) {
        if (options.hideNew) {
            btnNuevo.classList.add('hidden');
        } else {
            btnNuevo.classList.remove('hidden');
        }
    }

    const headerRow = document.getElementById('lookupTableHeader');
    headerRow.innerHTML = '';
    headers.forEach(h => {
        const th = document.createElement('th');
        th.textContent = h;
        headerRow.appendChild(th);
    });

    const searchInput = document.getElementById('lookupSearchInput');
    if (searchInput) {
        searchInput.value = '';
        setTimeout(() => searchInput.focus(), 100);
    }

    modal.style.display = 'flex';
    irPagina(1);
}

async function irPagina(pagina) {
    if (pagina < 1) return;
    const totalPaginas = Math.ceil(lookupTotalRecords / lookupRowsPerPage);
    if (totalPaginas > 0 && pagina > totalPaginas) return;

    lookupCurrentPage = pagina;
    lookupSearchTerm = document.getElementById('lookupSearchInput').value;

    const from = (lookupCurrentPage - 1) * lookupRowsPerPage;
    const to = from + lookupRowsPerPage - 1;

    const results = await lookupFn(lookupSearchTerm, from, to);
    displayLookupResults(results, lookupTableHeaders, lookupSelect);
    actualizarPaginador();
}

function actualizarPaginador() {
    const totalPaginas = Math.max(1, Math.ceil(lookupTotalRecords / lookupRowsPerPage));
    document.getElementById('pagActual').value = lookupCurrentPage;
    document.getElementById('pagInfo').textContent = `Página ${lookupCurrentPage} de ${totalPaginas} - ${lookupTotalRecords} registros`;
}

function displayLookupResults(results, headers, selectFn) {
    const tbody = document.getElementById('lookupTableBody');
    tbody.innerHTML = '';

    if (!results || results.length === 0) {
        tbody.innerHTML = '<tr><td colspan="' + headers.length + '" style="text-align:center;">No se encontraron resultados</td></tr>';
        return;
    }

    results.forEach(item => {
        const tr = document.createElement('tr');
        tr.style.cursor = 'pointer';
        tr.onclick = async () => {
            const success = await selectFn(item);
            if (success === false) return; // Means selection was blocked

            // Don't close if it's operations (to allow adding more)
            if (lookupTitleText.toLowerCase().includes('operaciones')) {
                // Visual feedback
                tr.style.background = '#90ee90';
                setTimeout(() => tr.style.background = '', 500);
            } else {
                closeDialog('modalLookup');
            }
        };

        // Dynamic mapping based on schema
        const keys = results[0]._keys || Object.keys(item).filter(k => k !== 'id' && !k.startsWith('_'));
        keys.forEach(key => {
            const td = document.createElement('td');
            if (key === 'activo') {
                td.textContent = item[key] ? 'Sí' : 'No';
            } else if (key === 'editar') {
                const btnContainer = document.createElement('div');
                btnContainer.style.display = 'flex';
                btnContainer.style.gap = '5px';

                const btnEdit = document.createElement('button');
                btnEdit.textContent = 'Editar';
                btnEdit.className = 'btn-secondary btn-sm';
                btnEdit.onclick = (e) => {
                    e.stopPropagation();
                    openEditOperationModal(item);
                };

                const btnDelete = document.createElement('button');
                btnDelete.textContent = 'Eliminar';
                btnDelete.className = 'btn-exit btn-sm';
                btnDelete.style.padding = '0 5px';
                btnDelete.onclick = (e) => {
                    e.stopPropagation();
                    deleteOperationCatalog(item);
                };

                btnContainer.appendChild(btnEdit);
                btnContainer.appendChild(btnDelete);
                td.appendChild(btnContainer);
            } else {
                td.textContent = item[key];
            }
            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });
}

// --- SEARCH FUNCTIONS ---
async function searchStudents(term, from = 0, to = 19) {
    let query = db.from('alumnos')
        .select('id, nombre, credencial, fecha_ingreso, nombre_padre, nombre_madre, beca, porcentaje_beca', { count: 'exact' })
        .eq('activo', true);

    if (term) {
        if (!isNaN(term)) {
            query = query.or(`credencial.eq.${parseInt(term)},nombre.ilike.%${term}%`);
        } else {
            query = query.ilike('nombre', `%${term}%`);
        }
    }

    const { data, error, count } = await query
        .order('nombre', { ascending: true })
        .range(from, to);

    lookupTotalRecords = count || 0;

    if (error) return [];
    return data.map(d => ({
        ...d,
        _keys: ['credencial', 'nombre', 'fecha_ingreso'],
    }));
}

async function searchOperations(term, from = 0, to = 19) {
    let query = db.from('articulos')
        .select('id, clave, descripcion, precio, iva', { count: 'exact' });

    if (term) {
        query = query.or(`clave.ilike.%${term}%,descripcion.ilike.%${term}%`);
    }

    const { data, error, count } = await query
        .order('descripcion', { ascending: true })
        .range(from, to);

    lookupTotalRecords = count || 0;

    if (error) {
        console.error('Error in searchOperations:', error);
        return [];
    }

    return (data || []).map(d => ({
        ...d,
        nombre: d.descripcion, // Unified mapping for selectOperation
        _keys: ['Clave', 'Descripción', 'Precio', 'IVA'],
        // Mapping actual data to match the display headers
        Clave: d.clave,
        Descripción: d.descripcion,
        Precio: d.precio,
        IVA: d.iva
    }));
}

async function searchRfcs(term, from = 0, to = 19) {
    let query = db.from('rfc_clientes')
        .select('*', { count: 'exact' });

    if (term) {
        query = query.or(`rfc.ilike.%${term}%,nombre.ilike.%${term}%`);
    }

    const { data, error, count } = await query
        .order('rfc', { ascending: true })
        .range(from, to);

    lookupTotalRecords = count || 0;

    if (error) return [];
    return data.map(d => ({
        ...d,
        _keys: ['rfc', 'nombre']
    }));
}

// --- SELECTION LOGIC ---
async function selectStudent(student) {
    const bRfc = document.getElementById('billingRfc');
    const bName = document.getElementById('billingName');
    const existingRfc = bRfc ? bRfc.value : '';

    let newStudentRfc = null;
    let rfcDataFull = null;

    try {
        const { data: link, error: linkErr } = await db.from('rfc_credenciales')
            .select('rfc')
            .eq('credencial', parseInt(student.credencial))
            .maybeSingle();

        if (link && !linkErr) {
            newStudentRfc = link.rfc;
            const { data: rfcData, error: rfcErr } = await db.from('rfc_clientes')
                .select('*')
                .eq('rfc', link.rfc)
                .maybeSingle();

            if (rfcData && !rfcErr) {
                rfcDataFull = rfcData;
            }
        }
    } catch (e) {
        console.warn('Error buscando RFC:', e);
    }

    // RFC Parity Check & Auto-fill
    if (operationsList.length > 0) {
        if (existingRfc && existingRfc !== 'XAXX010101000' && existingRfc.trim() !== '') {
            if (newStudentRfc !== existingRfc) {
                mostrarAlerta(`No se puede agregar al alumno ${student.nombre}.`, 'error', `Para facturar juntos, todos los alumnos deben estar vinculados al mismo RFC.\n- RFC Actual en Recibo: ${existingRfc}\n- RFC del Alumno: ${newStudentRfc || 'NO TIENE'}`);
                return false;
            }
        } else if (newStudentRfc && newStudentRfc !== 'XAXX010101000') {
            mostrarAlerta(`No se puede agregar al alumno ${student.nombre}.`, 'warning', 'El recibo actual no tiene un RFC asignado o es un RFC genérico. No se pueden mezclar alumnos con RFC específicos.');
            return false;
        }
    }

    currentStudent = student;
    const dispName = document.getElementById('displayName');
    if (dispName) dispName.textContent = student.nombre;
    document.getElementById('studentCred').value = student.credencial;
    document.getElementById('studentEntryDate').value = student.fecha_ingreso || '';

    // Auto-fill billing if found and it's the first operation or matches current
    if (newStudentRfc) {
        document.getElementById('billingRfc').value = newStudentRfc;
        if (rfcDataFull) {
            document.getElementById('billingName').value = rfcDataFull.nombre || student.nombre;
            document.getElementById('billingAddress').value = rfcDataFull.direccion || '';
            document.getElementById('billingEmail').value = rfcDataFull.email || '';
        }
    } else if (operationsList.length === 0) {
        document.getElementById('billingRfc').value = 'XAXX010101000';
        document.getElementById('billingName').value = student.nombre;
        document.getElementById('billingAddress').value = '';
        document.getElementById('billingEmail').value = '';
    }

    document.getElementById('lookupOperation').disabled = false;
    document.getElementById('lookupOperation').classList.add('pulse-animation');
    setTimeout(() => document.getElementById('lookupOperation').classList.remove('pulse-animation'), 1000);

    console.log('✓ Alumno seleccionado:', student.nombre);
    return true;
}

function selectRfc(rfcData) {
    document.getElementById('billingRfc').value = rfcData.rfc;
    document.getElementById('billingName').value = rfcData.nombre;
    document.getElementById('billingAddress').value = rfcData.direccion || '';
    document.getElementById('billingEmail').value = rfcData.correo || '';
}

function selectOperation(op) {
    // Standardize mapping from articulos table to the operations logic
    currentOperation = {
        ...op,
        nombre: op.descripcion || op.nombre // Ensure 'nombre' exists for compatibility
    };

    const dispOp = document.getElementById('displayOperation');
    if (dispOp) dispOp.textContent = op.nombre;
    const stockEl = document.getElementById('opStock');
    if (stockEl) stockEl.value = 'N/A'; // Or hide it
    document.getElementById('opIva').value = op.iva + '%';
    document.getElementById('opPrice').value = `$${op.precio.toFixed(2)}`;

    // Add to table automatically for now
    addOperationToReceipt(op);
}

async function addOperationToReceipt(op) {
    // EVITAR DUPLICADOS DE EXÁMENES
    if (op.tipo === 'EXAMEN' && op.ref_id) {
        const existe = operationsList.find(x => x.tipo === 'EXAMEN' && x.ref_id === op.ref_id);
        if (existe) {
            if (typeof mostrarAlerta === 'function') await mostrarAlerta('Este examen ya está agregado al recibo.');
            else alert('Este examen ya está agregado al recibo.');
            return;
        }
    }

    let grossPrice = op.precio;
    const ivaRate = op.iva || 0;

    // --- Lógica de Beca vs Artículos ---
    let scholarshipApplied = false;
    let scholarshipPercent = 0;

    // Si el alumno tiene beca vinculada
    if (currentStudent) {
        // Asegurar que beca sea booleano verdadero (por si viene como string)
        const hasBeca = currentStudent.beca === true || currentStudent.beca === 'true';
        if (hasBeca) {
            scholarshipPercent = parseFloat(currentStudent.porcentaje_beca) || 0;
            if (scholarshipPercent > 0) {
                scholarshipApplied = true;
                console.log(`Aplicando beca del ${scholarshipPercent}% para el alumno ${currentStudent.nombre}`);
            }
        }
    }
    // ------------------------------------

    // --- Lógica de Recargo Tardío (10% después del día 15) ---
    const hoy = new Date();
    const esColegiaturaParaRecargo = op.nombre.toUpperCase().includes('COLEGIATURA');
    let recargoAmount = 0;
    if (esColegiaturaParaRecargo && hoy.getDate() > 15 && scholarshipPercent < 100) {
        recargoAmount = grossPrice * 0.10;
        // Agregamos una nota a la descripción
        op.nombre += ' (RECARGO 10% MÁS DE DÍA 15)';
    }
    // ---------------------------------------------------------

    const row = {
        id: Date.now(),
        articulo_id: (typeof op.id === 'string' && op.id.startsWith('debt-')) ? null : op.id,
        cred: currentStudent ? currentStudent.credencial : '',
        descripcion: op.nombre,
        original_price: grossPrice, // Precio original del catálogo
        gross_price: grossPrice + recargoAmount, // Precio con recargo pero antes de beca/descuento
        iva_rate: ivaRate,
        qty: 1,
        manual_discount_percent: 0,
        manual_discount_amount: 0,
        scholarship_applied: scholarshipApplied,
        scholarship_percent: scholarshipPercent,
        // Metadata para deudas/exámenes
        is_colegiatura: op.is_colegiatura || false,
        is_anualidad: op.is_anualidad || false,
        is_examen: op.is_examen || false,
        mes: op.mes || null,
        anio: op.anio || null,
        ref_id: op.ref_id || null,
        tipo: op.tipo || null,
        alumno_id: op.alumno_id || (currentStudent ? currentStudent.id : null),
        locked: op.locked || false
    };

    recalculateRow(row);
    operationsList.push(row);
    renderOperations();
}

function renderOperations() {
    const tbody = document.querySelector('#operationsTable tbody');
    tbody.innerHTML = '';

    operationsList.forEach((op, index) => {
        const tr = document.createElement('tr');
        tr.onclick = () => selectRow(index);

        // Bloquear descuento manual si se aplicó beca
        const manualDiscountDisabled = op.scholarship_applied || op.locked ? 'disabled' : '';
        const scholarshipLabel = op.scholarship_applied ? `<br><small style="color: green; font-weight: bold;">Beca ${op.scholarship_percent}% Aplicada</small>` : '';
        const displayDiscountPercent = op.scholarship_applied ? op.scholarship_percent : op.manual_discount_percent;

        // Lógica de Bloqueo de Integridad
        const isLocked = op.locked === true;
        const deleteDisabled = isLocked ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : '';
        const inputsDisabled = isLocked ? 'disabled' : '';

        tr.innerHTML = `
            <td> <button class="delete-row-btn" onclick="deleteRow(${index}, event)" ${deleteDisabled}>×</button> </td>
            <td> ${op.cred} </td>
            <td> ${op.descripcion}${scholarshipLabel} </td>
            <td> $${op.gross_price.toFixed(2)} </td>
            <td> $${op.iva_amount.toFixed(2)} (${(op.iva_rate * 100).toFixed(0)}%) </td>
            <td> <input type="number" value="${op.qty}" min="1" step="1" onchange="updateQty(${index}, this.value)" style="width: 50px;" ${inputsDisabled}> </td>
            <td> <input type="number" value="${displayDiscountPercent}" min="0" max="100" step="1" onchange="updateRowDiscount(${index}, this.value)" ${manualDiscountDisabled} style="width: 60px;"> </td>
            <td> $${op.neto.toFixed(2)} </td>
        `;
        tbody.appendChild(tr);
    });

    const hasOps = operationsList.length > 0;
    const btnEfectivo = document.getElementById('btnEfectivo');
    const btnTarjeta = document.getElementById('btnTarjeta');
    const btnTrans = document.getElementById('btnTransferencia');
    const btnSave = document.getElementById('btnGuardarImprimir');

    if (btnEfectivo) btnEfectivo.disabled = !hasOps;
    if (btnTarjeta) btnTarjeta.disabled = !hasOps;
    if (btnTrans) btnTrans.disabled = !hasOps;
    if (btnSave) {
        btnSave.disabled = !hasOps;
        btnSave.style.display = 'block'; // Ensure it's visible
        btnSave.style.opacity = hasOps ? '1' : '0.5';
    }

    updateTotals();
}

function updateQty(index, val) {
    const qty = parseInt(val) || 1;
    if (qty < 1) return;

    const op = operationsList[index];
    if (op.locked) {
        if (typeof mostrarAlerta === 'function') {
            mostrarAlerta('La cantidad para este concepto está bloqueada por reglas de negocio.');
        } else {
            alert('La cantidad para este concepto está bloqueada.');
        }
        renderOperations();
        return;
    }

    op.qty = qty;
    recalculateRow(op);
    renderOperations();
}

function updateRowDiscount(index, val) {
    const pct = parseFloat(val) || 0;
    const op = operationsList[index];
    op.manual_discount_percent = pct;
    recalculateRow(op);
    renderOperations();
}

function recalculateRow(op) {
    const itemGrossBaseTotal = op.gross_price * op.qty;
    const discountPercent = op.scholarship_applied ? op.scholarship_percent : op.manual_discount_percent;
    
    op.manual_discount_amount = itemGrossBaseTotal * (discountPercent / 100);
    const itemGrossFinalTotal = itemGrossBaseTotal - op.manual_discount_amount;
    
    const itemIvaTotal = itemGrossFinalTotal * op.iva_rate;
    op.neto = itemGrossFinalTotal + itemIvaTotal;
    
    // IVA unitario para mostrar (opcional, para visualización en columnas de IVA)
    op.iva_amount = itemIvaTotal / op.qty;
}

function updateTotals() {
    let subtotalGross = 0;
    let totalDiscount = 0;
    let totalNeto = 0;

    operationsList.forEach(op => {
        subtotalGross += (op.gross_price * op.qty);
        totalDiscount += (op.manual_discount_amount || 0);
        totalNeto += op.neto;
    });

    const gtInput = document.getElementById('grandTotal');
    const stInput = document.getElementById('subtotal');
    const discInput = document.getElementById('payDiscount');
    const discPercentInput = document.getElementById('payDiscountPercent');

    if (stInput) stInput.value = `$${subtotalGross.toFixed(2)}`;
    if (discInput) discInput.value = `$${totalDiscount.toFixed(2)}`;
    if (gtInput) gtInput.value = `$${totalNeto.toFixed(2)}`;

    // Calculate effective percentage
    const effPercent = subtotalGross > 0 ? (totalDiscount / subtotalGross) * 100 : 0;
    if (discPercentInput) discPercentInput.value = effPercent.toFixed(2) + '%';
    
    // UI fix for scholarship students: ensure the "Total" reflects what is expected
    // If student has 100% scholarship, Neto is 0.
}

// --- PAYMENT MODALS ---
function openPaymentModal(method) {
    if (operationsList.length === 0) return alert('No hay operaciones para cobrar');

    const subtotal = parseFloat(document.getElementById('subtotal').value.replace('$', ''));
    const grandTotal = parseFloat(document.getElementById('grandTotal').value.replace('$', ''));

    // Reset paymentData
    paymentData = { efectivo: 0, tarjeta: 0, transferencia: 0, reference: '', transferDetails: {} };

    const hasScholarship = currentStudent && currentStudent.beca;

    if (method === 'efectivo') {
        document.getElementById('cashAmountToPay').value = `$${grandTotal.toFixed(2)}`;
        document.getElementById('cashAmountReceived').value = '';
        document.getElementById('cashChange').value = '$0.00';
        document.getElementById('modalEfectivo').style.display = 'flex';
        setTimeout(() => document.getElementById('cashAmountReceived').focus(), 100);
    } else if (method === 'tarjeta') {
        document.getElementById('cardAmountToPay').value = `$${grandTotal.toFixed(2)}`;
        document.getElementById('cardAuth').value = '';
        document.getElementById('cardNumber').value = '';
        document.getElementById('modalTarjeta').style.display = 'flex';
    } else if (method === 'transferencia') {
        document.getElementById('transAmountToPay').value = `$${grandTotal.toFixed(2)}`;
        // Transferencias no suelen tener descuento manual en el modal en este sistema
        document.getElementById('transDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('transFolio').value = '';
        document.getElementById('transPlace').value = '';
        document.getElementById('transBusinessName').value = '';
        document.getElementById('transRfc').value = '';
        document.getElementById('transAmountLetter').value = '';
        document.getElementById('transConcept').value = '';
        document.getElementById('transProof').value = ''; // Clear file input
        document.getElementById('modalTransferencia').style.display = 'flex';
    }
}

function finishCashPayment() {
    const finalTotal = parseFloat(document.getElementById('grandTotal').value.replace('$', '')) || 0;
    const received = parseFloat(document.getElementById('cashAmountReceived').value) || 0;

    if (received < finalTotal) return alert('Monto a dar insuficiente');

    paymentData.metodo = 'EFECTIVO';
    paymentData.efectivo = finalTotal;
    paymentData.tarjeta = 0;
    paymentData.transferencia = 0;
    paymentData.montoRecibido = received;
    paymentData.cambio = Math.max(0, received - finalTotal);
    paymentData.reference = '';
    paymentData.details = {};

    document.getElementById('payEfectivo').value = `$${finalTotal.toFixed(2)}`;
    document.getElementById('payAmountReceived').value = `$${received.toFixed(2)}`;
    document.getElementById('payChange').value = `$${paymentData.cambio.toFixed(2)}`;
    
    // UI details for discount from global operations
    const totalDescuentoOps = operationsList.reduce((acc, op) => acc + (op.manual_discount_amount || 0), 0);
    document.getElementById('payDiscount').value = `$${totalDescuentoOps.toFixed(2)}`;
    // Leave payDiscountPercent to updateTotals()

    const spm = document.getElementById('selectedPaymentMethod');
    if (spm) spm.textContent = '(EFECTIVO)';

    updatePaymentMethodUI('efectivo');
    updateTotals();
    closeDialog('modalEfectivo');
}

function calculateChange() {
    const amtToPayStr = document.getElementById('cashAmountToPay').value;
    const receivedStr = document.getElementById('cashAmountReceived').value;

    const totalToPay = parseFloat(amtToPayStr.replace('$', '')) || 0;
    const received = parseFloat(receivedStr) || 0;

    const change = Math.max(0, received - totalToPay);
    document.getElementById('cashChange').value = `$${change.toFixed(2)}`;
}

function finishCardPayment() {
    const finalTotal = parseFloat(document.getElementById('grandTotal').value.replace('$', '')) || 0;
    
    const bank = document.getElementById('cardBank').value;
    const number = document.getElementById('cardNumber').value;
    const auth = document.getElementById('cardAuth').value;

    if (!auth) return alert('Ingrese la referencia de autorización');

    paymentData.metodo = 'TARJETA';
    paymentData.tarjeta = finalTotal;
    paymentData.efectivo = 0;
    paymentData.transferencia = 0;
    paymentData.reference = auth;
    paymentData.details = {
        bank: bank,
        cardNumber: number,
        auth: auth
    };

    document.getElementById('payTarjeta').value = `$${finalTotal.toFixed(2)}`;
    document.getElementById('payCardNumber').value = number;
    document.getElementById('payReference').value = auth;
    document.getElementById('payCardBank').value = bank;
    
    // UI details for discount from global operations
    const totalDescuentoOps = operationsList.reduce((acc, op) => acc + (op.manual_discount_amount || 0), 0);
    document.getElementById('payDiscount').value = `$${totalDescuentoOps.toFixed(2)}`;

    // Capture proof file
    const proofInput = document.getElementById('cardProof');
    paymentData.proofFile = (proofInput && proofInput.files[0]) ? proofInput.files[0] : null;

    const spm = document.getElementById('selectedPaymentMethod');
    if (spm) spm.textContent = '(TARJETA)';

    updatePaymentMethodUI('tarjeta');
    updateTotals();
    closeDialog('modalTarjeta');
}


async function finishTransPayment() {
    const finalTotal = parseFloat(document.getElementById('grandTotal').value.replace('$', '')) || 0;
    const folio = document.getElementById('transFolio').value;
    const bName = document.getElementById('transBusinessName').value;
    const rfc = document.getElementById('transRfc').value;
    const concept = document.getElementById('transConcept').value;

    if (!folio) return alert('Ingrese el folio de transferencia');

    paymentData.metodo = 'TRANSFERENCIA';
    paymentData.transferencia = finalTotal;
    paymentData.efectivo = 0;
    paymentData.tarjeta = 0;
    paymentData.reference = folio;
    paymentData.details = {
        folio: folio,
        businessName: bName,
        rfc: rfc,
        concept: concept,
        place: document.getElementById('transPlace').value,
        date: document.getElementById('transDate').value,
        amountLetter: document.getElementById('transAmountLetter').value
    };

    document.getElementById('payTransferencia').value = `$${finalTotal.toFixed(2)}`;
    document.getElementById('payTransFolio').value = folio;
    document.getElementById('payTransRfc').value = rfc;

    // UI details for discount
    const totalDescuentoOps = operationsList.reduce((acc, op) => acc + (op.manual_discount_amount || 0), 0);
    document.getElementById('payDiscount').value = `$${totalDescuentoOps.toFixed(2)}`;
    
    // Capture proof file
    const proofInput = document.getElementById('transProof');
    paymentData.proofFile = proofInput && proofInput.files[0] ? proofInput.files[0] : null;

    const spm = document.getElementById('selectedPaymentMethod');
    if (spm) spm.textContent = '(TRANSFERENCIA)';

    updatePaymentMethodUI('transferencia');
    updateTotals();
    closeDialog('modalTransferencia');
}

function updatePaymentMethodUI(method) {
    // Hide all
    document.querySelectorAll('.payment-method-group').forEach(g => g.classList.add('hidden'));
    
    // Show selected
    if (method === 'efectivo') {
        const group = document.getElementById('groupEfectivo');
        if (group) group.classList.remove('hidden');
    } else if (method === 'tarjeta') {
        const group = document.getElementById('groupTarjeta');
        if (group) group.classList.remove('hidden');
    } else if (method === 'transferencia') {
        const group = document.getElementById('groupTransferencia');
        if (group) group.classList.remove('hidden');
    }
}

// --- HELPERS ---
async function uploadComprobante(file) {
    if (!file) return null;
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `pago_${fileName}`;

        const { data, error } = await db.storage
            .from('comprobantes')
            .upload(filePath, file);

        if (error) {
            if (error.message.includes('bucket not found')) {
                console.error('❌ Error: El bucket "comprobantes" no existe en Supabase Storage.');
                if (typeof mostrarConfirm === 'function') {
                    // Notificar pero no bloquear
                    console.warn('Debe ejecutar el script de configuración de storage en el panel de Supabase.');
                }
            }
            throw error;
        }

        const { data: { publicUrl } } = db.storage
            .from('comprobantes')
            .getPublicUrl(filePath);

        return publicUrl;
    } catch (e) {
        console.warn('⚠️ No se pudo guardar el comprobante digital, pero el cobro continuará:', e.message);
        return null;
    }
}

// --- DIRECT PRINT ---
function triggerDirectPrint(html) {
    const printArea = document.getElementById('receipt-print-area');
    if (printArea) {
        printArea.innerHTML = html;
        // Immediate system print call
        window.print();
    }
}

// --- SAVE & PRINT ---
async function saveAndPrint() {
    if (operationsList.length === 0) {
        if (typeof mostrarAlerta === 'function') await mostrarAlerta('No hay operaciones para guardar');
        else alert('No hay operaciones para guardar');
        return;
    }

    const gtInputAux = document.getElementById('grandTotal');
    const totalAux = parseFloat(gtInputAux?.value.replace('$', '') || '0');

    if (totalAux === 0) {
        paymentData.metodo = 'BECA 100%';
        paymentData.efectivo = 0;
        paymentData.tarjeta = 0;
        paymentData.transferencia = 0;
        paymentData.montoRecibido = 0;
        paymentData.cambio = 0;
    } else if (paymentData.efectivo === 0 && paymentData.tarjeta === 0 && paymentData.transferencia === 0) {
        if (typeof mostrarAlerta === 'function') await mostrarAlerta('Seleccione una forma de pago');
        else alert('Seleccione una forma de pago');
        return;
    }

    const wantInvoice = false; 

    try {
        const receiptNoInput = document.getElementById('currentReceiptNo');
        const stInput = document.getElementById('subtotal');
        const gtInput = document.getElementById('grandTotal');

        // Buscar último número guardado para evitar duplicados
        const { data: lastRec, error: lastRecErr } = await SessionManager.applyIsolation(db.from('recibos'))
            .select('numero')
            .order('numero', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (lastRecErr) throw lastRecErr;
        const currentMax = lastRec?.numero || 0;
        const receiptNo = Math.max(parseInt(receiptNoInput?.value || '0'), currentMax + 1);

        const subtotal = parseFloat(stInput?.value.replace('$', '') || '0');
        const total = parseFloat(gtInput?.value.replace('$', '') || '0');

        const rfcVal = document.getElementById('billingRfc').value;
        const nameVal = document.getElementById('billingName').value;
        const addrVal = document.getElementById('billingAddress').value;
        const discountVal = parseFloat((document.getElementById('payDiscount')?.value || '$0.00').replace('$', '')) || 0;
        const receivedVal = parseFloat((document.getElementById('payAmountReceived')?.value || '$0.00').replace('$', '')) || 0;

        const precioBruto = operationsList.reduce((acc, op) => acc + (op.gross_price * op.qty), 0);
        const totalIva = operationsList.reduce((acc, op) => acc + (op.iva_amount * op.qty), 0);
        const ivaPercent = operationsList.length > 0 ? (operationsList[0].iva_rate * 100) : 0;

        // 0. Upload Proof (if any)
        const proofUrl = await uploadComprobante(paymentData.proofFile);

        // 1. Save Receipt Header
        let rec;
        const receiptData = {
            numero: receiptNo,
            fecha: new Date().toISOString().split('T')[0],
            precio_bruto: precioBruto,
            subtotal: subtotal,
            descuento: discountVal,
            iva: totalIva,
            iva_porcentaje: ivaPercent,
            total: total,
            metodo_pago: paymentData.metodo,
            efectivo: paymentData.efectivo,
            tarjeta: paymentData.tarjeta,
            tarjeta_referencia: paymentData.reference,
            tarjeta_banco: paymentData.details?.bank || '',
            tarjeta_numero: paymentData.details?.cardNumber || '',
            trans_folio: paymentData.metodo === 'TRANSFERENCIA' ? paymentData.reference : '',
            trans_razon_social: paymentData.details?.businessName || '',
            trans_rfc: paymentData.details?.rfc || '',
            trans_concepto: paymentData.details?.concept || '',
            comprobante_url: proofUrl,
            monto_recibido: paymentData.montoRecibido || receivedVal,
            cambio_monto: paymentData.cambio || 0,
            requiere_factura: rfcVal !== '',
            rfc_factura: rfcVal,
            nombre_factura: nameVal,
            direccion_factura: addrVal,
            organizacion_id: SessionManager.getCurrentUser()?.organizacion_id
        };

        const { data: insData, error: insErr } = await db.from('recibos').insert(receiptData).select();
        if (insErr) {
            // Reintento por duplicado
            if (insErr.code === '23505') {
                receiptData.numero = currentMax + 1;
                const { data: retryData, error: retryErr } = await db.from('recibos').insert(receiptData).select();
                if (retryErr) throw retryErr;
                rec = retryData[0];
            } else {
                throw insErr;
            }
        } else {
            rec = insData[0];
        }

        const reciboId = rec.id;

        // 2. Save Operations Details
        const opsToInsert = operationsList.map(op => ({
            recibo_id: reciboId,
            operacion: op.descripcion.toUpperCase(),
            credencial: op.cred || (currentStudent ? currentStudent.credencial : ''),
            cantidad: op.qty || 1,
            monto: op.gross_price || 0,
            iva: op.iva_amount || 0,
            descuento: op.manual_discount_amount || 0,
            neto: op.neto || 0,
            alumno_id: currentStudent ? currentStudent.id : null,
            grupo: currentStudent ? currentStudent.grupo : null,
            articulo_id: (op.articulo_id && typeof op.articulo_id === 'string' && op.articulo_id.startsWith('debt-')) ? null : (op.articulo_id || null),
            mes: op.mes || null,
            anio: op.anio || null,
            organizacion_id: SessionManager.getCurrentUser()?.organizacion_id
        }));

        const { error: opsErr } = await db.from('recibos_detalle').insert(opsToInsert);
        if (opsErr) throw opsErr;

        // --- LÓGICA DE COLEGIATURAS / ANUALIDADES / EXÁMENES ---
        for (const op of operationsList) {
            if (op.is_colegiatura || op.is_anualidad) {
                const anio = op.anio || new Date().getFullYear();
                
                if (op.is_anualidad) {
                    console.log('✓ Procesando ANUALIDAD - Insertando 12 meses');
                    const anualidadRecords = [];
                    for (let m = 1; m <= 12; m++) {
                        anualidadRecords.push({
                            alumno_id: currentStudent.id,
                            recibo_id: reciboId,
                            anio: anio,
                            mes: m,
                            precio: op.gross_price / 12,
                            monto_pagado: op.neto / 12,
                            monto: op.neto / 12, // Backward compatibility
                            grupo: currentStudent.grupo_clave || currentStudent.grupo,
                            curso: op.descripcion,
                            fecha_pago: new Date().toISOString().split('T')[0]
                        });
                    }
                    const { error: colErr } = await db.from('colegiaturas').upsert(anualidadRecords, { onConflict: 'alumno_id,anio,mes' });
                    if (colErr) console.error('Error insertando anualidad:', colErr);
                } else {
                    const mes = op.mes || (new Date().getMonth() + 1);
                    console.log(`✓ Procesando COLEGIATURA - Mes ${mes}, Año ${anio}`);
                    const { error: colErr } = await db.from('colegiaturas').upsert({
                        alumno_id: currentStudent.id,
                        recibo_id: reciboId,
                        anio: anio,
                        mes: mes,
                        precio: op.gross_price,
                        monto_pagado: op.neto,
                        monto: op.neto, // Backward compatibility
                        grupo: currentStudent.grupo_clave || currentStudent.grupo,
                        curso: op.descripcion,
                        fecha_pago: new Date().toISOString().split('T')[0],
                        organizacion_id: SessionManager.getCurrentUser()?.organizacion_id
                    }, { onConflict: 'alumno_id,anio,mes' });
                    if (colErr) console.error('Error insertando colegiatura:', colErr);
                }
            } else if (op.is_examen && op.ref_id) {
                console.log(`✓ Procesando EXAMEN - Ref ${op.ref_id} para alumno ${op.alumno_id || (currentStudent ? currentStudent.id : 'desconocido')}`);
                const targetAlumnoId = op.alumno_id || (currentStudent ? currentStudent.id : null);
                if (targetAlumnoId) {
                    const { error: exErr } = await db.from('examen_alumnos')
                        .update({ 
                            pagado: true, 
                            recibo_id: reciboId 
                        })
                        .eq('examen_id', op.ref_id)
                        .eq('alumno_id', targetAlumnoId);
                    if (exErr) console.error('Error actualizando estatus de examen en examen_alumnos:', exErr);
                    else console.log('✓ Estatus de examen actualizado correctamente');
                } else {
                    console.warn('⚠ No se pudo actualizar el estatus del examen: alumno_id no definido');
                }
            } else if (op.articulo_id) {
                // --- LÓGICA DE INVENTARIO: DESCONTAR STOCK ---
                console.log(`✓ Procesando ARTÍCULO - Descontando stock de ${op.articulo_id}`);
                try {
                    const { data: art, error: artErr } = await db.from('articulos').select('stock').eq('id', op.articulo_id).single();
                    if (!artErr && art && art.stock !== null) {
                        const nuevoStock = art.stock - (op.qty || 1);
                        await db.from('articulos').update({ stock: nuevoStock }).eq('id', op.articulo_id);
                        console.log(`   Nuevo stock para ${op.articulo_id}: ${nuevoStock}`);
                    }
                } catch (stockE) {
                    console.error('Error descontando stock:', stockE);
                }
            }
        }
        // --------------------------------------------

        if (typeof mostrarAlerta === 'function') {
            await mostrarAlerta('Recibo guardado exitosamente');
        } else {
            alert('Recibo guardado exitosamente');
        }

        // 3. Document Generation
        const pdfData = {
            reciboNo: receiptNo,
            fecha: new Date().toLocaleDateString(),
            cliente: nameVal || (currentStudent ? currentStudent.nombre : 'PÚBLICO EN GENERAL'),
            rfc: rfcVal || 'XAXX010101000',
            total: total,
            filas: operationsList.map(op => ({
                cantidad: op.qty || 1,
                operacion: (op.descripcion || op.nombre || '').toUpperCase(),
                precio: op.gross_price || 0,
                iva: op.iva_amount || 0,
                neto: op.neto || 0
            })),
            metodoPago: paymentData.metodo
        };

        // Generar PDF con Branding Dinámico
        await PDFGenerator.generarRecibo(pdfData);

        // Fallback: Direct Print HTML (opcional, si se quiere conservar el estilo anterior)
        // const docHtml = generatePrintReceipt(receiptNo, subtotal, totalIva, total, operationsList, true);
        // triggerDirectPrint(docHtml);

        // Reiniciar la vista
        setTimeout(() => location.reload(), 2000);

    } catch (e) {
        console.error('Error guardando:', e);
        if (typeof mostrarAlerta === 'function') await mostrarAlerta('Error al guardar: ' + e.message);
        else alert('Error al guardar: ' + e.message);
    }
}

function generatePrintReceipt(receiptNo, subtotal, iva, total, ops = [], returnOnly = false, overrideClient = '', overrideRfc = '') {
    const now = new Date();
    const dateStr = now.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Dynamic Data from DOM and currentStudent
    const studentName = currentStudent ? currentStudent.nombre : '';
    const studentApellidos = currentStudent ? (currentStudent.apellidos || '') : '';
    const fullStudentName = `${studentName} ${studentApellidos}`.trim() || 'N/A';
    
    // Billing Variables
    const bName = document.getElementById('billingName')?.value || (currentStudent ? currentStudent.nombre_padre : '') || 'PUBLICO EN GENERAL';
    const bRfc = document.getElementById('billingRfc')?.value || (currentStudent ? currentStudent.rfc_tutor : '') || 'XAXX010101000';
    const bAddr = document.getElementById('billingAddress')?.value || (currentStudent ? currentStudent.direccion1 : '') || '-';
    const bEmail = document.getElementById('billingEmail')?.value || (currentStudent ? currentStudent.email : '') || '-';
    
    const paymentMethodText = document.getElementById('selectedPaymentMethod')?.textContent || 'EFECTIVO';

    let itemsHtml = '';
    ops.forEach(op => {
        const discountPercent = op.scholarship_applied ? op.scholarship_percent : (op.manual_discount_percent || 0);
        const lineNeto = op.neto || (op.gross_price * op.qty);
        const opName = (op.descripcion || op.operacion || '').toUpperCase();
        
        // Highlight enrollment types
        const isInscripcion = opName.includes('INSCRIPCION') || opName.includes('RE-INSCRIPCION');
        const displayOpName = isInscripcion ? `*** ${opName} ***` : opName;

        itemsHtml += `
            <tr style="border: none;">
                <td style="text-align:center; padding: 4px 2px; border: none;">${op.qty || 1}</td>
                <td style="text-align:center; padding: 4px 2px; border: none;">${op.cred || (currentStudent ? currentStudent.credencial1 : '')}</td>
                <td style="text-align:left; padding: 4px 2px; border: none;">${displayOpName}</td>
                <td style="text-align:right; padding: 4px 2px; border: none;">$${(op.gross_price || 0).toFixed(2)}</td>
                <td style="text-align:right; padding: 4px 2px; border: none;">$${(op.iva_amount || 0).toFixed(2)}</td>
                <td style="text-align:center; padding: 4px 2px; border: none;">${discountPercent > 0 ? discountPercent + '%' : '-'}</td>
                <td style="text-align:right; padding: 4px 2px; border: none;">$${lineNeto.toFixed(2)}</td>
            </tr>
        `;
    });

    const totalLetra = numberToWordsSpanish(total);

    const html = `
    <style>
        @media print {
            @page {
                size: 5.5in 8.5in; /* Media Carta Landscape */
                margin: 10mm;
            }
            body { margin: 0; padding: 0; background: white; font-family: 'Courier New', Courier, monospace; }
        }
        .receipt-container {
            width: 100%;
            height: 100%;
            color: #000;
            background: #fff;
            box-sizing: border-box;
        }
        .receipt-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 5mm;
        }
        .receipt-logo img {
            max-width: 150px;
            display: block;
        }
        .receipt-phone {
            font-size: 10pt;
            font-weight: bold;
            margin-top: 2mm;
        }
        .receipt-folio-box {
            text-align: right;
            line-height: 1.4;
        }
        .receipt-billing {
            margin-bottom: 4mm;
            font-size: 10pt;
            line-height: 1.3;
        }
        .receipt-meta-bar {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
            font-size: 11pt;
            margin-bottom: 2mm;
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
            padding: 1.5mm 0;
        }
        .receipt-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10pt;
        }
        .receipt-table th {
            border-bottom: 1px solid #000;
            padding: 4px 2px;
            text-transform: uppercase;
        }
        .summary-container {
            margin-top: 6mm;
            display: flex;
            justify-content: space-between;
        }
        .words-and-method {
            width: 65%;
            font-size: 10pt;
        }
        .totals-box {
            width: 30%;
            text-align: right;
            font-size: 11pt;
            line-height: 1.4;
        }
        .heavy-total {
            font-size: 13pt;
            font-weight: 900;
            border-top: 1.5px solid #000;
            margin-top: 1mm;
            padding-top: 1mm;
        }
    </style>
    <div class="receipt-container">
        <div class="receipt-header">
            <div class="receipt-logo">
                <img src="file:///C:/Users/PC05/Downloads/Scala/Scala%20logo.png" alt="Logo Scala" style="max-width: 150px; display: block; margin: 0 auto;">
                <div class="receipt-phone">TEL. 9999 261760</div>
            </div>
            <div class="receipt-folio-box">
                <div style="font-size: 14pt; font-weight: 900;">FOLIO: ${receiptNo}</div>
                <div style="font-size: 11pt;">${dateStr}</div>
                <div style="font-size: 10pt;">${timeStr}</div>
            </div>
        </div>

        <div class="receipt-billing">
            <strong>CLIENTE:</strong> ${bName}<br>
            <strong>RFC:</strong> ${bRfc}<br>
            <strong>DOMICILIO:</strong> ${bAddr}<br>
            <strong>CORREO:</strong> ${bEmail}
        </div>

        <div class="receipt-meta-bar">
            <span>DETALLE DEL MOVIMIENTO</span>
            <span>ALUMNO: ${fullStudentName.toUpperCase()}</span>
        </div>

        <table class="receipt-table">
            <thead>
                <tr>
                    <th style="width: 8%;">CANT.</th>
                    <th style="width: 12%;">CLAVE</th>
                    <th style="width: 36%; text-align: left;">OPERACIÓN</th>
                    <th style="width: 12%; text-align: right;">P. UNIT</th>
                    <th style="width: 10%; text-align: right;">IVA</th>
                    <th style="width: 10%; text-align: center;">DESC%</th>
                    <th style="width: 12%; text-align: right;">NETO</th>
                </tr>
            </thead>
            <tbody>
                ${itemsHtml}
            </tbody>
        </table>

        <div class="summary-container">
            <div class="words-and-method">
                <p style="margin: 0; font-style: italic;">SON: (${totalLetra.toUpperCase()})</p>
                <p style="margin-top: 4mm; font-weight: bold; border-left: 3px solid #000; padding-left: 10px;">
                    FORMA DE PAGO: ${paymentMethodText.toUpperCase()}
                </p>
            </div>
            <div class="totals-box">
                <div>SUBTOTAL: $${(subtotal || 0).toFixed(2)}</div>
                <div>IVA (16%): $${(iva || 0).toFixed(2)}</div>
                <div class="heavy-total">TOTAL: $${(total || 0).toFixed(2)}</div>
            </div>
        </div>
    </div>
    `;

    return html;
}

// --- NEW OPERATION ---
let currentEditOperationId = null;

function openNewOperationModal() {
    currentEditOperationId = null;
    const m = document.getElementById('modalNewOperation');
    if (m) {
        m.querySelector('h2').textContent = 'Crear Nueva Operación';
        document.getElementById('newOpName').value = '';
        document.getElementById('newOpPrice').value = '0.00';
        document.getElementById('newOpIva').value = '0.00';

        const activeInput = document.getElementById('newOpActive');
        if (activeInput) activeInput.checked = true;

        m.style.display = 'flex';
        const input = document.getElementById('newOpName');
        if (input) input.focus();
    }
}

function openEditOperationModal(op) {
    currentEditOperationId = op.id;
    const m = document.getElementById('modalNewOperation');
    if (m) {
        m.querySelector('h2').textContent = 'Editar Operación';
        document.getElementById('newOpName').value = op.nombre;
        document.getElementById('newOpPrice').value = op.precio;
        document.getElementById('newOpIva').value = op.iva;

        const activeInput = document.getElementById('newOpActive');
        if (activeInput) activeInput.checked = op.activo;

        m.style.display = 'flex';
        const input = document.getElementById('newOpName');
        if (input) input.focus();
    }
}

async function saveNewOperation() {
    const name = document.getElementById('newOpName').value.trim();
    const price = parseFloat(document.getElementById('newOpPrice').value) || 0;
    const iva = parseFloat(document.getElementById('newOpIva').value) || 0;

    // Default to true if checkbox is missing from DOM
    let isActivo = true;
    const activeInput = document.getElementById('newOpActive');
    if (activeInput) {
        isActivo = activeInput.checked;
    }

    if (!name) return alert('Ingrese el nombre de la operación');

    try {
        let response;
        if (currentEditOperationId) {
            response = await db.from('operaciones').update({
                nombre: name.toUpperCase(),
                precio: price,
                iva: iva,
                activo: isActivo
            }).eq('id', currentEditOperationId).select();
        } else {
            response = await db.from('operaciones').insert({
                nombre: name.toUpperCase(),
                precio: price,
                iva: iva,
                activo: isActivo
            }).select();
        }

        if (response.error) {
            console.error(response.error);
            throw response.error;
        }

        alert('Operación guardada exitosamente');
        closeDialog('modalNewOperation');

        // Refresh grid
        irPagina(lookupCurrentPage);
    } catch (e) {
        alert('Error al guardar operación: ' + (e.message || 'El nombre ya existe'));
    }
}

// --- UTILS ---
function closeDialog(id) {
    const d = document.getElementById(id);
    if (d) {
        d.style.display = 'none';
    }
}

let selectedRowIndex = -1;
function selectRow(index) {
    selectedRowIndex = index;
    // Highlight logic
    const rows = document.querySelectorAll('#operationsBody tr');
    rows.forEach(r => r.style.background = '');
    if (rows[index]) rows[index].style.background = '#e0f7fa';

    // Update details display
    const op = operationsList[index];
    if (op) {
        const dispOp = document.getElementById('displayOperation');
        if (dispOp) dispOp.textContent = op.descripcion;
        
        // Also keep sync with hidden opName if needed
        const hiddenOpName = document.getElementById('opName');
        if (hiddenOpName) hiddenOpName.textContent = op.descripcion;

        document.getElementById('opPrice').value = `$${(op.gross_price || 0).toFixed(2)}`;
        document.getElementById('opIva').value = op.iva_rate + '%';
    }
}

function deleteSelectedOperation() {
    if (selectedRowIndex === -1) return alert('Seleccione una operación de la tabla');
    deleteRow(selectedRowIndex);
}

async function deleteRow(index, event) {
    if (event) event.stopPropagation();
    
    const op = operationsList[index];
    if (op && op.locked) {
        await mostrarAlerta('Esta operación está bloqueada y no se puede eliminar de este recibo.');
        return;
    }

    if (!await mostrarConfirm('¿Seguro que desea quitar esta operación?')) return;
    operationsList.splice(index, 1);
    renderOperations();
}

// --- DRAGGABLE ---
function makeDraggable(elementId, handleId) {
    const el = document.getElementById(elementId);
    const handle = document.getElementById(handleId);
    if (!el || !handle) return;

    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    handle.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;

        let newTop = el.offsetTop - pos2;
        let newLeft = el.offsetLeft - pos1;

        el.style.top = newTop + "px";
        el.style.left = newLeft + "px";
        el.style.margin = "0";
        el.style.position = "absolute";
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

// --- UTILS: NUMEROS A LETRAS ---
function numberToWordsSpanish(n) {
    const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
    const decenas = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
    const decenasN = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

    function convertir(num) {
        if (num === 0) return 'CERO';
        if (num === 100) return 'CIEN';
        let res = '';
        if (num >= 100) {
            res += centenas[Math.floor(num / 100)] + ' ';
            num %= 100;
        }
        if (num >= 20) {
            res += decenasN[Math.floor(num / 10)] + (num % 10 > 0 ? ' Y ' + unidades[num % 10] : '');
        } else if (num >= 10) {
            res += decenas[num - 10];
        } else if (num > 0) {
            res += unidades[num];
        }
        return res.trim();
    }

    const entero = Math.floor(n);
    const decimal = Math.round((n - entero) * 100);
    let letras = '';

    if (entero >= 1000000) {
        let millones = Math.floor(entero / 1000000);
        letras += (millones === 1 ? 'UN MILLON' : convertir(millones) + ' MILLONES') + ' ';
        letras += convertir(Math.floor((entero % 1000000) / 1000)) + ' MIL ';
        letras += convertir(entero % 1000);
    } else if (entero >= 1000) {
        let miles = Math.floor(entero / 1000);
        letras += (miles === 1 ? 'MIL' : convertir(miles) + ' MIL') + ' ';
        letras += convertir(entero % 1000);
    } else {
        letras = convertir(entero);
    }

    return (letras + ' PESOS ' + (decimal < 10 ? '0' : '') + decimal + '/100 M.N.').replace(/\s+/g, ' ');
}

// --- GESTION DE FACTURAS Y BUSQUEDA ---

async function openSearchTransactionModal() {
    searchCurrentPage = 1;
    closeDialog('modalLookup');
    const m = document.getElementById('modalSearchTransaction');
    if (m) m.style.display = 'flex';
    doSearchTransaction();
}

async function irPaginaBusqueda(p) {
    const totalPaginas = Math.ceil(searchTotalRecords / searchRowsPerPage) || 1;
    if (p < 1) p = 1;
    if (p > totalPaginas) p = totalPaginas;
    searchCurrentPage = p;
    doSearchTransaction();
}

async function doSearchTransaction() {
    const inputField = document.getElementById('searchTransactionInput');
    const input = inputField ? inputField.value.trim().toLowerCase() : '';
    const tbody = document.getElementById('searchTransactionBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center">Buscando...</td></tr>';

    try {
        const from = (searchCurrentPage - 1) * searchRowsPerPage;
        const to = from + searchRowsPerPage - 1;

        let query = db.from('recibos').select('*', { count: 'exact' });

        if (input) {
            // Basic search in folio or cliente (nombre_factura)
            if (!isNaN(input)) {
                query = query.eq('numero', parseInt(input));
            } else {
                query = query.ilike('nombre_factura', `%${input}%`);
            }
        }

        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) throw error;

        searchTotalRecords = count || 0;
        const totalPaginas = Math.ceil(searchTotalRecords / searchRowsPerPage) || 1;

        const pagInfo = document.getElementById('searchPagInfo');
        if (pagInfo) pagInfo.textContent = `Página ${searchCurrentPage} de ${totalPaginas}`;

        const countInfo = document.getElementById('searchTransactionPagInfo');
        if (countInfo) countInfo.textContent = `Registros totales: ${searchTotalRecords}`;

        tbody.innerHTML = '';
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center">No se encontraron resultados</td></tr>';
            return;
        }

        data.forEach(r => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${r.numero}</td>
                <td>${new Date(r.created_at).toLocaleDateString()}</td>
                <td>${r.nombre_factura || 'N/A'}</td>
                <td>$${(r.total || 0).toFixed(2)}</td>
                <td>${r.metodo_pago || 'N/A'}</td>
                <td>
                    <button class="btn-action" onclick="reprintDocument(${r.numero}, 'receipt')">Recibo</button>
                </td>
                <td style="text-align:center">
                    ${r.comprobante_url ? `<button class="btn-action" onclick="window.open('${r.comprobante_url}', '_blank')" style="background:#2c5282; border-color:#2a4365">Ver</button>` : 'N/A'}
                </td>
                <td style="text-align:center">
                    <button class="btn-action" onclick="cancelTransaction('${r.id}')" style="background:#d9534f; border-color:#d43f3a; padding: 5px 10px;">
                        <span style="font-size: 18px;">🗑️</span>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error('Error buscando:', e);
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:red">Error al buscar</td></tr>';
    }
}

async function cancelTransaction(id) {
    if (!await mostrarConfirm('¿Cancelar recibo? Esta acción moverá el registro al historial de cancelados y regresará el stock a inventario.')) return;

    try {
        // 1. Obtener datos del recibo y sus detalles
        const { data: receipt, error: rErr } = await db.from('recibos').select('*').eq('id', id).single();
        if (rErr) throw rErr;

        const { data: details, error: dErr } = await db.from('recibos_detalle').select('*').eq('recibo_id', id);
        if (dErr) throw dErr;

        // 2. Mover a tablas de cancelados con METADATOS COMPLETOS
        const { data: cancHeader, error: hErr } = await db.from('recibos_cancelados').insert({
            original_id: receipt.id,
            numero: receipt.numero,
            fecha_recibo: receipt.created_at,
            cliente_nombre: receipt.nombre_factura,
            cliente_rfc: receipt.rfc_factura,
            metodo_pago: receipt.metodo_pago,
            total: receipt.total,
            subtotal: receipt.subtotal,
            descuento: receipt.descuento,
            iva: receipt.iva || 0,
            monto_recibido: receipt.monto_recibido || 0,
            cambio_monto: receipt.cambio_monto || 0,
            direccion_factura: receipt.direccion_factura || '',
            trans_folio: receipt.trans_folio || '',
            trans_razon_social: receipt.trans_razon_social || '',
            trans_rfc: receipt.trans_rfc || '',
            trans_concepto: receipt.trans_concepto || '',
            tarjeta_referencia: receipt.tarjeta_referencia || '',
            tarjeta_banco: receipt.tarjeta_banco || '',
            tarjeta_numero: receipt.tarjeta_numero || '',
            comprobante_url: receipt.comprobante_url,
            motivo_cancelacion: 'Cancelación manual por el usuario'
        }, { onConflict: 'numero' }).select().single();

        if (hErr) throw hErr;

        const detailsToInsert = (details || []).map(d => ({
            recibo_cancelado_id: cancHeader.id,
            credencial: d.credencial,
            operacion: d.operacion,
            articulo_id: (d.articulo_id && typeof d.articulo_id === 'string' && d.articulo_id.startsWith('debt-')) ? null : (d.articulo_id || null),
            cantidad: d.cantidad,
            monto_unitario: d.monto,
            neto: d.neto,
            descuento_porcentaje: d.porcentaje_beca || 0
        }));

        if (detailsToInsert.length > 0) {
            const { error: diErr } = await db.from('recibos_detalle_cancelados').insert(detailsToInsert);
            if (diErr) throw diErr;
        }

        // 3. Restaurar stock de cada artículo
        for (const item of (details || [])) {
            if (item.articulo_id) {
                const { data: art } = await db.from('articulos').select('stock').eq('id', item.articulo_id).single();
                if (art) {
                    await db.from('articulos').update({ stock: art.stock + item.cantidad }).eq('id', item.articulo_id);
                }
            }
        }

        // 4. Eliminar el recibo original (cascade borrará los detalles activos)
        const { error: delErr } = await db.from('recibos').delete().eq('id', id);
        if (delErr) throw delErr;

        alert('Recibo cancelado y stock restaurado exitosamente');
        doSearchTransaction(); // Recarga la lista activa sin preguntar
    } catch (e) {
        console.error('Error al cancelar:', e);
        alert('Error al cancelar: ' + e.message);
    }
}

// --- CANCELLED RECEIPTS HISTORY ---
let cancelledCurrentPage = 1;
const cancelledRowsPerPage = 10;
let cancelledTotalRecords = 0;

async function searchCancelledReceipts() {
    const input = document.getElementById('cancelledSearchInput');
    const term = input ? input.value.trim() : '';
    const tbody = document.getElementById('cancelledReceiptsBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center">Buscando...</td></tr>';

    try {
        const from = (cancelledCurrentPage - 1) * cancelledRowsPerPage;
        const to = from + cancelledRowsPerPage - 1;

        let query = db.from('recibos_detalle_cancelados').select('*, recibos_cancelados(*)', { count: 'exact' });

        if (term) {
            query = query.ilike('credencial', `%${term}%`);
        }

        const { data, count, error } = await query
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) throw error;

        cancelledTotalRecords = count || 0;
        const totalPaginas = Math.ceil(cancelledTotalRecords / cancelledRowsPerPage) || 1;
        
        const pagInfo = document.getElementById('cancelPagInfo');
        if (pagInfo) pagInfo.textContent = `Página ${cancelledCurrentPage} de ${totalPaginas}`;
        
        const totalInfo = document.getElementById('cancelTotalInfo');
        if (totalInfo) totalInfo.textContent = `Registros totales: ${cancelledTotalRecords}`;

        tbody.innerHTML = '';
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center">No se encontraron recibos cancelados</td></tr>';
            return;
        }

        data.forEach(d => {
            const h = d.recibos_cancelados || {};
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${d.credencial || 'N/A'}</td>
                <td>${d.operacion}</td>
                <td>$${(d.neto || 0).toFixed(2)}</td>
                <td>${d.cantidad}</td>
                <td>${(d.descuento_porcentaje || 0).toFixed(2)}%</td>
                <td>${h.metodo_pago || 'N/A'}</td>
                <td>${new Date(h.fecha_cancelacion).toLocaleDateString()}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error('Error buscando cancelados:', e);
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:red">Error al buscar historial</td></tr>';
    }
}

async function reprintDocument(numero, type) {
    try {
        const { data: receipt, error } = await db.from('recibos').select('*').eq('numero', numero).maybeSingle();
        if (error || !receipt) throw new Error('No se encontró el recibo');

        const { data: ops } = await db.from('recibos_detalle').select('*').eq('recibo_id', receipt.id);

        // Convert operations to the UI format
        const opsFormatted = (ops || []).map(o => ({
            cred: o.credencial || 'N/A',
            descripcion: o.operacion,
            qty: o.cantidad,
            gross_price: o.monto,
            neto: o.neto,
            manual_discount_amount: o.descuento || 0,
            manual_discount_percent: o.descuento_porcentaje || 0,
            iva_rate: 0.16
        }));

        let docHtml = '';
        if (type === 'invoice') {
            docHtml = generateInvoiceHTML(receipt, opsFormatted, true);
        } else {
            // For reprint, we use the header data
            docHtml = generatePrintReceipt(
                receipt?.numero || 0, 
                receipt?.subtotal || 0, 
                receipt?.iva || 0, 
                receipt?.total || 0, 
                opsFormatted, 
                true,
                receipt?.nombre_factura, // clientName
                receipt?.rfc_factura      // rfc
            );
        }

        closeDialog('modalSearchTransaction');
        triggerDirectPrint(docHtml);

    } catch (e) {
        alert('Error al reimprimir: ' + e.message);
    }
}

function generateInvoiceHTML(receipt, ops = [], returnOnly = false) {
    const letra = numberToWordsSpanish((receipt?.total || 0));

    let itemsHtml = '';
    ops.forEach(op => {
        itemsHtml += `
            <tr>
                <td style="text-align:center">${op.qty || 1}</td>
                <td style="text-align:center">E48</td>
                <td>86121700<br>${op.descripcion || op.operacion}</td>
                <td style="text-align:right">$${(op.price || op.monto || 0).toFixed(2)}</td>
                <td style="text-align:right">$${(op.neto || 0).toFixed(2)}</td>
            </tr>
        `;
    });

    const html = `
        <div class="invoice-print-container">
            <div class="invoice-header-flex">
                <div class="invoice-logo-section">
                    <div class="invoice-qr-placeholder">LOGO<br>IMAGE</div>
                    <div class="invoice-company-info">
                        <div class="invoice-company-name">SISTEMA SCALA</div>
                        <p>RFC: SCA010101XX1</p>
                        <p>Domicilio: Av. Tecnológico 100, Mérida, Yuc.</p>
                        <p>Régimen Fiscal: 601 - General de Ley Personas Morales</p>
                    </div>
                </div>
                <div class="invoice-title-section">
                    <h2>COMPROBANTE FISCAL DIGITAL</h2>
                    <p>Tipo de Comprobante: I - Ingreso</p>
                    <p>Lugar de Expedición: 97279</p>
                </div>
            </div>

            <div class="invoice-meta-grid">
                <div class="invoice-grid-item">
                    <b>Forma de pago:</b> ${(receipt?.efectivo || 0) > 0 ? '01 - Efectivo' : '28 - Tarjeta de débito'}<br>
                    <b>Método de pago:</b> PUE - Pago en una sola exhibición<br>
                    <b>Moneda:</b> MXN - Peso Mexicano
                </div>
                <div class="invoice-grid-item" style="text-align:right">
                    <b>Folio:</b> ${receipt.numero}<br>
                    <b>Fecha:</b> ${new Date(receipt?.created_at || Date.now()).toLocaleString()}
                </div>
            </div>

            <div class="invoice-section-title">Datos del cliente</div>
            <div class="invoice-client-info">
                <b>Cliente:</b> ${receipt.nombre_factura || 'N/A'}<br>
                <b>R.F.C.:</b> ${receipt.rfc_factura || 'XAXX010101000'} &nbsp;&nbsp;&nbsp; <b>Uso CFDI:</b> G03 - Gastos en general<br>
                <b>Domicilio:</b> ${receipt.direccion_factura || 'No proporcionado'}
            </div>

            <table class="invoice-table">
                <thead>
                    <tr>
                        <th style="width:10%">CANTIDAD</th>
                        <th style="width:10%">UNIDAD</th>
                        <th>CONCEPTO / DESCRIPCIÓN</th>
                        <th style="width:15%">VALOR UNITARIO</th>
                        <th style="width:15%">IMPORTE</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>

            <div class="invoice-summary-area">
                <div class="invoice-letter-amount">
                    Importe con letra:<br>
                    ${letra}
                </div>
                <table class="invoice-totals-table">
                    <tr><td>Subtotal</td><td style="text-align:right">$${(receipt.subtotal || 0).toFixed(2)}</td></tr>
                    <tr><td>IVA (16%)</td><td style="text-align:right">$${(receipt.iva || 0).toFixed(2)}</td></tr>
                    <tr class="total-row"><td>Total</td><td style="text-align:right">$${((receipt?.total) || 0).toFixed(2)}</td></tr>
                </table>
            </div>

            <div class="invoice-footer-qr">
                <div class="invoice-qr-placeholder">QR CODE<br>STAMP</div>
                <div>
                    <p>Este documento es una representación impresa de un CFDI</p>
                    <p>Serie del Certificado del emisor: 0000100000050...</p>
                    <p>Folio fiscal: UUID-EXAMPLE-1234-5678</p>
                </div>
            </div>
        </div>
    `;

    if (returnOnly) return html;
    triggerDirectPrint(html);
}

const ltBtn = document.getElementById('lookupTransaction');
if (ltBtn) ltBtn.onclick = openSearchTransactionModal;

const dstBtn = document.getElementById('btnDoSearchTransaction');
if (dstBtn) dstBtn.onclick = doSearchTransaction;

async function deleteOperationCatalog(op) {
    const confirmDelete = confirm(`¿Estás SEGURO de que deseas eliminar permanentemente la operación "${op.nombre}"? Esto no afectará recibos anteriores, solo el catálogo.`);
    if (!confirmDelete) return;

    try {
        const { error } = await db.from('operaciones').delete().eq('id', op.id);
        if (error) throw error;
        alert('Operación eliminada con éxito');
        irPagina(lookupCurrentPage);
    } catch (e) {
        alert('Error eliminando: ' + e.message);
    }
}

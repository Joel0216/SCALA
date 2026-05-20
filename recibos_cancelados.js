// recibos_cancelados.js - Standalone module for auditing cancelled receipts

let db = null;
let currentFolio = null; // Essential for printing
let currentStudent = null;

// Helper to get DB safely
async function getDb() {
    if (db) return db;
    try {
        db = await window.waitForSupabase();
        return db;
    } catch (e) {
        console.error("No se pudo conectar a Supabase:", e);
        return null;
    }
}

// Initial state
setupEventListeners();
initDatetime();

// Try to get DB early
getDb();

document.addEventListener('DOMContentLoaded', async () => {
    setupEventListeners();

    // ── Selector de Organización SuperAdmin ─────────────────────
    const dbInst = await getDb();
    if (dbInst) {
        const user = SessionManager.getCurrentUser();
        if (user && user.rol === 'SuperAdmin') {
            const container = document.getElementById('superAdminSelectorContainer');
            const select = document.getElementById('superAdminOrgSelect');
            if (container && select) {
                container.style.display = 'flex';
                try {
                    const { data: orgs } = await dbInst.from('organizaciones').select('id, nombre').order('nombre');
                    if (orgs) {
                        orgs.forEach(o => {
                            const opt = document.createElement('option');
                            opt.value = o.id;
                            opt.textContent = o.nombre;
                            select.appendChild(opt);
                        });
                    }
                    const saved = sessionStorage.getItem('superadmin_org_id');
                    if (saved) select.value = saved;
                } catch(e) { console.warn('Error cargando orgs:', e); }
                
                select.addEventListener('change', (e) => {
                    const val = e.target.value;
                    if (val && val !== 'all') {
                        sessionStorage.setItem('superadmin_org_id', val);
                    } else {
                        sessionStorage.removeItem('superadmin_org_id');
                    }
                    // Limpiar formulario y relanzar búsqueda con nueva org
                    document.getElementById('cancelledCredInput').value = '';
                    document.getElementById('cancelledFolioSelect').innerHTML = '<option value="">-- Seleccionar --</option>';
                    document.getElementById('cancelledItemsBody').innerHTML = '';
                });
            }
        }
    }
    // ────────────────────────────────────────────────────────────
});

function initDatetime() {
    const dt = document.getElementById('datetime');
    if (!dt) return;
    const update = () => {
        const now = new Date();
        dt.innerText = now.toLocaleString('es-MX', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        }).toUpperCase();
    };
    update();
    setInterval(update, 1000);
}

function setupEventListeners() {
    const btnLupa = document.getElementById('btnLookupCancelledStudent');
    const btnSearch = document.getElementById('btnSearchCancelled');
    const btnPrint = document.getElementById('btnPrintCancelled');
    const folioSelect = document.getElementById('cancelledFolioSelect');
    const lookInput = document.getElementById('lookupStudentInput');

    if (btnLupa) btnLupa.onclick = () => openModal('modalLookupStudentCancelled');
    if (btnSearch) btnSearch.onclick = () => openModal('modalLookupStudentCancelled');
    
    if (folioSelect) {
        folioSelect.onchange = (e) => {
            if (e.target.value) {
                loadFolioData(e.target.value);
            } else {
                clearForm();
            }
        };
    }

    if (lookInput) {
        lookInput.onkeypress = (e) => {
            if (e.key === 'Enter') searchStudentsWithCancelled();
        };
    }

    if (btnPrint) btnPrint.onclick = printCancelled;
}

/**
 * Global function to open a modal by ID
 */
function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.style.display = 'flex';
        if (id === 'modalLookupStudentCancelled') {
            searchStudentsWithCancelled();
        }
    }
}

/**
 * Global function to close a dialogue
 */
function closeDialog(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'none';
}

/**
 * Search only students that have cancelled records
 */
async function searchStudentsWithCancelled() {
    const term = document.getElementById('lookupStudentInput').value.trim();
    const body = document.getElementById('lookupStudentBody');
    body.innerHTML = '<tr><td colspan="3" style="text-align:center;">Buscando...</td></tr>';

    const client = await getDb();
    if (!client) {
        body.innerHTML = '<tr><td colspan="3" style="text-align:center; color:red;">Error de conexión a la base de datos.</td></tr>';
        return;
    }

    try {
        // Obtener el org_id efectivo (funciona para SuperAdmin con org seleccionada y para usuarios normales)
        const orgId = SessionManager.getEffectiveOrgId();

        // Query unique students from recibos_detalle_cancelados
        let query = client
            .from('recibos_detalle_cancelados')
            .select(`
                credencial,
                recibos_cancelados!inner(cliente_nombre, organizacion_id)
            `);

        // Aplicar filtro de organización directamente si tenemos orgId
        if (orgId) {
            query = query.eq('recibos_cancelados.organizacion_id', orgId);
        }

        if (term) {
            query = query.or(`credencial.ilike.%${term}%,recibos_cancelados.cliente_nombre.ilike.%${term}%`);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Group by credencial to show unique students
        const uniqueStudents = [];
        const seen = new Set();
        
        data.forEach(row => {
            if (!seen.has(row.credencial)) {
                seen.add(row.credencial);
                const count = data.filter(r => r.credencial === row.credencial).length;
                uniqueStudents.push({
                    cred: row.credencial,
                    nombre: row.recibos_cancelados?.cliente_nombre || 'Desconocido',
                    count: count
                });
            }
        });

        if (uniqueStudents.length === 0) {
            body.innerHTML = '<tr><td colspan="3" style="text-align:center;">No se encontraron cancelaciones.</td></tr>';
            return;
        }

        body.innerHTML = '';
        uniqueStudents.forEach(st => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${st.cred}</td>
                <td>${st.nombre}</td>
                <td style="text-align:center;">${st.count} registros</td>
            `;
            tr.onclick = () => selectStudent(st.cred, st.nombre);
            body.appendChild(tr);
        });

    } catch (e) {
        console.error('Error en búsqueda:', e);
        body.innerHTML = '<tr><td colspan="3" style="text-align:center; color:red;">Error al cargar.</td></tr>';
    }
}

async function selectStudent(cred, nombre) {
    const credInput = document.getElementById('cancelledCredInput');
    if (credInput) credInput.value = `${cred} - ${nombre}`;
    closeDialog('modalLookupStudentCancelled');
    
    const client = await getDb();
    if (!client) return;

    // Fetch all folios for this student
    try {
        const orgId = SessionManager.getEffectiveOrgId();
        let folioQuery = client
            .from('recibos_detalle_cancelados')
            .select('recibos_cancelados(numero, id, organizacion_id)')
            .eq('credencial', cred);
        
        if (orgId) {
            folioQuery = folioQuery.eq('recibos_cancelados.organizacion_id', orgId);
        }
        const { data, error } = await folioQuery;

        if (error) throw error;

        // Unique folios
        const seenFolios = new Set();
        const folios = [];
        data.forEach(d => {
            if (d.recibos_cancelados && !seenFolios.has(d.recibos_cancelados.numero)) {
                seenFolios.add(d.recibos_cancelados.numero);
                folios.push(d.recibos_cancelados);
            }
        });

        const select = document.getElementById('cancelledFolioSelect');
        select.innerHTML = '<option value="">-- Seleccionar Folio (Opcional) --</option>';
        folios.forEach(f => {
            const opt = document.createElement('option');
            opt.value = f.numero;
            opt.textContent = `FOLIO #${f.numero}`;
            select.appendChild(opt);
        });

        // AUTO-LOAD THE MOST RECENT CANCELLED RECEIPT
        // This satisfies the "Credencial is enough" request
        if (folios.length > 0) {
            select.value = folios[0].numero;
            loadFolioData(folios[0].numero);
        }

    } catch (e) {
        console.error('Error cargando folios:', e);
    }
}

async function loadFolioData(folio) {
    const client = await getDb();
    if (!client) return;

    try {
        // 1. Fetch Header
        const orgId = SessionManager.getEffectiveOrgId();
        let headerQuery = client
            .from('recibos_cancelados')
            .select('*')
            .eq('numero', folio);
        if (orgId) {
            headerQuery = headerQuery.eq('organizacion_id', orgId);
        }
        const { data: header, error: hErr } = await headerQuery.maybeSingle();

        if (hErr) throw hErr;
        currentFolio = header;

        // 2. Fetch Details
        let detailsQuery = client
            .from('recibos_detalle_cancelados')
            .select('*')
            .eq('recibo_cancelado_id', header.id);
        if (orgId) {
            detailsQuery = detailsQuery.eq('organizacion_id', orgId);
        }
        const { data: details, error: dErr } = await detailsQuery;

        if (dErr) throw dErr;

        // 3. Populate Form (With safety checks)
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.value = val;
        };

        setVal('cancelledReceiptFolio', header.numero);
        setVal('cancelledReason', header.motivo_cancelacion || 'Cancelado por el usuario');
        
        const dateObj = new Date(header.fecha_recibo || header.created_at);
        setVal('cancelledDate', dateObj.toLocaleDateString());
        setVal('cancelledTime', dateObj.toLocaleTimeString());

        // Totals
        setVal('cancelledTotalDiscountPercent', `${(header.descuento || 0).toFixed(2)}%`);
        setVal('cancelledSubtotal', `$${(header.subtotal || 0).toFixed(2)}`);
        setVal('cancelledTotal', `$${(header.total || 0).toFixed(2)}`);
        setVal('cancelledIva', `$${(header.iva || 0).toFixed(2)}`);
        setVal('cancelledPayCash', `$${(header.monto_recibido || 0).toFixed(2)}`);
        setVal('cancelledPayCard', `$${(header.total - (header.monto_recibido || 0)).toFixed(2)}`);
        setVal('cancelledReference', header.tarjeta_referencia || header.trans_folio || 'N/A');

        // Billing
        setVal('cancelledBillingName', header.cliente_nombre || 'N/A');
        setVal('cancelledBillingAddress', header.direccion_factura || 'DIRECCIÓN NO REGISTRADA');
        setVal('cancelledBillingRfc', header.cliente_rfc || 'XAXX010101000');

        // Payment Method Indicators
        const method = header.metodo_pago ? header.metodo_pago.toUpperCase() : 'EFECTIVO';
        resetMethodIndicators();
        if (method === 'EFECTIVO') document.getElementById('indEfectivo').classList.add('active');
        else if (method === 'TARJETA') document.getElementById('indTarjeta').classList.add('active');
        else if (method === 'TRANSFERENCIA') document.getElementById('indTransferencia').classList.add('active');
        else document.getElementById('indAmbos').classList.add('active');

        // Table
        const body = document.getElementById('cancelledItemsBody');
        body.innerHTML = '';
        details.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.credencial}</td>
                <td>${item.operacion}</td>
                <td>$${(item.neto || 0).toFixed(2)}</td>
                <td style="text-align:center;">${item.cantidad}</td>
                <td style="text-align:center;">${(item.descuento_porcentaje || 0).toFixed(2)}%</td>
                <td style="text-align:center; font-weight:bold; color:red;">CANCELADO</td>
            `;
            body.appendChild(tr);
        });

        document.getElementById('btnPrintCancelled').disabled = false;

    } catch (e) {
        console.error('Error cargando datos del recibo:', e);
        alert('Error al cargar datos: ' + e.message);
    }
}

function resetMethodIndicators() {
    ['indEfectivo', 'indTarjeta', 'indTransferencia', 'indAmbos'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('active');
    });
}

function clearForm() {
    document.getElementById('cancelledReceiptFolio').value = '';
    document.getElementById('cancelledDate').value = '';
    document.getElementById('cancelledTime').value = '';
    document.getElementById('cancelledItemsBody').innerHTML = '';
    document.getElementById('btnPrintCancelled').disabled = true;
    resetMethodIndicators();
}

function terminar() {
    window.location.href = 'caja.html';
}

function printCancelled() {
    if (!currentFolio) return;
    
    // We create a special print version for cancelled receipts
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString();

    // Logic to build the same letter-size HTML but with CANCELADO watermark
    const printArea = document.getElementById('receipt-print-area');
    
    const html = `
        <div class="receipt-print-container letter-size" style="position: relative; overflow: hidden;">
            <!-- WATERMARK -->
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 150px; color: rgba(255, 0, 0, 0.15); font-weight: bold; pointer-events: none; white-space: nowrap; z-index: 0;">CANCELADO</div>
            
            <div class="receipt-print-header" style="position: relative; z-index: 1;">
                <div class="logo-placeholder">SCALA</div>
                <h1>SISTEMA SCALA - AUDITORÍA DE CANCELACIÓN</h1>
                <p class="subtitle" style="color: red; font-weight: bold;">RECIBO CANCELADO / SIN VALIDEZ FISCAL</p>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 14px; position: relative; z-index: 1;">
                <div>
                    <p><strong>FOLIO CANCELADO:</strong> #${currentFolio.numero}</p>
                    <p><strong>FECHA ORIGINAL:</strong> ${new Date(currentFolio.fecha_recibo).toLocaleString()}</p>
                </div>
                <div style="text-align: right;">
                    <p><strong>FECHA CANCELACIÓN:</strong> ${new Date(currentFolio.fecha_cancelacion || currentFolio.created_at).toLocaleString()}</p>
                    <p><strong>MOTIVO:</strong> ${currentFolio.motivo_cancelacion || 'CANCELACIÓN MANUAL'}</p>
                </div>
            </div>

            <div style="margin-top: 30px; text-align: center; border: 2px solid red; padding: 20px; border-radius: 10px;">
                <h2 style="color: red; margin: 0;">ESTE DOCUMENTO HA SIDO CANCELADO</h2>
                <p>Favor de verificar en el sistema administrativo para más detalles.</p>
            </div>

            <div style="margin-top: 100px; text-align: center; border-top: 1px solid #000; padding-top: 20px;">
                <p>Auditoría de Procesos - Academia SCALA</p>
            </div>
        </div>
    `;

    printArea.innerHTML = html;
    window.print();
}

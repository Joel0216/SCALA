let db = null;
let datesWithOperations = new Set();

function money(v) {
    const n = Number(v || 0);
    return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

function n(v) {
    return Number(v || 0);
}

function fmtDate(iso) {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('es-MX');
}

function updateDateTime() {
    const el = document.getElementById('datetime');
    if (!el) return;
    el.textContent = new Date().toLocaleString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
}

function setStatus(msg) {
    const el = document.getElementById('statusMsg');
    if (el) el.textContent = msg || '';
}

function showCards(cards) {
    const wrap = document.getElementById('cardsResumen');
    wrap.innerHTML = '';
    cards.forEach((c) => {
        const d = document.createElement('div');
        d.className = 'card';
        d.innerHTML = `<div class="title">${c.title}</div><div class="value">${c.value}</div>`;
        wrap.appendChild(d);
    });
}

function renderTable(tableId, columns, rows) {
    const table = document.getElementById(tableId);
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');
    thead.innerHTML = '';
    tbody.innerHTML = '';

    const trh = document.createElement('tr');
    columns.forEach((c) => {
        const th = document.createElement('th');
        th.textContent = c.label;
        if (c.right) th.classList.add('right');
        trh.appendChild(th);
    });
    thead.appendChild(trh);

    if (!rows.length) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = columns.length;
        td.textContent = 'Sin datos para los filtros seleccionados.';
        td.className = 'muted';
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
    }

    rows.forEach((r) => {
        const tr = document.createElement('tr');
        columns.forEach((c) => {
            const td = document.createElement('td');
            td.textContent = c.render ? c.render(r[c.key], r) : (r[c.key] ?? '');
            if (c.right) td.classList.add('right');
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
}

function parseQueryCorte() {
    const sp = new URLSearchParams(window.location.search);
    const q = sp.get('corte');
    return (q === '1' || q === '2' || q === '3') ? q : '1';
}

function syncFiltersUI() {
    const tipo = document.getElementById('tipoCorte').value;
    const fFecha = document.getElementById('fieldFecha');
    const fIni = document.getElementById('fieldInicio');
    const fFin = document.getElementById('fieldFinal');
    const titulo = document.getElementById('tituloCorte');

    if (tipo === '3') {
        fFecha.style.display = 'none';
        fIni.style.display = '';
        fFin.style.display = '';
        titulo.textContent = 'Corte 3 - Resumen por periodo';
    } else if (tipo === '2') {
        fFecha.style.display = '';
        fIni.style.display = 'none';
        fFin.style.display = 'none';
        titulo.textContent = 'Corte 2 - Resumen diario por grupo y forma de pago';
    } else {
        fFecha.style.display = '';
        fIni.style.display = 'none';
        fFin.style.display = 'none';
        titulo.textContent = 'Corte 1 - Operaciones detalladas del día';
    }
}

async function fetchReceiptsByRange(startDate, endDate) {
    const q = db
        .from('recibos')
        .select('*')
        .gte('fecha', startDate)
        .lte('fecha', endDate)
        .order('numero', { ascending: true });

    const { data, error } = await q;
    if (error) throw error;
    return data || [];
}

async function fetchDetailsByReceiptIds(ids) {
    if (!ids.length) return [];
    const { data, error } = await db
        .from('recibos_detalle')
        .select('*')
        .in('recibo_id', ids)
        .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
}

function buildMapById(arr) {
    const map = {};
    arr.forEach((x) => { map[x.id] = x; });
    return map;
}

async function generarCorte1(fecha) {
    setStatus('Generando Corte 1...');
    const recibos = await fetchReceiptsByRange(fecha, fecha);
    const detalles = await fetchDetailsByReceiptIds(recibos.map((r) => r.id));
    const recMap = buildMapById(recibos);

    const rows = detalles.map((d) => {
        const r = recMap[d.recibo_id] || {};
        return {
            fecha: r.fecha,
            recibo: r.numero,
            credencial: d.credencial,
            operacion: d.operacion,
            grupo: d.grupo || '',
            cantidad: n(d.cantidad),
            monto: n(d.monto),
            descuento: n(d.descuento),
            iva: n(d.iva),
            neto: n(d.neto)
        };
    });

    const totalNeto = rows.reduce((a, b) => a + b.neto, 0);
    const totalIva = rows.reduce((a, b) => a + b.iva, 0);

    showCards([
        { title: 'Fecha', value: fmtDate(fecha) },
        { title: 'Recibos', value: String(recibos.length) },
        { title: 'Total Neto', value: money(totalNeto) },
        { title: 'IVA Total', value: money(totalIva) }
    ]);

    document.getElementById('tituloTabla1').textContent = 'Detalle de operaciones';
    document.getElementById('tituloTabla2').textContent = '';
    document.getElementById('wrapTabla2').style.display = 'none';

    renderTable('tablaPrincipal', [
        { key: 'fecha', label: 'Fecha', render: (v) => fmtDate(v) },
        { key: 'recibo', label: 'Recibo', right: true },
        { key: 'credencial', label: 'Credencial' },
        { key: 'operacion', label: 'Operación' },
        { key: 'grupo', label: 'Grupo' },
        { key: 'cantidad', label: 'Cant.', right: true },
        { key: 'monto', label: 'Monto', right: true, render: (v) => money(v) },
        { key: 'descuento', label: 'Desc.', right: true, render: (v) => money(v) },
        { key: 'iva', label: 'IVA', right: true, render: (v) => money(v) },
        { key: 'neto', label: 'Neto', right: true, render: (v) => money(v) }
    ], rows);

    setStatus(`Corte 1 listo. ${rows.length} operaciones procesadas.`);
}

async function generarCorte2(fecha) {
    setStatus('Generando Corte 2...');
    const recibos = await fetchReceiptsByRange(fecha, fecha);
    const detalles = await fetchDetailsByReceiptIds(recibos.map((r) => r.id));

    const groupMap = {};
    detalles.forEach((d) => {
        const g = d.grupo || 'SIN GRUPO';
        if (!groupMap[g]) {
            groupMap[g] = {
                grupo: g,
                recibosSet: new Set(),
                sumaNeto: 0,
                sumaIva: 0
            };
        }
        groupMap[g].recibosSet.add(d.recibo_id);
        groupMap[g].sumaNeto += n(d.neto);
        groupMap[g].sumaIva += n(d.iva);
    });

    const resumenGrupo = Object.values(groupMap)
        .map((x) => ({
            grupo: x.grupo,
            total_recibos: x.recibosSet.size,
            suma_neto: x.sumaNeto,
            suma_iva: x.sumaIva,
            neto_sin_iva: x.sumaNeto - x.sumaIva
        }))
        .sort((a, b) => a.grupo.localeCompare(b.grupo));

    const totalNeto = resumenGrupo.reduce((a, b) => a + b.suma_neto, 0);
    const totalIva = resumenGrupo.reduce((a, b) => a + b.suma_iva, 0);

    const metodoMap = {};
    recibos.forEach((r) => {
        const metodo = (r.metodo_pago || 'NO ESPECIFICADO').toUpperCase();
        if (!metodoMap[metodo]) {
            metodoMap[metodo] = { metodo_pago: metodo, total_recibos: 0, total_importe: 0 };
        }
        metodoMap[metodo].total_recibos += 1;
        metodoMap[metodo].total_importe += n(r.total);
    });
    const resumenPago = Object.values(metodoMap).sort((a, b) => a.metodo_pago.localeCompare(b.metodo_pago));

    const nums = recibos.map((r) => n(r.numero)).filter((x) => x > 0).sort((a, b) => a - b);
    const folioMin = nums.length ? nums[0] : 0;
    const folioMax = nums.length ? nums[nums.length - 1] : 0;
    const folioCount = nums.length ? (folioMax - folioMin + 1) : 0;

    showCards([
        { title: 'Fecha', value: fmtDate(fecha) },
        { title: 'Recibos emitidos', value: `${folioCount} (${folioMin}-${folioMax})` },
        { title: 'Gran Total Neto', value: money(totalNeto) },
        { title: 'Gran Total IVA', value: money(totalIva) }
    ]);

    document.getElementById('tituloTabla1').textContent = 'Resumen por grupo';
    renderTable('tablaPrincipal', [
        { key: 'grupo', label: 'Grupo' },
        { key: 'total_recibos', label: 'No. recibos', right: true },
        { key: 'suma_neto', label: 'Monto Neto', right: true, render: (v) => money(v) },
        { key: 'suma_iva', label: 'IVA', right: true, render: (v) => money(v) },
        { key: 'neto_sin_iva', label: 'Neto sin IVA', right: true, render: (v) => money(v) }
    ], resumenGrupo);

    document.getElementById('tituloTabla2').textContent = 'Resumen por forma de pago';
    document.getElementById('wrapTabla2').style.display = '';
    renderTable('tablaSecundaria', [
        { key: 'metodo_pago', label: 'Forma de pago' },
        { key: 'total_recibos', label: 'No. recibos', right: true },
        { key: 'total_importe', label: 'Total recibido', right: true, render: (v) => money(v) }
    ], resumenPago);

    setStatus(`Corte 2 listo. ${recibos.length} recibos procesados.`);
}

async function generarCorte3(inicio, fin) {
    setStatus('Generando Corte 3...');
    const recibos = await fetchReceiptsByRange(inicio, fin);
    const detalles = await fetchDetailsByReceiptIds(recibos.map((r) => r.id));

    const groupMap = {};
    detalles.forEach((d) => {
        const g = d.grupo || 'SIN GRUPO';
        if (!groupMap[g]) {
            groupMap[g] = {
                grupo: g,
                total_cantidad: 0,
                suma_neto: 0,
                suma_iva: 0
            };
        }
        groupMap[g].total_cantidad += n(d.cantidad);
        groupMap[g].suma_neto += n(d.neto);
        groupMap[g].suma_iva += n(d.iva);
    });

    const resumenGrupo = Object.values(groupMap)
        .sort((a, b) => a.grupo.localeCompare(b.grupo));

    const totalNeto = resumenGrupo.reduce((a, b) => a + b.suma_neto, 0);
    const totalIva = resumenGrupo.reduce((a, b) => a + b.suma_iva, 0);
    const totalCant = resumenGrupo.reduce((a, b) => a + b.total_cantidad, 0);

    const nums = recibos.map((r) => n(r.numero)).filter((x) => x > 0).sort((a, b) => a - b);
    const folioMin = nums.length ? nums[0] : 0;
    const folioMax = nums.length ? nums[nums.length - 1] : 0;
    const folioCount = nums.length ? (folioMax - folioMin + 1) : 0;

    showCards([
        { title: 'Periodo', value: `${fmtDate(inicio)} a ${fmtDate(fin)}` },
        { title: 'Recibos emitidos', value: `${folioCount} (${folioMin}-${folioMax})` },
        { title: 'Total Cantidades', value: String(totalCant) },
        { title: 'Total Neto / IVA', value: `${money(totalNeto)} / ${money(totalIva)}` }
    ]);

    document.getElementById('tituloTabla1').textContent = 'Resumen por grupo (periodo)';
    renderTable('tablaPrincipal', [
        { key: 'grupo', label: 'Grupo' },
        { key: 'total_cantidad', label: 'Cantidades', right: true },
        { key: 'suma_neto', label: 'Monto Neto', right: true, render: (v) => money(v) },
        { key: 'suma_iva', label: 'IVA', right: true, render: (v) => money(v) }
    ], resumenGrupo);

    document.getElementById('tituloTabla2').textContent = 'Detalle de operaciones del periodo';
    document.getElementById('wrapTabla2').style.display = '';

    const recMap = buildMapById(recibos);
    const detalleRows = detalles.map((d) => {
        const r = recMap[d.recibo_id] || {};
        return {
            fecha: r.fecha,
            recibo: r.numero,
            grupo: d.grupo || '',
            operacion: d.operacion,
            cantidad: n(d.cantidad),
            neto: n(d.neto)
        };
    });
    renderTable('tablaSecundaria', [
        { key: 'fecha', label: 'Fecha', render: (v) => fmtDate(v) },
        { key: 'recibo', label: 'Recibo', right: true },
        { key: 'grupo', label: 'Grupo' },
        { key: 'operacion', label: 'Operación' },
        { key: 'cantidad', label: 'Cant.', right: true },
        { key: 'neto', label: 'Neto', right: true, render: (v) => money(v) }
    ], detalleRows);

    setStatus(`Corte 3 listo. ${recibos.length} recibos procesados.`);
}

async function generar() {
    try {
        const tipo = document.getElementById('tipoCorte').value;
        if (!db) throw new Error('No hay conexión con Supabase');

        if (tipo === '3') {
            const ini = document.getElementById('fechaInicio').value;
            const fin = document.getElementById('fechaFinal').value;
            if (!ini || !fin) throw new Error('Seleccione fecha inicio y fecha final');
            if (ini > fin) throw new Error('La fecha inicial no puede ser mayor a la final');
            await generarCorte3(ini, fin);
            return;
        }

        const fecha = document.getElementById('fechaUnica').value;
        if (!fecha) throw new Error('Seleccione una fecha');
        if (tipo === '2') await generarCorte2(fecha);
        else await generarCorte1(fecha);
    } catch (e) {
        console.error(e);
        setStatus(`Error: ${e.message}`);
        alert(`Error al generar corte: ${e.message}`);
    }
}

async function fetchDatesWithOperations() {
    try {
        const { data, error } = await db.from('recibos').select('fecha');
        if (error) throw error;
        datesWithOperations = new Set(data.map(r => r.fecha));
    } catch (e) {
        console.error("Error fetching dates for calendar:", e);
    }
}

async function initCalendars() {
    await fetchDatesWithOperations();

    const flatpickrConfig = {
        locale: 'es',
        dateFormat: 'Y-m-d',
        onDayCreate: function(dObj, dStr, fp, dayElem) {
            const y = dayElem.dateObj.getFullYear();
            const m = String(dayElem.dateObj.getMonth() + 1).padStart(2, '0');
            const d = String(dayElem.dateObj.getDate()).padStart(2, '0');
            const dateStr = `${y}-${m}-${d}`;

            if (datesWithOperations.has(dateStr)) {
                dayElem.classList.add('has-operations');
            }
        }
    };

    flatpickr("#fechaUnica", flatpickrConfig);
    flatpickr("#fechaInicio", flatpickrConfig);
    flatpickr("#fechaFinal", flatpickrConfig);
}

document.addEventListener('DOMContentLoaded', async () => {
    updateDateTime();
    setInterval(updateDateTime, 1000);

    const tipoSel = document.getElementById('tipoCorte');
    const qCorte = parseQueryCorte();
    tipoSel.value = qCorte;

    const hoy = new Date().toISOString().slice(0, 10);
    document.getElementById('fechaUnica').value = hoy;
    document.getElementById('fechaInicio').value = hoy;
    document.getElementById('fechaFinal').value = hoy;

    tipoSel.addEventListener('change', syncFiltersUI);
    document.getElementById('btnGenerar').addEventListener('click', generar);
    document.getElementById('btnImprimir').addEventListener('click', () => window.print());
    document.getElementById('btnVolver').addEventListener('click', () => { window.location.href = 'caja.html'; });

    syncFiltersUI();

    try {
        if (typeof waitForSupabase === 'function') db = await waitForSupabase(10000);
        else db = window.supabaseClient || window.supabase || null;
        if (!db) throw new Error('Supabase no disponible');
        
        await initCalendars();
        
        await generar();
    } catch (e) {
        console.error(e);
        setStatus(`Error de conexión: ${e.message}`);
        alert(`No se pudo inicializar el módulo de cortes: ${e.message}`);
    }
});

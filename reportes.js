// reportes.js - Módulo de Reportes con soporte Multi-Organización para SuperAdmin
// No declaramos supabase aquí para evitar conflictos con supabase-config.js

// Reportes que requieren selección de fecha
const REQUIREN_FECHAS = [
    'alumnos_ingresos',
    'alumnos_baja',
    'listas_asistencia',
    'corte_caja_efectivo',
    'corte_caja_tarjeta',
    'corte_caja_total',
    'analisis_ingresos',
    'deudores', // Usa fechaInicio como mes_corte (formato YYYY-MM)
    'articulos_vendidos'
];

// ==========================================
// INICIALIZACIÓN
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM cargado, inicializando reportes...');

    if (typeof window.waitForSupabase === 'function') {
        try {
            await window.waitForSupabase(5000);
            console.log('Conexion con Supabase verificada');
        } catch (e) {
            console.warn('Advertencia: Timeout esperando Supabase, intentando continuar...');
        }
    }

    updateDateTime();
    setInterval(updateDateTime, 1000);

    // Configurar cambio de reporte (habilitar/deshabilitar fechas)
    const reporteSelect = document.getElementById('reporteSelect');
    if (reporteSelect) {
        reporteSelect.addEventListener('change', onReporteChange);
        reporteSelect.dispatchEvent(new Event('change'));
    }

    // Inicializar selector de organización si es SuperAdmin
    inicializarSelectorOrg();

    if (typeof window.SessionManager !== 'undefined') {
        window.SessionManager.protectPage('Reportes');
    }
});

function onReporteChange(e) {
    const reporteId = e.target.value;
    const requiere = REQUIREN_FECHAS.includes(reporteId);
    const inputs = document.querySelectorAll('.filter-input');
    const labels = document.querySelectorAll('.filter-group label');

    inputs.forEach(input => {
        input.disabled = !requiere;
        input.style.opacity = requiere ? '1' : '0.5';
    });
    labels.forEach(label => {
        label.style.opacity = requiere ? '1' : '0.5';
    });

    if (reporteId === 'deudores') {
        if (labels[0]) labels[0].textContent = 'Mes Corte (YYYY-MM):';
        if (inputs[0]) {
            inputs[0].value = ''; // Limpiar valor previo al cambiar tipo
            inputs[0].type = 'month';
            inputs[0].disabled = false;
            inputs[0].style.opacity = '1';
        }
        if (labels[1]) labels[1].style.opacity = '0.5';
        if (inputs[1]) {
            inputs[1].value = '';
            inputs[1].disabled = true;
            inputs[1].style.opacity = '0.5';
        }
    } else {
        if (labels[0]) labels[0].textContent = 'Fecha Inicio:';
        if (inputs[0]) {
            // Solo limpiar si veníamos de 'month' (deudores)
            if (inputs[0].type === 'month') inputs[0].value = '';
            inputs[0].type = 'date';
        }
        if (requiere) {
            if (labels[1]) labels[1].style.opacity = '1';
            if (inputs[1]) {
                inputs[1].disabled = false;
                inputs[1].style.opacity = '1';
            }
        }
    }
}

// ==========================================
// SELECTOR DE ORGANIZACIÓN (SuperAdmin)
// ==========================================

async function inicializarSelectorOrg() {
    const user = window.SessionManager?.getCurrentUser();
    if (!user || user.rol !== 'SuperAdmin') return;

    const container = document.getElementById('orgSelectorContainer');
    const loadingMsg = document.getElementById('orgLoadingMsg');
    const orgSelector = document.getElementById('orgSelector');

    if (!container || !orgSelector) return;

    // Mostrar el panel SuperAdmin
    container.style.display = 'flex';

    const db = window.supabase;
    if (!db) {
        if (loadingMsg) loadingMsg.textContent = '(Sin conexión)';
        return;
    }

    try {
        const { data: orgs, error } = await db.from('organizaciones').select('id, nombre').order('nombre');
        if (error) throw error;

        // Limpiar y rellenar opciones
        orgSelector.innerHTML = '<option value="ALL">Todas las Organizaciones</option>';
        if (orgs && orgs.length > 0) {
            orgs.forEach(org => {
                const opt = document.createElement('option');
                opt.value = org.id;
                opt.textContent = org.nombre;
                orgSelector.appendChild(opt);
            });
        }
        if (loadingMsg) loadingMsg.textContent = `(${orgs?.length || 0} organizaciones)`;
        console.log(`${orgs?.length || 0} organizaciones cargadas en el selector`);
    } catch(e) {
        console.warn('No se pudieron cargar organizaciones:', e.message);
        if (loadingMsg) loadingMsg.textContent = '(Error al cargar)';
    }
}

function getOrgOverride() {
    const user = window.SessionManager?.getCurrentUser();
    if (!user || user.rol !== 'SuperAdmin') return null;
    const sel = document.getElementById('orgSelector');
    // Si el selector aún no cargó organizaciones, retornar 'ALL' (ver todo)
    if (!sel) return 'ALL';
    return sel.value || 'ALL';
}

function getOrgNombreSeleccionada() {
    const sel = document.getElementById('orgSelector');
    if (!sel) return '';
    const opt = sel.options[sel.selectedIndex];
    return opt ? opt.textContent.trim() : '';
}

// ==========================================
// UTILIDADES
// ==========================================

function updateDateTime() {
    const now = new Date();
    const dateTimeString = now.toLocaleString('es-MX', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    });
    const el = document.getElementById('datetime');
    if (el) el.textContent = dateTimeString;
}

function obtenerRangoFechas() {
    const fInicio = document.getElementById('fechaInicio');
    const fFin = document.getElementById('fechaFin');
    return {
        inicio: fInicio ? fInicio.value : null,
        fin: fFin ? fFin.value : null
    };
}

// ==========================================
// GENERACIÓN DE DATOS
// ==========================================

async function generarDatosReporte() {
    const client = window.supabase;
    if (!client) throw new Error('Base de datos no conectada. Por favor verifique su conexión.');

    const select = document.getElementById('reporteSelect');
    if (!select || !select.value) throw new Error('Por favor seleccione un reporte de la lista.');

    const reporteId = select.value;
    const reporteNombre = select.options[select.selectedIndex].text;
    const { inicio, fin } = obtenerRangoFechas();

    // Reportes que NO necesitan fechas (nunca lanzar error de fechas para estos)
    const SIN_FECHAS = [
        'listado_alumnos_1', 'listado_alumnos_2', 'listado_alumnos_3',
        'alumnos_por_instrumento', 'programacion_examenes', 'alumnos_nivel_superior',
        'pagos_adelantados', 'reporte_mensual_maestros', 'stock_critico'
    ];

    // Validar fechas requeridas (solo si el reporte las necesita)
    if (!SIN_FECHAS.includes(reporteId) && REQUIREN_FECHAS.includes(reporteId)) {
        if (reporteId === 'deudores') {
            if (!inicio) throw new Error('ERROR: Debe seleccionar el Mes de Corte (formato YYYY-MM).');
        } else if (!inicio || !fin) {
            throw new Error('ERROR: Debe seleccionar FECHA INICIO y FECHA FIN.');
        }
    }

    if (!window.ReportEngine) throw new Error('El motor de reportes no está cargado correctamente.');

    // Obtener override de organización (SuperAdmin)
    const org_override = getOrgOverride();
    const E = window.ReportEngine;
    let datos = null;

    switch (reporteId) {
        // --- Alumnos y Matrícula ---
        case 'listado_alumnos_1':         datos = await E.listado_alumnos(client, 1, org_override); break;
        case 'listado_alumnos_2':         datos = await E.listado_alumnos(client, 2, org_override); break;
        case 'listado_alumnos_3':         datos = await E.listado_alumnos(client, 3, org_override); break;
        case 'alumnos_ingresos':          datos = await E.alumnos_ingresos(client, inicio, fin, org_override); break;
        case 'alumnos_por_instrumento':   datos = await E.alumnos_por_instrumento(client, org_override); break;
        case 'alumnos_baja':              datos = await E.alumnos_baja(client, inicio, fin, org_override); break;
        // --- Control Académico ---
        case 'listas_asistencia':         datos = await E.listas_asistencia(client, inicio, fin, org_override); break;
        case 'programacion_examenes':     datos = await E.programacion_examenes(client, org_override); break;
        case 'alumnos_nivel_superior':    datos = await E.alumnos_nivel_superior(client, org_override); break;
        // --- Cobranza y Finanzas ---
        case 'corte_caja_efectivo':       datos = await E.corte_caja_diario(client, inicio, fin, 1, org_override); break;
        case 'corte_caja_tarjeta':        datos = await E.corte_caja_diario(client, inicio, fin, 2, org_override); break;
        case 'corte_caja_total':          datos = await E.corte_caja_diario(client, inicio, fin, 3, org_override); break;
        case 'analisis_ingresos':         datos = await E.analisis_ingresos(client, inicio, fin, org_override); break;
        case 'deudores':                  datos = await E.deudores(client, inicio, org_override); break;
        case 'pagos_adelantados':         datos = await E.pagos_adelantados(client, org_override); break;
        // --- Maestros e Inventarios ---
        case 'reporte_mensual_maestros':  datos = await E.reporte_mensual_maestros(client, org_override); break;
        case 'articulos_vendidos':        datos = await E.articulos_vendidos(client, inicio, fin, org_override); break;
        case 'stock_critico':             datos = await E.stock_critico(client, org_override); break;
        default: throw new Error('Reporte no implementado.');
    }

    if (!datos || datos.length === 0) {
        throw new Error('No se encontraron datos dentro del periodo elegido.');
    }

    return { datos, reporteNombre, org_override };
}

// ==========================================
// IMPRIMIR / EXPORTAR PDF
// ==========================================

async function imprimirReporte() {
    try {
        const { datos, reporteNombre, org_override } = await generarDatosReporte();
        const orgNombre = getOrgNombreSeleccionada();
        mostrarReporte(reporteNombre, datos, org_override, orgNombre);
    } catch (error) {
        console.error('Error al generar reporte:', error);
        const msg = error.message || 'Error desconocido';
        const details = error.details || error.hint || '';
        alert('Error al generar reporte:\n\n' + msg + (details ? '\n\nDetalle: ' + details : ''));
    }
}

// ==========================================
// EXPORTAR CSV
// ==========================================

async function exportarCSV() {
    try {
        const { datos, reporteNombre, org_override } = await generarDatosReporte();
        if (!datos || datos.length === 0) return;

        const orgNombre = getOrgNombreSeleccionada();
        const keys = Object.keys(datos[0]);

        let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';

        // Encabezado de contexto
        csvContent += `"REPORTE:","${reporteNombre}"\r\n`;
        if (org_override) {
            csvContent += `"ORGANIZACIÓN:","${orgNombre}"\r\n`;
        }
        csvContent += `"GENERADO:","${new Date().toLocaleString('es-MX')}"\r\n`;
        csvContent += `"TOTAL REGISTROS:","${datos.length}"\r\n`;
        csvContent += '\r\n';

        // Columnas
        csvContent += keys.map(k => '"' + k.replace(/_/g, ' ').replace(/"/g, '""') + '"').join(',') + '\r\n';

        // Filas
        datos.forEach(row => {
            const rowStr = keys.map(k => {
                let val = row[k];
                if (val === null || val === undefined) val = '';
                val = String(val).replace(/"/g, '""');
                return '"' + val + '"';
            }).join(',');
            csvContent += rowStr + '\r\n';
        });

        const orgSuffix = org_override && org_override !== 'ALL' ? `_${orgNombre.replace(/[^a-z0-9]/gi, '_')}` : org_override === 'ALL' ? '_TODAS' : '';
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `Reporte_${reporteNombre.replace(/ /g, '_')}${orgSuffix}_${new Date().getTime()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Error al exportar CSV:', error);
        alert(error.message);
    }
}

// ==========================================
// VENTANA DE IMPRESIÓN / PDF
// ==========================================

function mostrarReporte(titulo, datos, org_override, orgNombre) {
    const ventana = window.open('', '_blank', 'width=1100,height=800');
    if (!ventana) return alert('Por favor, habilite las ventanas emergentes para ver el reporte.');

    const fechaGen = new Date().toLocaleString('es-MX');
    const keys = Object.keys(datos[0]);

    // Banner de organización
    let orgBanner = '';
    if (org_override) {
        const color = org_override === 'ALL' ? '#1a237e' : '#1b5e20';
        const etiqueta = org_override === 'ALL' ? '[CONSOLIDADO]' : '[SUCURSAL]';
        orgBanner = `
            <div style="background:${color}; color:#fff; padding:8px 16px; border-radius:4px; margin-bottom:12px; font-size:0.95em; display:flex; align-items:center; gap:8px;">
                <strong>${etiqueta}</strong>
                <strong>Organizacion:</strong> ${orgNombre}
                ${org_override === 'ALL' ? '<span style="background:#ff6f00;border-radius:3px;padding:1px 8px;margin-left:8px;font-size:0.8em;font-weight:700;">VER TODO</span>' : ''}
            </div>`;
    }

    // Tabla
    let tableHtml = '<table><thead><tr>';
    keys.forEach(k => tableHtml += `<th>${k.replace(/_/g, ' ')}</th>`);
    tableHtml += '</tr></thead><tbody>';

    datos.forEach(row => {
        tableHtml += '<tr>';
        keys.forEach(k => {
            let val = row[k];
            if (val === null || val === undefined) val = '';
            if (typeof val === 'number' &&
                (k.toLowerCase().includes('total') || k.toLowerCase().includes('monto') ||
                 k.toLowerCase().includes('precio') || k.toLowerCase().includes('ingresos'))) {
                val = '$' + val.toFixed(2);
            }
            // Resaltar columna ORGANIZACIÓN
            if (k === 'ORGANIZACIÓN') {
                tableHtml += `<td style="background:#e8eaf6;font-weight:600;color:#1a237e;">${val}</td>`;
            } else {
                tableHtml += `<td>${val}</td>`;
            }
        });
        tableHtml += '</tr>';
    });
    tableHtml += '</tbody></table>';

    // Totales numéricos al pie
    const colsNumericas = keys.filter(k =>
        typeof datos[0][k] === 'number' &&
        (k.includes('MONTO') || k.includes('TOTAL') || k.includes('INGRESOS'))
    );
    let totalRow = '';
    if (colsNumericas.length > 0) {
        const totales = {};
        colsNumericas.forEach(k => {
            totales[k] = datos.reduce((sum, r) => sum + (parseFloat(r[k]) || 0), 0);
        });
        totalRow = `<div class="totales">
            ${colsNumericas.map(k => `<span><strong>${k.replace(/_/g, ' ')}:</strong> $${totales[k].toFixed(2)}</span>`).join(' &nbsp;|&nbsp; ')}
        </div>`;
    }

    ventana.document.write(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <title>${titulo}</title>
            <meta charset="UTF-8">
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 28px; font-size: 10pt; color: #333; }
                .header { border-bottom: 3px solid #2c3e50; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 10px; }
                h1 { margin: 0; font-size: 17pt; color: #2c3e50; }
                h2 { margin: 4px 0 0 0; font-size: 13pt; color: #7f8c8d; }
                .meta { text-align: right; font-size: 0.85em; color: #666; }
                table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 9pt; }
                th { background: #2c3e50; color: #fff; padding: 8px 10px; text-align: left; text-transform: uppercase; font-size: 8.5pt; }
                td { border: 1px solid #dde; padding: 7px 10px; }
                tr:nth-child(even) { background-color: #f7f9fc; }
                tr:hover { background-color: #eef2f7; }
                .footer { margin-top: 24px; font-size: 8pt; color: #95a5a6; text-align: center; border-top: 1px solid #eee; padding-top: 10px; }
                .totales { margin-top: 14px; background: #eceff1; border-radius: 4px; padding: 8px 14px; font-size: 10pt; color: #1b5e20; }
                .btn-print { padding: 9px 20px; background: #2c3e50; color: white; border: none; border-radius: 4px; cursor: pointer; margin-bottom: 16px; font-weight: bold; transition: background 0.3s; }
                .btn-print:hover { background: #34495e; }
                @media print {
                    .btn-print { display: none !important; }
                    body { padding: 10px; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div>
                    <h1>SCALA - ACADEMIAS DE MÚSICA</h1>
                    <h2>${titulo.toUpperCase()}</h2>
                </div>
                <div class="meta">
                    Fecha de impresión:<br><strong>${fechaGen}</strong>
                </div>
            </div>
            <button class="btn-print" onclick="window.print()">Imprimir / Guardar como PDF</button>
            ${orgBanner}
            ${tableHtml}
            ${totalRow}
            <div class="footer">
                Documento de uso administrativo interno — SCALA Academias de Música &nbsp;|&nbsp;
                Total de registros: <strong>${datos.length}</strong>
                ${org_override ? `&nbsp;|&nbsp; Organización: <strong>${orgNombre}</strong>` : ''}
            </div>
        </body>
        </html>
    `);
    ventana.document.close();
}

// Exportar funciones al scope global
window.imprimirReporte = imprimirReporte;
window.exportarCSV = exportarCSV;

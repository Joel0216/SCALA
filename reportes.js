// reportes.js - Módulo de Reportes Totalmente Restaurado
let supabase = null;

// Reportes que requieren selección de fecha
const REQUIREN_FECHAS = [
    'alumnos_ingresos',
    'alumnos_baja',
    'corte_caja_efectivo',
    'corte_caja_tarjeta',
    'corte_caja_total',
    'analisis_ingresos',
    'deudores', // Usa fechaInicio como mes_corte
    'articulos_vendidos'
];

document.addEventListener('DOMContentLoaded', async () => {
    if (!window.ReportEngine) {
        const script = document.createElement('script');
        script.src = 'reportes-engine.js';
        document.head.appendChild(script);
    }
    
    console.log('DOM cargado, inicializando reportes...');

    try {
        await new Promise(r => setTimeout(r, 500));
        if (typeof waitForSupabase === 'function') {
            supabase = await waitForSupabase(10000);
            console.log('✓ Supabase conectado');
        }
    } catch (e) {
        console.error('Error conectando a Supabase:', e);
    }

    updateDateTime();
    setInterval(updateDateTime, 1000);

    // Event listener para habilitar/deshabilitar fechas visualmente
    const reporteSelect = document.getElementById('reporteSelect');
    if (reporteSelect) {
        reporteSelect.addEventListener('change', (e) => {
            const requiere = REQUIREN_FECHAS.includes(e.target.value);
            const inputs = document.querySelectorAll('.filter-input');
            const labels = document.querySelectorAll('.filter-group label');
            
            inputs.forEach(input => {
                input.disabled = !requiere;
                input.style.opacity = requiere ? '1' : '0.5';
            });
            labels.forEach(label => {
                label.style.opacity = requiere ? '1' : '0.5';
            });
            
            // Si es deudores, indicar que inicio es mes_corte
            if (e.target.value === 'deudores') {
                labels[0].textContent = 'Mes Corte (YYYY-MM):';
                inputs[0].type = 'month';
                labels[1].style.opacity = '0.5';
                inputs[1].disabled = true;
                inputs[1].style.opacity = '0.5';
            } else {
                labels[0].textContent = 'Fecha Inicio:';
                inputs[0].type = 'date';
                if (requiere) {
                    labels[1].style.opacity = '1';
                    inputs[1].disabled = false;
                    inputs[1].style.opacity = '1';
                }
            }
        });
        
    // Trigger initial state
    if (reporteSelect) {
        reporteSelect.dispatchEvent(new Event('change'));
    }

    // Aplicar protección de seguridad
    if (typeof SessionManager !== 'undefined') {
        SessionManager.protectPage('Reportes');
    }
});

function updateDateTime() {
    const now = new Date();
    const dateTimeString = now.toLocaleString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    const datetimeElement = document.getElementById('datetime');
    if (datetimeElement) datetimeElement.textContent = dateTimeString;
}

function obtenerRangoFechas() {
    return {
        inicio: document.getElementById('fechaInicio').value,
        fin: document.getElementById('fechaFin').value
    };
}

// Variable global temporal para guardar los datos generados para el CSV
let lastReportData = null;
let lastReportName = null;

async function generarDatosReporte() {
    if (!supabase) {
        throw new Error('Base de datos no conectada');
    }

    const select = document.getElementById('reporteSelect');
    if (!select || !select.value) {
        throw new Error('Por favor seleccione un reporte');
    }

    const reporteId = select.value;
    const reporteNombre = select.options[select.selectedIndex].text;
    const { inicio, fin } = obtenerRangoFechas();

    if (REQUIREN_FECHAS.includes(reporteId)) {
        if (reporteId === 'deudores' && !inicio) {
            throw new Error('⚠️ ERROR: Debe seleccionar el Mes de Corte.');
        } else if (reporteId !== 'deudores' && (!inicio || !fin)) {
            throw new Error('⚠️ ERROR: Debe seleccionar FECHA INICIO y FECHA FIN.');
        }
    }

    const db = supabase;
    let datos = null;

    switch (reporteId) {
        // 1. Alumnos y Matrícula
        case 'listado_alumnos_1': datos = await ReportEngine.listado_alumnos(db, 1); break;
        case 'listado_alumnos_2': datos = await ReportEngine.listado_alumnos(db, 2); break;
        case 'listado_alumnos_3': datos = await ReportEngine.listado_alumnos(db, 3); break;
        case 'alumnos_ingresos': datos = await ReportEngine.alumnos_ingresos(db, inicio, fin); break;
        case 'alumnos_por_instrumento': datos = await ReportEngine.alumnos_por_instrumento(db); break;
        case 'alumnos_baja': datos = await ReportEngine.alumnos_baja(db, inicio, fin); break;

        // 2. Control Académico
        case 'listas_asistencia': datos = await ReportEngine.listas_asistencia(db); break;
        case 'programacion_examenes': datos = await ReportEngine.programacion_examenes(db); break;
        case 'alumnos_nivel_superior': datos = await ReportEngine.alumnos_nivel_superior(db); break;

        // 3. Cobranza y Finanzas
        case 'corte_caja_efectivo': datos = await ReportEngine.corte_caja_diario(db, inicio, 1); break; // Usa inicio como fecha
        case 'corte_caja_tarjeta': datos = await ReportEngine.corte_caja_diario(db, inicio, 2); break;
        case 'corte_caja_total': datos = await ReportEngine.corte_caja_diario(db, inicio, 3); break;
        case 'analisis_ingresos': datos = await ReportEngine.analisis_ingresos(db, inicio, fin); break;
        case 'deudores': datos = await ReportEngine.deudores(db, inicio); break; // Usa inicio como mes_corte
        case 'pagos_adelantados': datos = await ReportEngine.pagos_adelantados(db); break;

        // 4. Maestros e Inventarios
        case 'reporte_mensual_maestros': datos = await ReportEngine.reporte_mensual_maestros(db); break;
        case 'articulos_vendidos': datos = await ReportEngine.articulos_vendidos(db, inicio, fin); break;
        case 'stock_critico': datos = await ReportEngine.stock_critico(db); break;

        default:
            throw new Error('Reporte no implementado aún.');
    }

    if (!datos || datos.length === 0) {
        throw new Error('No se encontraron registros en el periodo/criterio seleccionado.');
    }

    lastReportData = datos;
    lastReportName = reporteNombre;
    return { datos, reporteNombre };
}

async function imprimirReporte() {
    try {
        const { datos, reporteNombre } = await generarDatosReporte();
        mostrarReporte(reporteNombre, datos);
    } catch (error) {
        console.error('Error al generar reporte:', error);
        alert(error.message);
    }
}

async function exportarCSV() {
    try {
        // Generar siempre datos frescos por si cambiaron los filtros
        const { datos, reporteNombre } = await generarDatosReporte();
        
        if (!datos || datos.length === 0) return;

        const keys = Object.keys(datos[0]);
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // BOM para Excel
        
        // Headers
        csvContent += keys.map(k => '"' + k.replace(/"/g, '""').toUpperCase() + '"').join(",") + "\r\n";
        
        // Data
        datos.forEach(row => {
            const rowStr = keys.map(k => {
                let val = row[k];
                if (val === null || val === undefined) val = '';
                val = String(val).replace(/"/g, '""');
                return '"' + val + '"';
            }).join(",");
            csvContent += rowStr + "\r\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Reporte_${reporteNombre.replace(/ /g, '_')}_${new Date().getTime()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
    } catch (error) {
        console.error('Error al exportar CSV:', error);
        alert(error.message);
    }
}

// --- VISUALIZACIÓN ---

function mostrarReporte(titulo, datos) {
    const ventana = window.open('', '_blank', 'width=1100,height=800');
    if (!ventana) return alert('Active las ventanas emergentes');

    const fechaGen = new Date().toLocaleString();
    const keys = Object.keys(datos[0]);

    let tableHtml = '<table><thead><tr>';
    keys.forEach(k => tableHtml += `<th>${k.replace(/_/g, ' ').toUpperCase()}</th>`);
    tableHtml += '</tr></thead><tbody>';

    datos.forEach(row => {
        tableHtml += '<tr>';
        keys.forEach(k => {
            let val = row[k];
            if (val === null || val === undefined) val = '';
            if (typeof val === 'number' && (k.toLowerCase().includes('total') || k.toLowerCase().includes('monto') || k.toLowerCase().includes('precio') || k.toLowerCase().includes('honorarios'))) {
                val = '$' + val.toFixed(2);
            }
            tableHtml += `<td>${val}</td>`;
        });
        tableHtml += '</tr>';
    });
    tableHtml += '</tbody></table>';

    ventana.document.write(`
        <html>
        <head>
            <title>${titulo}</title>
            <style>
                body { font-family: sans-serif; padding: 20px; font-size: 10pt; }
                .header { border-bottom: 2px solid #333; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
                h1 { margin: 0; font-size: 16pt; }
                h2 { margin: 5px 0 0 0; font-size: 14pt; color: #555; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
                th { background: #eee; font-weight: bold; }
                .footer { margin-top: 20px; font-size: 8pt; color: #666; text-align: center; }
                @media print { .btn-print { display: none !important; } }
            </style>
        </head>
        <body>
            <div class="header">
                <div>
                    <h1>SCALA - ACADEMIAS DE MÚSICA</h1>
                    <h2>${titulo.toUpperCase()}</h2>
                </div>
                <div style="text-align:right; font-size: 0.9em; color: #666;">Fecha de impresión: ${fechaGen}</div>
            </div>
            <button class="btn-print" onclick="window.print()" style="padding:10px 20px; background:#2c3e50; color:white; border:none; border-radius:4px; cursor:pointer; margin-bottom:15px; font-weight: bold;">🖨️ Imprimir / Guardar como PDF</button>
            ${tableHtml}
            <div class="footer">Este documento es para uso administrativo interno de SCALA Academias de Música. Total de registros encontrados: ${datos.length}</div>
        </body>
        </html>
    `);
    ventana.document.close();
}

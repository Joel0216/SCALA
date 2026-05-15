// reportes.js - Módulo de Reportes Totalmente Restaurado
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
    'deudores', // Usa fechaInicio como mes_corte
    'articulos_vendidos'
];

document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM cargado, inicializando reportes...');

    // Esperar a que el cliente esté listo
    if (typeof window.waitForSupabase === 'function') {
        try {
            await window.waitForSupabase(5000);
            console.log('✓ Conexión con Supabase verificada');
        } catch (e) {
            console.warn('Advertencia: Timeout esperando Supabase, intentando continuar...');
        }
    }

    updateDateTime();
    setInterval(updateDateTime, 1000);

    const reporteSelect = document.getElementById('reporteSelect');
    if (reporteSelect) {
        reporteSelect.addEventListener('change', (e) => {
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
                    inputs[0].type = 'month';
                    inputs[0].disabled = false;
                    inputs[0].style.opacity = '1';
                }
                if (labels[1]) labels[1].style.opacity = '0.5';
                if (inputs[1]) {
                    inputs[1].disabled = true;
                    inputs[1].style.opacity = '0.5';
                }
            } else {
                if (labels[0]) labels[0].textContent = 'Fecha Inicio:';
                if (inputs[0]) inputs[0].type = 'date';
                if (requiere) {
                    if (labels[1]) labels[1].style.opacity = '1';
                    if (inputs[1]) {
                        inputs[1].disabled = false;
                        inputs[1].style.opacity = '1';
                    }
                }
            }
        });
        
        reporteSelect.dispatchEvent(new Event('change'));
    }

    if (typeof window.SessionManager !== 'undefined') {
        window.SessionManager.protectPage('Reportes');
    }
});

function updateDateTime() {
    const now = new Date();
    const dateTimeString = now.toLocaleString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    const datetimeElement = document.getElementById('datetime');
    if (datetimeElement) datetimeElement.textContent = dateTimeString;
}

function obtenerRangoFechas() {
    const fInicio = document.getElementById('fechaInicio');
    const fFin = document.getElementById('fechaFin');
    return {
        inicio: fInicio ? fInicio.value : null,
        fin: fFin ? fFin.value : null
    };
}

async function generarDatosReporte() {
    const client = window.supabase;
    if (!client) {
        throw new Error('Base de datos no conectada. Por favor verifique su conexión.');
    }

    const select = document.getElementById('reporteSelect');
    if (!select || !select.value) {
        throw new Error('Por favor seleccione un reporte de la lista.');
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

    if (!window.ReportEngine) {
        throw new Error('El motor de reportes no está cargado correctamente.');
    }

    let datos = null;
    switch (reporteId) {
        case 'listado_alumnos_1': datos = await window.ReportEngine.listado_alumnos(client, 1); break;
        case 'listado_alumnos_2': datos = await window.ReportEngine.listado_alumnos(client, 2); break;
        case 'listado_alumnos_3': datos = await window.ReportEngine.listado_alumnos(client, 3); break;
        case 'alumnos_ingresos': datos = await window.ReportEngine.alumnos_ingresos(client, inicio, fin); break;
        case 'alumnos_por_instrumento': datos = await window.ReportEngine.alumnos_por_instrumento(client); break;
        case 'alumnos_baja': datos = await window.ReportEngine.alumnos_baja(client, inicio, fin); break;
        case 'listas_asistencia': datos = await window.ReportEngine.listas_asistencia(client, inicio, fin); break;
        case 'programacion_examenes': datos = await window.ReportEngine.programacion_examenes(client); break;
        case 'alumnos_nivel_superior': datos = await window.ReportEngine.alumnos_nivel_superior(client); break;
        case 'corte_caja_efectivo': datos = await window.ReportEngine.corte_caja_diario(client, inicio, 1); break;
        case 'corte_caja_tarjeta': datos = await window.ReportEngine.corte_caja_diario(client, inicio, 2); break;
        case 'corte_caja_total': datos = await window.ReportEngine.corte_caja_diario(client, inicio, 3); break;
        case 'analisis_ingresos': datos = await window.ReportEngine.analisis_ingresos(client, inicio, fin); break;
        case 'deudores': datos = await window.ReportEngine.deudores(client, inicio); break;
        case 'pagos_adelantados': datos = await window.ReportEngine.pagos_adelantados(client); break;
        case 'reporte_mensual_maestros': datos = await window.ReportEngine.reporte_mensual_maestros(client); break;
        case 'articulos_vendidos': datos = await window.ReportEngine.articulos_vendidos(client, inicio, fin); break;
        case 'stock_critico': datos = await window.ReportEngine.stock_critico(client); break;
        default: throw new Error('Reporte no implementado aún.');
    }

    if (!datos || datos.length === 0) {
        throw new Error('No se encontraron registros en el periodo o criterio seleccionado.');
    }

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
        const { datos, reporteNombre } = await generarDatosReporte();
        if (!datos || datos.length === 0) return;

        const keys = Object.keys(datos[0]);
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
        csvContent += keys.map(k => '"' + k.replace(/"/g, '""').toUpperCase() + '"').join(",") + "\r\n";
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

function mostrarReporte(titulo, datos) {
    const ventana = window.open('', '_blank', 'width=1100,height=800');
    if (!ventana) return alert('Por favor, habilite las ventanas emergentes para ver el reporte.');

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
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; font-size: 10pt; color: #333; }
                .header { border-bottom: 2px solid #2c3e50; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 10px; }
                h1 { margin: 0; font-size: 18pt; color: #2c3e50; }
                h2 { margin: 5px 0 0 0; font-size: 14pt; color: #7f8c8d; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #bdc3c7; padding: 10px; text-align: left; }
                th { background: #f2f2f2; font-weight: bold; color: #2c3e50; text-transform: uppercase; font-size: 9pt; }
                tr:nth-child(even) { background-color: #fafafa; }
                .footer { margin-top: 30px; font-size: 8pt; color: #95a5a6; text-align: center; border-top: 1px solid #eee; padding-top: 10px; }
                .btn-print { padding: 10px 20px; background: #2c3e50; color: white; border: none; border-radius: 4px; cursor: pointer; margin-bottom: 20px; font-weight: bold; transition: background 0.3s; }
                .btn-print:hover { background: #34495e; }
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
            <button class="btn-print" onclick="window.print()">🖨️ Imprimir / Guardar como PDF</button>
            ${tableHtml}
            <div class="footer">Este documento es para uso administrativo interno de SCALA Academias de Música. Total de registros encontrados: ${datos.length}</div>
        </body>
        </html>
    `);
    ventana.document.close();
}

// Exportar funciones al scope global explícitamente
window.imprimirReporte = imprimirReporte;
window.exportarCSV = exportarCSV;

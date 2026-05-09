/**
 * pagos-maestros.js - Lógica de cálculo de honorarios
 */

var g_maestros = [];
var g_configPagos = [];
var g_otrosCargos = [];

document.addEventListener('DOMContentLoaded', async function() {
    document.getElementById('fechaHoy').textContent = new Date().toLocaleDateString();
    
    // Set year selector
    const year = new Date().getFullYear();
    document.getElementById('anioSelect').value = year;
    
    // Set current month
    document.getElementById('mesSelect').value = new Date().getMonth() + 1;

    try {
        await cargarCatalogos();
    } catch (e) {
        console.error('Error inicializando pagos:', e);
    }
});

async function cargarCatalogos() {
    const client = window.supabase;
    if (!client) return;

    // Cargar maestros
    const { data: m, error: errM } = await client.from('maestros').select('*').eq('activo', true).order('nombre');
    if (!errM) {
        g_maestros = m;
        const sel = document.getElementById('maestroSelect');
        sel.innerHTML = '<option value="">-- Seleccione Maestro --</option>';
        m.forEach(item => {
            const opt = document.createElement('option');
            opt.value = item.id;
            opt.textContent = item.nombre;
            sel.appendChild(opt);
        });
    }

    // Cargar config general de pagos
    const { data: c, error: errC } = await client.from('config_pago_maestro').select('*');
    if (!errC) g_configPagos = c;
}

window.generarReporte = async function() {
    const client = window.supabase;
    const mId = document.getElementById('maestroSelect').value;
    const mes = parseInt(document.getElementById('mesSelect').value);
    const anio = parseInt(document.getElementById('anioSelect').value);

    if (!mId) return alert('Seleccione un maestro');

    const maestro = g_maestros.find(x => x.id == mId);
    document.getElementById('maestroNombre').textContent = maestro.nombre;
    document.getElementById('maestroFirma').textContent = maestro.nombre;
    document.getElementById('maestroRFC').textContent = maestro.rfc || '---';

    // Fechas del periodo
    const ini = new Date(anio, mes - 1, 1);
    const fin = new Date(anio, mes, 0);
    document.getElementById('fechaIniPeriodo').textContent = ini.toLocaleDateString();
    document.getElementById('fechaFinPeriodo').textContent = fin.toLocaleDateString();

    const body = document.getElementById('bodyPagos');
    body.innerHTML = '<tr><td colspan="4" style="text-align:center;">Calculando...</td></tr>';

    try {
        // 1. Grupos del maestro
        const { data: grupos, error: errG } = await client
            .from('grupos')
            .select('*, cursos(curso)')
            .eq('maestro_id', mId)
            .eq('activo', true);

        if (errG) throw errG;

        let itemsCobro = [];
        let totalBaseGlobal = 0;

        for (const g of grupos) {
            // Obtener alumnos activos en este grupo (desde tabla alumno_grupos)
            const { data: alumnosInscritos, error: errInsc } = await client
                .from('alumno_grupos')
                .select('alumno_id')
                .eq('grupo_clave', g.clave)
                .eq('estado', 'Activo');

            if (errInsc) {
                console.warn(`Error obteniendo alumnos para grupo ${g.clave}:`, errInsc);
                continue;
            }

            let countPaid = 0;
            let subtotalGrupo = 0;
            let infoGrupo = '';

            if (g.tipo_pago_maestro === 'ALUMNO') {
                // Solo pagar si el alumno TIENE recibo en este mes/año
                // Buscamos en recibos_detalle linkeado a recibos
                for (const al of alumnosInscritos) {
                    const { data: payments, error: errP } = await client
                        .from('recibos_detalle')
                        .select('id, recibos(id, created_at)')
                        .eq('alumno_id', al.alumno_id)
                        .ilike('concepto', '%COLEGIATURA%');
                    
                    if (!errP && payments) {
                        // Filtrar los que caen en el mes/año seleccionado
                        const hasCurrentMonthPay = payments.some(p => {
                            const pDate = new Date(p.recibos.created_at);
                            return (pDate.getMonth() + 1 === mes && pDate.getFullYear() === anio);
                        });
                        if (hasCurrentMonthPay) countPaid++;
                    }
                }

                // Lógica de Tiers: 250, 250, 260, 270...
                const configInst = g_configPagos.find(c => c.instrumento === g.cursos.curso && c.tipo === 'ALUMNO');
                const rates = configInst ? configInst.tarifas_alumno : [250, 250, 260, 270];

                let montoAlumnos = 0;
                for (let i = 0; i < countPaid; i++) {
                    const rate = rates[i] || rates[rates.length - 1]; 
                    montoAlumnos += rate;
                }
                subtotalGrupo = montoAlumnos;
                infoGrupo = `${countPaid} Alumno(s) PAGADO(S)`;
            } else {
                // Lógica Por Hora
                const configInst = g_configPagos.find(c => c.instrumento === g.cursos.curso && c.tipo === 'HORA');
                const hourlyRate = configInst ? configInst.monto_hora : 175;

                const numSesiones = contarDiasEnMes(anio, mes, g.dia); 
                subtotalGrupo = numSesiones * hourlyRate;
                infoGrupo = `${numSesiones} Horas (${g.hora_entrada})`;
            }

            if (subtotalGrupo > 0) {
                itemsCobro.push({
                    concepto: `${g.cursos.curso} (${g.clave})`,
                    cantidad: infoGrupo,
                    importe: (subtotalGrupo / (g.tipo_pago_maestro === 'ALUMNO' ? (countPaid || 1) : 1)).toFixed(2),
                    subtotal: subtotalGrupo
                });
                totalBaseGlobal += subtotalGrupo;
            }
        }

        // Renderizar tabla
        body.innerHTML = '';
        if (itemsCobro.length === 0) {
            body.innerHTML = '<tr><td colspan="4" style="text-align:center;">No hay pagos pendientes para este periodo.</td></tr>';
        } else {
            itemsCobro.forEach(it => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${it.concepto}</td>
                    <td>${it.cantidad}</td>
                    <td>$ ${it.importe}</td>
                    <td>$ ${it.subtotal.toFixed(2)}</td>
                `;
                body.appendChild(tr);
            });
        }

        actualizarTotales(totalBaseGlobal);

    } catch (e) {
        console.error(e);
        body.innerHTML = `<tr><td colspan="4" style="text-align:center; color:red;">Error: ${e.message}</td></tr>`;
    }
};

function contarDiasEnMes(anio, mes, diaCod) {
    const mapa = { 'LU': 1, 'MA': 2, 'MI': 3, 'JU': 4, 'VI': 5, 'SA': 6, 'DO': 0 };
    const target = mapa[diaCod];
    let count = 0;
    const d = new Date(anio, mes - 1, 1);
    while (d.getMonth() === mes - 1) {
        if (d.getDay() === target) count++;
        d.setDate(d.getDate() + 1);
    }
    return count;
}

window.agregarOtroCargo = function() {
    const container = document.getElementById('listaOtros');
    const div = document.createElement('div');
    div.className = 'totals-row';
    div.style.marginBottom = '5px';
    div.innerHTML = `
        <input type="text" placeholder="Concepto..." style="width: 150px; font-size: 10px;" onchange="recalcularDesdeOtros()">
        <input type="number" value="0" style="width: 60px; font-size: 10px;" class="monto-otro" onchange="recalcularDesdeOtros()">
        <button class="no-print" onclick="this.parentElement.remove(); recalcularDesdeOtros();" style="font-size: 8px;">X</button>
    `;
    container.appendChild(div);
};

window.recalcularDesdeOtros = function() {
    // Buscar el subtotal base actual
    const rows = document.querySelectorAll('#bodyPagos tr');
    let totalBase = 0;
    rows.forEach(r => {
        const lastTd = r.querySelector('td:last-child');
        if (lastTd) {
            const val = parseFloat(lastTd.textContent.replace('$ ', ''));
            if (!isNaN(val)) totalBase += val;
        }
    });

    actualizarTotales(totalBase);
};

function actualizarTotales(baseGrupos) {
    // Sumar otros cargos
    let totalOtros = 0;
    document.querySelectorAll('.monto-otro').forEach(input => {
        totalOtros += parseFloat(input.value) || 0;
    });

    const subtotal = baseGrupos + totalOtros;
    const iva = subtotal * 0.16;
    const totalConIva = subtotal + iva;
    const retISR = subtotal * 0.10;
    const retIVA = iva * (2/3); // Aprox 10.67% del subtotal si el IVA es 16%

    document.getElementById('sumaBase').textContent = `$ ${subtotal.toFixed(2)}`;
    document.getElementById('ivaMonto').textContent = `$ ${iva.toFixed(2)}`;
    document.getElementById('subtConIva').textContent = `$ ${totalConIva.toFixed(2)}`;
    document.getElementById('retencionISR').textContent = `$ ${retISR.toFixed(2)}`;
    document.getElementById('retencionIVA').textContent = `$ ${retIVA.toFixed(2)}`;
    
    const neto = totalConIva - retISR - retIVA;
    document.getElementById('pagoNeto').textContent = `$ ${neto.toFixed(2)}`;
}

// mantenimiento.js - Módulo de Mantenimiento
let supabase = null;

// Esperar a que se cargue la librería de Supabase
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM cargado, inicializando mantenimiento...');

    // Esperar a que Supabase esté listo
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

    console.log('Inicialización de mantenimiento completa');
});

// Actualizar fecha y hora
function updateDateTime() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();

    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    const ampm = hours >= 12 ? 'p. m.' : 'a. m.';
    hours = hours % 12;
    hours = hours ? hours : 12;
    hours = String(hours).padStart(2, '0');

    const dateTimeString = `${day}/${month}/${year} ${hours}:${minutes}:${seconds} ${ampm}`;
    const datetimeElement = document.getElementById('datetime');
    if (datetimeElement) {
        datetimeElement.textContent = dateTimeString;
    }
}

// Corrige Alumnos por Grupo
async function corrigeAlumnosGrupo() {
    if (!supabase) {
        alert('Error: Base de datos no conectada');
        return;
    }

    if (!confirm('Esta función actualizará el contador de alumnos en cada grupo.\n\n¿Desea continuar?')) {
        return;
    }

    try {
        // Obtener todos los grupos
        const { data: grupos, error: errorGrupos } = await supabase
            .from('grupos')
            .select('id, clave');

        if (errorGrupos) throw errorGrupos;

        let actualizados = 0;

        // Para cada grupo, contar alumnos y actualizar
        for (const grupo of grupos) {
            // Contar alumnos activos en el grupo
            const { count, error: errorCount } = await supabase
                .from('alumnos')
                .select('*', { count: 'exact', head: true })
                .eq('grupo', grupo.clave)
                .eq('status', 'activo');

            if (errorCount) {
                console.error(`Error al contar alumnos del grupo ${grupo.clave}:`, errorCount);
                continue;
            }

            // Actualizar contador en el grupo
            const { error: errorUpdate } = await supabase
                .from('grupos')
                .update({ alumnos_inscritos: count || 0 })
                .eq('id', grupo.id);

            if (errorUpdate) {
                console.error(`Error al actualizar grupo ${grupo.clave}:`, errorUpdate);
                continue;
            }

            actualizados++;
        }

        alert(`Proceso completado.\n\nGrupos actualizados: ${actualizados} de ${grupos.length}`);
    } catch (error) {
        console.error('Error en corrigeAlumnosGrupo:', error);
        alert('Error al corregir alumnos por grupo: ' + error.message);
    }
}

// Depuración de Pagos
async function depuracionPagos() {
    if (!confirm('Esta función eliminará registros de pagos duplicados o inconsistentes.\n\n¿Desea continuar?')) {
        return;
    }

    try {
        // Buscar operaciones duplicadas (mismo recibo, misma fecha)
        const { data: operaciones, error } = await supabase
            .from('operaciones')
            .select('*')
            .order('num_recibo', { ascending: true })
            .order('fecha', { ascending: true });

        if (error) throw error;

        let duplicados = 0;
        const vistos = new Set();
        const paraEliminar = [];

        operaciones.forEach(op => {
            const key = `${op.num_recibo}-${op.fecha}-${op.monto}`;
            if (vistos.has(key)) {
                paraEliminar.push(op.id);
                duplicados++;
            } else {
                vistos.add(key);
            }
        });

        if (duplicados > 0) {
            if (confirm(`Se encontraron ${duplicados} registros duplicados.\n\n¿Desea eliminarlos?`)) {
                for (const id of paraEliminar) {
                    await supabase
                        .from('operaciones')
                        .delete()
                        .eq('id', id);
                }
                alert(`Depuración completada.\n\nRegistros eliminados: ${duplicados}`);
            }
        } else {
            alert('No se encontraron registros duplicados.');
        }
    } catch (error) {
        console.error('Error en depuracionPagos:', error);
        alert('Error al depurar pagos: ' + error.message);
    }
}

// Verifica Credencial
async function verificaCredencial() {
    const credencial = prompt('Ingrese la credencial a verificar:');

    if (!credencial) {
        return;
    }

    try {
        // Buscar alumno por credencial
        const { data: alumno, error } = await supabase
            .from('alumnos')
            .select('*')
            .eq('credencial', credencial)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                alert(`Credencial ${credencial} no encontrada en la base de datos.`);
            } else {
                throw error;
            }
            return;
        }

        // Verificar dígito verificador
        const digitoCalculado = calcularDigitoVerificador(credencial);
        const digitoActual = credencial.slice(-1);

        let mensaje = `VERIFICACIÓN DE CREDENCIAL\n\n`;
        mensaje += `Credencial: ${credencial}\n`;
        mensaje += `Nombre: ${alumno.nombre} ${alumno.apellido_paterno} ${alumno.apellido_materno}\n`;
        mensaje += `Status: ${alumno.status}\n\n`;
        mensaje += `Dígito verificador actual: ${digitoActual}\n`;
        mensaje += `Dígito verificador calculado: ${digitoCalculado}\n\n`;

        if (digitoActual === digitoCalculado) {
            mensaje += `✓ La credencial es VÁLIDA`;
        } else {
            mensaje += `✗ La credencial es INVÁLIDA\n\nSe recomienda corregir el dígito verificador.`;
        }

        alert(mensaje);
    } catch (error) {
        console.error('Error en verificaCredencial:', error);
        alert('Error al verificar credencial: ' + error.message);
    }
}

// Calcular dígito verificador (basado en el algoritmo original)
function calcularDigitoVerificador(credencial) {
    // Extraer los primeros 5 dígitos
    const numeros = credencial.substring(0, 5);

    const diezm = parseInt(numeros[0]) || 0;
    const miles = parseInt(numeros[1]) || 0;
    const cientos = parseInt(numeros[2]) || 0;
    const dieces = parseInt(numeros[3]) || 0;
    const unidades = parseInt(numeros[4]) || 0;

    const suma = (diezm * 6) + (miles * 5) + (cientos * 4) + (dieces * 3) + (unidades * 2);
    const digito = suma % 7;

    return String(7 - digito);
}

// Mantenimiento a Cambios
async function mantenimientoCambios() {
    window.location.href = 'mantenimiento.html'; // Redirigir al módulo específico
    alert('Módulo de Mantenimiento a Cambios\n\nEsta funcionalidad permite:\n- Ver historial de cambios de alumnos\n- Corregir cambios erróneos\n- Auditar modificaciones\n\nEn desarrollo...');
}

// Verifica Integridad
async function verificaIntegridad() {
    if (!confirm('Esta función verificará la integridad de la base de datos.\n\nEsto puede tomar varios minutos.\n\n¿Desea continuar?')) {
        return;
    }

    try {
        let problemas = [];

        // 1. Verificar alumnos sin grupo
        const { data: alumnosSinGrupo, error: e1 } = await supabase
            .from('alumnos')
            .select('credencial, nombre, apellido_paterno')
            .eq('status', 'activo')
            .is('grupo', null);

        if (e1) throw e1;
        if (alumnosSinGrupo && alumnosSinGrupo.length > 0) {
            problemas.push(`${alumnosSinGrupo.length} alumnos activos sin grupo asignado`);
        }

        // 2. Verificar grupos sin maestro
        const { data: gruposSinMaestro, error: e2 } = await supabase
            .from('grupos')
            .select('clave_grupo')
            .is('maestro_id', null);

        if (e2) throw e2;
        if (gruposSinMaestro && gruposSinMaestro.length > 0) {
            problemas.push(`${gruposSinMaestro.length} grupos sin maestro asignado`);
        }

        // 3. Verificar operaciones sin recibo
        const { data: operacionesSinRecibo, error: e3 } = await supabase
            .from('operaciones')
            .select('id')
            .is('num_recibo', null);

        if (e3) throw e3;
        if (operacionesSinRecibo && operacionesSinRecibo.length > 0) {
            problemas.push(`${operacionesSinRecibo.length} operaciones sin número de recibo`);
        }

        // Mostrar resultados
        let mensaje = 'VERIFICACIÓN DE INTEGRIDAD\n\n';

        if (problemas.length === 0) {
            mensaje += '✓ No se encontraron problemas de integridad.\n\nLa base de datos está en buen estado.';
        } else {
            mensaje += `Se encontraron ${problemas.length} problemas:\n\n`;
            problemas.forEach((p, i) => {
                mensaje += `${i + 1}. ${p}\n`;
            });
            mensaje += '\nSe recomienda corregir estos problemas.';
        }

        alert(mensaje);
    } catch (error) {
        console.error('Error en verificaIntegridad:', error);
        alert('Error al verificar integridad: ' + error.message);
    }
}

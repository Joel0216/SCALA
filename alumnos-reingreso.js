// Inicializar Supabase
let supabase = null;
let bajaData = null;
let grupos = [];
let grupoSeleccionado = null;

// Esperar a que se cargue la librería de Supabase
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM cargado, inicializando reingreso de alumno...');

    try {
        await new Promise(r => setTimeout(r, 500));
        if (typeof waitForSupabase === 'function') {
            supabase = await waitForSupabase(10000);
            console.log('✓ Supabase conectado');
        }
    } catch (e) {
        console.error('Error conectando a Supabase:', e);
    }

    // Actualizar fecha y hora
    actualizarFechaHora();
    setInterval(actualizarFechaHora, 1000);

    // Cargar datos de la baja desde localStorage
    cargarDatosBaja();

    // Cargar grupos disponibles
    await cargarGrupos();

    // Setup event listeners
    setupEventListeners();

    console.log('Inicialización completa');
});

// Actualizar fecha y hora
function actualizarFechaHora() {
    const ahora = new Date();
    const dia = String(ahora.getDate()).padStart(2, '0');
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const anio = ahora.getFullYear();
    let horas = ahora.getHours();
    const minutos = String(ahora.getMinutes()).padStart(2, '0');
    const segundos = String(ahora.getSeconds()).padStart(2, '0');
    const ampm = horas >= 12 ? 'p. m.' : 'a. m.';
    horas = horas % 12 || 12;
    const horasStr = String(horas).padStart(2, '0');

    const datetime = document.getElementById('datetime');
    if (datetime) {
        datetime.textContent = `${dia}/${mes}/${anio} ${horasStr}:${minutos}:${segundos} ${ampm}`;
    }
}

// Cargar datos de la baja desde localStorage
function cargarDatosBaja() {
    const bajaJSON = localStorage.getItem('bajaParaReingreso');

    if (!bajaJSON) {
        mostrarAlerta('Error: No se encontraron datos del alumno.\n\nDebe seleccionar un alumno desde el módulo de Bajas.').then(() => {
            window.location.href = 'alumnos-bajas.html';
        });
        return;
    }

    bajaData = JSON.parse(bajaJSON);

    // Llenar campos
    document.getElementById('credencial1').value = bajaData.credencial1 || '';
    document.getElementById('credencial2').value = bajaData.credencial2 || '';
    document.getElementById('nombre').value = bajaData.nombre || '';
    document.getElementById('ultimoGrupo').value = bajaData.grupo || '';

    // Beca
    if (bajaData.beca) {
        document.getElementById('beca').checked = true;
        document.getElementById('porcentajeBeca').disabled = false;
        document.getElementById('porcentajeBeca').value = bajaData.porcentaje_beca || '0.00';
    }

    console.log('✓ Datos de baja cargados:', bajaData);
}

// Cargar grupos disponibles
async function cargarGrupos() {
    if (!supabase) return;

    try {
        const { data, error } = await supabase
            .from('grupos')
            .select(`
                *,
                cursos (curso),
                maestros (nombre),
                salones (numero)
            `)
            .eq('activo', true)
            .order('clave', { ascending: true });

        if (error) throw error;

        grupos = data || [];
        console.log(`✓ ${grupos.length} grupos cargados`);

        // Llenar dropdown
        const select = document.getElementById('nuevoGrupo');
        select.innerHTML = '<option value="">-- Seleccione nuevo grupo --</option>';

        grupos.forEach(grupo => {
            const option = document.createElement('option');
            option.value = grupo.id;

            const nombreCurso = grupo.cursos?.curso || 'Sin curso';
            const dia = grupo.dia || '';
            const horario = grupo.hora_entrada && grupo.hora_salida
                ? `${grupo.hora_entrada.substring(0, 5)}-${grupo.hora_salida.substring(0, 5)}`
                : '';
            const salon = grupo.salones?.numero || '';

            option.textContent = `${grupo.clave} - ${nombreCurso} - ${dia} ${horario} - Salón ${salon}`;
            option.dataset.grupoData = JSON.stringify(grupo);

            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error cargando grupos:', error);
        mostrarAlerta('Error al cargar grupos: ' + error.message);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Checkbox de beca
    const checkBeca = document.getElementById('beca');
    const inputPorcentaje = document.getElementById('porcentajeBeca');

    if (checkBeca && inputPorcentaje) {
        checkBeca.addEventListener('change', function () {
            if (this.checked) {
                inputPorcentaje.disabled = false;
                inputPorcentaje.focus();
            } else {
                inputPorcentaje.disabled = true;
                inputPorcentaje.value = '0.00';
            }
            validarFormulario();
        });
    }

    // Dropdown de nuevo grupo
    const selectGrupo = document.getElementById('nuevoGrupo');
    if (selectGrupo) {
        selectGrupo.addEventListener('change', function () {
            const selectedOption = this.options[this.selectedIndex];

            if (selectedOption.value) {
                grupoSeleccionado = JSON.parse(selectedOption.dataset.grupoData);
                mostrarInfoGrupo(grupoSeleccionado);
            } else {
                grupoSeleccionado = null;
                document.getElementById('infoGrupoSeleccionado').style.display = 'none';
            }

            validarFormulario();
        });
    }

    // Validar al cambiar porcentaje
    if (inputPorcentaje) {
        inputPorcentaje.addEventListener('input', validarFormulario);
    }
}

// Mostrar información del grupo seleccionado
function mostrarInfoGrupo(grupo) {
    const infoDiv = document.getElementById('infoGrupoSeleccionado');

    document.getElementById('infoGrupoClave').textContent = grupo.clave || '';
    document.getElementById('infoGrupoCurso').textContent = grupo.cursos?.curso || 'Sin curso';
    document.getElementById('infoGrupoMaestro').textContent = grupo.maestros?.nombre || 'Sin maestro';
    document.getElementById('infoGrupoDia').textContent = grupo.dia || '';

    const horario = grupo.hora_entrada && grupo.hora_salida
        ? `${grupo.hora_entrada.substring(0, 5)} - ${grupo.hora_salida.substring(0, 5)}`
        : '';
    document.getElementById('infoGrupoHorario').textContent = horario;
    document.getElementById('infoGrupoSalon').textContent = grupo.salones?.numero || '';
    document.getElementById('infoGrupoCupo').textContent = grupo.cupo || '0';

    const disponibles = (grupo.cupo || 0) - (grupo.alumnos_inscritos || 0);
    document.getElementById('infoGrupoDisponibles').textContent = disponibles;

    infoDiv.style.display = 'block';
}

// Validar formulario
function validarFormulario() {
    const credencial1 = document.getElementById('credencial1').value.trim();
    const nombre = document.getElementById('nombre').value.trim();
    const ultimoGrupo = document.getElementById('ultimoGrupo').value.trim();
    const nuevoGrupo = document.getElementById('nuevoGrupo').value;

    const btnGuardar = document.getElementById('btnGuardar');

    // Validación estricta: todos los campos obligatorios deben tener datos
    if (credencial1 && nombre && ultimoGrupo && nuevoGrupo) {
        btnGuardar.disabled = false;
    } else {
        btnGuardar.disabled = true;
    }
}

// Guardar reingreso
async function guardarReingreso() {
    if (!supabase || !bajaData) {
        await mostrarAlerta('Error: Datos no disponibles');
        return;
    }

    // Validar campos obligatorios
    const nuevoGrupoId = document.getElementById('nuevoGrupo').value;
    if (!nuevoGrupoId) {
        await mostrarAlerta('Por favor seleccione el nuevo grupo');
        return;
    }

    const tieneBeca = document.getElementById('beca').checked;
    const porcentajeBeca = tieneBeca ? parseFloat(document.getElementById('porcentajeBeca').value) : 0;
    const observaciones = document.getElementById('observaciones').value.trim();

    try {
        // --- GESTIÓN DE CUPOS ---
        const { data: gData, error: gErr } = await supabase.from('grupos')
            .select('id, cupo, alumnos_inscritos')
            .eq('clave', grupoSeleccionado.clave)
            .eq('activo', true)
            .single();

        if (!gErr && gData) {
            if (gData.alumnos_inscritos >= gData.cupo) {
                const expandir = await mostrarConfirm('El grupo ' + grupoSeleccionado.clave + ' está lleno (Cupo: ' + gData.cupo + '). ¿Desea expandirlo?');
                if (!expandir) return;

                let cantidad = null;
                while (cantidad === null) {
                    let resp = await mostrarPrompt('Ingrese la cantidad de lugares a aumentar (Solo números enteros positivos):');
                    if (resp === null) return;
                    if (/^\d+$/.test(resp)) {
                        cantidad = parseInt(resp);
                        if (cantidad <= 0) cantidad = null;
                    }
                    if (cantidad === null) await mostrarAlerta('Por favor ingrese un número entero positivo válido.');
                }

                const { error: updError } = await supabase.from('grupos')
                    .update({ cupo: gData.cupo + cantidad })
                    .eq('id', gData.id);

                if (updError) {
                    await mostrarAlerta('Error al expandir el cupo: ' + updError.message);
                    return;
                }
            }
        }
        // -------------------------

        console.log('Guardando reingreso...');

        // Llamar a la función de PostgreSQL para reingresar al alumno
        const { data, error } = await supabase.rpc('reingresar_alumno', {
            p_baja_id: bajaData.id,
            p_grupo_nuevo: grupoSeleccionado.clave,
            p_beca: tieneBeca,
            p_porcentaje_beca: porcentajeBeca,
            p_observaciones: observaciones
        });

        if (error) throw error;

        await mostrarAlerta(`Alumno reingresado correctamente\n\nNombre: ${bajaData.nombre}\nCredencial: ${bajaData.credencial1}-${bajaData.credencial2}\nGrupo Anterior: ${bajaData.grupo}\nGrupo Nuevo: ${grupoSeleccionado.clave}\nBeca: ${tieneBeca ? porcentajeBeca + '%' : 'No'}\n\nEl alumno ha sido reactivado en el sistema.`);

        // Limpiar localStorage
        localStorage.removeItem('bajaParaReingreso');

        // Preguntar si desea reingresar otro alumno
        const reingresarOtro = await mostrarConfirm('¿Desea reingresar otro alumno?');
        if (reingresarOtro) {
            window.location.href = 'alumnos-bajas.html';
        } else {
            window.location.href = 'alumnos.html';
        }
    } catch (error) {
        console.error('Error guardando reingreso:', error);

        if (error.message.includes('ya fue reingresado')) {
            await mostrarAlerta('Error: Este alumno ya fue reingresado anteriormente.\n\nNo se puede reingresar dos veces el mismo registro.');
        } else {
            await mostrarAlerta('Error al guardar reingreso: ' + error.message);
        }
    }
}

// Cancelar
async function cancelar() {
    const confirmar = await mostrarConfirm('¿Está seguro de cancelar el reingreso?\n\nSe perderán todos los datos ingresados.');
    if (confirmar) {
        localStorage.removeItem('bajaParaReingreso');
        window.location.href = 'alumnos-bajas.html';
    }
}

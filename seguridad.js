/**
 * seguridad.js - Gestión de Usuarios, Organizaciones y Restricciones (NMC)
 */

let db = null;
let currentUser = null;
let g_organizaciones = [];
let g_usuarios = [];

const G_CATEGORIAS_PERMISOS = {
    'SEGURIDAD': ['Cambiar Password', 'Usuario Nuevo', 'Borrar Usuario', 'Restricciones'],
    'MANTENIMIENTO': ['Procesos Especiales', 'Administracion Gral.'],
    'CAJA': ['Cobros', 'Consultas y Bajas', 'Recibos Cancelados', 'Corte 1', 'Corte 2', 'Corte 3'],
    'ARCHIVOS': ['Alumnos', 'Maestros', 'Cursos', 'Articulos', 'Movim. Inventario', 'Bajas', 'Factores de Pago', 'Grupos', 'Grupos de Articulos', "R.F.C.'s", 'Horarios'],
    'EXAMENES': ['Programacion de Examenes', 'Relacion por Examenes', 'Reasignacion de Examenes'],
    'OTROS CATALOGOS': ['Motivos (Conc. de Baja)', 'Instrumentos (Equip.)', 'Medios (Canales difusion)', 'Salones (Aulas e inst.)'],
    'REPORTES': ['Impresion de Reportes']
};

let g_secciones = Object.values(G_CATEGORIAS_PERMISOS).flat();

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Inicializando seguridad SaaS...');
    
    currentUser = SessionManager.getCurrentUser();
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    db = await window.waitForSupabase();
    
    setupUI();
    setupTabs();
    cargarDatosIniciales();
    // Configuración para pestaña Restricciones
    if (currentUser.rol === 'SuperAdmin') {
        document.getElementById('divSelectOrgRestriccion').style.display = 'block';
        document.getElementById('divAcademiaStatic').style.display = 'none';
    } else {
        document.getElementById('divSelectOrgRestriccion').style.display = 'none';
        document.getElementById('divAcademiaStatic').style.display = 'block';
        document.getElementById('viewAcademia').value = currentUser.org_nombre || 'Sede Principal';
    }

    // Aplicar protección de seguridad
    if (typeof SessionManager !== 'undefined') {
        SessionManager.protectPage('Seguridad');
    }
});

function setupUI() {
    document.getElementById('orgNameHeader').textContent = currentUser.org_nombre;
    document.getElementById('userRank').textContent = `Rango: ${currentUser.rol}`;

    // Solo SuperAdmin ve la pestaña de organizaciones
    if (currentUser.rol === 'SuperAdmin') {
        document.getElementById('tabOrgBtn').style.display = 'block';
        document.getElementById('divSelectOrg').style.display = 'block';
    }
}

function setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const target = tab.getAttribute('data-tab');
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(target).classList.add('active');
            
            if (target === 'tab-usuarios') cargarUsuarios();
            if (target === 'tab-organizaciones') cargarOrganizaciones();
            if (target === 'tab-restricciones') prepararRestricciones();
        });
    });
}

async function cargarDatosIniciales() {
    await cargarUsuarios();
    if (currentUser.rol === 'SuperAdmin') {
        await cargarOrganizaciones();
    }
}

// =====================================================
// GESTIÓN DE ORGANIZACIONES (SuperAdmin)
// =====================================================

async function cargarOrganizaciones() {
    try {
        const { data, error } = await db.from('organizaciones').select('*').order('nombre');
        if (error) throw error;
        
        g_organizaciones = data;
        const tbody = document.getElementById('tbodyOrganizaciones');
        const selectOrg = document.getElementById('u_org');
        const selectOrgRest = document.getElementById('selectOrgRestriccion');
        
        tbody.innerHTML = '';
        selectOrg.innerHTML = '<option value="">-- Seleccione organización --</option>';
        if (selectOrgRest) selectOrgRest.innerHTML = '<option value="">-- Todas las Academias --</option>';

        data.forEach(org => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${org.nombre}</td>
                <td><small>${org.id}</small></td>
                <td>
                    <button class="premium-btn btn-danger" style="padding: 5px 10px;" onclick="eliminarOrganizacion('${org.id}', '${org.nombre}')">BORRAR</button>
                </td>
            `;
            tbody.appendChild(tr);

            const opt = document.createElement('option');
            opt.value = org.id;
            opt.textContent = org.nombre;
            selectOrg.appendChild(opt);

            if (selectOrgRest) {
                const optRest = opt.cloneNode(true);
                selectOrgRest.appendChild(optRest);
            }
        });
    } catch (e) {
        console.error('Error cargando organizaciones:', e);
    }
}

function abrirModalOrg() {
    document.getElementById('modalOrg').style.display = 'block';
}

function cerrarModalOrg() {
    document.getElementById('modalOrg').style.display = 'none';
}

function previewLogo(input) {
    const preview = document.getElementById('previewContainer');
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

async function crearOrganizacion() {
    const nombre = document.getElementById('o_nombre').value.trim();
    const logoFile = document.getElementById('o_logoFile').files[0];

    if (!nombre) return alert('El nombre es obligatorio');

    try {
        let logoUrl = null;

        // 1. Subir logo a Supabase Storage (si hay archivo)
        if (logoFile) {
            const fileName = `${Date.now()}_${logoFile.name}`;
            const { data: upload, error: errUp } = await db.storage
                .from('logos')
                .upload(fileName, logoFile);
            
            if (errUp) throw errUp;
            
            const { data: urlData } = db.storage.from('logos').getPublicUrl(fileName);
            logoUrl = urlData.publicUrl;
        }

        // 2. Crear organización (Usando select().single() para verificar creación exitosa)
        const { data: newOrg, error } = await db.from('organizaciones').insert([{
            nombre: nombre,
            logo_url: logoUrl
        }]).select().single();

        if (error) {
            if (error.code === '42501') {
                throw new Error('Error de permisos RLS: Asegúrese de tener permisos de SuperAdmin para crear organizaciones.');
            }
            throw error;
        }

        alert('Organización "' + newOrg.nombre + '" creada exitosamente');
        cerrarModalOrg();
        await cargarOrganizaciones();
    } catch (e) {
        console.error('Error detallado:', e);
        alert('ERROR AL CREAR ORGANIZACIÓN: ' + (e.message || 'Error desconocido'));
    }
}

async function eliminarOrganizacion(id, nombre) {
    if (id === '00000000-0000-0000-0000-000000000000') {
        await mostrarAlerta('No se puede eliminar la Sede Principal.');
        return;
    }

    // PASO 1: Pedir contraseña de SuperAdmin
    const passwordIngresada = await mostrarPrompt(
        `🔒 VERIFICACIÓN DE SEGURIDAD\n\nPara eliminar la organización "${nombre}", ingrese su contraseña de SuperAdmin:`
    );

    if (passwordIngresada === null) return;

    // PASO 2: Verificar contraseña contra la base de datos
    try {
        const { data: superUser, error: errUser } = await db
            .from('usuarios')
            .select('password')
            .eq('id', currentUser.id)
            .limit(1);

        if (errUser || !superUser || superUser.length === 0) {
            await mostrarAlerta('❌ No se pudo verificar la identidad. Intente de nuevo.');
            return;
        }

        if (superUser[0].password !== passwordIngresada) {
            await mostrarAlerta('❌ Contraseña incorrecta. Acción cancelada.');
            return;
        }

        // PASO 3: Confirmación final
        const confirmado = await mostrarConfirm(
            `⚠️ ¿ESTÁ COMPLETAMENTE SEGURO?\n\nAl eliminar la organización "${nombre}", se borrarán TODOS sus:\n\n• Usuarios\n• Alumnos y sus grupos\n• Maestros\n• Cursos y Grupos\n• Recibos\n• Prospectos\n• Y TODOS los datos relacionados.\n\nEsta acción es IRREVERSIBLE.`
        );

        if (!confirmado) return;

        // PASO 4: Borrado manual en orden de dependencia (hijos primero, padres después)
        console.log(`🗑️ Iniciando borrado completo de organización: ${nombre} (${id})`);

        // Primero obtener IDs de alumnos de esta organización para limpiar tablas hijas
        const { data: alumnosOrg } = await db.from('alumnos').select('id').eq('organizacion_id', id);
        const alumnoIds = alumnosOrg ? alumnosOrg.map(a => a.id) : [];

        // Obtener IDs de recibos de esta organización
        const { data: recibosOrg } = await db.from('recibos').select('id').eq('organizacion_id', id);
        const reciboIds = recibosOrg ? recibosOrg.map(r => r.id) : [];

        // Obtener IDs de maestros de esta organización
        const { data: maestrosOrg } = await db.from('maestros').select('id').eq('organizacion_id', id);
        const maestroIds = maestrosOrg ? maestrosOrg.map(m => m.id) : [];

        // Obtener IDs de cursos de esta organización
        const { data: cursosOrg } = await db.from('cursos').select('id').eq('organizacion_id', id);
        const cursoIds = cursosOrg ? cursosOrg.map(c => c.id) : [];

        // Obtener IDs de artículos de esta organización
        const { data: articulosOrg } = await db.from('articulos').select('id').eq('organizacion_id', id);
        const articuloIds = articulosOrg ? articulosOrg.map(a => a.id) : [];

        // --- NIVEL 3: Tablas más profundas (dependen de alumnos, recibos, maestros, cursos) ---
        
        // Borrar alumno_grupos (depende de alumnos)
        if (alumnoIds.length > 0) {
            for (let i = 0; i < alumnoIds.length; i += 50) {
                const batch = alumnoIds.slice(i, i + 50);
                await db.from('alumno_grupos').delete().in('alumno_id', batch);
            }
            console.log('  ✓ alumno_grupos eliminados');

            // Borrar colegiaturas (depende de alumnos)
            for (let i = 0; i < alumnoIds.length; i += 50) {
                const batch = alumnoIds.slice(i, i + 50);
                await db.from('colegiaturas').delete().in('alumno_id', batch);
            }
            console.log('  ✓ colegiaturas eliminadas');

            // Borrar programacion_examenes (depende de alumnos)
            for (let i = 0; i < alumnoIds.length; i += 50) {
                const batch = alumnoIds.slice(i, i + 50);
                await db.from('programacion_examenes').delete().in('alumno_id', batch);
            }
            console.log('  ✓ programacion_examenes eliminadas');

            // Borrar alumnos_bajas (depende de alumnos)
            for (let i = 0; i < alumnoIds.length; i += 50) {
                const batch = alumnoIds.slice(i, i + 50);
                await db.from('alumnos_bajas').delete().in('alumno_id', batch);
            }
            console.log('  ✓ alumnos_bajas eliminadas');

            // Borrar cambios_alumnos (depende de alumnos)
            for (let i = 0; i < alumnoIds.length; i += 50) {
                const batch = alumnoIds.slice(i, i + 50);
                await db.from('cambios_alumnos').delete().in('alumno_id', batch);
            }
            console.log('  ✓ cambios_alumnos eliminados');

            // Borrar resultados_examen (depende de alumnos)
            for (let i = 0; i < alumnoIds.length; i += 50) {
                const batch = alumnoIds.slice(i, i + 50);
                await db.from('resultados_examen').delete().in('alumno_id', batch);
            }
            console.log('  ✓ resultados_examen eliminados');
        }

        // Borrar recibos_detalle y operaciones (dependen de recibos)
        if (reciboIds.length > 0) {
            for (let i = 0; i < reciboIds.length; i += 50) {
                const batch = reciboIds.slice(i, i + 50);
                await db.from('recibos_detalle').delete().in('recibo_id', batch);
                await db.from('operaciones').delete().in('recibo_id', batch);
            }
            console.log('  ✓ recibos_detalle y operaciones eliminados');
        }

        // Borrar factores (dependen de maestros y cursos)
        if (maestroIds.length > 0) {
            for (let i = 0; i < maestroIds.length; i += 50) {
                const batch = maestroIds.slice(i, i + 50);
                await db.from('factores').delete().in('maestro_id', batch);
            }
            console.log('  ✓ factores eliminados');
        }

        // Borrar movimientos_inventario (depende de artículos)
        if (articuloIds.length > 0) {
            for (let i = 0; i < articuloIds.length; i += 50) {
                const batch = articuloIds.slice(i, i + 50);
                await db.from('movimientos_inventario').delete().in('articulo_id', batch);
            }
            console.log('  ✓ movimientos_inventario eliminados');
        }

        // --- NIVEL 2: Tablas que dependen directamente de organizacion_id ---
        // ORDEN CRÍTICO: hijos antes que padres
        // prospectos depende de cursos → prospectos primero
        // grupos depende de cursos, maestros, salones → grupos primero
        const tablasDirectas = [
            'permisos_seguridad', 'recibos_cancelados', 'login_history',
            'prospectos',
            'alumnos', 'recibos', 'grupos',
            'maestros', 'cursos', 'salones',
            'movimientos_inventario', 'articulos', 'grupos_articulos',
            'rfc_credenciales', 'rfc_clientes',
            'motivos_baja', 'medios_contacto', 'instrumentos',
            'usuarios'
        ];

        for (const tabla of tablasDirectas) {
            try {
                const { error } = await db.from(tabla).delete().eq('organizacion_id', id);
                if (error) {
                    console.warn(`  ⚠ ${tabla}: ${error.message}`);
                } else {
                    console.log(`  ✓ ${tabla} eliminados`);
                }
            } catch (e) {
                console.warn(`  ⚠ ${tabla}: ${e.message}`);
            }
        }

        // --- NIVEL 1: Finalmente borrar la organización ---
        const { error } = await db.from('organizaciones').delete().eq('id', id);
        if (error) throw error;

        console.log(`✅ Organización "${nombre}" eliminada completamente`);
        await mostrarAlerta(`✓ La organización "${nombre}" y todos sus datos han sido eliminados exitosamente.`);
        await cargarOrganizaciones();
    } catch (e) {
        console.error('Error al eliminar organización:', e);
        await mostrarAlerta('❌ Error al eliminar: ' + e.message);
    }
}


// =====================================================
// GESTIÓN DE USUARIOS
// =====================================================

async function cargarUsuarios() {
    try {
        let query = SessionManager.applyIsolation(db.from('usuarios').select('*, organizaciones(nombre)'));
        
        // Si no es SuperAdmin, filtrar por su organización
        if (currentUser.rol !== 'SuperAdmin') {
            query = query.eq('organizacion_id', currentUser.organizacion_id);
        }

        const { data, error } = await query.order('rol');
        if (error) throw error;

        g_usuarios = data;
        const tbody = document.getElementById('tbodyUsuarios');
        tbody.innerHTML = '';

        data.forEach(u => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${u.user_id}</strong></td>
                <td>${u.nombre}</td>
                <td><span class="badge-${u.rol.toLowerCase()}">${u.rol}</span></td>
                <td>${u.organizaciones?.nombre || 'Sede Principal'}</td>
                <td>
                    <button class="premium-btn btn-danger" style="padding: 5px 10px;" onclick="eliminarUsuario('${u.id}', '${u.user_id}', '${u.rol}')">BORRAR</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        actualizarSelectRestricciones();
    } catch (e) {
        console.error('Error:', e);
    }
}

function abrirModalUsuario() {
    document.getElementById('modalUsuario').style.display = 'block';
    
    // Configurar roles permitidos
    const selectRol = document.getElementById('u_rol');
    selectRol.innerHTML = '';
    
    const roles = ['Empleado', 'Jefe', 'Admin'];
    // Un Admin puede crear Jefe/Empleado. Un Jefe puede crear Empleado.
    // Pero el usuario pidió: "admin puede crear usuarios no mayores que su rango"
    let permitidos = [];
    if (currentUser.rol === 'SuperAdmin' || currentUser.rol === 'Admin') permitidos = roles;
    else if (currentUser.rol === 'Jefe') permitidos = ['Empleado'];

    permitidos.forEach(r => {
        const opt = document.createElement('option');
        opt.value = r;
        opt.textContent = r;
        selectRol.appendChild(opt);
    });
}

function cerrarModalUsuario() {
    document.getElementById('modalUsuario').style.display = 'none';
}

async function guardarUsuario() {
    const userid = document.getElementById('u_userid').value.trim();
    const nombre = document.getElementById('u_nombre').value.trim();
    const email = document.getElementById('u_email').value.trim();
    const pass = document.getElementById('u_pass').value;
    const rol = document.getElementById('u_rol').value;
    
    let orgId = currentUser.organizacion_id;
    if (currentUser.rol === 'SuperAdmin') {
        orgId = document.getElementById('u_org').value;
        if (!orgId) return alert('Por favor, seleccione una organización para este usuario.');
    }

    if (!userid || !pass || !nombre) return alert('Faltan campos obligatorios (ID, Nombre y Contraseña)');

    try {
        // En un sistema SaaS real, aquí usaríamos supabase.auth.signUp
        // Por ahora, seguimos con la tabla 'usuarios' personalizada para mantener compatibilidad
        const { error } = await db.from('usuarios').insert([{
            user_id: userid,
            username: userid,
            nombre: nombre,
            email: email,
            password: pass,
            rol: rol,
            organizacion_id: orgId,
            activo: true
        }]);

        if (error) {
            if (error.code === '23505') throw new Error('El ID de usuario ya existe. Elija otro.');
            throw error;
        }

        alert('Usuario "' + userid + '" creado correctamente');
        cerrarModalUsuario();
        await cargarUsuarios();
    } catch (e) {
        console.error('Error al guardar usuario:', e);
        alert('ERROR AL CREAR USUARIO: ' + e.message);
    }
}

async function eliminarUsuario(id, userid, rol) {
    if (rol === 'SuperAdmin') return alert('No se puede eliminar al SuperAdmin');
    if (id === currentUser.id) return alert('No puedes eliminarte a ti mismo');

    if (!confirm(`¿Desea eliminar el acceso de "${userid}"?\n\nLos registros que haya realizado se conservarán para fines contables.`)) return;

    try {
        const { error } = await SessionManager.applyIsolation(db.from('usuarios').delete()).eq('id', id);
        if (error) throw error;
        alert('Usuario eliminado');
        cargarUsuarios();
    } catch (e) {
        alert('Error: ' + e.message);
    }
}

// =====================================================
// MATRIZ DE RESTRICCIONES (NMC)
// =====================================================

function actualizarSelectRestricciones() {
    const select = document.getElementById('selectUsuarioRestriccion');
    const orgFiltro = document.getElementById('selectOrgRestriccion').value;
    select.innerHTML = '<option value="">-- Elija un usuario --</option>';
    
    g_usuarios.forEach(u => {
        // 1. No permitir restringir al SuperAdmin
        if (u.rol === 'SuperAdmin') return; 
        
        // 2. Si no soy SuperAdmin, solo ver mi organización y solo ver empleados
        if (currentUser.rol !== 'SuperAdmin') {
            if (u.organizacion_id !== currentUser.organizacion_id) return;
            if (u.rol === 'Admin' || u.rol === 'Jefe') return; // Admin no restringe a otros Admin/Jefe
        } else {
            // Si soy SuperAdmin y hay filtro de org, aplicarlo
            if (orgFiltro && u.organizacion_id !== orgFiltro) return;
        }
        
        const opt = document.createElement('option');
        opt.value = u.id;
        opt.textContent = `${u.nombre} (${u.rol}) - ${u.organizaciones?.nombre || 'Sede'}`;
        select.appendChild(opt);
    });
}

async function prepararRestricciones() {
    document.getElementById('containerRestricciones').style.display = 'none';
    document.getElementById('selectUsuarioRestriccion').value = '';
}

async function cargarRestriccionesUsuario() {
    const userId = document.getElementById('selectUsuarioRestriccion').value;
    if (!userId) {
        document.getElementById('containerRestricciones').style.display = 'none';
        return;
    }

    // Actualizar ROL en la vista
    const user = g_usuarios.find(u => u.id === userId);
    if (user && document.getElementById('userRolBadge')) {
        document.getElementById('userRolBadge').textContent = user.rol;
    }

    try {
        const { data: pActuales } = await SessionManager.applyIsolation(db.from('permisos_seguridad').select('*')).eq('usuario_id', userId);
        
        const container = document.getElementById('gridRestricciones');
        container.innerHTML = '';

        for (const [cat, items] of Object.entries(G_CATEGORIAS_PERMISOS)) {
            const card = document.createElement('div');
            card.className = 'perm-cat-card';
            
            let html = `<div class="perm-cat-header cat-${cat.toLowerCase().replace(' ', '-')}">${cat}</div>`;
            html += `<div class="perm-cat-body">`;
            
            items.forEach(sec => {
                const perm = pActuales?.find(p => p.seccion === sec)?.permiso || 'M';
                html += `
                    <div class="perm-item">
                        <span class="perm-name">${sec}</span>
                        <select class="perm-select-mini" data-section="${sec}">
                            <option value="N" ${perm === 'N' ? 'selected' : ''}>N</option>
                            <option value="M" ${perm === 'M' ? 'selected' : ''}>M</option>
                            <option value="C" ${perm === 'C' ? 'selected' : ''}>C</option>
                        </select>
                    </div>
                `;
            });
            
            html += `</div>`;
            card.innerHTML = html;
            container.appendChild(card);
        }

        document.getElementById('containerRestricciones').style.display = 'block';
    } catch (e) {
        console.error(e);
    }
}

async function guardarRestricciones() {
    const userId = document.getElementById('selectUsuarioRestriccion').value;
    const selects = document.querySelectorAll('.perm-select-mini');
    const batch = [];

    const user = g_usuarios.find(u => u.id === userId);
    const orgId = user ? user.organizacion_id : null;

    selects.forEach(sel => {
        batch.push({
            usuario_id: userId,
            organizacion_id: orgId, // Guardar la organización del usuario restringido
            seccion: sel.getAttribute('data-section'),
            permiso: sel.value
        });
    });

    try {
        // Upsert masivo (requiere unique constraint en usuario_id, seccion)
        const { error } = await db.from('permisos_seguridad').upsert(batch, { onConflict: 'usuario_id, seccion' });
        
        if (error) throw error;
        alert('Permisos actualizados correctamente');
    } catch (e) {
        alert('Error guardando permisos: ' + e.message);
    }
}

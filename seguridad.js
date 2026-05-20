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

    if (!nombre) {
        await mostrarAlerta('El nombre es obligatorio');
        return;
    }

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

        await mostrarAlerta('Organización "' + newOrg.nombre + '" creada exitosamente');
        cerrarModalOrg();
        await cargarOrganizaciones();
    } catch (e) {
        console.error('Error detallado:', e);
        await mostrarAlerta('ERROR AL CREAR ORGANIZACIÓN: ' + (e.message || 'Error desconocido'));
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

        // Lista exhaustiva de tablas a limpiar
        const tablas = [
            'alumno_grupos', 'colegiaturas', 'programacion_examenes', 
            'alumnos_bajas', 'cambios_alumnos', 'resultados_examen',
            'recibos_detalle', 'operaciones', 'factores', 'movimientos_inventario',
            'permisos_seguridad', 'recibos_cancelados', 'login_history',
            'prospectos', 'alumnos', 'recibos', 'grupos',
            'maestros', 'cursos', 'salones',
            'articulos', 'grupos_articulos',
            'rfc_credenciales', 'rfc_clientes',
            'motivos_baja', 'medios_contacto', 'instrumentos',
            'usuarios'
        ];

        // Recorrer y borrar de cada tabla de manera controlada
        for (const tabla of tablas) {
            try {
                // Filtramos por organizacion_id o borramos todo lo relacionado si falla
                const { error } = await db.from(tabla).delete().eq('organizacion_id', id);
                if (error && error.code !== 'PGRST116') {
                    console.warn(`Aviso en tabla ${tabla}: ${error.message}`);
                } else {
                    console.log(`✓ Registros de ${tabla} eliminados o validados.`);
                }
            } catch (err) {
                // Si da 404 porque no hay registros u otro error de fetch, lo ignoramos y seguimos adelante
                console.warn(`Aviso en tabla ${tabla}: ${err.message || 'Sin registros'}`);
            }
        }

        // --- NIVEL 1: Finalmente borrar la organización ---
        const { error: errorFinal } = await db.from('organizaciones').delete().eq('id', id);
        if (errorFinal) throw errorFinal;

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
        
        // Si no es SuperAdmin, filtrar por su organización y ocultar al SuperAdmin
        if (currentUser.rol !== 'SuperAdmin') {
            query = query.eq('organizacion_id', currentUser.organizacion_id)
                         .neq('rol', 'SuperAdmin');
        }

        const { data, error } = await query.order('rol');
        if (error) throw error;

        g_usuarios = data;
        const tbody = document.getElementById('tbodyUsuarios');
        tbody.innerHTML = '';

        data.forEach(u => {
            const tr = document.createElement('tr');
            const esMismoUsuario = u.id === currentUser.id;
            const esSuperAdmin = u.rol === 'SuperAdmin';
            const soySuperAdmin = currentUser.rol === 'SuperAdmin';
            
            let btns = '';
            
            // Lógica para el botón CLAVE (cambiar contraseña)
            // 1. Un SuperAdmin puede cambiar la contraseña de todos (incluyendo la suya propia)
            // 2. Un usuario común no-SuperAdmin puede cambiar claves de otros no-SuperAdmin de su org, y la suya propia.
            if (soySuperAdmin || !esSuperAdmin) {
                btns += `<button class="premium-btn btn-save" style="padding: 5px 10px; margin-right: 5px;" onclick="cambiarPasswordUsuario('${u.id}', '${u.user_id}')">CLAVE</button>`;
            }
            
            // Lógica para el botón BORRAR
            // 1. Nadie puede borrarse a sí mismo.
            // 2. SuperAdmin puede borrar a cualquier otro usuario.
            // 3. Un usuario común no-SuperAdmin puede borrar a otros usuarios no-SuperAdmin de su organización.
            if (!esMismoUsuario) {
                if (soySuperAdmin || !esSuperAdmin) {
                    btns += `<button class="premium-btn btn-danger" style="padding: 5px 10px;" onclick="eliminarUsuario('${u.id}', '${u.user_id}', '${u.rol}')">BORRAR</button>`;
                }
            } else {
                btns += `<span style="color:#64748b; font-size:0.85rem; font-style:italic; margin-left: 5px;">Tu Usuario</span>`;
            }
            
            // Doble capa de seguridad visual: si de alguna manera se lista un SuperAdmin a alguien que no lo es
            if (esSuperAdmin && !soySuperAdmin) {
                btns = `<span style="color:#ef4444; font-size:0.85rem; font-weight:bold; font-style:italic;">Protegido (SuperAdmin)</span>`;
            }

            tr.innerHTML = `
                <td><strong>${u.user_id}</strong></td>
                <td>${u.nombre}</td>
                <td><span class="badge-${u.rol.toLowerCase()}">${u.rol}</span></td>
                <td>${u.organizaciones?.nombre || 'Sede Principal'}</td>
                <td>
                    ${btns}
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
        if (!orgId) {
            await mostrarAlerta('Por favor, seleccione una organización para este usuario.');
            return;
        }
    }

    if (!userid || !pass || !nombre) {
        await mostrarAlerta('Faltan campos obligatorios (ID, Nombre y Contraseña)');
        return;
    }

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

        await mostrarAlerta('Usuario "' + userid + '" creado correctamente');
        cerrarModalUsuario();
        await cargarUsuarios();
    } catch (e) {
        console.error('Error al guardar usuario:', e);
        await mostrarAlerta('ERROR AL CREAR USUARIO: ' + e.message);
    }
}

async function eliminarUsuario(id, userid, rol) {
    // Doble verificación de jerarquía
    if (rol === 'SuperAdmin' && currentUser.rol !== 'SuperAdmin') {
        await mostrarAlerta('No tienes rango suficiente para eliminar a un SuperAdmin');
        return;
    }
    if (id === currentUser.id) {
        await mostrarAlerta('No puedes eliminarte a ti mismo');
        return;
    }

    const confirmado = await mostrarConfirm(
        `¿Desea eliminar el acceso de "${userid}"?\n\nLos registros que haya realizado se conservarán para fines contables.`
    );
    if (!confirmado) return;

    try {
        const { error } = await SessionManager.applyIsolation(db.from('usuarios').delete()).eq('id', id);
        if (error) throw error;
        await mostrarAlerta('Usuario eliminado exitosamente.');
        cargarUsuarios();
    } catch (e) {
        await mostrarAlerta('Error: ' + e.message);
    }
}

async function cambiarPasswordUsuario(id, userid) {
    // Doble verificación de jerarquía
    const userAEditar = g_usuarios.find(u => u.id === id);
    if (userAEditar && userAEditar.rol === 'SuperAdmin' && currentUser.rol !== 'SuperAdmin') {
        await mostrarAlerta('❌ No puedes cambiar la contraseña de un SuperAdmin.');
        return;
    }

    const nuevaPassword = await mostrarPrompt(
        `🔑 CAMBIAR CONTRASEÑA\n\nIngrese la nueva contraseña para el usuario "${userid}":`
    );

    if (nuevaPassword === null) return; // Cancelado

    const passTrimmed = nuevaPassword.trim();
    if (!passTrimmed) {
        await mostrarAlerta('❌ La contraseña no puede estar vacía.');
        return;
    }

    try {
        const { error } = await SessionManager.applyIsolation(
            db.from('usuarios').update({ password: passTrimmed })
        ).eq('id', id);

        if (error) throw error;

        await mostrarAlerta(`✓ Contraseña del usuario "${userid}" actualizada exitosamente.`);
    } catch (e) {
        console.error('Error al cambiar contraseña:', e);
        await mostrarAlerta('❌ Error al cambiar la contraseña: ' + e.message);
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
        await mostrarAlerta('Permisos actualizados correctamente');
    } catch (e) {
        await mostrarAlerta('Error guardando permisos: ' + e.message);
    }
}

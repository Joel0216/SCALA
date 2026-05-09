/**
 * seguridad.js - Gestión de Usuarios, Organizaciones y Restricciones (NMC)
 */

let db = null;
let currentUser = null;
let g_organizaciones = [];
let g_usuarios = [];
let g_secciones = ['Archivos', 'Caja', 'Reportes', 'Exámenes', 'Mantenimiento', 'Seguridad'];

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
        
        tbody.innerHTML = '';
        selectOrg.innerHTML = '<option value="">-- Seleccione organización --</option>';

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

        // 2. Crear organización
        const { error } = await db.from('organizaciones').insert([{
            nombre: nombre,
            logo_url: logoUrl
        }]);

        if (error) throw error;

        alert('Organización creada exitosamente');
        cerrarModalOrg();
        cargarOrganizaciones();
    } catch (e) {
        console.error('Error:', e);
        alert('Error: ' + e.message);
    }
}

async function eliminarOrganizacion(id, nombre) {
    if (id === '00000000-0000-0000-0000-000000000000') return alert('No se puede eliminar la Sede Principal');
    
    if (!confirm(`¿ESTÁ COMPLETAMENTE SEGURO?\n\nAl eliminar la organización "${nombre}", se borrarán en cascada TODOS sus alumnos, maestros, recibos y datos relacionados.`)) {
        return;
    }

    try {
        const { error } = await db.from('organizaciones').delete().eq('id', id);
        if (error) throw error;
        alert('Organización eliminada');
        cargarOrganizaciones();
    } catch (e) {
        alert('Error: ' + e.message);
    }
}

// =====================================================
// GESTIÓN DE USUARIOS
// =====================================================

async function cargarUsuarios() {
    try {
        let query = db.from('usuarios').select('*, organizaciones(nombre)');
        
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
        if (!orgId) return alert('Seleccione una organización');
    }

    if (!userid || !pass || !nombre) return alert('Faltan campos obligatorios');

    try {
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

        if (error) throw error;
        alert('Usuario creado correctamente');
        cerrarModalUsuario();
        cargarUsuarios();
    } catch (e) {
        alert('Error: ' + e.message);
    }
}

async function eliminarUsuario(id, userid, rol) {
    if (rol === 'SuperAdmin') return alert('No se puede eliminar al SuperAdmin');
    if (id === currentUser.id) return alert('No puedes eliminarte a ti mismo');

    if (!confirm(`¿Desea eliminar el acceso de "${userid}"?\n\nLos registros que haya realizado se conservarán para fines contables.`)) return;

    try {
        const { error } = await db.from('usuarios').delete().eq('id', id);
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
    select.innerHTML = '<option value="">-- Elija un usuario --</option>';
    
    g_usuarios.forEach(u => {
        if (u.rol === 'SuperAdmin') return; // SuperAdmin no tiene restricciones
        
        // Solo mostrar usuarios de rango inferior o igual (si es Admin de la org)
        const opt = document.createElement('option');
        opt.value = u.id;
        opt.textContent = `${u.nombre} (${u.rol})`;
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

    try {
        const { data: pActuales } = await db.from('permisos_seguridad').select('*').eq('usuario_id', userId);
        
        const tbody = document.getElementById('tbodyRestricciones');
        tbody.innerHTML = '';

        g_secciones.forEach(sec => {
            const perm = pActuales?.find(p => p.seccion === sec)?.permiso || 'M';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="text-align: left; padding-left: 20px;"><strong>${sec}</strong></td>
                <td>
                    <select class="perm-select" data-section="${sec}">
                        <option value="N" ${perm === 'N' ? 'selected' : ''}>N - Sin Acceso</option>
                        <option value="M" ${perm === 'M' ? 'selected' : ''}>M - Modificación</option>
                        <option value="C" ${perm === 'C' ? 'selected' : ''}>C - Solo Consulta</option>
                    </select>
                </td>
                <td style="font-size: 0.8rem; color: #aaa;">
                    ${sec === 'Seguridad' ? 'Configuración de usuarios y permisos' : `Acceso al módulo de ${sec}`}
                </td>
            `;
            tbody.appendChild(tr);
        });

        document.getElementById('containerRestricciones').style.display = 'block';
    } catch (e) {
        console.error(e);
    }
}

async function guardarRestricciones() {
    const userId = document.getElementById('selectUsuarioRestriccion').value;
    const selects = document.querySelectorAll('.perm-select');
    const batch = [];

    selects.forEach(sel => {
        batch.push({
            usuario_id: userId,
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

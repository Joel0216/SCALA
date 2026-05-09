/**
 * login.js - Lógica de autenticación Multi-tenant
 */

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const btnText = document.getElementById('btnText');
    const spinner = document.getElementById('spinner');
    const errorMsg = document.getElementById('errorMsg');

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        // Mostrar loading
        btnText.style.display = 'none';
        spinner.style.display = 'block';
        errorMsg.style.display = 'none';

        try {
            const db = await window.waitForSupabase();
            
            // 1. Buscar usuario
            const { data: user, error } = await db
                .from('usuarios')
                .select('*, organizaciones(nombre, logo_url)')
                .or(`user_id.eq.${username},username.eq.${username},email.eq.${username}`)
                .eq('password', password) // En producción usar hash!
                .eq('activo', true)
                .single();

            if (error || !user) {
                throw new Error('Usuario o contraseña incorrectos');
            }

            // 2. Obtener permisos (NMC)
            const { data: permisos } = await db
                .from('permisos_seguridad')
                .select('seccion, permiso')
                .eq('usuario_id', user.id);

            // 3. Guardar sesión
            const session = {
                id: user.id,
                username: user.username || user.user_id,
                nombre: user.nombre,
                rol: user.rol,
                organizacion_id: user.organizacion_id,
                org_nombre: user.organizaciones?.nombre || 'Sede Principal',
                org_logo: user.organizaciones?.logo_url || null,
                permisos: permisos || [],
                lastLogin: new Date().toISOString()
            };

            localStorage.setItem('scala_session', JSON.stringify(session));

            // 4. Redirigir
            console.log('✓ Sesión iniciada correctamente');
            window.location.href = 'index.html';

        } catch (err) {
            console.error('Error en login:', err.message);
            errorMsg.textContent = err.message;
            errorMsg.style.display = 'block';
            btnText.style.display = 'block';
            spinner.style.display = 'none';
        }
    });

    // Limpiar sesión al cargar login
    localStorage.removeItem('scala_session');
});

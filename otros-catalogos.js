// Actualizar fecha y hora
function updateDateTime() {
    const now = new Date();
    const formatted = now.toLocaleString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
    document.getElementById('datetime').textContent = formatted;
}

setInterval(updateDateTime, 1000);
updateDateTime();

document.addEventListener('DOMContentLoaded', async () => {
    // Aplicar protección de seguridad
    if (typeof SessionManager !== 'undefined') {
        const section = document.body.getAttribute('data-section') || 'Archivos';
        SessionManager.protectPage(section);
        
        // Logica para SuperAdmin Selector de Organizaciones
        const user = SessionManager.getCurrentUser();
        if (user && user.rol === 'SuperAdmin') {
            const container = document.getElementById('superAdminSelectorContainer');
            const select = document.getElementById('superAdminOrgSelect');
            if (container && select) {
                container.style.display = 'block';
                
                // Fetch organizaciones
                try {
                    const db = typeof window.waitForSupabase === 'function' ? await window.waitForSupabase() : window.supabase;
                    const { data: orgs, error } = await db.from('organizaciones').select('id, nombre').order('nombre');
                    if (!error && orgs) {
                        orgs.forEach(o => {
                            const opt = document.createElement('option');
                            opt.value = o.id;
                            opt.textContent = o.nombre;
                            select.appendChild(opt);
                        });
                        
                        // Restore previous selection if any
                        const saved = sessionStorage.getItem('superadmin_org_id');
                        if (saved && saved !== 'all') {
                            select.value = saved;
                        }
                    }
                } catch (e) {
                    console.error('Error loading orgs:', e);
                }
                
                select.addEventListener('change', (e) => {
                    const val = e.target.value;
                    if (val) {
                        sessionStorage.setItem('superadmin_org_id', val);
                    } else {
                        sessionStorage.removeItem('superadmin_org_id');
                    }
                });
            }
        }
    }
});

// Interceptor global para los botones
document.addEventListener('click', (e) => {
    const btn = e.target.closest('.premium-menu-btn');
    if (btn) {
        const user = SessionManager.getCurrentUser();
        if (user && user.rol === 'SuperAdmin') {
            const selectedOrg = sessionStorage.getItem('superadmin_org_id');
            if (!selectedOrg || selectedOrg === 'all') {
                e.preventDefault();
                e.stopPropagation();
                if (typeof mostrarAlerta !== 'undefined') {
                    mostrarAlerta('SuperAdmin: Debe seleccionar una Organización en la parte superior antes de entrar a un catálogo.');
                } else {
                    alert('SuperAdmin: Debe seleccionar una Organización en la parte superior antes de entrar a un catálogo.');
                }
            }
        }
    }
}, true); // Use capture phase to intercept before inline onclick

// Event listeners para los botones de catálogos
document.getElementById('motivosBtn').addEventListener('click', () => {
    window.location.href = 'catalogo-motivos.html';
});

document.getElementById('instrumentosBtn').addEventListener('click', () => {
    window.location.href = 'catalogo-instrumentos.html';
});

document.getElementById('salonesBtn').addEventListener('click', () => {
    window.location.href = 'salones.html';
});

document.getElementById('mediosBtn').addEventListener('click', () => {
    window.location.href = 'catalogo-medios.html';
});

document.getElementById('terminarBtn').addEventListener('click', () => {
    window.location.href = 'archivos.html';
});

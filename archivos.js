// Update date and time
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
    document.getElementById('datetime').textContent = dateTimeString;
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
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
    const btn = e.target.closest('.menu-btn');
    if (btn && btn.hasAttribute('onclick')) {
        const user = SessionManager.getCurrentUser();
        if (user && user.rol === 'SuperAdmin') {
            const selectedOrg = sessionStorage.getItem('superadmin_org_id');
            if (!selectedOrg || selectedOrg === 'all') {
                e.preventDefault();
                e.stopPropagation();
                if (typeof mostrarAlerta !== 'undefined') {
                    mostrarAlerta('SuperAdmin: Debe seleccionar una Organización en la parte superior antes de entrar a un módulo.');
                } else {
                    alert('SuperAdmin: Debe seleccionar una Organización en la parte superior antes de entrar a un módulo.');
                }
            }
        }
    }
}, true); // Use capture phase to intercept before inline onclick


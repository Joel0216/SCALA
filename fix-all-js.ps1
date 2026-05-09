# Script para corregir todos los archivos JS que usan import

$archivos = @(
    "grupos.js",
    "grupos-articulos.js",
    "rfc-clientes.js",
    "horarios.js",
    "prospectos.js",
    "salones.js"
)

$replacement = @"
// Inicializar Supabase
let supabase = null;

// Esperar a que se cargue la libreria de Supabase
window.addEventListener('DOMContentLoaded', async () => {
    // Inicializar Supabase
    if (typeof initSupabase === 'function') {
        initSupabase();
        supabase = window.supabase;
    }
});
"@

foreach ($archivo in $archivos) {
    Write-Host "Corrigiendo $archivo..."
    
    # Leer contenido
    $contenido = Get-Content $archivo -Raw
    
    # Reemplazar import
    $contenido = $contenido -replace "import \{ supabase \} from './supabase-config\.js';", $replacement
    
    # Guardar
    $contenido | Set-Content $archivo -NoNewline
    
    Write-Host "OK $archivo corregido"
}

Write-Host ""
Write-Host "Todos los archivos JS corregidos"

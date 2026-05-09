# Script para eliminar referencias al CDN de Supabase en archivos HTML
# En Electron usamos la version npm, no el CDN

Write-Host "Eliminando referencias al CDN de Supabase en archivos HTML..." -ForegroundColor Yellow
Write-Host ""

$archivos = Get-ChildItem -Filter "*.html" -Recurse | Where-Object { $_.Name -notlike "test-*" }

$count = 0

foreach ($archivo in $archivos) {
    $contenido = Get-Content $archivo.FullName -Raw
    $original = $contenido
    
    # Eliminar linea del CDN de Supabase
    $contenido = $contenido -replace '\s*<script src="https://cdn\.jsdelivr\.net/npm/@supabase/supabase-js@2"></script>\s*', "`n"
    
    # Si hubo cambios, guardar
    if ($contenido -ne $original) {
        $contenido | Set-Content $archivo.FullName -NoNewline
        Write-Host "OK $($archivo.Name)" -ForegroundColor Green
        $count++
    }
}

Write-Host ""
Write-Host "Archivos procesados: $count" -ForegroundColor Cyan
Write-Host ""
Write-Host "Ahora los archivos HTML usaran Supabase desde npm (Electron)" -ForegroundColor Green

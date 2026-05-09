# Script para corregir todos los archivos HTML que usan type="module"

$archivos = @(
    @{html="grupos.html"; js="grupos.js"},
    @{html="grupos-articulos.html"; js="grupos-articulos.js"},
    @{html="rfc-clientes.html"; js="rfc-clientes.js"},
    @{html="horarios.html"; js="horarios.js"},
    @{html="prospectos.html"; js="prospectos.js"},
    @{html="salones.html"; js="salones.js"},
    @{html="factores.html"; js="factores.js"}
)

foreach ($archivo in $archivos) {
    $htmlFile = $archivo.html
    $jsFile = $archivo.js
    
    Write-Host "Corrigiendo $htmlFile..."
    
    # Leer contenido
    $contenido = Get-Content $htmlFile -Raw
    
    # Reemplazar script module por scripts normales
    $oldPattern = "<script type=`"module`" src=`"$jsFile`"></script>"
    $newPattern = @"
<!-- Cargar Supabase desde CDN -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="supabase-config.js"></script>
    <script src="$jsFile"></script>
"@
    
    $contenido = $contenido -replace [regex]::Escape($oldPattern), $newPattern
    
    # Guardar
    $contenido | Set-Content $htmlFile -NoNewline
    
    Write-Host "OK $htmlFile corregido"
}

Write-Host ""
Write-Host "Todos los archivos HTML corregidos"

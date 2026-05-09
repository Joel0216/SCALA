# ============================================
# EXTRACCIÓN COMPLETA DE DATOS XLS
# ============================================
# 113 movimientos encabezado
# 485 movimientos detalle
# ============================================

$ErrorActionPreference = "Continue"

Write-Host "=== INICIANDO EXTRACCIÓN ==="
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

# Función para convertir fecha Excel a SQL
function Convert-ExcelDateToSQL($excelDate) {
    if ($excelDate -eq $null -or $excelDate -eq "" -or $excelDate -eq 0) { 
        return "NULL" 
    }
    try {
        # Si ya es una fecha
        if ($excelDate -is [DateTime]) {
            return "'$($excelDate.ToString('yyyy-MM-dd'))'"
        }
        # Si es un número (formato Excel)
        $baseDate = Get-Date "1899-12-30"
        $days = [double]$excelDate
        $sqlDate = $baseDate.AddDays($days).ToString("yyyy-MM-dd")
        return "'$sqlDate'"
    } catch {
        return "NULL"
    }
}

# ============================================
# LEER ENCABEZADOS (113 registros esperados)
# ============================================
Write-Host "`n=== LEYENDO ENCABEZADOS ==="
$wbEnc = $excel.Workbooks.Open("C:\Users\PC05\Downloads\Scala\Scala tablas\Movimientos de Inventarios.xls")
$wsEnc = $wbEnc.Worksheets.Item(1)

$lastRowEnc = $wsEnc.UsedRange.Rows.Count
Write-Host "Filas totales en hoja: $lastRowEnc"

# Leer headers (fila 1)
$headers = @()
for ($col = 1; $col -le $wsEnc.UsedRange.Columns.Count; $col++) {
    $headers += $wsEnc.Cells.Item(1, $col).Text
}
Write-Host "Headers: $($headers -join ' | ')"

# Leer todos los datos
$encabezados = @()
for ($row = 2; $row -le $lastRowEnc; $row++) {
    $col1 = $wsEnc.Cells.Item($row, 1).Text  # Numero de Movimiento
    $col2 = $wsEnc.Cells.Item($row, 2).Text  # Tipo de Movimiento
    $col3Val = $wsEnc.Cells.Item($row, 3).Value2  # Fecha (Value2 para fechas)
    $col3Text = $wsEnc.Cells.Item($row, 3).Text
    
    # Solo agregar si tiene ID
    if ($col1 -ne "" -and $col1 -match '^\d+$') {
        $encabezados += [PSCustomObject]@{
            ID = [int]$col1
            Tipo = if ($col2 -ne "") { $col2 } else { "S" }
            FechaValue = $col3Val
            FechaText = $col3Text
        }
    }
}

Write-Host "Encabezados extraídos: $($encabezados.Count)"
$wbEnc.Close($false)

# ============================================
# LEER DETALLES (485 registros esperados)
# ============================================
Write-Host "`n=== LEYENDO DETALLES ==="
$wbDet = $excel.Workbooks.Open("C:\Users\PC05\Downloads\Scala\Scala tablas\Movimientos de Inventarios Det.xls")
$wsDet = $wbDet.Worksheets.Item(1)

$lastRowDet = $wsDet.UsedRange.Rows.Count
Write-Host "Filas totales en hoja: $lastRowDet"

# Leer headers
$headersDet = @()
for ($col = 1; $col -le $wsDet.UsedRange.Columns.Count; $col++) {
    $headersDet += $wsDet.Cells.Item(1, $col).Text
}
Write-Host "Headers: $($headersDet -join ' | ')"

# Leer todos los datos
$detalles = @()
for ($row = 2; $row -le $lastRowDet; $row++) {
    $movId = $wsDet.Cells.Item($row, 1).Text      # Numero de Movimiento
    $clave = $wsDet.Cells.Item($row, 2).Text      # Clave de Articulo
    $cant = $wsDet.Cells.Item($row, 3).Text       # Cantidad
    $precio = $wsDet.Cells.Item($row, 4).Text     # Precio
    
    # Solo agregar si tiene movimiento ID
    if ($movId -ne "" -and $movId -match '^\d+$') {
        $detalles += [PSCustomObject]@{
            MovimientoID = [int]$movId
            Clave = if ($clave -ne "") { $clave.Trim() } else { "UNKNOWN" }
            Cantidad = if ($cant -ne "" -and $cant -match '^-?\d+') { [int]$cant } else { 0 }
            Precio = if ($precio -ne "" -and $precio -match '^-?\d+\.?\d*$') { [decimal]$precio } else { 0.00 }
        }
    }
}

Write-Host "Detalles extraídos: $($detalles.Count)"
$wbDet.Close($false)

$excel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null

# ============================================
# GENERAR SQL COMPLETO
# ============================================
Write-Host "`n=== GENERANDO SQL ==="

$sqlFile = "C:\Users\PC05\Downloads\Scala\DATOS-MOVIMIENTOS-COMPLETO.sql"
$sql = @"
-- ============================================
-- DATOS COMPLETOS: Movimientos de Inventario
-- ============================================
-- Extraído: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
-- Encabezados: $($encabezados.Count) registros
-- Detalles: $($detalles.Count) registros
-- ============================================

-- ==================== TIPOS DE MOVIMIENTO ====================
INSERT INTO tipos_movimiento (clave, descripcion) VALUES
('AD', 'NUEVA ADQUISICIÓN'),
('DE', 'DEVOLUCIÓN'),
('ME', 'MOVTO INTERNO ENT.'),
('MS', 'MOVTO INTERNO SAL.'),
('P', 'PRÉSTAMO'),
('R', 'RECEPCION'),
('S', 'SALIDA')
ON CONFLICT (clave) DO NOTHING;

-- ==================== MOVIMIENTOS ENCABEZADO ====================
-- Total: $($encabezados.Count) movimientos
INSERT INTO movimientos_encabezado (id, fecha, tipo_movimiento, observaciones) VALUES

"@

# Generar INSERTs de encabezados
$encInserts = @()
foreach ($enc in $encabezados) {
    $id = $enc.ID
    $fecha = Convert-ExcelDateToSQL $enc.FechaValue
    $tipo = if ($enc.Tipo -ne "") { $enc.Tipo.Trim() } else { "S" }
    
    $encInserts += "($id, $fecha, '$tipo', NULL)"
}

$sql += $encInserts -join ",`n"
$sql += "`nON CONFLICT (id) DO NOTHING;`n`n"

# Generar INSERTs de detalles
$sql += "-- ==================== MOVIMIENTOS DETALLE ====================`n"
$sql += "-- Total: $($detalles.Count) artículos`n"
$sql += "INSERT INTO movimientos_detalle (movimiento_id, clave_articulo, cantidad, precio) VALUES`n"

$detInserts = @()
foreach ($det in $detalles) {
    $movId = $det.MovimientoID
    $clave = $det.Clave.Replace("'", "''")
    $cant = $det.Cantidad
    $precio = "{0:F2}" -f $det.Precio
    
    $detInserts += "($movId, '$clave', $cant, $precio)"
}

$sql += $detInserts -join ",`n"
$sql += ";`n`n"

# Resetear secuencia
$sql += @"
-- ==================== RESETEAR SECUENCIA ====================
SELECT setval('movimientos_encabezado_id_seq', (SELECT MAX(id) FROM movimientos_encabezado));

-- ==================== VERIFICACIÓN ====================
SELECT 
    'Carga completada' AS mensaje,
    (SELECT COUNT(*) FROM tipos_movimiento) AS tipos,
    (SELECT COUNT(*) FROM movimientos_encabezado) AS movimientos,
    (SELECT COUNT(*) FROM movimientos_detalle) AS detalles;
"@

# Guardar archivo
$sql | Out-File -FilePath $sqlFile -Encoding UTF8

Write-Host "`n=== RESUMEN ==="
Write-Host "Archivo generado: $sqlFile"
Write-Host "Encabezados: $($encabezados.Count)"
Write-Host "Detalles: $($detalles.Count)"
Write-Host "Tipos únicos: $($encabezados | Select-Object -ExpandProperty Tipo -Unique | Measure-Object).Count"

# Mostrar primeros 5 registros de cada tabla
Write-Host "`n=== MUESTRA DE ENCABEZADOS (primeros 5) ==="
$encabezados | Select-Object -First 5 | Format-Table -AutoSize

Write-Host "`n=== MUESTRA DE DETALLES (primeros 5) ==="
$detalles | Select-Object -First 5 | Format-Table -AutoSize

Write-Host "`n¡EXTRACCIÓN COMPLETADA!"

# Script para extraer datos de XLS y generar SQL
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

#==============================================
# MOVIMIENTOS ENCABEZADO
#==============================================
Write-Host "=== MOVIMIENTOS ENCABEZADO ==="
$wbEnc = $excel.Workbooks.Open("C:\Users\PC05\Downloads\Scala\Scala tablas\Movimientos de Inventarios.xls")
$wsEnc = $wbEnc.Worksheets.Item(1)

$totalRowsEnc = $wsEnc.UsedRange.Rows.Count
Write-Host "Total rows: $totalRowsEnc"

# Leer todas las filas
$encabezados = @()
for ($row = 2; $row -le $totalRowsEnc; $row++) {
    $id = $wsEnc.Cells.Item($row, 1).Text
    $tipo = $wsEnc.Cells.Item($row, 2).Text
    $fecha = $wsEnc.Cells.Item($row, 3).Value2  # Value2 para fechas
    $obs = $wsEnc.Cells.Item($row, 4).Text
    
    if ($id -ne "") {
        $encabezados += [PSCustomObject]@{
            ID = $id
            Tipo = $tipo
            Fecha = $fecha
            Observaciones = $obs
        }
    }
}

Write-Host "Found $($encabezados.Count) encabezados"
$wbEnc.Close($false)

#==============================================
# MOVIMIENTOS DETALLE
#==============================================
Write-Host "`n=== MOVIMIENTOS DETALLE ==="
$wbDet = $excel.Workbooks.Open("C:\Users\PC05\Downloads\Scala\Scala tablas\Movimientos de Inventarios Det.xls")
$wsDet = $wbDet.Worksheets.Item(1)

$totalRowsDet = $wsDet.UsedRange.Rows.Count
Write-Host "Total rows: $totalRowsDet"

# Leer todas las filas
$detalles = @()
for ($row = 2; $row -le $totalRowsDet; $row++) {
    $movId = $wsDet.Cells.Item($row, 1).Text
    $clave = $wsDet.Cells.Item($row, 2).Text
    $cant = $wsDet.Cells.Item($row, 3).Text
    $precio = $wsDet.Cells.Item($row, 4).Text
    
    if ($movId -ne "") {
        $detalles += [PSCustomObject]@{
            MovimientoID = $movId
            Clave = $clave
            Cantidad = $cant
            Precio = $precio
        }
    }
}

Write-Host "Found $($detalles.Count) detalles"
$wbDet.Close($false)

$excel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null

#==============================================
# GENERAR SQL
#==============================================
$sqlOutput = "C:\Users\PC05\Downloads\Scala\DATOS-MOVIMIENTOS.sql"

# Función para convertir fecha Excel a SQL
function Convert-ExcelDateToSQL($excelDate) {
    if ($excelDate -eq $null -or $excelDate -eq "") { return "NULL" }
    try {
        $baseDate = Get-Date "1899-12-30"
        $days = [double]$excelDate
        $sqlDate = $baseDate.AddDays($days).ToString("yyyy-MM-dd")
        return "'$sqlDate'"
    } catch {
        return "NULL"
    }
}

$sql = @"
-- ============================================
-- DATOS: Movimientos de Inventario
-- ============================================
-- Extraído de: Movimientos de Inventarios.xls
-- Fecha: $(Get-Date -Format "yyyy-MM-dd")
-- ============================================

-- TIPOS DE MOVIMIENTO (catálogo único)
INSERT INTO tipos_movimiento (clave, descripcion) VALUES
"@

# Obtener tipos únicos
$tiposUnicos = $encabezados | Select-Object -ExpandProperty Tipo -Unique | Where-Object { $_ -ne "" }
$tipoInserts = @()
foreach ($tipo in $tiposUnicos) {
    $tipoClean = $tipo.Replace("'", "''")
    $tipoInserts += "('$tipoClean', '$tipoClean')"
}
$sql += $tipoInserts -join ",`n"
$sql += ";`n`n"

# ENCABEZADOS
$sql += "-- MOVIMIENTOS ENCABEZADO ($($encabezados.Count) registros)`n"
$sql += "INSERT INTO movimientos_encabezado (id, fecha, tipo_movimiento, observaciones) VALUES`n"

$encInserts = @()
foreach ($enc in $encabezados) {
    $id = $enc.ID
    $fecha = Convert-ExcelDateToSQL $enc.Fecha
    $tipo = $enc.Tipo.Replace("'", "''")
    $obs = if ($enc.Observaciones -ne "") { "'$($enc.Observaciones.Replace("'", "''"))'" } else { "NULL" }
    
    $encInserts += "($id, $fecha, '$tipo', $obs)"
}
$sql += $encInserts -join ",`n"
$sql += ";`n`n"

# DETALLES
$sql += "-- MOVIMIENTOS DETALLE ($($detalles.Count) registros)`n"
$sql += "INSERT INTO movimientos_detalle (movimiento_id, clave_articulo, cantidad, precio) VALUES`n"

$detInserts = @()
foreach ($det in $detalles) {
    $movId = $det.MovimientoID
    $clave = $det.Clave.Replace("'", "''")
    $cant = if ($det.Cantidad -ne "") { $det.Cantidad } else { "0" }
    $precio = if ($det.Precio -ne "") { $det.Precio } else { "0.00" }
    
    $detInserts += "($movId, '$clave', $cant, $precio)"
}
$sql += $detInserts -join ",`n"
$sql += ";`n"

# Guardar SQL
$sql | Out-File -FilePath $sqlOutput -Encoding UTF8

Write-Host "`n=== SQL GENERADO ==="
Write-Host "Output file: $sqlOutput"
Write-Host "Tipos de movimiento: $($tiposUnicos.Count)"
Write-Host "Encabezados: $($encabezados.Count)"
Write-Host "Detalles: $($detalles.Count)"

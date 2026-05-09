$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

# Leer Movimientos Encabezado
$wbEnc = $excel.Workbooks.Open("C:\Users\PC05\Downloads\Scala\Scala tablas\Movimientos de Inventarios.xls")
$wsEnc = $wbEnc.Worksheets.Item(1)

$csvEnc = "C:\Users\PC05\Downloads\Scala\movimientos_encabezado.csv"
$wsEnc.SaveAs($csvEnc, 6) # 6 = CSV format
$wbEnc.Close($false)

Write-Host "Encabezado exported to CSV"

# Leer Movimientos Detalle
$wbDet = $excel.Workbooks.Open("C:\Users\PC05\Downloads\Scala\Scala tablas\Movimientos de Inventarios Det.xls")
$wsDet = $wbDet.Worksheets.Item(1)

$csvDet = "C:\Users\PC05\Downloads\Scala\movimientos_detalle.csv"
$wsDet.SaveAs($csvDet, 6)
$wbDet.Close($false)

Write-Host "Detalle exported to CSV"

$excel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null

Write-Host "Done! CSV files created."

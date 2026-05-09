$excelPath = "C:\Users\PC05\Downloads\Scala\Scala tablas\Cursos.xls"
$csvPath = "C:\Users\PC05\Downloads\Scala\cursos_dump.csv"

Write-Host "Starting export..."
if (Test-Path $csvPath) { Remove-Item $csvPath }

try {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    
    # Try opening with corrupt load option to bypass some checks
    $workbook = $excel.Workbooks.Open($excelPath, 0, $true, 5, "", "", $true, 2) 
    
    $sheet = $workbook.Sheets.Item(1)
    $sheet.SaveAs($csvPath, 6) # xlCSV
    
    $workbook.Close($false)
    $excel.Quit()
    
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
    Write-Host "Export Success: $csvPath"
} catch {
    Write-Error "Export Failed: $_"
    if ($excel) { $excel.Quit() }
}

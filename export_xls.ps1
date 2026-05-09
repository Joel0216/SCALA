$excelPath = "C:\Users\PC05\Downloads\Scala\Scala tablas\Cursos.xls"
$csvPath = "C:\Users\PC05\Downloads\Scala\cursos_dump.csv"

try {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    
    $workbook = $excel.Workbooks.Open($excelPath)
    $sheet = $workbook.Sheets.Item(1)
    
    $sheet.SaveAs($csvPath, 6) # 6 = xlCSV
    
    $workbook.Close($false)
    $excel.Quit()
    
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
    
    Write-Host "Export success: $csvPath"
} catch {
    Write-Error "Error exporting Excel: $_"
    if ($excel) { $excel.Quit() }
}

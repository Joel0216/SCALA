$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

$workbook = $excel.Workbooks.Open("C:\Users\PC05\Downloads\Scala\Scala tablas\Articulos.xls")
$worksheet = $workbook.Worksheets.Item(1)
$range = $worksheet.UsedRange

$rowCount = $range.Rows.Count
$colCount = $range.Columns.Count

for($row = 1; $row -le $rowCount; $row++) {
    $line = @()
    for($col = 1; $col -le $colCount; $col++) {
        $cell = $worksheet.Cells.Item($row, $col)
        $line += $cell.Text
    }
    Write-Output ($line -join '|')
}

$workbook.Close($false)
$excel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null

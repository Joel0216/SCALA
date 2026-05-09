Dim objExcel, objWorkbook, objSheet
Set objExcel = CreateObject("Excel.Application")
objExcel.Visible = False
objExcel.DisplayAlerts = False

On Error Resume Next
Set objWorkbook = objExcel.Workbooks.Open("C:\Users\PC05\Downloads\Scala\Scala tablas\Cursos.xls")

If Err.Number <> 0 Then
    WScript.Echo "Error opening file: " & Err.Description
    objExcel.Quit
    WScript.Quit
End If

Set objSheet = objWorkbook.Sheets(1)
objSheet.SaveAs "C:\Users\PC05\Downloads\Scala\cursos_dump.csv", 6 ' xlCSV

If Err.Number <> 0 Then
    WScript.Echo "Error saving file: " & Err.Description
Else
    WScript.Echo "Success"
End If

objWorkbook.Close False
objExcel.Quit

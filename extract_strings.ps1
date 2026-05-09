$path = "C:\Users\PC05\Downloads\Scala\Scala tablas\Cursos.xls"
$bytes = [System.IO.File]::ReadAllBytes($path)
$stringBuilder = New-Object System.Text.StringBuilder
$minLen = 4

foreach ($b in $bytes) {
    if ($b -ge 32 -and $b -le 126) {
        [void]$stringBuilder.Append([char]$b)
    } else {
        if ($stringBuilder.Length -ge $minLen) {
            Write-Output $stringBuilder.ToString()
        }
        $stringBuilder.Clear()
    }
}
if ($stringBuilder.Length -ge $minLen) {
    Write-Output $stringBuilder.ToString()
}

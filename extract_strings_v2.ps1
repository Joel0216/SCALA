$path = "C:\Users\PC05\Downloads\Scala\Scala tablas\Cursos.xls"
$outPath = "C:\Users\PC05\Downloads\Scala\cursos_clean.txt"
try {
    $bytes = [System.IO.File]::ReadAllBytes($path)
    # Use 1252 for Windows Western European
    $enc = [System.Text.Encoding]::GetEncoding(1252)
    $text = $enc.GetString($bytes)
    
    # Regex to find sequences of printable characters (including Spanish accents if possible)
    # \w includes alphanumeric. \s includes space. 
    # Let's try to match sequences of at least 4 valid text characters.
    # We want to avoid identifying binary data as text.
    # Typical course names: "PIANO 1", "GUITARRA", "Coro"
    
    $matches = [regex]::Matches($text, "[a-zA-Z0-9\s\-\.]{4,}")
    
    $fs = [System.IO.File]::CreateText($outPath)
    foreach ($m in $matches) {
        $val = $m.Value.Trim()
        if ($val.Length -ge 4) {
            $fs.WriteLine($val)
        }
    }
    $fs.Close()
    Write-Host "Success"
} catch {
    Write-Error $_
}

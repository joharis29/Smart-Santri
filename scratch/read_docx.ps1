Add-Type -AssemblyName System.IO.Compression.FileSystem
$docxPath = "docs/skripsi/draft.docx"
if (-not (Test-Path $docxPath)) {
    Write-Host "File not found: $docxPath"
    exit
}
$stream = [System.IO.File]::OpenRead($docxPath)
$zip = [System.IO.Compression.ZipArchive]::new($stream, [System.IO.Compression.ZipArchiveMode]::Read)
$entry = $zip.GetEntry("word/document.xml")
$reader = [System.IO.StreamReader]::new($entry.Open())
$xmlText = $reader.ReadToEnd()
$reader.Close()
$zip.Dispose()
$stream.Close()

# Basic XML tag stripping
$cleanText = $xmlText -replace '<w:p[^>]*>', "`r`n`r`n"
$cleanText = $cleanText -replace '<[^>]+>', ''

# Write to file
$cleanText | Out-File "scratch/extracted_draft.txt" -Encoding utf8
Write-Host "Extraction complete. Check scratch/extracted_draft.txt"

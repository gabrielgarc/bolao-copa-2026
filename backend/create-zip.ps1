Add-Type -Assembly 'System.IO.Compression'
Add-Type -Assembly 'System.IO.Compression.FileSystem'

$src = 'c:\Users\ggarc\source\repos\bolao-copa-2026\backend\Bolao.Copa2026.API\publish-selfcontained'
$dest = 'c:\Users\ggarc\source\repos\bolao-copa-2026\backend\deploy.zip'

if (Test-Path $dest) { Remove-Item $dest }

$zip = [System.IO.Compression.ZipFile]::Open($dest, 'Create')

$files = Get-ChildItem -Path $src -Recurse -File
$baseLen = $src.Length + 1

foreach ($file in $files) {
    $entryName = $file.FullName.Substring($baseLen).Replace('\', '/')
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $file.FullName, $entryName, 'Optimal') | Out-Null
}

$zip.Dispose()
Write-Host "deploy.zip criado com $(($files).Count) arquivos (forward slashes)!"

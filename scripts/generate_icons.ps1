Add-Type -AssemblyName System.Drawing

$imgUrl = "https://avatars.githubusercontent.com/u/267122934?s=200&v=4"
$tempFile = Join-Path $PSScriptRoot "temp_avatar.png"

Invoke-WebRequest -Uri $imgUrl -OutFile $tempFile

$src = [System.Drawing.Image]::FromFile($tempFile)
$publicIconsDir = Join-Path (Split-Path $PSScriptRoot -Parent) "public\icons"
$srcIconsDir = Join-Path (Split-Path $PSScriptRoot -Parent) "src\icons"

New-Item -ItemType Directory -Force -Path $publicIconsDir | Out-Null
New-Item -ItemType Directory -Force -Path $srcIconsDir | Out-Null

$sizes = @(16, 32, 48, 128, 200)

foreach ($size in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($src, 0, 0, $size, $size)
    $g.Dispose()

    $outPublic = Join-Path $publicIconsDir "icon$size.png"
    $outSrc = Join-Path $srcIconsDir "icon$size.png"

    $bmp.Save($outPublic, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Save($outSrc, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Generated icon${size}.png"
}

$src.Dispose()
Remove-Item $tempFile -Force
Write-Host "Icons generated successfully."

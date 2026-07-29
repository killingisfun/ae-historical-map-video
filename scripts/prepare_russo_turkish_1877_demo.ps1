param(
    [string]$OutputDir = "D:\history_video\ae_projects\russo_turkish_1877_v12_centered_macro"
)

$ErrorActionPreference = "Stop"

$skillRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$scriptsDir = Join-Path $skillRoot "scripts"
$assetsDir = Join-Path $skillRoot "assets"

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $OutputDir "milsymbol_assets") | Out-Null

Copy-Item -LiteralPath (Join-Path $scriptsDir "ae_russo_turkish_1877_v12_centered_macro.jsx") -Destination (Join-Path $OutputDir "ae_russo_turkish_1877_v12_centered_macro.jsx") -Force
Copy-Item -LiteralPath (Join-Path $assetsDir "balkans_1880_real_boundaries_v9_overscan.png") -Destination (Join-Path $OutputDir "balkans_1880_real_boundaries_v9_overscan.png") -Force
Copy-Item -LiteralPath (Join-Path $assetsDir "balkans_1880_real_boundaries_v9_overscan.meta.json") -Destination (Join-Path $OutputDir "balkans_1880_real_boundaries_v9_overscan.meta.json") -Force
Copy-Item -Path (Join-Path $assetsDir "milsymbol_assets\*") -Destination (Join-Path $OutputDir "milsymbol_assets") -Force

Write-Host "Prepared AE demo folder:"
Write-Host $OutputDir
Write-Host ""
Write-Host "Run this JSX in After Effects:"
Write-Host (Join-Path $OutputDir "ae_russo_turkish_1877_v12_centered_macro.jsx")

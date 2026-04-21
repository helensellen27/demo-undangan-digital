param(
  [int]$MaxFiles = 220,
  [int]$MaxIndexLines = 90
)

$ErrorActionPreference = "Stop"
$root = (Get-Location).Path

function Get-RelativePath {
  param([string]$Path)
  return $Path.Substring($root.Length).TrimStart("\", "/")
}

function Should-SkipFile {
  param([System.IO.FileInfo]$File)
  $relative = Get-RelativePath $File.FullName
  if ($relative -match "^\.git[\\/]") { return $true }
  if ($relative -match "^frontend[\\/]assets[\\/](bank|ewallet)[\\/]") { return $true }
  if ($relative -match "\.(zip|jpg|jpeg|png|gif|webp|mp3|wav|m4a|ogg)$") { return $true }
  if ($File.Length -gt 500000) { return $true }
  return $false
}

Write-Output "# Compact Project Snapshot"
Write-Output ""
Write-Output "Root: $root"
Write-Output "Generated: $(Get-Date -Format s)"
Write-Output ""

Write-Output "## Git Status"
try {
  $status = git status --short
  if ($status) {
    $status | ForEach-Object { Write-Output $_ }
  } else {
    Write-Output "clean"
  }
} catch {
  Write-Output "git status unavailable"
}
Write-Output ""

Write-Output "## Top-Level"
Get-ChildItem -Force | Sort-Object Name | ForEach-Object {
  $kind = if ($_.PSIsContainer) { "dir " } else { "file" }
  Write-Output ("{0} {1}" -f $kind, $_.Name)
}
Write-Output ""

$files = Get-ChildItem -Recurse -File |
  Where-Object { -not (Should-SkipFile $_) } |
  Sort-Object FullName |
  Select-Object -First $MaxFiles

Write-Output "## Source Files"
foreach ($file in $files) {
  $relative = Get-RelativePath $file.FullName
  $lineCount = 0
  try {
    $lineCount = (Get-Content -LiteralPath $file.FullName | Measure-Object -Line).Lines
  } catch {
    $lineCount = 0
  }
  $sizeKb = [Math]::Round($file.Length / 1KB, 1)
  Write-Output ("{0} ({1} lines, {2} KB)" -f $relative, $lineCount, $sizeKb)
}
Write-Output ""

Write-Output "## Function Index"
$indexTargets = @(
  "frontend\script.js",
  "frontend\admin.js",
  "backend-gas\Code.gs",
  "api\share.js",
  "api\music.js"
)

foreach ($target in $indexTargets) {
  if (-not (Test-Path $target)) { continue }
  Write-Output ""
  Write-Output "### $target"
  Select-String -Path $target -Pattern "^(async function|function|export default async function)\s+" |
    Select-Object -First $MaxIndexLines |
    ForEach-Object { Write-Output ("L{0}: {1}" -f $_.LineNumber, $_.Line.Trim()) }
}

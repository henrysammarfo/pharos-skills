#!/usr/bin/env pwsh
# Package NEXUS Trust Agent for Anvita upload.
# Uses forward-slash zip paths (required by Anvita JS parser on Windows).
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$Root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$Pkg = Join-Path $Root "nexus-service-agent"
$Dist = Join-Path $Pkg "dist"
$ZipName = "nexus-trust-agent-anvita.zip"
$SkillName = "nexus-trust-agent"
$Staging = Join-Path $Dist "staging"
$AgentDir = Join-Path $Staging $SkillName

if (Test-Path $Staging) { Remove-Item $Staging -Recurse -Force }
New-Item -ItemType Directory -Path $AgentDir -Force | Out-Null

# Normalize SKILL.md to UTF-8 LF (no BOM) for Anvita YAML parser
$skillSrc = Join-Path $Pkg "SKILL.md"
$skillDst = Join-Path $AgentDir "SKILL.md"
$skillText = [System.IO.File]::ReadAllText($skillSrc) -replace "`r`n", "`n"
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($skillDst, $skillText, $utf8NoBom)

$ScriptsOut = Join-Path $AgentDir "scripts"
New-Item -ItemType Directory -Path $ScriptsOut -Force | Out-Null
Copy-Item (Join-Path $Pkg "scripts\handler.mjs") $ScriptsOut
Copy-Item (Join-Path $Pkg "scripts\status.mjs") $ScriptsOut
Copy-Item (Join-Path $Pkg "references") (Join-Path $AgentDir "references") -Recurse
Copy-Item (Join-Path $Pkg "assets") (Join-Path $AgentDir "assets") -Recurse

if (Test-Path (Join-Path $Pkg "deployments.json")) {
  Copy-Item (Join-Path $Pkg "deployments.json") $AgentDir
} else {
  Copy-Item (Join-Path $Root "deployments.example.json") (Join-Path $AgentDir "deployments.json")
}

if (-not (Test-Path $Dist)) { New-Item -ItemType Directory -Path $Dist -Force | Out-Null }
$ZipPath = Join-Path $Dist $ZipName
if (Test-Path $ZipPath) { Remove-Item $ZipPath -Force }

$archive = [System.IO.Compression.ZipFile]::Open($ZipPath, [System.IO.Compression.ZipArchiveMode]::Create)
try {
  Get-ChildItem -Path $AgentDir -Recurse -File | ForEach-Object {
    $relative = $_.FullName.Substring($AgentDir.Length).TrimStart('\', '/')
    $entryName = "$SkillName/$($relative.Replace('\', '/'))"
    [void][System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $_.FullName, $entryName)
  }
} finally {
  $archive.Dispose()
}

Remove-Item $Staging -Recurse -Force

Write-Host "Created: $ZipPath"
Write-Host "Zip entries (forward slashes):"
[System.IO.Compression.ZipFile]::OpenRead($ZipPath).Entries | ForEach-Object { $_.FullName }
$skillEntry = [System.IO.Compression.ZipFile]::OpenRead($ZipPath).Entries | Where-Object { $_.FullName -eq "$SkillName/SKILL.md" }
if ($skillEntry) {
  Write-Host "OK: found $SkillName/SKILL.md"
} else {
  Write-Host "ERROR: missing $SkillName/SKILL.md" -ForegroundColor Red
  exit 1
}
Get-ChildItem $ZipPath | Format-List Name, Length, LastWriteTime

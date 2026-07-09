#!/usr/bin/env pwsh
# Package NEXUS Trust Agent for Anvita — Agent Skills standard layout:
#   nexus-trust-agent/
#   ├── SKILL.md
#   ├── scripts/
#   ├── references/
#   └── assets/
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$Pkg = Join-Path $Root "nexus-service-agent"
$Dist = Join-Path $Pkg "dist"
$ZipName = "nexus-trust-agent-anvita.zip"
$Staging = Join-Path $Dist "staging"
$AgentDir = Join-Path $Staging "nexus-trust-agent"

if (Test-Path $Staging) { Remove-Item $Staging -Recurse -Force }
New-Item -ItemType Directory -Path $AgentDir -Force | Out-Null

Copy-Item (Join-Path $Pkg "SKILL.md") $AgentDir
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

Compress-Archive -Path $AgentDir -DestinationPath $ZipPath -Force
Remove-Item $Staging -Recurse -Force

Write-Host "Created: $ZipPath"
Write-Host "Zip layout (Agent Skills standard):"
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::OpenRead($ZipPath).Entries | ForEach-Object { $_.FullName }
Get-ChildItem $ZipPath | Format-List Name, Length, LastWriteTime

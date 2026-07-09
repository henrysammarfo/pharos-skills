#!/usr/bin/env pwsh
# Package NEXUS Trust Agent for Anvita upload (SKILL.md at zip root)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$Pkg = Join-Path $Root "nexus-service-agent"
$Dist = Join-Path $Pkg "dist"
$ZipName = "nexus-trust-agent-anvita.zip"
$Staging = Join-Path $Dist "staging"

if (Test-Path $Staging) { Remove-Item $Staging -Recurse -Force }
New-Item -ItemType Directory -Path $Staging -Force | Out-Null

Copy-Item (Join-Path $Pkg "SKILL.md") $Staging
Copy-Item (Join-Path $Pkg "agent-card.json") $Staging
Copy-Item (Join-Path $Pkg "deployments.json") $Staging
Copy-Item (Join-Path $Pkg "SUBMISSION.md") $Staging
Copy-Item (Join-Path $Pkg "runtime") (Join-Path $Staging "runtime") -Recurse

if (-not (Test-Path $Dist)) { New-Item -ItemType Directory -Path $Dist -Force | Out-Null }
$ZipPath = Join-Path $Dist $ZipName
if (Test-Path $ZipPath) { Remove-Item $ZipPath -Force }

Compress-Archive -Path (Join-Path $Staging "*") -DestinationPath $ZipPath -Force
Remove-Item $Staging -Recurse -Force

Write-Host "Created: $ZipPath"
Get-ChildItem $ZipPath | Format-List Name, Length, LastWriteTime

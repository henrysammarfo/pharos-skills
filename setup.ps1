# One-command onboarding (Windows)
$ErrorActionPreference = "Stop"
Write-Host "=== Pharos Skills Setup ===" -ForegroundColor Cyan

if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw "Node.js required: https://nodejs.org" }
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { throw "npm required" }

$forge = "$env:USERPROFILE\.foundry\bin\forge.exe"
if (-not (Test-Path $forge)) {
    Write-Host "Foundry not found. Install: https://book.getfoundry.sh/getting-started/installation" -ForegroundColor Yellow
    Write-Host "Or download zip to $env:USERPROFILE\.foundry\bin\" -ForegroundColor Yellow
    throw "forge.exe missing"
}
$env:Path = "$env:USERPROFILE\.foundry\bin;" + $env:Path

Write-Host "npm install..."
npm install

Write-Host "forge install (from foundry.lock)..."
forge install

Write-Host "forge build..."
forge build

Write-Host "npm compile..."
npm run compile

Write-Host "forge test..."
forge test

Write-Host "npm test..."
npm test

if (-not (Test-Path deployments.json)) {
    Copy-Item deployments.example.json deployments.json
    Write-Host "Copied deployments.example.json -> deployments.json"
}

git config core.hooksPath .githooks 2>$null

Write-Host "`n=== Setup complete ===" -ForegroundColor Green
Write-Host "Read-only judge test:  npm run judge:readiness"
Write-Host "SDK smoke test:        npm run test:sdk"
Write-Host "MCP smoke test:        npm run test:mcp"
Write-Host "Full agent+wallet:     npm run test:agent   (needs funded wallet.json)"
Write-Host "MCP server:            npm run mcp"
Write-Host "HTTP x402:             npm run x402:http"

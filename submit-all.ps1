$urls = @(
  "https://dorahacks.io/hackathon/pharos-phase1/buidl/create?name=AgentCreditScore",
  "https://dorahacks.io/hackathon/pharos-phase1/buidl/create?name=IntentVerifier",
  "https://dorahacks.io/hackathon/pharos-phase1/buidl/create?name=x402PaymentChannel",
  "https://dorahacks.io/hackathon/pharos-phase1/buidl/create?name=DarkPay"
)

Write-Host "Opening 4 DoraHacks submission tabs..."
foreach ($url in $urls) { Start-Process $url }

$dep = Get-Content deployments.json | ConvertFrom-Json
Write-Host "`n=== SUBMISSION COPY ==="
Write-Host "GitHub: https://github.com/henrysammarfo/pharos-skills"
Write-Host "AgentCreditScore: $($dep.contracts.AgentCreditScore)"
Write-Host "IntentVerifier: $($dep.contracts.IntentVerifier)"
Write-Host "x402PaymentChannel: $($dep.contracts.x402PaymentChannel)"
Write-Host "DarkPay: $($dep.contracts.DarkPay)"

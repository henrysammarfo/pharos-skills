$base = "https://github.com/henrysammarfo/pharos-skills/tree/master/skills"
$dorahacks = "https://dorahacks.io/hackathon/pharos-phase1/buidl/create"

$skills = @(
  @{ Name = "AgentCreditScore"; Folder = "agentcreditscore" },
  @{ Name = "IntentVerifier"; Folder = "intentverifier" },
  @{ Name = "x402PaymentChannel"; Folder = "x402-payment-channel" },
  @{ Name = "DarkPay"; Folder = "darkpay" },
  @{ Name = "SpendGuard"; Folder = "spendguard" }
)

$dep = Get-Content deployments.example.json | ConvertFrom-Json

Write-Host "=== 5 BUIDL SUBMISSIONS ===" -ForegroundColor Cyan
Write-Host "Repo root: https://github.com/henrysammarfo/pharos-skills`n"

foreach ($s in $skills) {
  $folderUrl = "$base/$($s.Folder)"
  $createUrl = "$dorahacks?name=$($s.Name)"
  Write-Host "--- $($s.Name) ---" -ForegroundColor Yellow
  Write-Host "GitHub (use this link): $folderUrl"
  Write-Host "SKILL.md:               $folderUrl/SKILL.md"
  Write-Host "README:                 $folderUrl/README.md"
  Write-Host "DoraHacks create:       $createUrl"
  Write-Host ""
  Start-Process $createUrl
}

Write-Host "Contract addresses (Atlantic):"
Write-Host "  AgentCreditScore:   $($dep.contracts.AgentCreditScore)"
Write-Host "  IntentVerifier:     $($dep.contracts.IntentVerifier)"
Write-Host "  x402PaymentChannel: $($dep.contracts.x402PaymentChannel)"
Write-Host "  DarkPay:            $($dep.contracts.DarkPay)"
Write-Host "  SpendGuard:         $($dep.contracts.SpendGuard)"

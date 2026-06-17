# Pharos Trust Stack — 5 Skills for AI Agents

**Builder:** Henry Sam Marfo · [github.com/henrysammarfo](https://github.com/henrysammarfo)  
**Network:** Pharos Atlantic Testnet · Chain `688689` · RPC `https://atlantic.dplabs-internal.com`  
**Hackathon:** [Skill-to-Agent Dual Cascade — Phase 1](https://dorahacks.io/hackathon/pharos-phase1/)

Five deployed, composable on-chain Skills forming the trust + safety + payments layer for Pharos AI agents.

## Skills (BUIDL entry points)

Each skill has its **own folder** with `README.md` + `SKILL.md`. Use the folder URL as the GitHub link in DoraHacks.

| Skill | Folder | Purpose |
|-------|--------|---------|
| [AgentCreditScore](skills/agentcreditscore/) | `skills/agentcreditscore/` | Soulbound identity + credit score 0–1000 |
| [IntentVerifier](skills/intentverifier/) | `skills/intentverifier/` | Commit-reveal + EIP-712 accountability |
| [x402PaymentChannel](skills/x402-payment-channel/) | `skills/x402-payment-channel/` | Signed micropayment channels + HTTP x402 |
| [DarkPay](skills/darkpay/) | `skills/darkpay/` | ERC-5564 stealth payments |
| [SpendGuard](skills/spendguard/) | `skills/spendguard/` | Credit-gated spending limits + custody |

**Example GitHub link for BUIDL:**  
`https://github.com/henrysammarfo/pharos-skills/tree/master/skills/spendguard`

## Onboarding (judges & agents)

```bash
git clone https://github.com/henrysammarfo/pharos-skills.git
cd pharos-skills
./setup.sh          # macOS/Linux
# or
.\setup.ps1         # Windows
```

That's it. Setup installs deps, `forge install`, compiles, and runs **all tests**.

### Read-only Atlantic check (no wallet)

```bash
npm run judge:readiness
```

### Full test suite

```bash
npm run test:all
```

### MCP agent integration

```bash
npm run mcp
```

Copy [`mcp-server/mcp-config.example.json`](mcp-server/mcp-config.example.json) into your agent MCP config.  
**38 tools** covering all 5 skills (read-only + full wallet write flows). Read-only tools work with `deployments.example.json` only. Writes need funded `wallet.json` or `PRIVATE_KEY`.

### HTTP x402 (Pharos native protocol)

```bash
npm run x402:http
curl -i http://localhost:4020/api/premium
curl http://localhost:4020/health
```

Docs: https://docs.pharos.xyz/developer-guide/x402

## Architecture

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for diagrams, data flows, and composability.

```
SpendGuard ──gates──► Agent ──► IntentVerifier ──► AgentCreditScore ◄── x402PaymentChannel
                              └──► DarkPay
```

## Deployed contracts

Addresses and integration tx hashes: [`deployments.example.json`](deployments.example.json)

| Contract | Atlantic address |
|----------|------------------|
| AgentCreditScore | `0x23Df05400d42122D2962C9ea60d469ba66FE3665` |
| IntentVerifier | `0x9cC1A13782574c83f15c874551997Dc3cE3b15DF` |
| x402PaymentChannel | `0xE16B0109D20C0f1977Dd821d285dd479Af0a9187` |
| DarkPay | `0xF028782C1e4E3BdB19d31A31Db713d185a07b328` |
| SpendGuard | `0x8395ada307Aa80C9F66A754fCC2CA01E63F9BB85` |

Redeploy stack: `npm run deploy:atlantic` then `npm run integrate:atlantic` (requires funded `wallet.json`).

Verify on Pharosscan: `PHAROSCAN_API_KEY=... npm run verify:atlantic`

## Testing

| Suite | Command | Coverage |
|-------|---------|----------|
| Forge | `forge test -vv` | Smoke, fuzz (256 runs), stress (50 intents), security |
| Hardhat | `npm test` | Cross-contract integration |
| Atlantic | `npm run integrate:atlantic` | Live testnet full stack |
| Judge | `npm run judge:readiness` | Read-only RPC contract checks |
| SDK | `npm run test:sdk` | SDK read tests (+ wallet writes if `wallet.json` present) |
| MCP | `npm run test:mcp` | MCP protocol + tool tests (+ wallet writes if funded) |
| Agent full | `npm run test:agent` | SDK + MCP wallet write suites (requires funded `wallet.json`) |

## DoraHacks — 5 BUIDLs

```powershell
.\submit-all.ps1
```

Opens 5 submission tabs with per-skill GitHub folder links.

## Project structure

```
pharos-skills/
├── src/                     # 5 Solidity contracts + interfaces/
├── skills/<name>/           # Per-skill README + SKILL.md (BUIDL links here)
├── test/                    # Forge + Hardhat
├── sdk/                     # JavaScript SDK (all skills)
├── mcp-server/              # MCP tools for agent testing
├── x402-http/               # HTTP 402 middleware
├── scripts/                 # deploy, integrate, verify, judge-readiness
├── ARCHITECTURE.md
├── SECURITY.md
└── deployments.example.json
```

## Security

See [`SECURITY.md`](SECURITY.md). Hardened contracts with `ReentrancyGuard`, custom errors, soulbound NFT, EIP-712 intents, and SpendGuard policy engine. No formal audit — testnet only.

## CI / GitHub Actions

**No GitHub Actions workflow** — removed intentionally (no billing card on account; workflows were failing). All quality gates run locally via `npm run test:all` and `setup.ps1` / `setup.sh`.

## Phase 2

All five Skills compose into **NEXUS** — credit-enabled, accountable, private, spend-safe autonomous agent.

## License

MIT

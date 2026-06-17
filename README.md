# Pharos Skills — AI Agent Trust Infrastructure Stack

Production-grade Phase 1 submission for the [Pharos Skill-to-Agent Dual Cascade Hackathon](https://dorahacks.io/hackathon/pharos-phase1/).

Four composable on-chain Skills forming the trust layer for Pharos AI agents:

| Skill | Contract | Purpose |
|-------|----------|---------|
| **AgentCreditScore** | `0x0b61985Ea2F43360685FdbE02D518C5B0e73CF36` | Soulbound credit scoring (0–1000) |
| **IntentVerifier** | `0x97B9ecB1CbFa7fC78Eb83e61A208b37D9f3F288F` | Commit-reveal AI intent accountability |
| **x402PaymentChannel** | `0x827F4b43B1468D2B2b35e9bd99A16a0FA426acbe` | Signed off-chain micropayment channels |
| **DarkPay** | `0x294919b4114Ac0Fe30F1551351655e016AC34eBa` | ERC-5564-inspired stealth payments |

**Network:** Pharos Atlantic Testnet · Chain ID `688689` · RPC `https://atlantic.dplabs-internal.com`

**Builder:** Henry Sam Marfo · ATU Accra Ghana · [github.com/henrysammarfo](https://github.com/henrysammarfo)

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌──────────────────┐
│ IntentVerifier  │────▶│ AgentCreditScore│◀────│ x402PayChannel   │
│ commit/reveal   │     │ soulbound score │     │ signed micropay  │
└─────────────────┘     └────────┬────────┘     └──────────────────┘
                                 │
                        ┌────────▼────────┐
                        │     DarkPay     │
                        │ stealth ECDH    │
                        └─────────────────┘
```

## Quick start

```bash
npm install
npm run compile
forge build && forge test    # Foundry: 19 tests (smoke, fuzz, stress, security)
npm test                     # Hardhat: 3 integration tests
npm run deploy:atlantic    # requires funded wallet.json
npm run integrate:atlantic # full cross-contract test on Atlantic
npm run mcp                # MCP tool server for agents
npm run x402:http          # HTTP 402 middleware
```

## Deployed addresses (Atlantic)

See [`deployments.json`](deployments.json) for live addresses, deploy txs, and integration test hashes.

## Project structure

```
pharos-skills/
├── src/                    # Solidity contracts (hardened: ReentrancyGuard, sendValue)
├── sdk/                    # TypeScript/JavaScript SDK
├── skills/                 # Pharos Skill Engine SKILL.md per skill
├── mcp-server/             # MCP tools for AI agents
├── x402-http/              # HTTP 402 Payment Required middleware
├── scripts/                # Deploy + integration scripts
├── test/                   # Forge (PharosSkills.t.sol) + Hardhat (skills.test.js)
└── deployments.json        # Live Atlantic addresses + tx hashes
```

## Security

See [`SECURITY.md`](SECURITY.md) for the honest threat model. Hardening in v2:

- Custom errors, zero-address checks, `onlyRegisteredAgent` on ACS updates
- `penalized` flag on IntentVerifier (prevents double-penalty)
- `ReentrancyGuard` + `Address.sendValue` on payable flows
- Shared `IAgentCreditScore` interface; soulbound ERC721 identity
- 19 Forge tests + 3 Hardhat tests + live Atlantic integration verified

**No contract is unhackable.** Formal audit not performed — do not deploy to mainnet without one.

## DoraHacks submissions

Submit 4 separate BUIDLs — one per skill in `skills/*/SKILL.md`.

Run `./submit-all.ps1` to open submission pages.

## Phase 2

All four Skills combine into **NEXUS** — credit-enabled, verifiable, private AI economic agent.

## License

MIT

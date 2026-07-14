# NEXUS Trust Agent

Phase 2 Service Agent — **Pharos Pacific Mainnet** · **$0.02 / call**

Everyday trust co-pilot: credit checks, spend safety, intent verify, x402, stealth.

## Contents

| Path | Purpose |
|------|---------|
| `SKILL.md` | Anvita manifest (execution, client flow, delivery) |
| `scripts/` | `handler.mjs`, `status.mjs` |
| `references/` | Contract addresses and flows |
| `assets/` | Avatar + agent-card metadata |
| `FUNDING-MAINNET.md` | Fresh deployer funding checklist |
| `ANVITA-PUBLISH.md` | Copy-paste for Publish screen (after deploy) |
| `ANVITA-SERVICE-STRATEGY.md` | Service Strategy paste |
| `landing/` | Hero landing (Vercel) |

## Mainnet deploy (first time)

1. Fund deployer — see [`FUNDING-MAINNET.md`](./FUNDING-MAINNET.md)
2. From repo root:

```powershell
npm run deploy:pacific:watch
# or manually after funding:
npm run deploy:pacific
npm run smoke:pacific -- --register
npm run nexus:sync
npm run nexus:package
```

## Package for Anvita

```powershell
npm run nexus:package
```

Zip layout: `nexus-trust-agent/SKILL.md` + scripts/references/assets

## Landing

```powershell
npm run nexus:landing
```

Live: https://nexus-trust-agent.vercel.app

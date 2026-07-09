# NEXUS Trust Agent

Phase 2 Service Agent for the Pharos Skill-to-Agent Dual Cascade Hackathon.

Composes all five verified Atlantic Testnet Skills into one Anvita-uploadable package.

## Contents

| Path | Purpose |
|------|---------|
| `SKILL.md` | Anvita manifest (execution, client flow, delivery standards) |
| `scripts/` | `handler.mjs`, `status.mjs` |
| `references/` | Contract addresses and composability flows |
| `assets/` | Agent card metadata |
| `landing/` | React 19 hero landing page |
| `SUBMISSION.md` | Upload checklist |
| `VIDEO-SCRIPT.md` | Demo video outline |

## Package for Anvita

```powershell
.\nexus-service-agent\scripts\package-anvita-zip.ps1
```

Output: `nexus-service-agent/dist/nexus-trust-agent-anvita.zip`

## Landing page

```powershell
cd nexus-service-agent\landing
npm install
npm run dev
```

## Runtime test

```bash
node -e "import('./scripts/handler.mjs').then(m => m.handleRequest({ task: 'full stack status', agent: '0xCC7cE09579EF39848ddddc36421CeB0F665096dC' }).then(console.log))"
```

Full SDK/MCP: parent repo `npm run test:agent`.

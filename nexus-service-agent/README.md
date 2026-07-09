# NEXUS Trust Agent

Phase 2 Service Agent for the Pharos Skill-to-Agent Dual Cascade Hackathon.

Composes all five verified Atlantic Testnet Skills into one Anvita-uploadable package.

## Contents

| Path | Purpose |
|------|---------|
| `SKILL.md` | **Zip root manifest** for Anvita upload |
| `agent-card.json` | Console fill-in fields |
| `deployments.json` | Contract addresses |
| `runtime/handler.mjs` | Request router (read-only RPC) |
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
node -e "import('./runtime/handler.mjs').then(m => m.handleRequest({ task: 'full stack status', agent: '0xCC7cE09579EF39848ddddc36421CeB0F665096dC' }).then(console.log))"
```

Full SDK/MCP: parent repo `npm run test:agent`.

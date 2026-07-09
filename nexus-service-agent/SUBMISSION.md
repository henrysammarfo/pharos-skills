# Anvita Console — NEXUS Trust Agent

**Console:** https://flow.anvita.xyz/service-agents  
**Deadline (draft):** Jul 10, 2026, 6 PM HKT

## Upload package

```powershell
cd C:\Users\RICHEY_SON\pharos-skills
.\nexus-service-agent\scripts\package-anvita-zip.ps1
```

Produces `nexus-service-agent/dist/nexus-trust-agent-anvita.zip` with **`nexus-trust-agent/SKILL.md`** inside (Anvita-required layout).

## Agent Card fields (copy from `agent-card.json`)

| Field | Value |
|-------|-------|
| **Name** | NEXUS Trust Agent |
| **Description** | Unified Pharos Service Agent composing all five verified Trust Stack Skills — credit scoring, intent verification, x402 micropayments, stealth transfers, and spend policy enforcement on Atlantic Testnet. |
| **Network** | Pharos Atlantic Testnet (688689) |
| **Repository** | https://github.com/henrysammarfo/pharos-skills |
| **Demo URL** | https://nexus-trust-agent.vercel.app |
| **Tags** | trust, credit, x402, stealth, spend-guard, pharos |

### Example tasks

1. Register my agent and return its credit score
2. Commit and verify an intent before a large trade
3. Open an x402 payment channel and sign a micropayment
4. Send a private stealth payment on Pharos
5. Check whether a spend is allowed under SpendGuard policy
6. Return full trust stack status for an agent address

## Landing page (demo / portfolio)

**Live:** https://nexus-trust-agent.vercel.app  
**Dashboard:** https://vercel.com/teamtitanlink/nexus-trust-agent

Paste the demo URL into the Anvita Agent Card demo field.

Local dev:

```powershell
cd nexus-service-agent\landing
npm install
npm run dev
```

## Video tutorial (~2–3 min)

See `VIDEO-SCRIPT.md`.

## Checklist

- [ ] Upload zip draft to Anvita (save, do not publish until Carnival)
- [ ] Fill Agent Card from `agent-card.json` (include demo URL above)
- [ ] Record demo video (clone → setup → live call)
- [ ] Wait for Mush submission form + publish window

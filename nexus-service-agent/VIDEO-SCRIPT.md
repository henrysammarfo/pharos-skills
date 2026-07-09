# NEXUS Trust Agent — Video Script (~2:30)

## 0:00 — Hook

> "This is NEXUS — one Service Agent that composes all five Pharos Trust Stack Skills on Atlantic Testnet."

Show landing page hero (video background, heading).

## 0:15 — What it composes

Quick table or diagram:

- AgentCreditScore — trust & credit
- IntentVerifier — accountable intents
- x402PaymentChannel — micropayments
- DarkPay — stealth transfers
- SpendGuard — policy-gated spending

## 0:45 — Clone & setup

```bash
git clone https://github.com/henrysammarfo/pharos-skills.git
cd pharos-skills
./setup.sh   # or setup.ps1 on Windows
```

## 1:00 — Judge readiness (read-only)

```bash
npm run judge:readiness
```

Show 8/8 passing.

## 1:15 — Live agent test

```bash
npm run test:agent
```

Highlight wallet writes across all five skills.

## 1:45 — MCP tools

```bash
npm run mcp
```

Mention 38 tools; show one `agent_credit_get_score` or `spendguard_can_spend` call.

## 2:00 — Anvita upload

Show `nexus-service-agent/SKILL.md` at zip root and Anvita draft upload.

## 2:15 — Close

> "NEXUS — full trust infrastructure for autonomous agents. Built by Henry Sam Marfo for Pharos Phase 2."

Links: GitHub, ARCHITECTURE.md, Atlantic explorer contract links.

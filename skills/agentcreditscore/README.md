# AgentCreditScore

> **Folder:** https://github.com/henrysammarfo/pharos-skills/tree/master/skills/agentcreditscore

Soulbound ERC-721 agent identity + weighted credit score (0–1000) with PHRS credit tiers.

## Judge quick test

```bash
git clone https://github.com/henrysammarfo/pharos-skills.git && cd pharos-skills
./setup.sh
npm run judge:readiness
```

## Read-only Atlantic

```bash
source deployments.example.json  # or read file manually
cast call $ACS "isRegistered(address)" $AGENT --rpc-url https://atlantic.dplabs-internal.com
cast call $ACS "getCreditLimit(address)(uint256)" $AGENT --rpc-url https://atlantic.dplabs-internal.com
cast call $ACS "getScoreBreakdown(address)" $AGENT --rpc-url https://atlantic.dplabs-internal.com
```

## MCP tools

`agent_credit_get_score`, `agent_credit_get_limit`, `agent_credit_breakdown`, `agent_credit_register`

## Key files

- [`SKILL.md`](./SKILL.md) — Skill Engine manifest
- [`../../src/AgentCreditScore.sol`](../../src/AgentCreditScore.sol)
- [`../../sdk/index.js`](../../sdk/index.js) — `AgentCreditScoreSDK`

Addresses: [`deployments.example.json`](../../deployments.example.json)

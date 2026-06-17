# AgentCreditScore

> **BUIDL folder:** https://github.com/henrysammarfo/pharos-skills/tree/master/skills/agentcreditscore  
> **Verified:** https://atlantic.pharosscan.xyz/address/0x23Df05400d42122D2962C9ea60d469ba66FE3665#code

Soulbound ERC-721 agent identity + weighted credit score (0–1000) with PHRS credit tiers.

## Judge quick test

```bash
git clone https://github.com/henrysammarfo/pharos-skills.git && cd pharos-skills
./setup.sh          # or .\setup.ps1 on Windows
npm run judge:readiness
npm run test:all
```

With funded `wallet.json`:

```bash
npm run test:agent
```

## Environment (Foundry / cast)

```bash
export RPC=https://atlantic.dplabs-internal.com
export ACS=0x23Df05400d42122D2962C9ea60d469ba66FE3665
export AGENT=0xYourAddress
```

## Read-only Atlantic

```bash
cast call $ACS "isRegistered(address)" $AGENT --rpc-url $RPC
cast call $ACS "getCreditLimit(address)(uint256)" $AGENT --rpc-url $RPC
cast call $ACS "getScoreBreakdown(address)" $AGENT --rpc-url $RPC
```

## Write (wallet)

```bash
cast send $ACS "registerAgent()" --private-key $PRIVATE_KEY --rpc-url $RPC
cast send $ACS "computeScore(address)" $AGENT --private-key $PRIVATE_KEY --rpc-url $RPC
```

Full commands: [`SKILL.md`](./SKILL.md)

## MCP tools

`agent_credit_is_registered`, `agent_credit_get_score`, `agent_credit_get_limit`, `agent_credit_breakdown`, `agent_credit_register`, `agent_credit_compute_score`

## Key files

| File | Role |
|------|------|
| [`SKILL.md`](./SKILL.md) | Skill Engine manifest + cast commands |
| [`../../src/AgentCreditScore.sol`](../../src/AgentCreditScore.sol) | Contract |
| [`../../sdk/index.js`](../../sdk/index.js) | `AgentCreditScoreSDK` |
| [`../../ARCHITECTURE.md`](../../ARCHITECTURE.md) | Mermaid diagrams |

Addresses + tx hashes: [`deployments.example.json`](../../deployments.example.json)

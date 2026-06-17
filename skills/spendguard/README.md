# SpendGuard — On-Chain Spending Limits for AI Agents

> **BUIDL entry:** [SpendGuard on DoraHacks](https://dorahacks.io/hackathon/pharos-phase1/)  
> **This folder:** https://github.com/henrysammarfo/pharos-skills/tree/master/skills/spendguard  
> **Full stack:** https://github.com/henrysammarfo/pharos-skills

## What it does

Credit-gated **custodial spending vault** for AI agents. Agents deposit PHRS; every spend enforces:

- Per-transaction limit
- Daily limit (UTC day rollover)
- Minimum `AgentCreditScore`
- Recipient whitelist
- Large-spend intent gate via `IntentVerifier`

## Contract (Atlantic Testnet)

See [`deployments.example.json`](../../deployments.example.json) for the live address after deploy.

```bash
# Read policy (no wallet needed)
cast call $SPENDGUARD "getPolicy(address)" $AGENT \
  --rpc-url https://atlantic.dplabs-internal.com

# Simulate spend
cast call $SPENDGUARD "canSpend(address,address,uint256,uint256)(bool,bytes32)" \
  $AGENT $RECIPIENT $AMOUNT_WEI $INTENT_ID \
  --rpc-url https://atlantic.dplabs-internal.com
```

## Judge quick test (3 commands)

```bash
git clone https://github.com/henrysammarfo/pharos-skills.git && cd pharos-skills
./setup.sh   # or: .\setup.ps1 on Windows
npm run test:all
```

Read-only Atlantic checks (no private key):

```bash
npm run judge:readiness
```

## MCP tools (agent testing)

| Tool | Purpose |
|------|---------|
| `spendguard_can_spend` | Simulate policy without sending tx |
| `spendguard_get_policy` | Daily limit + remaining budget |
| `spendguard_deposit` | Fund custody (wallet required) |
| `spendguard_guarded_spend` | Execute spend (wallet required) |

Configure MCP: see [`mcp-server/mcp-config.example.json`](../../mcp-server/mcp-config.example.json)

## SDK

```javascript
import { SpendGuardSDK } from "../../sdk/index.js";
const sg = new SpendGuardSDK(provider);
const [ok, reason] = await sg.canSpend(agent, recipient, amountWei, intentId);
```

## Composability

- Reads score from **AgentCreditScore**
- Large spends require verified intent from **IntentVerifier**
- **x402PaymentChannel** registered as executor for skill-routed spends

## Files

| File | Role |
|------|------|
| [`SKILL.md`](./SKILL.md) | Pharos Skill Engine manifest |
| [`../../src/SpendGuard.sol`](../../src/SpendGuard.sol) | Contract source |
| [`../../test/PharosSkills.t.sol`](../../test/PharosSkills.t.sol) | Forge tests |

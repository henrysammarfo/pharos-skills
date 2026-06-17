---
name: agentcreditscore
description: >-
  On-chain credit scoring for AI agents on Pharos Atlantic Testnet. Weighted formula
  across success rate, volume, age, repayment. Soulbound NFT identity. Credit tiers
  up to 5,000 PHRS. Use when querying agent trust scores or credit limits.
---

# SKILL: AgentCreditScore

## Description

On-chain credit scoring for AI agents on Pharos.
Weighted formula across success rate, volume, age, repayment.
Soulbound NFT identity. Credit tiers up to 5,000 PHRS.

## Contract Address (Atlantic Testnet)

AgentCreditScore: `0x0b61985Ea2F43360685FdbE02D518C5B0e73CF36`

Explorer: https://atlantic.pharosscan.xyz/address/0x0b61985Ea2F43360685FdbE02D518C5B0e73CF36

Deploy tx: `0xb97896be81b26db1595d6585b3445e916238533fb24f07e15377b1754bcbcfa1`

## Register as agent

```bash
cast send 0x0b61985Ea2F43360685FdbE02D518C5B0e73CF36 "registerAgent()" \
  --private-key $PRIVATE_KEY \
  --rpc-url https://atlantic.dplabs-internal.com
```

## Check score

```bash
cast call 0x0b61985Ea2F43360685FdbE02D518C5B0e73CF36 "scores(address)" $AGENT \
  --rpc-url https://atlantic.dplabs-internal.com
```

## Compute and update score

```bash
cast send 0x0b61985Ea2F43360685FdbE02D518C5B0e73CF36 "computeScore(address)" $AGENT \
  --private-key $PRIVATE_KEY \
  --rpc-url https://atlantic.dplabs-internal.com
```

## Get credit limit

```bash
cast call 0x0b61985Ea2F43360685FdbE02D518C5B0e73CF36 "getCreditLimit(address)(uint256)" $AGENT \
  --rpc-url https://atlantic.dplabs-internal.com
```

## Verified integration

- Agent score after intent verify: **500** (v2 hardened contracts)
- Integration tx: `0x9afc331123dcc5255a16053a84c68db46faecee3933f23da7dd05c7fee5710f5`

## SDK

```javascript
import { AgentCreditScoreSDK } from "../../sdk/index.js";
const sdk = new AgentCreditScoreSDK(signer);
const score = await sdk.getScore(agentAddress);
```

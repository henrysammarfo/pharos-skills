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

AgentCreditScore: `0x23Df05400d42122D2962C9ea60d469ba66FE3665`

Explorer: https://atlantic.pharosscan.xyz/address/0x23Df05400d42122D2962C9ea60d469ba66FE3665

Deploy tx: `0x72e1cc2aeefe43c30d8352fc9bb9da71b3b4c3560393436ed5080274d38e3fcd`

## Register as agent

```bash
cast send 0x23Df05400d42122D2962C9ea60d469ba66FE3665 "registerAgent()" \
  --private-key $PRIVATE_KEY \
  --rpc-url https://atlantic.dplabs-internal.com
```

## Check score

```bash
cast call 0x23Df05400d42122D2962C9ea60d469ba66FE3665 "scores(address)" $AGENT \
  --rpc-url https://atlantic.dplabs-internal.com
```

## Compute and update score

```bash
cast send 0x23Df05400d42122D2962C9ea60d469ba66FE3665 "computeScore(address)" $AGENT \
  --private-key $PRIVATE_KEY \
  --rpc-url https://atlantic.dplabs-internal.com
```

## Get credit limit

```bash
cast call 0x23Df05400d42122D2962C9ea60d469ba66FE3665 "getCreditLimit(address)(uint256)" $AGENT \
  --rpc-url https://atlantic.dplabs-internal.com
```

## Verified integration

- Integration score: **500** · tx: `0x3385eeadff9f234999d1d4eca9461ef071fd2233dc2a87642616f8ee8b57f7f1`

## SDK

```javascript
import { AgentCreditScoreSDK } from "../../sdk/index.js";
const sdk = new AgentCreditScoreSDK(signer);
const score = await sdk.getScore(agentAddress);
```

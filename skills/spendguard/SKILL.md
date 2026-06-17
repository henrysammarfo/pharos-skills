---
name: spendguard
description: >-
  On-chain spending limits and custody vault for AI agents on Pharos Atlantic.
  Enforces per-tx and daily PHRS caps, whitelist recipients, minimum AgentCreditScore,
  and IntentVerifier gate for large spends. Use before any agent outbound transfer.
---

# SKILL: SpendGuard

## Description

Credit-gated custodial spending for AI agents. Agents deposit PHRS into SpendGuard;
every outbound transfer enforces policy limits, whitelist, minimum ACS score, and
optional verified-intent requirement for large amounts.

## Contract Address (Atlantic Testnet)

SpendGuard: `0x8395ada307Aa80C9F66A754fCC2CA01E63F9BB85`

Explorer: https://atlantic.pharosscan.xyz/address/0x8395ada307Aa80C9F66A754fCC2CA01E63F9BB85

Deploy tx: `0x13267745c8a64b1fa5eedb41f948b070d3f60cbba1c9d38c6cdf90f1dad44592`

## Create policy (controller)

```bash
cast send $SPENDGUARD \
  "createPolicy(address,uint256,uint256,uint256,uint256,bool)" \
  $AGENT $DAILY_LIMIT $PER_TX_LIMIT $MIN_SCORE $LARGE_THRESHOLD true \
  --private-key $CONTROLLER_KEY \
  --rpc-url https://atlantic.dplabs-internal.com
```

## Whitelist recipient

```bash
cast send $SPENDGUARD "setWhitelist(address,address,bool)" \
  $AGENT $RECIPIENT true \
  --private-key $CONTROLLER_KEY \
  --rpc-url https://atlantic.dplabs-internal.com
```

## Deposit PHRS

```bash
cast send $SPENDGUARD "deposit()" \
  --value 0.1ether \
  --private-key $AGENT_KEY \
  --rpc-url https://atlantic.dplabs-internal.com
```

## Guarded spend

```bash
cast send $SPENDGUARD "guardedSpend(address,uint256,uint256)" \
  $RECIPIENT $AMOUNT_WEI $INTENT_ID \
  --private-key $AGENT_KEY \
  --rpc-url https://atlantic.dplabs-internal.com
```

## Simulate (read-only)

```bash
cast call $SPENDGUARD \
  "canSpend(address,address,uint256,uint256)(bool,bytes32)" \
  $AGENT $RECIPIENT $AMOUNT_WEI $INTENT_ID \
  --rpc-url https://atlantic.dplabs-internal.com
```

## MCP

`spendguard_can_spend`, `spendguard_get_policy`, `spendguard_deposit`, `spendguard_guarded_spend`

## SDK

```javascript
import { SpendGuardSDK } from "../../sdk/index.js";
```

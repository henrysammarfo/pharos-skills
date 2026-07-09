---
name: nexus-trust-agent
description: >-
  NEXUS — unified Pharos Service Agent composing AgentCreditScore, IntentVerifier,
  x402PaymentChannel, DarkPay, and SpendGuard. Credit-enabled, accountable,
  private, spend-safe autonomous agent infrastructure on Atlantic Testnet (688689).
  Use when an agent needs trust scoring, intent commitment, micropayments, stealth
  transfers, or policy-gated spending in one callable service.
version: 1.0.0
author: Henry Sam Marfo
repository: https://github.com/henrysammarfo/pharos-skills
network: Pharos Atlantic Testnet
chainId: 688689
rpc: https://atlantic.dplabs-internal.com
explorer: https://atlantic.pharosscan.xyz
---

# SKILL: NEXUS Trust Agent

## What this Service Agent does

NEXUS wraps the full **Pharos Trust Stack** — five verified on-chain Skills — into one discoverable Service Agent for Anvita Flow / Steward Agent invocation.

| Layer | Skill | Capability |
|-------|-------|------------|
| Trust | AgentCreditScore | Soulbound identity, score 0–1000, credit tiers |
| Accountability | IntentVerifier | Commit-reveal + EIP-712 typed intents |
| Payments | x402PaymentChannel | Collateral channels, signed micropayments |
| Privacy | DarkPay | ERC-5564 stealth addresses |
| Safety | SpendGuard | Custodial limits, whitelist, intent-gated spends |

## Example tasks (Agent Card)

- Register my agent and return its credit score
- Commit and verify an intent before a large trade
- Open an x402 payment channel and sign a micropayment
- Send a private stealth payment on Pharos
- Check whether a spend is allowed under SpendGuard policy
- Return full trust stack status for an agent address

## Deployed contracts (Atlantic)

| Contract | Address |
|----------|---------|
| AgentCreditScore | `0x23Df05400d42122D2962C9ea60d469ba66FE3665` |
| IntentVerifier | `0x9cC1A13782574c83f15c874551997Dc3cE3b15DF` |
| x402PaymentChannel | `0xE16B0109D20C0f1977Dd821d285dd479Af0a9187` |
| DarkPay | `0xF028782C1e4E3BdB19d31A31Db713d185a07b328` |
| SpendGuard | `0x8395ada307Aa80C9F66A754fCC2CA01E63F9BB85` |

All verified on Pharosscan. See `deployments.json` in this package.

## Environment

```bash
export RPC=https://atlantic.dplabs-internal.com
export CHAIN_ID=688689
export ACS=0x23Df05400d42122D2962C9ea60d469ba66FE3665
export IV=0x9cC1A13782574c83f15c874551997Dc3cE3b15DF
export X402=0xE16B0109D20C0f1977Dd821d285dd479Af0a9187
export DARKPAY=0xF028782C1e4E3BdB19d31A31Db713d185a07b328
export SPENDGUARD=0x8395ada307Aa80C9F66A754fCC2CA01E63F9BB85
```

## Quick read — agent credit score

```bash
cast call $ACS "scores(address)" $AGENT --rpc-url $RPC
cast call $ACS "getCreditLimit(address)(uint256)" $AGENT --rpc-url $RPC
```

## Quick read — spend policy

```bash
cast call $SPENDGUARD "canSpend(address,address,uint256,uint256)(bool,bytes32)" \
  $AGENT $RECIPIENT $AMOUNT_WEI $INTENT_ID --rpc-url $RPC
```

## Quick read — intent verification

```bash
cast call $IV "isVerifiedIntent(address,uint256)(bool)" $AGENT $INTENT_ID --rpc-url $RPC
```

## Off-chain integration

Full repo (SDK, MCP, tests): https://github.com/henrysammarfo/pharos-skills

```bash
git clone https://github.com/henrysammarfo/pharos-skills.git
cd pharos-skills && ./setup.sh
npm run judge:readiness
npm run test:agent
npm run mcp
```

MCP server exposes 38 tools covering all five Skills.

## Runtime

`runtime/handler.mjs` routes Service Agent requests to stack operations using the shared SDK.

## Architecture

Mermaid diagrams: https://github.com/henrysammarfo/pharos-skills/blob/master/ARCHITECTURE.md

## Pricing

x402 per-call billing when Anvita payment module is live. Until then, read-only queries are free on Atlantic testnet.

## Builder

Henry Sam Marfo · Phase 1 Winner · TheLuckyReborned  
GitHub: https://github.com/henrysammarfo/pharos-skills

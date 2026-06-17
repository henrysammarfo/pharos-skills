---
name: intentverifier
description: >-
  Pre-commitment accountability for AI agents on Pharos. Agents commit reasoning
  hash before acting, reveal after. On-chain verification proves the agent did
  not deviate. Unrevealed intents are penalized.
---

# SKILL: IntentVerifier

## Description

Pre-commitment accountability for AI agents. Agents commit reasoning
hash before acting, reveal after. On-chain verification proves the
agent did not deviate. Unrevealed intents are penalized.

## Contract Address (Atlantic Testnet)

IntentVerifier: `0x9cC1A13782574c83f15c874551997Dc3cE3b15DF`

Explorer: https://atlantic.pharosscan.xyz/address/0x9cC1A13782574c83f15c874551997Dc3cE3b15DF

Deploy tx: `0x3532f50c6c475bea77f5c41d73aa1c8677490d857e7a2c3f26762a8a1aff7bfe`

## Compute hash off-chain first

```bash
cast call 0x9cC1A13782574c83f15c874551997Dc3cE3b15DF \
  "computeHash(string,string,bytes32,uint256)(bytes32)" \
  "SWAP" "BTC momentum positive, vol low" \
  0x0000000000000000000000000000000000000000000000000000000000000001 42 \
  --rpc-url https://atlantic.dplabs-internal.com
```

## Commit intent BEFORE acting

```bash
cast send 0x9cC1A13782574c83f15c874551997Dc3cE3b15DF "commitIntent(bytes32)(uint256)" $HASH \
  --private-key $PRIVATE_KEY \
  --rpc-url https://atlantic.dplabs-internal.com
```

## Reveal intent AFTER acting

```bash
cast send 0x9cC1A13782574c83f15c874551997Dc3cE3b15DF \
  "revealIntent(uint256,string,string,bytes32,uint256)" \
  0 "SWAP" "BTC momentum positive, vol low" \
  0x0000000000000000000000000000000000000000000000000000000000000001 42 \
  --private-key $PRIVATE_KEY \
  --rpc-url https://atlantic.dplabs-internal.com
```

## EIP-712 typed hash

```bash
cast call 0x9cC1A13782574c83f15c874551997Dc3cE3b15DF \
  "computeHashEIP712(string,string,bytes32,uint256)(bytes32)" \
  "SWAP" "BTC momentum positive, vol low" \
  0x0000000000000000000000000000000000000000000000000000000000000001 42 \
  --rpc-url https://atlantic.dplabs-internal.com
```

## Verified integration

- Commit tx: `0xae3ee358ef9abc1b79bacb5fb18939fb727f08840e567028ef6c49964d166f15`
- Reveal tx: `0xc6300bd0bb0173f5e8d2f70904e3129388722c06151c727c0349bfd70603015b`
- EIP-712 commit: `0xb3edf987bebf7ed75b083e11b00d24711221d0739a6a62985fc406f56617345a`
- Updates AgentCreditScore on successful verify

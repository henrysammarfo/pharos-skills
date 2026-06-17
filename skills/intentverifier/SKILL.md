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

IntentVerifier: `0x97B9ecB1CbFa7fC78Eb83e61A208b37D9f3F288F`

Explorer: https://atlantic.pharosscan.xyz/address/0x97B9ecB1CbFa7fC78Eb83e61A208b37D9f3F288F

Deploy tx: `0xfad5c0b33524d9aa9e73f82bb4a5755d435c0611af2b14bed762895720947c7b`

## Compute hash off-chain first

```bash
cast call 0x97B9ecB1CbFa7fC78Eb83e61A208b37D9f3F288F \
  "computeHash(string,string,bytes32,uint256)(bytes32)" \
  "SWAP" "BTC momentum positive, vol low" \
  0x0000000000000000000000000000000000000000000000000000000000000001 42 \
  --rpc-url https://atlantic.dplabs-internal.com
```

## Commit intent BEFORE acting

```bash
cast send 0x97B9ecB1CbFa7fC78Eb83e61A208b37D9f3F288F "commitIntent(bytes32)(uint256)" $HASH \
  --private-key $PRIVATE_KEY \
  --rpc-url https://atlantic.dplabs-internal.com
```

## Reveal intent AFTER acting

```bash
cast send 0x97B9ecB1CbFa7fC78Eb83e61A208b37D9f3F288F \
  "revealIntent(uint256,string,string,bytes32,uint256)" \
  0 "SWAP" "BTC momentum positive, vol low" \
  0x0000000000000000000000000000000000000000000000000000000000000001 42 \
  --private-key $PRIVATE_KEY \
  --rpc-url https://atlantic.dplabs-internal.com
```

## Verified integration

- Commit tx: `0xf4e48e2ca7ed5fac947caeae10b0795b674ea491e0544a3f1718d04c37370d33`
- Reveal tx: `0xdd2d7ffcad0f60c3591f70483f5afc51407f5bb68370145c8d2fc4f3ceec1748`
- Updates AgentCreditScore on successful verify

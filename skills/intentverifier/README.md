# IntentVerifier

> **BUIDL folder:** https://github.com/henrysammarfo/pharos-skills/tree/master/skills/intentverifier  
> **Verified:** https://atlantic.pharosscan.xyz/address/0x9cC1A13782574c83f15c874551997Dc3cE3b15DF#code

Pre-commitment accountability: legacy packed hash **and** EIP-712 typed intents.

## Judge quick test

```bash
git clone https://github.com/henrysammarfo/pharos-skills.git && cd pharos-skills
./setup.sh
npm run judge:readiness
npm run test:all
```

## Environment

```bash
export RPC=https://atlantic.dplabs-internal.com
export IV=0x9cC1A13782574c83f15c874551997Dc3cE3b15DF
export AGENT=0xYourAddress
```

## Read-only Atlantic

```bash
cast call $IV "computeHash(string,string,bytes32,uint256)(bytes32)" \
  "SWAP" "reason" 0x0000000000000000000000000000000000000000000000000000000000000001 42 \
  --rpc-url $RPC

cast call $IV "computeHashEIP712(string,string,bytes32,uint256)(bytes32)" \
  "SWAP" "reason" 0x0000000000000000000000000000000000000000000000000000000000000001 42 \
  --rpc-url $RPC

cast call $IV "isVerifiedIntent(address,uint256)(bool)" $AGENT 0 --rpc-url $RPC
```

## MCP tools

`intent_compute_hash`, `intent_compute_hash_eip712`, `intent_is_verified`, `intent_count`, `intent_commit`, `intent_reveal`, `intent_penalize`

## Key files

| File | Role |
|------|------|
| [`SKILL.md`](./SKILL.md) | Skill Engine manifest |
| [`../../src/IntentVerifier.sol`](../../src/IntentVerifier.sol) | Contract |
| [`../../ARCHITECTURE.md`](../../ARCHITECTURE.md) | Mermaid data-flow diagrams |

# IntentVerifier

> **Folder:** https://github.com/henrysammarfo/pharos-skills/tree/master/skills/intentverifier

Pre-commitment accountability: legacy packed hash **and** EIP-712 typed intents.

## Judge quick test

```bash
git clone https://github.com/henrysammarfo/pharos-skills.git && cd pharos-skills
./setup.sh
npm run test:all
```

## Read-only Atlantic

```bash
cast call $IV "computeHash(string,string,bytes32,uint256)(bytes32)" \
  "SWAP" "reason" 0x0000000000000000000000000000000000000000000000000000000000000001 42 \
  --rpc-url https://atlantic.dplabs-internal.com

cast call $IV "computeHashEIP712(string,string,bytes32,uint256)(bytes32)" \
  "SWAP" "reason" 0x0000000000000000000000000000000000000000000000000000000000000001 42 \
  --rpc-url https://atlantic.dplabs-internal.com

cast call $IV "isVerifiedIntent(address,uint256)(bool)" $AGENT 0 \
  --rpc-url https://atlantic.dplabs-internal.com
```

## MCP tools

`intent_compute_hash`, `intent_compute_hash_eip712`, `intent_commit`, `intent_reveal`, `intent_is_verified`

## Key files

- [`SKILL.md`](./SKILL.md)
- [`../../src/IntentVerifier.sol`](../../src/IntentVerifier.sol)

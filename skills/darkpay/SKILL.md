---
name: darkpay
description: >-
  Private payments on Pharos using ERC-5564-inspired stealth addresses.
  Breaks on-chain link between sender and receiver identity. secp256k1 ECDH
  with view tag optimization. First deployment on Pharos Atlantic.
---

# SKILL: DarkPay — Stealth Address Protocol

## Description

Private payments on Pharos using ERC-5564 stealth addresses.
Breaks on-chain link between sender and receiver identity.
ERC-5564 standard co-authored by Vitalik Buterin. First deployment on Pharos Atlantic.

## Contract Address (Atlantic Testnet)

DarkPay: `0xF028782C1e4E3BdB19d31A31Db713d185a07b328`

Explorer: https://atlantic.pharosscan.xyz/address/0xF028782C1e4E3BdB19d31A31Db713d185a07b328

Deploy tx: `0x3c388c1ed8f5d58c42cc29dda2c5275e714aa6941ebb6d5c69bcc81668cdd6d8`

## Step 1: Generate meta-address off-chain (receiver, once)

```bash
node -e "
import { DarkPaySDK } from './sdk/darkpay.js';
const keys = DarkPaySDK.generateMetaAddress();
console.log('spendKey:', Buffer.from(keys.spendingPubKey).toString('hex'));
console.log('viewKey:', Buffer.from(keys.viewingPubKey).toString('hex'));
"
```

## Step 2: Register on-chain

```bash
cast send 0xF028782C1e4E3BdB19d31A31Db713d185a07b328 \
  "registerStealthMetaAddress(bytes,bytes)" \
  $SPEND_PUB_HEX $VIEW_PUB_HEX \
  --private-key $PRIVATE_KEY \
  --rpc-url https://atlantic.dplabs-internal.com
```

## Step 4: Send PHRS to stealth address

```bash
cast send 0xF028782C1e4E3BdB19d31A31Db713d185a07b328 \
  "sendNativeStealth(address,bytes,bytes)" \
  $STEALTH_ADDRESS $EPH_PUB_HEX $VIEW_TAG_HEX \
  --value 0.001ether \
  --private-key $PRIVATE_KEY \
  --rpc-url https://atlantic.dplabs-internal.com
```

## Verified integration

- Register meta-address: `0xdc9a51fdfddc35707e9c28f6c31898c05deb62bfe5691784573c217cb44c8693`
- Send native stealth: `0x8f2527e50854b242ca3c1a0d349dcbdef04b42bc2d145c2f117e8b265d392085`
- Announcement scan matched: **true**
- Stealth privkey derived successfully on Atlantic

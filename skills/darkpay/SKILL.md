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

DarkPay: `0x294919b4114Ac0Fe30F1551351655e016AC34eBa`

Explorer: https://atlantic.pharosscan.xyz/address/0x294919b4114Ac0Fe30F1551351655e016AC34eBa

Deploy tx: `0x5ebc60022ba12a7f8e6ba4449a1ae9fca35d85468001845f93f6689042fbecfb`

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
cast send 0x294919b4114Ac0Fe30F1551351655e016AC34eBa \
  "registerStealthMetaAddress(bytes,bytes)" \
  $SPEND_PUB_HEX $VIEW_PUB_HEX \
  --private-key $PRIVATE_KEY \
  --rpc-url https://atlantic.dplabs-internal.com
```

## Step 4: Send PHRS to stealth address

```bash
cast send 0x294919b4114Ac0Fe30F1551351655e016AC34eBa \
  "sendNativeStealth(address,bytes,bytes)" \
  $STEALTH_ADDRESS $EPH_PUB_HEX $VIEW_TAG_HEX \
  --value 0.001ether \
  --private-key $PRIVATE_KEY \
  --rpc-url https://atlantic.dplabs-internal.com
```

## Verified integration

- Register meta-address: `0x76bfd2df26ae46eaba9ff7ec303796a34020eb7f8ad36169e643b602c6c3e1b0`
- Send native stealth: `0x91abfd817cc1f5effa3b0db9f592afb95d7a3ff9612d4004c782d0d33aefe8f8`
- Announcement scan matched: **true**
- Stealth privkey derived successfully on Atlantic

# DarkPay

> **Folder:** https://github.com/henrysammarfo/pharos-skills/tree/master/skills/darkpay

ERC-5564-inspired stealth addresses on Pharos Atlantic — native PHRS + ERC-20.

## Judge quick test

```bash
git clone https://github.com/henrysammarfo/pharos-skills.git && cd pharos-skills
./setup.sh
node -e "import {DarkPaySDK} from './sdk/darkpay.js'; const k=DarkPaySDK.generateMetaAddress(); console.log('ok', k.spendingPubKey.length);"
```

## Read-only Atlantic

```bash
cast call $DARKPAY "announcementCount()(uint256)" --rpc-url https://atlantic.dplabs-internal.com
cast call $DARKPAY "getAnnouncements(uint256)" $FROM_BLOCK --rpc-url https://atlantic.dplabs-internal.com
```

## MCP tools

`darkpay_generate_meta_address`, `darkpay_compute_stealth_address`

## Key files

- [`SKILL.md`](./SKILL.md)
- [`../../src/DarkPay.sol`](../../src/DarkPay.sol)
- [`../../sdk/darkpay.js`](../../sdk/darkpay.js)

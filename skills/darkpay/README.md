# DarkPay

> **BUIDL folder:** https://github.com/henrysammarfo/pharos-skills/tree/master/skills/darkpay  
> **Verified:** https://atlantic.pharosscan.xyz/address/0xF028782C1e4E3BdB19d31A31Db713d185a07b328#code

ERC-5564-inspired stealth addresses on Pharos Atlantic — native PHRS + ERC-20.

## Judge quick test

```bash
git clone https://github.com/henrysammarfo/pharos-skills.git && cd pharos-skills
./setup.sh
npm run judge:readiness
npm run test:agent   # register → send stealth → scan (wallet required)
```

## Environment

```bash
export RPC=https://atlantic.dplabs-internal.com
export DARKPAY=0xF028782C1e4E3BdB19d31A31Db713d185a07b328
export FROM_BLOCK=0
```

## Read-only Atlantic

```bash
cast call $DARKPAY "announcementCount()(uint256)" --rpc-url $RPC
cast call $DARKPAY "getAnnouncements(uint256)" $FROM_BLOCK --rpc-url $RPC
```

## MCP tools

`darkpay_generate_meta_address`, `darkpay_compute_stealth_address`, `darkpay_announcement_count`, `darkpay_get_announcements`, `darkpay_check_announcement`, `darkpay_derive_stealth_privkey`, `darkpay_register_meta_address`, `darkpay_send_native_stealth`, `darkpay_scan_announcements`

## Key files

| File | Role |
|------|------|
| [`SKILL.md`](./SKILL.md) | Skill Engine manifest |
| [`../../src/DarkPay.sol`](../../src/DarkPay.sol) | Contract |
| [`../../sdk/darkpay.js`](../../sdk/darkpay.js) | `DarkPaySDK` + `DarkPayChainSDK` |
| [`../../ARCHITECTURE.md`](../../ARCHITECTURE.md) | Mermaid stealth payment flow |

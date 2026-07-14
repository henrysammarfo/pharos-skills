# Pacific Mainnet — Fund Deployer (NEXUS)

## Deployer address (fund this only)

```
0x4BC1C93eF8E77E9aD9A045d7Fd760bcd500F7B00
```

Explorer: https://pharosscan.xyz/address/0x4BC1C93eF8E77E9aD9A045d7Fd760bcd500F7B00

Wallet file (local, gitignored): `wallet.mainnet.json`

## How to get PROS

1. Add Pacific Mainnet to MetaMask:
   - Network name: Pharos Pacific Mainnet
   - RPC: `https://rpc.pharos.xyz`
   - Chain ID: `1672`
   - Symbol: `PROS`
   - Explorer: `https://pharosscan.xyz`
2. Obtain PROS via:
   - Pharos Port on-ramp: https://port.pharos.xyz
   - Claim portal (if eligible): https://claim.pharos.xyz
   - CEX/DEX that lists PROS, then withdraw to Pacific Mainnet
3. Send **≥ 5–10 PROS** to the deployer address above.

## Checklist

- [ ] PROS acquired on Pacific Mainnet (1672)
- [ ] Sent ≥ 5–10 PROS to `0x4BC1C93eF8E77E9aD9A045d7Fd760bcd500F7B00`
- [ ] Confirmed balance:

```powershell
cd C:\Users\RICHEY_SON\pharos-skills
npm run balance:pacific
```

- [ ] Deploy:

```powershell
npm run compile
npm run deploy:pacific
npm run smoke:pacific -- --register
npm run nexus:sync
npm run nexus:package
```

## Safety

- Do **not** reuse Atlantic `wallet.json` or prize wallets.
- Do **not** paste the private key into Anvita, Discord, or chat.
- Do **not** commit `wallet.mainnet.json`.
- Network: RPC `https://rpc.pharos.xyz` · Explorer `https://pharosscan.xyz`

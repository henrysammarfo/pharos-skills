# x402PaymentChannel

> **BUIDL folder:** https://github.com/henrysammarfo/pharos-skills/tree/master/skills/x402-payment-channel  
> **Verified:** https://atlantic.pharosscan.xyz/address/0xE16B0109D20C0f1977Dd821d285dd479Af0a9187#code

On-chain collateral channels with signed off-chain micropayments **plus** HTTP x402 middleware.

## Judge quick test

```bash
git clone https://github.com/henrysammarfo/pharos-skills.git && cd pharos-skills
./setup.sh
npm run test:all
npm run x402:http
# another terminal:
curl -i http://localhost:4020/api/premium
curl http://localhost:4020/health
```

With funded `wallet.json`:

```bash
npm run test:agent   # includes x402 open → sign → settle → close on Atlantic
```

## Environment

```bash
export RPC=https://atlantic.dplabs-internal.com
export X402=0xE16B0109D20C0f1977Dd821d285dd479Af0a9187
export CHANNEL_ID=0x...   # from openChannel event
```

## Read-only Atlantic

```bash
cast call $X402 "getPaymentMessage(bytes32,uint256,uint256)(bytes32)" \
  $CHANNEL_ID 1000000000000000 1 --rpc-url $RPC
```

## MCP tools

`x402_get_channel`, `x402_payment_message`, `x402_sign_payment`, `x402_open_channel`, `x402_open_channel_e2e`, `x402_settle_payment`, `x402_close_channel`

## Key files

| File | Role |
|------|------|
| [`SKILL.md`](./SKILL.md) | Skill Engine manifest |
| [`../../src/x402PaymentChannel.sol`](../../src/x402PaymentChannel.sol) | Contract |
| [`../../x402-http/server.js`](../../x402-http/server.js) | HTTP 402 flow |
| [`../../ARCHITECTURE.md`](../../ARCHITECTURE.md) | Mermaid x402 sequence diagram |

Pharos x402 docs: https://docs.pharos.xyz/developer-guide/x402

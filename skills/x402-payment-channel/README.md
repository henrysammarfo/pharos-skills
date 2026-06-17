# x402PaymentChannel

> **Folder:** https://github.com/henrysammarfo/pharos-skills/tree/master/skills/x402-payment-channel

On-chain collateral channels with signed off-chain micropayments **plus** HTTP x402 middleware.

## Judge quick test

```bash
git clone https://github.com/henrysammarfo/pharos-skills.git && cd pharos-skills
./setup.sh
npm run x402:http
# another terminal:
curl -i http://localhost:4020/api/premium
curl http://localhost:4020/health
```

## On-chain (Atlantic)

```bash
cast call $X402 "getPaymentMessage(bytes32,uint256,uint256)(bytes32)" \
  $CHANNEL_ID 1000000000000000 1 \
  --rpc-url https://atlantic.dplabs-internal.com
```

## MCP tools

`x402_payment_message`, `contracts_info`

## Key files

- [`SKILL.md`](./SKILL.md)
- [`../../src/x402PaymentChannel.sol`](../../src/x402PaymentChannel.sol)
- [`../../x402-http/server.js`](../../x402-http/server.js) — Pharos HTTP 402 flow

Pharos x402 docs: https://docs.pharos.xyz/developer-guide/x402

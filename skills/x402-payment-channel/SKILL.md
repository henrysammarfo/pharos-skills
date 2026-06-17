---
name: x402-payment-channel
description: >-
  Off-chain micropayment channels for AI agent service payments on Pharos Atlantic.
  Signed micropayments with collateral. Integrates with AgentCreditScore. Includes
  HTTP x402 middleware in x402-http/server.js.
---

# SKILL: x402PaymentChannel

## Description

Off-chain micropayment channels for AI agent service payments
using Pharos native x402-inspired protocol. Zero gas per micropayment
during channel operation. Open and close on-chain.

**Note:** This Skill implements on-chain payment channels with signed off-chain
micropayments. HTTP x402 (`402 Payment Required`) middleware lives in `x402-http/server.js`.

## Contract Address (Atlantic Testnet)

x402PaymentChannel: `0xE16B0109D20C0f1977Dd821d285dd479Af0a9187`

Explorer: https://atlantic.pharosscan.xyz/address/0xE16B0109D20C0f1977Dd821d285dd479Af0a9187

Deploy tx: `0xc9609a42cd13319b20efd5a3ac439357c68f7e3c2bd368d3e25f20f81a18a379`

## Open payment channel (deposit 0.01 PHRS as collateral)

```bash
cast send 0xE16B0109D20C0f1977Dd821d285dd479Af0a9187 \
  "openChannel(address,uint256)(bytes32)" \
  $SERVICE_PROVIDER 1000 \
  --value 0.01ether \
  --private-key $PRIVATE_KEY \
  --rpc-url https://atlantic.dplabs-internal.com
```

## Generate payment message to sign off-chain

```bash
cast call 0xE16B0109D20C0f1977Dd821d285dd479Af0a9187 \
  "getPaymentMessage(bytes32,uint256,uint256)(bytes32)" \
  $CHANNEL_ID 1000000000000000 1 \
  --rpc-url https://atlantic.dplabs-internal.com
```

## Service provider settles payment

```bash
cast send 0xE16B0109D20C0f1977Dd821d285dd479Af0a9187 \
  "settlePayment(bytes32,uint256,uint256,bytes)" \
  $CHANNEL_ID 1000000000000000 1 $AGENT_SIGNATURE \
  --private-key $PROVIDER_KEY \
  --rpc-url https://atlantic.dplabs-internal.com
```

## Verified integration

- Open channel: `0x500f089095eab3813e5909d0cc1e6561ead4253a73375366adc4fb0d7c43fa63`
- Settle payment: `0x840f29340ab81b0ead39b9a99c6291ea1197b8d9e960092b7fd7446b75a83be9`
- Close channel: `0x3e543e2228074855750d87aefdcb541703ab3ee342617e73d26f0b72826ca723`

## HTTP x402 middleware

```bash
node x402-http/server.js
curl -i http://localhost:4020/api/premium
```

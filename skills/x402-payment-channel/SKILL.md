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

x402PaymentChannel: `0x827F4b43B1468D2B2b35e9bd99A16a0FA426acbe`

Explorer: https://atlantic.pharosscan.xyz/address/0x827F4b43B1468D2B2b35e9bd99A16a0FA426acbe

Deploy tx: `0x645aec45da3ddcaab1774e0377908878a1d1e87c80d5930f0fe6371b454587ca`

## Open payment channel (deposit 0.01 PHRS as collateral)

```bash
cast send 0x827F4b43B1468D2B2b35e9bd99A16a0FA426acbe \
  "openChannel(address,uint256)(bytes32)" \
  $SERVICE_PROVIDER 1000 \
  --value 0.01ether \
  --private-key $PRIVATE_KEY \
  --rpc-url https://atlantic.dplabs-internal.com
```

## Generate payment message to sign off-chain

```bash
cast call 0x827F4b43B1468D2B2b35e9bd99A16a0FA426acbe \
  "getPaymentMessage(bytes32,uint256,uint256)(bytes32)" \
  $CHANNEL_ID 1000000000000000 1 \
  --rpc-url https://atlantic.dplabs-internal.com
```

## Service provider settles payment

```bash
cast send 0x827F4b43B1468D2B2b35e9bd99A16a0FA426acbe \
  "settlePayment(bytes32,uint256,uint256,bytes)" \
  $CHANNEL_ID 1000000000000000 1 $AGENT_SIGNATURE \
  --private-key $PROVIDER_KEY \
  --rpc-url https://atlantic.dplabs-internal.com
```

## Verified integration

- Open channel: `0x646f231efc6c4960acb43a9ed5f9c70eae849b3a5ae2fc30c810607c67b8b877`
- Settle payment: `0x1f75780d66f158ec90fcbe6aa725a1093e23ebe9dbc08f59f2a98fd364959ed7`
- Close channel: `0x48d0a230aaa30361afe6e9640aa7e7671b80070b345d904f23b0c84874655e3c`

## HTTP x402 middleware

```bash
node x402-http/server.js
curl -i http://localhost:4020/api/premium
```

---
name: nexus-trust-agent
description: Everyday trust co-pilot for AI agents on Pharos Pacific Mainnet. Check credit scores, verify intents before sending funds, enforce spend policies, open x402 micropayments, and send private stealth transfers — all in one Service Agent. Use when a user asks if an agent is trusted, if a spend is safe, or needs private payments on chainId 1672.
---

# SKILL: NEXUS Trust Agent

## Description

NEXUS is your everyday trust layer for autonomous agents on **Pharos Pacific Mainnet**. One call answers the questions people actually ask:

- Is this agent trusted enough to pay me?
- Is this spend safe under my policy?
- Has my intent been verified before I send funds?
- What's my credit score and limit?
- Can I pay privately?

It composes five verified on-chain Skills into one safe endpoint.

| Layer | Skill | Everyday use |
|-------|-------|--------------|
| Trust | AgentCreditScore | Score 0–1000, registration, credit limit |
| Accountability | IntentVerifier | Verify intent before high-value actions |
| Payments | x402PaymentChannel | Micropayment channels |
| Privacy | DarkPay | Stealth / private native transfers |
| Safety | SpendGuard | Policy gate before any custodial spend |

**Network:** Pharos Pacific Mainnet · chainId `1672`  
**RPC:** `https://rpc.pharos.xyz`  
**Explorer:** `https://pharosscan.xyz`  
**Price:** **$0.02 per call** (x402)  
**Demo:** `https://nexus-trust-agent.vercel.app`  
**Repository:** `https://github.com/henrysammarfo/pharos-skills`

## Execution Instructions

### 1. Classify the request

| Intent keywords | Target Skill |
|-----------------|--------------|
| credit, score, trusted, register, limit | AgentCreditScore |
| intent, verify, before I send, accountability | IntentVerifier |
| x402, channel, micropayment | x402PaymentChannel |
| stealth, private, dark | DarkPay |
| spend, safe, policy, guard, allowed | SpendGuard |
| status, stack, overview, full | All five (aggregate) |

### 2. Gather required inputs

| Operation | Required |
|-----------|----------|
| Credit / full stack | `agent` address (0x…) |
| Intent verify | `agent`, `intentId` |
| Spend check | `agent`, `recipient`, `amountWei`, `intentId` |
| Writes | Above + explicit user confirmation |

### 3. Safe execution order (never skip for payments)

1. **AgentCreditScore** — registered? score/limit OK?
2. **IntentVerifier** — verified intent when amount is material
3. **SpendGuard** — `canSpend` must pass
4. **x402 or DarkPay** — execute only after 1–3

Read-only queries may stop after the relevant Skill.

### 4. On-chain contracts (Pacific Mainnet)

| Contract | Address |
|----------|---------|
| AgentCreditScore | `0xA3399056b2CD7b404d0e99020b0ECBB8F40dc5F7` |
| IntentVerifier | `0x591Fc32E84fd66e335dC1509d09A09af156df355` |
| x402PaymentChannel | `0x4cfD9F5cfEA425e8A533a7679559825464121b83` |
| DarkPay | `0x58Bd7bafD2390fD6661A44D104f5296973804793` |
| SpendGuard | `0x25DA2D8AC4b14B575930029d105a583AE6630bC8` |

Example credit read:

```bash
cast call 0xA3399056b2CD7b404d0e99020b0ECBB8F40dc5F7 "scores(address)" $AGENT --rpc-url https://rpc.pharos.xyz
```

### 5. Writes

- Confirm the user wants an on-chain transaction on Pacific Mainnet.
- Never request seed phrases or private keys.
- Prefer read-first; writes only after confirmation.

### 6. Scripts

| Script | Purpose |
|--------|---------|
| `scripts/handler.mjs` | Route `{ task, agent, ... }` to RPC |
| `scripts/status.mjs` | CLI full-stack status |

See `references/contracts.md` and `references/flows.md`.

## Client Interaction Flow

### Clarification

- Missing address → ask for Pacific Mainnet `0x` wallet.
- Ambiguous → clarify: trust check, spend safety, intent, or full stack?
- Payment request → confirm amount, recipient, and privacy (x402 vs stealth).

### Input Gathering

1. Task type (everyday phrasing OK)
2. Agent address
3. Operation fields (recipient, amountWei, intentId)
4. Write acknowledgement when needed

### Delivery Confirmation

1. Name the Skill(s) used
2. Return standard JSON
3. Include Pharosscan links
4. End with a clear next step

## Delivery Standards and Output Format

- Always state Skill + contract address + explorer URL
- Pacific Mainnet only (chainId 1672)
- No keys, seeds, or `.env` in responses
- Price context: $0.02 per Anvita call via x402

### JSON success

```json
{
  "ok": true,
  "service": "nexus-trust-agent",
  "network": { "name": "Pharos Pacific Mainnet", "chainId": 1672 },
  "skill": "AgentCreditScore",
  "agent": "0x...",
  "data": {},
  "contracts": {},
  "explorerUrl": "https://pharosscan.xyz/address/0x...",
  "message": "Human-readable summary"
}
```

### Example tasks (usage magnets)

- Check if this agent is trusted enough to pay me
- Is this spend safe under my policy?
- Verify my intent before I send funds
- Show my credit score and limit on Pharos
- Send a private stealth payment
- Full trust stack status for my wallet

## Builder

Henry Sam Marfo · Pharos Phase 1 Winner · `henrysammarfo/pharos-skills`

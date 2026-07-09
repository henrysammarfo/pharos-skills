---
name: nexus-trust-agent
description: >-
  NEXUS — unified Pharos Service Agent composing AgentCreditScore, IntentVerifier,
  x402PaymentChannel, DarkPay, and SpendGuard. Provides trust scoring, intent
  accountability, x402 micropayments, stealth transfers, and spend-policy enforcement
  on Atlantic Testnet (chainId 688689). Use when a steward or client agent needs the
  full Pharos Trust Stack through one callable service.
---

# SKILL: NEXUS Trust Agent

## Description

NEXUS is a Phase 2 Service Agent that composes five verified on-chain Pharos Skills into one trust infrastructure endpoint. It routes client requests to the correct Skill, enforces safe execution order for high-risk operations, and returns structured results with Atlantic explorer links.

| Layer | Skill | Capability |
|-------|-------|------------|
| Trust | AgentCreditScore | Soulbound identity, score 0–1000, credit tiers |
| Accountability | IntentVerifier | Commit-reveal + EIP-712 typed intents |
| Payments | x402PaymentChannel | Collateral channels, signed micropayments |
| Privacy | DarkPay | ERC-5564 stealth address payments |
| Safety | SpendGuard | Custodial limits, whitelist, intent-gated spends |

**Network:** Pharos Atlantic Testnet · chainId `688689`  
**RPC:** `https://atlantic.dplabs-internal.com`  
**Explorer:** `https://atlantic.pharosscan.xyz`  
**Repository:** `https://github.com/henrysammarfo/pharos-skills`  
**Demo:** `https://nexus-trust-agent.vercel.app`

## Execution Instructions

### 1. Classify the request

Map the client task to one or more Skills:

| Intent keywords | Target Skill | Action |
|-----------------|--------------|--------|
| credit, score, register, trust, limit | AgentCreditScore | `scores`, `getCreditLimit`, `isRegistered` |
| intent, commit, reveal, verify, accountability | IntentVerifier | `isVerifiedIntent`, commit/reveal flows |
| x402, channel, micropayment, settle | x402PaymentChannel | open channel, sign payment, settle |
| stealth, private, dark, ERC-5564 | DarkPay | meta-address registration, stealth send |
| spend, policy, guard, whitelist, allowed | SpendGuard | `canSpend` before any custodial spend |
| status, stack, overview, full | All five | Aggregate read-only status |

### 2. Gather required inputs

| Operation | Required inputs |
|-----------|-----------------|
| Credit read | `agent` address (0x…) |
| Intent verify | `agent`, `intentId` (uint256) |
| Spend check | `agent`, `recipient`, `amountWei`, `intentId` |
| Full stack | `agent` address |
| Write operations | Above + explicit user confirmation; wallet funds on Atlantic |

Reject or clarify if any required field is missing or malformed.

### 3. Safe execution order (high-risk flows)

For spends, trades, or large transfers, always execute in order:

1. **AgentCreditScore** — confirm agent is registered; score and credit limit are sufficient.
2. **IntentVerifier** — if amount exceeds policy threshold, require verified intent (`isVerifiedIntent` returns true).
3. **SpendGuard** — call `canSpend(agent, recipient, amount, intentId)`; abort if false.
4. **x402PaymentChannel** or **DarkPay** — execute payment only after steps 1–3 pass.

Read-only queries may skip steps 3–4.

### 4. On-chain reads (no wallet)

Use Atlantic RPC `eth_call` against deployed contracts:

| Contract | Address |
|----------|---------|
| AgentCreditScore | `0x23Df05400d42122D2962C9ea60d469ba66FE3665` |
| IntentVerifier | `0x9cC1A13782574c83f15c874551997Dc3cE3b15DF` |
| x402PaymentChannel | `0xE16B0109D20C0f1977Dd821d285dd479Af0a9187` |
| DarkPay | `0xF028782C1e4E3BdB19d31A31Db713d185a07b328` |
| SpendGuard | `0x8395ada307Aa80C9F66A754fCC2CA01E63F9BB85` |

Example read — credit score:

```bash
cast call 0x23Df05400d42122D2962C9ea60d469ba66FE3665 "scores(address)" $AGENT \
  --rpc-url https://atlantic.dplabs-internal.com
```

### 5. On-chain writes (wallet required)

For registration, intent commit/reveal, channel open, stealth send, or SpendGuard spend:

- Confirm the user intends a **write** operation and understands gas cost on Atlantic testnet.
- Never ask for or store seed phrases; user supplies signing through their own wallet or SDK.
- Point advanced integrators to `scripts/handler.mjs` and the parent repo SDK/MCP (`npm run test:agent`).

### 6. Scripts

| Script | Purpose |
|--------|---------|
| `scripts/handler.mjs` | Routes structured `{ task, agent, ... }` requests to RPC reads |
| `scripts/status.mjs` | CLI: full stack status for one agent address |

See `references/contracts.md` and `references/flows.md` for contract ABIs and sequence diagrams.

## Client Interaction Flow

### Clarification

Before executing, clarify ambiguous requests:

- **“Check my agent”** → Ask: full stack status, credit score only, or spend policy?
- **“Send payment”** → Ask: x402 micropayment or DarkPay stealth? Amount and recipient?
- **“Large trade”** → Ask: has intent been committed and revealed? Provide `intentId`.
- **Missing address** → Ask: “Please provide the agent wallet address (0x…).”

If the task spans multiple Skills, state the planned sequence and get confirmation before writes.

### Input Gathering

Collect inputs in this order:

1. **Task type** — one of the supported example tasks or a clear paraphrase.
2. **Agent address** — required for all operations.
3. **Operation-specific fields** — recipient, amount (wei or PHRS with conversion), intentId.
4. **Risk acknowledgement** — for writes: “This will submit an on-chain transaction on Atlantic testnet. Proceed?”

Validate:

- Addresses are 42-character hex starting with `0x`.
- Amounts are positive integers in wei when calling `canSpend`.
- `intentId` is a non-negative integer string.

### Delivery Confirmation

Before returning the final answer:

1. Summarize what was checked or executed (which Skills, which contracts).
2. Present results in the standard JSON format (see below).
3. Include Pharosscan links for any transaction hashes.
4. For read-only success, end with: **“NEXUS trust check complete. Need anything else?”**
5. For writes, end with: **“Transaction submitted. Verify on explorer before relying on state.”**

If a step failed, explain which Skill blocked the flow and what the client should do next (e.g. register agent, commit intent, deposit to SpendGuard).

## Delivery Standards and Output Format

### Standards

- Always state **which Skill(s)** handled the request and **why**.
- Prefer **read-only** RPC on Atlantic for debugging; never fabricate scores or tx hashes.
- Include **contract address** and **explorer URL** for every on-chain reference.
- Atlantic testnet only — do not claim mainnet deployment.
- No private keys, `.env` values, or seed phrases in responses.
- Link to architecture docs for deep dives: `references/flows.md` or GitHub `ARCHITECTURE.md`.

### JSON response schema

```json
{
  "ok": true,
  "service": "nexus-trust-agent",
  "network": { "name": "Pharos Atlantic Testnet", "chainId": 688689 },
  "skill": "AgentCreditScore",
  "agent": "0x...",
  "data": {
    "registered": true,
    "score": "758",
    "creditLimitWei": "1000000000000000000000"
  },
  "contracts": {
    "AgentCreditScore": "0x23Df05400d42122D2962C9ea60d469ba66FE3665"
  },
  "explorerUrl": "https://atlantic.pharosscan.xyz/address/0x...",
  "txHash": null,
  "message": "Human-readable summary"
}
```

### Error response schema

```json
{
  "ok": false,
  "service": "nexus-trust-agent",
  "error": "Missing required input: agent address",
  "hint": "Provide a 0x-prefixed agent wallet on Atlantic testnet",
  "exampleTasks": [
    "Return full trust stack status for an agent address",
    "Check whether a spend is allowed under SpendGuard policy"
  ]
}
```

### Supported example tasks

- Register my agent and return its credit score
- Commit and verify an intent before a large trade
- Open an x402 payment channel and sign a micropayment
- Send a private stealth payment on Pharos
- Check whether a spend is allowed under SpendGuard policy
- Return full trust stack status for an agent address

## Builder

Henry Sam Marfo · Pharos Phase 1 Winner · GitHub: `henrysammarfo/pharos-skills`

#!/usr/bin/env node
/**
 * Sync nexus-service-agent + landing from deployments.mainnet.json
 * after Pacific deploy. Applies everyday-use + $0.02 positioning.
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const depPath = existsSync("deployments.mainnet.json")
  ? "deployments.mainnet.json"
  : "nexus-service-agent/deployments.json";

if (!existsSync(depPath)) {
  console.error("Missing deployments — run npm run deploy:pacific first");
  process.exit(1);
}

const dep = JSON.parse(readFileSync(depPath, "utf8"));
const c = dep.contracts;
const explorer = dep.explorer || "https://pharosscan.xyz";
const rpc = dep.rpc || "https://rpc.pharos.xyz";
const chainId = dep.chainId || 1672;

if (!c?.AgentCreditScore || chainId !== 1672) {
  console.error("Expected Pacific mainnet deployments (chainId 1672)");
  process.exit(1);
}

writeFileSync(
  "nexus-service-agent/deployments.json",
  JSON.stringify(dep, null, 2)
);

const skillMd = `---
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

**Network:** Pharos Pacific Mainnet · chainId \`${chainId}\`  
**RPC:** \`${rpc}\`  
**Explorer:** \`${explorer}\`  
**Price:** **$0.02 per call** (x402)  
**Demo:** \`https://nexus-trust-agent.vercel.app\`  
**Repository:** \`https://github.com/henrysammarfo/pharos-skills\`

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
| Credit / full stack | \`agent\` address (0x…) |
| Intent verify | \`agent\`, \`intentId\` |
| Spend check | \`agent\`, \`recipient\`, \`amountWei\`, \`intentId\` |
| Writes | Above + explicit user confirmation |

### 3. Safe execution order (never skip for payments)

1. **AgentCreditScore** — registered? score/limit OK?
2. **IntentVerifier** — verified intent when amount is material
3. **SpendGuard** — \`canSpend\` must pass
4. **x402 or DarkPay** — execute only after 1–3

Read-only queries may stop after the relevant Skill.

### 4. On-chain contracts (Pacific Mainnet)

| Contract | Address |
|----------|---------|
| AgentCreditScore | \`${c.AgentCreditScore}\` |
| IntentVerifier | \`${c.IntentVerifier}\` |
| x402PaymentChannel | \`${c.x402PaymentChannel}\` |
| DarkPay | \`${c.DarkPay}\` |
| SpendGuard | \`${c.SpendGuard}\` |

Example credit read:

\`\`\`bash
cast call ${c.AgentCreditScore} "scores(address)" $AGENT --rpc-url ${rpc}
\`\`\`

### 5. Writes

- Confirm the user wants an on-chain transaction on Pacific Mainnet.
- Never request seed phrases or private keys.
- Prefer read-first; writes only after confirmation.

### 6. Scripts

| Script | Purpose |
|--------|---------|
| \`scripts/handler.mjs\` | Route \`{ task, agent, ... }\` to RPC |
| \`scripts/status.mjs\` | CLI full-stack status |

See \`references/contracts.md\` and \`references/flows.md\`.

## Client Interaction Flow

### Clarification

- Missing address → ask for Pacific Mainnet \`0x\` wallet.
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
- Pacific Mainnet only (chainId ${chainId})
- No keys, seeds, or \`.env\` in responses
- Price context: $0.02 per Anvita call via x402

### JSON success

\`\`\`json
{
  "ok": true,
  "service": "nexus-trust-agent",
  "network": { "name": "Pharos Pacific Mainnet", "chainId": ${chainId} },
  "skill": "AgentCreditScore",
  "agent": "0x...",
  "data": {},
  "contracts": {},
  "explorerUrl": "${explorer}/address/0x...",
  "message": "Human-readable summary"
}
\`\`\`

### Example tasks (usage magnets)

- Check if this agent is trusted enough to pay me
- Is this spend safe under my policy?
- Verify my intent before I send funds
- Show my credit score and limit on Pharos
- Send a private stealth payment
- Full trust stack status for my wallet

## Builder

Henry Sam Marfo · Pharos Phase 1 Winner · \`henrysammarfo/pharos-skills\`
`;

writeFileSync("nexus-service-agent/SKILL.md", skillMd);

const agentCard = {
  name: "NEXUS Trust Agent",
  slug: "nexus-trust-agent",
  version: "2.0.0",
  description:
    "Everyday trust checks for AI agents on Pharos Pacific Mainnet — credit, intent, safe spends, and private payments in one call.",
  author: {
    name: "Henry Sam Marfo",
    github: "https://github.com/henrysammarfo",
    repository: "https://github.com/henrysammarfo/pharos-skills",
  },
  network: {
    name: "Pharos Pacific Mainnet",
    chainId,
    rpc,
    explorer,
  },
  pricing: {
    unitPriceUsd: 0.02,
    model: "x402 per-call",
    currency: "USD",
  },
  skills: [
    {
      name: "AgentCreditScore",
      address: c.AgentCreditScore,
      role: "Trust identity and credit tiers",
    },
    {
      name: "IntentVerifier",
      address: c.IntentVerifier,
      role: "Commit-reveal and EIP-712 accountability",
    },
    {
      name: "x402PaymentChannel",
      address: c.x402PaymentChannel,
      role: "Collateral channels and signed micropayments",
    },
    {
      name: "DarkPay",
      address: c.DarkPay,
      role: "ERC-5564 stealth address payments",
    },
    {
      name: "SpendGuard",
      address: c.SpendGuard,
      role: "Custodial limits and intent-gated spending",
    },
  ],
  exampleTasks: [
    "Check if this agent is trusted enough to pay me",
    "Is this spend safe under my policy?",
    "Verify my intent before I send funds",
    "Show my credit score and limit on Pharos",
    "Send a private stealth payment",
    "Full trust stack status for my wallet",
  ],
  tags: [
    "trust",
    "credit",
    "spend-safe",
    "x402",
    "stealth",
    "everyday",
    "pharos",
    "pacific",
    "mainnet",
  ],
  demoUrl: "https://nexus-trust-agent.vercel.app",
  documentation: {
    architecture:
      "https://github.com/henrysammarfo/pharos-skills/blob/master/ARCHITECTURE.md",
    skill: "SKILL.md",
    landing: "https://nexus-trust-agent.vercel.app",
    funding: "FUNDING-MAINNET.md",
  },
};

writeFileSync(
  "nexus-service-agent/agent-card.json",
  JSON.stringify(agentCard, null, 2)
);
writeFileSync(
  "nexus-service-agent/assets/agent-card.json",
  JSON.stringify(
    {
      name: agentCard.name,
      slug: agentCard.slug,
      demoUrl: agentCard.demoUrl,
      unitPriceUsd: 0.02,
      network: "Pharos Pacific Mainnet",
      chainId,
      repository: agentCard.author.repository,
    },
    null,
    2
  )
);

const contractsMd = `# Pacific Mainnet Contract Reference

All contracts on Pharos Pacific Mainnet (chainId ${chainId}).

| Skill | Address | Explorer |
|-------|---------|----------|
| AgentCreditScore | \`${c.AgentCreditScore}\` | [view](${explorer}/address/${c.AgentCreditScore}) |
| IntentVerifier | \`${c.IntentVerifier}\` | [view](${explorer}/address/${c.IntentVerifier}) |
| x402PaymentChannel | \`${c.x402PaymentChannel}\` | [view](${explorer}/address/${c.x402PaymentChannel}) |
| DarkPay | \`${c.DarkPay}\` | [view](${explorer}/address/${c.DarkPay}) |
| SpendGuard | \`${c.SpendGuard}\` | [view](${explorer}/address/${c.SpendGuard}) |

## RPC

\`\`\`
${rpc}
\`\`\`

## Pricing

$0.02 USD per Anvita Service Agent call (x402).
`;

writeFileSync("nexus-service-agent/references/contracts.md", contractsMd);

const skillsJs = `export const SKILLS = [
  {
    id: "agentcreditscore",
    name: "AgentCreditScore",
    role: "Trust identity and credit tiers",
    address: "${c.AgentCreditScore}",
    explorer: "${explorer}/address/${c.AgentCreditScore}",
  },
  {
    id: "intentverifier",
    name: "IntentVerifier",
    role: "Commit-reveal and EIP-712 accountability",
    address: "${c.IntentVerifier}",
    explorer: "${explorer}/address/${c.IntentVerifier}",
  },
  {
    id: "x402",
    name: "x402PaymentChannel",
    role: "Collateral channels and signed micropayments",
    address: "${c.x402PaymentChannel}",
    explorer: "${explorer}/address/${c.x402PaymentChannel}",
  },
  {
    id: "darkpay",
    name: "DarkPay",
    role: "ERC-5564 stealth address payments",
    address: "${c.DarkPay}",
    explorer: "${explorer}/address/${c.DarkPay}",
  },
  {
    id: "spendguard",
    name: "SpendGuard",
    role: "Custodial limits and intent-gated spending",
    address: "${c.SpendGuard}",
    explorer: "${explorer}/address/${c.SpendGuard}",
  },
];

export const MENU_LINKS = [
  {
    label: "GitHub — See Skills",
    href: "https://github.com/henrysammarfo/pharos-skills",
  },
  {
    label: "How It Works",
    href: "https://github.com/henrysammarfo/pharos-skills/blob/master/ARCHITECTURE.md",
  },
  {
    label: "Anvita Service Agent",
    href: "https://flow.anvita.xyz/service-agents",
  },
  {
    label: "Pacific Explorer",
    href: "${explorer}",
  },
];

export const NETWORK = {
  name: "Pharos Pacific Mainnet",
  chainId: ${chainId},
  rpc: "${rpc}",
  explorer: "${explorer}",
  unitPriceUsd: 0.02,
};
`;

writeFileSync(
  "nexus-service-agent/landing/src/data/skills.js",
  skillsJs
);

const publishMd = `# Anvita Publish — NEXUS (Pacific Mainnet · $0.02)

## Agent Name *
NEXUS Trust Agent

## One-sentence introduction *
Everyday trust checks for AI agents on Pharos — credit, intent, safe spends, and private payments in one call.

## Service Capability Description *
NEXUS is an everyday trust co-pilot for autonomous agents on Pharos Pacific Mainnet (chainId ${chainId}). It composes five on-chain Skills — AgentCreditScore, IntentVerifier, x402PaymentChannel, DarkPay, and SpendGuard — so users can check if an agent is trusted, verify intents before sending funds, enforce spend policies, open micropayment channels, and send private stealth transfers.

Safe order for payments: credit check → intent verify → SpendGuard policy → then x402 or DarkPay. Read-first by default; writes only after confirmation. Never asks for seed phrases.

Contracts: AgentCreditScore \`${c.AgentCreditScore}\`, IntentVerifier \`${c.IntentVerifier}\`, x402PaymentChannel \`${c.x402PaymentChannel}\`, DarkPay \`${c.DarkPay}\`, SpendGuard \`${c.SpendGuard}\`.

Demo: https://nexus-trust-agent.vercel.app · Repo: https://github.com/henrysammarfo/pharos-skills

## Example tasks *
Check if this agent is trusted enough to pay me
Is this spend safe under my policy?
Verify my intent before I send funds
Show my credit score and limit on Pharos
Send a private stealth payment
Full trust stack status for my wallet

## Information Required from the Customer *
• Agent wallet address (0x…) on Pharos Pacific Mainnet — required
• Task type — trust check, spend safety, intent verify, credit score, stealth pay, or full stack
• For spend checks: recipient, amount (wei or PROS), intentId if needed
• For writes: explicit confirmation that the customer will sign with their own wallet

## Deliverables *
• Structured JSON with skill used, agent, data, contracts, explorer links
• Credit score / registration / limit when applicable
• SpendGuard allow/block with reason
• Intent verification result
• Full stack summary with all five Pharosscan links
• Clear next-step guidance

## Range not supported *
• Atlantic testnet-only workflows as production (this agent is Pacific Mainnet)
• Other L1/L2 networks
• Key custody, seed phrases, or unsigned magic writes
• Fiat on/off-ramp, KYC, banking
• Legal / tax / investment advice

## Estimated execution duration *
5 minute

## Unit Price per call *
0.02 (USD) — not Free

## Service Strategy
See ANVITA-SERVICE-STRATEGY.md
`;

writeFileSync("nexus-service-agent/ANVITA-PUBLISH.md", publishMd);

const strategy = `You are NEXUS Trust Agent — everyday trust co-pilot on Pharos Pacific Mainnet (chainId ${chainId}).

## Mission
Help users and Steward Agents answer daily trust questions: is this agent trusted, is this spend safe, is my intent verified, can I pay privately — using five on-chain Skills. Price: $0.02 per call.

## Network
- RPC: ${rpc}
- Explorer: ${explorer}
- Demo: https://nexus-trust-agent.vercel.app
- Repo: https://github.com/henrysammarfo/pharos-skills

## Skills & contracts
| Skill | Address | Everyday use |
|-------|---------|--------------|
| AgentCreditScore | ${c.AgentCreditScore} | Trust score & credit limit |
| IntentVerifier | ${c.IntentVerifier} | Verify before sending funds |
| x402PaymentChannel | ${c.x402PaymentChannel} | Micropayments |
| DarkPay | ${c.DarkPay} | Private stealth transfers |
| SpendGuard | ${c.SpendGuard} | Is this spend safe? |

## Routing
- Trusted / credit / score → AgentCreditScore
- Intent / before I send → IntentVerifier
- Micropay / x402 → x402PaymentChannel
- Private / stealth → DarkPay
- Safe spend / policy → SpendGuard
- Full overview → aggregate all five

## Safe order (payments)
1. Credit check 2. Intent verify if material 3. SpendGuard.canSpend 4. Pay via x402 or DarkPay

## Client rules
- Ask for 0x address if missing
- Clarify ambiguous asks into everyday tasks
- Confirm before any write; never ask for keys
- Prefer short, clear answers plus JSON

## Response format
{ ok, service: "nexus-trust-agent", skill, agent, data, contracts, explorerUrl?, txHash?, message }

## Example tasks
- Check if this agent is trusted enough to pay me
- Is this spend safe under my policy?
- Verify my intent before I send funds
- Show my credit score and limit on Pharos
- Send a private stealth payment
- Full trust stack status for my wallet
`;

writeFileSync("nexus-service-agent/ANVITA-SERVICE-STRATEGY.md", strategy);

console.log("Synced NEXUS package from", depPath);
console.log("Contracts:", c);

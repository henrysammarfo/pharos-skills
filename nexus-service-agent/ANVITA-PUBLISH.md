# Anvita Publish — NEXUS (Pacific Mainnet · $0.02)

## Agent Name *
NEXUS Trust Agent

## One-sentence introduction *
Everyday trust checks for AI agents on Pharos — credit, intent, safe spends, and private payments in one call.

## Service Capability Description *
NEXUS is an everyday trust co-pilot for autonomous agents on Pharos Pacific Mainnet (chainId 1672). It composes five on-chain Skills — AgentCreditScore, IntentVerifier, x402PaymentChannel, DarkPay, and SpendGuard — so users can check if an agent is trusted, verify intents before sending funds, enforce spend policies, open micropayment channels, and send private stealth transfers.

Safe order for payments: credit check → intent verify → SpendGuard policy → then x402 or DarkPay. Read-first by default; writes only after confirmation. Never asks for seed phrases.

Contracts: AgentCreditScore `0xA3399056b2CD7b404d0e99020b0ECBB8F40dc5F7`, IntentVerifier `0x591Fc32E84fd66e335dC1509d09A09af156df355`, x402PaymentChannel `0x4cfD9F5cfEA425e8A533a7679559825464121b83`, DarkPay `0x58Bd7bafD2390fD6661A44D104f5296973804793`, SpendGuard `0x25DA2D8AC4b14B575930029d105a583AE6630bC8`.

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

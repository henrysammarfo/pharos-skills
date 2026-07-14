# NEXUS Composability Flows

Full mermaid: https://github.com/henrysammarfo/pharos-skills/blob/master/ARCHITECTURE.md

## Everyday: "Is this spend safe?"

1. Gather agent, recipient, amount, intentId
2. AgentCreditScore — registered? score/limit OK?
3. IntentVerifier — verified if amount is material
4. SpendGuard — `canSpend` must return true
5. x402 or DarkPay — execute only after 1–4
6. Return JSON + Pharosscan links

## Everyday: "Is this agent trusted?"

1. Gather agent address
2. `isRegistered` + `scores` + `getCreditLimit`
3. Return score, limit, explorer link

## Full stack status

1. Gather agent address
2. Parallel reads across all five contracts
3. Aggregate into one JSON response

## Pricing

$0.02 USD per Anvita call (x402 settlement).

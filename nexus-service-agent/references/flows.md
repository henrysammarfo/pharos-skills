# NEXUS Composability Flows

Full mermaid diagrams: https://github.com/henrysammarfo/pharos-skills/blob/master/ARCHITECTURE.md

## Safe spend flow

1. Client requests spend → NEXUS gathers agent, recipient, amount, intentId
2. AgentCreditScore → registered? score/limit OK?
3. IntentVerifier → verified intent if over threshold?
4. SpendGuard → `canSpend` returns true?
5. x402 or DarkPay → execute payment
6. Return tx hash + explorer link

## Credit-only flow

1. Client asks for score → gather agent address
2. `scores` + `getCreditLimit` + `isRegistered` via RPC
3. Return JSON with contract addresses and human summary

## Full stack status

1. Client asks for overview → gather agent address
2. Parallel read calls across all five contracts
3. Aggregate into single JSON `data` object

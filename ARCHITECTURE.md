# Pharos Trust Stack — Architecture

Five composable on-chain Skills for the Pharos AI Agent economy (Atlantic Testnet, chain `688689`).

## System diagram

```mermaid
flowchart TB
    subgraph agents [AI Agents]
        A[Agent Wallet]
    end

    subgraph safety [Safety Layer]
        SG[SpendGuard]
    end

    subgraph trust [Trust Layer]
        IV[IntentVerifier]
        ACS[AgentCreditScore]
    end

    subgraph payments [Payment Layer]
        X402[x402PaymentChannel]
        DP[DarkPay]
    end

    subgraph offchain [Off-Chain]
        MCP[MCP Server - 38 tools]
        SDK[JavaScript SDK]
        HTTP[x402 HTTP Middleware]
        CAST[Foundry cast / forge test]
    end

    A --> SG
    A --> IV
    IV --> ACS
    X402 --> ACS
    SG --> ACS
    SG --> IV
    A --> X402
    A --> DP
    MCP --> SDK
    SDK --> ACS & IV & X402 & SG & DP
    HTTP --> X402
    CAST --> ACS & IV & X402 & SG & DP
```

## Composability overview

```mermaid
flowchart LR
    SG[SpendGuard] -->|min score| ACS[AgentCreditScore]
    SG -->|large spend gate| IV[IntentVerifier]
    IV -->|verified intent| ACS
    X402[x402PaymentChannel] -->|record action + repayment| ACS
    DP[DarkPay]
    A[Agent] --> SG & IV & X402 & DP
```

## Skill responsibilities

| Skill | On-chain role | Agent problem solved |
|-------|---------------|----------------------|
| **AgentCreditScore** | Soulbound NFT + score 0–1000 + credit tiers | Who is this agent? How much trust? |
| **IntentVerifier** | Commit-reveal (legacy + EIP-712) | Did the agent commit before acting? |
| **x402PaymentChannel** | Collateral channel + signed micropayments | Pay per API call without gas each time |
| **DarkPay** | Stealth addresses + announcements | Pay receiver without linking identity |
| **SpendGuard** | Custody + limits + whitelist + intent gate | Stop runaway agent spending |

## Data flows

### 1. Trust bootstrap

```mermaid
sequenceDiagram
    participant Agent
    participant ACS as AgentCreditScore
    participant IV as IntentVerifier

    Agent->>ACS: registerAgent()
    ACS-->>Agent: mint soulbound NFT
    Agent->>IV: commitIntent(hash)
    Agent->>IV: revealIntent(...)
    IV->>ACS: recordVerifiedIntent(agent)
    Agent->>ACS: computeScore(agent)
    ACS-->>Agent: score + getCreditLimit()
```

### 2. Guarded spend

```mermaid
sequenceDiagram
    participant Controller
    participant Agent
    participant SG as SpendGuard
    participant IV as IntentVerifier
    participant ACS as AgentCreditScore

    Controller->>SG: createPolicy() + setWhitelist()
    Agent->>SG: deposit{value}()
    opt Large spend
        Agent->>IV: commitIntent() + revealIntent()
        IV->>ACS: recordVerifiedIntent()
    end
    Agent->>SG: guardedSpend(to, amount, intentId)
    SG->>ACS: isRegistered + minScore check
    SG->>IV: isVerifiedIntent (if large)
    SG-->>Agent: transfer to recipient
```

### 3. Micropayment channel (x402)

```mermaid
sequenceDiagram
    participant Agent
    participant X402 as x402PaymentChannel
    participant Provider
    participant ACS as AgentCreditScore

    Agent->>X402: openChannel{value}(provider, duration)
    X402-->>Agent: channelId
    Note over Agent,Provider: Off-chain signed payment messages
    Agent->>Agent: sign(channelId, amount, nonce)
    Provider->>X402: settlePayment(channelId, amount, nonce, sig)
    X402->>ACS: recordSuccessfulAction + recordRepayment
    Agent->>X402: closeChannel(channelId)
    X402-->>Agent: refund unused collateral
```

### 4. Stealth payment (DarkPay)

```mermaid
sequenceDiagram
    participant Receiver
    participant Sender
    participant DP as DarkPay
    participant SDK as DarkPaySDK

    Receiver->>DP: registerStealthMetaAddress(spendPub, viewPub)
    Sender->>SDK: computeStealthAddress(viewPub, spendPub)
    SDK-->>Sender: stealthAddress + ephemeralPubKey + viewTag
    Sender->>DP: sendNativeStealth{value}(stealth, ephPub, viewTag)
    DP-->>Receiver: announcement indexed on-chain
    Receiver->>SDK: scanAnnouncements + deriveStealthPrivKey()
    SDK-->>Receiver: stealth private key to claim funds
```

## Repository layout

```
pharos-skills/
├── src/                    # Solidity (5 contracts + interfaces/)
├── test/PharosSkills.t.sol # Forge: smoke, fuzz, stress, security
├── test/skills.test.js     # Hardhat integration
├── skills/<name>/          # Per-skill README + SKILL.md (BUIDL entry point)
├── sdk/                    # JavaScript SDK (all skills)
├── mcp-server/             # MCP tools for judge agents
├── x402-http/              # HTTP 402 Payment Required (Pharos x402 docs)
├── scripts/                # deploy, integrate, verify, judge readiness, test:sdk/mcp
└── deployments.example.json
```

## Security model

- `ReentrancyGuard` on all payable paths
- `Address.sendValue` (no `.transfer()`)
- `onlySkill` / `onlyRegisteredAgent` on ACS mutations
- Custom errors (no string reverts)
- IntentVerifier `penalized` flag (no double penalty)
- SpendGuard policy simulation via `canSpend()` before execution

See [`SECURITY.md`](SECURITY.md).

## Judge / agent testing

```mermaid
flowchart TD
    A[git clone + setup.ps1 / setup.sh] --> B[forge test + npm test]
    B --> C{Wallet funded?}
    C -->|No| D[npm run judge:readiness]
    C -->|Yes| E[npm run test:agent]
    D --> F[cast from skills/*/SKILL.md]
    E --> G[MCP 38 tools via mcp-config]
    F --> H[Live Atlantic contracts]
    G --> H
```

1. Clone repo → `./setup.sh` or `.\setup.ps1`
2. `npm run test:all` — full local suite (Forge + Hardhat)
3. `npm run judge:readiness` — read-only Atlantic contract calls (no wallet)
4. `npm run test:agent` — SDK + MCP wallet write suites (requires funded `wallet.json`)
5. `cast` commands in each `skills/*/SKILL.md` — Foundry judge path
6. `npm run mcp` — wire MCP config to your agent

All five contracts **verified** on [Pharosscan Atlantic](https://atlantic.pharosscan.xyz/).

## Phase 2 (NEXUS)

All five Skills compose into **NEXUS** — a credit-enabled, accountable, private, spend-safe autonomous agent on Pharos.

# Anvita Console — NEXUS Trust Agent (Pacific Mainnet)

**Console:** https://flow.anvita.xyz/service-agents  
**Demo:** https://nexus-trust-agent.vercel.app  
**Price:** **$0.02 / call** (not Free)

## Upload package

```powershell
cd C:\Users\RICHEY_SON\pharos-skills
npm run nexus:package
```

Zip: `nexus-service-agent/dist/nexus-trust-agent-anvita.zip`  
Layout: `nexus-trust-agent/SKILL.md` + scripts/references/assets

## Publish fields

Copy from [`ANVITA-PUBLISH.md`](./ANVITA-PUBLISH.md) and [`ANVITA-SERVICE-STRATEGY.md`](./ANVITA-SERVICE-STRATEGY.md).

| Field | Value |
|-------|-------|
| **Name** | NEXUS Trust Agent |
| **Unit price** | **0.02** USD |
| **Network** | Pharos Pacific Mainnet (1672) |
| **Demo** | https://nexus-trust-agent.vercel.app |
| **Repo** | https://github.com/henrysammarfo/pharos-skills |

## Pacific contracts

| Skill | Address |
|-------|---------|
| AgentCreditScore | `0xA3399056b2CD7b404d0e99020b0ECBB8F40dc5F7` |
| IntentVerifier | `0x591Fc32E84fd66e335dC1509d09A09af156df355` |
| x402PaymentChannel | `0x4cfD9F5cfEA425e8A533a7679559825464121b83` |
| DarkPay | `0x58Bd7bafD2390fD6661A44D104f5296973804793` |
| SpendGuard | `0x25DA2D8AC4b14B575930029d105a583AE6630bC8` |

## Debug (after re-upload)

```
Full trust stack status for agent 0x4BC1C93eF8E77E9aD9A045d7Fd760bcd500F7B00
```

## Checklist

- [ ] Upload new zip (mainnet SKILL.md)
- [ ] Set Unit Price = **0.02** (not Free)
- [ ] Paste Service Strategy from ANVITA-SERVICE-STRATEGY.md
- [ ] Fill Agent Card from ANVITA-PUBLISH.md
- [ ] Re-debug once on mainnet
- [ ] Publish when Carnival rules allow

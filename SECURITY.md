# Security

## Audit status

These contracts have **not** undergone a professional third-party audit. No codebase can be guaranteed "unhackable." This document describes mitigations applied and known residual risks.

## Mitigations implemented

| Area | Control |
|------|---------|
| Reentrancy | `ReentrancyGuard` on all payable flows (x402, DarkPay) |
| Payments | `Address.sendValue` instead of `.transfer()` |
| Access control | `onlySkill` + `onlyRegisteredAgent` on score updates |
| Soulbound NFT | Transfer blocked in `_update` override |
| Intent penalize | `penalized` flag prevents double-penalty exploit |
| Channel replay | Strict nonce monotonic increase |
| Collateral | `usedAmount + amount <= collateral` enforced |
| Input validation | Custom errors on zero addresses, invalid key lengths |
| Testing | Forge unit + fuzz + integration stress tests |
| CI | GitHub Actions compile + test on every push |

## Known residual risks

1. **IntentVerifier strings on-chain** — `reasoning` stored as string is gas-heavy; consider IPFS hash in production v2.
2. **DarkPay announcement spam** — Anyone can emit announcements (EIP-5564 DoS vector); mitigated off-chain by view-tag filtering.
3. **Owner centralization** — `addSkill`/`removeSkill` controlled by deployer; use multisig for mainnet.
4. **x402 channel ID collision** — Theoretical hash collision on `keccak256(agent, provider, block, value)`; negligible at 256-bit.
5. **No formal verification** — Recommend Certora/Trail of Bits audit before mainnet.

## Bug bounty

Report issues to: henrysammarfo via GitHub Issues on this repository.

## Deployed contracts (v1 — pre-hardening)

Atlantic addresses in `deployments.json` reflect the initial deploy. **Redeploy v2** after security hardening for production use.

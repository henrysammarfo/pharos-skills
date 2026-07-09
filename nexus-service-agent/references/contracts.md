# Atlantic Contract Reference

All contracts verified on Pharosscan (Atlantic Testnet, chainId 688689).

| Skill | Address | Explorer |
|-------|---------|----------|
| AgentCreditScore | `0x23Df05400d42122D2962C9ea60d469ba66FE3665` | [view](https://atlantic.pharosscan.xyz/address/0x23Df05400d42122D2962C9ea60d469ba66FE3665) |
| IntentVerifier | `0x9cC1A13782574c83f15c874551997Dc3cE3b15DF` | [view](https://atlantic.pharosscan.xyz/address/0x9cC1A13782574c83f15c874551997Dc3cE3b15DF) |
| x402PaymentChannel | `0xE16B0109D20C0f1977Dd821d285dd479Af0a9187` | [view](https://atlantic.pharosscan.xyz/address/0xE16B0109D20C0f1977Dd821d285dd479Af0a9187) |
| DarkPay | `0xF028782C1e4E3BdB19d31A31Db713d185a07b328` | [view](https://atlantic.pharosscan.xyz/address/0xF028782C1e4E3BdB19d31A31Db713d185a07b328) |
| SpendGuard | `0x8395ada307Aa80C9F66A754fCC2CA01E63F9BB85` | [view](https://atlantic.pharosscan.xyz/address/0x8395ada307Aa80C9F66A754fCC2CA01E63F9BB85) |

## RPC

```
https://atlantic.dplabs-internal.com
```

## Key read selectors

```
scores(address)
getCreditLimit(address)
isRegistered(address)
isVerifiedIntent(address,uint256)
canSpend(address,address,uint256,uint256)
```

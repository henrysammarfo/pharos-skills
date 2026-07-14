export const SKILLS = [
  {
    id: "agentcreditscore",
    name: "AgentCreditScore",
    role: "Is this agent trusted? Score + limit.",
    address: "0xA3399056b2CD7b404d0e99020b0ECBB8F40dc5F7",
    explorer: "https://pharosscan.xyz/address/0xA3399056b2CD7b404d0e99020b0ECBB8F40dc5F7",
  },
  {
    id: "intentverifier",
    name: "IntentVerifier",
    role: "Is my intent verified before I send?",
    address: "0x591Fc32E84fd66e335dC1509d09A09af156df355",
    explorer: "https://pharosscan.xyz/address/0x591Fc32E84fd66e335dC1509d09A09af156df355",
  },
  {
    id: "x402",
    name: "x402PaymentChannel",
    role: "Micropayment channels when you need them.",
    address: "0x4cfD9F5cfEA425e8A533a7679559825464121b83",
    explorer: "https://pharosscan.xyz/address/0x4cfD9F5cfEA425e8A533a7679559825464121b83",
  },
  {
    id: "darkpay",
    name: "DarkPay",
    role: "Can I pay privately?",
    address: "0x58Bd7bafD2390fD6661A44D104f5296973804793",
    explorer: "https://pharosscan.xyz/address/0x58Bd7bafD2390fD6661A44D104f5296973804793",
  },
  {
    id: "spendguard",
    name: "SpendGuard",
    role: "Is this spend safe under my policy?",
    address: "0x25DA2D8AC4b14B575930029d105a583AE6630bC8",
    explorer: "https://pharosscan.xyz/address/0x25DA2D8AC4b14B575930029d105a583AE6630bC8",
  },
];

export const MENU_LINKS = [
  {
    label: "Call on Anvita (Free)",
    href: "https://flow.anvita.xyz/agent/chat",
  },
  {
    label: "GitHub",
    href: "https://github.com/henrysammarfo/pharos-skills",
  },
  {
    label: "How It Works",
    href: "https://github.com/henrysammarfo/pharos-skills/blob/master/ARCHITECTURE.md",
  },
  {
    label: "Pacific Explorer",
    href: "https://pharosscan.xyz",
  },
];

export const NETWORK = {
  name: "Pharos Pacific Mainnet",
  chainId: 1672,
  rpc: "https://rpc.pharos.xyz",
  explorer: "https://pharosscan.xyz",
  free: true,
  unitPriceUsd: 0,
  anvitaChat: "https://flow.anvita.xyz/agent/chat",
  askPrompts: [
    "Is this spend safe under my policy?",
    "Check if this agent is trusted enough to pay me",
    "Show my credit score on Pharos",
    "Full trust stack status for my wallet",
  ],
};

#!/usr/bin/env node
/**
 * Smoke-test Pacific mainnet Trust Stack (read + optional register).
 * Usage: node scripts/smoke-pacific.mjs [--register]
 */
import { readFileSync, existsSync } from "fs";
import { Contract, JsonRpcProvider, Wallet, formatEther } from "ethers";

const depPath = existsSync("deployments.mainnet.json")
  ? "deployments.mainnet.json"
  : "nexus-service-agent/deployments.json";
const dep = JSON.parse(readFileSync(depPath, "utf8"));
const RPC = process.env.RPC_URL || dep.rpc || "https://rpc.pharos.xyz";
const CHAIN_ID = dep.chainId || 1672;
const doRegister = process.argv.includes("--register");

const ACS_ABI = [
  "function scores(address) view returns (uint256)",
  "function getCreditLimit(address) view returns (uint256)",
  "function isRegistered(address) view returns (bool)",
  "function registerAgent()",
];
const IV_ABI = [
  "function isVerifiedIntent(address,uint256) view returns (bool)",
];
const SG_ABI = [
  "function canSpend(address,address,uint256,uint256) view returns (bool,bytes32)",
];

function loadWallet(provider) {
  if (process.env.PRIVATE_KEY) return new Wallet(process.env.PRIVATE_KEY, provider);
  if (existsSync("wallet.mainnet.json")) {
    const w = JSON.parse(readFileSync("wallet.mainnet.json", "utf8"));
    return new Wallet(w.privateKey, provider);
  }
  return null;
}

const provider = new JsonRpcProvider(RPC, CHAIN_ID, { staticNetwork: true });
const wallet = loadWallet(provider);
const agent = wallet?.address || dep.deployer;
const c = dep.contracts;

const acs = new Contract(c.AgentCreditScore, ACS_ABI, wallet || provider);
const iv = new Contract(c.IntentVerifier, IV_ABI, provider);
const sg = new Contract(c.SpendGuard, SG_ABI, provider);

console.log("Smoke Pacific:", { agent, chainId: CHAIN_ID, rpc: RPC });

if (doRegister && wallet) {
  const registered = await acs.isRegistered(agent);
  if (!registered) {
    console.log("Registering agent...");
    const tx = await acs.registerAgent({ gasLimit: 300_000n });
    await tx.wait();
    console.log("Registered:", tx.hash);
  } else {
    console.log("Already registered");
  }
}

const [score, limit, registered] = await Promise.all([
  acs.scores(agent),
  acs.getCreditLimit(agent),
  acs.isRegistered(agent),
]);
const verified = await iv.isVerifiedIntent(agent, 1);
const [allowed, reason] = await sg.canSpend(
  agent,
  "0x0000000000000000000000000000000000000001",
  1n,
  0n
);

const out = {
  ok: true,
  network: dep.network,
  agent,
  credit: {
    registered,
    score: score.toString(),
    creditLimitWei: limit.toString(),
    creditLimitEth: formatEther(limit),
  },
  intent1Verified: verified,
  spendSample: { allowed, reason },
  contracts: c,
  explorer: dep.explorer,
};
console.log(JSON.stringify(out, null, 2));

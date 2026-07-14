#!/usr/bin/env node
/** Seed SpendGuard policy on Pacific for deployer agent so debug reads look healthy */
import { readFileSync, existsSync } from "fs";
import { Contract, JsonRpcProvider, Wallet, parseEther } from "ethers";

const dep = JSON.parse(
  readFileSync(
    existsSync("deployments.mainnet.json")
      ? "deployments.mainnet.json"
      : "nexus-service-agent/deployments.json",
    "utf8"
  )
);
const w = JSON.parse(readFileSync("wallet.mainnet.json", "utf8"));
const provider = new JsonRpcProvider(dep.rpc, dep.chainId, { staticNetwork: true });
const wallet = new Wallet(w.privateKey, provider);
const agent = wallet.address;
const recipient = "0x0000000000000000000000000000000000000001";

const SG_ABI = [
  "function createPolicy(address,uint256,uint256,uint256,uint256,bool)",
  "function setWhitelist(address,address,bool)",
  "function canSpend(address,address,uint256,uint256) view returns (bool,bytes32)",
  "function policies(address) view returns (address controller,uint256 dailyLimit,uint256 perTxLimit,uint256 minScore,uint256 spentToday,uint256 lastDay,uint256 largeSpendThreshold,bool requireIntentForLarge,bool active)",
];

const sg = new Contract(dep.contracts.SpendGuard, SG_ABI, wallet);

console.log("Creating SpendGuard policy for", agent);
const tx1 = await sg.createPolicy(
  agent,
  parseEther("100"), // daily
  parseEther("10"), // perTx
  0, // minScore (fresh agent score 0)
  parseEther("5"), // large threshold
  true, // require intent for large
  { gasLimit: 400_000n }
);
await tx1.wait();
console.log("policy tx:", tx1.hash);

const tx2 = await sg.setWhitelist(agent, recipient, true, { gasLimit: 200_000n });
await tx2.wait();
console.log("whitelist tx:", tx2.hash);

const [ok, reason] = await sg.canSpend(agent, recipient, parseEther("0.01"), 0);
const policy = await sg.policies(agent);
console.log(
  JSON.stringify(
    {
      canSpendSmall: { ok, reason },
      policyActive: policy.active,
      dailyLimit: policy.dailyLimit.toString(),
      perTxLimit: policy.perTxLimit.toString(),
    },
    null,
    2
  )
);

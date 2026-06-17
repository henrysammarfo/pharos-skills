#!/usr/bin/env node
/**
 * Verify all contracts on Pharosscan (Atlantic).
 * Usage: PHAROSCAN_API_KEY=your_key npm run verify:atlantic
 */
import { readFileSync, existsSync } from "fs";
import { execSync } from "child_process";

const dep = JSON.parse(readFileSync(
  existsSync("deployments.json") ? "deployments.json" : "deployments.example.json",
  "utf8"
));

const apiKey = process.env.PHAROSCAN_API_KEY;
if (!apiKey) {
  console.error("Set PHAROSCAN_API_KEY (Etherscan V2 compatible key for Pharosscan)");
  process.exit(1);
}

const chain = "atlantic";
const contracts = [
  { name: "AgentCreditScore", args: [] },
  { name: "IntentVerifier", args: [dep.contracts.AgentCreditScore] },
  { name: "x402PaymentChannel", args: [dep.contracts.AgentCreditScore] },
  { name: "DarkPay", args: [] },
  { name: "SpendGuard", args: [dep.contracts.AgentCreditScore] },
];

for (const c of contracts) {
  const addr = dep.contracts[c.name];
  const args = c.args.join(" ");
  console.log(`Verifying ${c.name} at ${addr}...`);
  execSync(
    `forge verify-contract ${addr} src/${c.name}.sol:${c.name} ${args} --chain ${chain} --etherscan-api-key ${apiKey} --watch`,
    { stdio: "inherit", env: { ...process.env, ETHERSCAN_API_KEY: apiKey } }
  );
}

console.log("All contracts verified.");

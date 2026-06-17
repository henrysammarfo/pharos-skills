#!/usr/bin/env node
/**
 * Verify all contracts on Atlantic via SocialScan (Pharosscan backend).
 * Usage: SOCIALSCAN_API_KEY=your_key npm run verify:atlantic
 */
import { readFileSync, existsSync } from "fs";
import { execSync } from "child_process";

const dep = JSON.parse(
  readFileSync(
    existsSync("deployments.json") ? "deployments.json" : "deployments.example.json",
    "utf8"
  )
);

const apiKey =
  process.env.SOCIALSCAN_API_KEY || process.env.PHAROSCAN_API_KEY;
if (!apiKey) {
  console.error("Set SOCIALSCAN_API_KEY (from https://socialscan.io)");
  process.exit(1);
}

const contracts = [
  { name: "AgentCreditScore", args: [] },
  {
    name: "IntentVerifier",
    args: [dep.contracts.AgentCreditScore],
  },
  {
    name: "x402PaymentChannel",
    args: [dep.contracts.AgentCreditScore],
  },
  { name: "DarkPay", args: [] },
  {
    name: "SpendGuard",
    args: [dep.contracts.AgentCreditScore],
  },
];

execSync("npx hardhat compile", {
  stdio: "inherit",
  env: { ...process.env, SOCIALSCAN_API_KEY: apiKey, PHAROSCAN_API_KEY: apiKey },
});

for (const c of contracts) {
  const addr = dep.contracts[c.name];
  const argStr = c.args.length ? ` ${c.args.join(" ")}` : "";
  console.log(`\nVerifying ${c.name} at ${addr}...`);
  execSync(`npx hardhat verify --network atlantic ${addr}${argStr}`, {
    stdio: "inherit",
    env: { ...process.env, SOCIALSCAN_API_KEY: apiKey, PHAROSCAN_API_KEY: apiKey },
  });
}

console.log("\nAll contracts verified.");

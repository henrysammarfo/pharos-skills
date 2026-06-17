#!/usr/bin/env node
/** Sync deployments.example.json contract addresses into all skills/*/SKILL.md */
import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join } from "path";

const dep = JSON.parse(readFileSync("deployments.example.json", "utf8"));
const c = dep.contracts;

const replacements = [
  [/0x[a-fA-F0-9]{40}/g, null],
];

const skillDirs = readdirSync("skills", { withFileTypes: true }).filter((d) => d.isDirectory());
const mapping = {
  agentcreditscore: c.AgentCreditScore,
  intentverifier: c.IntentVerifier,
  "x402-payment-channel": c.x402PaymentChannel,
  darkpay: c.DarkPay,
  spendguard: c.SpendGuard,
};

for (const dir of skillDirs) {
  const skillPath = join("skills", dir.name, "SKILL.md");
  let text = readFileSync(skillPath, "utf8");
  const addr = mapping[dir.name];
  if (addr) {
    text = text.replace(/0x[a-fA-F0-9]{40}/g, (match, offset) => {
      const line = text.slice(Math.max(0, text.lastIndexOf("\n", offset)), text.indexOf("\n", offset));
      if (line.toLowerCase().includes("explorer") || line.includes("tx:")) return match;
      return addr;
    });
    if (dir.name === "spendguard") {
      text = text.replace(
        /SpendGuard: see `deployments\.example\.json` in repo root after deploy\./,
        `SpendGuard: \`${addr}\``
      );
    }
    writeFileSync(skillPath, text);
    console.log("Updated", skillPath);
  }
}

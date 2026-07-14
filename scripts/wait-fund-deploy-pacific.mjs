#!/usr/bin/env node
/**
 * Poll until Pacific deployer has PROS, then deploy → smoke → sync → package.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const INTERVAL_MS = 30_000;

function run(cmd, args, opts = {}) {
  console.log(`\n> ${cmd} ${args.join(" ")}`);
  const r = spawnSync(cmd, args, {
    stdio: "inherit",
    shell: true,
    ...opts,
  });
  if (r.status !== 0) {
    throw new Error(`Command failed: ${cmd} ${args.join(" ")}`);
  }
}

console.log("Waiting for PROS on Pacific deployer...");
console.log("Address: 0x4BC1C93eF8E77E9aD9A045d7Fd760bcd500F7B00");
console.log("Fund via https://port.pharos.xyz then this script continues automatically.\n");

for (;;) {
  const bal = spawnSync("npm", ["run", "balance:pacific"], {
    encoding: "utf8",
    shell: true,
  });
  process.stdout.write(bal.stdout || "");
  if (bal.status === 0) {
    console.log("\nFunded — starting deploy pipeline...");
    break;
  }
  await new Promise((r) => setTimeout(r, INTERVAL_MS));
}

run("npm", ["run", "compile"]);
run("npm", ["run", "deploy:pacific"]);
run("npm", ["run", "smoke:pacific", "--", "--register"]);
run("npm", ["run", "nexus:sync"]);
run("npm", ["run", "nexus:package"]);
run("npm", ["run", "nexus:landing:build"]);

console.log("\nPipeline complete.");
console.log("Next: vercel --prod in nexus-service-agent/landing");
console.log("Publish paste: nexus-service-agent/ANVITA-PUBLISH.md");
if (existsSync("deployments.mainnet.json")) {
  console.log("Deployments: deployments.mainnet.json");
}

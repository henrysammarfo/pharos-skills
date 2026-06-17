#!/usr/bin/env node
/**
 * MCP test suite — stdio protocol + tool calls.
 * Usage: node scripts/test-mcp.mjs [--wallet]
 */
import { spawn } from "child_process";
import { resolve } from "path";
import { existsSync } from "fs";
import { createChecker, wantsWallet, walletRequiredMessage } from "./test-helpers.mjs";
import { loadDeploymentsFile } from "../sdk/index.js";

const dep = loadDeploymentsFile();
const deployer = dep.deployer;
const requireWallet = wantsWallet(process.argv);
const hasWallet = existsSync("wallet.json") || !!process.env.PRIVATE_KEY;

class McpClient {
  constructor() {
    this.cwd = resolve(process.cwd());
    this.child = spawn("node", ["mcp-server/index.js"], {
      cwd: this.cwd,
      stdio: ["pipe", "pipe", "inherit"],
      env: { ...process.env, DEPLOYMENTS_PATH: "deployments.example.json" },
    });
    this.buf = "";
    this.nextId = 1;
    this.pending = new Map();
    this.child.stdout.on("data", (chunk) => this._onData(chunk));
  }

  _onData(chunk) {
    this.buf += chunk.toString();
    const lines = this.buf.split("\n");
    this.buf = lines.pop() || "";
    for (const line of lines) {
      if (!line.trim()) continue;
      const msg = JSON.parse(line);
      if (msg.id !== undefined && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message || JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
    }
  }

  request(method, params) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
    });
  }

  async initialize() {
    await this.request("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "test-mcp", version: "1.0" },
    });
    this.child.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
  }

  async listTools() {
    const result = await this.request("tools/list", {});
    return result.tools;
  }

  async callTool(name, args = {}) {
    const result = await this.request("tools/call", { name, arguments: args });
    const text = result.content?.[0]?.text;
    if (result.isError) throw new Error(text || "tool error");
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  close() {
    this.child.kill();
  }
}

const { check, summary } = createChecker();
const client = new McpClient();

console.log("=== MCP PROTOCOL TESTS ===\n");

await client.initialize();
const tools = await check("tools/list", async () => {
  const list = await client.listTools();
  if (list.length < 35) throw new Error(`Expected >=35 tools, got ${list.length}`);
  return { count: list.length, names: list.map((t) => t.name) };
});

console.log("\n=== MCP READ TOOL TESTS ===\n");

await check("contracts_info", async () => client.callTool("contracts_info"));
await check("agent_credit_get_score", async () =>
  client.callTool("agent_credit_get_score", { agent: deployer })
);
await check("agent_credit_is_registered", async () =>
  client.callTool("agent_credit_is_registered", { agent: deployer })
);
await check("intent_compute_hash", async () =>
  client.callTool("intent_compute_hash", {
    actionType: "MCP",
    reasoning: "test",
    expectedOutcome: "0x0000000000000000000000000000000000000000000000000000000000000001",
    nonce: 7,
  })
);
await check("intent_is_verified", async () =>
  client.callTool("intent_is_verified", { agent: deployer, intentId: 0 })
);
await check("x402_payment_message", async () =>
  client.callTool("x402_payment_message", {
    channelId: "0x0000000000000000000000000000000000000000000000000000000000000001",
    amount: "1000",
    nonce: 1,
  })
);
await check("spendguard_get_policy", async () =>
  client.callTool("spendguard_get_policy", { agent: deployer })
);
await check("darkpay_announcement_count", async () => client.callTool("darkpay_announcement_count"));
await check("darkpay_generate_meta_address", async () => client.callTool("darkpay_generate_meta_address"));

const readResult = summary("MCP read checks passed");
if (readResult.ok !== readResult.total) {
  client.close();
  process.exit(1);
}

if (!hasWallet) {
  if (requireWallet) {
    console.error(`\nERROR: ${walletRequiredMessage()}`);
    client.close();
    process.exit(1);
  }
  console.log("\nSKIP MCP wallet write tests (no wallet.json). Run with --wallet to require.");
  client.close();
  process.exit(0);
}

console.log("\n=== MCP WALLET WRITE TOOL TESTS ===\n");

try {
  await check("agent_credit_register", async () => {
    const result = await client.callTool("agent_credit_register");
    if (result.skipped || result.txHash) return result;
    throw new Error("unexpected register response");
  });

  const actionType = "MCP_TEST";
  const reasoning = "mcp wallet automated test";
  const expectedOutcome = "0x00000000000000000000000000000000000000000000000000000000000000cd";
  const nonce = Math.floor(Date.now() % 1_000_000);
  const { hash } = await client.callTool("intent_compute_hash", {
    actionType,
    reasoning,
    expectedOutcome,
    nonce,
  });
  await check("intent_commit", async () => client.callTool("intent_commit", { hash }));

  const e2e = await check("x402_open_channel_e2e", async () =>
    client.callTool("x402_open_channel_e2e", { collateralEth: "0.005", providerFundEth: "0.01" })
  );

  const { signature } = await check("x402_sign_payment", async () =>
    client.callTool("x402_sign_payment", {
      channelId: e2e.channelId,
      amount: "100000000000000",
      nonce: 1,
    })
  );

  await check("x402_settle_payment", async () =>
    client.callTool("x402_settle_payment", {
      channelId: e2e.channelId,
      amount: "100000000000000",
      nonce: 1,
      signature,
      providerPrivateKey: e2e.providerPrivateKey,
    })
  );

  await check("x402_close_channel", async () =>
    client.callTool("x402_close_channel", { channelId: e2e.channelId })
  );

  const keys = await client.callTool("darkpay_generate_meta_address");
  const stealth = await client.callTool("darkpay_compute_stealth_address", {
    viewingPubKeyHex: keys.viewingPubKey,
    spendingPubKeyHex: keys.spendingPubKey,
  });

  await check("darkpay_register_meta_address", async () =>
    client.callTool("darkpay_register_meta_address", {
      spendingPubKeyHex: keys.spendingPubKey,
      viewingPubKeyHex: keys.viewingPubKey,
    })
  );

  await check("darkpay_send_native_stealth", async () =>
    client.callTool("darkpay_send_native_stealth", {
      stealthAddress: stealth.stealthAddress,
      ephemeralPubKeyHex: stealth.ephemeralPubKey,
      viewTagHex: stealth.viewTag,
      amountEth: "0.0001",
    })
  );

  await check("darkpay_scan_announcements", async () => {
    const matches = await client.callTool("darkpay_scan_announcements", {
      fromBlock: 0,
      viewingPrivKeyHex: keys.viewingPrivKey,
      spendingPubKeyHex: keys.spendingPubKey,
      spendingPrivKeyHex: keys.spendingPrivKey,
    });
    if (!matches.length) throw new Error("No stealth matches");
    return { matches: matches.length };
  });
} catch (e) {
  console.error("MCP wallet suite aborted:", e.message);
  client.close();
  process.exit(1);
}

const writeResult = summary("MCP wallet write checks passed");
client.close();
process.exit(writeResult.ok === writeResult.total ? 0 : 1);

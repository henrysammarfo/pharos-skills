#!/usr/bin/env node
/**
 * MCP server — all 5 Pharos Skills tools for judge/agent testing.
 * Uses deployments.example.json when wallet.json is absent (read-only tools still work).
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { existsSync, readFileSync } from "fs";
import { JsonRpcProvider, Wallet } from "ethers";
import {
  AgentCreditScoreSDK,
  IntentVerifierSDK,
  X402PaymentChannelSDK,
  SpendGuardSDK,
  DarkPaySDK,
  loadDeploymentsFile,
  RPC,
  CHAIN_ID,
} from "../sdk/index.js";

const dep = loadDeploymentsFile();
const provider = new JsonRpcProvider(RPC, CHAIN_ID, { staticNetwork: true });
const signer = existsSync("wallet.json")
  ? new Wallet(JSON.parse(readFileSync("wallet.json", "utf8")).privateKey, provider)
  : null;

const acs = new AgentCreditScoreSDK(signer || provider);
const iv = new IntentVerifierSDK(signer || provider);
const x402 = new X402PaymentChannelSDK(signer || provider);
const sg = new SpendGuardSDK(signer || provider);

const server = new Server(
  { name: "pharos-skills", version: "2.0.0" },
  { capabilities: { tools: {} } }
);

const tools = [
  { name: "contracts_info", description: "Deployed Atlantic contract addresses and integration tx hashes", inputSchema: { type: "object", properties: {} } },
  { name: "agent_credit_register", description: "Register caller as agent (requires wallet.json)", inputSchema: { type: "object", properties: {} } },
  { name: "agent_credit_get_score", description: "Get credit score 0-1000", inputSchema: { type: "object", properties: { agent: { type: "string" } }, required: ["agent"] } },
  { name: "agent_credit_get_limit", description: "Get PHRS credit limit from score tier", inputSchema: { type: "object", properties: { agent: { type: "string" } }, required: ["agent"] } },
  { name: "agent_credit_breakdown", description: "Score breakdown components", inputSchema: { type: "object", properties: { agent: { type: "string" } }, required: ["agent"] } },
  { name: "intent_compute_hash", description: "Legacy packed keccak commit hash", inputSchema: { type: "object", properties: { actionType: { type: "string" }, reasoning: { type: "string" }, expectedOutcome: { type: "string" }, nonce: { type: "number" } }, required: ["actionType", "reasoning", "expectedOutcome", "nonce"] } },
  { name: "intent_compute_hash_eip712", description: "EIP-712 typed commit hash", inputSchema: { type: "object", properties: { actionType: { type: "string" }, reasoning: { type: "string" }, expectedOutcome: { type: "string" }, nonce: { type: "number" } }, required: ["actionType", "reasoning", "expectedOutcome", "nonce"] } },
  { name: "intent_commit", description: "Commit intent hash on-chain", inputSchema: { type: "object", properties: { hash: { type: "string" }, eip712: { type: "boolean" } }, required: ["hash"] } },
  { name: "intent_reveal", description: "Reveal committed intent", inputSchema: { type: "object", properties: { intentId: { type: "number" }, actionType: { type: "string" }, reasoning: { type: "string" }, expectedOutcome: { type: "string" }, nonce: { type: "number" } }, required: ["intentId", "actionType", "reasoning", "expectedOutcome", "nonce"] } },
  { name: "intent_is_verified", description: "Check if intent id is verified for agent", inputSchema: { type: "object", properties: { agent: { type: "string" }, intentId: { type: "number" } }, required: ["agent", "intentId"] } },
  { name: "x402_payment_message", description: "Build channel payment message hash", inputSchema: { type: "object", properties: { channelId: { type: "string" }, amount: { type: "string" }, nonce: { type: "number" } }, required: ["channelId", "amount", "nonce"] } },
  { name: "spendguard_can_spend", description: "Simulate spend policy check", inputSchema: { type: "object", properties: { agent: { type: "string" }, to: { type: "string" }, amountWei: { type: "string" }, intentId: { type: "number" } }, required: ["agent", "to", "amountWei"] } },
  { name: "spendguard_get_policy", description: "Read agent spend policy and remaining daily budget", inputSchema: { type: "object", properties: { agent: { type: "string" } }, required: ["agent"] } },
  { name: "spendguard_deposit", description: "Deposit PHRS into SpendGuard custody (wallet required)", inputSchema: { type: "object", properties: { amountEth: { type: "string" } }, required: ["amountEth"] } },
  { name: "spendguard_guarded_spend", description: "Execute guarded spend (wallet required)", inputSchema: { type: "object", properties: { to: { type: "string" }, amountWei: { type: "string" }, intentId: { type: "number" } }, required: ["to", "amountWei"] } },
  { name: "darkpay_generate_meta_address", description: "Generate ERC-5564 meta-address keypair", inputSchema: { type: "object", properties: {} } },
  { name: "darkpay_compute_stealth_address", description: "Compute one-time stealth payment target", inputSchema: { type: "object", properties: { viewingPubKeyHex: { type: "string" }, spendingPubKeyHex: { type: "string" } }, required: ["viewingPubKeyHex", "spendingPubKeyHex"] } },
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

function requireSigner() {
  if (!signer) throw new Error("wallet.json or PRIVATE_KEY required for write operations");
  return signer;
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    switch (name) {
      case "contracts_info":
        return { content: [{ type: "text", text: JSON.stringify(dep, null, 2) }] };
      case "agent_credit_register": {
        const tx = await acs.registerAgent();
        const r = await tx.wait();
        return { content: [{ type: "text", text: JSON.stringify({ txHash: r.hash }) }] };
      }
      case "agent_credit_get_score": {
        const score = await acs.getScore(args.agent);
        return { content: [{ type: "text", text: JSON.stringify({ agent: args.agent, score }) }] };
      }
      case "agent_credit_get_limit": {
        const limit = await acs.getCreditLimit(args.agent);
        return { content: [{ type: "text", text: JSON.stringify({ agent: args.agent, limit: limit.toString() }) }] };
      }
      case "agent_credit_breakdown": {
        const b = await acs.getBreakdown(args.agent);
        return { content: [{ type: "text", text: JSON.stringify(b, (_, v) => typeof v === "bigint" ? v.toString() : v) }] };
      }
      case "intent_compute_hash": {
        const hash = await iv.buildHash(args.actionType, args.reasoning, args.expectedOutcome, args.nonce);
        return { content: [{ type: "text", text: hash }] };
      }
      case "intent_compute_hash_eip712": {
        const hash = await iv.buildHashEIP712(args.actionType, args.reasoning, args.expectedOutcome, args.nonce);
        return { content: [{ type: "text", text: hash }] };
      }
      case "intent_commit": {
        requireSigner();
        const tx = args.eip712
          ? await iv.commitIntentEIP712(args.hash)
          : await iv.commitIntent(args.hash);
        const r = await tx.wait();
        return { content: [{ type: "text", text: JSON.stringify({ txHash: r.hash }) }] };
      }
      case "intent_reveal": {
        requireSigner();
        const tx = await iv.revealIntent(args.intentId, args.actionType, args.reasoning, args.expectedOutcome, args.nonce);
        const r = await tx.wait();
        return { content: [{ type: "text", text: JSON.stringify({ txHash: r.hash }) }] };
      }
      case "intent_is_verified": {
        const ok = await iv.isVerifiedIntent(args.agent, args.intentId);
        return { content: [{ type: "text", text: JSON.stringify({ verified: ok }) }] };
      }
      case "x402_payment_message": {
        const hash = await x402.buildPaymentMessage(args.channelId, BigInt(args.amount), BigInt(args.nonce));
        return { content: [{ type: "text", text: hash }] };
      }
      case "spendguard_can_spend": {
        const [ok, reason] = await sg.canSpend(args.agent, args.to, BigInt(args.amountWei), BigInt(args.intentId || 0));
        return { content: [{ type: "text", text: JSON.stringify({ ok, reason }) }] };
      }
      case "spendguard_get_policy": {
        const p = await sg.getPolicy(args.agent);
        return { content: [{ type: "text", text: JSON.stringify(p, (_, v) => typeof v === "bigint" ? v.toString() : v) }] };
      }
      case "spendguard_deposit": {
        requireSigner();
        const tx = await sg.deposit(args.amountEth);
        const r = await tx.wait();
        return { content: [{ type: "text", text: JSON.stringify({ txHash: r.hash }) }] };
      }
      case "spendguard_guarded_spend": {
        requireSigner();
        const tx = await sg.guardedSpend(args.to, BigInt(args.amountWei), BigInt(args.intentId || 0));
        const r = await tx.wait();
        return { content: [{ type: "text", text: JSON.stringify({ txHash: r.hash }) }] };
      }
      case "darkpay_generate_meta_address": {
        const keys = DarkPaySDK.generateMetaAddress();
        return { content: [{ type: "text", text: JSON.stringify({
          spendingPubKey: Buffer.from(keys.spendingPubKey).toString("hex"),
          viewingPubKey: Buffer.from(keys.viewingPubKey).toString("hex"),
          darkPayContract: dep.contracts.DarkPay,
        }) }] };
      }
      case "darkpay_compute_stealth_address": {
        const view = Buffer.from(args.viewingPubKeyHex.replace(/^0x/, ""), "hex");
        const spend = Buffer.from(args.spendingPubKeyHex.replace(/^0x/, ""), "hex");
        const result = DarkPaySDK.computeStealthAddress(view, spend);
        return { content: [{ type: "text", text: JSON.stringify({
          stealthAddress: result.stealthAddress,
          ephemeralPubKey: Buffer.from(result.ephemeralPubKey).toString("hex"),
          viewTag: Buffer.from(result.viewTag).toString("hex"),
        }) }] };
      }
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (e) {
    return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);

#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { readFileSync } from "fs";
import { JsonRpcProvider, Wallet } from "ethers";
import {
  AgentCreditScoreSDK,
  IntentVerifierSDK,
  X402PaymentChannelSDK,
  DarkPaySDK,
} from "../sdk/index.js";

const dep = JSON.parse(readFileSync("deployments.json", "utf8"));
const wallet = JSON.parse(readFileSync("wallet.json", "utf8"));
const provider = new JsonRpcProvider(dep.rpc, dep.chainId, { staticNetwork: true });
const signer = new Wallet(wallet.privateKey, provider);

const acs = new AgentCreditScoreSDK(signer);
const iv = new IntentVerifierSDK(signer);
const x402 = new X402PaymentChannelSDK(signer);
const dpAddr = dep.contracts.DarkPay;

const server = new Server(
  { name: "pharos-skills", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "agent_credit_get_score",
      description: "Get on-chain credit score for an agent address on Pharos Atlantic",
      inputSchema: {
        type: "object",
        properties: { agent: { type: "string", description: "Agent wallet address" } },
        required: ["agent"],
      },
    },
    {
      name: "agent_credit_get_limit",
      description: "Get PHRS credit limit for an agent based on score tier",
      inputSchema: {
        type: "object",
        properties: { agent: { type: "string" } },
        required: ["agent"],
      },
    },
    {
      name: "intent_compute_hash",
      description: "Compute commit hash for IntentVerifier pre-commitment",
      inputSchema: {
        type: "object",
        properties: {
          actionType: { type: "string" },
          reasoning: { type: "string" },
          expectedOutcome: { type: "string" },
          nonce: { type: "number" },
        },
        required: ["actionType", "reasoning", "expectedOutcome", "nonce"],
      },
    },
    {
      name: "intent_commit",
      description: "Commit intent hash on-chain before agent acts",
      inputSchema: {
        type: "object",
        properties: { hash: { type: "string" } },
        required: ["hash"],
      },
    },
    {
      name: "darkpay_generate_meta_address",
      description: "Generate ERC-5564 stealth meta-address keypair for receiver",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "darkpay_compute_stealth_address",
      description: "Compute one-time stealth address for private payment",
      inputSchema: {
        type: "object",
        properties: {
          viewingPubKeyHex: { type: "string" },
          spendingPubKeyHex: { type: "string" },
        },
        required: ["viewingPubKeyHex", "spendingPubKeyHex"],
      },
    },
    {
      name: "contracts_info",
      description: "Return deployed Atlantic testnet contract addresses",
      inputSchema: { type: "object", properties: {} },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    switch (name) {
      case "agent_credit_get_score": {
        const score = await acs.getScore(args.agent);
        return { content: [{ type: "text", text: JSON.stringify({ agent: args.agent, score }) }] };
      }
      case "agent_credit_get_limit": {
        const limit = await acs.getCreditLimit(args.agent);
        return { content: [{ type: "text", text: JSON.stringify({ agent: args.agent, limit: limit.toString() }) }] };
      }
      case "intent_compute_hash": {
        const hash = await iv.buildHash(args.actionType, args.reasoning, args.expectedOutcome, args.nonce);
        return { content: [{ type: "text", text: hash }] };
      }
      case "intent_commit": {
        const tx = await iv.commitIntent(args.hash);
        const receipt = await tx.wait();
        return { content: [{ type: "text", text: JSON.stringify({ txHash: receipt.hash }) }] };
      }
      case "darkpay_generate_meta_address": {
        const keys = DarkPaySDK.generateMetaAddress();
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              spendingPubKey: Buffer.from(keys.spendingPubKey).toString("hex"),
              viewingPubKey: Buffer.from(keys.viewingPubKey).toString("hex"),
              darkPayContract: dpAddr,
            }),
          }],
        };
      }
      case "darkpay_compute_stealth_address": {
        const view = Buffer.from(args.viewingPubKeyHex.replace(/^0x/, ""), "hex");
        const spend = Buffer.from(args.spendingPubKeyHex.replace(/^0x/, ""), "hex");
        const result = DarkPaySDK.computeStealthAddress(view, spend);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              stealthAddress: result.stealthAddress,
              ephemeralPubKey: Buffer.from(result.ephemeralPubKey).toString("hex"),
              viewTag: Buffer.from(result.viewTag).toString("hex"),
            }),
          }],
        };
      }
      case "contracts_info":
        return { content: [{ type: "text", text: JSON.stringify(dep, null, 2) }] };
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (e) {
    return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);

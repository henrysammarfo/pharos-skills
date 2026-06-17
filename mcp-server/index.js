#!/usr/bin/env node
/**
 * MCP server — full read + write tools for all 5 Pharos Skills.
 * Read-only: deployments.example.json + Atlantic RPC (no wallet).
 * Writes: wallet.json or PRIVATE_KEY env + funded PHRS on Atlantic.
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Wallet, parseEther, hexlify, getBytes, JsonRpcProvider } from "ethers";
import {
  AgentCreditScoreSDK,
  IntentVerifierSDK,
  X402PaymentChannelSDK,
  SpendGuardSDK,
  DarkPaySDK,
  DarkPayChainSDK,
  loadDeploymentsFile,
  tryLoadWallet,
  RPC,
  CHAIN_ID,
} from "../sdk/index.js";

const dep = loadDeploymentsFile();
const signer = tryLoadWallet();
const readProvider = signer
  ? signer.provider
  : new JsonRpcProvider(RPC, CHAIN_ID, { staticNetwork: true });

const acs = new AgentCreditScoreSDK(signer || readProvider);
const iv = new IntentVerifierSDK(signer || readProvider);
const x402 = new X402PaymentChannelSDK(signer || readProvider);
const sg = new SpendGuardSDK(signer || readProvider);
const dp = new DarkPayChainSDK(signer || readProvider);

const server = new Server(
  { name: "pharos-skills", version: "3.0.0" },
  { capabilities: { tools: {} } }
);

const str = { type: "string" };
const num = { type: "number" };
const bool = { type: "boolean" };
const addr = { type: "string", description: "0x address" };

const tools = [
  { name: "contracts_info", description: "Deployed Atlantic addresses + integration tx hashes", inputSchema: { type: "object", properties: {} } },

  { name: "agent_credit_is_registered", description: "Check if address is registered agent", inputSchema: { type: "object", properties: { agent: addr }, required: ["agent"] } },
  { name: "agent_credit_get_score", description: "Credit score 0-1000", inputSchema: { type: "object", properties: { agent: addr }, required: ["agent"] } },
  { name: "agent_credit_get_limit", description: "PHRS credit limit from score tier", inputSchema: { type: "object", properties: { agent: addr }, required: ["agent"] } },
  { name: "agent_credit_breakdown", description: "Score breakdown components", inputSchema: { type: "object", properties: { agent: addr }, required: ["agent"] } },
  { name: "agent_credit_register", description: "Register caller as agent (wallet required)", inputSchema: { type: "object", properties: {} } },
  { name: "agent_credit_compute_score", description: "Recompute on-chain score for agent (wallet required)", inputSchema: { type: "object", properties: { agent: addr }, required: ["agent"] } },

  { name: "intent_compute_hash", description: "Legacy packed keccak commit hash", inputSchema: { type: "object", properties: { actionType: str, reasoning: str, expectedOutcome: str, nonce: num }, required: ["actionType", "reasoning", "expectedOutcome", "nonce"] } },
  { name: "intent_compute_hash_eip712", description: "EIP-712 typed commit hash", inputSchema: { type: "object", properties: { actionType: str, reasoning: str, expectedOutcome: str, nonce: num }, required: ["actionType", "reasoning", "expectedOutcome", "nonce"] } },
  { name: "intent_is_verified", description: "Check verified intent for agent", inputSchema: { type: "object", properties: { agent: addr, intentId: num }, required: ["agent", "intentId"] } },
  { name: "intent_count", description: "Intent count for agent", inputSchema: { type: "object", properties: { agent: addr }, required: ["agent"] } },
  { name: "intent_commit", description: "Commit intent hash on-chain (wallet)", inputSchema: { type: "object", properties: { hash: str, eip712: bool }, required: ["hash"] } },
  { name: "intent_reveal", description: "Reveal committed intent (wallet)", inputSchema: { type: "object", properties: { intentId: num, actionType: str, reasoning: str, expectedOutcome: str, nonce: num }, required: ["intentId", "actionType", "reasoning", "expectedOutcome", "nonce"] } },
  { name: "intent_penalize", description: "Penalize unrevealed intent (wallet)", inputSchema: { type: "object", properties: { agent: addr, intentId: num }, required: ["agent", "intentId"] } },

  { name: "x402_get_channel", description: "Read channel state by id", inputSchema: { type: "object", properties: { channelId: str }, required: ["channelId"] } },
  { name: "x402_payment_message", description: "Build channel payment message hash", inputSchema: { type: "object", properties: { channelId: str, amount: str, nonce: num }, required: ["channelId", "amount", "nonce"] } },
  { name: "x402_sign_payment", description: "Agent-sign payment message (wallet)", inputSchema: { type: "object", properties: { channelId: str, amount: str, nonce: num }, required: ["channelId", "amount", "nonce"] } },
  { name: "x402_open_channel", description: "Open channel to serviceProvider (wallet)", inputSchema: { type: "object", properties: { serviceProvider: addr, durationBlocks: num, collateralEth: str }, required: ["serviceProvider", "collateralEth"] } },
  { name: "x402_open_channel_e2e", description: "Open channel with auto-funded provider wallet for judge testing (wallet)", inputSchema: { type: "object", properties: { collateralEth: str, providerFundEth: str } } },
  { name: "x402_settle_payment", description: "Settle signed payment as provider (wallet or providerPrivateKey)", inputSchema: { type: "object", properties: { channelId: str, amount: str, nonce: num, signature: str, providerPrivateKey: str }, required: ["channelId", "amount", "nonce", "signature"] } },
  { name: "x402_close_channel", description: "Close channel and refund unused collateral (wallet)", inputSchema: { type: "object", properties: { channelId: str }, required: ["channelId"] } },

  { name: "spendguard_can_spend", description: "Simulate spend policy check", inputSchema: { type: "object", properties: { agent: addr, to: addr, amountWei: str, intentId: num }, required: ["agent", "to", "amountWei"] } },
  { name: "spendguard_get_policy", description: "Read spend policy + daily budget", inputSchema: { type: "object", properties: { agent: addr }, required: ["agent"] } },
  { name: "spendguard_balance", description: "Custodial balance in SpendGuard", inputSchema: { type: "object", properties: { agent: addr }, required: ["agent"] } },
  { name: "spendguard_create_policy", description: "Create spend policy (wallet)", inputSchema: { type: "object", properties: { agent: addr, dailyLimitEth: str, perTxLimitEth: str, minScore: num, largeSpendThresholdEth: str, requireIntentForLarge: bool }, required: ["agent", "dailyLimitEth", "perTxLimitEth", "minScore", "largeSpendThresholdEth"] } },
  { name: "spendguard_set_whitelist", description: "Whitelist recipient for agent (wallet)", inputSchema: { type: "object", properties: { agent: addr, recipient: addr, allowed: bool }, required: ["agent", "recipient", "allowed"] } },
  { name: "spendguard_deposit", description: "Deposit PHRS into custody (wallet)", inputSchema: { type: "object", properties: { amountEth: str }, required: ["amountEth"] } },
  { name: "spendguard_withdraw", description: "Withdraw PHRS from custody (wallet)", inputSchema: { type: "object", properties: { amountEth: str }, required: ["amountEth"] } },
  { name: "spendguard_guarded_spend", description: "Execute policy-gated spend (wallet)", inputSchema: { type: "object", properties: { to: addr, amountWei: str, intentId: num }, required: ["to", "amountWei"] } },

  { name: "darkpay_generate_meta_address", description: "Generate ERC-5564 meta-address keypair (local)", inputSchema: { type: "object", properties: {} } },
  { name: "darkpay_compute_stealth_address", description: "Compute one-time stealth target", inputSchema: { type: "object", properties: { viewingPubKeyHex: str, spendingPubKeyHex: str }, required: ["viewingPubKeyHex", "spendingPubKeyHex"] } },
  { name: "darkpay_announcement_count", description: "Total stealth announcements", inputSchema: { type: "object", properties: {} } },
  { name: "darkpay_get_announcements", description: "Announcements from block", inputSchema: { type: "object", properties: { fromBlock: num }, required: ["fromBlock"] } },
  { name: "darkpay_check_announcement", description: "Check if announcement is for receiver keys", inputSchema: { type: "object", properties: { stealthAddress: addr, ephemeralPubKeyHex: str, viewTagHex: str, viewingPrivKeyHex: str, spendingPubKeyHex: str }, required: ["stealthAddress", "ephemeralPubKeyHex", "viewTagHex", "viewingPrivKeyHex", "spendingPubKeyHex"] } },
  { name: "darkpay_derive_stealth_privkey", description: "Derive stealth private key from announcement", inputSchema: { type: "object", properties: { ephemeralPubKeyHex: str, viewingPrivKeyHex: str, spendingPrivKeyHex: str }, required: ["ephemeralPubKeyHex", "viewingPrivKeyHex", "spendingPrivKeyHex"] } },
  { name: "darkpay_register_meta_address", description: "Register stealth meta-address on-chain (wallet)", inputSchema: { type: "object", properties: { spendingPubKeyHex: str, viewingPubKeyHex: str }, required: ["spendingPubKeyHex", "viewingPubKeyHex"] } },
  { name: "darkpay_send_native_stealth", description: "Send PHRS to stealth address + announce (wallet)", inputSchema: { type: "object", properties: { stealthAddress: addr, ephemeralPubKeyHex: str, viewTagHex: str, amountEth: str }, required: ["stealthAddress", "ephemeralPubKeyHex", "viewTagHex", "amountEth"] } },
  { name: "darkpay_scan_announcements", description: "Scan announcements for matching payments", inputSchema: { type: "object", properties: { fromBlock: num, viewingPrivKeyHex: str, spendingPubKeyHex: str, spendingPrivKeyHex: str }, required: ["fromBlock", "viewingPrivKeyHex", "spendingPubKeyHex"] } },
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

function requireSigner() {
  if (!signer) throw new Error("wallet.json or PRIVATE_KEY required for write operations");
  return signer;
}

function json(data) {
  return {
    content: [{
      type: "text",
      text: JSON.stringify(data, (_, v) => (typeof v === "bigint" ? v.toString() : v), 2),
    }],
  };
}

function err(message) {
  return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;
  try {
    switch (name) {
      case "contracts_info":
        return json(dep);

      case "agent_credit_is_registered":
        return json({ agent: args.agent, registered: await acs.isRegistered(args.agent) });
      case "agent_credit_get_score":
        return json({ agent: args.agent, score: await acs.getScore(args.agent) });
      case "agent_credit_get_limit": {
        const limit = await acs.getCreditLimit(args.agent);
        return json({ agent: args.agent, limit: limit.toString() });
      }
      case "agent_credit_breakdown":
        return json(await acs.getBreakdown(args.agent));
      case "agent_credit_register": {
        requireSigner();
        try {
          const tx = await acs.registerAgent();
          const r = await tx.wait();
          return json({ txHash: r.hash, agent: signer.address });
        } catch (e) {
          const msg = String(e.shortMessage || e.message || e);
          if (msg.includes("AlreadyRegistered") || msg.includes("execution reverted")) {
            return json({ skipped: "already-registered", agent: signer.address });
          }
          throw e;
        }
      }
      case "agent_credit_compute_score": {
        requireSigner();
        const tx = await acs.computeScore(args.agent);
        const r = await tx.wait();
        return json({ txHash: r.hash, score: await acs.getScore(args.agent) });
      }

      case "intent_compute_hash":
        return json({ hash: await iv.buildHash(args.actionType, args.reasoning, args.expectedOutcome, args.nonce) });
      case "intent_compute_hash_eip712":
        return json({ hash: await iv.buildHashEIP712(args.actionType, args.reasoning, args.expectedOutcome, args.nonce) });
      case "intent_is_verified":
        return json({ verified: await iv.isVerifiedIntent(args.agent, args.intentId) });
      case "intent_count":
        return json({ count: Number(await iv.intentCount(args.agent)) });
      case "intent_commit": {
        requireSigner();
        const tx = args.eip712 ? await iv.commitIntentEIP712(args.hash) : await iv.commitIntent(args.hash);
        const r = await tx.wait();
        return json({ txHash: r.hash });
      }
      case "intent_reveal": {
        requireSigner();
        const tx = await iv.revealIntent(args.intentId, args.actionType, args.reasoning, args.expectedOutcome, args.nonce);
        const r = await tx.wait();
        return json({ txHash: r.hash });
      }
      case "intent_penalize": {
        requireSigner();
        const tx = await iv.penalizeUnrevealedIntent(args.agent, args.intentId);
        const r = await tx.wait();
        return json({ txHash: r.hash });
      }

      case "x402_get_channel":
        return json(await x402.getChannel(args.channelId));
      case "x402_payment_message": {
        const hash = await x402.buildPaymentMessage(args.channelId, BigInt(args.amount), BigInt(args.nonce));
        return json({ messageHash: hash });
      }
      case "x402_sign_payment": {
        const s = requireSigner();
        const sig = await x402.signPaymentMessage(s, args.channelId, BigInt(args.amount), BigInt(args.nonce));
        return json({ signature: sig });
      }
      case "x402_open_channel": {
        requireSigner();
        const result = await x402.openChannel(
          args.serviceProvider,
          args.durationBlocks || 1000,
          args.collateralEth
        );
        return json(result);
      }
      case "x402_open_channel_e2e": {
        const s = requireSigner();
        const sdk = new X402PaymentChannelSDK(s);
        const result = await sdk.openChannelWithFundedProvider(
          s,
          args.collateralEth || "0.01",
          args.providerFundEth || "0.02"
        );
        return json(result);
      }
      case "x402_settle_payment": {
        const providerSigner = args.providerPrivateKey
          ? new Wallet(args.providerPrivateKey, readProvider)
          : requireSigner();
        const result = await x402.settlePayment(
          args.channelId,
          BigInt(args.amount),
          BigInt(args.nonce),
          args.signature,
          args.providerPrivateKey ? providerSigner : null
        );
        return json(result);
      }
      case "x402_close_channel": {
        requireSigner();
        const result = await x402.closeChannel(args.channelId);
        return json(result);
      }

      case "spendguard_can_spend": {
        const [ok, reason] = await sg.canSpend(
          args.agent,
          args.to,
          BigInt(args.amountWei),
          BigInt(args.intentId || 0)
        );
        return json({ ok, reason });
      }
      case "spendguard_get_policy":
        return json(await sg.getPolicy(args.agent));
      case "spendguard_balance": {
        const bal = await sg.balance(args.agent);
        return json({ agent: args.agent, balance: bal.toString() });
      }
      case "spendguard_create_policy": {
        requireSigner();
        const tx = await sg.createPolicy(
          args.agent,
          args.dailyLimitEth,
          args.perTxLimitEth,
          args.minScore,
          args.largeSpendThresholdEth,
          args.requireIntentForLarge ?? true
        );
        const r = await tx.wait();
        return json({ txHash: r.hash });
      }
      case "spendguard_set_whitelist": {
        requireSigner();
        const tx = await sg.setWhitelist(args.agent, args.recipient, args.allowed);
        const r = await tx.wait();
        return json({ txHash: r.hash });
      }
      case "spendguard_deposit": {
        requireSigner();
        const tx = await sg.deposit(args.amountEth);
        const r = await tx.wait();
        return json({ txHash: r.hash });
      }
      case "spendguard_withdraw": {
        requireSigner();
        const tx = await sg.withdraw(args.amountEth);
        const r = await tx.wait();
        return json({ txHash: r.hash });
      }
      case "spendguard_guarded_spend": {
        requireSigner();
        const tx = await sg.guardedSpend(args.to, BigInt(args.amountWei), BigInt(args.intentId || 0));
        const r = await tx.wait();
        return json({ txHash: r.hash });
      }

      case "darkpay_generate_meta_address": {
        const keys = DarkPaySDK.generateMetaAddress();
        return json({ ...DarkPaySDK.keysToHex(keys), darkPayContract: dep.contracts.DarkPay });
      }
      case "darkpay_compute_stealth_address": {
        const view = toBytes33(args.viewingPubKeyHex);
        const spend = toBytes33(args.spendingPubKeyHex);
        const result = DarkPaySDK.computeStealthAddress(view, spend);
        return json({
          stealthAddress: result.stealthAddress,
          ephemeralPubKey: hexlify(result.ephemeralPubKey),
          viewTag: hexlify(result.viewTag),
        });
      }
      case "darkpay_announcement_count":
        return json({ count: Number(await dp.announcementCount()) });
      case "darkpay_get_announcements": {
        const anns = await dp.getAnnouncements(args.fromBlock);
        return json(anns.map((a) => ({
          stealthAddress: a.stealthAddress,
          ephemeralPubKey: hexlify(a.ephemeralPubKey),
          viewTag: hexlify(a.viewTag),
          token: a.token,
          amount: a.amount.toString(),
          blockNumber: Number(a.blockNumber),
        })));
      }
      case "darkpay_check_announcement": {
        const keys = DarkPaySDK.keysFromHex({
          viewingPrivKey: args.viewingPrivKeyHex,
          spendingPubKey: args.spendingPubKeyHex,
        });
        const check = DarkPaySDK.checkAnnouncement(
          {
            stealthAddress: args.stealthAddress,
            ephemeralPubKey: getBytes(args.ephemeralPubKeyHex),
            viewTag: getBytes(args.viewTagHex),
          },
          keys.viewingPrivKey,
          keys.spendingPubKey
        );
        return json(check);
      }
      case "darkpay_derive_stealth_privkey": {
        const priv = DarkPaySDK.deriveStealthPrivKey(
          getBytes(args.viewingPrivKeyHex),
          getBytes(args.spendingPrivKeyHex),
          getBytes(args.ephemeralPubKeyHex)
        );
        return json({ stealthPrivKey: hexlify(priv) });
      }
      case "darkpay_register_meta_address": {
        requireSigner();
        const tx = await dp.registerStealthMetaAddress(args.spendingPubKeyHex, args.viewingPubKeyHex);
        const r = await tx.wait();
        return json({ txHash: r.hash, agent: signer.address });
      }
      case "darkpay_send_native_stealth": {
        requireSigner();
        const tx = await dp.sendNativeStealth(
          args.stealthAddress,
          args.ephemeralPubKeyHex,
          args.viewTagHex,
          args.amountEth
        );
        const r = await tx.wait();
        return json({ txHash: r.hash });
      }
      case "darkpay_scan_announcements": {
        const matches = await dp.scanAnnouncements(
          args.fromBlock,
          args.viewingPrivKeyHex,
          args.spendingPubKeyHex,
          args.spendingPrivKeyHex
        );
        return json(matches);
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (e) {
    return err(e.shortMessage || e.message);
  }
});

function toBytes33(hex) {
  const b = getBytes(hex.startsWith("0x") ? hex : `0x${hex}`);
  if (b.length !== 33) throw new Error("Expected 33-byte compressed pubkey");
  return b;
}

const transport = new StdioServerTransport();
await server.connect(transport);

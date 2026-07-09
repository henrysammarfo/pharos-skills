/**
 * NEXUS Trust Agent — request router for Service Agent invocations.
 * Delegates to parent repo SDK when available; falls back to read-only RPC.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ethers } from "ethers";

const __dirname = dirname(fileURLToPath(import.meta.url));
const deployments = JSON.parse(
  readFileSync(join(__dirname, "..", "deployments.json"), "utf8")
);

const RPC = process.env.RPC || deployments.rpc;
const provider = new ethers.JsonRpcProvider(RPC);

const ACS_ABI = [
  "function scores(address) view returns (uint256)",
  "function getCreditLimit(address) view returns (uint256)",
  "function isRegistered(address) view returns (bool)",
];
const IV_ABI = [
  "function isVerifiedIntent(address,uint256) view returns (bool)",
];
const SG_ABI = [
  "function canSpend(address,address,uint256,uint256) view returns (bool,bytes32)",
];

function contracts() {
  const c = deployments.contracts;
  return {
    acs: new ethers.Contract(c.AgentCreditScore, ACS_ABI, provider),
    iv: new ethers.Contract(c.IntentVerifier, IV_ABI, provider),
    sg: new ethers.Contract(c.SpendGuard, SG_ABI, provider),
    addresses: c,
  };
}

/**
 * @param {{ task: string, agent?: string, recipient?: string, amountWei?: string, intentId?: string }} input
 */
export async function handleRequest(input) {
  const task = (input.task || "").toLowerCase().trim();
  const agent = input.agent || process.env.AGENT_ADDRESS;
  if (!agent) {
    return { ok: false, error: "agent address required" };
  }

  const { acs, iv, sg, addresses } = contracts();

  if (task.includes("credit") || task.includes("score") || task.includes("register")) {
    const [score, limit, registered] = await Promise.all([
      acs.scores(agent),
      acs.getCreditLimit(agent),
      acs.isRegistered(agent),
    ]);
    return {
      ok: true,
      skill: "AgentCreditScore",
      agent,
      registered,
      score: score.toString(),
      creditLimit: limit.toString(),
      contract: addresses.AgentCreditScore,
    };
  }

  if (task.includes("intent") && task.includes("verif")) {
    const intentId = input.intentId ?? "1";
    const verified = await iv.isVerifiedIntent(agent, intentId);
    return {
      ok: true,
      skill: "IntentVerifier",
      agent,
      intentId,
      verified,
      contract: addresses.IntentVerifier,
    };
  }

  if (task.includes("spend") || task.includes("policy") || task.includes("guard")) {
    const recipient = input.recipient || ethers.ZeroAddress;
    const amountWei = input.amountWei || "0";
    const intentId = input.intentId ?? "0";
    const [allowed, reason] = await sg.canSpend(agent, recipient, amountWei, intentId);
    return {
      ok: true,
      skill: "SpendGuard",
      agent,
      recipient,
      amountWei,
      intentId,
      allowed,
      reason,
      contract: addresses.SpendGuard,
    };
  }

  if (task.includes("status") || task.includes("stack") || task.includes("full")) {
    const [score, limit, registered] = await Promise.all([
      acs.scores(agent),
      acs.getCreditLimit(agent),
      acs.isRegistered(agent),
    ]);
    return {
      ok: true,
      agent,
      stack: "NEXUS",
      skills: addresses,
      credit: { registered, score: score.toString(), limit: limit.toString() },
      docs: "https://github.com/henrysammarfo/pharos-skills/blob/master/ARCHITECTURE.md",
    };
  }

  if (task.includes("x402") || task.includes("channel") || task.includes("payment")) {
    return {
      ok: true,
      skill: "x402PaymentChannel",
      message: "Use parent repo SDK: openChannelWithFundedProvider",
      contract: addresses.x402PaymentChannel,
      repo: "https://github.com/henrysammarfo/pharos-skills",
    };
  }

  if (task.includes("stealth") || task.includes("dark") || task.includes("private")) {
    return {
      ok: true,
      skill: "DarkPay",
      message: "Use parent repo SDK DarkPayChainSDK for stealth flows",
      contract: addresses.DarkPay,
      repo: "https://github.com/henrysammarfo/pharos-skills",
    };
  }

  return {
    ok: false,
    error: "Unknown task",
    hint: "Try: credit score, verify intent, spend policy, full stack status",
    exampleTasks: [
      "Register my agent and return its credit score",
      "Check whether a spend is allowed under SpendGuard policy",
      "Return full trust stack status for an agent address",
    ],
  };
}

export default handleRequest;

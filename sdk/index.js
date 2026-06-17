import { readFileSync } from "fs";
import { Contract, JsonRpcProvider, Wallet, parseEther } from "ethers";
import { DarkPaySDK } from "./darkpay.js";

const RPC = process.env.RPC_URL || "https://atlantic.dplabs-internal.com";
const CHAIN_ID = 688689;

function loadDeployments() {
  return JSON.parse(readFileSync("deployments.json", "utf8"));
}

function loadAbi(name) {
  return JSON.parse(readFileSync(`artifacts/src/${name}.sol/${name}.json`, "utf8")).abi;
}

function getProvider() {
  return new JsonRpcProvider(RPC, CHAIN_ID, { staticNetwork: true });
}

function getWallet(privateKey) {
  return new Wallet(privateKey || process.env.PRIVATE_KEY, getProvider());
}

export class AgentCreditScoreSDK {
  constructor(signerOrProvider, address) {
    const dep = loadDeployments();
    this.contract = new Contract(
      address || dep.contracts.AgentCreditScore,
      loadAbi("AgentCreditScore"),
      signerOrProvider
    );
  }

  async registerAgent() {
    return this.contract.registerAgent();
  }

  async getScore(agent) {
    const s = await this.contract.scores(agent);
    return Number(s.value);
  }

  async getCreditLimit(agent) {
    return this.contract.getCreditLimit(agent);
  }

  async getBreakdown(agent) {
    const [score, success, failed, volume, ageBlocks] =
      await this.contract.getScoreBreakdown(agent);
    return { score, success, failed, volume, ageBlocks };
  }

  async computeScore(agent) {
    return this.contract.computeScore(agent);
  }
}

export class IntentVerifierSDK {
  constructor(signerOrProvider, address) {
    const dep = loadDeployments();
    this.contract = new Contract(
      address || dep.contracts.IntentVerifier,
      loadAbi("IntentVerifier"),
      signerOrProvider
    );
  }

  buildHash(actionType, reasoning, expectedOutcome, nonce) {
    return this.contract.computeHash.staticCall(
      actionType,
      reasoning,
      expectedOutcome,
      nonce
    );
  }

  async commitIntent(hash) {
    return this.contract.commitIntent(hash);
  }

  async revealIntent(intentId, actionType, reasoning, expectedOutcome, nonce) {
    return this.contract.revealIntent(intentId, actionType, reasoning, expectedOutcome, nonce);
  }

  async getHistory(agent) {
    return this.contract.getIntentHistory(agent);
  }
}

export class X402PaymentChannelSDK {
  constructor(signerOrProvider, address) {
    const dep = loadDeployments();
    this.contract = new Contract(
      address || dep.contracts.x402PaymentChannel,
      loadAbi("x402PaymentChannel"),
      signerOrProvider
    );
  }

  async openChannel(serviceProvider, durationBlocks, collateralEth) {
    return this.contract.openChannel(serviceProvider, durationBlocks, {
      value: parseEther(collateralEth),
    });
  }

  async buildPaymentMessage(channelId, amount, nonce) {
    return this.contract.getPaymentMessage(channelId, amount, nonce);
  }

  async signPaymentMessage(signer, channelId, amount, nonce) {
    const msgHash = await this.buildPaymentMessage(channelId, amount, nonce);
    return signer.signMessage(msgHash);
  }

  async settlePayment(channelId, amount, nonce, signature) {
    return this.contract.settlePayment(channelId, amount, nonce, signature);
  }

  async closeChannel(channelId) {
    return this.contract.closeChannel(channelId);
  }
}

export { DarkPaySDK };
export { loadDeployments, getProvider, getWallet, RPC, CHAIN_ID };

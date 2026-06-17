import { Contract, JsonRpcProvider, Wallet, parseEther, hexlify, getBytes } from "ethers";
import { DarkPaySDK } from "./darkpay.js";
import { loadDeploymentsFile, loadAbi, RPC, CHAIN_ID } from "./config.js";

export class AgentCreditScoreSDK {
  constructor(signerOrProvider, address) {
    const dep = loadDeploymentsFile();
    this.contract = new Contract(
      address || dep.contracts.AgentCreditScore,
      loadAbi("AgentCreditScore"),
      signerOrProvider
    );
  }

  async registerAgent() {
    return this.contract.registerAgent();
  }

  async isRegistered(agent) {
    return this.contract.isRegistered(agent);
  }

  async getScore(agent) {
    const s = await this.contract.scores(agent);
    return Number(s.value ?? s[0]);
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
    const dep = loadDeploymentsFile();
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

  buildHashEIP712(actionType, reasoning, expectedOutcome, nonce) {
    return this.contract.computeHashEIP712.staticCall(
      actionType,
      reasoning,
      expectedOutcome,
      nonce
    );
  }

  async commitIntent(hash) {
    return this.contract.commitIntent(hash);
  }

  async commitIntentEIP712(typedHash) {
    return this.contract.commitIntentEIP712(typedHash);
  }

  async revealIntent(intentId, actionType, reasoning, expectedOutcome, nonce) {
    return this.contract.revealIntent(intentId, actionType, reasoning, expectedOutcome, nonce);
  }

  async isVerifiedIntent(agent, intentId) {
    return this.contract.isVerifiedIntent(agent, intentId);
  }

  async getHistory(agent) {
    return this.contract.getIntentHistory(agent);
  }

  async intentCount(agent) {
    return this.contract.intentCount(agent);
  }
}

export class X402PaymentChannelSDK {
  constructor(signerOrProvider, address) {
    const dep = loadDeploymentsFile();
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

export class SpendGuardSDK {
  constructor(signerOrProvider, address) {
    const dep = loadDeploymentsFile();
    this.contract = new Contract(
      address || dep.contracts.SpendGuard,
      loadAbi("SpendGuard"),
      signerOrProvider
    );
  }

  async createPolicy(agent, dailyLimit, perTxLimit, minScore, largeSpendThreshold, requireIntentForLarge) {
    return this.contract.createPolicy(
      agent,
      dailyLimit,
      perTxLimit,
      minScore,
      largeSpendThreshold,
      requireIntentForLarge
    );
  }

  async setWhitelist(agent, recipient, allowed) {
    return this.contract.setWhitelist(agent, recipient, allowed);
  }

  async deposit(amountEth) {
    return this.contract.deposit({ value: parseEther(amountEth) });
  }

  async guardedSpend(to, amountWei, intentId = 0n) {
    return this.contract.guardedSpend(to, amountWei, intentId);
  }

  async canSpend(agent, to, amountWei, intentId = 0n) {
    return this.contract.canSpend(agent, to, amountWei, intentId);
  }

  async getPolicy(agent) {
    return this.contract.getPolicy(agent);
  }

  async balance(agent) {
    return this.contract.balances(agent);
  }
}

export { DarkPaySDK };

export function getProvider() {
  return new JsonRpcProvider(RPC, CHAIN_ID, { staticNetwork: true });
}

export function getWallet(privateKey) {
  return new Wallet(privateKey || process.env.PRIVATE_KEY, getProvider());
}

export { loadDeploymentsFile, RPC, CHAIN_ID };

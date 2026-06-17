import { readFileSync, existsSync } from "fs";
import { Contract, JsonRpcProvider, Wallet, parseEther, hexlify, getBytes } from "ethers";
import { DarkPaySDK, DarkPayChainSDK } from "./darkpay.js";
import { loadDeploymentsFile, loadAbi, RPC, CHAIN_ID } from "./config.js";

function parseChannelOpened(receipt, contract) {
  const opened = receipt.logs
    .map((l) => {
      try {
        return contract.interface.parseLog(l);
      } catch {
        return null;
      }
    })
    .find((e) => e && e.name === "ChannelOpened");
  if (!opened) throw new Error("ChannelOpened event not found");
  return opened.args.id;
}

export class AgentCreditScoreSDK {
  constructor(signerOrProvider, address) {
    const dep = loadDeploymentsFile();
    this.contract = new Contract(
      address || dep.contracts.AgentCreditScore,
      loadAbi("AgentCreditScore"),
      signerOrProvider
    );
  }

  async registerAgent(opts = {}) {
    return this.contract.registerAgent(opts);
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

  async computeScore(agent, opts = {}) {
    return this.contract.computeScore(agent, opts);
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

  async commitIntent(hash, opts = {}) {
    return this.contract.commitIntent(hash, opts);
  }

  async commitIntentEIP712(typedHash, opts = {}) {
    return this.contract.commitIntentEIP712(typedHash, opts);
  }

  async revealIntent(intentId, actionType, reasoning, expectedOutcome, nonce, opts = {}) {
    return this.contract.revealIntent(intentId, actionType, reasoning, expectedOutcome, nonce, opts);
  }

  async penalizeUnrevealedIntent(agent, intentId) {
    return this.contract.penalizeUnrevealedIntent(agent, intentId);
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

  async commitAndGetId(hash, eip712 = false) {
    const tx = eip712 ? await this.commitIntentEIP712(hash) : await this.commitIntent(hash);
    const receipt = await tx.wait();
    const committed = receipt.logs
      .map((l) => {
        try {
          return this.contract.interface.parseLog(l);
        } catch {
          return null;
        }
      })
      .find((e) => e && e.name === "IntentCommitted");
    if (!committed) throw new Error("IntentCommitted event not found");
    return { txHash: receipt.hash, intentId: committed.args.id };
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

  async getChannel(channelId) {
    const ch = await this.contract.channels(channelId);
    return {
      agent: ch.agent ?? ch[0],
      serviceProvider: ch.serviceProvider ?? ch[1],
      collateral: ch.collateral ?? ch[2],
      usedAmount: ch.usedAmount ?? ch[3],
      expiryBlock: ch.expiryBlock ?? ch[4],
      nonce: ch.nonce ?? ch[5],
      open: ch.open ?? ch[6],
    };
  }

  async openChannel(serviceProvider, durationBlocks, collateralEth, opts = {}) {
    const tx = await this.contract.openChannel(serviceProvider, durationBlocks, {
      value: parseEther(collateralEth),
      ...opts,
    });
    const receipt = await tx.wait();
    const channelId = parseChannelOpened(receipt, this.contract);
    return { txHash: receipt.hash, channelId };
  }

  async buildPaymentMessage(channelId, amount, nonce) {
    return this.contract.getPaymentMessage(channelId, amount, nonce);
  }

  async signPaymentMessage(signer, channelId, amount, nonce) {
    const msgHash = await this.buildPaymentMessage(channelId, amount, nonce);
    return signer.signMessage(getBytes(msgHash));
  }

  async settlePayment(channelId, amount, nonce, agentSignature, providerSigner, opts = {}) {
    const connected = providerSigner
      ? this.contract.connect(providerSigner)
      : this.contract;
    const tx = await connected.settlePayment(channelId, amount, nonce, agentSignature, opts);
    const receipt = await tx.wait();
    return { txHash: receipt.hash };
  }

  async closeChannel(channelId, opts = {}) {
    const tx = await this.contract.closeChannel(channelId, opts);
    const receipt = await tx.wait();
    return { txHash: receipt.hash };
  }

  async openChannelWithFundedProvider(agentSigner, collateralEth, providerFundEth = "0.02") {
    const provider = Wallet.createRandom().connect(agentSigner.provider);
    const fundTx = await agentSigner.sendTransaction({
      to: provider.address,
      value: parseEther(providerFundEth),
    });
    await fundTx.wait();
    const agentSdk = new X402PaymentChannelSDK(agentSigner);
    const { channelId, txHash } = await agentSdk.openChannel(
      provider.address,
      1000,
      collateralEth
    );
    return {
      channelId,
      openTxHash: txHash,
      fundTxHash: fundTx.hash,
      providerAddress: provider.address,
      providerPrivateKey: provider.privateKey,
    };
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

  async createPolicy(
    agent,
    dailyLimitEth,
    perTxLimitEth,
    minScore,
    largeSpendThresholdEth,
    requireIntentForLarge,
    opts = {}
  ) {
    return this.contract.createPolicy(
      agent,
      parseEther(dailyLimitEth),
      parseEther(perTxLimitEth),
      minScore,
      parseEther(largeSpendThresholdEth),
      requireIntentForLarge,
      opts
    );
  }

  async setWhitelist(agent, recipient, allowed, opts = {}) {
    return this.contract.setWhitelist(agent, recipient, allowed, opts);
  }

  async deposit(amountEth, opts = {}) {
    return this.contract.deposit({ value: parseEther(amountEth), ...opts });
  }

  async withdraw(amountEth, opts = {}) {
    return this.contract.withdraw(parseEther(amountEth), opts);
  }

  async guardedSpend(to, amountWei, intentId = 0n, opts = {}) {
    return this.contract.guardedSpend(to, amountWei, intentId, opts);
  }

  async canSpend(agent, to, amountWei, intentId = 0n) {
    return this.contract.canSpend(agent, to, amountWei, intentId);
  }

  async getPolicy(agent) {
    const p = await this.contract.getPolicy(agent);
    return {
      agent: p.agent ?? p[0],
      dailyLimit: p.dailyLimit ?? p[1],
      perTxLimit: p.perTxLimit ?? p[2],
      minScore: p.minScore ?? p[3],
      largeSpendThreshold: p.largeSpendThreshold ?? p[4],
      requireIntentForLarge: p.requireIntentForLarge ?? p[5],
      active: p.active ?? p[6],
      spentToday: p.spentToday ?? p[7],
      dayStartBlock: p.dayStartBlock ?? p[8],
    };
  }

  async balance(agent) {
    return this.contract.balances(agent);
  }
}

export { DarkPaySDK, DarkPayChainSDK };

export function getProvider() {
  return new JsonRpcProvider(RPC, CHAIN_ID, { staticNetwork: true });
}

export function getWallet(privateKey) {
  const key = privateKey || process.env.PRIVATE_KEY;
  if (!key) throw new Error("PRIVATE_KEY or wallet.json required");
  return new Wallet(key, getProvider());
}

export function tryLoadWallet() {
  if (process.env.PRIVATE_KEY) return getWallet(process.env.PRIVATE_KEY);
  if (existsSync("wallet.json")) {
    const w = JSON.parse(readFileSync("wallet.json", "utf8"));
    return new Wallet(w.privateKey, getProvider());
  }
  return null;
}

export { loadDeploymentsFile, RPC, CHAIN_ID };

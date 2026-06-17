#!/usr/bin/env node
/**
 * SDK test suite — read-only always; full wallet write flow with --wallet.
 * Usage: node scripts/test-sdk.mjs [--wallet]
 */
import { Wallet, parseEther, hexlify } from "ethers";
import {
  AgentCreditScoreSDK,
  IntentVerifierSDK,
  X402PaymentChannelSDK,
  SpendGuardSDK,
  DarkPaySDK,
  DarkPayChainSDK,
  loadDeploymentsFile,
  tryLoadWallet,
  getProvider,
} from "../sdk/index.js";
import { createChecker, wantsWallet, walletRequiredMessage } from "./test-helpers.mjs";

const dep = loadDeploymentsFile();
const deployer = dep.deployer;
const provider = getProvider();
const { check, summary } = createChecker();
const requireWallet = wantsWallet(process.argv);

const acs = new AgentCreditScoreSDK(provider);
const iv = new IntentVerifierSDK(provider);
const x402 = new X402PaymentChannelSDK(provider);
const sg = new SpendGuardSDK(provider);
const dp = new DarkPayChainSDK(provider);

console.log("=== SDK READ TESTS ===\n");

await check("deployments loaded", async () => dep.contracts);
await check("agent_credit_is_registered", async () => ({
  registered: await acs.isRegistered(deployer),
}));
await check("agent_credit_get_score", async () => ({ score: await acs.getScore(deployer) }));
await check("agent_credit_get_limit", async () => ({
  limit: (await acs.getCreditLimit(deployer)).toString(),
}));
await check("agent_credit_breakdown", async () => acs.getBreakdown(deployer));
await check("intent_compute_hash", async () =>
  iv.buildHash("TEST", "reason", "0x0000000000000000000000000000000000000000000000000000000000000001", 1)
);
await check("intent_compute_hash_eip712", async () =>
  iv.buildHashEIP712("TEST", "reason", "0x0000000000000000000000000000000000000000000000000000000000000001", 1)
);
await check("intent_is_verified", async () => ({
  verified: await iv.isVerifiedIntent(deployer, 0),
}));
await check("intent_count", async () => ({ count: Number(await iv.intentCount(deployer)) }));
await check("x402_payment_message", async () =>
  x402.buildPaymentMessage(
    "0x0000000000000000000000000000000000000000000000000000000000000001",
    1000n,
    1n
  )
);
await check("spendguard_can_spend", async () => {
  const [ok, reason] = await sg.canSpend(deployer, deployer, 1n, 0n);
  return { ok, reason };
});
await check("spendguard_get_policy", async () => sg.getPolicy(deployer));
await check("spendguard_balance", async () => ({
  balance: (await sg.balance(deployer)).toString(),
}));
await check("darkpay_announcement_count", async () => ({
  count: Number(await dp.announcementCount()),
}));
await check("darkpay_generate_meta_address", async () => {
  const k = DarkPaySDK.generateMetaAddress();
  return DarkPaySDK.keysToHex(k);
});
await check("darkpay_compute_stealth_address", async () => {
  const k = DarkPaySDK.generateMetaAddress();
  const r = DarkPaySDK.computeStealthAddress(k.viewingPubKey, k.spendingPubKey);
  return { stealthAddress: r.stealthAddress };
});

const readResult = summary("SDK read checks passed");
if (readResult.ok !== readResult.total) process.exit(1);

const wallet = tryLoadWallet();
if (!wallet) {
  if (requireWallet) {
    console.error(`\nERROR: ${walletRequiredMessage()}`);
    process.exit(1);
  }
  console.log("\nSKIP wallet write tests (no wallet.json). Run with --wallet to require.");
  process.exit(0);
}

console.log("\n=== SDK WALLET WRITE TESTS ===\n");
console.log("Wallet:", wallet.address);

const wAcs = new AgentCreditScoreSDK(wallet);
const wIv = new IntentVerifierSDK(wallet);
const wX402 = new X402PaymentChannelSDK(wallet);
const wSg = new SpendGuardSDK(wallet);
const wDp = new DarkPayChainSDK(wallet);

try {
  await check("agent_credit_register", async () => {
    try {
      const tx = await wAcs.registerAgent({ gasLimit: 500_000n });
      const r = await tx.wait();
      return { txHash: r.hash };
    } catch (e) {
      const msg = String(e.shortMessage || e.message || e);
      if (msg.includes("AlreadyRegistered") || msg.includes("execution reverted")) {
        return { skipped: "already-registered" };
      }
      throw e;
    }
  });

  const actionType = "SDK_TEST";
  const reasoning = "automated sdk wallet test";
  const expectedOutcome = "0x00000000000000000000000000000000000000000000000000000000000000ab";
  const nonce = BigInt(Date.now() % 1_000_000);
  const hash = await wIv.buildHash(actionType, reasoning, expectedOutcome, nonce);
  const { intentId, txHash: commitHash } = await wIv.commitAndGetId(hash);

  await check("intent_commit", async () => ({ intentId: intentId.toString(), txHash: commitHash }));

  const recipient = Wallet.createRandom().address;
  await check("spendguard_create_policy", async () => {
    const tx = await wSg.createPolicy(wallet.address, "1", "0.1", 0, "0.05", true, { gasLimit: 500_000n });
    const r = await tx.wait();
    return { txHash: r.hash };
  });
  await check("spendguard_set_whitelist", async () => {
    const tx = await wSg.setWhitelist(wallet.address, recipient, true, { gasLimit: 200_000n });
    const r = await tx.wait();
    return { txHash: r.hash };
  });
  await check("spendguard_deposit", async () => {
    const tx = await wSg.deposit("0.01", { gasLimit: 300_000n });
    const r = await tx.wait();
    return { txHash: r.hash };
  });

  await check("intent_reveal", async () => {
    const tx = await wIv.revealIntent(intentId, actionType, reasoning, expectedOutcome, nonce, { gasLimit: 800_000n });
    const r = await tx.wait();
    return { txHash: r.hash };
  });

  await check("spendguard_guarded_spend_small", async () => {
    const tx = await wSg.guardedSpend(recipient, parseEther("0.001"), 0n, { gasLimit: 500_000n });
    const r = await tx.wait();
    return { txHash: r.hash };
  });

  const e2e = await check("x402_open_channel_e2e", async () =>
    wX402.openChannelWithFundedProvider(wallet, "0.005", "0.01")
  );

  const amount = 100000000000000n;
  const payNonce = 1n;
  const signature = await wX402.signPaymentMessage(wallet, e2e.channelId, amount, payNonce);
  await check("x402_sign_payment", async () => ({ signature: signature.slice(0, 20) + "..." }));

  await check("x402_settle_payment", async () => {
    const providerSigner = new Wallet(e2e.providerPrivateKey, provider);
    return wX402.settlePayment(e2e.channelId, amount, payNonce, signature, providerSigner, { gasLimit: 500_000n });
  });

  await check("x402_close_channel", async () => {
    const result = await wX402.closeChannel(e2e.channelId);
    return result;
  });

  const receiverKeys = DarkPaySDK.generateMetaAddress();
  const receiverHex = DarkPaySDK.keysToHex(receiverKeys);
  await check("darkpay_register_meta_address", async () => {
    const tx = await wDp.registerStealthMetaAddress(receiverHex.spendingPubKey, receiverHex.viewingPubKey, { gasLimit: 500_000n });
    const r = await tx.wait();
    return { txHash: r.hash };
  });

  const stealth = DarkPaySDK.computeStealthAddress(receiverKeys.viewingPubKey, receiverKeys.spendingPubKey);
  await check("darkpay_send_native_stealth", async () => {
    const tx = await wDp.sendNativeStealth(
      stealth.stealthAddress,
      hexlify(stealth.ephemeralPubKey),
      hexlify(stealth.viewTag),
      "0.0001",
      { gasLimit: 500_000n }
    );
    const r = await tx.wait();
    return { txHash: r.hash };
  });

  await check("darkpay_scan_announcements", async () => {
    const block = await provider.getBlockNumber();
    const matches = await wDp.scanAnnouncements(
      block - 20,
      receiverHex.viewingPrivKey,
      receiverHex.spendingPubKey,
      receiverHex.spendingPrivKey
    );
    if (!matches.length) throw new Error("No matching stealth announcement");
    return { matches: matches.length, stealthAddress: matches[0].stealthAddress };
  });

  await check("agent_credit_compute_score", async () => {
    const tx = await wAcs.computeScore(wallet.address, { gasLimit: 500_000n });
    const r = await tx.wait();
    return { txHash: r.hash, score: await wAcs.getScore(wallet.address) };
  });
} catch (e) {
  console.error("Wallet test suite aborted:", e.shortMessage || e.message);
  process.exit(1);
}

const writeResult = summary("SDK wallet write checks passed");
process.exit(writeResult.ok === writeResult.total ? 0 : 1);

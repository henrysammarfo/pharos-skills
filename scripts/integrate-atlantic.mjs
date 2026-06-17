#!/usr/bin/env node
/**
 * Full Atlantic integration — all 5 skills. Run after deploy-atlantic.mjs.
 * Judges: use deployments.example.json (read-only calls) or fund wallet.json for writes.
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import {
  Contract,
  JsonRpcProvider,
  Wallet,
  parseEther,
  hexlify,
  getBytes,
} from "ethers";
import { DarkPaySDK } from "../sdk/darkpay.js";

const RPC = process.env.RPC_URL || "https://atlantic.dplabs-internal.com";
const DEPLOYMENTS_PATH = existsSync("deployments.json") ? "deployments.json" : "deployments.example.json";

function makeProvider() {
  const provider = new JsonRpcProvider(RPC, 688689, { staticNetwork: true, batchMaxCount: 1 });
  provider.pollingInterval = 4000;
  return provider;
}

function loadWallet() {
  const w = JSON.parse(readFileSync("wallet.json", "utf8"));
  return new Wallet(w.privateKey, makeProvider());
}

function loadAbi(name) {
  return JSON.parse(readFileSync(`artifacts/src/${name}.sol/${name}.json`, "utf8")).abi;
}

async function main() {
  const dep = JSON.parse(readFileSync(DEPLOYMENTS_PATH, "utf8"));
  const wallet = loadWallet();
  const provider = wallet.provider;

  const acs = new Contract(dep.contracts.AgentCreditScore, loadAbi("AgentCreditScore"), wallet);
  const iv = new Contract(dep.contracts.IntentVerifier, loadAbi("IntentVerifier"), wallet);
  const x402 = new Contract(dep.contracts.x402PaymentChannel, loadAbi("x402PaymentChannel"), wallet);
  const dp = new Contract(dep.contracts.DarkPay, loadAbi("DarkPay"), wallet);
  const sg = new Contract(dep.contracts.SpendGuard, loadAbi("SpendGuard"), wallet);

  const tests = {};

  try {
    const regTx = await acs.registerAgent({ gasLimit: 500_000n });
    await regTx.wait();
    tests.registerAgent = regTx.hash;
  } catch (e) {
    tests.registerAgent = "skipped-already-registered";
    console.log("registerAgent skipped:", e.shortMessage || e.message);
  }

  const actionType = "SWAP";
  const reasoning = "BTC momentum positive, vol low";
  const expectedOutcome = "0x0000000000000000000000000000000000000000000000000000000000000001";
  const nonce = 42n;
  const hash = await iv.computeHash(actionType, reasoning, expectedOutcome, nonce);

  const commitTx = await iv.commitIntent(hash, { gasLimit: 500_000n });
  const commitReceipt = await commitTx.wait();
  tests.commitIntent = commitTx.hash;
  const intentCommitted = commitReceipt.logs
    .map((l) => { try { return iv.interface.parseLog(l); } catch { return null; } })
    .find((e) => e && e.name === "IntentCommitted");
  const intentId = intentCommitted.args.id;

  const recipient = Wallet.createRandom().address;
  const policyTx = await sg.createPolicy(
    wallet.address,
    parseEther("1"),
    parseEther("0.1"),
    0n,
    parseEther("0.05"),
    true,
    { gasLimit: 500_000n }
  );
  await policyTx.wait();
  tests.spendGuard_createPolicy = policyTx.hash;

  const wlTx = await sg.setWhitelist(wallet.address, recipient, true, { gasLimit: 200_000n });
  await wlTx.wait();
  tests.spendGuard_whitelist = wlTx.hash;

  const depTx = await sg.deposit({ value: parseEther("0.2"), gasLimit: 300_000n });
  await depTx.wait();
  tests.spendGuard_deposit = depTx.hash;

  try {
    await sg.guardedSpend.staticCall(recipient, parseEther("0.08"), 0n);
    tests.spendGuard_largeBlocked = "FAIL-should-revert";
  } catch {
    tests.spendGuard_largeBlocked = "ok-intent-required";
  }

  const revealTx = await iv.revealIntent(intentId, actionType, reasoning, expectedOutcome, nonce, { gasLimit: 800_000n });
  await revealTx.wait();
  tests.revealIntent = revealTx.hash;

  const eipHash = await iv.computeHashEIP712(actionType, reasoning, expectedOutcome, 99n);
  const eipCommit = await iv.commitIntentEIP712(eipHash, { gasLimit: 500_000n });
  const eipReceipt = await eipCommit.wait();
  tests.commitIntentEIP712 = eipCommit.hash;
  const eipId = eipReceipt.logs
    .map((l) => { try { return iv.interface.parseLog(l); } catch { return null; } })
    .find((e) => e && e.name === "IntentCommitted").args.id;
  const eipReveal = await iv.revealIntent(eipId, actionType, reasoning, expectedOutcome, 99n, { gasLimit: 800_000n });
  await eipReveal.wait();
  tests.revealIntentEIP712 = eipReveal.hash;

  const smallSpend = await sg.guardedSpend(recipient, parseEther("0.01"), 0n, { gasLimit: 500_000n });
  await smallSpend.wait();
  tests.spendGuard_smallSpend = smallSpend.hash;

  const largeSpend = await sg.guardedSpend(recipient, parseEther("0.08"), intentId, { gasLimit: 500_000n });
  await largeSpend.wait();
  tests.spendGuard_largeSpendWithIntent = largeSpend.hash;

  const scoreTx = await acs.computeScore(wallet.address, { gasLimit: 500_000n });
  await scoreTx.wait();
  tests.computeScore = scoreTx.hash;

  const score = await acs.scores(wallet.address);
  tests.scoreValue = score.value.toString();
  console.log("Score after intents:", score.value.toString());

  const providerWallet = Wallet.createRandom().connect(provider);
  console.log("Provider wallet:", providerWallet.address);
  const fundTx = await wallet.sendTransaction({
    to: providerWallet.address,
    value: parseEther("0.05"),
    gasLimit: 21000n,
  });
  await fundTx.wait();
  tests.fundProvider = fundTx.hash;

  const openTx = await x402.openChannel(providerWallet.address, 1000, {
    value: parseEther("0.01"),
    gasLimit: 800_000n,
  });
  const openReceipt = await openTx.wait();
  tests.openChannel = openTx.hash;

  const channelOpened = openReceipt.logs
    .map((l) => { try { return x402.interface.parseLog(l); } catch { return null; } })
    .find((e) => e && e.name === "ChannelOpened");
  const channelId = channelOpened.args.id;

  const amount = 1000000000000000n;
  const payNonce = 1n;
  const msgHash = await x402.getPaymentMessage(channelId, amount, payNonce);
  const agentSig = await wallet.signMessage(getBytes(msgHash));

  const x402AsProvider = x402.connect(providerWallet);
  const settleTx = await x402AsProvider.settlePayment(channelId, amount, payNonce, agentSig, { gasLimit: 500_000n });
  await settleTx.wait();
  tests.settlePayment = settleTx.hash;

  const closeTx = await x402.closeChannel(channelId, { gasLimit: 300_000n });
  await closeTx.wait();
  tests.closeChannel = closeTx.hash;

  const receiverKeys = DarkPaySDK.generateMetaAddress();
  const regStealthTx = await dp.registerStealthMetaAddress(
    hexlify(receiverKeys.spendingPubKey),
    hexlify(receiverKeys.viewingPubKey),
    { gasLimit: 500_000n }
  );
  await regStealthTx.wait();
  tests.registerStealthMetaAddress = regStealthTx.hash;

  const stealth = DarkPaySDK.computeStealthAddress(
    receiverKeys.viewingPubKey,
    receiverKeys.spendingPubKey
  );

  const sendStealthTx = await dp.sendNativeStealth(
    stealth.stealthAddress,
    hexlify(stealth.ephemeralPubKey),
    hexlify(stealth.viewTag),
    { value: parseEther("0.001"), gasLimit: 500_000n }
  );
  await sendStealthTx.wait();
  tests.sendNativeStealth = sendStealthTx.hash;

  const blockNum = await provider.getBlockNumber();
  const announcements = await dp.getAnnouncements(blockNum - 10);
  let found = false;
  for (const a of announcements) {
    const ann = {
      stealthAddress: a.stealthAddress,
      ephemeralPubKey: getBytes(a.ephemeralPubKey),
      viewTag: getBytes(a.viewTag),
    };
    const check = DarkPaySDK.checkAnnouncement(ann, receiverKeys.viewingPrivKey, receiverKeys.spendingPubKey);
    if (check.isForMe) {
      found = true;
      tests.stealthPrivKeyDerived = hexlify(
        DarkPaySDK.deriveStealthPrivKey(receiverKeys.viewingPrivKey, receiverKeys.spendingPrivKey, ann.ephemeralPubKey)
      );
    }
  }
  tests.stealthAnnouncementMatched = found;

  dep.integrationTests = tests;
  dep.integrationCompletedAt = new Date().toISOString();
  writeFileSync("deployments.json", JSON.stringify(dep, null, 2));
  writeFileSync("deployments.example.json", JSON.stringify(dep, null, 2));
  console.log(JSON.stringify(tests, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });

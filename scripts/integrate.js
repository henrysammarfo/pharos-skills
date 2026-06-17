import { readFileSync, writeFileSync, existsSync } from "fs";
import { Wallet, JsonRpcProvider, parseEther, hexlify, getBytes } from "ethers";
import hre from "hardhat";
import { DarkPaySDK } from "../sdk/darkpay.js";

const DEPLOYMENTS_PATH = "deployments.json";

async function main() {
  if (!existsSync(DEPLOYMENTS_PATH)) {
    console.error("Run deploy.js first");
    process.exit(1);
  }

  const dep = JSON.parse(readFileSync(DEPLOYMENTS_PATH, "utf8"));
  const [signer] = await hre.ethers.getSigners();
  const provider = signer.provider;

  const acs = await hre.ethers.getContractAt(
    "AgentCreditScore",
    dep.contracts.AgentCreditScore,
    signer
  );
  const iv = await hre.ethers.getContractAt(
    "IntentVerifier",
    dep.contracts.IntentVerifier,
    signer
  );
  const x402 = await hre.ethers.getContractAt(
    "x402PaymentChannel",
    dep.contracts.x402PaymentChannel,
    signer
  );
  const dp = await hre.ethers.getContractAt(
    "DarkPay",
    dep.contracts.DarkPay,
    signer
  );

  const tests = {};

  // a. registerAgent
  const regTx = await acs.registerAgent();
  await regTx.wait();
  tests.registerAgent = regTx.hash;

  // b. record via IntentVerifier path — use owner to addSkill if needed, reveal triggers recordVerifiedIntent
  const actionType = "SWAP";
  const reasoning = "BTC momentum positive, vol low";
  const expectedOutcome =
    "0x0000000000000000000000000000000000000000000000000000000000000001";
  const nonce = 42n;
  const hash = await iv.computeHash(actionType, reasoning, expectedOutcome, nonce);

  const commitTx = await iv.commitIntent(hash);
  await commitTx.wait();
  tests.commitIntent = commitTx.hash;

  const revealTx = await iv.revealIntent(
    0,
    actionType,
    reasoning,
    expectedOutcome,
    nonce
  );
  await revealTx.wait();
  tests.revealIntent = revealTx.hash;

  const scoreAfterIntent = await acs.computeScore(signer.address);
  await scoreAfterIntent.wait();
  tests.computeScore_afterIntent = scoreAfterIntent.hash;

  const scoreVal = (await acs.scores(signer.address)).value;
  console.log("Score after intent verify:", scoreVal.toString());

  // d-f. x402 channel
  const providerWallet = Wallet.createRandom().connect(provider);
  const openTx = await x402.openChannel(providerWallet.address, 1000, {
    value: parseEther("0.01"),
  });
  const openReceipt = await openTx.wait();
  tests.openChannel = openTx.hash;

  const channelOpened = openReceipt.logs
    .map((l) => {
      try {
        return x402.interface.parseLog(l);
      } catch {
        return null;
      }
    })
    .find((e) => e && e.name === "ChannelOpened");
  const channelId = channelOpened.args.id;

  const amount = 1000000000000000n; // 0.001 PHRS
  const payNonce = 1n;
  const msgHash = await x402.getPaymentMessage(channelId, amount, payNonce);
  const agentSig = await signer.signMessage(getBytes(msgHash));

  const x402AsProvider = x402.connect(providerWallet);
  const settleTx = await x402AsProvider.settlePayment(
    channelId,
    amount,
    payNonce,
    agentSig
  );
  await settleTx.wait();
  tests.settlePayment = settleTx.hash;

  const closeTx = await x402.closeChannel(channelId);
  await closeTx.wait();
  tests.closeChannel = closeTx.hash;

  // g. DarkPay stealth flow
  const receiverKeys = DarkPaySDK.generateMetaAddress();
  const regStealthTx = await dp.registerStealthMetaAddress(
    hexlify(receiverKeys.spendingPubKey),
    hexlify(receiverKeys.viewingPubKey)
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
    { value: parseEther("0.001") }
  );
  await sendStealthTx.wait();
  tests.sendNativeStealth = sendStealthTx.hash;

  const blockNum = await provider.getBlockNumber();
  const announcements = await dp.getAnnouncements(blockNum - 5);
  let found = false;
  for (const a of announcements) {
    const ann = {
      stealthAddress: a.stealthAddress,
      ephemeralPubKey: getBytes(a.ephemeralPubKey),
      viewTag: getBytes(a.viewTag),
    };
    const check = DarkPaySDK.checkAnnouncement(
      ann,
      receiverKeys.viewingPrivKey,
      receiverKeys.spendingPubKey
    );
    if (check.isForMe) {
      found = true;
      const priv = DarkPaySDK.deriveStealthPrivKey(
        receiverKeys.viewingPrivKey,
        receiverKeys.spendingPrivKey,
        ann.ephemeralPubKey
      );
      tests.stealthClaimPrivKeyDerived = hexlify(priv);
    }
  }
  tests.stealthAnnouncementMatched = found;

  dep.integrationTests = tests;
  dep.integrationCompletedAt = new Date().toISOString();
  writeFileSync(DEPLOYMENTS_PATH, JSON.stringify(dep, null, 2));

  console.log("Integration tests complete:");
  console.log(JSON.stringify(tests, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

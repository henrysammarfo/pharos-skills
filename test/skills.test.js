import { expect } from "chai";
import hre from "hardhat";
import { parseEther } from "ethers";

describe("Pharos Skills", function () {
  let acs, iv, x402, dp, owner, provider;

  beforeEach(async function () {
    [owner, provider] = await hre.ethers.getSigners();
    const ACS = await hre.ethers.getContractFactory("AgentCreditScore");
    acs = await ACS.deploy();
    const IV = await hre.ethers.getContractFactory("IntentVerifier");
    iv = await IV.deploy(await acs.getAddress());
    const X402 = await hre.ethers.getContractFactory("x402PaymentChannel");
    x402 = await X402.deploy(await acs.getAddress());
    const DP = await hre.ethers.getContractFactory("DarkPay");
    dp = await DP.deploy();
    await acs.addSkill(await iv.getAddress());
    await acs.addSkill(await x402.getAddress());
  });

  it("registers agent and computes score", async function () {
    await acs.registerAgent();
    const hash = await iv.computeHash("TEST", "reasoning",
      "0x0000000000000000000000000000000000000000000000000000000000000001", 1);
    await iv.commitIntent(hash);
    await iv.revealIntent(0, "TEST", "reasoning",
      "0x0000000000000000000000000000000000000000000000000000000000000001", 1);
    await acs.computeScore(owner.address);
    const score = await acs.scores(owner.address);
    expect(score.value).to.be.gt(0);
  });

  it("commits and reveals intent", async function () {
    await acs.registerAgent();
    const hash = await iv.computeHash("SWAP", "test reasoning",
      "0x0000000000000000000000000000000000000000000000000000000000000001", 1);
    await iv.commitIntent(hash);
    await iv.revealIntent(0, "SWAP", "test reasoning",
      "0x0000000000000000000000000000000000000000000000000000000000000001", 1);
    const history = await iv.getIntentHistory(owner.address);
    expect(history[0].verified).to.equal(true);
  });

  it("opens channel, settles, closes", async function () {
    await acs.registerAgent();
    const tx = await x402.openChannel(provider.address, 1000, { value: parseEther("0.01") });
    const receipt = await tx.wait();
    const opened = receipt.logs.map(l => { try { return x402.interface.parseLog(l); } catch { return null; } })
      .find(e => e && e.name === "ChannelOpened");
    const channelId = opened.args.id;
    const amount = 1000000000000000n;
    const nonce = 1n;
    const msgHash = await x402.getPaymentMessage(channelId, amount, nonce);
    const sig = await owner.signMessage(hre.ethers.getBytes(msgHash));
    await x402.connect(provider).settlePayment(channelId, amount, nonce, sig);
    await x402.closeChannel(channelId);
  });
});

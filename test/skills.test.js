import { expect } from "chai";
import hre from "hardhat";
import { parseEther } from "ethers";

describe("Pharos Skills", function () {
  let acs, iv, x402, dp, sg, owner, provider;

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
    const SG = await hre.ethers.getContractFactory("SpendGuard");
    sg = await SG.deploy(await acs.getAddress());
    await acs.addSkill(await iv.getAddress());
    await acs.addSkill(await x402.getAddress());
    await sg.setIntentVerifier(await iv.getAddress());
    await sg.setExecutor(await x402.getAddress(), true);
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

  it("commits and reveals EIP-712 intent", async function () {
    await acs.registerAgent();
    const hash = await iv.computeHashEIP712("SWAP", "eip712",
      "0x0000000000000000000000000000000000000000000000000000000000000001", 2);
    await iv.commitIntentEIP712(hash);
    await iv.revealIntent(0, "SWAP", "eip712",
      "0x0000000000000000000000000000000000000000000000000000000000000001", 2);
    expect(await iv.isVerifiedIntent(owner.address, 0)).to.equal(true);
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

  it("spendguard deposit and guarded spend", async function () {
    await acs.registerAgent();
    const recipient = (await hre.ethers.getSigners())[2];
    await sg.createPolicy(owner.address, parseEther("1"), parseEther("0.1"), 0, parseEther("0.05"), false);
    await sg.setWhitelist(owner.address, recipient.address, true);
    await sg.deposit({ value: parseEther("0.2") });
    await sg.guardedSpend(recipient.address, parseEther("0.01"), 0);
    expect(await sg.balances(owner.address)).to.be.lt(parseEther("0.2"));
  });
});

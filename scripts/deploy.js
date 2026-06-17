import { readFileSync, writeFileSync, existsSync } from "fs";
import { Wallet, JsonRpcProvider } from "ethers";
import hre from "hardhat";

const RPC = process.env.RPC_URL || "https://atlantic.dplabs-internal.com";
const DEPLOYMENTS_PATH = "deployments.json";

function loadOrCreateWallet() {
  if (process.env.PRIVATE_KEY) {
    return new Wallet(process.env.PRIVATE_KEY, new JsonRpcProvider(RPC));
  }
  if (existsSync("wallet.json")) {
    const w = JSON.parse(readFileSync("wallet.json", "utf8"));
    return new Wallet(w.privateKey, new JsonRpcProvider(RPC));
  }
  const wallet = Wallet.createRandom();
  writeFileSync(
    "wallet.json",
    JSON.stringify(
      {
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: wallet.mnemonic?.phrase,
        createdAt: new Date().toISOString(),
        note: "Fund this address from https://stakely.io/faucet/pharos-atlantic-testnet-phrs",
      },
      null,
      2
    )
  );
  console.log("Generated wallet:", wallet.address);
  console.log("Saved to wallet.json — fund from Stakely faucet before deploy.");
  return wallet.connect(new JsonRpcProvider(RPC));
}

async function main() {
  const wallet = loadOrCreateWallet();
  const balance = await wallet.provider.getBalance(wallet.address);
  console.log("Deployer:", wallet.address);
  console.log("Balance:", balance.toString(), "wei");

  if (balance === 0n) {
    console.error(
      "Zero balance. Fund wallet from https://stakely.io/faucet/pharos-atlantic-testnet-phrs"
    );
    process.exit(1);
  }

  process.env.PRIVATE_KEY = wallet.privateKey;
  const [signer] = await hre.ethers.getSigners();

  const AgentCreditScore = await hre.ethers.getContractFactory(
    "AgentCreditScore",
    signer
  );
  const acs = await AgentCreditScore.deploy();
  await acs.waitForDeployment();
  const acsAddr = await acs.getAddress();
  console.log("AgentCreditScore:", acsAddr);

  const IntentVerifier = await hre.ethers.getContractFactory(
    "IntentVerifier",
    signer
  );
  const iv = await IntentVerifier.deploy(acsAddr);
  await iv.waitForDeployment();
  const ivAddr = await iv.getAddress();
  console.log("IntentVerifier:", ivAddr);

  const X402 = await hre.ethers.getContractFactory("x402PaymentChannel", signer);
  const x402 = await X402.deploy(acsAddr);
  await x402.waitForDeployment();
  const x402Addr = await x402.getAddress();
  console.log("x402PaymentChannel:", x402Addr);

  const DarkPay = await hre.ethers.getContractFactory("DarkPay", signer);
  const dp = await DarkPay.deploy();
  await dp.waitForDeployment();
  const dpAddr = await dp.getAddress();
  console.log("DarkPay:", dpAddr);

  const tx1 = await acs.addSkill(ivAddr);
  await tx1.wait();
  const tx2 = await acs.addSkill(x402Addr);
  await tx2.wait();
  console.log("Registered IntentVerifier and x402PaymentChannel as skills");

  const deployments = {
    network: "Pharos Atlantic Testnet",
    chainId: 688689,
    rpc: RPC,
    deployer: wallet.address,
    deployedAt: new Date().toISOString(),
    contracts: {
      AgentCreditScore: acsAddr,
      IntentVerifier: ivAddr,
      x402PaymentChannel: x402Addr,
      DarkPay: dpAddr,
    },
    transactions: {
      addSkill_IntentVerifier: tx1.hash,
      addSkill_x402PaymentChannel: tx2.hash,
    },
  };

  writeFileSync(DEPLOYMENTS_PATH, JSON.stringify(deployments, null, 2));
  console.log("Saved", DEPLOYMENTS_PATH);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

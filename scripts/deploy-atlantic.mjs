import { readFileSync, writeFileSync, existsSync } from "fs";
import {
  ContractFactory,
  JsonRpcProvider,
  Wallet,
  formatEther,
} from "ethers";

const RPC = process.env.RPC_URL || "https://atlantic.dplabs-internal.com";
const DEPLOYMENTS_PATH = "deployments.json";

function loadWallet() {
  if (process.env.PRIVATE_KEY) {
    return new Wallet(process.env.PRIVATE_KEY, new JsonRpcProvider(RPC, 688689, { staticNetwork: true }));
  }
  const w = JSON.parse(readFileSync("wallet.json", "utf8"));
  return new Wallet(w.privateKey, new JsonRpcProvider(RPC, 688689, { staticNetwork: true }));
}

function loadArtifact(name) {
  const art = JSON.parse(
    readFileSync(`artifacts/src/${name}.sol/${name}.json`, "utf8")
  );
  return art;
}

async function deployOne(wallet, name, ...args) {
  const { abi, bytecode } = loadArtifact(name);
  const factory = new ContractFactory(abi, bytecode, wallet);
  console.log(`Deploying ${name}...`);
  const contract = await factory.deploy(...args, { gasLimit: 5_000_000n });
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  const tx = contract.deploymentTransaction()?.hash;
  console.log(`${name}: ${address} (tx: ${tx})`);
  return { address, tx, contract };
}

async function main() {
  const wallet = loadWallet();
  const balance = await wallet.provider.getBalance(wallet.address);
  console.log("Deployer:", wallet.address);
  console.log("Balance:", formatEther(balance), "PHRS");

  if (balance === 0n) {
    throw new Error("Wallet has zero balance");
  }

  const acs = await deployOne(wallet, "AgentCreditScore");
  const iv = await deployOne(wallet, "IntentVerifier", acs.address);
  const x402 = await deployOne(wallet, "x402PaymentChannel", acs.address);
  const dp = await deployOne(wallet, "DarkPay");

  const acsContract = acs.contract;
  const tx1 = await acsContract.addSkill(iv.address, { gasLimit: 300_000n });
  await tx1.wait();
  const tx2 = await acsContract.addSkill(x402.address, { gasLimit: 300_000n });
  await tx2.wait();

  const deployments = {
    network: "Pharos Atlantic Testnet",
    chainId: 688689,
    rpc: RPC,
    deployer: wallet.address,
    deployedAt: new Date().toISOString(),
    contracts: {
      AgentCreditScore: acs.address,
      IntentVerifier: iv.address,
      x402PaymentChannel: x402.address,
      DarkPay: dp.address,
    },
    transactions: {
      deploy_AgentCreditScore: acs.tx,
      deploy_IntentVerifier: iv.tx,
      deploy_x402PaymentChannel: x402.tx,
      deploy_DarkPay: dp.tx,
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

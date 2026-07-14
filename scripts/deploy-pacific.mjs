#!/usr/bin/env node
/**
 * Deploy Pharos Trust Stack to Pacific Ocean Mainnet (chainId 1672).
 * Uses wallet.mainnet.json or PRIVATE_KEY. Writes deployments.mainnet.json.
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import {
  ContractFactory,
  FetchRequest,
  JsonRpcProvider,
  Wallet,
  formatEther,
} from "ethers";

const RPC = process.env.RPC_URL || "https://rpc.pharos.xyz";
const CHAIN_ID = 1672;
const DEPLOYMENTS_PATH = "deployments.mainnet.json";
const EXPLORER = "https://pharosscan.xyz";

function makeProvider() {
  const req = new FetchRequest(RPC);
  req.timeout = 120_000;
  return new JsonRpcProvider(req, CHAIN_ID, { staticNetwork: true });
}

function loadWallet() {
  const provider = makeProvider();
  if (process.env.PRIVATE_KEY) {
    return new Wallet(process.env.PRIVATE_KEY, provider);
  }
  if (!existsSync("wallet.mainnet.json")) {
    throw new Error(
      "Missing wallet.mainnet.json — see nexus-service-agent/FUNDING-MAINNET.md"
    );
  }
  const w = JSON.parse(readFileSync("wallet.mainnet.json", "utf8"));
  return new Wallet(w.privateKey, provider);
}

function loadArtifact(name) {
  return JSON.parse(
    readFileSync(`artifacts/src/${name}.sol/${name}.json`, "utf8")
  );
}

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

async function withRetry(label, fn, attempts = 5) {
  let last;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      console.warn(`${label} attempt ${i}/${attempts} failed: ${e.message}`);
      if (i < attempts) await sleep(3_000 * i);
    }
  }
  throw last;
}

async function deployOne(wallet, name, ...args) {
  const { abi, bytecode } = loadArtifact(name);
  const factory = new ContractFactory(abi, bytecode, wallet);
  console.log(`Deploying ${name}...`);
  return withRetry(`deploy ${name}`, async () => {
    const contract = await factory.deploy(...args, { gasLimit: 5_000_000n });
    await contract.waitForDeployment();
    const address = await contract.getAddress();
    const tx = contract.deploymentTransaction()?.hash;
    console.log(`${name}: ${address}`);
    console.log(`  tx: ${EXPLORER}/tx/${tx}`);
    return { address, tx, contract };
  });
}

async function main() {
  const wallet = loadWallet();
  const balance = await wallet.provider.getBalance(wallet.address);
  console.log("Network: Pharos Pacific Mainnet");
  console.log("ChainId:", CHAIN_ID);
  console.log("Deployer:", wallet.address);
  console.log("Balance:", formatEther(balance), "PROS");

  if (balance === 0n) {
    throw new Error(
      "Wallet has zero PROS. Fund " +
        wallet.address +
        " then retry. See nexus-service-agent/FUNDING-MAINNET.md"
    );
  }

  const acs = await deployOne(wallet, "AgentCreditScore");
  const iv = await deployOne(wallet, "IntentVerifier", acs.address);
  const x402 = await deployOne(wallet, "x402PaymentChannel", acs.address);
  const dp = await deployOne(wallet, "DarkPay");
  const sg = await deployOne(wallet, "SpendGuard", acs.address);

  console.log("Wiring skills...");
  const tx1 = await withRetry("addSkill IV", async () => {
    const tx = await acs.contract.addSkill(iv.address, { gasLimit: 300_000n });
    await tx.wait();
    return tx;
  });
  const tx2 = await withRetry("addSkill x402", async () => {
    const tx = await acs.contract.addSkill(x402.address, {
      gasLimit: 300_000n,
    });
    await tx.wait();
    return tx;
  });
  const tx3 = await withRetry("setIntentVerifier", async () => {
    const tx = await sg.contract.setIntentVerifier(iv.address, {
      gasLimit: 200_000n,
    });
    await tx.wait();
    return tx;
  });
  const tx4 = await withRetry("setExecutor x402", async () => {
    const tx = await sg.contract.setExecutor(x402.address, true, {
      gasLimit: 200_000n,
    });
    await tx.wait();
    return tx;
  });

  const deployments = {
    network: "Pharos Pacific Mainnet",
    chainId: CHAIN_ID,
    rpc: RPC,
    explorer: EXPLORER,
    deployer: wallet.address,
    deployedAt: new Date().toISOString(),
    pricing: { unitPriceUsd: 0.02, model: "x402 per-call" },
    contracts: {
      AgentCreditScore: acs.address,
      IntentVerifier: iv.address,
      x402PaymentChannel: x402.address,
      DarkPay: dp.address,
      SpendGuard: sg.address,
    },
    transactions: {
      deploy_AgentCreditScore: acs.tx,
      deploy_IntentVerifier: iv.tx,
      deploy_x402PaymentChannel: x402.tx,
      deploy_DarkPay: dp.tx,
      deploy_SpendGuard: sg.tx,
      addSkill_IntentVerifier: tx1.hash,
      addSkill_x402PaymentChannel: tx2.hash,
      spendGuard_setIntentVerifier: tx3.hash,
      spendGuard_setExecutor_x402: tx4.hash,
    },
  };

  writeFileSync(DEPLOYMENTS_PATH, JSON.stringify(deployments, null, 2));
  writeFileSync(
    "nexus-service-agent/deployments.json",
    JSON.stringify(deployments, null, 2)
  );
  writeFileSync(
    "deployments.mainnet.example.json",
    JSON.stringify(
      {
        ...deployments,
        note: "Public example — private keys never included",
      },
      null,
      2
    )
  );
  console.log("Saved", DEPLOYMENTS_PATH);
  console.log("Also synced nexus-service-agent/deployments.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

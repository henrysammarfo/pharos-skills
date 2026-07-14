#!/usr/bin/env node
/** Check Pacific Mainnet deployer PROS balance */
import { readFileSync, existsSync } from "fs";
import { JsonRpcProvider, Wallet, formatEther } from "ethers";

const RPC = process.env.RPC_URL || "https://rpc.pharos.xyz";
const CHAIN_ID = 1672;

function loadAddress() {
  if (process.env.PRIVATE_KEY) {
    return new Wallet(process.env.PRIVATE_KEY).address;
  }
  if (!existsSync("wallet.mainnet.json")) {
    throw new Error("Missing wallet.mainnet.json — generate deployer first");
  }
  return JSON.parse(readFileSync("wallet.mainnet.json", "utf8")).address;
}

const address = loadAddress();
const provider = new JsonRpcProvider(RPC, CHAIN_ID, { staticNetwork: true });
const bal = await provider.getBalance(address);
console.log(JSON.stringify({
  network: "Pharos Pacific Mainnet",
  chainId: CHAIN_ID,
  rpc: RPC,
  address,
  balancePros: formatEther(bal),
  explorer: `https://pharosscan.xyz/address/${address}`,
  funded: bal > 0n,
}, null, 2));
process.exit(bal > 0n ? 0 : 2);

#!/usr/bin/env node
/** Read-only Atlantic readiness checks for judges — no private key required. */
import { JsonRpcProvider, Contract } from "ethers";
import { loadDeploymentsFile, loadAbi, RPC, CHAIN_ID } from "../sdk/config.js";

const dep = loadDeploymentsFile();
const provider = new JsonRpcProvider(RPC, CHAIN_ID, { staticNetwork: true });

async function check(name, fn) {
  try {
    await fn();
    console.log(`PASS  ${name}`);
    return true;
  } catch (e) {
    console.error(`FAIL  ${name}:`, e.shortMessage || e.message);
    return false;
  }
}

const acs = new Contract(dep.contracts.AgentCreditScore, loadAbi("AgentCreditScore"), provider);
const iv = new Contract(dep.contracts.IntentVerifier, loadAbi("IntentVerifier"), provider);
const x402 = new Contract(dep.contracts.x402PaymentChannel, loadAbi("x402PaymentChannel"), provider);
const dp = new Contract(dep.contracts.DarkPay, loadAbi("DarkPay"), provider);
const sg = new Contract(dep.contracts.SpendGuard, loadAbi("SpendGuard"), provider);

let ok = 0;
const total = 8;

if (await check("RPC connected", () => provider.getBlockNumber())) ok++;
if (await check("AgentCreditScore bytecode", () => provider.getCode(dep.contracts.AgentCreditScore))) ok++;
if (await check("IntentVerifier MAX_SCORE ref", () => acs.MAX_SCORE())) ok++;
if (await check("IntentVerifier computeHash", () =>
  iv.computeHash("TEST", "r", "0x0000000000000000000000000000000000000000000000000000000000000001", 1))) ok++;
if (await check("IntentVerifier EIP-712 hash", () =>
  iv.computeHashEIP712("TEST", "r", "0x0000000000000000000000000000000000000000000000000000000000000001", 1))) ok++;
if (await check("x402 creditScore wired", () => x402.creditScore())) ok++;
if (await check("DarkPay announcementCount", () => dp.announcementCount())) ok++;
if (await check("SpendGuard creditScore wired", () => sg.creditScore())) ok++;

console.log(`\n${ok}/${total} readiness checks passed`);
console.log("Contracts:", JSON.stringify(dep.contracts, null, 2));
process.exit(ok === total ? 0 : 1);

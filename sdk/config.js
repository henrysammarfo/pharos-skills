import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const DEPLOYMENTS_PATH = process.env.DEPLOYMENTS_PATH
  || (existsSync("deployments.json") ? "deployments.json" : "deployments.example.json");

export function loadDeploymentsFile() {
  const full = resolve(process.cwd(), DEPLOYMENTS_PATH);
  return JSON.parse(readFileSync(full, "utf8"));
}

export function loadAbi(name) {
  return JSON.parse(
    readFileSync(`artifacts/src/${name}.sol/${name}.json`, "utf8")
  ).abi;
}

export const RPC = process.env.RPC_URL || "https://atlantic.dplabs-internal.com";
export const CHAIN_ID = 688689;

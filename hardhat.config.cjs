require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-chai-matchers");
const fs = require("fs");

function getAccounts() {
  if (process.env.PRIVATE_KEY) return [process.env.PRIVATE_KEY];
  if (fs.existsSync("wallet.json")) {
    const w = JSON.parse(fs.readFileSync("wallet.json", "utf8"));
    return [w.privateKey];
  }
  return [];
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.26",
    settings: { optimizer: { enabled: true, runs: 200 }, evmVersion: "cancun" },
  },
  paths: {
    sources: "./src",
    artifacts: "./artifacts",
  },
  networks: {
    atlantic: {
      url: process.env.RPC_URL || "https://atlantic.dplabs-internal.com",
      chainId: 688689,
      accounts: getAccounts(),
      timeout: 180000,
      httpHeaders: {},
    },
  },
};

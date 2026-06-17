require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-chai-matchers");
require("@nomicfoundation/hardhat-verify");
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
  etherscan: {
    apiKey: {
      atlantic: process.env.SOCIALSCAN_API_KEY || process.env.PHAROSCAN_API_KEY || "pharos",
    },
    customChains: [
      {
        network: "atlantic",
        chainId: 688689,
        urls: {
          apiURL:
            "https://api.socialscan.io/pharos-atlantic-testnet/v1/explorer/command_api/contract",
          browserURL: "https://atlantic.pharosscan.xyz/",
        },
      },
    ],
  },
  sourcify: {
    enabled: false,
  },
};

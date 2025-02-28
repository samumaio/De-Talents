require("@nomicfoundation/hardhat-toolbox");
require("hardhat-deploy")
require("solidity-coverage")
require("hardhat-gas-reporter")
require("@nomicfoundation/hardhat-chai-matchers");
require("hardhat-contract-sizer")
require("@nomicfoundation/hardhat-network-helpers")
require("dotenv").config();
/** @type import('hardhat/config').HardhatUserConfig */
const SEP_URL = process.env.SEPOLIA_RPC_URL;
const PK = process.env.PRIVATE_KEY;
module.exports = {
  solidity: "0.8.28",
  defaultNetwork: "hardhat",
  networks: {
    sepolia: {
      url: SEP_URL,
      accounts: [PK],
      chainId: 11155111,
      blockConfirmations: 2
    },
    hardhat: {
      chainId: 31337,
      blockConfirmations: 2,
      mining: {
        auto: true,
        interval: 5000
      }
    }
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    player: {
      default: 1,
    },
  },
  mocha: {
    timeout: 20000
  }
};

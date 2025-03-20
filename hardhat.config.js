require("@nomiclabs/hardhat-waffle");
require("dotenv").config();

module.exports = {
  paths: {
    artifacts: './src/artifacts',
  },
  solidity: "0.8.4",
  networks: {
    // Rede local para testes
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    // Rede de teste Sepolia
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};

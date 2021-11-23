const path = require("path");

require('dotenv').config()
const HDWalletProvider = require("@truffle/hdwallet-provider");

const MNEMONIC = process.env.MNEMONIC
const ROPSTEN_URL = process.env.ROPSTEN_URL
const KOVAN_URL = process.env.KOVAN_URL
const RINKEBY_URL = process.env.RINKEBY_URL
const MAINNET_URL = process.env.MAINNET_URL


module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  contracts_build_directory: path.join(__dirname, "client/src/contracts"),
  networks: {
    develop: {
      port: 8545
    },
    local: {
      host: "localhost",
      port: "8545",
      network_id: "*"
    },
    ropsten: {
      provider: function() {
        return new HDWalletProvider(MNEMONIC, ROPSTEN_URL)
      },
      network_id: 3
    }
  },
  compilers: {
    solc: {
      version: "^0.8.0"
    }
  }
};

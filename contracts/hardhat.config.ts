// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";

const config: HardhatUserConfig = {
  solidity: "0.8.27",
  networks: {
    cgstack: {
      chainId: 31337,
      url: "http://hardhat:8545",
    },
    gnosis: {
      chainId: 100,
      url: "https://rpc.gnosischain.com",
      accounts: ['0xdf57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e'], // this is just a "test" private key, replace with actual deployment account private key
    },
    eth: {
      chainId: 1,
      url: "https://cloudflare-eth.com",
      accounts: ['0xdf57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e'], // this is just a "test" private key, replace with actual deployment account private key
    },
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: "<api-key>"
  },
  sourcify: {
    // Disabled by default
    // Doesn't need an API key
    enabled: true
  }
};

export default config;

// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

export const chainIds: {
    [chain in Models.Contract.ChainIdentifier | "hardhat" | "sokol"]: number;
} = {
    eth: 1,
    bsc: 56,
    matic: 137,
    xdai: 100,
    fantom: 250,
    avax: 43114,
    arbitrum: 42161,
    optimism: 10,
    base: 8453,
    linea: 59144,
    arbitrum_nova: 42170,
    celo: 42220,
    polygon_zkevm: 1101,
    scroll: 534352,
    zksync: 324,
    lukso: 42,
    hardhat: 31337,
    sokol: 123456,
};
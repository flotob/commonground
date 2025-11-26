// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { HomeChannelTypes } from "views/Home/Home";

type EcosystemHeaderData = {
  description: string;
  links: {
    title: string;
    url: string;
  }[];
};

export const ecosystemHeaderData: Partial<Record<HomeChannelTypes, EcosystemHeaderData>> = {
  lukso: {
    description: 'Explore the Ecosystem for the New Creative Economies',
    links: [
      {
        title: 'Homepage',
        url: 'https://lukso.network/'
      },
      {
        title: 'Twitter',
        url: 'https://twitter.com/lukso_io'
      },
    ]
  },
  si3: {
    description: 'Discover the Ecosystem Powered by Womxn & Non-Binary Leaders',
    links: [
      {
        title: 'Homepage',
        url: 'https://www.si3.space/'
      },
      {
        title: 'Twitter',
        url: 'https://twitter.com/si3_ecosystem'
      },
    ]
  },
  fuel: {
    description: "Ecosystem for the World's Fastest Modular Execution Layer",
    links: [
      {
        title: 'Homepage',
        url: 'https://fuel.network/'
      },
      {
        title: 'Twitter',
        url: 'https://twitter.com/fuel_network'
      },
    ]
  },
  "powershift": {
    description: "The Future is Decentralized: Embrace the PowerShift™️",
    links: [
      {
        title: 'Homepage',
        url: 'https://www.encode.org/powershift-ecosystem'
      },
      {
        title: 'Twitter',
        url: 'https://twitter.com/encodeorg'
      },
    ]
  },
  aeternity: {
    description: "Blockchain for scalable, secure, and decentralized æpps",
    links: [
      {
        title: 'Homepage',
        url: 'https://aeternity.com/'
      },
      {
        title: 'Twitter',
        url: 'https://twitter.com/aeternity'
      },
    ]
  },
  "cannabis-social-clubs": {
    description: "Der Kanal für alle Anbauvereine",
    links: []
  },
  ethereum: {
    description: "Ethereum is the community-run technology powering the cryptocurrency ether (ETH) and thousands of decentralized applications.",
    links: [
      {
        title: 'Homepage',
        url: 'https://ethereum.org/en/assets/'
      },
      {
        title: 'Twitter',
        url: 'https://twitter.com/ethdotorg'
      },
    ]
  },
  "binance smart chain": {
    description: "A community-driven blockchain ecosystem of Layer-1 and Layer-2 scaling solutions.",
    links: [
      {
        title: 'Homepage',
        url: 'https://www.bnbchain.org/en'
      },
      {
        title: 'Twitter',
        url: 'https://twitter.com/BNBChain'
      },
    ]
  },
  gnosis: {
    description: `The Community-Run Chain. Gnosis Chain is one of the first Ethereum sidechains and has stayed true to its values.

    By allowing contributors around the globe to easily run a node, Gnosis Chain is secured by over 200k validators. Its diverse validator set and the community governance ensure Gnosis Chain remains credibly neutral at a much lower price point than mainnet.`,
    links: [
      {
        title: 'Homepage',
        url: 'https://www.gnosis.io/'
      },
      {
        title: 'Twitter',
        url: 'https://twitter.com/gnosischain'
      },
    ]
  },
  polygon: {
    description: "Web3, aggregated. Enabling an infinitely scalable web of sovereign blockchains that feels like a single chain. Powered by ZK tech.",
    links: [
      {
        title: 'Homepage',
        url: 'https://polygon.technology/'
      },
      {
        title: 'Twitter',
        url: 'https://twitter.com/0xPolygon'
      },
    ]
  },
  optimism: {
    description: "Optimism Collective — Build a world that benefits all, owned by none.",
    links: [
      {
        title: 'Homepage',
        url: 'https://www.optimism.io/'
      },
      {
        title: 'Twitter',
        url: 'https://twitter.com/optimism'
      },
    ]
  },
  base: {
    description: `Base is a secure, low-cost, builder-friendly Ethereum L2 built to bring the next billion users onchain.`,
    links: [{
      title: 'Homepage',
      url: 'https://www.base.org/'
    },
    {
      title: 'Twitter',
      url: 'https://twitter.com/base'
    }]
  },
  arbitrum: {
    description: `Designed with you in mind, Arbitrum is the leading Layer 2 technology that empowers you to explore and build in the largest Layer 1 ecosystem, Ethereum.`,
    links: [{
      title: 'Homepage',
      url: 'https://arbitrum.io/'
    },
    {
      title: 'Twitter',
      url: 'https://twitter.com/arbitrum'
    }]
  },
  avalanche: {
    description: `Build anything you want, any way you want on the lightning fast, scalable blockchain that won’t let you down. Choosing the wrong blockchain can kill your App before it ever has a chance to succeed, but it doesn’t have to be this way. Launch with confidence on Avalanche.`,
    links: [{
      title: 'Homepage',
      url: 'https://www.avax.network/'
    },
    {
      title: 'Twitter',
      url: 'https://twitter.com/avax'
    }]
  },
  fantom: {
    description: `Fantom is a fast and scalable next-gen Layer-1 platform, enabling visionary developers to build the decentralized applications of tomorrow.`,
    links: [{
      title: 'Homepage',
      url: 'https://fantom.foundation/'
    },
    {
      title: 'Twitter',
      url: 'https://twitter.com/FantomFDN'
    }]
  },
  linea: {
    description: `Building the most secure zkEVM ecosystem. Committed to Ethereum. Bootstrapped by Consensys.`,
    links: [{
      title: 'Homepage',
      url: 'https://linea.build/'
    },
    {
      title: 'Twitter',
      url: 'https://twitter.com/LineaBuild'
    }]
  },
  scroll: {
    description: `Scroll seamlessly extends Ethereum’s capabilities through zero knowledge tech and EVM compatibility. The L2 network built by Ethereum devs for Ethereum devs.`,
    links: [{
      title: 'Homepage',
      url: 'https://scroll.io/'
    },
    {
      title: 'Twitter',
      url: 'https://twitter.com/Scroll_ZKP'
    }]
  },
  zksync: {
    description: `Hyperscaling Ethereum with ZK tech.
    Freedom → Progress → Prosperity`,
    links: [{
      title: 'Homepage',
      url: 'https://zksync.io/'
    },
    {
      title: 'Twitter',
      url: 'https://twitter.com/zksync'
    }]
  },
  cardano: {
    description: `Cardano: science-based open-source, patent-free protocols for storing/managing value, identity, governance`,
    links: [{
      title: 'Homepage',
      url: 'https://cardano.org/'
    },
    {
      title: 'Twitter',
      url: 'https://twitter.com/Cardano'
    }]
  },
  solana: {
    description: `Solana is a blockchain built for mass adoption ◎ Fast, composable, green, and globally distributed.`,
    links: [{
      title: 'Homepage',
      url: 'https://solana.com/'
    },
    {
      title: 'Twitter',
      url: 'https://twitter.com/solana'
    }]
  },
  // polkadot: {
  //   description: `The blockspace ecosystem for boundless innovation`,
  //   links: [{
  //     title: 'Homepage',
  //     url: 'https://polkadot.network/'
  //   },
  //   {
  //     title: 'Twitter',
  //     url: 'https://twitter.com/Polkadot'
  //   }]
  // }
}
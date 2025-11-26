// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

type PremiumChain = "hardhat" | "eth" | "xdai" | "base";

const beneficiaryByChain: {
  [K in PremiumChain]: Common.Address;
} = {
  hardhat: '0xD5fEdD1911701343E2e6dE6B9663234D907EEEB6'.toLowerCase() as Common.Address,
  xdai: '0x7882bfa84C4Bee72649A0cadf730318A85f3fe56'.toLowerCase() as Common.Address,
  eth: '0xb548C27DE463D5AC53056041D664d58b6A8341AD'.toLowerCase() as Common.Address,
  base: '0x2BCb4cE16A0E95CD2006b3eb602BD8C9E698f64B'.toLowerCase() as Common.Address,
} as const;

const payableTokensByChain: {
  [K in PremiumChain]: Readonly<{
    title: string;
    address: Common.Address | 'native';
  }[]>;
} = {
  hardhat: [{
    title: 'hardhatETH',
    address: 'native' as "native",
  }, {
    title: 'Testtoken',
    address: '0x5FbDB2315678afecb367f032d93F642f64180aa3'.toLowerCase() as Common.Address,
  }] as const,
  xdai: [{
    title: 'xDAI',
    address: 'native' as "native",
  }, {
    title: 'USDT',
    address: '0x4ECaBa5870353805a9F068101A40E0f32ed605C6'.toLowerCase() as Common.Address,
  }, {
    title: 'USDC',
    address: '0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83'.toLowerCase() as Common.Address,
  }] as const,
  eth: [{
    title: 'USDT',
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7'.toLowerCase() as Common.Address,
  }, {
    title: 'DAI',
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F'.toLowerCase() as Common.Address,
  }, {
    title: 'USDC',
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'.toLowerCase() as Common.Address,
  }] as const,
  base: [{
    title: 'USDC',
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'.toLowerCase() as Common.Address,
  }, {
    title: 'DAI',
    address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb'.toLowerCase() as Common.Address,
  }] as const,
} as const;

export function getPayableTokens(chain: PremiumChain): Readonly<{
  title: string;
  address: Common.Address | 'native';
}[]> {
  return payableTokensByChain[chain];
}

export function getBeneficiary(chain: PremiumChain): Common.Address {
  return beneficiaryByChain[chain];
}

export function getSparkBonusPercentByAmount(amount: number): number {
  if (amount >= 100_000) {
    return 20;
  }
  else if (amount >= 50_000) {
    return 10;
  }
  else return 0;
}
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import config from '../common/config';

export type InvestmentTarget = {
    chain: Models.Contract.ChainIdentifier;
    beneficiaryAddress: Common.Address;
    token: {
        type: 'native';
        symbol: string;
    } | {
        type: 'erc20';
        address: Common.Address;
        symbol: string;
    };
    minimumAmount: string;
    softCap: string;
    hardCap: string;
    decimals: number;
}

let sale01Target: InvestmentTarget;

if (config.DEPLOYMENT === 'dev') {
    sale01Target = {
        chain: 'hardhat' as Models.Contract.ChainIdentifier,
        beneficiaryAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        token: {
            type: 'erc20',
            address: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
            symbol: 'USDC',
        },
        minimumAmount: '10.0',
        softCap: '1400.0',
        hardCap: '2000.0',
        decimals: 18,
    }
}
else {
    sale01Target = {
        chain: 'eth',
        beneficiaryAddress: '0x9f5d0Ab07c928A4a48Aa5d495CE927bE7CAed88F',
        token: {
            type: 'erc20',
            address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            symbol: 'USDC',
        },
        minimumAmount: config.DEPLOYMENT === 'staging' ? '1.0' : '10000.0',
        softCap: '5000000.0',
        hardCap: '8000000.0',
        decimals: 6,
    }
}

// PROD ENV SETTINGS
export const investmentTargets: {
    [key in Models.Wizard.ValidInvestmentTarget]: InvestmentTarget;
} = {
    'sale01': sale01Target,
}

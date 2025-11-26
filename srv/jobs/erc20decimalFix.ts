// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { isMainThread } from 'worker_threads';
import pool from '../util/postgres';
import format from 'pg-format';
import onchainHelper from '../repositories/onchain';

if (isMainThread) {
  throw new Error("ERC20DecimalFix can only be run as a worker job");
}

const ONESHOT_ID = '2024_01_29_erc20_decimal_fix';

async function updateERC20decimals() {
    const contractsResult = await pool.query(`
        SELECT *
        FROM contracts
        WHERE data->>'type' = 'ERC20'
          AND data->>'decimals' IS NULL
    `);
    const contracts = contractsResult.rows as {
        id: string;
        chain: Models.Contract.ChainIdentifier;
        address: Common.Address;
        data: {
            name: string;
            type: string;
            symbol: string;
            decimals: null;
        };
    }[];
    for (const contract of contracts) {
        const updatedData = await onchainHelper.getContractData(contract.chain, contract.address);
        await pool.query(`
            UPDATE contracts
            SET data = $1::jsonb
            WHERE id = $2
        `, [
            JSON.stringify(updatedData.data),
            contract.id
        ]);
    }
}

(async () => {
    const result = await pool.query(`
        SELECT id, "createdAt"
        FROM oneshot_jobs
    `);
    const oneshots = result.rows as {
        id: string;
        createdAt: string;
    }[];

    if (!oneshots.find(d => d.id === ONESHOT_ID)) {
        console.log("=== Fixing ERC20 contract data ===");
        await updateERC20decimals();
        await pool.query(`
            INSERT INTO oneshot_jobs (id)
            VALUES (${format("%L", ONESHOT_ID)})
        `);
    }
    else {
        console.log("=== ERC20 contract data was already fixed, nothing to do ===");
    }
    
})();
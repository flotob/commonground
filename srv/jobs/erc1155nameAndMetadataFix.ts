// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { isMainThread } from 'worker_threads';
import pool from '../util/postgres';
import format from 'pg-format';
import onchainHelper from '../repositories/onchain';

if (isMainThread) {
  throw new Error("ERC1155NameAndMetadataFix can only be run as a worker job");
}

const ONESHOT_ID = '2024_12_15_erc1155_name_and_metadata_fix';

async function updateERC1155NameAndMetadata() {
    const contractsResult = await pool.query(`
        SELECT *
        FROM contracts
        WHERE data->>'type' = 'ERC1155'
    `);
    const contracts = contractsResult.rows as {
        id: string;
        chain: Models.Contract.ChainIdentifier;
        address: Common.Address;
        data: {
            type: "ERC1155";
        };
    }[];
    for (const contract of contracts) {
        try {
            let updateData: Models.Contract.Data["data"];
            if (contract.address === '0x3bc1A0Ad72417f2d411118085256fC53CBdDd137'.toLowerCase()) {
                updateData = {
                    type: "ERC1155",
                    name: "Hats Protocol v1",
                    withMetadataURI: true,
                };
            }
            else {
                const result = await onchainHelper.getContractData(contract.chain, contract.address);
                updateData = result.data;
            }

            await pool.query(`
                UPDATE contracts
                SET data = $1::jsonb
                WHERE id = $2
            `, [
                JSON.stringify(updateData),
                contract.id
            ]);
            console.log(`Updated ERC1155 contract data for ${contract.address} on ${contract.chain}`);
        }
        catch (error) {
            console.error(`Error updating ERC1155 contract data for ${contract.address} on ${contract.chain}`, error);
        }
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
        console.log("=== Fixing ERC1155 contract data ===");
        await updateERC1155NameAndMetadata();
        await pool.query(`
            INSERT INTO oneshot_jobs (id)
            VALUES (${format("%L", ONESHOT_ID)})
        `);
    }
    else {
        console.log("=== ERC1155 contract data was already fixed, nothing to do ===");
    }
    
})();
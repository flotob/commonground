// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm"

export class updateContractsAndAccessrules1655247941015 implements MigrationInterface {
    name = 'updateContractsAndAccessrules1655247941015'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // update contracts
        await queryRunner.query(`
            UPDATE contracts
            SET data = jsonb_set(data, '{type}', '"ERC20"')
            WHERE (data->>'decimals')::INT > 0;
        `);
        await queryRunner.query(`
            UPDATE contracts
            SET data = jsonb_set(data, '{type}', '"ERC721"') - 'decimals'
            WHERE (data->>'decimals')::INT = 0;
        `);
        // get new contracts
        const contracts: any[] = await queryRunner.query(`
            SELECT * FROM contracts;
        `);
        const contractData = contracts.reduce<Record<string, any>>((agg, data) => {
            agg[data.id] = data;
            return agg;
        }, {});
        // update areas
        const areas: any[] = await queryRunner.query(`
            SELECT * FROM areas
            WHERE accessrules IS NOT NULL;
        `);
        for (const area of areas) {
            const oldAccessrule: {
                type: "contract",
                amount: string,
                contractId: string
            } = area.accessrules[0];
            const contract = contractData[oldAccessrule.contractId];
            if (contract) {
                let newRule: any | undefined;
                if (contract.data.type === "ERC20") {
                    newRule = {
                        type: "ERC20",
                        amount: oldAccessrule.amount,
                        contractId: oldAccessrule.contractId
                    }
                } else if (contract.data.type === "ERC721") {
                    newRule = {
                        type: "ERC721",
                        amount: oldAccessrule.amount,
                        contractId: oldAccessrule.contractId
                    }
                }
                if (!!newRule) {
                    const newAccessRules: any = {
                        rule1: newRule
                    };
                    await queryRunner.query(`
                        UPDATE areas
                        SET accessrules = $1
                        WHERE id = $2;
                    `, [JSON.stringify(newAccessRules), area.id]);
                }
            }
            await queryRunner
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}

// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTokenSaleTotalInvested1734008018928 implements MigrationInterface {
    name = 'AddTokenSaleTotalInvested1734008018928'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokensales" ADD "totalInvested" character varying(255) NOT NULL DEFAULT '0'`);

        const tokenSales: { id: string }[] = await queryRunner.query(`
            SELECT "id"
            FROM tokensales
        `);
        for (const tokenSale of tokenSales) {
            const investmentEvents: { investmentId: number, event: Models.Contract.SaleInvestmentEventJson }[] = await queryRunner.query(`
                SELECT "investmentId", "event"
                FROM tokensale_investments
                WHERE "tokenSaleId" = $1
                ORDER BY "investmentId" DESC
                LIMIT 1
            `, [tokenSale.id]);
            if (investmentEvents.length > 0) {
                const investmentEvent = investmentEvents[0];
                const investedAmount = BigInt(investmentEvent.event.bigint_investedAmount);
                const saleProgressBefore = BigInt(investmentEvent.event.bigint_saleProgressBefore);
                const totalInvested = investedAmount + saleProgressBefore;
                await queryRunner.query(`
                    UPDATE tokensales
                    SET "totalInvested" = $1
                    WHERE "id" = $2
                `, [totalInvested.toString(), tokenSale.id]);
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokensales" DROP COLUMN "totalInvested"`);
    }

}

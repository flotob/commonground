// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class addWalletBalance1688467219870 implements MigrationInterface {
    name = 'addWalletBalance1688467219870'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "wallet_balances" ("walletId" uuid NOT NULL, "contractId" uuid NOT NULL, "balance" jsonb NOT NULL, "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_24969975fe46f6f6565c4407387" PRIMARY KEY ("walletId", "contractId"))`);
        await queryRunner.query(`ALTER TABLE "wallet_balances" ADD CONSTRAINT "FK_10560f85c13af935346bdd37dd4" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "wallet_balances" ADD CONSTRAINT "FK_825127a336ba71e866a036d4522" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`GRANT ALL PRIVILEGES ON "wallet_balances" TO writer`);
        await queryRunner.query(`GRANT SELECT ON "wallet_balances" TO reader`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "wallet_balances" DROP CONSTRAINT "FK_825127a336ba71e866a036d4522"`);
        await queryRunner.query(`ALTER TABLE "wallet_balances" DROP CONSTRAINT "FK_10560f85c13af935346bdd37dd4"`);
        await queryRunner.query(`DROP TABLE "wallet_balances"`);
    }

}

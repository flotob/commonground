// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";
import { grantTablePermissions } from "../util/migrationUtils";

export class AddWizardInvestTracking1728922885440 implements MigrationInterface {
    name = 'AddWizardInvestTracking1728922885440'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "wizard_investment_data" ("wizardId" uuid NOT NULL, "userId" uuid NOT NULL, "chain" character varying(32) NOT NULL, "fromAddress" character varying(64) NOT NULL, "toAddress" character varying(64) NOT NULL, "amount" character varying(128) NOT NULL, "txHash" character varying(128) NOT NULL, "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_fcdc33c52ef621bc5ad85aaf999" UNIQUE ("txHash"), CONSTRAINT "PK_f4b27517711c328c8140f6c7529" PRIMARY KEY ("wizardId", "userId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5dfd0ffeb5e93665830f24fe8d" ON "wizard_investment_data" ("fromAddress") `);
        await queryRunner.query(`CREATE INDEX "IDX_b53501f55ae589ee2faa2bcaee" ON "wizard_investment_data" ("toAddress") `);
        await queryRunner.query(`ALTER TABLE "wizard_investment_data" ADD CONSTRAINT "FK_2de9f191bfb12d495c958f0cc6d" FOREIGN KEY ("wizardId") REFERENCES "wizards"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "wizard_investment_data" ADD CONSTRAINT "FK_ac3c3cf733d16d4933c36acaca2" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

        await grantTablePermissions(queryRunner, 'wizard_investment_data');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "wizard_investment_data" DROP CONSTRAINT "FK_ac3c3cf733d16d4933c36acaca2"`);
        await queryRunner.query(`ALTER TABLE "wizard_investment_data" DROP CONSTRAINT "FK_2de9f191bfb12d495c958f0cc6d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b53501f55ae589ee2faa2bcaee"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5dfd0ffeb5e93665830f24fe8d"`);
        await queryRunner.query(`DROP TABLE "wizard_investment_data"`);
    }

}

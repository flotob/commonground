// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateWizardInvestedEntity1728999528471 implements MigrationInterface {
    name = 'UpdateWizardInvestedEntity1728999528471'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "wizard_investment_data" ADD "target" character varying(32) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "wizard_investment_data" DROP CONSTRAINT "PK_f4b27517711c328c8140f6c7529"`);
        await queryRunner.query(`ALTER TABLE "wizard_investment_data" ADD CONSTRAINT "PK_3ac55b052de6fedbd6c4e752e47" PRIMARY KEY ("wizardId", "userId", "target")`);
        await queryRunner.query(`ALTER TABLE "wizard_investment_data" DROP CONSTRAINT "PK_3ac55b052de6fedbd6c4e752e47"`);
        await queryRunner.query(`ALTER TABLE "wizard_investment_data" ADD CONSTRAINT "PK_5db5caf30d198bb315eeca707a8" PRIMARY KEY ("target", "txHash")`);
        await queryRunner.query(`ALTER TABLE "wizard_investment_data" DROP CONSTRAINT "FK_ac3c3cf733d16d4933c36acaca2"`);
        await queryRunner.query(`ALTER TABLE "wizard_investment_data" DROP CONSTRAINT "FK_2de9f191bfb12d495c958f0cc6d"`);
        await queryRunner.query(`ALTER TABLE "wizard_investment_data" DROP CONSTRAINT "UQ_fcdc33c52ef621bc5ad85aaf999"`);
        await queryRunner.query(`ALTER TABLE "wizard_investment_data" DROP CONSTRAINT "PK_5db5caf30d198bb315eeca707a8"`);
        await queryRunner.query(`ALTER TABLE "wizard_investment_data" ADD CONSTRAINT "PK_0d14754001904a9874e0fd91816" PRIMARY KEY ("wizardId", "txHash", "target")`);
        await queryRunner.query(`ALTER TABLE "wizard_investment_data" DROP CONSTRAINT "PK_0d14754001904a9874e0fd91816"`);
        await queryRunner.query(`ALTER TABLE "wizard_investment_data" ADD CONSTRAINT "PK_5db5caf30d198bb315eeca707a8" PRIMARY KEY ("txHash", "target")`);
        await queryRunner.query(`ALTER TABLE "wizard_investment_data" ADD CONSTRAINT "FK_ac3c3cf733d16d4933c36acaca2" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "wizard_investment_data" ADD CONSTRAINT "FK_2de9f191bfb12d495c958f0cc6d" FOREIGN KEY ("wizardId") REFERENCES "wizards"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        throw new Error('Not implemented');
    }

}

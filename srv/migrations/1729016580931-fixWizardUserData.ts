// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class FixWizardUserData1729016580931 implements MigrationInterface {
    name = 'FixWizardUserData1729016580931'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "wizard_user_data" DROP CONSTRAINT "FK_722d0d41ee2342146bf8cbc46b2"`);
        await queryRunner.query(`ALTER TABLE "wizard_user_data" ADD CONSTRAINT "FK_722d0d41ee2342146bf8cbc46b2" FOREIGN KEY ("wizardId") REFERENCES "wizards"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "wizard_user_data" DROP CONSTRAINT "FK_722d0d41ee2342146bf8cbc46b2"`);
        await queryRunner.query(`ALTER TABLE "wizard_user_data" ADD CONSTRAINT "FK_722d0d41ee2342146bf8cbc46b2" FOREIGN KEY ("wizardId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}

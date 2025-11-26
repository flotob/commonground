// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm"

export class addColumnActivityScore1676394768973 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "groups" ADD "activityScore" double precision NOT NULL DEFAULT '0'`);
        await queryRunner.query(`CREATE INDEX "IDX_ba5f6954c97636942fbd7b19a2" ON "groups" ("activityScore") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_ba5f6954c97636942fbd7b19a2"`);
        await queryRunner.query(`ALTER TABLE "groups" DROP COLUMN "activityScore"`);
    }

}

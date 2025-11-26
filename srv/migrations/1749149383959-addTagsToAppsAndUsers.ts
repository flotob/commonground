// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTagsToAppsAndUsers1749149383959 implements MigrationInterface {
    name = 'AddTagsToAppsAndUsers1749149383959'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "tags" text array`);
        await queryRunner.query(`ALTER TABLE "plugins" ADD "tags" text array`);
        await queryRunner.query(`CREATE INDEX "IDX_9638c1abf5ba5bd906cf12f3f3" ON "users" ("tags") `);
        await queryRunner.query(`CREATE INDEX "IDX_1a64527b0e83763a851c7ed429" ON "plugins" ("tags") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_1a64527b0e83763a851c7ed429"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9638c1abf5ba5bd906cf12f3f3"`);
        await queryRunner.query(`ALTER TABLE "plugins" DROP COLUMN "tags"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "tags"`);
    }

}

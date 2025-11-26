// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRoleAirdropConfig1734108868861 implements MigrationInterface {
    name = 'AddRoleAirdropConfig1734108868861'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "roles" ADD "airdropConfig" jsonb`);
        await queryRunner.query(`CREATE INDEX "IDX_ee7b09ff8bea2b95687c3a294d" ON "roles_users_users" ("updatedAt") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "airdropConfig"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ee7b09ff8bea2b95687c3a294d"`);
    }

}

// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class addUpdatedAtToUserRoles1692193562841 implements MigrationInterface {
    name = 'addUpdatedAtToUserRoles1692193562841'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "roles_users_users" ADD "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "roles_users_users" DROP COLUMN "updatedAt"`);
    }

}

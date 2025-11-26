// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class removeVerifiedFieldFromGroups1665150459952 implements MigrationInterface {
    name = 'removeVerifiedFieldFromGroups1665150459952'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "groups" DROP COLUMN "verified"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}

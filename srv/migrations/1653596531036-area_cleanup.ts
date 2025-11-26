// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class areaCleanup1653596531036 implements MigrationInterface {
    name = 'areaCleanup1653596531036'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "areas" DROP COLUMN "tags"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}

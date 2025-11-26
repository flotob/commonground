// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRequiresIsolationModeField1746458417096 implements MigrationInterface {
    name = 'AddRequiresIsolationModeField1746458417096'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "plugins" ADD "requiresIsolationMode" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "plugins" DROP COLUMN "requiresIsolationMode"`);
    }

}

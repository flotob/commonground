// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class addCreatedToFollowers1655251330026 implements MigrationInterface {
    name = 'addCreatedToFollowers1655251330026'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "followers" ADD "created" TIMESTAMP(3) WITH TIME ZONE DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "followers" DROP COLUMN "created"`);
    }

}

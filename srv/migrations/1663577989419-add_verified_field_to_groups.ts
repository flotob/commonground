// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class addVerifiedFieldToGroups1663577989419 implements MigrationInterface {
    name = 'addVerifiedFieldToGroups1663577989419'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "groups" ADD "verified" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`UPDATE "groups" SET verified=TRUE WHERE deleted=FALSE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "groups" DROP COLUMN "verified"`);
    }

}

// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserTrustScore1700841353138 implements MigrationInterface {
    name = 'AddUserTrustScore1700841353138'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "trustScore" numeric(10,6) NOT NULL DEFAULT '1'`);
        await queryRunner.query(`UPDATE "users" SET "trustScore" = 0`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "trustScore"`);
    }

}

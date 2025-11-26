// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddScheduleDateToCalls1706811312569 implements MigrationInterface {
    name = 'AddScheduleDateToCalls1706811312569'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "calls" ADD "scheduleDate" TIMESTAMP(3) WITH TIME ZONE`);
        await queryRunner.query(`UPDATE "calls" SET "updatedAt" = now()`);
        await queryRunner.query(`UPDATE "calls" SET "scheduleDate" = NULL`);
        await queryRunner.query(`ALTER TABLE "calls" ALTER COLUMN "callServerId" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "calls" DROP COLUMN "scheduleDate"`);
    }

}

// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class fixCallUserIdFk1689284556695 implements MigrationInterface {
    name = 'fixCallUserIdFk1689284556695'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "callmembers" DROP CONSTRAINT "FK_732ccf51de042a4834592e2663d"`);
        await queryRunner.query(`ALTER TABLE "callmembers" ADD CONSTRAINT "FK_732ccf51de042a4834592e2663d" FOREIGN KEY ("callId") REFERENCES "calls"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "callmembers" DROP CONSTRAINT "FK_732ccf51de042a4834592e2663d"`);
        await queryRunner.query(`ALTER TABLE "callmembers" ADD CONSTRAINT "FK_732ccf51de042a4834592e2663d" FOREIGN KEY ("callId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}

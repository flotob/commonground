// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEmailVerificationCodes1721086629776 implements MigrationInterface {
    name = 'AddEmailVerificationCodes1721086629776'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "verificationCode" character varying(32)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "verificationCodeExpiration" TIMESTAMP(3) WITH TIME ZONE`);
        await queryRunner.query(`CREATE INDEX "idx_users_verification_codes" ON "users" ("verificationCode") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "verificationCodeExpiration"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "verificationCode"`);
        await queryRunner.query(`DROP INDEX "idx_users_verification_codes"`);
    }

}

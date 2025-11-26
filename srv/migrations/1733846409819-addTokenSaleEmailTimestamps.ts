// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTokenSaleEmailTimestamps1733846409819 implements MigrationInterface {
    name = 'AddTokenSaleEmailTimestamps1733846409819'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokensale_registrations" ADD "oneDayEmailSentAt" TIMESTAMP(3) WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "tokensale_registrations" ADD "startsNowEmailSentAt" TIMESTAMP(3) WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "tokensales" ADD "oneDayEmailSentAt" TIMESTAMP(3) WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "tokensales" ADD "startsNowEmailSentAt" TIMESTAMP(3) WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "tokensale_userdata" ADD "oneDayEmailSentAt" TIMESTAMP(3) WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "tokensale_userdata" ADD "startsNowEmailSentAt" TIMESTAMP(3) WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "tokensale_userdata" ADD "oneDayNotificationSentAt" TIMESTAMP(3) WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "tokensale_userdata" ADD "startsNowNotificationSentAt" TIMESTAMP(3) WITH TIME ZONE`);
        await queryRunner.query(`CREATE INDEX "IDX_5a636d1887721f3a6f15e0e182" ON "tokensale_userdata" ("oneDayEmailSentAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_4bfa531f9586c8511e535ab088" ON "tokensale_userdata" ("startsNowEmailSentAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_d1eaf55b9b3d9a97e494be14de" ON "tokensale_userdata" ("oneDayNotificationSentAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_762c86f63e7ba87c73d1c622fc" ON "tokensale_userdata" ("startsNowNotificationSentAt") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_762c86f63e7ba87c73d1c622fc"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d1eaf55b9b3d9a97e494be14de"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4bfa531f9586c8511e535ab088"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5a636d1887721f3a6f15e0e182"`);
        await queryRunner.query(`ALTER TABLE "tokensale_userdata" DROP COLUMN "startsNowNotificationSentAt"`);
        await queryRunner.query(`ALTER TABLE "tokensale_userdata" DROP COLUMN "oneDayNotificationSentAt"`);
        await queryRunner.query(`ALTER TABLE "tokensale_userdata" DROP COLUMN "startsNowEmailSentAt"`);
        await queryRunner.query(`ALTER TABLE "tokensale_userdata" DROP COLUMN "oneDayEmailSentAt"`);
        await queryRunner.query(`ALTER TABLE "tokensales" DROP COLUMN "startsNowEmailSentAt"`);
        await queryRunner.query(`ALTER TABLE "tokensales" DROP COLUMN "oneDayEmailSentAt"`);
        await queryRunner.query(`ALTER TABLE "tokensale_registrations" DROP COLUMN "startsNowEmailSentAt"`);
        await queryRunner.query(`ALTER TABLE "tokensale_registrations" DROP COLUMN "oneDayEmailSentAt"`);
    }

}

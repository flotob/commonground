// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";
import { grantToWriter } from "../util/migrationUtils";

export class accountReferrals1654275609570 implements MigrationInterface {
    name = 'accountReferrals1654275609570'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "referral" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "contingent" integer DEFAULT '0', "note" text NOT NULL DEFAULT '', "secret" character varying(20) NOT NULL, CONSTRAINT "UQ_5d1971c40f9d6c77b708cdb39eb" UNIQUE ("secret"), CONSTRAINT "PK_a2d3e935a6591168066defec5ad" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "accounts" ADD "referral_id" uuid`);
        await queryRunner.query(`CREATE INDEX "idx_account_referral" ON "accounts" ("referral_id") `);
        await queryRunner.query(`ALTER TABLE "accounts" ADD CONSTRAINT "FK_14160da127fa09244c4efbffc27" FOREIGN KEY ("referral_id") REFERENCES "referral"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await grantToWriter(queryRunner, 'referral', 'SELECT');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "accounts" DROP CONSTRAINT "FK_14160da127fa09244c4efbffc27"`);
        await queryRunner.query(`DROP INDEX "public"."idx_account_referral"`);
        await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "referral_id"`);
        await queryRunner.query(`DROP TABLE "referral"`);
    }

}

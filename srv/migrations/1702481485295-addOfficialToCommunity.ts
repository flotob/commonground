// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOfficialToCommunity1702481485295 implements MigrationInterface {
    name = 'AddOfficialToCommunity1702481485295'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "communities" ADD "official" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`UPDATE "communities" SET "updatedAt" = now()`);
        await queryRunner.query(`ALTER TYPE "public"."calls_type_enum" RENAME TO "calls_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."calls_calltype_enum" AS ENUM('default', 'broadcast')`);
        await queryRunner.query(`ALTER TABLE "calls" ALTER COLUMN "callType" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "calls" ALTER COLUMN "callType" TYPE "public"."calls_calltype_enum" USING "callType"::"text"::"public"."calls_calltype_enum"`);
        await queryRunner.query(`ALTER TABLE "calls" ALTER COLUMN "callType" SET DEFAULT 'default'`);
        await queryRunner.query(`DROP TYPE "public"."calls_type_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."calls_type_enum_old" AS ENUM('default', 'broadcast')`);
        await queryRunner.query(`ALTER TABLE "calls" ALTER COLUMN "callType" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "calls" ALTER COLUMN "callType" TYPE "public"."calls_type_enum_old" USING "callType"::"text"::"public"."calls_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "calls" ALTER COLUMN "callType" SET DEFAULT 'default'`);
        await queryRunner.query(`DROP TYPE "public"."calls_calltype_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."calls_type_enum_old" RENAME TO "calls_type_enum"`);
        await queryRunner.query(`ALTER TABLE "communities" DROP COLUMN "official"`);
    }

}

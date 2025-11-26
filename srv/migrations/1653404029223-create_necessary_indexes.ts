// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class createNecessaryIndexes1653404029223 implements MigrationInterface {
    name = 'createNecessaryIndexes1653404029223'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "trust"`);
        await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "required_dm_trust"`);
        await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "txcount_brought"`);
        await queryRunner.query(`ALTER TYPE "public"."groupaccess_accesslevel_enum" RENAME TO "groupaccess_accesslevel_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."groupaccess_accesslevel_enum" AS ENUM('admin', 'moderator', 'editor', 'user')`);
        await queryRunner.query(`ALTER TABLE "groupaccess" ALTER COLUMN "accesslevel" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "groupaccess" ALTER COLUMN "accesslevel" TYPE "public"."groupaccess_accesslevel_enum" USING "accesslevel"::"text"::"public"."groupaccess_accesslevel_enum"`);
        await queryRunner.query(`ALTER TABLE "groupaccess" ALTER COLUMN "accesslevel" SET DEFAULT 'user'`);
        await queryRunner.query(`DROP TYPE "public"."groupaccess_accesslevel_enum_old"`);
        await queryRunner.query(`CREATE INDEX "idx_areas_group_id" ON "areas" ("group_id") `);
        await queryRunner.query(`CREATE INDEX "idx_channels_area_id" ON "channels" ("area_id") `);
        await queryRunner.query(`CREATE INDEX "idx_followers_account_id" ON "followers" ("account_id") `);
        await queryRunner.query(`CREATE INDEX "idx_followers_other_account_id" ON "followers" ("other_account_id") `);
        await queryRunner.query(`CREATE INDEX "idx_linkedaddresses_account_id" ON "linkedaddresses" ("account_id") `);
        await queryRunner.query(`CREATE INDEX "idx_messages_from_id" ON "messages" ("from_id") `);
        await queryRunner.query(`CREATE INDEX "idx_messages_to_id" ON "messages" ("to_id") `);
        await queryRunner.query(`ALTER TABLE "followers" ADD CONSTRAINT "followers_account_id_other_account_id_key" UNIQUE ("account_id", "other_account_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}

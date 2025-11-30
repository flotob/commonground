// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";
import { grantTablePermissions } from "./migrationUtils";

export class reworkedDbStructure1653299352345 implements MigrationInterface {
    name = 'reworkedDbStructure1653299352345'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_posts_channel_group"`);
        await queryRunner.query(`ALTER TABLE "areaaccess" DROP CONSTRAINT "FK_3922480d401b1caf30bb01d0b3d"`);
        await queryRunner.query(`ALTER TABLE "areaaccess" DROP CONSTRAINT "areaaccess_linkedaddress_id_area_id_key"`);
        await queryRunner.query(`ALTER TABLE "linkedaddresses" RENAME COLUMN "public" TO "visibility"`);
        await queryRunner.query(`CREATE TABLE "followers" ("account_id" uuid NOT NULL, "other_account_id" uuid NOT NULL, CONSTRAINT "followers_account_id_other_account_id_key" UNIQUE ("account_id", "other_account_id"), CONSTRAINT "PK_860aae07a6f1f4af6440e6e8f0f" PRIMARY KEY ("account_id", "other_account_id"))`);
        await queryRunner.query(`ALTER TABLE "groups" DROP COLUMN "access_changed"`);
        await queryRunner.query(`ALTER TABLE "channels" DROP COLUMN "access_changed"`);
        await queryRunner.query(`ALTER TABLE "areaaccess" DROP COLUMN "rules"`);
        await queryRunner.query(`ALTER TABLE "areaaccess" DROP COLUMN "linkedaddress_id"`);
        await queryRunner.query(`ALTER TABLE "groupaccess" DROP COLUMN "updated_at_block"`);
        await queryRunner.query(`ALTER TABLE "areas" ADD "accessrules" jsonb`);
        await queryRunner.query(`CREATE TYPE "public"."groupblocks_blockstate_enum" AS ENUM('mute', 'banned')`);
        await queryRunner.query(`ALTER TABLE "groupblocks" ADD "blockstate" "public"."groupblocks_blockstate_enum" NOT NULL`);
        await queryRunner.query(`ALTER TABLE "linkedaddresses" DROP COLUMN "visibility"`);
        await queryRunner.query(`CREATE TYPE "public"."linkedaddresses_visibility_enum" AS ENUM('private', 'followed', 'public')`);
        await queryRunner.query(`ALTER TABLE "linkedaddresses" ADD "visibility" "public"."linkedaddresses_visibility_enum" NOT NULL DEFAULT 'private'`);
        await queryRunner.query(`ALTER TABLE "areaaccess" ADD CONSTRAINT "areaaccess_account_id_area_id_key" UNIQUE ("account_id", "area_id")`);
        await queryRunner.query(`ALTER TABLE "followers" ADD CONSTRAINT "FK_b6a72cf7486c31a3e53d7162107" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "followers" ADD CONSTRAINT "FK_abe8aebdc163a91f6c2287b43d1" FOREIGN KEY ("other_account_id") REFERENCES "accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`CREATE INDEX "idx_posts_channel" ON "posts" ((message->>'channelId')) `);
        await queryRunner.query(`DROP TABLE public.txcount`);
        await queryRunner.query(`DROP TABLE public.userblocks`);
        await grantTablePermissions(queryRunner, 'followers');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }
}

// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";
import { grantTablePermissions } from "./migrationUtils";

export class addDevicesReworkArticles1673893185971 implements MigrationInterface {
    name = 'addDevicesReworkArticles1673893185971'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "devices" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "created" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "publicKey" jsonb NOT NULL, "lastLogin" TIMESTAMP(3) WITH TIME ZONE DEFAULT now(), "accountId" uuid, CONSTRAINT "PK_b1514758245c12daf43486dd1f0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "devices" ADD CONSTRAINT "FK_c26a6d5e10ecd1be5182facadaa" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

        await queryRunner.query(`ALTER TABLE "articles" ADD "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "articles" ADD "deletedAt" TIMESTAMP(3)`);

        await queryRunner.query(`UPDATE "articles" SET "deletedAt" = now() WHERE deleted = TRUE`);
        await queryRunner.query(`UPDATE "articles" SET "updatedAt" = last_update`);

        await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN "last_update"`);
        await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN "deleted"`);

        await queryRunner.query(`ALTER TABLE "articles" RENAME "header_image_id" TO "headerImageId"`);
        await queryRunner.query(`ALTER TABLE "articles" RENAME "thumbnail_image_id" TO "thumbnailImageId"`);

        await grantTablePermissions(queryRunner, 'devices');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "devices" DROP CONSTRAINT "FK_c26a6d5e10ecd1be5182facadaa"`);
        await queryRunner.query(`DROP TABLE "devices"`);

        await queryRunner.query(`ALTER TABLE "articles" ADD "deleted" boolean DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "articles" ADD "last_update" TIMESTAMP(3) WITH TIME ZONE DEFAULT now()`);
        
        await queryRunner.query(`UPDATE "articles" SET deleted = TRUE WHERE "deletedAt" IS NOT NULL`);
        await queryRunner.query(`UPDATE "articles" SET last_update = "updatedAt"`);

        await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN "updatedAt"`);

        await queryRunner.query(`ALTER TABLE "articles" RENAME "headerImageId" TO "header_image_id"`);
        await queryRunner.query(`ALTER TABLE "articles" RENAME "thumbnailImageId" TO "thumbnail_image_id"`);
    }

}

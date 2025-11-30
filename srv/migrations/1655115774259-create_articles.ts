// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";
import { grantTablePermissions } from "../util/migrationUtils";

export class createArticles1655115774259 implements MigrationInterface {
    name = 'createArticles1655115774259'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."articles_state_enum" AS ENUM('published', 'draft')`);
        await queryRunner.query(`CREATE TYPE "public"."articles_visibility_enum" AS ENUM('public', 'community', 'areas')`);
        await queryRunner.query(`CREATE TYPE "public"."articles_type_enum" AS ENUM('article', 'announcement')`);
        await queryRunner.query(`CREATE TABLE "articles" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "header_image_id" character varying(64) DEFAULT NULL, "title" character varying(256) NOT NULL, "content" jsonb NOT NULL, "state" "public"."articles_state_enum" NOT NULL DEFAULT 'draft', "visibility" "public"."articles_visibility_enum" NOT NULL DEFAULT 'public', "type" "public"."articles_type_enum" NOT NULL DEFAULT 'article', "published" TIMESTAMP(3) WITH TIME ZONE DEFAULT now(), "group_id" character varying(10) NOT NULL, "creator" uuid NOT NULL, CONSTRAINT "PK_0a6e2c450d83e0b6052c2793334" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "areaarticles" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "article_id" uuid NOT NULL, "area_id" character varying(14) NOT NULL, CONSTRAINT "areaarticles_area_id_article_id_key" UNIQUE ("area_id", "article_id"), CONSTRAINT "PK_b0e2b1ea47f961c38b965657c1e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_areaarticles_area_id" ON "areaarticles" ("area_id") `);
        await queryRunner.query(`ALTER TABLE "articles" ADD CONSTRAINT "FK_c670626555952c5baf8dbb30e7b" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "articles" ADD CONSTRAINT "FK_6d0e4d8e4b82ed4ee18ebc01833" FOREIGN KEY ("creator") REFERENCES "accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "areaarticles" ADD CONSTRAINT "FK_000d7bfd34ee06528230262769f" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "areaarticles" ADD CONSTRAINT "FK_1f3a7b480209ffd1fa4144708be" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    
        await grantTablePermissions(queryRunner, 'articles');
        await grantTablePermissions(queryRunner, 'areaarticles');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "areaarticles" DROP CONSTRAINT "FK_1f3a7b480209ffd1fa4144708be"`);
        await queryRunner.query(`ALTER TABLE "areaarticles" DROP CONSTRAINT "FK_000d7bfd34ee06528230262769f"`);
        await queryRunner.query(`ALTER TABLE "articles" DROP CONSTRAINT "FK_6d0e4d8e4b82ed4ee18ebc01833"`);
        await queryRunner.query(`ALTER TABLE "articles" DROP CONSTRAINT "FK_c670626555952c5baf8dbb30e7b"`);
        await queryRunner.query(`DROP INDEX "public"."idx_areaarticles_area_id"`);
        await queryRunner.query(`DROP TABLE "areaarticles"`);
        await queryRunner.query(`DROP TABLE "articles"`);
        await queryRunner.query(`DROP TYPE "public"."articles_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."articles_visibility_enum"`);
        await queryRunner.query(`DROP TYPE "public"."articles_state_enum"`);
    }

}

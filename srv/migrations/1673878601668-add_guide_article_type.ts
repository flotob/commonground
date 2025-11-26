// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class addGuideArticleType1673878601668 implements MigrationInterface {
    name = 'addGuideArticleType1673878601668'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."articles_type_enum" RENAME TO "articles_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."articles_type_enum" AS ENUM('article', 'announcement', 'guide')`);
        await queryRunner.query(`ALTER TABLE "articles" ALTER COLUMN "type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "articles" ALTER COLUMN "type" TYPE "public"."articles_type_enum" USING "type"::"text"::"public"."articles_type_enum"`);
        await queryRunner.query(`ALTER TABLE "articles" ALTER COLUMN "type" SET DEFAULT 'article'`);
        await queryRunner.query(`DROP TYPE "public"."articles_type_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."articles_type_enum_old" AS ENUM('article', 'announcement')`);
        await queryRunner.query(`ALTER TABLE "articles" ALTER COLUMN "type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "articles" ALTER COLUMN "type" TYPE "public"."articles_type_enum_old" USING "type"::"text"::"public"."articles_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "articles" ALTER COLUMN "type" SET DEFAULT 'article'`);
        await queryRunner.query(`DROP TYPE "public"."articles_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."articles_type_enum_old" RENAME TO "articles_type_enum"`);
    }

}

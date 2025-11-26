// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class improveArticlesSearch1656511142293 implements MigrationInterface {
    name = 'improveArticlesSearch1656511142293'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "articles" ADD "tsv_title" tsvector DEFAULT to_tsvector('simple', '')`);
        await queryRunner.query(`ALTER TABLE "articles" ADD "tsv_content" tsvector DEFAULT to_tsvector('simple', '')`);
        await queryRunner.query(`ALTER TABLE "articles" ADD "tsv_title_and_content" tsvector DEFAULT to_tsvector('simple', '')`);
        await queryRunner.query(`ALTER TABLE "groups" ALTER COLUMN "tsv_description" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "groups" ALTER COLUMN "tsv_description" SET DEFAULT to_tsvector('simple', '')`);
        await queryRunner.query(`ALTER TABLE "groups" ALTER COLUMN "tsv_tags" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "groups" ALTER COLUMN "tsv_tags" SET DEFAULT to_tsvector('simple', '')`);
        await queryRunner.query(`ALTER TABLE "articles" ALTER COLUMN "tsv_tags" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "articles" ALTER COLUMN "tsv_tags" SET DEFAULT to_tsvector('simple', '')`);
        await queryRunner.query(`ALTER TABLE "posts" ALTER COLUMN "tsv_tags" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "posts" ALTER COLUMN "tsv_tags" SET DEFAULT to_tsvector('simple', '')`);
        await queryRunner.query(`CREATE INDEX "idx_articles_tsv_title" ON "articles" USING GIN("tsv_title") `);
        await queryRunner.query(`CREATE INDEX "idx_articles_tsv_content" ON "articles" USING GIN("tsv_content") `);
        await queryRunner.query(`CREATE INDEX "idx_articles_tsv_title_and_content" ON "articles" USING GIN("tsv_title_and_content") `);
        await queryRunner.query(`DROP TRIGGER IF EXISTS update_articles_tsvectors ON "public"."articles"`);
        await queryRunner.query(`DROP FUNCTION IF EXISTS "public"."articles_tsvector_update()"`);
        await queryRunner.query(`
            UPDATE "articles"
            SET tsv_title = to_tsvector('simple', COALESCE(title, '')),
                tsv_content = to_tsvector('simple', COALESCE(content->>'text', '')),
                tsv_title_and_content = setweight(to_tsvector('simple', COALESCE(title, '')), 'A') || setweight(to_tsvector('simple', COALESCE(content->>'text', '')), 'B');
        `);
        await queryRunner.query(`
        CREATE OR REPLACE FUNCTION articles_tsvector_update()
            RETURNS TRIGGER
            LANGUAGE 'plpgsql'
        AS $function$
        DECLARE
            tsv_title tsvector;
            tsv_content tsvector;
        BEGIN
            SELECT to_tsvector('simple', COALESCE(NEW.title, '')) INTO tsv_title;
            SELECT to_tsvector('simple', COALESCE(NEW.content->>'text', '')) INTO tsv_content;
            IF TG_OP = 'INSERT' THEN
                NEW.tsv_tags = to_tsvector('simple', COALESCE(array_to_json(NEW.tags), '[]'::JSON));
                NEW.tsv_title = tsv_title;
                NEW.tsv_content = tsv_content;
                NEW.tsv_title_and_content = setweight(tsv_title, 'A') || setweight(tsv_content, 'B');
            END IF;
            IF TG_OP = 'UPDATE' THEN
                IF NEW.tags <> OLD.tags THEN
                    NEW.tsv_tags = to_tsvector('simple', COALESCE(array_to_json(NEW.tags), '[]'::JSON));
                END IF;
                IF NEW.title <> OLD.title OR NEW.content->>'text' <> OLD.content->>'text' THEN
                    IF NEW.title <> OLD.title THEN
                        NEW.tsv_title = tsv_title;
                    END IF;
                    IF NEW.content->>'text' <> OLD.content->>'text' THEN
                        NEW.tsv_content = tsv_content;
                    END IF;
                    NEW.tsv_title_and_content = setweight(tsv_title, 'A') || setweight(tsv_content, 'B');
                END IF;
            END IF;
            RETURN NEW;
        END;
        $function$;

        CREATE TRIGGER update_articles_tsvectors BEFORE INSERT OR UPDATE ON articles
        FOR EACH ROW EXECUTE PROCEDURE articles_tsvector_update();
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TRIGGER update_articles_tsvectors ON "public"."articles"`);
        await queryRunner.query(`DROP FUNCTION "public"."articles_tsvector_update()"`);
        await queryRunner.query(`DROP INDEX "public"."idx_articles_tsv_title_and_content"`);
        await queryRunner.query(`DROP INDEX "public"."idx_articles_tsv_content"`);
        await queryRunner.query(`DROP INDEX "public"."idx_articles_tsv_title"`);
        await queryRunner.query(`ALTER TABLE "posts" ALTER COLUMN "tsv_tags" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "posts" ALTER COLUMN "tsv_tags" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "articles" ALTER COLUMN "tsv_tags" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "articles" ALTER COLUMN "tsv_tags" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "groups" ALTER COLUMN "tsv_tags" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "groups" ALTER COLUMN "tsv_tags" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "groups" ALTER COLUMN "tsv_description" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "groups" ALTER COLUMN "tsv_description" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN "tsv_title_and_content"`);
        await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN "tsv_content"`);
        await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN "tsv_title"`);
    }

}

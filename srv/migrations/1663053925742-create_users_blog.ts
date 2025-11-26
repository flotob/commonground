// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class createUsersBlog1663053925742 implements MigrationInterface {
    name = 'createUsersBlog1663053925742'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."blogs_state_enum" AS ENUM('published', 'draft')`);
        await queryRunner.query(`CREATE TABLE "blogs" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "header_image_id" character varying(64) DEFAULT NULL, "thumbnail_image_id" character varying(64) DEFAULT NULL, "title" character varying(256) NOT NULL, "content" jsonb NOT NULL, "state" "public"."blogs_state_enum" NOT NULL DEFAULT 'draft', "published" TIMESTAMP(3) WITH TIME ZONE DEFAULT now(), "tags" text array, "tsv_tags" tsvector DEFAULT to_tsvector('simple', ''), "tsv_title" tsvector DEFAULT to_tsvector('simple', ''), "tsv_content" tsvector DEFAULT to_tsvector('simple', ''), "tsv_title_and_content" tsvector DEFAULT to_tsvector('simple', ''), "last_update" TIMESTAMP(3) WITH TIME ZONE DEFAULT now(), "deleted" boolean DEFAULT false, "creator" uuid NOT NULL, CONSTRAINT "PK_e113335f11c926da929a625f118" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_blogs_tsv_tags" ON "blogs" ("tsv_tags") `);
        await queryRunner.query(`CREATE INDEX "idx_blogs_tsv_title" ON "blogs" ("tsv_title") `);
        await queryRunner.query(`CREATE INDEX "idx_blogs_tsv_content" ON "blogs" ("tsv_content") `);
        await queryRunner.query(`CREATE INDEX "idx_blogs_tsv_title_and_content" ON "blogs" ("tsv_title_and_content") `);
        await queryRunner.query(`ALTER TABLE "accounts" ADD "blog_creator" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD CONSTRAINT "FK_5802695613d95d4285195ed302c" FOREIGN KEY ("creator") REFERENCES "accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION blogs_tsvector_update()
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

            CREATE TRIGGER update_blogs_tsvectors BEFORE INSERT OR UPDATE ON blogs
            FOR EACH ROW EXECUTE PROCEDURE blogs_tsvector_update();
        `);

        await queryRunner.query(`GRANT ALL PRIVILEGES ON "blogs" TO writer`);
        await queryRunner.query(`GRANT SELECT ON "blogs" TO reader`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TRIGGER update_blogs_tsvectors ON "public"."blogs"`);
        await queryRunner.query(`DROP FUNCTION "public"."blogs_tsvector_update()"`);
        await queryRunner.query(`ALTER TABLE "blogs" DROP CONSTRAINT "FK_5802695613d95d4285195ed302c"`);
        await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "blog_creator"`);
        await queryRunner.query(`DROP INDEX "public"."idx_blogs_tsv_title_and_content"`);
        await queryRunner.query(`DROP INDEX "public"."idx_blogs_tsv_content"`);
        await queryRunner.query(`DROP INDEX "public"."idx_blogs_tsv_title"`);
        await queryRunner.query(`DROP INDEX "public"."idx_blogs_tsv_tags"`);
        await queryRunner.query(`DROP TABLE "blogs"`);
        await queryRunner.query(`DROP TYPE "public"."blogs_state_enum"`);
    }

}

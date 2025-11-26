// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class addTagsIntoGroupsPostsArticles1656085644390 implements MigrationInterface {
    name = 'addTagsIntoGroupsPostsArticles1656085644390'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "groups" ADD "tsv_description" tsvector DEFAULT NULL`);
        await queryRunner.query(`ALTER TABLE "groups" ADD "tsv_tags" tsvector DEFAULT NULL`);
        await queryRunner.query(`ALTER TABLE "articles" ADD "tags" text array DEFAULT NULL`);
        await queryRunner.query(`ALTER TABLE "articles" ADD "tsv_tags" tsvector NOT NULL DEFAULT to_tsvector('simple', '')`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "tsv_tags" tsvector DEFAULT to_tsvector('simple', '')`);
        await queryRunner.query(`CREATE INDEX "idx_groups_tsv_description" ON "groups" USING GIN("tsv_description") `);
        await queryRunner.query(`CREATE INDEX "idx_groups_tsv_tags" ON "groups" USING GIN("tsv_tags") `);
        await queryRunner.query(`CREATE INDEX "idx_articles_tsv_tags" ON "articles" USING GIN("tsv_tags") `);
        await queryRunner.query(`CREATE INDEX "idx_posts_tsv_tags" ON "posts" USING GIN("tsv_tags") `);

        await queryRunner.query(`
            UPDATE "groups"
            SET tsv_description = to_tsvector('simple', COALESCE(info->>'description', '')),
                tsv_tags = to_tsvector('simple', COALESCE(info->'tags', '[]'::JSONB));
        `);

        await queryRunner.query(`
            update "posts" p1
            set tsv_tags = to_tsvector('simple', t2.val)
            from ( 
                select array_to_json(array_agg(t1->>'value')) as val, p2.id
                from "posts" p2, jsonb_array_elements(p2.message->'body'->'content') t1
                where t1->>'type' = 'tag'
                group by id
            ) t2
            where p1.id = t2.id;
        `);

        await queryRunner.query(`ALTER TABLE "groups" ALTER COLUMN "tsv_description" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "groups" ALTER COLUMN "tsv_description" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "groups" ALTER COLUMN "tsv_tags" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "groups" ALTER COLUMN "tsv_tags" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "articles" ALTER COLUMN "tsv_tags" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "posts" ALTER COLUMN "tsv_tags" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "posts" ALTER COLUMN "tsv_tags" SET NOT NULL`);

        // triggers
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION groups_tsvector_update()
                RETURNS TRIGGER
                LANGUAGE 'plpgsql'
            AS $function$
            BEGIN
                IF TG_OP = 'INSERT' THEN
                    NEW.tsv_description = to_tsvector('simple', COALESCE(NEW.info->>'description', ''));
                    NEW.tsv_tags = to_tsvector('simple', COALESCE(NEW.info->'tags', '[]'::JSONB));
                END IF;
                IF TG_OP = 'UPDATE' THEN
                    IF NEW.info->>'description' <> OLD.info->>'description' THEN
                        NEW.tsv_description = to_tsvector('simple', COALESCE(NEW.info->>'description', ''));
                    END IF;
                    IF COALESCE(NEW.info->>'tags','[]') <> COALESCE(OLD.info->>'tags','[]') THEN
                        NEW.tsv_tags = to_tsvector('simple', COALESCE(NEW.info->'tags', '[]'::JSONB));
                    END IF;
                END IF;
                RETURN NEW;
            END;
            $function$;
            
            CREATE TRIGGER update_groups_tsvectors BEFORE INSERT OR UPDATE ON groups
            FOR EACH ROW EXECUTE PROCEDURE groups_tsvector_update();
        `);
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION articles_tsvector_update()
                RETURNS TRIGGER
                LANGUAGE 'plpgsql'
            AS $function$
            BEGIN
                IF TG_OP = 'INSERT' THEN
                    NEW.tsv_tags = to_tsvector('simple', COALESCE(array_to_json(NEW.tags), '[]'::JSON));
                END IF;
                IF TG_OP = 'UPDATE' THEN
                    IF NEW.tags <> OLD.tags THEN
                        NEW.tsv_tags = to_tsvector('simple', COALESCE(array_to_json(NEW.tags), '[]'::JSON));
                    END IF;
                END IF;
                RETURN NEW;
            END;
            $function$;

            CREATE TRIGGER update_articles_tsvectors BEFORE INSERT OR UPDATE ON articles
            FOR EACH ROW EXECUTE PROCEDURE articles_tsvector_update();
        `);
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION posts_tsvector_update()
                RETURNS TRIGGER
                LANGUAGE 'plpgsql'
            AS $function$
            DECLARE
                new_tags jsonb;
                old_tags jsonb;
            BEGIN
                SELECT INTO new_tags jsonb_build_object('tags', COALESCE(array_agg(message_pieces->>'value'),'{}'))
                FROM (
                    SELECT jsonb_array_elements(NEW.message->'body'->'content')
                )_(message_pieces)
                WHERE message_pieces->>'type' = 'tag';

                IF TG_OP = 'INSERT' THEN
                    NEW.tsv_tags = to_tsvector('simple', COALESCE(new_tags->>'tags', '[]'));
                END IF;
                IF TG_OP = 'UPDATE' THEN
                    SELECT INTO old_tags jsonb_build_object('tags', COALESCE(array_agg(old_message_pieces->>'value'),'{}'))
                    FROM (
                        SELECT jsonb_array_elements(OLD.message->'body'->'content')
                    )_(old_message_pieces)
                    WHERE message_pieces->>'type' = 'tag';

                    IF new_tags->>'tags' <> old_tags->>'tags' THEN
                        NEW.tsv_tags = to_tsvector('simple', COALESCE(new_tags->>'tags', '[]'));
                    END IF;
                END IF;
                RETURN NEW;
            END;
            $function$;

            CREATE TRIGGER update_posts_tsvectors BEFORE INSERT OR UPDATE ON posts
            FOR EACH ROW EXECUTE PROCEDURE posts_tsvector_update(); 
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TRIGGER update_groups_tsvectors ON "public"."groups"`);
        await queryRunner.query(`DROP TRIGGER update_articles_tsvectors ON "public"."articles"`);
        await queryRunner.query(`DROP TRIGGER update_posts_tsvectors ON "public"."posts"`);
        await queryRunner.query(`DROP FUNCTION "public"."groups_tsvector_update()"`);
        await queryRunner.query(`DROP FUNCTION "public"."articles_tsvector_update()"`);
        await queryRunner.query(`DROP FUNCTION "public"."posts_tsvector_update()"`);
        await queryRunner.query(`DROP INDEX "public"."idx_posts_tsv_tags"`);
        await queryRunner.query(`DROP INDEX "public"."idx_articles_tsv_tags"`);
        await queryRunner.query(`DROP INDEX "public"."idx_groups_tsv_tags"`);
        await queryRunner.query(`DROP INDEX "public"."idx_groups_tsv_descrption"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "tsv_tags"`);
        await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN "tsv_tags"`);
        await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN "tags"`);
        await queryRunner.query(`ALTER TABLE "groups" DROP COLUMN "tsv_tags"`);
        await queryRunner.query(`ALTER TABLE "groups" DROP COLUMN "tsv_description"`);
    }

}

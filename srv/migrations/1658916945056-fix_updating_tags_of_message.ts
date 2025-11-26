// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm"

export class fixUpdatingTagsOfMessage1658916944976 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
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
                    WHERE old_message_pieces->>'type' = 'tag';

                    IF new_tags->>'tags' <> old_tags->>'tags' THEN
                        NEW.tsv_tags = to_tsvector('simple', COALESCE(new_tags->>'tags', '[]'));
                    END IF;
                END IF;
                RETURN NEW;
            END;
            $function$;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}

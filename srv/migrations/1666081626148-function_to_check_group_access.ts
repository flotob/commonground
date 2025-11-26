// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm"

export class functionToCheckGroupAccess1666081626082 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION is_user_blocked(userId uuid, groupId TEXT)
                RETURNS BOOLEAN
                LANGUAGE 'plpgsql'
            AS $function$
            BEGIN
                RETURN EXISTS (
                    SELECT 1 FROM groupblocks gb
                    WHERE gb.deleted = FALSE AND
                        gb.account_id = $1 AND
                        gb.group_id = $2 AND
                        gb.blockstate = 'banned' AND
                        (gb.until IS NULL OR gb.until > now())
                );
            END;
            $function$;
        `);
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION has_user_community_access(userId uuid, groupId TEXT)
                RETURNS BOOLEAN
                LANGUAGE 'plpgsql'
            AS $function$
            BEGIN
                RETURN EXISTS (
                    SELECT 1 FROM groupaccess ga
                    WHERE ga.deleted = FALSE AND
                        ga.account_id = $1 AND
                        ga.group_id = $2 AND
                        NOT is_user_blocked($1, $2)
                );
            END;
            $function$;
        `);
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION has_user_community_access(userId uuid, groupId TEXT, acceptableRoles groupaccess_accesslevel_enum[])
                RETURNS BOOLEAN
                LANGUAGE 'plpgsql'
            AS $function$
            BEGIN
                RETURN EXISTS (
                    SELECT 1 FROM groupaccess ga
                    WHERE ga.deleted = FALSE AND
                        ga.account_id = $1 AND
                        ga.group_id = $2 AND
                        NOT is_user_blocked($1, $2) AND
                        ARRAY[ga.accesslevel] <@ $3
                );
            END;
            $function$;
        `);
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION is_community_public_or_user_has_access(userId uuid, groupId TEXT)
                RETURNS BOOLEAN
                LANGUAGE 'plpgsql'
            AS $function$
            BEGIN
                RETURN EXISTS (
                    SELECT 1 FROM groups g
                    WHERE g.deleted = FALSE AND g.id = $2 AND
                        (g.nft_id IS NOT NULL OR has_user_community_access($1, g.id))
                );
            END;
            $function$;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP FUNCTION "public"."is_community_public_or_user_has_access(uuid, TEXT)"`);
        await queryRunner.query(`DROP FUNCTION "public"."has_user_community_access(uuid, TEXT, groupaccess_accesslevel_enum[])"`);
        await queryRunner.query(`DROP FUNCTION "public"."has_user_community_access(uuid, TEXT)"`);
        await queryRunner.query(`DROP FUNCTION "public"."is_user_blocked(uuid, TEXT)"`);
    }
}

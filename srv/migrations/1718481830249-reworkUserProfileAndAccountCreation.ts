// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class ReworkUserProfileAndAccountCreation1718481830249 implements MigrationInterface {
    name = 'ReworkUserProfileAndAccountCreation1718481830249'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."user_accounts_type_enum" RENAME TO "user_accounts_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."user_accounts_type_enum" AS ENUM('twitter', 'lukso', 'cg')`);
        await queryRunner.query(`ALTER TABLE "user_accounts" ALTER COLUMN "type" TYPE "public"."user_accounts_type_enum" USING "type"::"text"::"public"."user_accounts_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."user_accounts_type_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."users_displayaccount_enum" RENAME TO "users_displayaccount_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."users_displayaccount_enum" AS ENUM('twitter', 'lukso', 'cg')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "displayAccount" TYPE "public"."users_displayaccount_enum" USING "displayAccount"::"text"::"public"."users_displayaccount_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_displayaccount_enum_old"`);
        await queryRunner.query(`ALTER TABLE "user_accounts" ADD "extraData" jsonb`);
        await queryRunner.query(`ALTER TABLE "users" ADD "platformBan" jsonb`);
        await queryRunner.query(`DROP INDEX "idx_user_accounts_lower_id"`);
        await queryRunner.query(`CREATE INDEX "idx_user_accounts_type_lower_id" ON "user_accounts" ("type", LOWER("data"->>'id'))`);

        // replace trigger function, remove alias
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION notify_user_data_change() RETURNS trigger AS $$
            DECLARE
            BEGIN
              IF TG_OP = 'INSERT'
              THEN
                PERFORM pg_notify('userdatachange',
                    json_build_object(
                        'type', 'userdatachange',
                        'userId', NEW.id,
                        'onlineStatus', NEW."onlineStatus",
                        'displayAccount', NEW."displayAccount",
                        'accounts', coalesce((
                        SELECT json_agg(json_build_object(
                            'displayName', "displayName",
                            'type', "type"
                        ))
                        FROM user_accounts
                        WHERE "userId" = NEW.id
                        ), '[]'::json)
                    )::text
                );
              ELSIF TG_OP = 'UPDATE'
              THEN
                IF NEW."displayAccount" <> OLD."displayAccount" OR NEW."onlineStatus" <> OLD."onlineStatus"
                THEN
                    PERFORM pg_notify('userdatachange',
                        json_build_object(
                        'type', 'userdatachange',
                        'userId', NEW.id,
                        'onlineStatus', NEW."onlineStatus",
                        'displayAccount', NEW."displayAccount",
                        'platformBan', NEW."platformBan",
                        'accounts', coalesce((
                            SELECT json_agg(json_build_object(
                            'displayName', "displayName",
                            'type', "type"
                            ))
                            FROM user_accounts
                            WHERE "userId" = NEW.id
                        ), '[]'::json)
                        )::text
                    );
                END IF;
              END IF;
      
              RETURN NEW;
            END;
            $$ LANGUAGE plpgsql
        `);

        await queryRunner.query(`
            UPDATE user_accounts
            SET "extraData" = jsonb_build_object(
                'type', 'lukso',
                'upAddress', "data"->>'id'
            )
            WHERE "type" = 'lukso'
        `);

        await queryRunner.query(`
            UPDATE user_accounts
            SET "data" = jsonb_set(data, '{type}', to_jsonb("type"::text))
        `);

        await queryRunner.query(`
            UPDATE wallets
            SET "visibility" = 'public'
            WHERE "type" = 'contract_evm'
              AND "chain" = 'lukso'
        `);

        await queryRunner.query(`
            INSERT INTO user_accounts (
                "type",
                "userId",
                "displayName",
                "imageId",
                "extraData"
            )
            SELECT
                'cg' AS "type",
                "id" AS "userId",
                coalesce("alias", '') AS "displayName",
                "imageId",
                jsonb_build_object(
                    'type', 'cg',
                    'description', coalesce("description", ''),
                    'homepage', coalesce("homepage", ''),
                    'links', "links"
                ) AS "extraData"
            FROM users
            RETURNING "userId"
        `);
        await queryRunner.query(`
            UPDATE users
            SET
                "updatedAt" = now(),
                "displayAccount" = 'cg'
            WHERE "displayAccount" IS NULL
               OR NOT EXISTS (SELECT 1 FROM user_accounts WHERE "userId" = users.id AND "type"::text = users."displayAccount"::text AND "deletedAt" IS NULL)
        `);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_user_accounts_cg_unique_displayName" ON user_accounts (
            (CASE
                WHEN "type" = 'cg'
                THEN 'cg'
                ELSE NULL
            END),
            (CASE
                WHEN "type" = 'cg' AND "displayName" <> ''
                THEN LOWER("displayName")
                ELSE NULL
            END)
        )`);

        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "alias"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "imageId"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "links"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "homepage"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "displayAccount" SET NOT NULL`);

        // fix user update function
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION public.validate_community_order()
            RETURNS trigger
            LANGUAGE plpgsql
            AS $function$
                DECLARE
                    arrays_are_equal BOOLEAN;
                    membership_array UUID[];
                BEGIN
                    IF NOT (NEW."communityOrder" IS DISTINCT FROM OLD."communityOrder") THEN
                        RETURN NEW;
                    END IF;

                    IF NEW."communityOrder" @> OLD."communityOrder" AND OLD."communityOrder" @> NEW."communityOrder" THEN
                        RETURN NEW;
                    END IF;

                    SELECT ARRAY(
                        SELECT r."communityId"
                        FROM  roles_users_users ruu
                        INNER JOIN roles r
                            ON  r.id = ruu."roleId"
                            AND r.title = 'Member'
                            AND r.type = 'PREDEFINED'::"public"."roles_type_enum"
                        WHERE ruu.claimed = TRUE
                            AND ruu."userId" = NEW.id
                    ) INTO membership_array;
                
                    IF  (array_length(NEW."communityOrder", 1) = 0) AND
                        (membership_array IS NULL OR array_length(membership_array, 1) IS NULL)
                    THEN
                        arrays_are_equal := TRUE;
                    ELSE
                        SELECT (
                            SELECT COUNT(*) FROM (
                                (SELECT UNNEST(NEW."communityOrder") EXCEPT SELECT UNNEST(membership_array))
                                UNION ALL
                                (SELECT UNNEST(membership_array) EXCEPT SELECT UNNEST(NEW."communityOrder"))
                            ) AS differences
                        ) = 0 INTO arrays_are_equal;
                    END IF;

                    IF NOT arrays_are_equal THEN
                        RAISE EXCEPTION 'User.communityOrder must have exactly the same elements as the user has Member roles';
                    END IF;

                    RETURN NEW;
                END;
                $function$
            ;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "displayAccount" DROP NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."users_displayaccount_enum_old" AS ENUM('twitter', 'lukso')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "displayAccount" TYPE "public"."users_displayaccount_enum_old" USING "displayAccount"::"text"::"public"."users_displayaccount_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."users_displayaccount_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."users_displayaccount_enum_old" RENAME TO "users_displayaccount_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."user_accounts_type_enum_old" AS ENUM('twitter', 'lukso')`);
        await queryRunner.query(`ALTER TABLE "user_accounts" ALTER COLUMN "type" TYPE "public"."user_accounts_type_enum_old" USING "type"::"text"::"public"."user_accounts_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."user_accounts_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."user_accounts_type_enum_old" RENAME TO "user_accounts_type_enum"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "imageId" character varying(64)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "alias" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "user_accounts" DROP COLUMN "extraData"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "platformBan"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "description" character varying(1000)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "homepage" character varying(256)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "links" jsonb NOT NULL DEFAULT '[]'`);
    }

}

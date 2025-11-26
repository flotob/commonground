// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFarcasterAccountType1722935183422 implements MigrationInterface {
    name = 'AddFarcasterAccountType1722935183422'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "idx_user_accounts_type_id"`);
        await queryRunner.query(`DROP INDEX "idx_user_accounts_type_lower_id"`);
        await queryRunner.query(`DROP INDEX "idx_user_accounts_cg_unique_displayName"`);
        await queryRunner.query(`ALTER TYPE "public"."user_accounts_type_enum" RENAME TO "user_accounts_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."user_accounts_type_enum" AS ENUM('twitter', 'lukso', 'cg', 'farcaster')`);
        await queryRunner.query(`ALTER TABLE "user_accounts" ALTER COLUMN "type" TYPE "public"."user_accounts_type_enum" USING "type"::"text"::"public"."user_accounts_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."user_accounts_type_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."users_displayaccount_enum" RENAME TO "users_displayaccount_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."users_displayaccount_enum" AS ENUM('twitter', 'lukso', 'cg', 'farcaster')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "displayAccount" TYPE "public"."users_displayaccount_enum" USING "displayAccount"::"text"::"public"."users_displayaccount_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_displayaccount_enum_old"`);
        await queryRunner.query(`CREATE INDEX "idx_user_accounts_type_id" ON "user_accounts" ("type", (data->>'id'))`);
        await queryRunner.query(`CREATE INDEX "idx_user_accounts_type_lower_id" ON "user_accounts" ("type", LOWER("data"->>'id'))`);
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
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "idx_user_accounts_type_id"`);
        await queryRunner.query(`DROP INDEX "idx_user_accounts_type_lower_id"`);
        await queryRunner.query(`DROP INDEX "idx_user_accounts_cg_unique_displayName"`);
        await queryRunner.query(`CREATE TYPE "public"."users_displayaccount_enum_old" AS ENUM('twitter', 'lukso', 'cg')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "displayAccount" TYPE "public"."users_displayaccount_enum_old" USING "displayAccount"::"text"::"public"."users_displayaccount_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."users_displayaccount_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."users_displayaccount_enum_old" RENAME TO "users_displayaccount_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."user_accounts_type_enum_old" AS ENUM('twitter', 'lukso', 'cg')`);
        await queryRunner.query(`ALTER TABLE "user_accounts" ALTER COLUMN "type" TYPE "public"."user_accounts_type_enum_old" USING "type"::"text"::"public"."user_accounts_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."user_accounts_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."user_accounts_type_enum_old" RENAME TO "user_accounts_type_enum"`);
        await queryRunner.query(`CREATE INDEX "idx_user_accounts_type_id" ON "user_accounts" ("type", (data->>'id'))`);
        await queryRunner.query(`CREATE INDEX "idx_user_accounts_type_lower_id" ON "user_accounts" ("type", LOWER("data"->>'id'))`);
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
    }

}

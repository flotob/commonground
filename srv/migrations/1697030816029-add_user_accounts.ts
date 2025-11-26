// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserAccounts1697030816029 implements MigrationInterface {
    name = 'AddUserAccounts1697030816029'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."user_accounts_type_enum" AS ENUM('twitter', 'lukso')`);
        await queryRunner.query(`CREATE TABLE "user_accounts" ("userId" uuid NOT NULL, "type" "public"."user_accounts_type_enum" NOT NULL, "displayName" character varying(255) NOT NULL, "imageId" character varying(64), "data" jsonb, "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP(3) WITH TIME ZONE, CONSTRAINT "PK_64bf489d974080d40b0a404062a" PRIMARY KEY ("userId", "type"))`);
        await queryRunner.query(`CREATE INDEX "IDX_e16c43f353aa7596f375245440" ON "user_accounts" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_e641f11bfd85dccb9b52aac92a" ON "user_accounts" ("deletedAt") `);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "twitterData"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "twitter"`);
        await queryRunner.query(`CREATE TYPE "public"."users_displayaccount_enum" AS ENUM('twitter', 'lukso')`);
        await queryRunner.query(`ALTER TABLE "users" ADD "displayAccount" "public"."users_displayaccount_enum"`);
        await queryRunner.query(`ALTER TABLE "user_accounts" ADD CONSTRAINT "FK_e16c43f353aa7596f375245440a" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "alias" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD "features" jsonb NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`CREATE INDEX "idx_user_accounts_type_id" ON "user_accounts" ("type", (data->>'id'))`);

        await queryRunner.query(`GRANT ALL PRIVILEGES ON "user_accounts" TO writer`);
        await queryRunner.query(`GRANT SELECT ON "user_accounts" TO reader`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_user_accounts_type_id"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "features"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "alias" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_accounts" DROP CONSTRAINT "FK_e16c43f353aa7596f375245440a"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "displayAccount"`);
        await queryRunner.query(`DROP TYPE "public"."users_displayaccount_enum"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "twitter" character varying(64)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "twitterData" jsonb`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e641f11bfd85dccb9b52aac92a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e16c43f353aa7596f375245440"`);
        await queryRunner.query(`DROP TABLE "user_accounts"`);
        await queryRunner.query(`DROP TYPE "public"."user_accounts_type_enum"`);
    }

}

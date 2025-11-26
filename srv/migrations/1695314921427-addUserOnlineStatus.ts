// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserOnlineStatus1695314921427 implements MigrationInterface {
    name = 'AddUserOnlineStatus1695314921427'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_onlinestatus_enum" AS ENUM('offline', 'online', 'away', 'dnd', 'invisible')`);
        await queryRunner.query(`ALTER TABLE "users" ADD "onlineStatus" "public"."users_onlinestatus_enum" NOT NULL DEFAULT 'offline'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "onlineStatusUpdatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "users" ADD "twitterData" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "twitterData"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "onlineStatusUpdatedAt"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "onlineStatus"`);
        await queryRunner.query(`DROP TYPE "public"."users_onlinestatus_enum"`);
    }

}

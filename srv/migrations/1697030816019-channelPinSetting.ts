// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";
import { grantTablePermissions } from "./migrationUtils";

export class ChannelPinSetting1697030816019 implements MigrationInterface {
    name = 'ChannelPinSetting1697030816019'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."user_channel_settings_pintype_enum" AS ENUM('autopin', 'permapin', 'never')`);
        await queryRunner.query(`CREATE TYPE "public"."user_channel_settings_notifytype_enum" AS ENUM('while_pinned', 'always', 'never')`);
        await queryRunner.query(`CREATE TABLE "user_channel_settings" ("userId" uuid NOT NULL, "channelId" uuid NOT NULL, "communityId" uuid NOT NULL, "pinType" "public"."user_channel_settings_pintype_enum" NOT NULL DEFAULT 'autopin', "notifyType" "public"."user_channel_settings_notifytype_enum" NOT NULL DEFAULT 'while_pinned', "pinnedUntil" TIMESTAMP(3) WITH TIME ZONE, "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_9009d9b1ed69144922ec05f2365" PRIMARY KEY ("userId", "channelId", "communityId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d473843db51768af4a7f1bb946" ON "user_channel_settings" ("userId") `);
        await queryRunner.query(`ALTER TABLE "user_channel_settings" ADD CONSTRAINT "FK_d473843db51768af4a7f1bb946f" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_channel_settings" ADD CONSTRAINT "FK_8a9567416724dbabbb2e7a0d302" FOREIGN KEY ("communityId", "channelId") REFERENCES "communities_channels"("communityId","channelId") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await grantTablePermissions(queryRunner, 'user_channel_settings');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_channel_settings" DROP CONSTRAINT "FK_8a9567416724dbabbb2e7a0d302"`);
        await queryRunner.query(`ALTER TABLE "user_channel_settings" DROP CONSTRAINT "FK_d473843db51768af4a7f1bb946f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d473843db51768af4a7f1bb946"`);
        await queryRunner.query(`DROP TABLE "user_channel_settings"`);
        await queryRunner.query(`DROP TYPE "public"."user_channel_settings_notifytype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."user_channel_settings_pintype_enum"`);
    }

}

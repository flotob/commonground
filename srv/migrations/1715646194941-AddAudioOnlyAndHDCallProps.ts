// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAudioOnlyAndHDCallProps1715646194941 implements MigrationInterface {
    name = 'AddAudioOnlyAndHDCallProps1715646194941'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "calls" ADD "audioOnly" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "calls" ADD "highQuality" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "calls" ADD "stageSlots" integer NOT NULL DEFAULT 5`);
        await queryRunner.query(`ALTER TABLE "calls" ALTER COLUMN "stageSlots" DROP DEFAULT`);
        await queryRunner.query(`UPDATE "calls" SET "audioOnly" = false, "highQuality" = false, "stageSlots" = 5, "updatedAt" = now()`);

        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION notify_call_change() RETURNS trigger AS $$
            DECLARE
            BEGIN
                PERFORM pg_notify('callchange',
                json_build_object(
                'type', 'callchange',
                'id', NEW.id,
                'communityId', NEW."communityId",
                'channelId', NEW."channelId",
                'callServerId', NEW."callServerId",
                'title', NEW."title",
                'description', NEW."description",
                'previewUserIds', NEW."previewUserIds",
                'slots', NEW."slots",
                'startedAt', NEW."startedAt",
                'updatedAt', NEW."updatedAt",
                'endedAt', NEW."endedAt",
                'stageSlots', NEW."stageSlots",
                'highQuality', NEW."highQuality",
                'audioOnly', NEW."audioOnly",
                'action', TG_OP
                )::text
                );
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "calls" DROP COLUMN "highQuality"`);
        await queryRunner.query(`ALTER TABLE "calls" DROP COLUMN "audioOnly"`);
        await queryRunner.query(`ALTER TABLE "calls" DROP COLUMN "stageSlots"`);
        
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION notify_call_change() RETURNS trigger AS $$
            DECLARE
            BEGIN
                PERFORM pg_notify('callchange',
                json_build_object(
                'type', 'callchange',
                'id', NEW.id,
                'communityId', NEW."communityId",
                'channelId', NEW."channelId",
                'callServerId', NEW."callServerId",
                'title', NEW."title",
                'description', NEW."description",
                'previewUserIds', NEW."previewUserIds",
                'slots', NEW."slots",
                'startedAt', NEW."startedAt",
                'updatedAt', NEW."updatedAt",
                'endedAt', NEW."endedAt",
                'action', TG_OP
                )::text
                );
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql
        `);
        await queryRunner.query(`
            CREATE TRIGGER call_update_notify
            AFTER INSERT OR UPDATE ON calls
            FOR EACH ROW EXECUTE FUNCTION notify_call_change()
        `);
    }

}

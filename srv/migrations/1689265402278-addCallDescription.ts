// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class addCallDescription1689265402278 implements MigrationInterface {
    name = 'addCallDescription1689265402278'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "calls" ADD "description" character varying(200)`);

        // update call notification trigger
        await queryRunner.query(`
            DROP TRIGGER call_update_notify ON calls
        `);
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

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "calls" DROP COLUMN "description"`);

        await queryRunner.query(`
            DROP TRIGGER call_update_notify ON calls
        `);
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

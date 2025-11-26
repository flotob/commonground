// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm"

export class CallUpdateEventsForCallServerFixed1723758694567 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
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

                IF TG_OP = 'UPDATE'
                AND NEW."endedAt" IS NULL
                AND (
                    OLD."slots" <> NEW."slots"
                    OR OLD."stageSlots" <> NEW."stageSlots"
                    OR OLD."highQuality" <> NEW."highQuality"
                    OR OLD."audioOnly" <> NEW."audioOnly"
                )
                THEN
                    PERFORM pg_notify('callservercallupdate_' || REPLACE(NEW."callServerId"::text, '-', '_'),
                    json_build_object(
                    'type', 'callservercallupdate_' || REPLACE(NEW."callServerId"::text, '-', '_'),
                    'callId', NEW.id,
                    'slots', NEW."slots",
                    'stageSlots', NEW."stageSlots",
                    'highQuality', NEW."highQuality",
                    'audioOnly', NEW."audioOnly"
                    )::text
                    );
                END IF;

                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}

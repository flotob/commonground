// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm"

export class addCallUpdateTriggers1688992107061 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "calls" ADD "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now()`);

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

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION notify_callserver_change() RETURNS trigger AS $$
      DECLARE
      BEGIN
        PERFORM pg_notify('callserverchange',
        json_build_object(
          'type', 'callserverchange',
          'id', NEW.id,
          'status', NEW."status",
          'url', NEW."url",
          'updatedAt', NEW."updatedAt",
          'action', TG_OP
        )::text
        );
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);
    await queryRunner.query(`
      CREATE TRIGGER callserver_update_notify
      AFTER INSERT OR UPDATE ON callservers
      FOR EACH ROW EXECUTE FUNCTION notify_callserver_change()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "calls" DROP COLUMN "updatedAt"`);

    await queryRunner.query(`
      DROP TRIGGER callserver_update_notify ON callservers
    `);
    await queryRunner.query(`
      DROP FUNCTION notify_callserver_change
    `);

    await queryRunner.query(`
      DROP TRIGGER call_update_notify ON calls
    `);
    await queryRunner.query(`
      DROP FUNCTION notify_call_change
    `);
  }
}

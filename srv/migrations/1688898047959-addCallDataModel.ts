// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface,
        QueryRunner } from "typeorm";
import { grantTablePermissions } from "../util/migrationUtils";

export class addCallDataModel1688898047959 implements MigrationInterface {
    name = 'addCallDataModel1688898047959'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "callservers" (
            "id" uuid NOT NULL DEFAULT gen_random_uuid(),
            "status" jsonb NOT NULL,
            "url" character varying(255) NOT NULL,
            "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(),
            "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(),
            "deletedAt" TIMESTAMP(3) WITH TIME ZONE,
            CONSTRAINT "PK_286fa45c0496167acf0eff1f35d" PRIMARY KEY ("id")
        )`);
        await grantTablePermissions(queryRunner, 'callservers');

        await queryRunner.query(`CREATE TABLE "calls" (
            "id" uuid NOT NULL DEFAULT gen_random_uuid(),
            "communityId" uuid NOT NULL,
            "channelId" uuid NOT NULL,
            "callServerId" uuid NOT NULL,
            "title" character varying(100) NOT NULL,
            "previewUserIds" uuid array NOT NULL,
            "slots" integer NOT NULL DEFAULT '100',
            "startedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(),
            "endedAt" TIMESTAMP(3) WITH TIME ZONE,
            CONSTRAINT "PK_d9171d91f8dd1a649659f1b6a20" PRIMARY KEY ("id")
        )`);
        await grantTablePermissions(queryRunner, 'calls');

        await queryRunner.query(`CREATE TABLE "callmembers" (
            "id" uuid NOT NULL,
            "callId" uuid NOT NULL,
            "userId" uuid NOT NULL,
            "joinedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(),
            "leftAt" TIMESTAMP(3) WITH TIME ZONE,
            CONSTRAINT "PK_9fc8c9656510da9d4a8e56e66fd" PRIMARY KEY ("id")
        )`);
        await grantTablePermissions(queryRunner, 'callmembers');

        await queryRunner.query(`CREATE INDEX "IDX_bb44dfe2e05e56944dac0af199" ON "calls" ("communityId") `);
        await queryRunner.query(`CREATE INDEX "IDX_44a435e05ff55b1e38c3164472" ON "calls" ("channelId") `);
        await queryRunner.query(`CREATE INDEX "IDX_366fa6f16f23ae54890f36eda7" ON "calls" ("callServerId") `);
        await queryRunner.query(`ALTER TABLE "calls" ADD CONSTRAINT "FK_bb44dfe2e05e56944dac0af1990" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "calls" ADD CONSTRAINT "FK_44a435e05ff55b1e38c3164472b" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "calls" ADD CONSTRAINT "FK_366fa6f16f23ae54890f36eda7b" FOREIGN KEY ("callServerId") REFERENCES "callservers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`CREATE INDEX "IDX_732ccf51de042a4834592e2663" ON "callmembers" ("callId") `);
        await queryRunner.query(`CREATE INDEX "IDX_70948b81debb77b48a5f8cbe4e" ON "callmembers" ("userId") `);
        await queryRunner.query(`ALTER TABLE "callmembers" ADD CONSTRAINT "FK_732ccf51de042a4834592e2663d" FOREIGN KEY ("callId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "callmembers" ADD CONSTRAINT "FK_70948b81debb77b48a5f8cbe4e5" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);


        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION notify_callmember_change() RETURNS trigger AS $$
            DECLARE
            BEGIN
                PERFORM pg_notify('callmemberchange',
                json_build_object(
                    'type', 'callmemberchange',
                    'id', NEW.id,
                    'callId', NEW."callId",
                    'userId', NEW."userId",
                    'joinedAt', NEW."joinedAt",
                    'leftAt', NEW."leftAt",
                    'action', TG_OP
                )::text
                );
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql
        `);
        await queryRunner.query(`
            CREATE TRIGGER callmember_update_notify
            AFTER INSERT OR UPDATE ON callmembers
            FOR EACH ROW EXECUTE FUNCTION notify_callmember_change()
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TRIGGER callmember_update_notify ON callmembers
        `);
        await queryRunner.query(`
            DROP FUNCTION notify_callmember_change
        `);
        await queryRunner.query(`ALTER TABLE "callmembers" DROP CONSTRAINT "FK_70948b81debb77b48a5f8cbe4e5"`);
        await queryRunner.query(`ALTER TABLE "callmembers" DROP CONSTRAINT "FK_732ccf51de042a4834592e2663d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_70948b81debb77b48a5f8cbe4e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_732ccf51de042a4834592e2663"`);
        await queryRunner.query(`ALTER TABLE "calls" DROP CONSTRAINT "FK_366fa6f16f23ae54890f36eda7b"`);
        await queryRunner.query(`ALTER TABLE "calls" DROP CONSTRAINT "FK_44a435e05ff55b1e38c3164472b"`);
        await queryRunner.query(`ALTER TABLE "calls" DROP CONSTRAINT "FK_bb44dfe2e05e56944dac0af1990"`);
        await queryRunner.query(`DROP TABLE "callmembers"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_366fa6f16f23ae54890f36eda7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_44a435e05ff55b1e38c3164472"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bb44dfe2e05e56944dac0af199"`);
        await queryRunner.query(`DROP TABLE "calls"`);
        await queryRunner.query(`DROP TABLE "callservers"`);
    }

}

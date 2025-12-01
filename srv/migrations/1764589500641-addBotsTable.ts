// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBotsTable1764589500641 implements MigrationInterface {
    name = 'AddBotsTable1764589500641'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create bots table
        await queryRunner.query(`CREATE TABLE "bots" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" character varying(100) NOT NULL, "displayName" character varying(100) NOT NULL, "avatarId" character varying(64), "description" text, "ownerUserId" uuid NOT NULL, "webhookUrl" character varying(512), "webhookSecret" text, "tokenHash" text NOT NULL, "permissions" jsonb NOT NULL DEFAULT '{}', "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP(3) WITH TIME ZONE, CONSTRAINT "PK_8b1b0180229dec2cbfdf5e776e4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_7c54afdf0689dede9e499f1227" ON "bots" ("name") WHERE "deletedAt" IS NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_fa16e638367e1780ae65a67225" ON "bots" ("ownerUserId") `);

        // Create community_bots table
        await queryRunner.query(`CREATE TABLE "community_bots" ("communityId" uuid NOT NULL, "botId" uuid NOT NULL, "addedByUserId" uuid NOT NULL, "config" jsonb NOT NULL DEFAULT '{}', "enabledChannelIds" uuid array, "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP(3) WITH TIME ZONE, CONSTRAINT "PK_6865deb1ab3469ca36be88ff1ce" PRIMARY KEY ("communityId", "botId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0f461047d3a711c3199dd938b6" ON "community_bots" ("botId") `);

        // Add botId to messages and make creatorId nullable
        await queryRunner.query(`ALTER TABLE "messages" ADD "botId" uuid`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_cb1198160fa8652a25c293bc25f"`);
        await queryRunner.query(`ALTER TABLE "messages" ALTER COLUMN "creatorId" DROP NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_2c1ca8ff5f53cde61061633da2" ON "messages" ("botId") `);

        // Add CHECK constraint: messages must have either creatorId OR botId
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "CHK_messages_creator_or_bot" CHECK ("creatorId" IS NOT NULL OR "botId" IS NOT NULL)`);

        // Add foreign key constraints
        await queryRunner.query(`ALTER TABLE "bots" ADD CONSTRAINT "FK_fa16e638367e1780ae65a672252" FOREIGN KEY ("ownerUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_cb1198160fa8652a25c293bc25f" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_2c1ca8ff5f53cde61061633da2b" FOREIGN KEY ("botId") REFERENCES "bots"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "community_bots" ADD CONSTRAINT "FK_d4644f02a786a849f7db91f8f2a" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "community_bots" ADD CONSTRAINT "FK_0f461047d3a711c3199dd938b6c" FOREIGN KEY ("botId") REFERENCES "bots"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "community_bots" ADD CONSTRAINT "FK_0705660da2fce57cdee544635b6" FOREIGN KEY ("addedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);

        // Grant permissions
        await queryRunner.query(`GRANT ALL PRIVILEGES ON "bots" TO writer`);
        await queryRunner.query(`GRANT SELECT ON "bots" TO reader`);
        await queryRunner.query(`GRANT ALL PRIVILEGES ON "community_bots" TO writer`);
        await queryRunner.query(`GRANT SELECT ON "community_bots" TO reader`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE "community_bots" DROP CONSTRAINT "FK_0705660da2fce57cdee544635b6"`);
        await queryRunner.query(`ALTER TABLE "community_bots" DROP CONSTRAINT "FK_0f461047d3a711c3199dd938b6c"`);
        await queryRunner.query(`ALTER TABLE "community_bots" DROP CONSTRAINT "FK_d4644f02a786a849f7db91f8f2a"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_2c1ca8ff5f53cde61061633da2b"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_cb1198160fa8652a25c293bc25f"`);
        await queryRunner.query(`ALTER TABLE "bots" DROP CONSTRAINT "FK_fa16e638367e1780ae65a672252"`);

        // Drop CHECK constraint
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "CHK_messages_creator_or_bot"`);

        // Revert messages table changes
        await queryRunner.query(`DROP INDEX "public"."IDX_2c1ca8ff5f53cde61061633da2"`);
        await queryRunner.query(`ALTER TABLE "messages" ALTER COLUMN "creatorId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_cb1198160fa8652a25c293bc25f" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "botId"`);

        // Drop community_bots table
        await queryRunner.query(`DROP INDEX "public"."IDX_0f461047d3a711c3199dd938b6"`);
        await queryRunner.query(`DROP TABLE "community_bots"`);

        // Drop bots table
        await queryRunner.query(`DROP INDEX "public"."IDX_fa16e638367e1780ae65a67225"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7c54afdf0689dede9e499f1227"`);
        await queryRunner.query(`DROP TABLE "bots"`);
    }

}

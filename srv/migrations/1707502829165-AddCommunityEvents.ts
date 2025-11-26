// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCommunityEvents1707502829165 implements MigrationInterface {
    name = 'AddCommunityEvents1707502829165'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "communities_events" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "communityId" uuid NOT NULL, "url" character varying(30), "eventCreator" uuid NOT NULL, "imageId" character varying(64), "title" character varying(100) NOT NULL, "description" jsonb NOT NULL, "scheduleDate" TIMESTAMP(3) WITH TIME ZONE NOT NULL, "duration" integer, "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP(3) WITH TIME ZONE, CONSTRAINT "UQ_e189f5f50deb1fe2c3ba248bf44" UNIQUE ("communityId", "url"), CONSTRAINT "PK_8c06564a0f77e9094cb4c1be172" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_eb6a596220a9f059adb4a5271a" ON "communities_events" ("communityId") `);
        await queryRunner.query(`CREATE INDEX "IDX_960f04c8a9afd86fbe3dd16d19" ON "communities_events" ("eventCreator") `);
        await queryRunner.query(`CREATE TABLE "communities_events_participants" ("eventId" uuid NOT NULL, "userId" uuid NOT NULL, "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_15f3266620bf048b1a2d33fcf1c" PRIMARY KEY ("eventId", "userId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_e2bc410a141aba0db635a56bad" ON "communities_events_participants" ("eventId") `);
        await queryRunner.query(`CREATE INDEX "IDX_e351d9b4cf2bea1519f176322f" ON "communities_events_participants" ("userId") `);
        await queryRunner.query(`CREATE TYPE "public"."communities_events_permissions_permissions_enum" AS ENUM('EVENT_PREVIEW', 'EVENT_ATTEND', 'EVENT_MODERATE')`);
        await queryRunner.query(`CREATE TABLE "communities_events_permissions" ("communityEventId" uuid NOT NULL, "roleId" uuid NOT NULL, "permissions" "public"."communities_events_permissions_permissions_enum" array NOT NULL, CONSTRAINT "PK_58015810be5eaca3dfa081e3247" PRIMARY KEY ("communityEventId", "roleId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5446da51332b5bef78f784d7a9" ON "communities_events_permissions" ("communityEventId") `);
        await queryRunner.query(`CREATE INDEX "IDX_a6be21479ddccfdc5b71f9d4f8" ON "communities_events_permissions" ("roleId") `);
        await queryRunner.query(`ALTER TABLE "communities_events" ADD CONSTRAINT "FK_eb6a596220a9f059adb4a5271ab" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "communities_events" ADD CONSTRAINT "FK_960f04c8a9afd86fbe3dd16d192" FOREIGN KEY ("eventCreator") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "communities_events_participants" ADD CONSTRAINT "FK_e2bc410a141aba0db635a56bad3" FOREIGN KEY ("eventId") REFERENCES "communities_events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "communities_events_participants" ADD CONSTRAINT "FK_e351d9b4cf2bea1519f176322f2" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "communities_events_permissions" ADD CONSTRAINT "FK_5446da51332b5bef78f784d7a93" FOREIGN KEY ("communityEventId") REFERENCES "communities_events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "communities_events_permissions" ADD CONSTRAINT "FK_a6be21479ddccfdc5b71f9d4f8c" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

        await queryRunner.query(`ALTER TABLE "communities_events" ADD "callId" uuid`);
        await queryRunner.query(`ALTER TABLE "communities_events" ADD CONSTRAINT "UQ_2330151bad940d022d04566f7e7" UNIQUE ("callId")`);
        await queryRunner.query(`CREATE TYPE "public"."communities_events_type_enum" AS ENUM('call', 'broadcast', 'reminder')`);
        await queryRunner.query(`ALTER TABLE "communities_events" ADD "type" "public"."communities_events_type_enum" NOT NULL`);
        await queryRunner.query(`ALTER TABLE "communities_events" ADD CONSTRAINT "FK_2330151bad940d022d04566f7e7" FOREIGN KEY ("callId") REFERENCES "calls"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        
        await queryRunner.query(`GRANT ALL PRIVILEGES ON "communities_events" TO writer`);
        await queryRunner.query(`GRANT SELECT ON "communities_events" TO reader`);

        await queryRunner.query(`GRANT ALL PRIVILEGES ON "communities_events_participants" TO writer`);
        await queryRunner.query(`GRANT SELECT ON "communities_events_participants" TO reader`);

        await queryRunner.query(`GRANT ALL PRIVILEGES ON "communities_events_permissions" TO writer`);
        await queryRunner.query(`GRANT SELECT ON "communities_events_permissions" TO reader`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "communities_events" DROP CONSTRAINT "FK_2330151bad940d022d04566f7e7"`);
        await queryRunner.query(`ALTER TABLE "communities_events" DROP COLUMN "type"`);
        await queryRunner.query(`DROP TYPE "public"."communities_events_type_enum"`);
        await queryRunner.query(`ALTER TABLE "communities_events" DROP CONSTRAINT "UQ_2330151bad940d022d04566f7e7"`);
        await queryRunner.query(`ALTER TABLE "communities_events" DROP COLUMN "callId"`);
        
        await queryRunner.query(`ALTER TABLE "communities_events_permissions" DROP CONSTRAINT "FK_a6be21479ddccfdc5b71f9d4f8c"`);
        await queryRunner.query(`ALTER TABLE "communities_events_permissions" DROP CONSTRAINT "FK_5446da51332b5bef78f784d7a93"`);
        await queryRunner.query(`ALTER TABLE "communities_events_participants" DROP CONSTRAINT "FK_e351d9b4cf2bea1519f176322f2"`);
        await queryRunner.query(`ALTER TABLE "communities_events_participants" DROP CONSTRAINT "FK_e2bc410a141aba0db635a56bad3"`);
        await queryRunner.query(`ALTER TABLE "communities_events" DROP CONSTRAINT "FK_960f04c8a9afd86fbe3dd16d192"`);
        await queryRunner.query(`ALTER TABLE "communities_events" DROP CONSTRAINT "FK_eb6a596220a9f059adb4a5271ab"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a6be21479ddccfdc5b71f9d4f8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5446da51332b5bef78f784d7a9"`);
        await queryRunner.query(`DROP TABLE "communities_events_permissions"`);
        await queryRunner.query(`DROP TYPE "public"."communities_events_permissions_permissions_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e351d9b4cf2bea1519f176322f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e2bc410a141aba0db635a56bad"`);
        await queryRunner.query(`DROP TABLE "communities_events_participants"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_960f04c8a9afd86fbe3dd16d19"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_eb6a596220a9f059adb4a5271a"`);
        await queryRunner.query(`DROP TABLE "communities_events"`);
    }

}

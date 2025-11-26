// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCommunityEventsFields1719508518587 implements MigrationInterface {
    name = 'AddCommunityEventsFields1719508518587'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "communities_events" ADD "externalUrl" character varying(250)`);
        await queryRunner.query(`ALTER TABLE "communities_events" ADD "location" character varying(250)`);
        await queryRunner.query(`ALTER TYPE "public"."communities_events_type_enum" RENAME TO "communities_events_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."communities_events_type_enum" AS ENUM('call', 'broadcast', 'reminder', 'external')`);
        await queryRunner.query(`ALTER TABLE "communities_events" ALTER COLUMN "type" TYPE "public"."communities_events_type_enum" USING "type"::"text"::"public"."communities_events_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."communities_events_type_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."communities_events_type_enum_old" AS ENUM('call', 'broadcast', 'reminder')`);
        await queryRunner.query(`ALTER TABLE "communities_events" ALTER COLUMN "type" TYPE "public"."communities_events_type_enum_old" USING "type"::"text"::"public"."communities_events_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."communities_events_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."communities_events_type_enum_old" RENAME TO "communities_events_type_enum"`);
        await queryRunner.query(`ALTER TABLE "communities_events" DROP COLUMN "location"`);
        await queryRunner.query(`ALTER TABLE "communities_events" DROP COLUMN "externalUrl"`);
    }

}

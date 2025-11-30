// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";
import { grantTablePermissions } from "../util/migrationUtils";

export class addEventSchema1668647823135 implements MigrationInterface {
    name = 'addEventSchema1668647823135'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "events" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "type" character varying(32) NOT NULL DEFAULT NULL, "text" character varying(256) NOT NULL DEFAULT NULL, "created" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "read" boolean NOT NULL DEFAULT false, "click_data" jsonb DEFAULT NULL, "owner" uuid NOT NULL, "subject_user" uuid, "subject_group" character varying(10), CONSTRAINT "PK_40731c7151fe4be3116e45ddf73" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_event_owner" ON "events" ("owner") `);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_9d5126cf69cc3899bed7f62ba28" FOREIGN KEY ("owner") REFERENCES "accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_d05bc4893a9526dc481435edb86" FOREIGN KEY ("subject_user") REFERENCES "accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_49477f556b2fb265e5fb08bcd22" FOREIGN KEY ("subject_group") REFERENCES "groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

        await grantTablePermissions(queryRunner, 'events');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_49477f556b2fb265e5fb08bcd22"`);
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_d05bc4893a9526dc481435edb86"`);
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_9d5126cf69cc3899bed7f62ba28"`);
        await queryRunner.query(`DROP INDEX "public"."idx_event_owner"`);
        await queryRunner.query(`DROP TABLE "events"`);
    }

}

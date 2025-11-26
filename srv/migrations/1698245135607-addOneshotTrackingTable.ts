// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOneshotTrackingTable1698245135607 implements MigrationInterface {
    name = 'AddOneshotTrackingTable1698245135607'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "oneshot_jobs" ("id" character varying(256) NOT NULL, "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_0329bef22c0e4b517932f3f940d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`GRANT ALL PRIVILEGES ON "oneshot_jobs" TO writer`);
        await queryRunner.query(`GRANT SELECT ON "oneshot_jobs" TO reader`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "oneshot_jobs"`);
    }

}

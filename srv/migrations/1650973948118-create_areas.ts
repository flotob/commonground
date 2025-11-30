// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";
import { grantTablePermissions } from "./migrationUtils";

export class createAreasTable1650973948118 implements MigrationInterface {
    name = 'createAreasTable1650973948118'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "channels" DROP CONSTRAINT "FK_35ab26042dde5cddce5c040797e"`);
        await queryRunner.query(`ALTER TABLE "channels" RENAME COLUMN "group_id" TO "area_id"`);
        await queryRunner.query(`CREATE TABLE "areas" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" character varying(100) NOT NULL, "tags" jsonb, "access_changed" TIMESTAMP(3) WITH TIME ZONE DEFAULT NULL, "group_id" uuid NOT NULL, CONSTRAINT "PK_5110493f6342f34c978c084d0d6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "areas" ADD CONSTRAINT "FK_97ab31f05420178a3f0cebb9ffb" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "channels" ADD CONSTRAINT "FK_b254f3328915f6e063e49dd513e" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await grantTablePermissions(queryRunner, 'areas');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }
}

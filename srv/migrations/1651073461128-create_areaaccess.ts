// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";
import { grantTablePermissions } from "./migrationUtils";

export class createAreaAccessTable1651073461128 implements MigrationInterface {
    name = 'createAreaAccessTable1651073461128'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "areaaccess" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "rules" jsonb, "updated_at_block" bigint, "updated" TIMESTAMP(3) WITH TIME ZONE DEFAULT now(), "account_id" uuid NOT NULL, "area_id" uuid NOT NULL, "linkedaddress_id" uuid, CONSTRAINT "areaaccess_linkedaddress_id_area_id_key" UNIQUE ("linkedaddress_id", "area_id"), CONSTRAINT "PK_60961b30a2a817c9cc1db153e99" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "areaaccess" ADD CONSTRAINT "FK_9f55634a12b66b0cbb5fa9d35f6" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "areaaccess" ADD CONSTRAINT "FK_f26389b6203a831aa5d2e55179b" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "areaaccess" ADD CONSTRAINT "FK_3922480d401b1caf30bb01d0b3d" FOREIGN KEY ("linkedaddress_id") REFERENCES "linkedaddresses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await grantTablePermissions(queryRunner, 'areaaccess');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }
}

// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class changeGroupaccess1651766554209 implements MigrationInterface {
    name = 'changeGroupAccess1651766554209'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "groupaccess" DROP CONSTRAINT "groupaccess_linkedaddress_id_access_id_key"`);
        await queryRunner.query(`ALTER TABLE "groupaccess" DROP COLUMN "access_id"`);
        await queryRunner.query(`ALTER TABLE "groupaccess" DROP COLUMN "linkedaddress_id"`);
        await queryRunner.query(`ALTER TABLE "groupaccess" ADD "group_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "groupaccess" ADD CONSTRAINT "groupaccess_account_id_group_id_key" UNIQUE ("account_id", "group_id")`);
        await queryRunner.query(`ALTER TABLE "groupaccess" ADD CONSTRAINT "FK_43687bdd41c631dc6c9d3b7b88c" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }
}

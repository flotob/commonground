// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";
import { grantTablePermissions } from "../util/migrationUtils";

export class AddGatedFiles1729610872809 implements MigrationInterface {
    name = 'AddGatedFiles1729610872809'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "role_gated_files" ("filename" character varying(255) NOT NULL, "type" character varying(30) NOT NULL, "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "roleId" uuid NOT NULL, CONSTRAINT "PK_b304657b1db2ae4ba104f5ea237" PRIMARY KEY ("filename"))`);
        await queryRunner.query(`ALTER TABLE "role_gated_files" ADD CONSTRAINT "FK_0cf7482364a0ac22f54f5e034f9" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

        await grantTablePermissions(queryRunner, 'role_gated_files');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "role_gated_files" DROP CONSTRAINT "FK_0cf7482364a0ac22f54f5e034f9"`);
        await queryRunner.query(`DROP TABLE "role_gated_files"`);
    }

}

// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";
import { grantTablePermissions } from "../util/migrationUtils";

export class addChainData1687425670393 implements MigrationInterface {
    name = 'addChainData1687425670393'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "chaindata" ("id" character varying(255) NOT NULL, "data" json NOT NULL, CONSTRAINT "PK_e1d555b9d04858484d4482b86e5" PRIMARY KEY ("id"))`);
        await grantTablePermissions(queryRunner, 'chaindata');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "chaindata"`);
    }

}

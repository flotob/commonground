// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";
import { grantToWriter } from "../util/migrationUtils";

export class addLastblockToDb1654874838181 implements MigrationInterface {
    name = 'addLastblockToDb1654874838181'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "lastblocks" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "chain" character varying(10) NOT NULL, "lastblock" bigint NOT NULL, CONSTRAINT "UQ_81ba262787c02b407a81bba0539" UNIQUE ("chain"), CONSTRAINT "PK_d8b14c88384fe60e270ff7d88ec" PRIMARY KEY ("id"))`);
        await grantToWriter(queryRunner, 'lastblocks', 'ALL PRIVILEGES');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "lastblocks"`);
    }

}

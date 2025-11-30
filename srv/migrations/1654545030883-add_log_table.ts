// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";
import { grantToWriter, grantToReader } from "./migrationUtils";

export class addLogTable1654545030883 implements MigrationInterface {
    name = 'addLogTable1654545030883'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "logging" ("id" BIGSERIAL NOT NULL, "service" character varying(20) NOT NULL, "created" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "data" jsonb NOT NULL, CONSTRAINT "PK_2b6eefd2a39237bdb7e3545fa55" PRIMARY KEY ("id"))`);
        await grantToWriter(queryRunner, 'logging', 'INSERT');
        // Check if writer role exists before granting sequence access
        const writerExists = await queryRunner.query(`SELECT 1 FROM pg_roles WHERE rolname = 'writer'`);
        if (writerExists && writerExists.length > 0) {
            await queryRunner.query(`GRANT USAGE, SELECT ON SEQUENCE "logging_id_seq" TO writer`);
        }
        await grantToReader(queryRunner, 'logging', 'INSERT');
        // Check if reader role exists before granting sequence access
        const readerExists = await queryRunner.query(`SELECT 1 FROM pg_roles WHERE rolname = 'reader'`);
        if (readerExists && readerExists.length > 0) {
            await queryRunner.query(`GRANT USAGE, SELECT ON SEQUENCE "logging_id_seq" TO reader`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "logging"`);
    }

}

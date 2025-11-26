// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class removeAccessTables1651054953205 implements MigrationInterface {
    name = 'removeAccessTables1651054953205'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "channelaccess"`);
        await queryRunner.query(`DROP TABLE "access" CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }
}

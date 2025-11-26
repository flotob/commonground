// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class IncreaseChainIdentifierLength1706546390242 implements MigrationInterface {
    name = 'IncreaseChainIdentifierLength1706546390242'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contracts" ALTER COLUMN "chain" TYPE character varying(64)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        throw new Error("Cannot revert migration");
    }

}

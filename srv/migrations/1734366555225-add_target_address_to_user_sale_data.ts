// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTargetAddressToUserSaleData1734366555225 implements MigrationInterface {
    name = 'AddTargetAddressToUserSaleData1734366555225'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokensale_userdata" ADD "targetAddress" character varying(50)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokensale_userdata" DROP COLUMN "targetAddress"`);
    }

}

// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class addRoleFields1686235158565 implements MigrationInterface {
    name = 'addRoleFields1686235158565'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "roles" ADD "imageId" character varying(64)`);
        await queryRunner.query(`ALTER TABLE "roles" ADD "description" character varying(140)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "roles" DROP COLUMN "imageId"`);
    }

}

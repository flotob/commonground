// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class changeAccountsAddImageId1653042022905 implements MigrationInterface {
    name = 'changeAccountsAddImageId1653042022905'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "accounts" ADD "imageId" character varying(64) DEFAULT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}

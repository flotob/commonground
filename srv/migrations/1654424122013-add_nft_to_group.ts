// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class addNftToGroup1654424122013 implements MigrationInterface {
    name = 'addNftToGroup1654424122013'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "groups" ADD "nft_id" character varying(20)`);
        await queryRunner.query(`ALTER TABLE "groups" ADD CONSTRAINT "UQ_1d9173597263b3bd15d15aa8a96" UNIQUE ("nft_id")`);
        await queryRunner.query(`ALTER TABLE "groups" ADD "nft_admin" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "groups" ADD "nft_data" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "groups" DROP COLUMN "nft_data"`);
        await queryRunner.query(`ALTER TABLE "groups" DROP COLUMN "nft_admin"`);
        await queryRunner.query(`ALTER TABLE "groups" DROP CONSTRAINT "UQ_1d9173597263b3bd15d15aa8a96"`);
        await queryRunner.query(`ALTER TABLE "groups" DROP COLUMN "nft_id"`);
    }

}

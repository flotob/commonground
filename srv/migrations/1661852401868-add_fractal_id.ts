// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class addFractalId1661852401868 implements MigrationInterface {
    name = 'addFractalId1661852401868'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "accounts" ADD "verified" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "linkedaddresses" ADD "fractal_id" character varying(132)`);
        await queryRunner.query(`ALTER TABLE "linkedaddresses" ADD CONSTRAINT "UQ_47a76e901f7d32fe8123cfce226" UNIQUE ("fractal_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "linkedaddresses" DROP CONSTRAINT "UQ_47a76e901f7d32fe8123cfce226"`);
        await queryRunner.query(`ALTER TABLE "linkedaddresses" DROP COLUMN "fractal_id"`);
        await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "verified"`);
    }

}

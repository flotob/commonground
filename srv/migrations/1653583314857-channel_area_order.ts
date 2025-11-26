// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class channelAreaOrder1653583314857 implements MigrationInterface {
    name = 'channelAreaOrder1653583314857'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "areas" ADD "order" integer NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "channels" ADD "order" integer NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "channels" ADD "channelInfo" jsonb NOT NULL DEFAULT '{"description":""}'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}

// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPinnedMessages1722887272170 implements MigrationInterface {
    name = 'AddPinnedMessages1722887272170'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "communities_channels" ADD "pinnedMessageIds" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "communities_channels" DROP COLUMN "pinnedMessageIds"`);
    }

}

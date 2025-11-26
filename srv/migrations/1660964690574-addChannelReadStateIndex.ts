// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class addChannelReadStateIndex1660964690574 implements MigrationInterface {
    name = 'addChannelReadStateIndex1660964690574'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "channelreadstate" ADD CONSTRAINT "idx_read_state_channels_unique" UNIQUE ("channel_id", "account_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "channelreadstate" DROP CONSTRAINT "idx_read_state_channels_unique"`);
    }

}

// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class ChannelEmojiLength1700319427019 implements MigrationInterface {
    name = 'ChannelEmojiLength1700319427019'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "communities_channels" ALTER COLUMN "emoji" TYPE character varying(16)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`UPDATE "communities_channels" SET "emoji" = SUBSTRING("emoji", 1, 4) WHERE LENGTH("emoji") > 4`);
        await queryRunner.query(`ALTER TABLE "communities_channels" ALTER COLUMN "emoji" TYPE character varying(4)`);
    }

}

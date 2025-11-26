// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLoyaltyRewardProgram1733772853067 implements MigrationInterface {
    name = 'AddLoyaltyRewardProgram1733772853067'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokensale_userdata" ADD "rewardProgram" jsonb NOT NULL DEFAULT jsonb_build_object()`);
        await queryRunner.query(`ALTER TABLE "tokensale_userdata" ADD "rewardClaimedTimestamp" TIMESTAMP(3) WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "tokensale_userdata" ADD "rewardClaimedSecurityData" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokensale_userdata" DROP COLUMN "rewardClaimedTimestamp"`);
        await queryRunner.query(`ALTER TABLE "tokensale_userdata" DROP COLUMN "rewardProgram"`);
        await queryRunner.query(`ALTER TABLE "tokensale_userdata" DROP COLUMN "rewardClaimedSecurityData"`);
    }

}

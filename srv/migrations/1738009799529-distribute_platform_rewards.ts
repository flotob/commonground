// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm"

export class DistributePlatformRewards1738009799529 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE tokensale_userdata
            SET "rewardClaimedTimestamp" = NOW()
            WHERE "rewardClaimedTimestamp" IS NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}

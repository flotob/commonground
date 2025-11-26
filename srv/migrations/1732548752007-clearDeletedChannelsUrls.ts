// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm"

export class ClearDeletedChannelsUrls1732548752007 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE communities_channels
            SET "url" = NULL
            WHERE "deletedAt" IS NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}

// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFileDataColum1712393002578 implements MigrationInterface {
    name = 'AddFileDataColum1712393002578'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // fix for old bug
        await queryRunner.query(`
            UPDATE messages
            SET attachments = NULL
            WHERE jsonb_typeof(attachments) = 'object'
        `);

        await queryRunner.query(`ALTER TABLE "files" RENAME COLUMN "data" TO "uploadOptions"`);
        await queryRunner.query(`ALTER TABLE "files" ADD "data" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "files" DROP COLUMN "data"`);
        await queryRunner.query(`ALTER TABLE "files" RENAME COLUMN "uploadOptions" TO "data"`);
    }

}

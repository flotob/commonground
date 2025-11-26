// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class addArticleThumbnail1655902253511 implements MigrationInterface {
    name = 'addArticleThumbnail1655902253511'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "articles" ADD "thumbnail_image_id" character varying(64) DEFAULT NULL`);
        

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN "thumbnail_image_id"`);
    }

}

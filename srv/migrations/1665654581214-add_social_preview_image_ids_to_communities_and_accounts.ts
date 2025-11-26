// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class addSocialPreviewImageIdsToCommunitiesAndAccounts1665654581214 implements MigrationInterface {
    name = 'addSocialPreviewImageIdsToCommunitiesAccountsAndArticles1665654581214'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "accounts" ADD "preview_image_id" character varying(128) DEFAULT NULL`);
        await queryRunner.query(`ALTER TABLE "groups" ADD "preview_image_id" character varying(128) DEFAULT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "groups" DROP COLUMN "preview_image_id"`);
        await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "preview_image_id"`);
    }

}

// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserNotificationBools1721659568136 implements MigrationInterface {
    name = 'AddUserNotificationBools1721659568136'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "weeklyNewsletter" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "users" ADD "dmNotifications" boolean NOT NULL DEFAULT true`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "dmNotifications"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "weeklyNewsletter"`);
    }

}

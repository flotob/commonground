// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class areaWritePermissions1663763738696 implements MigrationInterface {
    name = 'areaWritePermissions1663763738696'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."areas_writableby_enum" AS ENUM('everyone', 'team+did', 'teamonly')`);
        await queryRunner.query(`ALTER TABLE "areas" ADD "writableby" "public"."areas_writableby_enum" NOT NULL DEFAULT 'everyone'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "areas" DROP COLUMN "writableby"`);
        await queryRunner.query(`DROP TYPE "public"."areas_writableby_enum"`);
    }

}

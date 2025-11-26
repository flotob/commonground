// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class makeCallMemberPkAutoGenerate1689282586503 implements MigrationInterface {
    name = 'makeCallMemberPkAutoGenerate1689282586503'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "callmembers" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "callmembers" ALTER COLUMN "id" DROP DEFAULT`);
    }

}

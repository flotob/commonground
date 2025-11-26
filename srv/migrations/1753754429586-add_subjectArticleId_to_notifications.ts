// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSubjectArticleIdToNotifications1753754429586 implements MigrationInterface {
    name = 'AddSubjectArticleIdToNotifications1753754429586'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notifications" ADD "subjectArticleId" uuid`);
        await queryRunner.query(`CREATE INDEX "IDX_42f20fc32b07240c4536f03a34" ON "notifications" ("subjectArticleId") `);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_42f20fc32b07240c4536f03a349" FOREIGN KEY ("subjectArticleId") REFERENCES "articles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_42f20fc32b07240c4536f03a349"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_42f20fc32b07240c4536f03a34"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "subjectArticleId"`);
    }

}

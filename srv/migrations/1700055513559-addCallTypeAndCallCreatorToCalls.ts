// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCallTypeAndCallCreatorToCalls1700055513560 implements MigrationInterface {
    name = 'AddCallTypeAndCallCreatorToCalls1700055513560'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "calls" ADD "callCreator" uuid`);
        await queryRunner.query(`UPDATE "calls" SET "callCreator" = '55e2be27-0e3f-49c0-ab82-4313354f879f'`); 
        await queryRunner.query(`ALTER TABLE "calls" ALTER COLUMN "callCreator" SET NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."calls_type_enum" AS ENUM('default', 'broadcast')`);
        await queryRunner.query(`ALTER TABLE "calls" ADD "callType" "public"."calls_type_enum" NOT NULL DEFAULT 'default'`);
        await queryRunner.query(`CREATE INDEX "IDX_1cffa09e4bf64fb36539599404" ON "calls" ("callCreator") `);
        await queryRunner.query(`ALTER TABLE "calls" ADD CONSTRAINT "FK_1cffa09e4bf64fb36539599404a" FOREIGN KEY ("callCreator") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "calls" DROP CONSTRAINT "FK_1cffa09e4bf64fb36539599404a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1cffa09e4bf64fb36539599404"`);
        await queryRunner.query(`ALTER TABLE "calls" DROP COLUMN "type"`);
        await queryRunner.query(`DROP TYPE "public"."calls_type_enum"`);
        await queryRunner.query(`ALTER TABLE "calls" DROP COLUMN "callCreator"`);
    }

}

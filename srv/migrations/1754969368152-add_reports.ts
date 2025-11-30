// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";
import { grantTablePermissions } from "../util/migrationUtils";

export class AddReports1754969368152 implements MigrationInterface {
    name = 'AddReports1754969368152'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."reports_type_enum" AS ENUM('ARTICLE', 'PLUGIN', 'COMMUNITY', 'USER', 'MESSAGE')`);
        await queryRunner.query(`CREATE TABLE "reports" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "reporterId" uuid NOT NULL, "reason" text NOT NULL, "message" text, "type" "public"."reports_type_enum" NOT NULL, "targetId" uuid NOT NULL, "resolved" boolean NOT NULL DEFAULT false, "remark" text, "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP(3) WITH TIME ZONE, CONSTRAINT "PK_d9013193989303580053c0b5ef6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d5e66723d29c6f38b2ba70542d" ON "reports" ("type") `);
        await queryRunner.query(`CREATE INDEX "IDX_cd7faa31851a2153125fd1af73" ON "reports" ("targetId") `);
        await queryRunner.query(`CREATE INDEX "IDX_3f705053ddf994e8e510310bf5" ON "reports" ("resolved") `);
        await queryRunner.query(`ALTER TABLE "reports" ADD CONSTRAINT "FK_4353be8309ce86650def2f8572d" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reports" ADD CONSTRAINT "UQ_2d2d34a8b875e0a96f694fb3f41" UNIQUE ("reporterId", "targetId", "type")`);

        await grantTablePermissions(queryRunner, 'reports');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reports" DROP CONSTRAINT "UQ_2d2d34a8b875e0a96f694fb3f41"`);
        await queryRunner.query(`ALTER TABLE "reports" DROP CONSTRAINT "FK_4353be8309ce86650def2f8572d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3f705053ddf994e8e510310bf5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cd7faa31851a2153125fd1af73"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d5e66723d29c6f38b2ba70542d"`);
        await queryRunner.query(`DROP TABLE "reports"`);
        await queryRunner.query(`DROP TYPE "public"."reports_type_enum"`);
    }

}

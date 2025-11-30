// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";
import { grantTablePermissions } from "./migrationUtils";

export class AddCommunitiesIngressData1716585854384 implements MigrationInterface {
    name = 'AddCommunitiesIngressData1716585854384'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."communities_ingress_data_approvalstate_enum" AS ENUM('PENDING', 'APPROVED', 'DENIED', 'BLOCKED')`);
        await queryRunner.query(`CREATE TABLE "communities_ingress_data" ("communityId" uuid NOT NULL, "userId" uuid NOT NULL, "questionnaireAnswers" jsonb, "approvalState" "public"."communities_ingress_data_approvalstate_enum" NOT NULL, "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP(3) WITH TIME ZONE, CONSTRAINT "PK_bed8f1757ab5973d5e2482567be" PRIMARY KEY ("communityId", "userId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a779a744d2fcb227b6b2822e01" ON "communities_ingress_data" ("communityId") `);
        await queryRunner.query(`CREATE INDEX "IDX_c30b6a43d526fda16b9a136961" ON "communities_ingress_data" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_93c05a4e437fd10a8d83b351ae" ON "communities_ingress_data" ("deletedAt") `);
        await queryRunner.query(`ALTER TABLE "communities_ingress_data" ADD CONSTRAINT "FK_a779a744d2fcb227b6b2822e01d" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "communities_ingress_data" ADD CONSTRAINT "FK_c30b6a43d526fda16b9a1369613" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

        await grantTablePermissions(queryRunner, 'communities_ingress_data');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "communities_ingress_data" DROP CONSTRAINT "FK_c30b6a43d526fda16b9a1369613"`);
        await queryRunner.query(`ALTER TABLE "communities_ingress_data" DROP CONSTRAINT "FK_a779a744d2fcb227b6b2822e01d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_93c05a4e437fd10a8d83b351ae"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c30b6a43d526fda16b9a136961"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a779a744d2fcb227b6b2822e01"`);
        await queryRunner.query(`DROP TABLE "communities_ingress_data"`);
        await queryRunner.query(`DROP TYPE "public"."communities_ingress_data_approvalstate_enum"`);
    }

}

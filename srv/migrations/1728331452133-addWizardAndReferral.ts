// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";
import { grantTablePermissions } from "../util/migrationUtils";

export class AddWizardAndReferral1728331452133 implements MigrationInterface {
    name = 'AddWizardAndReferral1728331452133'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "wizards" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "communityId" uuid NOT NULL, "data" jsonb NOT NULL DEFAULT '{}', "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP(3) WITH TIME ZONE, CONSTRAINT "PK_43fa31c5e4373f99c125656d863" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_6914de5d161733e0f394cc57bb" ON "wizards" ("deletedAt") `);
        await queryRunner.query(`CREATE TABLE "wizard_role_permission" ("wizardId" uuid NOT NULL, "roleId" uuid NOT NULL, CONSTRAINT "PK_31ab50af6c10df120fd9cabb83b" PRIMARY KEY ("wizardId", "roleId"))`);
        await queryRunner.query(`CREATE TABLE "wizard_claimable_codes" ("wizardId" uuid NOT NULL, "code" character varying(32) NOT NULL, "claimedBy" uuid, "createdBy" uuid, CONSTRAINT "PK_b42ecf8906d6a01cda3986de2ee" PRIMARY KEY ("wizardId", "code"))`);
        await queryRunner.query(`CREATE TABLE "wizard_user_data" ("userId" uuid NOT NULL, "wizardId" uuid NOT NULL, "data" jsonb NOT NULL, "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_d3c7cbe90709228ed8efa3c61c4" PRIMARY KEY ("userId", "wizardId"))`);
        await queryRunner.query(`ALTER TABLE "wizards" ADD CONSTRAINT "FK_52dd061c36d7817d80e9e33a5d7" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "wizard_role_permission" ADD CONSTRAINT "FK_f33d22aacc87a89202800af813f" FOREIGN KEY ("wizardId") REFERENCES "wizards"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "wizard_role_permission" ADD CONSTRAINT "FK_269010e965f71a327b56eba384e" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "wizard_claimable_codes" ADD CONSTRAINT "FK_1ef11bdc1dcda7934a751178279" FOREIGN KEY ("wizardId") REFERENCES "wizards"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "wizard_claimable_codes" ADD CONSTRAINT "FK_333787d0d6b5fe57ed1544baac8" FOREIGN KEY ("claimedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "wizard_claimable_codes" ADD CONSTRAINT "FK_8dad02df8fd6af248694e010f0c" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "wizard_user_data" ADD CONSTRAINT "FK_da61af35def417f2960bcd4d16c" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "wizard_user_data" ADD CONSTRAINT "FK_722d0d41ee2342146bf8cbc46b2" FOREIGN KEY ("wizardId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

        await grantTablePermissions(queryRunner, 'wizards');
        await grantTablePermissions(queryRunner, 'wizard_role_permission');
        await grantTablePermissions(queryRunner, 'wizard_claimable_codes');
        await grantTablePermissions(queryRunner, 'wizard_user_data');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "wizard_user_data" DROP CONSTRAINT "FK_722d0d41ee2342146bf8cbc46b2"`);
        await queryRunner.query(`ALTER TABLE "wizard_user_data" DROP CONSTRAINT "FK_da61af35def417f2960bcd4d16c"`);
        await queryRunner.query(`ALTER TABLE "wizard_claimable_codes" DROP CONSTRAINT "FK_8dad02df8fd6af248694e010f0c"`);
        await queryRunner.query(`ALTER TABLE "wizard_claimable_codes" DROP CONSTRAINT "FK_333787d0d6b5fe57ed1544baac8"`);
        await queryRunner.query(`ALTER TABLE "wizard_claimable_codes" DROP CONSTRAINT "FK_1ef11bdc1dcda7934a751178279"`);
        await queryRunner.query(`ALTER TABLE "wizard_role_permission" DROP CONSTRAINT "FK_269010e965f71a327b56eba384e"`);
        await queryRunner.query(`ALTER TABLE "wizard_role_permission" DROP CONSTRAINT "FK_f33d22aacc87a89202800af813f"`);
        await queryRunner.query(`ALTER TABLE "wizards" DROP CONSTRAINT "FK_52dd061c36d7817d80e9e33a5d7"`);
        await queryRunner.query(`DROP TABLE "wizard_user_data"`);
        await queryRunner.query(`DROP TABLE "wizard_claimable_codes"`);
        await queryRunner.query(`DROP TABLE "wizard_role_permission"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6914de5d161733e0f394cc57bb"`);
        await queryRunner.query(`DROP TABLE "wizards"`);
    }

}

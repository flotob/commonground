// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import format from "pg-format";
import { MigrationInterface, QueryRunner } from "typeorm";
import { PredefinedRole, RoleType } from "../common/enums";
import { grantTablePermissions } from "./migrationUtils";

export class AddUserCommunityState1719508518588 implements MigrationInterface {
    name = 'AddUserCommunityState1719508518588'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."user_community_state_blockstate_enum" AS ENUM('CHAT_MUTED', 'BANNED')`);
        await queryRunner.query(`CREATE TYPE "public"."user_community_state_approvalstate_enum" AS ENUM('PENDING', 'APPROVED', 'DENIED', 'BLOCKED')`);
        await queryRunner.query(`CREATE TABLE "user_community_state" ("communityId" uuid NOT NULL, "userId" uuid NOT NULL, "blockStateUpdatedAt" TIMESTAMP(3) WITH TIME ZONE, "blockStateUntil" TIMESTAMP(3) WITH TIME ZONE, "blockState" "public"."user_community_state_blockstate_enum", "questionnaireAnswers" jsonb, "approvalState" "public"."user_community_state_approvalstate_enum", "approvalUpdatedAt" TIMESTAMP(3) WITH TIME ZONE, "notifyMentions" boolean NOT NULL DEFAULT true, "notifyReplies" boolean NOT NULL DEFAULT true, "notifyPosts" boolean NOT NULL DEFAULT true, "notifyEvents" boolean NOT NULL DEFAULT true, "notifyCalls" boolean NOT NULL DEFAULT true, "allowCommunityNewsletter" boolean NOT NULL DEFAULT false, "userLeftCommunity" TIMESTAMP(3) WITH TIME ZONE, CONSTRAINT "PK_87c72ae3f0b7e4e73ef9ce7c192" PRIMARY KEY ("communityId", "userId"))`);
        await queryRunner.query(`ALTER TABLE "user_community_state" ADD CONSTRAINT "FK_b127c13fbe18159ef62fe72dea5" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_community_state" ADD CONSTRAINT "FK_7f881b5e48c7660960ec585892c" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

        await queryRunner.query(`
            INSERT INTO user_community_state ("userId", "communityId", "blockState", "blockStateUntil", "blockStateUpdatedAt", "userLeftCommunity")
            (
                SELECT
                    "userId",
                    "communityId",
                    "blockState"::text::"public"."user_community_state_blockstate_enum",
                    until AS "blockStateUntil",
                    "updatedAt" AS "blockStateUpdatedAt",
                    now() AS "userLeftCommunity"
                FROM userblocking
            ) 
        `);

        await queryRunner.query(`
            INSERT INTO user_community_state ("userId", "communityId", "questionnaireAnswers", "approvalState", "approvalUpdatedAt", "userLeftCommunity")
            (
                SELECT
                    "userId",
                    "communityId",
                    "questionnaireAnswers",
                    "approvalState"::text::"public"."user_community_state_approvalstate_enum",
                    "deletedAt" AS "approvalUpdatedAt",
                    now() AS "userLeftCommunity"
                FROM communities_ingress_data
            )
            ON CONFLICT ("userId", "communityId")
            DO UPDATE SET
                "questionnaireAnswers" = EXCLUDED."questionnaireAnswers",
                "approvalState" = EXCLUDED."approvalState",
                "approvalUpdatedAt" = EXCLUDED."approvalUpdatedAt"
        `);

        /* update previously created rows with userLeftCommunity = null if memberrole relationship exists */
        await queryRunner.query(`
            INSERT INTO user_community_state ("userId", "communityId")
            (
                SELECT ruu."userId", r."communityId"
                FROM roles r
                INNER JOIN roles_users_users ruu
                    ON r.id = ruu."roleId"
                WHERE r."type" = ${format("%L", RoleType.PREDEFINED)}
                    AND r."title" = ${format("%L", PredefinedRole.Member)}
                    AND ruu."claimed" = TRUE
            )
            ON CONFLICT ("userId", "communityId")
            DO UPDATE SET "userLeftCommunity" = NULL
        `);

        await grantTablePermissions(queryRunner, 'user_community_state');

        await queryRunner.query(`DROP TABLE "communities_ingress_data"`);
        await queryRunner.query(`DROP TABLE "userblocking"`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_community_state" DROP CONSTRAINT "FK_7f881b5e48c7660960ec585892c"`);
        await queryRunner.query(`ALTER TABLE "user_community_state" DROP CONSTRAINT "FK_b127c13fbe18159ef62fe72dea5"`);
        await queryRunner.query(`DROP TABLE "user_community_state"`);
        await queryRunner.query(`DROP TYPE "public"."user_community_state_approvalstate_enum"`);
        await queryRunner.query(`DROP TYPE "public"."user_community_state_blockstate_enum"`);
    }

}

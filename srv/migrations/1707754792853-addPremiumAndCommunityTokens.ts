// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import format from "pg-format";
import { MigrationInterface, QueryRunner } from "typeorm";
import { grantTablePermissions } from "../util/migrationUtils";

type GatingRule = {
    contractId: string;
};
type AccessRules = {
    rule1: GatingRule;
    rule2: GatingRule | undefined;
};
type AssignmentRules = {
    type: "token";
    rules: AccessRules;
};

export class AddPremiumAndCommunityTokens1707754792853 implements MigrationInterface {
    name = 'AddPremiumAndCommunityTokens1707754792853'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // users community order can break sometimes, fix as a safeguard
        await queryRunner.query(`
            WITH user_query AS (
                SELECT u.id, u.alias, u."communityOrder", array_agg(r."communityId") AS "communityIds"
                FROM users u
                INNER JOIN roles_users_users ruu
                   ON ruu."userId" = u.id
                INNER JOIN roles r
                   ON r.id = ruu."roleId"
                WHERE r.title = 'Member'
                GROUP BY u.id, u.alias, u."communityOrder"
            ),
            tofix_query AS (
                SELECT * FROM user_query uq
                WHERE NOT uq."communityOrder" @> uq."communityIds" OR NOT uq."communityOrder" <@ uq."communityIds"
            )
            UPDATE users u
            SET "communityOrder" = tofix_query."communityIds"
            FROM tofix_query
            WHERE u.id = tofix_query.id
        `);

        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "fractalId"`);
        await queryRunner.query(`CREATE TYPE "public"."users_premium_featurename_enum" AS ENUM('SUPPORTER_1', 'SUPPORTER_2')`);
        await queryRunner.query(`CREATE TABLE "users_premium" ("userId" uuid NOT NULL, "featureName" "public"."users_premium_featurename_enum" NOT NULL, "activeUntil" TIMESTAMP(3) WITH TIME ZONE NOT NULL, "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_ee04716a7f202d4b6d2951dcd99" PRIMARY KEY ("userId", "featureName"))`);
        await queryRunner.query(`CREATE TYPE "public"."communities_premium_featurename_enum" AS ENUM('VISIBILITY', 'TOKENS_ROLES_1', 'TOKENS_ROLES_2', 'CALLS_1', 'CALLS_2', 'COSMETICS_1')`);
        await queryRunner.query(`CREATE TABLE "communities_premium" ("communityId" uuid NOT NULL, "featureName" "public"."communities_premium_featurename_enum" NOT NULL, "activeUntil" TIMESTAMP(3) WITH TIME ZONE NOT NULL, "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_cf4d407e514573fd2196444d713" PRIMARY KEY ("communityId", "featureName"))`);
        await queryRunner.query(`CREATE TABLE "communities_tokens" ("communityId" uuid NOT NULL, "contractId" uuid NOT NULL, "order" integer NOT NULL DEFAULT '0', "active" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_e218778e741b58b56830db9a05f" PRIMARY KEY ("communityId", "contractId"))`);
        await queryRunner.query(`CREATE TABLE "point_transactions" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "userId" uuid, "communityId" uuid, "amount" integer NOT NULL, "data" jsonb NOT NULL, "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_ceb5185b63f070e23d65509b0a7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_557e0c8c5a7a1a449723de7682" ON "point_transactions" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_1a2e06a8cc855bcde8976d514c" ON "point_transactions" ("communityId") `);
        await queryRunner.query(`ALTER TABLE "communities" ADD "pointBalance" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "pointBalance" integer NOT NULL DEFAULT '0'`);

        // autoRenew: merged migrations
        await queryRunner.query(`CREATE TYPE "public"."users_premium_autorenew_enum" AS ENUM('MONTH', 'YEAR')`);
        await queryRunner.query(`ALTER TABLE "users_premium" ADD "autoRenew" "public"."users_premium_autorenew_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."communities_premium_autorenew_enum" AS ENUM('MONTH', 'YEAR')`);
        await queryRunner.query(`ALTER TABLE "communities_premium" ADD "autoRenew" "public"."communities_premium_autorenew_enum"`);
        await queryRunner.query(`CREATE INDEX "IDX_7c226510a811f9a05af050d6cb" ON "users_premium" ("activeUntil") `);
        await queryRunner.query(`CREATE INDEX "IDX_cc5e589612da1ad51c14d477a0" ON "users_premium" ("autoRenew") `);
        await queryRunner.query(`CREATE INDEX "IDX_a48633d50ce6fa1c7aa178f3fa" ON "communities_premium" ("activeUntil") `);
        await queryRunner.query(`CREATE INDEX "IDX_f28c740f907de906d84642f0c1" ON "communities_premium" ("autoRenew") `);


        // give communities initial point balances
        const premiumFeatures: string[] = [];
        const pointTransactions: string[] = [];

        // give 100 most active communities points
        const mostActiveLimit: number = 100;
        const mostActiveAmount: number = 50_000;
        const [mostActiveList, cnt1]: [{ id: string }[], number] = await queryRunner.query(`
            WITH select_most_active AS (
                SELECT id
                FROM communities
                ORDER BY "activityScore" DESC
                LIMIT ${mostActiveLimit}
            )
            UPDATE communities
            SET
                "pointBalance" = "pointBalance" + ${mostActiveAmount},
                "updatedAt" = now()
            FROM select_most_active
            WHERE communities.id = select_most_active.id
            RETURNING communities.id
        `);
        for (const mostActive of mostActiveList) {
            const transactionData: Models.Premium.TransactionData = {
                type: 'platform-donation',
                emoji: '🌟',
                text: `Congratulations, you're among the top ${mostActiveLimit} most active communities!`
            };
            pointTransactions.push(format(
                `(%L::uuid, NULL, %s, %L::jsonb)`,
                mostActive.id,
                mostActiveAmount,
                JSON.stringify(transactionData),
            ));
        }

        // give active (activityScore > 1) and verified communities points
        const verifiedActivityCutoff: number = 1;
        const verifiedAmount: number = 50_000;
        const [verifiedIds, cnt2]: [{ id: string }[], number] = await queryRunner.query(`
            WITH select_active_verified AS (
                SELECT id
                FROM communities
                WHERE "nftId" IS NOT NULL
                  AND "activityScore" > ${verifiedActivityCutoff}
            )
            UPDATE communities
            SET
                "pointBalance" = "pointBalance" + ${verifiedAmount},
                "updatedAt" = now()
            FROM select_active_verified
            WHERE communities.id = select_active_verified.id
            RETURNING communities.id
        `);
        
        for (const verifiedId of verifiedIds) {
            premiumFeatures.push(
                format(
                    `(%L::uuid, 'VISIBILITY'::"public"."communities_premium_featurename_enum", now() + interval '180 days', 'MONTH'::"public"."communities_premium_autorenew_enum")`,
                    verifiedId.id
                ),
                format(
                    `(%L::uuid, 'TOKENS_ROLES_2'::"public"."communities_premium_featurename_enum", now() + interval '180 days', 'MONTH'::"public"."communities_premium_autorenew_enum")`,
                    verifiedId.id
                ),
            );
            const transactionData: Models.Premium.TransactionData = {
                type: 'platform-donation',
                emoji: '🙏',
                text: `You were verified before and are still active - thank you!`
            };
            pointTransactions.push(format(
                `(%L::uuid, NULL, %s, %L::jsonb)`,
                verifiedId.id,
                verifiedAmount,
                JSON.stringify(transactionData),
            ));
        }

        // give users points
        const userLuksoAmount: number = 10_000;
        const [luksoUserIds, cnt3]: [{ id: string }[], number] = await queryRunner.query(`
            WITH select_lukso_users AS (
                SELECT DISTINCT u.id
                FROM users u
                INNER JOIN user_accounts ua
                  ON  u.id = ua."userId"
                  AND ua.type = 'lukso'
                  AND ua."deletedAt" IS NULL
            )
            UPDATE users
            SET
                "pointBalance" = "pointBalance" + ${userLuksoAmount},
                "updatedAt" = now()
            FROM select_lukso_users
            WHERE users.id = select_lukso_users.id
            RETURNING users.id
        `);
        for (const luksoUser of luksoUserIds) {
            const transactionData: Models.Premium.TransactionData = {
                type: 'platform-donation',
                emoji: '🆙',
                text: `You're one of ${luksoUserIds.length} users with a Universal Profile - thanks for being here!`
            };
            pointTransactions.push(format(
                `(NULL, %L::uuid, %s, %L::jsonb)`,
                luksoUser.id,
                userLuksoAmount,
                JSON.stringify(transactionData),
            ));
        }

        if (premiumFeatures.length > 0) {
            await queryRunner.query(`
                INSERT INTO communities_premium ("communityId", "featureName", "activeUntil", "autoRenew")
                VALUES ${premiumFeatures.join(',')}
            `);
        }
        if (pointTransactions.length > 0) {
            await queryRunner.query(`
                INSERT INTO point_transactions ("communityId", "userId", "amount", "data")
                VALUES ${pointTransactions.join(',')}
            `);
        }
        await queryRunner.query(`ALTER TABLE "communities" DROP COLUMN "nftData"`);
        await queryRunner.query(`ALTER TABLE "communities" DROP CONSTRAINT "UQ_bb8d83bba8b5a3ab5eb00934bc5"`);
        await queryRunner.query(`ALTER TABLE "communities" DROP COLUMN "nftId"`);
        await queryRunner.query(`ALTER TABLE "communities" DROP COLUMN "nftAdmin"`);
        await queryRunner.query(`ALTER TABLE "users_premium" ADD CONSTRAINT "FK_7fcd2c350a0fadbfb59542bef3c" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "communities_premium" ADD CONSTRAINT "FK_53f3dace9564b232a0668255fc2" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "communities_tokens" ADD CONSTRAINT "FK_91c44e0a30adb5ae54ec0cf7069" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "communities_tokens" ADD CONSTRAINT "FK_a8ef2945f31bbb2a63c72cdac2b" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

        const rolesWithTokenRulesData: {
            id: string;
            communityId: string;
            assignmentRules: AssignmentRules;
        }[] = await queryRunner.query(`
            SELECT
                id,
                "communityId",
                "assignmentRules"
            FROM roles
            WHERE "assignmentRules" IS NOT NULL
                AND "assignmentRules"->>'type' = 'token'
                AND "deletedAt" IS NULL
        `);
        const communityTokens: Map<string, Set<string>> = new Map();
        const roleContracts: Map<string, Set<string>> = new Map();
        for (const role of rolesWithTokenRulesData) {
            const communityId = role.communityId;
            const contractIds = [role.assignmentRules.rules.rule1.contractId];
            if (!!role.assignmentRules.rules.rule2) {
                contractIds.push(role.assignmentRules.rules.rule2.contractId);
            }
            if (!communityTokens.has(communityId)) {
                communityTokens.set(communityId, new Set());
            }
            if (!roleContracts.has(role.id)) {
                roleContracts.set(role.id, new Set());
            }
            for (const contractId of contractIds) {
                roleContracts.get(role.id)?.add(contractId);
                communityTokens.get(communityId)?.add(contractId);
            }
        }
        const communityTokenValues: string[] = [];
        for (const [communityId, contractIds] of communityTokens) {
            let order = 0;
            for (const contractId of contractIds) {
                communityTokenValues.push(format("(%L::uuid, %L::uuid, %s)", communityId, contractId, order));
                order += 1000;
            }
        }
        if (communityTokenValues.length > 0) {
            await queryRunner.query(`
                INSERT INTO communities_tokens ("communityId", "contractId", "order")
                VALUES ${communityTokenValues.join(',')}
            `);
        }
        const roleContractValues: string[] = [];
        for (const [roleId, contractIds] of roleContracts) {
            for (const contractId of contractIds) {
                roleContractValues.push(format("(%L::uuid, %L::uuid)", roleId, contractId));
            }
        }
        // remove old role-contract assignments
        await queryRunner.query(`TRUNCATE TABLE roles_contracts_contracts`);
        if (roleContractValues.length > 0) {
            await queryRunner.query(`
                INSERT INTO roles_contracts_contracts ("rolesId", "contractsId")
                VALUES ${roleContractValues.join(',')}
            `);
        }

        await grantTablePermissions(queryRunner, 'users_premium');
        await grantTablePermissions(queryRunner, 'communities_premium');
        await grantTablePermissions(queryRunner, 'communities_tokens');
        await grantTablePermissions(queryRunner, 'point_transactions');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        throw new Error("This migration cannot be reverted");
    }

}

// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class UpgradePremiumFeatures1730323570124 implements MigrationInterface {
    name = 'UpgradePremiumFeatures1730323570124'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."communities_premium_featurename_enum" RENAME TO "communities_premium_featurename_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."communities_premium_featurename_enum" AS ENUM('BASIC', 'PRO', 'ENTERPRISE')`);

        const activePremiumFeatures = await queryRunner.query(`SELECT DISTINCT "communityId" FROM communities_premium WHERE "activeUntil" > now()`);
        await queryRunner.query(`TRUNCATE TABLE communities_premium`);

        await queryRunner.query(`ALTER TABLE "communities_premium" ALTER COLUMN "featureName" TYPE "public"."communities_premium_featurename_enum" USING "featureName"::"text"::"public"."communities_premium_featurename_enum"`);
        await queryRunner.query(`DROP TYPE "public"."communities_premium_featurename_enum_old"`);

        const communityIds = Array.from(new Set<string>(activePremiumFeatures.map((feature: { communityId: string }) => feature.communityId)));
        if (communityIds.length > 0) {
            await queryRunner.query(`
                INSERT INTO communities_premium ("communityId", "featureName", "activeUntil", "autoRenew")
                VALUES ${communityIds.map(id => `('${id}', 'PRO', now() + interval '1 year', 'MONTH')`).join(',\n')}
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."communities_premium_featurename_enum_old" AS ENUM('VISIBILITY', 'TOKENS_ROLES_1', 'TOKENS_ROLES_2', 'CALLS_1', 'CALLS_2', 'COSMETICS_1')`);
        await queryRunner.query(`ALTER TABLE "communities_premium" ALTER COLUMN "featureName" TYPE "public"."communities_premium_featurename_enum_old" USING "featureName"::"text"::"public"."communities_premium_featurename_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."communities_premium_featurename_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."communities_premium_featurename_enum_old" RENAME TO "communities_premium_featurename_enum"`);
    }

}

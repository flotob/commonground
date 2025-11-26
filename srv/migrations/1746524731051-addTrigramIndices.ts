// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTrigramIndices1746524731051 implements MigrationInterface {
    name = 'AddTrigramIndices1746524731051'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);
        await queryRunner.query(`CREATE INDEX "idx_user_accounts_displayName_gin_trgm" ON "user_accounts" USING gin ("displayName" gin_trgm_ops)`);
        await queryRunner.query(`CREATE INDEX "idx_communities_title_gin_trgm" ON "communities" USING gin ("title" gin_trgm_ops)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_user_accounts_displayName_gin_trgm"`);
        await queryRunner.query(`DROP INDEX "public"."idx_communities_title_gin_trgm"`);
    }

}

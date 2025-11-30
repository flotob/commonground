// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";
import { grantTablePermissions } from "../util/migrationUtils";

export class NewsletterTables1720729195823 implements MigrationInterface {
    name = 'NewsletterTables1720729195823'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_newsletter_status" ("userId" uuid NOT NULL, "newsletterId" integer NOT NULL, "emailClicked" boolean NOT NULL DEFAULT false, "sentAt" TIMESTAMP(3) WITH TIME ZONE, CONSTRAINT "PK_5a4bbe7a889d0d8e56089e5f1f0" PRIMARY KEY ("userId", "newsletterId"))`);
        await queryRunner.query(`ALTER TABLE "user_community_state" DROP COLUMN "allowCommunityNewsletter"`);
        await queryRunner.query(`ALTER TABLE "communities" ADD "enablePersonalNewsletter" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "communities_articles" ADD "markAsNewsletter" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "communities_articles" ADD "sentAsNewsletter" TIMESTAMP(3) WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "user_community_state" ADD "newsletterJoinedAt" TIMESTAMP(3) WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "user_community_state" ADD "newsletterLeftAt" TIMESTAMP(3) WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "user_newsletter_status" ADD CONSTRAINT "FK_e9efcbb861362f6ee3ef5c37c3b" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

        await grantTablePermissions(queryRunner, 'user_newsletter_status');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_newsletter_status" DROP CONSTRAINT "FK_e9efcbb861362f6ee3ef5c37c3b"`);
        await queryRunner.query(`ALTER TABLE "user_community_state" DROP COLUMN "newsletterLeftAt"`);
        await queryRunner.query(`ALTER TABLE "user_community_state" DROP COLUMN "newsletterJoinedAt"`);
        await queryRunner.query(`ALTER TABLE "communities_articles" DROP COLUMN "sentAsNewsletter"`);
        await queryRunner.query(`ALTER TABLE "communities_articles" DROP COLUMN "markAsNewsletter"`);
        await queryRunner.query(`ALTER TABLE "communities" DROP COLUMN "enablePersonalNewsletter"`);
        await queryRunner.query(`ALTER TABLE "user_community_state" ADD "allowCommunityNewsletter" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`DROP TABLE "user_newsletter_status"`);
    }

}

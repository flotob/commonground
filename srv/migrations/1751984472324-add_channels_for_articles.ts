// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddChannelsForArticles1751984472324 implements MigrationInterface {
    name = 'AddChannelsForArticles1751984472324'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "articles" ADD "channelId" uuid`);
        await queryRunner.query(`ALTER TABLE "articles" ADD CONSTRAINT "UQ_b72e9ee53b910ec43c753c2b5b6" UNIQUE ("channelId")`);
        await queryRunner.query(`ALTER TABLE "articles" ADD CONSTRAINT "FK_b72e9ee53b910ec43c753c2b5b6" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

        // Get all articles without a channel
        const articlesWithoutChannel = await queryRunner.query(`SELECT id FROM "articles" WHERE "channelId" IS NULL`);

        if (articlesWithoutChannel.length > 0) {
            // Insert exactly n channels (where n = number of articles without channels)
            const newChannels = await queryRunner.query(`
                INSERT INTO channels 
                SELECT FROM generate_series(1, $1) 
                RETURNING id
            `, [articlesWithoutChannel.length]);

            // Extract arrays of IDs for batch update
            const articleIds = articlesWithoutChannel.map((article: any) => article.id);
            const channelIds = newChannels.map((channel: any) => channel.id);

            // Update all articles with their corresponding channel IDs using array zip
            await queryRunner.query(`
                UPDATE articles 
                SET "channelId" = channel_data.channel_id 
                FROM (
                    SELECT 
                        unnest($1::uuid[]) as article_id,
                        unnest($2::uuid[]) as channel_id
                ) as channel_data 
                WHERE articles.id = channel_data.article_id
            `, [articleIds, channelIds]);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "articles" DROP CONSTRAINT "FK_b72e9ee53b910ec43c753c2b5b6"`);
        await queryRunner.query(`ALTER TABLE "articles" DROP CONSTRAINT "UQ_b72e9ee53b910ec43c753c2b5b6"`);
        await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN "channelId"`);
    }

}

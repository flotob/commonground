import { MigrationInterface, QueryRunner } from "typeorm";

export class BotChannelPermissions1764613528795 implements MigrationInterface {
    name = 'BotChannelPermissions1764613528795'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Replace enabledChannelIds (uuid array) with channelPermissions (jsonb)
        // The jsonb format will be: { "channelId": "permission_level", ... }
        await queryRunner.query(`ALTER TABLE "community_bots" DROP COLUMN "enabledChannelIds"`);
        await queryRunner.query(`ALTER TABLE "community_bots" ADD "channelPermissions" jsonb NOT NULL DEFAULT '{}'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "community_bots" DROP COLUMN "channelPermissions"`);
        await queryRunner.query(`ALTER TABLE "community_bots" ADD "enabledChannelIds" uuid array`);
    }

}

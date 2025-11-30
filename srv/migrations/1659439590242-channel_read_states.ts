// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";
import { grantTablePermissions } from "../util/migrationUtils";

export class channelReadStates1659439590242 implements MigrationInterface {
    name = 'channelReadStates1659439590242'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "channelreadstate" ("channel_id" character varying(18) NOT NULL, "account_id" uuid NOT NULL, "lastread" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "idx_read_state_channels_unique" UNIQUE ("channel_id", "account_id"), CONSTRAINT "PK_2e73b023c2abcf7e1242587924c" PRIMARY KEY ("channel_id", "account_id"))`);
        await queryRunner.query(`CREATE INDEX "idx_read_state_channel_id" ON "channelreadstate" ("channel_id") `);
        await queryRunner.query(`CREATE INDEX "idx_read_state_account_id" ON "channelreadstate" ("account_id") `);
        await queryRunner.query(`ALTER TABLE "channelreadstate" ADD CONSTRAINT "FK_50bac70cf884a09b6d4791e69fa" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "channelreadstate" ADD CONSTRAINT "FK_9f702b296412b2d0fc69cdedcc8" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

        await grantTablePermissions(queryRunner, 'channelreadstate');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "channelreadstate" DROP CONSTRAINT "FK_9f702b296412b2d0fc69cdedcc8"`);
        await queryRunner.query(`ALTER TABLE "channelreadstate" DROP CONSTRAINT "FK_50bac70cf884a09b6d4791e69fa"`);
        await queryRunner.query(`DROP INDEX "public"."idx_read_state_account_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_read_state_channel_id"`);
        await queryRunner.query(`DROP TABLE "channelreadstate"`);
    }

}

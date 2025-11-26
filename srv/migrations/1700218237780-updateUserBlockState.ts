// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateUserBlockState1700218237780 implements MigrationInterface {
    name = 'UpdateUserBlockState1700218237780'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "userblocking" DROP CONSTRAINT "FK_07cc4d824289fa15fa3d14e8292"`);
        await queryRunner.query(`ALTER TABLE "userblocking" DROP CONSTRAINT "PK_6374675935dcb858c7344fa1310"`);
        await queryRunner.query(`ALTER TABLE "userblocking" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "userblocking" DROP COLUMN "channelId"`);
        await queryRunner.query(`ALTER TABLE "userblocking" DROP COLUMN "deletedAt"`);
        await queryRunner.query(`ALTER TABLE "userblocking" ADD CONSTRAINT "PK_512568086d15c8c4f15393698d0" PRIMARY KEY ("communityId", "userId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "userblocking" DROP CONSTRAINT "PK_512568086d15c8c4f15393698d0"`);
        await queryRunner.query(`ALTER TABLE "userblocking" ADD "deletedAt" TIMESTAMP(3) WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "userblocking" ADD "channelId" uuid`);
        await queryRunner.query(`ALTER TABLE "userblocking" ADD "id" uuid NOT NULL DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "userblocking" ADD CONSTRAINT "PK_6374675935dcb858c7344fa1310" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "userblocking" ADD CONSTRAINT "FK_07cc4d824289fa15fa3d14e8292" FOREIGN KEY ("communityId", "channelId") REFERENCES "communities_channels"("communityId","channelId") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}

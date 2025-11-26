// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class generateCommunityAreaChannelIds1652199527710 implements MigrationInterface {
    name = 'generateCommunityAreaChannelIds1652199527710'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_posts_channel_group"`);
        await queryRunner.query(`ALTER TABLE "groupblocks" DROP CONSTRAINT "FK_3f36fbb53a57f3b0a90d728c770"`);
        await queryRunner.query(`ALTER TABLE "areas" DROP CONSTRAINT "FK_97ab31f05420178a3f0cebb9ffb"`);
        await queryRunner.query(`ALTER TABLE "groupaccess" DROP CONSTRAINT "FK_43687bdd41c631dc6c9d3b7b88c"`);
        await queryRunner.query(`ALTER TABLE "groups" DROP CONSTRAINT "PK_659d1483316afb28afd3a90646e"`);
        await queryRunner.query(`ALTER TABLE "groups" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "groups" ADD "id" character varying(10) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "groups" ADD CONSTRAINT "PK_659d1483316afb28afd3a90646e" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "channels" DROP CONSTRAINT "FK_b254f3328915f6e063e49dd513e"`);
        await queryRunner.query(`ALTER TABLE "areaaccess" DROP CONSTRAINT "FK_f26389b6203a831aa5d2e55179b"`);
        await queryRunner.query(`ALTER TABLE "areas" DROP CONSTRAINT "PK_5110493f6342f34c978c084d0d6"`);
        await queryRunner.query(`ALTER TABLE "areas" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "areas" ADD "id" character varying(14) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "areas" ADD CONSTRAINT "PK_5110493f6342f34c978c084d0d6" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "areas" DROP COLUMN "group_id"`);
        await queryRunner.query(`ALTER TABLE "areas" ADD "group_id" character varying(10) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "areaaccess" DROP CONSTRAINT "areaaccess_linkedaddress_id_area_id_key"`);
        await queryRunner.query(`ALTER TABLE "areaaccess" DROP COLUMN "area_id"`);
        await queryRunner.query(`ALTER TABLE "areaaccess" ADD "area_id" character varying(14) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "groupblocks" DROP CONSTRAINT "groupblocks_group_id_account_id_key"`);
        await queryRunner.query(`ALTER TABLE "groupblocks" DROP CONSTRAINT "PK_46f84a16aaad0486ed2dee63e8e"`);
        await queryRunner.query(`ALTER TABLE "groupblocks" ADD CONSTRAINT "PK_b6b5a26a3066c1cf22f364cb5b6" PRIMARY KEY ("account_id")`);
        await queryRunner.query(`ALTER TABLE "groupblocks" DROP COLUMN "group_id"`);
        await queryRunner.query(`ALTER TABLE "groupblocks" ADD "group_id" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "groupblocks" DROP CONSTRAINT "PK_b6b5a26a3066c1cf22f364cb5b6"`);
        await queryRunner.query(`ALTER TABLE "groupblocks" ADD CONSTRAINT "PK_46f84a16aaad0486ed2dee63e8e" PRIMARY KEY ("account_id", "group_id")`);
        await queryRunner.query(`ALTER TABLE "channels" DROP CONSTRAINT "PK_bc603823f3f741359c2339389f9"`);
        await queryRunner.query(`ALTER TABLE "channels" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "channels" ADD "id" character varying(18) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "channels" ADD CONSTRAINT "PK_bc603823f3f741359c2339389f9" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "channels" DROP COLUMN "area_id"`);
        await queryRunner.query(`ALTER TABLE "channels" ADD "area_id" character varying(14) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "groupaccess" DROP CONSTRAINT "groupaccess_account_id_group_id_key"`);
        await queryRunner.query(`ALTER TABLE "groupaccess" DROP COLUMN "group_id"`);
        await queryRunner.query(`ALTER TABLE "groupaccess" ADD "group_id" character varying(10) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "areaaccess" ADD CONSTRAINT "areaaccess_linkedaddress_id_area_id_key" UNIQUE ("linkedaddress_id", "area_id")`);
        await queryRunner.query(`ALTER TABLE "groupblocks" ADD CONSTRAINT "groupblocks_group_id_account_id_key" UNIQUE ("group_id", "account_id")`);
        await queryRunner.query(`ALTER TABLE "groupaccess" ADD CONSTRAINT "groupaccess_account_id_group_id_key" UNIQUE ("account_id", "group_id")`);
        await queryRunner.query(`ALTER TABLE "areas" ADD CONSTRAINT "FK_97ab31f05420178a3f0cebb9ffb" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "areaaccess" ADD CONSTRAINT "FK_f26389b6203a831aa5d2e55179b" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "groupblocks" ADD CONSTRAINT "FK_3f36fbb53a57f3b0a90d728c770" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "channels" ADD CONSTRAINT "FK_b254f3328915f6e063e49dd513e" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "groupaccess" ADD CONSTRAINT "FK_43687bdd41c631dc6c9d3b7b88c" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`CREATE INDEX "idx_posts_channel_group" ON "posts" ((message->>'groupId'), (message->>'channelId')) `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }
}

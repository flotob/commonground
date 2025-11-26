// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCommunityAirdropTable1734751783314 implements MigrationInterface {
    name = 'AddCommunityAirdropTable1734751783314'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_community_airdrops" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "communityId" uuid NOT NULL, "roleId" uuid NOT NULL, "userId" uuid NOT NULL, "airdropData" jsonb NOT NULL, "airdropEndDate" TIMESTAMP(3) WITH TIME ZONE NOT NULL, CONSTRAINT "PK_467af4d7a5a4d95315cd9e46421" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user_community_airdrops" ADD CONSTRAINT "FK_189cfff0407ac7bd6ba3daa4d24" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_community_airdrops" ADD CONSTRAINT "FK_8f2bba225f5c139c676e5522351" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_community_airdrops" ADD CONSTRAINT "FK_83c3c8ba29c3cd7629856690a79" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

        await queryRunner.query(`GRANT ALL PRIVILEGES ON "user_community_airdrops" TO writer`);
        await queryRunner.query(`GRANT SELECT ON "user_community_airdrops" TO reader`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_community_airdrops" DROP CONSTRAINT "FK_83c3c8ba29c3cd7629856690a79"`);
        await queryRunner.query(`ALTER TABLE "user_community_airdrops" DROP CONSTRAINT "FK_8f2bba225f5c139c676e5522351"`);
        await queryRunner.query(`ALTER TABLE "user_community_airdrops" DROP CONSTRAINT "FK_189cfff0407ac7bd6ba3daa4d24"`);
        await queryRunner.query(`DROP TABLE "user_community_airdrops"`);
    }

}

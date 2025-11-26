// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPluginsTable1738852388814 implements MigrationInterface {
    name = 'AddPluginsTable1738852388814'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "plugins" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "communityId" uuid NOT NULL, "name" character varying(255) NOT NULL, "url" character varying(255) NOT NULL, "privateKey" text NOT NULL, "publicKey" text NOT NULL, "config" jsonb, "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP(3) WITH TIME ZONE, CONSTRAINT "PK_6d68f0ec581578e3ccf6fc117e1" PRIMARY KEY ("id", "communityId"))`);
        await queryRunner.query(`ALTER TABLE "plugins" ADD CONSTRAINT "FK_57cbe526636c61d92ba227fada7" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

        await queryRunner.query(`GRANT ALL PRIVILEGES ON "plugins" TO writer`);
        await queryRunner.query(`GRANT SELECT ON "plugins" TO reader`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "plugins" DROP CONSTRAINT "FK_57cbe526636c61d92ba227fada7"`);
        await queryRunner.query(`DROP TABLE "plugins"`);
    }

}

// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";
import { grantTablePermissions } from "./migrationUtils";

export class PluginsPermissionsAndStore1743013929110 implements MigrationInterface {
    name = 'PluginsPermissionsAndStore1743013929110'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "communities_plugins" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "communityId" uuid NOT NULL, "pluginId" uuid NOT NULL, "name" character varying(255) NOT NULL, "config" jsonb NOT NULL DEFAULT '{}', "createdAt" TIMESTAMP(3) WITH TIME ZONE, "updatedAt" TIMESTAMP(3) WITH TIME ZONE, "deletedAt" TIMESTAMP(3) WITH TIME ZONE, CONSTRAINT "PK_ed5137d71881194f738d3355241" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_plugin_state" ("userId" uuid NOT NULL, "pluginId" uuid NOT NULL, "acceptedPermissions" jsonb, "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_2ef2a1889896783543d20972191" PRIMARY KEY ("userId", "pluginId"))`);

        await queryRunner.query(`WITH current_plugins AS (
            SELECT "communityId", id, name, config, "createdAt", "updatedAt", "deletedAt"
            FROM plugins
            WHERE "deletedAt" IS NULL
        ) INSERT INTO communities_plugins ("communityId", "pluginId", "name", "config", "createdAt", "updatedAt", "deletedAt")
          SELECT "communityId", id, name, COALESCE(config, '{}'), "createdAt", "updatedAt", "deletedAt"
          FROM current_plugins
        `);

        await queryRunner.query(`ALTER TABLE "plugins" DROP CONSTRAINT "FK_57cbe526636c61d92ba227fada7"`);
        await queryRunner.query(`ALTER TABLE "plugins" DROP CONSTRAINT "PK_6d68f0ec581578e3ccf6fc117e1"`);
        await queryRunner.query(`ALTER TABLE "plugins" ADD CONSTRAINT "PK_bb3d17826b76295957a253ba73e" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "plugins" RENAME COLUMN "communityId" TO "ownerCommunityId"`);
        await queryRunner.query(`ALTER TABLE "plugins" DROP COLUMN "config"`);
        await queryRunner.query(`ALTER TABLE "plugins" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "plugins" ADD "permissions" jsonb`);
        await queryRunner.query(`ALTER TABLE "plugins" ADD "clonable" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "plugins" ADD "appstoreEnabled" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "plugins" ADD "warnAbusive" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "plugins" ADD CONSTRAINT "FK_8a6274200c42cdc9547a209696b" FOREIGN KEY ("ownerCommunityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "communities_plugins" ADD CONSTRAINT "FK_4ccda091f59d55edf4efa095b65" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "communities_plugins" ADD CONSTRAINT "FK_78d49e546c7c5f4fdfca7d5b43f" FOREIGN KEY ("pluginId") REFERENCES "plugins"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_plugin_state" ADD CONSTRAINT "FK_db107b5b249242f4823f3f8cd0a" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_plugin_state" ADD CONSTRAINT "FK_c9cf045b325fff92d026d34c14d" FOREIGN KEY ("pluginId") REFERENCES "plugins"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

        await grantTablePermissions(queryRunner, 'communities_plugins');
        await grantTablePermissions(queryRunner, 'user_plugin_state');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_plugin_state" DROP CONSTRAINT "FK_c9cf045b325fff92d026d34c14d"`);
        await queryRunner.query(`ALTER TABLE "user_plugin_state" DROP CONSTRAINT "FK_db107b5b249242f4823f3f8cd0a"`);
        await queryRunner.query(`ALTER TABLE "communities_plugins" DROP CONSTRAINT "FK_78d49e546c7c5f4fdfca7d5b43f"`);
        await queryRunner.query(`ALTER TABLE "communities_plugins" DROP CONSTRAINT "FK_4ccda091f59d55edf4efa095b65"`);
        await queryRunner.query(`ALTER TABLE "plugins" DROP CONSTRAINT "FK_8a6274200c42cdc9547a209696b"`);
        await queryRunner.query(`ALTER TABLE "plugins" DROP COLUMN "warnAbusive"`);
        await queryRunner.query(`ALTER TABLE "plugins" DROP COLUMN "appstoreEnabled"`);
        await queryRunner.query(`ALTER TABLE "plugins" DROP COLUMN "clonable"`);
        await queryRunner.query(`ALTER TABLE "plugins" DROP COLUMN "permissions"`);
        await queryRunner.query(`ALTER TABLE "plugins" DROP COLUMN "ownerCommunityId"`);
        await queryRunner.query(`ALTER TABLE "plugins" ADD "name" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "plugins" ADD "config" jsonb`);
        await queryRunner.query(`ALTER TABLE "plugins" ADD "communityId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "plugins" DROP CONSTRAINT "PK_bb3d17826b76295957a253ba73e"`);
        await queryRunner.query(`ALTER TABLE "plugins" ADD CONSTRAINT "PK_6d68f0ec581578e3ccf6fc117e1" PRIMARY KEY ("id", "communityId")`);
        await queryRunner.query(`DROP TABLE "user_plugin_state"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4ccda091f59d55edf4efa095b6"`);
        await queryRunner.query(`DROP TABLE "communities_plugins"`);
        await queryRunner.query(`ALTER TABLE "plugins" ADD CONSTRAINT "FK_57cbe526636c61d92ba227fada7" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}

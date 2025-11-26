// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEventManagementPermission1707506879339 implements MigrationInterface {
    name = 'AddEventManagementPermission1707506879339'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."roles_permissions_enum" RENAME TO "roles_permissions_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."roles_permissions_enum" AS ENUM('COMMUNITY_MANAGE_INFO', 'COMMUNITY_MANAGE_CHANNELS', 'COMMUNITY_MANAGE_ROLES', 'COMMUNITY_MANAGE_ARTICLES', 'COMMUNITY_MODERATE', 'WEBRTC_CREATE', 'WEBRTC_CREATE_CUSTOM', 'WEBRTC_MODERATE', 'COMMUNITY_MANAGE_EVENTS')`);
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "permissions" TYPE "public"."roles_permissions_enum"[] USING "permissions"::"text"::"public"."roles_permissions_enum"[]`);
        await queryRunner.query(`DROP TYPE "public"."roles_permissions_enum_old"`);
        await queryRunner.query(`
            UPDATE "roles"
            SET "permissions" = array_append("permissions", 'COMMUNITY_MANAGE_EVENTS'),
                "updatedAt" = now()
            WHERE "title" = 'Admin' AND "type" = 'PREDEFINED'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."roles_permissions_enum_old" AS ENUM('COMMUNITY_MANAGE_INFO', 'COMMUNITY_MANAGE_CHANNELS', 'COMMUNITY_MANAGE_ROLES', 'COMMUNITY_MANAGE_ARTICLES', 'COMMUNITY_MODERATE', 'WEBRTC_CREATE', 'WEBRTC_CREATE_CUSTOM', 'WEBRTC_MODERATE')`);
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "permissions" TYPE "public"."roles_permissions_enum_old"[] USING "permissions"::"text"::"public"."roles_permissions_enum_old"[]`);
        await queryRunner.query(`DROP TYPE "public"."roles_permissions_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."roles_permissions_enum_old" RENAME TO "roles_permissions_enum"`);
    }

}

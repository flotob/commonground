// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import format from "pg-format";
import { MigrationInterface, QueryRunner } from "typeorm";
import { PredefinedRole, RoleType } from "../common/enums";
import { rolePermissionPresets } from "../common/presets";
import { grantTablePermissions } from "../util/migrationUtils";

export class rolesAndPermissions1676888170060 implements MigrationInterface {
  name = 'rolesAndPermissions1676888170060'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "accounts" RENAME TO "users"`);
    await queryRunner.query(`DROP FUNCTION "public"."articles_tsvector_update" CASCADE`);
    await queryRunner.query(`DROP FUNCTION "public"."blogs_tsvector_update" CASCADE`);
    await queryRunner.query(`DROP FUNCTION "public"."communities_tsvector_update" CASCADE`);

    await queryRunner.query(`
      DO $$ 
      DECLARE 
        r RECORD;
      BEGIN
        FOR r IN (
          SELECT p.oid, p.proname, pg_get_function_identity_arguments(p.oid) AS args
          FROM pg_catalog.pg_proc p
          JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
          WHERE n.nspname = 'public' AND p.proname = 'has_user_community_access'
        ) LOOP
          EXECUTE format('DROP FUNCTION IF EXISTS %s(%s);', r.proname, r.args);
        END LOOP;
      END $$;
    `);
    await queryRunner.query(`DROP FUNCTION "public"."is_community_public_or_user_has_access" CASCADE`);
    await queryRunner.query(`DROP FUNCTION "public"."is_user_blocked" CASCADE`);
    await queryRunner.query(`DROP FUNCTION "public"."posts_tsvector_update" CASCADE`);
    await queryRunner.query(`DROP FUNCTION "public"."set_updatedat_on_update" CASCADE`);

    await queryRunner.query(`ALTER TABLE "devices" DROP CONSTRAINT "FK_c26a6d5e10ecd1be5182facadaa"`);
    await queryRunner.query(`ALTER TABLE "followers" DROP CONSTRAINT "FK_7fc4cc54501c17bca99a13fae84"`);
    await queryRunner.query(`ALTER TABLE "followers" DROP CONSTRAINT "FK_e1ece8c8117db1a9e408d6c742c"`);
    await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_4d8b2643c29b31e55b13b9213ab"`);
    await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_627bdb88ff88b446023474e4261"`);
    await queryRunner.query(`ALTER TABLE "channels" DROP CONSTRAINT "FK_671285a0007508af346c5271394"`);
    await queryRunner.query(`ALTER TABLE "channels" DROP CONSTRAINT "FK_9125e4835d18c934051a77c1d85"`);
    await queryRunner.query(`ALTER TABLE "communities" DROP CONSTRAINT "FK_2d9086cef1ffd5148f90a9fab5d"`);
    await queryRunner.query(`ALTER TABLE "channelreadstate" DROP CONSTRAINT "FK_da0c2bf7114fbe51b06730e770f"`);
    await queryRunner.query(`ALTER TABLE "channelreadstate" DROP CONSTRAINT "FK_ae098c148f519ef9609b0f87d6f"`);
    await queryRunner.query(`ALTER TABLE "channelreadstate" DROP CONSTRAINT "FK_296e773714ff4b39c6ec94becbe"`);
    await queryRunner.query(`ALTER TABLE "channelreadstate" DROP CONSTRAINT "FK_4265a32e555eb6a5c40d82a5285"`);
    await queryRunner.query(`ALTER TABLE "articles" DROP CONSTRAINT "FK_d08fa10065354a4a0192ae5d3db"`);
    await queryRunner.query(`ALTER TABLE "articles" DROP CONSTRAINT "FK_8628beae918a929c34c9fd9bcf5"`);
    await queryRunner.query(`ALTER TABLE "reactions" DROP CONSTRAINT "FK_ff49fe8e03f6e7aa4cb4f09f3de"`);
    await queryRunner.query(`ALTER TABLE "wallets" DROP CONSTRAINT "FK_b2cb163694d1e180388b6ada46e"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e1ece8c8117db1a9e408d6c742"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_7fc4cc54501c17bca99a13fae8"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_627bdb88ff88b446023474e426"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4d8b2643c29b31e55b13b9213a"`);
    await queryRunner.query(`DROP INDEX "public"."idx_groups_tsv_tags"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ba5f6954c97636942fbd7b19a2"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_da0c2bf7114fbe51b06730e770"`);
    await queryRunner.query(`DROP INDEX "public"."idx_articles_tsv_content"`);
    await queryRunner.query(`DROP INDEX "public"."idx_articles_tsv_tags"`);
    await queryRunner.query(`DROP INDEX "public"."idx_articles_tsv_title"`);
    await queryRunner.query(`DROP INDEX "public"."idx_articles_tsv_title_and_content"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_b2cb163694d1e180388b6ada46"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_b7c95ad4032e20b7d80bcba21b"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_0123adca8c7e5c4f95ee16220d"`);
    await queryRunner.query(`DROP INDEX "public"."idx_posts_tsv_tags"`);

    // drop constraints
    await queryRunner.query(`ALTER TABLE "followers" DROP CONSTRAINT "PK_1b926f716dcae7a42c4f3498890"`);
    await queryRunner.query(`ALTER TABLE "channelreadstate" DROP CONSTRAINT "PK_93bb04d5f3320003508db39b0db"`);
    await queryRunner.query(`ALTER TABLE "areas" DROP CONSTRAINT "FK_21d389a088a07773deb63bf962d"`);
    await queryRunner.query(`ALTER TABLE "communities" DROP CONSTRAINT "PK_659d1483316afb28afd3a90646e" CASCADE`);

    // communities
    await queryRunner.query(`ALTER TABLE "communities" RENAME COLUMN "ownerId" TO "creatorId"`);
    await queryRunner.query(`ALTER TABLE "communities" DROP COLUMN "tsv_tags"`);
    await queryRunner.query(`ALTER TABLE "communities" ADD "url" character varying(30)`);
    await queryRunner.query(`ALTER TABLE "communities" ADD CONSTRAINT "UQ_2225f47088e790ee1cda29ab92a" UNIQUE ("url")`);
    await queryRunner.query(`ALTER TABLE "communities" ADD "new_id" uuid NOT NULL DEFAULT gen_random_uuid()`);
    await queryRunner.query(`ALTER TABLE "communities" ADD "title" character varying(50)`);
    await queryRunner.query(`ALTER TABLE "communities" ADD "description" character varying(1000)`);
    await queryRunner.query(`ALTER TABLE "communities" ADD "shortDescription" character varying(50)`);
    await queryRunner.query(`ALTER TABLE "communities" ADD "logoSmallId" character varying(64)`);
    await queryRunner.query(`ALTER TABLE "communities" ADD "logoLargeId" character varying(64)`);
    await queryRunner.query(`ALTER TABLE "communities" ADD "headerImageId" character varying(64)`);
    await queryRunner.query(`ALTER TABLE "communities" ADD "tags" character varying(50) array`);
    await queryRunner.query(`ALTER TABLE "communities" ADD "links" jsonb`);
    await queryRunner.query(`ALTER TABLE "communities" ADD "memberCount" integer NOT NULL DEFAULT '1'`);
    const [ communityUpdateResult ]  = await queryRunner.query(`
      UPDATE "communities" c
      SET
        "title" = COALESCE(SUBSTRING(c."info"->>'title' FROM 1 FOR 50), ''),
        "description" = COALESCE(SUBSTRING(c."info"->>'description' FROM 1 FOR 1000), ''),
        "shortDescription" = COALESCE(SUBSTRING(c."info"->>'shortDescription' FROM 1 FOR 50), ''),
        "logoSmallId" = SUBSTRING(c."info"->>'imageId' FROM 1 FOR 64),
        "headerImageId" = SUBSTRING(c."info"->>'headerImageId' FROM 1 FOR 64),
        "tags" = ARRAY(SELECT SUBSTRING(jsonb_array_elements_text(c."info"->'tags') FROM 1 FOR 50)),
        "links" = COALESCE(c."info"->'links', '[]'::JSONB),
        "url" = c."id"
      RETURNING "id" AS "oldId", "new_id" AS "newId"
    `);
    const oldToNewCommunityIds = new Map<string, string>();
    for (const row of (communityUpdateResult as { oldId: string, newId: string }[])) {
      oldToNewCommunityIds.set(row.oldId, row.newId);
    }
    const CTE_new_community_ids = `
      new_community_ids AS (
        SELECT * FROM unnest(
          ${format(
            'ARRAY[%L]::TEXT[], ARRAY[%L]::UUID[]',
            Array.from(oldToNewCommunityIds.keys()),
            Array.from(oldToNewCommunityIds.values()),
          )}
        ) AS t("oldId", "newId")
      )`;
    await queryRunner.query(`ALTER TABLE "communities" ALTER COLUMN "title" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "communities" ALTER COLUMN "description" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "communities" ALTER COLUMN "shortDescription" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "communities" ALTER COLUMN "tags" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "communities" ALTER COLUMN "links" SET NOT NULL`);

    await queryRunner.query(`ALTER TABLE "communities" DROP COLUMN "info"`);
    await queryRunner.query(`ALTER TABLE "communities" DROP COLUMN "id"`);
    await queryRunner.query(`ALTER TABLE "communities" RENAME COLUMN "new_id" TO "id"`);
    await queryRunner.query(`ALTER TABLE "communities" ADD CONSTRAINT "PK_fea1fe83c86ccde9d0a089e7ea2" PRIMARY KEY ("id")`);

    // areas
    await queryRunner.query(`ALTER TABLE "areas" RENAME COLUMN "name" TO "title"`);
    await queryRunner.query(`ALTER TABLE "areas" DROP COLUMN "writableBy"`);
    await queryRunner.query(`DROP TYPE "public"."areas_writableby_enum"`);
    await queryRunner.query(`ALTER TABLE "areas" ADD "newCommunityId" uuid`);
    await queryRunner.query(`ALTER TABLE "areas" ADD "newId" uuid NOT NULL DEFAULT gen_random_uuid()`);
    const [ areaUpdateResult ] = await queryRunner.query(`
      WITH ${CTE_new_community_ids}
      UPDATE areas a
      SET "newCommunityId" = (
        SELECT "newId" FROM new_community_ids
        WHERE "oldId" = a."communityId"
      )
      RETURNING
        "communityId" AS "oldCommunityId",
        "newCommunityId",
        "id" AS "oldId",
        "newId",
        "accessrules",
        "title"
    `);
    const areaRows = areaUpdateResult as {
      oldCommunityId: string;
      newCommunityId: string;
      oldId: string;
      newId: string;
      accessrules: any;
      title: string;
    }[];
    const CTE_new_area_ids = `
      new_area_ids AS (
        SELECT * FROM unnest(
          ${format(
            'ARRAY[%L]::TEXT[], ARRAY[%L]::UUID[], ARRAY[%L]::TEXT[], ARRAY[%L]::UUID[]',
            areaRows.map(r => r.oldCommunityId),
            areaRows.map(r => r.newCommunityId),
            areaRows.map(r => r.oldId),
            areaRows.map(r => r.newId),
          )}
        ) AS t("oldCommunityId", "newCommunityId", "oldId", "newId")
      )`;
    await queryRunner.query(`ALTER TABLE "areas" DROP COLUMN "accessrules"`);
    await queryRunner.query(`ALTER TABLE "areas" DROP COLUMN "id" CASCADE`);
    await queryRunner.query(`ALTER TABLE "areas" RENAME COLUMN "newId" TO "id"`);
    await queryRunner.query(`ALTER TABLE "areas" ADD CONSTRAINT "PK_5110493f6342f34c978c084d0d6" PRIMARY KEY ("id")`);
    await queryRunner.query(`ALTER TABLE "areas" DROP COLUMN "communityId"`);
    await queryRunner.query(`ALTER TABLE "areas" RENAME COLUMN "newCommunityId" TO "communityId"`);
    await queryRunner.query(`ALTER TABLE "areas" ALTER COLUMN "communityId" SET NOT NULL`);

    // communities-channels
    await queryRunner.query(`CREATE TYPE "public"."communities_channels_roles_permissions_permissions_enum" AS ENUM('CHANNEL_EXISTS', 'CHANNEL_READ', 'CHANNEL_WRITE', 'CHANNEL_MODERATE')`);
    await queryRunner.query(`CREATE TABLE "communities_channels_roles_permissions" ("communityId" uuid NOT NULL, "channelId" uuid NOT NULL, "roleId" uuid NOT NULL, "permissions" "public"."communities_channels_roles_permissions_permissions_enum" array NOT NULL, CONSTRAINT "PK_c9b14dd08a895d2ad04b0906842" PRIMARY KEY ("communityId", "channelId", "roleId"))`);
    await grantTablePermissions(queryRunner, 'communities_channels_roles_permissions');
    await queryRunner.query(`CREATE INDEX "IDX_89bcf47ebf32545b97b0ceb1da" ON "communities_channels_roles_permissions" ("permissions") `);
    await queryRunner.query(`CREATE INDEX "IDX_b841c306c38207d63603aa04e6" ON "communities_channels_roles_permissions" ("communityId", "channelId") `);

    // chats
    await queryRunner.query(`CREATE TABLE "chats" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "userIds" uuid array NOT NULL, "adminIds" uuid array NOT NULL, "channelId" uuid NOT NULL, "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP(3) WITH TIME ZONE, CONSTRAINT "UQ_5f3b9ee5b6b54172d99f2b5175e" UNIQUE ("channelId"), CONSTRAINT "REL_5f3b9ee5b6b54172d99f2b5175" UNIQUE ("channelId"), CONSTRAINT "PK_0117647b3c4a4e5ff198aeb6206" PRIMARY KEY ("id"))`);
    await grantTablePermissions(queryRunner, 'chats');
    await queryRunner.query(`CREATE INDEX "IDX_4fbd89e00402a163074aafee22" ON "chats" ("userIds") `);

    // communities-channels
    await queryRunner.query(`ALTER TABLE "channels" ADD "emoji" character varying(4)`);
    await queryRunner.query(`ALTER TABLE "channels" RENAME COLUMN "name" TO "title"`);
    await queryRunner.query(`ALTER TABLE "channels" ADD "newCommunityId" uuid`);
    await queryRunner.query(`ALTER TABLE "channels" ADD "newAreaId" uuid`);
    await queryRunner.query(`ALTER TABLE "channels" ADD "channelId" uuid`);
    await queryRunner.query(`ALTER TABLE "channels" ADD "url" character varying(30)`);
    await queryRunner.query(`ALTER TABLE "channels" ADD "description" character varying(256)`);
    const [channelUpdateResult] = await queryRunner.query(`
      WITH
        ${CTE_new_community_ids},
        ${CTE_new_area_ids}
      UPDATE "channels" c
      SET
        "newCommunityId" = (
          SELECT "newId" FROM new_community_ids
          WHERE "oldId" = c."communityId"
        ),
        "newAreaId" = (
          SELECT "newId" FROM new_area_ids
          WHERE "oldId" = c."areaId"
            AND "oldCommunityId" = c."communityId"
        ),
        "emoji" = SUBSTRING("channelInfo"->>'emoji' FROM 1 FOR 4),
        "description" = SUBSTRING("channelInfo"->>'description' FROM 1 FOR 256),
        "channelId" = gen_random_uuid()
      WHERE c."type" = 'text'
      RETURNING
        c."channelId",
        c."id" AS "oldId",
        c."communityId" AS "oldCommunityId",
        c."newCommunityId" AS "newCommunityId",
        c."areaId" AS "oldAreaId",
        c."deletedAt"
    `);
    const channelRows = channelUpdateResult as {
      channelId: string;
      oldId: string;
      oldCommunityId: string;
      newCommunityId: string;
      oldAreaId: string;
      deletedAt: string | null;
    }[];
    const CTE_new_channel_ids = `
      new_channel_ids AS (
        SELECT * FROM unnest(
          ${format(
            'ARRAY[%L]::TEXT[], ARRAY[%L]::UUID[], ARRAY[%L]::TEXT[], ARRAY[%L]::UUID[]',
            channelRows.map(r => r.oldId),
            channelRows.map(r => r.channelId),
            channelRows.map(r => r.oldCommunityId),
            channelRows.map(r => r.newCommunityId),
          )}
        ) AS t("oldId", "channelId", "oldCommunityId", "newCommunityId")
      )`;
    await queryRunner.query(`DELETE FROM "channels" WHERE "type" <> 'text'`);
    await queryRunner.query(`ALTER TABLE "channels" DROP COLUMN "channelInfo"`);
    await queryRunner.query(`ALTER TABLE "channels" DROP COLUMN "communityId" CASCADE`);
    await queryRunner.query(`ALTER TABLE "channels" RENAME COLUMN "newCommunityId" TO "communityId"`);
    await queryRunner.query(`ALTER TABLE "channels" DROP COLUMN "areaId" CASCADE`);
    await queryRunner.query(`ALTER TABLE "channels" RENAME COLUMN "newAreaId" TO "areaId"`);
    await queryRunner.query(`ALTER TABLE "channels" DROP COLUMN "id" CASCADE`);
    await queryRunner.query(`ALTER TABLE "channels" DROP COLUMN "type"`);
    await queryRunner.query(`ALTER TABLE "channels" ADD CONSTRAINT "PK_bc603823f3f741359c2339389f9" PRIMARY KEY ("channelId", "communityId")`);

    // conversations to channels
    type TmpConv = {
      accountId: string,
      otherAccountId: string,
      lastRead: string | null,
      createdAt: string,
      updatedAt: string,
      deletedAt: string | null
    };
    const conversations: TmpConv[] = await queryRunner.query(`
      SELECT * FROM conversations
      WHERE "deletedAt" IS NULL
    `);
    let a: string, b: string;
    const filtered = new Map<string, TmpConv>();
    for (const c of conversations) {
      if (c.accountId < c.otherAccountId) {
        a = c.accountId;
        b = c.otherAccountId;
      } else {
        a = c.otherAccountId;
        b = c.accountId;
      }
      if (!filtered.has(a+b) && a !== b) {
        filtered.set(a+b, c);
      }
    }

    const chatsToAdd = Array.from(filtered.entries());
    if (chatsToAdd.length > 0) {
      await queryRunner.query(`
        INSERT INTO "chats" (
          "userIds",
          "adminIds",
          "channelId"
        )
        VALUES
          ${chatsToAdd.map(([key, conv]) => format(
            '(ARRAY[%L]::UUID[], ARRAY[]::UUID[], gen_random_uuid())',
            [conv.accountId, conv.otherAccountId]
          )).join(',')}
      `);
    }

    // channels
    await queryRunner.query(`ALTER TABLE "channels" RENAME TO "communities_channels"`);
    await queryRunner.query(`CREATE TABLE "channels" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), CONSTRAINT "PK_ADSadassddASDD" PRIMARY KEY ("id"))`);
    await grantTablePermissions(queryRunner, 'channels');
    await queryRunner.query(`
      INSERT INTO channels ("id")
      SELECT "channelId"
      FROM "communities_channels"
      UNION
      SELECT "channelId"
      FROM "chats"
    `);

    // files
    await queryRunner.query(`CREATE TABLE "files" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "creatorId" uuid, "objectId" character varying(64) NOT NULL, "accessedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "data" jsonb, "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_0a7ef7e11c4f38bc46644aaa1bd" UNIQUE ("objectId"), CONSTRAINT "PK_6c16b9093a142e0e7613b04a3d9" PRIMARY KEY ("id"))`);
    await grantTablePermissions(queryRunner, 'files');
    await queryRunner.query(`CREATE INDEX "IDX_0a7ef7e11c4f38bc46644aaa1b" ON "files" ("objectId") `);
    await queryRunner.query(`CREATE INDEX "IDX_1d71b8b0be427a102d1e7930a4" ON "files" ("accessedAt") `);

    // notifications
    await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_9afbbcc2e5d68f635d772956e62"`);
    await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_b7c95ad4032e20b7d80bcba21b9"`);
    await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum" AS ENUM('Follower', 'Mention', 'Reply')`);
    await queryRunner.query(`ALTER TABLE "events" RENAME COLUMN "accountId" TO "userId"`);
    await queryRunner.query(`ALTER TABLE "events" ADD "newType" "public"."notifications_type_enum"`);
    await queryRunner.query(`ALTER TABLE "events" ADD "extraData" jsonb`);
    await queryRunner.query(`ALTER TABLE "events" ADD "subjectItemId" uuid`);
    await queryRunner.query(`ALTER TABLE "events" ADD "newCommunityId" uuid`);
    await queryRunner.query(`ALTER TABLE "events" ADD "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now()`);
    await queryRunner.query(`
      WITH
        ${CTE_new_community_ids},
        ${CTE_new_channel_ids}
      UPDATE "events" ev SET
        "newType" = ev."type"::"public"."notifications_type_enum",
        "extraData" = JSONB_BUILD_OBJECT(
          'channelId', (
            SELECT "channelId" FROM new_channel_ids nc
            WHERE nc."oldId" = SUBSTRING(ev."clickData"->>'channelId' FROM 15 FOR 4)
              AND nc."oldCommunityId" = ev."subjectCommunityId"
          )
        ),
        "newCommunityId" = (
          SELECT "newId"
          FROM new_community_ids
          WHERE "oldId" = SUBSTRING("clickData"->>'channelId' FROM 1 FOR 10)
        ),
        "subjectItemId" = ("clickData"->>'postId')::UUID
      WHERE "type" = ANY('{"Mention", "Reply"}')
    `);
    await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "type"`);
    await queryRunner.query(`ALTER TABLE "events" RENAME COLUMN "newType" TO "type"`);
    await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "subjectCommunityId"`);
    await queryRunner.query(`ALTER TABLE "events" RENAME COLUMN "newCommunityId" TO "subjectCommunityId"`);
    await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "clickData"`);
    await queryRunner.query(`ALTER TABLE "events" RENAME TO "notifications"`);
    await queryRunner.query(`CREATE INDEX "IDX_692a909ee0fa9383e7859f9b40" ON "notifications" ("userId") `);
    await queryRunner.query(`CREATE INDEX "IDX_33b6c983568d94b5c9bf3fa1da" ON "notifications" ("subjectUserId") `);
    await queryRunner.query(`CREATE INDEX "IDX_7c51177f5ae4bd792c34ae5e85" ON "notifications" ("subjectCommunityId") `);
    await queryRunner.query(`CREATE INDEX "IDX_1feecae18b4b8800ad611035f9" ON "notifications" ("subjectItemId") `);
    await queryRunner.query(`CREATE INDEX "IDX_f8b7ed75170d2d7dca4477cc94" ON "notifications" ("read") `);
    await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "type" SET NOT NULL`);

    // devices
    await queryRunner.query(`ALTER TABLE "devices" RENAME COLUMN "accountId" TO "userId"`);

    // reactions
    await queryRunner.query(`ALTER TABLE "reactions" RENAME COLUMN "accountId" TO "userId"`);
    await queryRunner.query(`ALTER TABLE "reactions" RENAME CONSTRAINT "PK_5728e9769987c663d63b547da34" TO "PK_1122bb25d045eff00fe9f4ec6e2"`);

    // wallets
    await queryRunner.query(`ALTER TABLE "wallets" RENAME COLUMN "accountId" TO "userId"`);

    // roles
    await queryRunner.query(`CREATE TYPE "public"."roles_type_enum" AS ENUM('PREDEFINED', 'CUSTOM_MANUAL_ASSIGN', 'CUSTOM_AUTO_ASSIGN')`);
    await queryRunner.query(`CREATE TYPE "public"."roles_permissions_enum" AS ENUM('COMMUNITY_MANAGE_INFO', 'COMMUNITY_MANAGE_CHANNELS', 'COMMUNITY_MANAGE_ROLES', 'COMMUNITY_MANAGE_ARTICLES', 'COMMUNITY_MODERATE', 'WEBRTC_CREATE', 'WEBRTC_CREATE_CUSTOM', 'WEBRTC_MODERATE')`);
    await queryRunner.query(`CREATE TABLE "roles" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "communityId" uuid NOT NULL, "title" character varying(64) NOT NULL, "type" "public"."roles_type_enum" NOT NULL, "assignmentRules" jsonb, "permissions" "public"."roles_permissions_enum" array NOT NULL, "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP(3) WITH TIME ZONE, CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`);
    await grantTablePermissions(queryRunner, 'roles');
    await queryRunner.query(`CREATE INDEX "IDX_fb2994209e76f9948683d49e6f" ON "roles" ("communityId") `);

    // users
    await queryRunner.query(`ALTER TABLE "users" ADD "twitter" character varying(64)`);
    await queryRunner.query(`ALTER TABLE "users" ADD "homepage" character varying(256)`);
    await queryRunner.query(`ALTER TABLE "users" ADD "description" character varying(1000)`);
    await queryRunner.query(`ALTER TABLE "users" ADD "links" jsonb NOT NULL DEFAULT '[]'`);
    await queryRunner.query(`ALTER TABLE "users" ADD "fractalId" character varying(128)`);
    await queryRunner.query(`ALTER TABLE "users" ADD "communityOrder" character varying(10) array NOT NULL DEFAULT '{}'`);
    await queryRunner.query(`ALTER TABLE "users" ADD "communityOrder_new" uuid array NOT NULL DEFAULT '{}'`);
    await queryRunner.query(`ALTER TABLE "users" ADD "finishedTutorials" character varying(20) array NOT NULL DEFAULT '{}'`);
    await queryRunner.query(`ALTER TABLE "users" ADD "password" text`);
    await queryRunner.query(`ALTER TABLE "users" ADD "followingCount" integer NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "users" ADD "followerCount" integer NOT NULL DEFAULT 0`);
    await queryRunner.query(`
      UPDATE "users" u SET
        "twitter" = SUBSTRING(u."profile"->>'twitter' FROM 1 FOR 64),
        "homepage" = SUBSTRING(u."profile"->>'homepage' FROM 1 FOR 256),
        "description" = SUBSTRING(u."profile"->>'description' FROM 1 FOR 1000),
        "links" = COALESCE(u."profile"->'links', '[]'::JSONB),
        "fractalId" = u."verification"->>'fractalId',
        "communityOrder" = ARRAY(SELECT jsonb_array_elements_text(u."groupOrder")),
        "followingCount" = (SELECT COUNT(*)::integer FROM followers f WHERE f."accountId" = u."id"),
        "followerCount" = (SELECT COUNT(*)::integer FROM followers f WHERE f."otherAccountId" = u."id")
    `);
    const usersWithCommunityOrder: {
      id: string,
      communityOrder: string[],
    }[] = await queryRunner.query(`
      SELECT "id", "communityOrder" FROM users
    `);
    await Promise.all(usersWithCommunityOrder.map(async (item) => {
      const newOrderData = format("%L", item.communityOrder.map(oldId => oldToNewCommunityIds.get(oldId)));
      await queryRunner.query(`
        UPDATE users
        SET "communityOrder_new" = ARRAY[${newOrderData}]::UUID[]
        WHERE id = ${format("%L::UUID", item.id)}
      `);
    }));
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "publicKey"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "profile"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "blogCreator"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "verification"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "groupOrder"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "recoveryStorage"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "onboardingComplete"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "communityOrder"`);
    await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "communityOrder_new" TO "communityOrder"`);

    // userblocking
    await queryRunner.query(`CREATE TYPE "public"."userblocking_blockstate_enum" AS ENUM('CHAT_MUTED', 'BANNED')`);
    await queryRunner.query(`CREATE TABLE "userblocking" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "communityId" uuid NOT NULL, "channelId" uuid, "userId" uuid NOT NULL, "until" TIMESTAMP(3) WITH TIME ZONE, "blockState" "public"."userblocking_blockstate_enum" NOT NULL, "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP(3) WITH TIME ZONE, CONSTRAINT "PK_6374675935dcb858c7344fa1310" PRIMARY KEY ("id"))`);
    await grantTablePermissions(queryRunner, 'userblocking');

    // roles-users
    await queryRunner.query(`CREATE TABLE "roles_users_users" ("rolesId" uuid NOT NULL, "usersId" uuid NOT NULL, CONSTRAINT "PK_d9b9cca39b8cc7e99072274dafa" PRIMARY KEY ("rolesId", "usersId"))`);
    await grantTablePermissions(queryRunner, 'roles_users_users');
    await queryRunner.query(`CREATE INDEX "IDX_6baa1fce24dde516186c4f0269" ON "roles_users_users" ("rolesId") `);
    await queryRunner.query(`CREATE INDEX "IDX_391282056f6da8665b38480a13" ON "roles_users_users" ("usersId") `);

    // roles-contracts
    await queryRunner.query(`CREATE TABLE "roles_contracts_contracts" ("rolesId" uuid NOT NULL, "contractsId" uuid NOT NULL, CONSTRAINT "PK_1ac90acf7f4b73f4c6e4d80198a" PRIMARY KEY ("rolesId", "contractsId"))`);
    await grantTablePermissions(queryRunner, 'roles_contracts_contracts');
    await queryRunner.query(`CREATE INDEX "IDX_3f4bab8171ee914ba47803f520" ON "roles_contracts_contracts" ("rolesId") `);
    await queryRunner.query(`CREATE INDEX "IDX_8082c886acc5cb4d1347f0dd3c" ON "roles_contracts_contracts" ("contractsId") `);

    // contracts
    await queryRunner.query(`ALTER TABLE "contracts" DROP COLUMN "updated_at_block"`);
    await queryRunner.query(`ALTER TABLE "contracts" ADD "updatedAtBlock" bigint`);
    await queryRunner.query(`ALTER TABLE "contracts" ADD "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now()`);

    // followers
    await queryRunner.query(`ALTER TABLE "followers" RENAME COLUMN "accountId" TO "userId"`);
    await queryRunner.query(`ALTER TABLE "followers" RENAME COLUMN "otherAccountId" TO "otherUserId"`);
    await queryRunner.query(`ALTER TABLE "followers" ADD CONSTRAINT "PK_3aee0e554f73db51bc06f5f6714" PRIMARY KEY ("userId", "otherUserId")`);

    // posts to messages
    await queryRunner.query(`
      WITH deleted_messages AS (
        DELETE FROM "messages"
        RETURNING "id"
      )
      DELETE FROM reactions 
      USING deleted_messages
      WHERE reactions."itemId" = deleted_messages."id"
    `);
    await queryRunner.query(`DROP TABLE "messages"`);
    await queryRunner.query(`ALTER TABLE "posts" RENAME TO "messages"`);
    await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_aae2a693e9663af83068dfd97d7"`);
    await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_d9ac3ea6a30d3913860fbe5f281"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_46bc204f43827b6f25e0133dbf"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_78e008806ce2d7c53e406e1b0f"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_2fdceba3d316f92cf224ba56fa"`);
    await queryRunner.query(`ALTER TABLE "messages" RENAME COLUMN "accountId" TO "creatorId"`);
    await queryRunner.query(`ALTER TABLE "messages" RENAME COLUMN "parentPostId" TO "parentMessageId"`);
    await queryRunner.query(`ALTER TABLE "messages" ADD "reactions" jsonb`);
    await queryRunner.query(`ALTER TABLE "messages" ADD "newChannelId" uuid`);

    await queryRunner.query(`
      WITH
        ${CTE_new_channel_ids}
      UPDATE "messages" m
      SET
        "newChannelId" = (
          SELECT nc."channelId" FROM new_channel_ids nc
          WHERE nc."oldId" = m."channelId" AND nc."oldCommunityId" = m."communityId"
        ),
        "reactions" = (
          SELECT jsonb_object_agg("reaction", "count") AS "result"
          FROM (
            SELECT
              r."reaction",
              COUNT(r."userId") AS "count"
            FROM "reactions" r
            WHERE r."itemId" = m."id"
              AND r."deletedAt" IS NULL
            GROUP BY r."reaction"
          ) AS "subq"
        )
    `);
    await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "communityId"`);
    await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "areaId"`);
    await queryRunner.query(`ALTER TABLE "messages" ADD "editedAt" TIMESTAMP(3) WITH TIME ZONE`);
    await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "channelId"`);
    await queryRunner.query(`ALTER TABLE "messages" RENAME COLUMN "newChannelId" TO "channelId"`);
    await queryRunner.query(`ALTER TABLE "messages" ALTER COLUMN "channelId" SET NOT NULL`);

    await queryRunner.query(`CREATE INDEX "IDX_fad0fd6def6fa89f66dcf5aaca" ON "messages" ("channelId") `);
    await queryRunner.query(`CREATE INDEX "IDX_379d3b2679ddf515e5a90de015" ON "messages" ("parentMessageId") `);
    await queryRunner.query(`CREATE INDEX "idx_posts_tsv_tags" ON "messages" ("tsv_tags") `);
    await queryRunner.query(`CREATE INDEX "IDX_6ce6acdb0801254590f8a78c08" ON "messages" ("createdAt") `);
    await queryRunner.query(`CREATE INDEX "IDX_284257a7a4f1c23a4bda08ecf2" ON "messages" ("updatedAt") `);
    await queryRunner.query(`CREATE INDEX "IDX_26e962f7c89b9f0b5c417b442f" ON "messages" ("deletedAt") `);
    await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_cb1198160fa8652a25c293bc25f" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_fad0fd6def6fa89f66dcf5aaca5" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_379d3b2679ddf515e5a90de0153" FOREIGN KEY ("parentMessageId") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);



    // channelreadstate
    await queryRunner.query(`ALTER TABLE "channelreadstate" RENAME COLUMN "accountId" TO "userId"`);
    await queryRunner.query(`ALTER TABLE "channelreadstate" RENAME COLUMN "lastread" TO "lastRead"`);
    await queryRunner.query(`ALTER TABLE "channelreadstate" ADD "newChannelId" uuid`);
    await queryRunner.query(`
      WITH
        ${CTE_new_channel_ids}
      UPDATE "channelreadstate" crs
      SET
        "newChannelId" = (
          SELECT "channelId" FROM new_channel_ids nc
          WHERE nc."oldCommunityId" = crs."communityId"
            AND nc."oldId" = crs."channelId"
        )
    `);
    await queryRunner.query(`ALTER TABLE "channelreadstate" DROP COLUMN "communityId"`);
    await queryRunner.query(`ALTER TABLE "channelreadstate" DROP COLUMN "areaId"`);
    await queryRunner.query(`ALTER TABLE "channelreadstate" DROP COLUMN "channelId"`);
    await queryRunner.query(`ALTER TABLE "channelreadstate" RENAME COLUMN "newChannelId" TO "channelId"`);
    await queryRunner.query(`ALTER TABLE "channelreadstate" ADD CONSTRAINT "PK_e289d22b2a2d591dd1a9faa2889" PRIMARY KEY ("userId", "channelId")`);



    // communities-articles (and permissions)
    await queryRunner.query(`CREATE TABLE "communities_articles" ("communityId" uuid NOT NULL, "articleId" uuid NOT NULL, "url" character varying(30), "published" TIMESTAMP(3) WITH TIME ZONE, "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP(3) WITH TIME ZONE, CONSTRAINT "UQ_5c955fa4ba8e16c3e98ce0f78ed" UNIQUE ("communityId", "url"), CONSTRAINT "PK_a90fe9c78cca2a0ec607309f878" PRIMARY KEY ("communityId", "articleId"))`);
    await grantTablePermissions(queryRunner, 'communities_articles');
    await queryRunner.query(`CREATE TYPE "public"."communities_articles_roles_permissions_permissions_enum" AS ENUM('ARTICLE_PREVIEW', 'ARTICLE_READ')`);
    await queryRunner.query(`CREATE TABLE "communities_articles_roles_permissions" ("communityId" uuid NOT NULL, "articleId" uuid NOT NULL, "roleId" uuid NOT NULL, "permissions" "public"."communities_articles_roles_permissions_permissions_enum" array NOT NULL, CONSTRAINT "PK_f2919c107065354676792b25087" PRIMARY KEY ("communityId", "articleId", "roleId"))`);
    await grantTablePermissions(queryRunner, 'communities_articles_roles_permissions');
    await queryRunner.query(`CREATE INDEX "IDX_1ad6e3599c3864e11fa47fc526" ON "communities_articles_roles_permissions" ("permissions") `);

    await queryRunner.query(`
      WITH
        ${CTE_new_community_ids},
        select_articles AS (
          SELECT
            a."id" AS "articleId",
            (
              SELECT "newId"
              FROM new_community_ids
              WHERE "oldId" = a."communityId"
            ) as "communityId",
            a."published",
            a."createdAt",
            a."updatedAt",
            a."deletedAt"
          FROM "articles" a
        )
      INSERT INTO "communities_articles" (
        "articleId",
        "communityId",
        "published",
        "createdAt",
        "updatedAt",
        "deletedAt"
      )
      SELECT * FROM select_articles
    `);

    await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN "communityId"`);

    // users-articles
    await queryRunner.query(`ALTER TABLE "blogs" RENAME TO "users_articles"`);

    await queryRunner.query(`ALTER TABLE "users_articles" DROP CONSTRAINT "FK_af5a5654616feb7437a27b0af23"`);
    await queryRunner.query(`ALTER TABLE "users_articles" DROP CONSTRAINT "PK_e113335f11c926da929a625f118"`);
    await queryRunner.query(`DROP INDEX "public"."idx_blogs_tsv_content"`);
    await queryRunner.query(`DROP INDEX "public"."idx_blogs_tsv_tags"`);
    await queryRunner.query(`DROP INDEX "public"."idx_blogs_tsv_title"`);
    await queryRunner.query(`DROP INDEX "public"."idx_blogs_tsv_title_and_content"`);
    await queryRunner.query(`ALTER TABLE "users_articles" RENAME COLUMN "creatorId" TO "userId"`);
    await queryRunner.query(`ALTER TABLE "users_articles" RENAME COLUMN "id" TO "articleId"`);
    await queryRunner.query(`ALTER TABLE "users_articles" ADD CONSTRAINT "PK_de4a1ca2dbfefc063bd12b7be96" PRIMARY KEY ("userId", "articleId")`);
    await queryRunner.query(`ALTER TABLE "users_articles" ADD "url" character varying(30)`);
    
    await queryRunner.query(`
      WITH
        select_articles AS (
          SELECT
            ua."articleId" AS "id",
            ua."userId" AS "creatorId",
            ua."headerImageId",
            ua."thumbnailImageId",
            ua."title",
            ua."content",
            ua."previewText",
            ua."tags",
            ua."createdAt",
            ua."updatedAt",
            ua."deletedAt"
          FROM "users_articles" ua
        )
      INSERT INTO "articles" (
        "id",
        "creatorId",
        "headerImageId",
        "thumbnailImageId",
        "title",
        "content",
        "previewText",
        "tags",
        "createdAt",
        "updatedAt",
        "deletedAt"
      )
      SELECT * FROM select_articles
    `);

    // roles and permissions
    for (const oldId of oldToNewCommunityIds.keys()) {
      const oldCommunityId = oldId;
      const newCommunityId = oldToNewCommunityIds.get(oldId) as string;

      const groupAccessData: { accountId: string, accesslevel: "admin" | "moderator" | "editor" | "user" }[] = await queryRunner.query(format(`
        SELECT "accountId", "accesslevel"
        FROM groupaccess
        WHERE "communityId" = %L AND "deletedAt" IS NULL
      `, oldCommunityId));
      await queryRunner.query(`
        UPDATE "communities" SET "memberCount" = $1 WHERE "id" = $2::UUID`,
        [groupAccessData.length, newCommunityId]
      );

      const roleMembership: {
        [roleName: string]: string[];
      } = {
        'Admin': groupAccessData.filter(d => d.accesslevel === "admin").map(d => d.accountId),
        'Moderator': groupAccessData.filter(d => d.accesslevel === "moderator").map(d => d.accountId),
        'Editor': groupAccessData.filter(d => d.accesslevel === "editor").map(d => d.accountId),
        'Member': groupAccessData.map(d => d.accountId)
      };
      const areaRoleNames: {
        [areaId: string]: string[];
      } = {};

      const areaData = areaRows.filter(r => r.newCommunityId === newCommunityId);

      // Gather area data for role and role membership creation
      const oldAreaIdToNewRoleName: {
        [oldAreaId: string]: string;
      } = {};
      const roleInsertArray: string[] = [];
      const takenNames = new Set<string>([
        PredefinedRole.Admin,
        PredefinedRole.Member,
        PredefinedRole.Public,
        'Moderator',
        'Editor',
      ]);
      for (const area of areaData) {
        if (!!area.accessrules) {
          const assignmentRules: Models.Community.AssignmentRules = {
            type: "token",
            rules: area.accessrules
          };
          let roleName = `${area.title}`;
          if (takenNames.has(roleName)) {
            let i = 1;
            while (takenNames.has(`${roleName}_${i}`)) {
              i++;
            }
            roleName = `${roleName}_${i}`;
          }
          takenNames.add(roleName);
          oldAreaIdToNewRoleName[area.oldId] = roleName;
          roleInsertArray.push(format(
            `($1, %L, 'CUSTOM_AUTO_ASSIGN', %L::JSONB, ARRAY[${format('%L', rolePermissionPresets.Community.Member)}]::"public"."roles_permissions_enum"[])`,
            roleName,
            JSON.stringify(assignmentRules),
          ));

          const areaAccessData: { accountId: string }[] = await queryRunner.query(format(`
            SELECT "accountId"
            FROM areaaccess
            WHERE "areaId" = %L AND "communityId" = %L AND "granted" = TRUE AND "deletedAt" IS NULL
          `, area.oldId, oldCommunityId));

          roleMembership[roleName] = areaAccessData.map(d => d.accountId);
          areaRoleNames[area.oldId] = [roleName];
        } else {
          areaRoleNames[area.oldId] = ['Member', 'Public'];
        }
      }

      // Create roles
      const createdRoleData: { id: string, title: string }[] = await queryRunner.query(`
        INSERT INTO "roles" ("communityId", "title", "type", "assignmentRules", "permissions")
        VALUES
          ($1, ${format('%L, %L', PredefinedRole.Admin, RoleType.PREDEFINED)}, NULL, ARRAY[${format('%L', rolePermissionPresets.Community.Admin)}]::"public"."roles_permissions_enum"[]),
          ($1, ${format('%L, %L', PredefinedRole.Member, RoleType.PREDEFINED)}, NULL, ARRAY[${format('%L', rolePermissionPresets.Community.Member)}]::"public"."roles_permissions_enum"[]),
          ($1, ${format('%L, %L', PredefinedRole.Public, RoleType.PREDEFINED)}, NULL, ARRAY[${format('%L', rolePermissionPresets.Community.Public)}]::"public"."roles_permissions_enum"[]),
          ($1, ${format('%L, %L', 'Moderator', RoleType.CUSTOM_MANUAL_ASSIGN)}, NULL, ARRAY[${format('%L', rolePermissionPresets.Community.Moderator)}]::"public"."roles_permissions_enum"[]),
          ($1, ${format('%L, %L', 'Editor', RoleType.CUSTOM_MANUAL_ASSIGN)}, NULL, ARRAY[${format('%L', rolePermissionPresets.Community.Editor)}]::"public"."roles_permissions_enum"[])
          ${roleInsertArray.length > 0 ? `,${roleInsertArray.join(',')}` : ''}
        RETURNING "id", "title"
      `, [newCommunityId]);

      // Create user-role relationships
      const userRoleInsert: string[] = [];
      for (const roleName of Object.keys(roleMembership)) {
        const roleId = createdRoleData.find(d => d.title === roleName)?.id;
        if (!!roleId) {
          for (const userId of roleMembership[roleName]) {
            userRoleInsert.push(format(`(%L::UUID, %L::UUID)`, userId, roleId));
          }
        } else {
          throw new Error(`Role ${roleName} was not correctly created. Aborting...`);
        }
      }
      if (userRoleInsert.length > 0) {
        await queryRunner.query(`
          INSERT INTO "roles_users_users" ("usersId", "rolesId")
          VALUES ${userRoleInsert.join(',')}
        `);
      }

      // Assign article-role relationships
      const articleData: {
        articleId: string,
        visibility: "public" | "community" | "areas",
        oldAreaIds: string[]
      }[] = await queryRunner.query(`
        SELECT
          ca."articleId",
          a."visibility",
          coalesce(
            array_to_json(array_agg(ar."areaId")),
            '[]'::json
          ) AS "oldAreaIds"
        FROM "communities_articles" ca
        INNER JOIN "articles" a
          ON ca."articleId" = a."id"
        LEFT OUTER JOIN "areaarticles" ar
          ON ar."articleId" = ca."articleId"
        WHERE ca."communityId" = $1
        GROUP BY
          ca."articleId",
          a."visibility"
      `, [newCommunityId]);

      const articleRoleInsert: string[] = [];
      const publicRoleId = createdRoleData.find(d => d.title === PredefinedRole.Public)?.id;
      const memberRoleId = createdRoleData.find(d => d.title === PredefinedRole.Member)?.id;
      const adminRoleId = createdRoleData.find(d => d.title === PredefinedRole.Admin)?.id;
      const baseArticleRoleInsert =
        `(%L::UUID, %L::UUID, %L::UUID, ARRAY[%L]::"public"."communities_articles_roles_permissions_permissions_enum"[])`;
      for (const article of articleData) {
        if (article.visibility === "public") {
          articleRoleInsert.push(format(
            baseArticleRoleInsert,
            newCommunityId,
            article.articleId,
            publicRoleId,
            rolePermissionPresets.Article.Visible,
          ));

        } else if (article.visibility === "community") {
          articleRoleInsert.push(format(
            baseArticleRoleInsert,
            newCommunityId,
            article.articleId,
            memberRoleId,
            rolePermissionPresets.Article.Visible,
          ));

        } else if (article.visibility === "areas") {
          // Todo: check if under any circumstances,
          // there still needs to be the Public role assigned
          let memberRoleInserted = false;
          for (const oldAreaId of article.oldAreaIds) {
            if (!!oldAreaId) {
              const roleName = oldAreaIdToNewRoleName[oldAreaId];
              const roleId = createdRoleData.find(r => r.title === roleName)?.id || memberRoleId;
              if (roleId === memberRoleId) {
                if (!memberRoleInserted) {
                  memberRoleInserted = true;
                  articleRoleInsert.push(format(
                    baseArticleRoleInsert,
                    newCommunityId,
                    article.articleId,
                    roleId,
                    rolePermissionPresets.Article.Visible,
                  ));
                }
              } else {
                articleRoleInsert.push(format(
                  baseArticleRoleInsert,
                  newCommunityId,
                  article.articleId,
                  roleId,
                  rolePermissionPresets.Article.Visible,
                ));
              }
            }
          }
        } else {
          throw new Error("Unknown article visibility");
        }
        articleRoleInsert.push(format(
          baseArticleRoleInsert,
          newCommunityId,
          article.articleId,
          adminRoleId,
          rolePermissionPresets.Article.Visible,
        ));
      }
      if (articleRoleInsert.length > 0) {
        await queryRunner.query(`
          INSERT INTO "communities_articles_roles_permissions" (
            "communityId",
            "articleId",
            "roleId",
            "permissions"
          )
          VALUES ${articleRoleInsert.join(',')}
        `);
      }

      // Add channelpermissions
      const channelRoleInserts: string[] = [];
      const channels = channelRows.filter(c => c.newCommunityId === newCommunityId);
      const baseChannelPermissionInsert =
        `($1::UUID, %L::UUID, %L::UUID, ARRAY[%L]::"public"."communities_channels_roles_permissions_permissions_enum"[])`;
      for (const channel of channels) {
        const area = areaRows.find(a => (
          a.newCommunityId === channel.newCommunityId &&
          a.oldId === channel.oldAreaId
        ));
        if (!area) {
          throw new Error(`Channel area not found for channel ${channel.oldCommunityId}-${channel.oldAreaId}-${channel.oldId}`);
        }
        if (!!area.accessrules) {
          const roleName = oldAreaIdToNewRoleName[area.oldId];
          const roleId = createdRoleData.find(r => r.title === roleName)?.id;
          if (!roleId) {
            throw new Error(`Role not found for channel ${channel.oldCommunityId}-${channel.oldAreaId}-${channel.oldId}`);
          }
          channelRoleInserts.push(format(
            baseChannelPermissionInsert,
            channel.channelId,
            roleId,
            rolePermissionPresets.Channel.Member,
          ));

        } else {
          channelRoleInserts.push(format(
            baseChannelPermissionInsert,
            channel.channelId,
            memberRoleId,
            rolePermissionPresets.Channel.Member,
          ));
          channelRoleInserts.push(format(
            baseChannelPermissionInsert,
            channel.channelId,
            publicRoleId,
            rolePermissionPresets.Channel.Public,
          ));

        }
        channelRoleInserts.push(format(
          baseChannelPermissionInsert,
          channel.channelId,
          adminRoleId,
          rolePermissionPresets.Channel.Admin,
        ));
      }
      if (channelRoleInserts.length > 0) {
        await queryRunner.query(`
          INSERT INTO "communities_channels_roles_permissions" (
            "communityId",
            "channelId",
            "roleId",
            "permissions"
          )
          VALUES ${channelRoleInserts.join(',')}
        `, [newCommunityId]);
      }
    }

    await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN "state"`);
    await queryRunner.query(`DROP TYPE "public"."articles_state_enum"`);
    await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN "visibility"`);
    await queryRunner.query(`DROP TYPE "public"."articles_visibility_enum"`);
    await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN "type"`);
    await queryRunner.query(`DROP TYPE "public"."articles_type_enum"`);
    await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN "published"`);
    await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN "tsv_tags"`);
    await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN "tsv_title"`);
    await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN "tsv_content"`);
    await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN "tsv_title_and_content"`);
    await queryRunner.query(`ALTER TABLE "articles" ALTER COLUMN "creatorId" DROP NOT NULL`);

    await queryRunner.query(`ALTER TABLE "users_articles" DROP COLUMN "content"`);
    await queryRunner.query(`ALTER TABLE "users_articles" DROP COLUMN "state"`);
    await queryRunner.query(`DROP TYPE "public"."blogs_state_enum"`);
    await queryRunner.query(`ALTER TABLE "users_articles" DROP COLUMN "tsv_tags"`);
    await queryRunner.query(`ALTER TABLE "users_articles" DROP COLUMN "tsv_title"`);
    await queryRunner.query(`ALTER TABLE "users_articles" DROP COLUMN "tsv_content"`);
    await queryRunner.query(`ALTER TABLE "users_articles" DROP COLUMN "tsv_title_and_content"`);
    await queryRunner.query(`ALTER TABLE "users_articles" DROP COLUMN "headerImageId"`);
    await queryRunner.query(`ALTER TABLE "users_articles" DROP COLUMN "thumbnailImageId"`);
    await queryRunner.query(`ALTER TABLE "users_articles" DROP COLUMN "title"`);
    await queryRunner.query(`ALTER TABLE "users_articles" DROP COLUMN "tags"`);
    await queryRunner.query(`ALTER TABLE "users_articles" DROP COLUMN "previewText"`);
    await queryRunner.query(`CREATE INDEX "IDX_39c49ef03626865be21fa1e3e6" ON "users_articles" ("userId") `);
    await queryRunner.query(`ALTER TABLE "users_articles" ADD CONSTRAINT "UQ_141517e9672823f4acc99e727b8" UNIQUE ("userId", "url")`);
    await queryRunner.query(`ALTER TABLE "users_articles" ADD CONSTRAINT "FK_39c49ef03626865be21fa1e3e68" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "users_articles" ALTER COLUMN "articleId" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "users_articles" ADD CONSTRAINT "FK_070705cca3bef93d0064961ea67" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

    // Drop old tables
    await queryRunner.query(`DROP TABLE areaaccess`);
    await queryRunner.query(`DROP TABLE areaarticles`);
    await queryRunner.query(`DROP TABLE groupaccess`);
    await queryRunner.query(`DROP TABLE groupblocks`);
    await queryRunner.query(`DROP TABLE conversations`);


    await queryRunner.query(`CREATE INDEX "IDX_e8a5d59f0ac3040395f159507c" ON "devices" ("userId") `);
    await queryRunner.query(`CREATE INDEX "IDX_d052aca09cecd2e9b8b94e3c67" ON "followers" ("userId") `);
    await queryRunner.query(`CREATE INDEX "IDX_a4cc78d1f47c94d6a605c55973" ON "followers" ("otherUserId") `);
    await queryRunner.query(`CREATE INDEX "IDX_c6d704afd4aad0bcc7d42e8c5d" ON "communities" ("tags") `);
    await queryRunner.query(`CREATE INDEX "IDX_5fb32e2cd57c41bf5529e5dce2" ON "communities" ("activityScore") `);
    await queryRunner.query(`CREATE INDEX "IDX_21d389a088a07773deb63bf962" ON "areas" ("communityId") `);
    await queryRunner.query(`CREATE INDEX "IDX_78be0e07e10f6ab2c5998db62c" ON "channelreadstate" ("userId") `);
    await queryRunner.query(`CREATE INDEX "IDX_d11f63369b3d9ad74c8972f949" ON "articles" ("tags") `);
    await queryRunner.query(`CREATE INDEX "IDX_93e5c06f70a5f2d22014637c51" ON "reactions" ("itemId") `);
    await queryRunner.query(`CREATE INDEX "IDX_2ecdb33f23e9a6fc392025c0b9" ON "wallets" ("userId") `);
    await queryRunner.query(`CREATE INDEX "IDX_2a32f641edba1d0f973c19cc94" ON "users" ("deletedAt") `);
    await queryRunner.query(`CREATE INDEX "IDX_82ad9632bc86164ce8a13336a2" ON "communities_channels" ("communityId") `);

    await queryRunner.query(`ALTER TABLE "chats" ADD CONSTRAINT "FK_5f3b9ee5b6b54172d99f2b5175e" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "devices" ADD CONSTRAINT "FK_e8a5d59f0ac3040395f159507c6" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "roles" ADD CONSTRAINT "FK_fb2994209e76f9948683d49e6fe" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_692a909ee0fa9383e7859f9b406" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_33b6c983568d94b5c9bf3fa1dac" FOREIGN KEY ("subjectUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_7c51177f5ae4bd792c34ae5e857" FOREIGN KEY ("subjectCommunityId") REFERENCES "communities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "followers" ADD CONSTRAINT "FK_d052aca09cecd2e9b8b94e3c671" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "followers" ADD CONSTRAINT "FK_a4cc78d1f47c94d6a605c559735" FOREIGN KEY ("otherUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "communities_channels" ADD CONSTRAINT "FK_82ad9632bc86164ce8a13336a24" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "communities_channels" ADD CONSTRAINT "FK_cf81de3fb9f1847f168da91e916" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "communities_channels" ADD CONSTRAINT "FK_4bbe1889beae86076dbfe9f331b" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "communities_channels_roles_permissions" ADD CONSTRAINT "FK_b841c306c38207d63603aa04e65" FOREIGN KEY ("communityId", "channelId") REFERENCES "communities_channels"("communityId","channelId") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "communities_channels_roles_permissions" ADD CONSTRAINT "FK_ebea533e4f12d00ae67e06eb015" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "communities" ADD CONSTRAINT "FK_40362aa557e4d155a7fa32883cf" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "areas" ADD CONSTRAINT "FK_21d389a088a07773deb63bf962d" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "channelreadstate" ADD CONSTRAINT "FK_f5b07b863fa4a56990ca76d9505" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "channelreadstate" ADD CONSTRAINT "FK_78be0e07e10f6ab2c5998db62c4" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "communities_articles" ADD CONSTRAINT "FK_86ac5aa76d27c6cdcbfb36ec8e5" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "communities_articles" ADD CONSTRAINT "FK_583a6bb5982b83c770a03e1049f" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "communities_articles_roles_permissions" ADD CONSTRAINT "FK_6fe4c6f73b42ad42399e5cf6e7a" FOREIGN KEY ("communityId", "articleId") REFERENCES "communities_articles"("communityId","articleId") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "communities_articles_roles_permissions" ADD CONSTRAINT "FK_ec8a1530d6645dff72647a571c9" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "articles" ADD CONSTRAINT "FK_d08fa10065354a4a0192ae5d3db" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "files" ADD CONSTRAINT "FK_443d1741ae871a7af5e2df0f00d" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "reactions" ADD CONSTRAINT "FK_f3e1d278edeb2c19a2ddad83f8e" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "userblocking" ADD CONSTRAINT "FK_88722b7402415f6c91d9e6a0aa0" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "userblocking" ADD CONSTRAINT "FK_07cc4d824289fa15fa3d14e8292" FOREIGN KEY ("communityId", "channelId") REFERENCES "communities_channels"("communityId","channelId") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "userblocking" ADD CONSTRAINT "FK_1a05efb13517a32030071a11544" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "wallets" ADD CONSTRAINT "FK_2ecdb33f23e9a6fc392025c0b97" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "roles_users_users" ADD CONSTRAINT "FK_6baa1fce24dde516186c4f0269a" FOREIGN KEY ("rolesId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    await queryRunner.query(`ALTER TABLE "roles_users_users" ADD CONSTRAINT "FK_391282056f6da8665b38480a131" FOREIGN KEY ("usersId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "roles_contracts_contracts" ADD CONSTRAINT "FK_3f4bab8171ee914ba47803f520c" FOREIGN KEY ("rolesId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    await queryRunner.query(`ALTER TABLE "roles_contracts_contracts" ADD CONSTRAINT "FK_8082c886acc5cb4d1347f0dd3c9" FOREIGN KEY ("contractsId") REFERENCES "contracts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

    await queryRunner.query(`ALTER TABLE "communities_channels" ADD CONSTRAINT "UQ_dc6c5439597c8c73bab71b9d021" UNIQUE ("communityId", "url")`);
    // */
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    throw new Error("This migration cannot be undone");
  }

}

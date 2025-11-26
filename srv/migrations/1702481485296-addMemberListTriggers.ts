// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm"

export class AddMemberListTriggers1702481485296 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    // User onlineStatus
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION notify_user_data_change() RETURNS trigger AS $$
      DECLARE
      BEGIN
        IF TG_OP = 'INSERT'
        THEN
          PERFORM pg_notify('userdatachange',
            json_build_object(
              'type', 'userdatachange',
              'userId', NEW.id,
              'alias', NEW."alias",
              'onlineStatus', NEW."onlineStatus",
              'displayAccount', NEW."displayAccount",
              'accounts', coalesce((
                SELECT json_agg(json_build_object(
                  'displayName', "displayName",
                  'type', "type"
                ))
                FROM user_accounts
                WHERE "userId" = NEW.id
              ), '[]'::json)
            )::text
          );
        ELSIF TG_OP = 'UPDATE'
        THEN
          IF NEW."alias" <> OLD."alias" OR NEW."displayAccount" <> OLD."displayAccount" OR NEW."onlineStatus" <> OLD."onlineStatus"
          THEN
            PERFORM pg_notify('userdatachange',
              json_build_object(
                'type', 'userdatachange',
                'userId', NEW.id,
                'alias', NEW."alias",
                'onlineStatus', NEW."onlineStatus",
                'displayAccount', NEW."displayAccount",
                'accounts', coalesce((
                  SELECT json_agg(json_build_object(
                    'displayName', "displayName",
                    'type', "type"
                  ))
                  FROM user_accounts
                  WHERE "userId" = NEW.id
                ), '[]'::json)
              )::text
            );
          END IF;
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);
    await queryRunner.query(`
      CREATE TRIGGER user_data_change_notify
      AFTER INSERT OR UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION notify_user_data_change()
    `);

    // User roles
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION notify_user_role_change() RETURNS trigger AS $$
      DECLARE
      BEGIN
        IF TG_OP = 'INSERT' AND NEW.claimed = TRUE
        THEN
          PERFORM pg_notify('userrolechange',
            json_build_object(
              'type', 'userrolechange',
              'userId', NEW."userId",
              'roleId', NEW."roleId",
              'hasRole', TRUE
            )::text
          );
        ELSIF TG_OP = 'UPDATE'
        THEN
          PERFORM pg_notify('userrolechange',
            json_build_object(
              'type', 'userrolechange',
              'userId', NEW."userId",
              'roleId', NEW."roleId",
              'hasRole', NEW.claimed
            )::text
          );
        ELSIF TG_OP = 'DELETE'
        THEN
          PERFORM pg_notify('userrolechange',
            json_build_object(
              'type', 'userrolechange',
              'userId', OLD."userId",
              'roleId', OLD."roleId",
              'hasRole', FALSE
            )::text
          );
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);
    await queryRunner.query(`
      CREATE TRIGGER user_role_notify
      AFTER INSERT OR UPDATE OR DELETE ON roles_users_users
      FOR EACH ROW EXECUTE FUNCTION notify_user_role_change()
    `);

    // Roles
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION notify_role_change() RETURNS trigger AS $$
      DECLARE
      BEGIN
        IF TG_OP = 'INSERT'
        THEN
          PERFORM pg_notify('rolechange',
            json_build_object(
              'type', 'rolechange',
              'roleId', NEW.id,
              'communityId', NEW."communityId",
              'title', NEW.title,
              'roleType', NEW.type,
              'deleted', FALSE
            )::text
          );
        ELSIF TG_OP = 'UPDATE' AND OLD."deletedAt" IS NULL AND NEW."deletedAt" IS NOT NULL
        THEN
          PERFORM pg_notify('rolechange',
            json_build_object(
              'type', 'rolechange',
              'roleId', NEW.id,
              'communityId', NEW."communityId",
              'title', NEW.title,
              'roleType', NEW.type,
              'deleted', TRUE
            )::text
          );
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);
    await queryRunner.query(`
      CREATE TRIGGER role_notify
      AFTER INSERT OR UPDATE ON roles
      FOR EACH ROW EXECUTE FUNCTION notify_role_change()
    `);

    // Channels
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION notify_channel_role_permission_change() RETURNS trigger AS $$
      DECLARE
      BEGIN
          IF TG_OP = 'INSERT'
          THEN
            PERFORM pg_notify('channelrolepermissionchange',
              json_build_object(
                'type', 'channelrolepermissionchange',
                'communityId', NEW."communityId",
                'roleId', NEW."roleId",
                'channelId', NEW."channelId",
                'permissions', array_to_json(NEW.permissions)
              )::text
            );
          ELSIF TG_OP = 'UPDATE'
          THEN
            PERFORM pg_notify('channelrolepermissionchange',
              json_build_object(
                'type', 'channelrolepermissionchange',
                'communityId', NEW."communityId",
                'roleId', NEW."roleId",
                'channelId', NEW."channelId",
                'permissions', array_to_json(NEW.permissions)
              )::text
            );
          ELSIF TG_OP = 'DELETE'
          THEN
            PERFORM pg_notify('channelrolepermissionchange',
              json_build_object(
                'type', 'channelrolepermissionchange',
                'communityId', OLD."communityId",
                'roleId', OLD."roleId",
                'channelId', OLD."channelId",
                'permissions', '[]'::json
              )::text
            );
          END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);
    await queryRunner.query(`
      CREATE TRIGGER channel_role_permission_notify
      AFTER INSERT OR UPDATE OR DELETE ON communities_channels_roles_permissions
      FOR EACH ROW EXECUTE FUNCTION notify_channel_role_permission_change()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TRIGGER user_data_change_notify ON "public"."users"`);
    await queryRunner.query(`DROP FUNCTION "public"."notify_user_data_change"`);

    await queryRunner.query(`DROP TRIGGER user_role_notify ON "public"."roles_users_users"`);
    await queryRunner.query(`DROP FUNCTION "public"."notify_user_role_change"`);

    await queryRunner.query(`DROP TRIGGER role_notify ON "public"."roles"`);
    await queryRunner.query(`DROP FUNCTION "public"."notify_role_change"`);

    await queryRunner.query(`DROP TRIGGER channel_role_permission_notify ON "public"."communities_channels_roles_permissions"`);
    await queryRunner.query(`DROP FUNCTION "public"."notify_channel_role_permission_change"`);
  }

}

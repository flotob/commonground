// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm"

export class communityOrderValidationTrigger1689321299329 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // user communityOrder validation trigger
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION validate_community_order() RETURNS trigger AS $$
            DECLARE
                arrays_are_equal BOOLEAN;
            BEGIN
                WITH community_memberships AS (
                    SELECT ARRAY(
                        SELECT r."communityId"
                        FROM  roles_users_users ruu
                        INNER JOIN roles r
                          ON  r.id = ruu."roleId"
                          AND r.title = 'Member'
                          AND r.type = 'PREDEFINED'::"public"."roles_type_enum"
                        WHERE ruu.claimed = TRUE
                          AND ruu."userId" = NEW.id
                    ) AS membership_array
                )
                SELECT (
                    SELECT COUNT(*) FROM (
                        (SELECT UNNEST(NEW."communityOrder") EXCEPT SELECT UNNEST(community_memberships.membership_array) FROM community_memberships)
                        UNION ALL
                        (SELECT UNNEST(community_memberships.membership_array) FROM community_memberships EXCEPT SELECT UNNEST(NEW."communityOrder"))
                    ) AS differences
                ) = 0 INTO arrays_are_equal;

                IF NOT arrays_are_equal THEN
                    RAISE EXCEPTION 'User.communityOrder must have exactly the same elements as the user has Member roles';
                END IF;

                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql
        `);
        await queryRunner.query(`
            CREATE TRIGGER community_order_validation
            AFTER INSERT OR UPDATE ON users
            FOR EACH ROW EXECUTE FUNCTION validate_community_order();
        `);

        // check if users have the member role when assigning other roles
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION ensure_member_role_after_insert() RETURNS trigger AS $$
            DECLARE
                new_role_title TEXT;
                new_role_type "public"."roles_type_enum";
                community_id UUID;
                row_exists BOOLEAN;
            BEGIN
                SELECT roles.title, roles."communityId", roles.type
                INTO new_role_title, community_id, new_role_type
                FROM roles
                WHERE roles.id = NEW."roleId";

                IF NOT (
                    new_role_title = 'Member' AND
                    new_role_type = 'PREDEFINED'::"public"."roles_type_enum"
                ) THEN
                    SELECT EXISTS (
                        SELECT 1
                        FROM roles_users_users ruu
                        INNER JOIN roles r
                          ON  r.id = ruu."roleId"
                        WHERE ruu."userId" = NEW."userId"
                          AND r.title = 'Member'
                          AND r.type = 'PREDEFINED'::"public"."roles_type_enum"
                          AND r."communityId" = community_id
                    ) INTO row_exists;

                    IF NOT row_exists THEN
                        RAISE EXCEPTION 'Cannot assign user a role if that user does not have the member role, too';
                    END IF;
                END IF;

                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql
        `);
        await queryRunner.query(`
            CREATE TRIGGER ensure_memberrole_after_role_assignment
            AFTER INSERT ON roles_users_users
            FOR EACH ROW EXECUTE FUNCTION ensure_member_role_after_insert();
        `);

        // check if after the member role has been unassigned, the user has no other roles left
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION ensure_no_role_after_member_delete() RETURNS trigger AS $$
            DECLARE
                old_role_title TEXT;
                old_role_type "public"."roles_type_enum";
                community_id UUID;
                row_exists BOOLEAN;
            BEGIN
                SELECT roles.title, roles."communityId", roles.type
                INTO old_role_title, community_id, old_role_type
                FROM roles
                WHERE roles.id = OLD."roleId";

                IF (
                    old_role_title = 'Member' AND
                    old_role_type = 'PREDEFINED'::"public"."roles_type_enum"
                ) THEN
                    SELECT EXISTS (
                        SELECT 1
                        FROM roles_users_users ruu
                        INNER JOIN roles r
                          ON  r.id = ruu."roleId"
                        WHERE ruu."userId" = OLD."userId"
                          AND r."communityId" = community_id
                    ) INTO row_exists;

                    IF row_exists THEN
                        RAISE EXCEPTION 'Cannot unassign the member role if the user has other roles left';
                    END IF;
                END IF;

                RETURN OLD;
            END;
            $$ LANGUAGE plpgsql
        `);
        await queryRunner.query(`
            CREATE TRIGGER ensure_no_role_after_memberrole_unassignment
            AFTER DELETE ON roles_users_users
            FOR EACH ROW EXECUTE FUNCTION ensure_no_role_after_member_delete();
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TRIGGER community_order_validation ON users
        `);
        await queryRunner.query(`
            DROP FUNCTION validate_community_order
        `);

        await queryRunner.query(`
            DROP TRIGGER ensure_memberrole_after_role_assignment ON roles_users_users
        `);
        await queryRunner.query(`
            DROP FUNCTION ensure_member_role_after_insert
        `);

        await queryRunner.query(`
            DROP TRIGGER ensure_no_role_after_memberrole_unassignment ON roles_users_users
        `);
        await queryRunner.query(`
            DROP FUNCTION ensure_no_role_after_member_delete
        `);
    }

}

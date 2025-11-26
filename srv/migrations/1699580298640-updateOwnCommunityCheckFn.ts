// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm"

export class UpdateOwnCommunityCheckFn1699580298640 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION public.validate_community_order()
            RETURNS trigger
            LANGUAGE plpgsql
            AS $function$
                DECLARE
                    arrays_are_equal BOOLEAN;
                    membership_array UUID[];
                BEGIN
                    SELECT ARRAY(
                        SELECT r."communityId"
                        FROM  roles_users_users ruu
                        INNER JOIN roles r
                            ON  r.id = ruu."roleId"
                            AND r.title = 'Member'
                            AND r.type = 'PREDEFINED'::"public"."roles_type_enum"
                        WHERE ruu.claimed = TRUE
                            AND ruu."userId" = NEW.id
                    ) INTO membership_array;
                
                    IF  (array_length(NEW."communityOrder", 1) = 0) AND
                        (membership_array IS NULL OR array_length(membership_array, 1) IS NULL)
                    THEN
                        arrays_are_equal := TRUE;
                    ELSE
                        SELECT (
                            SELECT COUNT(*) FROM (
                                (SELECT UNNEST(NEW."communityOrder") EXCEPT SELECT UNNEST(membership_array))
                                UNION ALL
                                (SELECT UNNEST(membership_array) EXCEPT SELECT UNNEST(NEW."communityOrder"))
                            ) AS differences
                        ) = 0 INTO arrays_are_equal;
                    END IF;

                    IF NOT arrays_are_equal THEN
                        RAISE EXCEPTION 'User.communityOrder must have exactly the same elements as the user has Member roles';
                    END IF;

                    RETURN NEW;
                END;
                $function$
            ;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}

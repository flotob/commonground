// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm"

export class PreventCircularReferralsTrigger1732569652560 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION prevent_circular_referrals()
            RETURNS TRIGGER AS $$
            DECLARE
                circular_count INTEGER;
            BEGIN
                -- Prevent referring to self
                IF NEW.id = NEW."referredBy" THEN
                    RAISE EXCEPTION 'Cannot refer to self';
                END IF;

                -- Prevent changing referredBy
                IF OLD."referredBy" IS NOT NULL AND OLD."referredBy" <> NEW."referredBy" THEN
                    RAISE EXCEPTION 'Cannot change referredBy';
                END IF;

                -- Only check if referredBy is being set/updated
                IF OLD."referredBy" IS NULL AND NEW."referredBy" IS NOT NULL THEN
                    -- Start with the immediate referrer
                    WITH RECURSIVE referral_chain AS (
                        -- Base case: start with the immediate referrer
                        SELECT id, "referredBy", 1 as depth
                        FROM "users"
                        WHERE id = NEW."referredBy"

                        UNION ALL

                        -- Recursive case: get each referrer's referrer
                        SELECT u.id, u."referredBy", rc.depth + 1
                        FROM "users" u
                        INNER JOIN referral_chain rc ON u.id = rc."referredBy"
                        -- Prevent infinite recursion - don't use for now, ignore
                        -- the potential DOS attack vector since it's quite theoretical
                        -- WHERE rc.depth < 100
                    )
                    -- Check if the user being updated appears in the referral chain
                    SELECT COUNT(*)
                    INTO strict circular_count
                    FROM referral_chain
                    WHERE id = NEW.id;

                    IF circular_count > 0 THEN
                        RAISE EXCEPTION 'Circular referral detected: User % appears in their own referral chain', NEW.id;
                    END IF;
                END IF;

                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            -- Make sure the trigger is created/updated
            DROP TRIGGER IF EXISTS check_circular_referrals ON "users";
            CREATE TRIGGER check_circular_referrals
                BEFORE UPDATE ON "users"
                FOR EACH ROW
                EXECUTE FUNCTION prevent_circular_referrals();
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}

// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm"

export class FixUserTokenSaleTriggers1732926836826 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TRIGGER IF EXISTS check_circular_referrals ON "tokensale_userdata";`);
        await queryRunner.query(`DROP FUNCTION IF EXISTS prevent_circular_referrals();`);

        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION tokensale_userdata_before_insert_update()
            RETURNS TRIGGER AS $$
            DECLARE
                circular_count INTEGER;
                is_trigger_active TEXT;
            BEGIN
                -- Check if we're already inside a trigger-initiated update
                is_trigger_active := current_setting('tokensale_userdata_trigger.active', TRUE);

                IF is_trigger_active = 'true'
                THEN
                    -- Skip trigger logic if we're in a recursive call
                    RAISE NOTICE 'Skipping tokensale_userdata_before_insert_update trigger logic due to recursive call';
                    RETURN NEW;
                ELSE
                    RAISE NOTICE 'Executing tokensale_userdata_before_insert_update trigger logic';
                END IF;

                -- Prevent referring to self
                IF
                    NEW."userId" = NEW."referredByUserId"
                THEN
                    RAISE EXCEPTION 'Cannot refer to self';
                END IF;

                -- Prevent changing referredByUserId
                IF
                    TG_OP = 'UPDATE'
                    AND OLD."referredByUserId" IS NOT NULL
                    AND OLD."referredByUserId" <> NEW."referredByUserId"
                THEN
                    RAISE EXCEPTION 'Cannot change referredByUserId';
                END IF;

                -- Prevent referring users who already bought tokens
                IF
                    TG_OP = 'UPDATE'
                    AND OLD."referredByUserId" IS NULL
                    AND NEW."referredByUserId" IS NOT NULL
                    AND NEW."totalTokensBought" > 0
                THEN
                    RAISE EXCEPTION 'Cannot refer users who have already bought tokens';
                END IF;

                -- Prevent changing tokenSaleId
                IF
                    TG_OP = 'UPDATE'
                    AND OLD."tokenSaleId" IS NOT NULL
                    AND OLD."tokenSaleId" <> NEW."tokenSaleId"
                THEN
                    RAISE EXCEPTION 'Cannot change tokenSaleId';
                END IF;

                -- Check for circular referrals if referredByUserId is being set or updated
                IF
                    (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD."referredByUserId" IS NULL))
                    AND NEW."referredByUserId" IS NOT NULL
                THEN
                    -- Start with the immediate referrer
                    WITH RECURSIVE referral_chain AS (
                        -- Base case: start with the immediate referrer
                        SELECT "userId", "referredByUserId", 1 as depth
                        FROM "tokensale_userdata"
                        WHERE "userId" = NEW."referredByUserId"
                            AND "tokenSaleId" = NEW."tokenSaleId"

                        UNION ALL

                        -- Recursive case: get each referrer's referrer
                        SELECT tu."userId", tu."referredByUserId", rc.depth + 1
                        FROM "tokensale_userdata" tu
                        INNER JOIN referral_chain rc
                            ON tu."userId" = rc."referredByUserId"
                            AND tu."tokenSaleId" = NEW."tokenSaleId"
                    )
                    -- Check if the user being updated appears in the referral chain
                    SELECT COUNT(*)
                    INTO strict circular_count
                    FROM referral_chain
                    WHERE "userId" = NEW."userId";

                    IF circular_count > 0 THEN
                        RAISE EXCEPTION 'Circular referral detected: User % appears in their own referral chain', NEW."userId";
                    END IF;
                END IF;
                
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            -- Make sure the trigger is created/updated
            DROP TRIGGER IF EXISTS tokensale_userdata_before_trigger ON "tokensale_userdata";
            CREATE TRIGGER tokensale_userdata_before_trigger
                BEFORE INSERT OR UPDATE ON "tokensale_userdata"
                FOR EACH ROW
                EXECUTE FUNCTION tokensale_userdata_before_insert_update();
        `);

        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION tokensale_userdata_after_insert_update()
            RETURNS TRIGGER AS $$
            DECLARE
                is_trigger_active TEXT;
            BEGIN
                -- Check if we're already inside a trigger-initiated update
                is_trigger_active := current_setting('tokensale_userdata_trigger.active', TRUE);

                IF is_trigger_active = 'true'
                THEN
                    -- Skip trigger logic if we're in a recursive call
                    RAISE NOTICE 'Skipping tokensale_userdata_after_insert_update trigger logic due to recursive call';
                    RETURN NEW;
                ELSE
                    -- Set the flag to indicate we're in trigger logic
                    PERFORM set_config('tokensale_userdata_trigger.active', 'true', TRUE);
                    RAISE NOTICE 'Executing tokensale_userdata_after_insert_update trigger logic';
                END IF;

                -- Only check if referredByUserId is being set/updated
                IF
                    (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD."referredByUserId" IS NULL))
                    AND NEW."referredByUserId" IS NOT NULL
                THEN
                    -- Start with the immediate referrer
                    WITH RECURSIVE referral_chain AS (
                        -- Base case: start with the immediate referrer
                        SELECT "userId", "referredByUserId", 1 as depth
                        FROM "tokensale_userdata"
                        WHERE "userId" = NEW."referredByUserId"
                            AND "tokenSaleId" = NEW."tokenSaleId"

                        UNION ALL

                        -- Recursive case: get each referrer's referrer
                        SELECT tu."userId", tu."referredByUserId", rc.depth + 1
                        FROM "tokensale_userdata" tu
                        INNER JOIN referral_chain rc
                            ON tu."userId" = rc."referredByUserId"
                            AND tu."tokenSaleId" = NEW."tokenSaleId"
                    ),
                    -- Update indirect referral counts for all users in the chain (depth > 1 since depth = 1 is the immediate referrer)
                    indirect_referrers AS (
                        SELECT DISTINCT "userId"
                        FROM referral_chain
                        WHERE depth > 1
                    )
                    UPDATE "tokensale_userdata" tu
                    SET 
                        "referredUsersIndirectCount" = tu."referredUsersIndirectCount" + 1,
                        "updatedAt" = NOW()
                    FROM indirect_referrers ir
                    WHERE tu."userId" = ir."userId"
                        AND tu."tokenSaleId" = NEW."tokenSaleId";

                    -- Update the referrer's direct referral count
                    INSERT INTO "tokensale_userdata" ("userId", "tokenSaleId", "referredUsersDirectCount")
                    VALUES (NEW."referredByUserId", NEW."tokenSaleId", 1)
                    ON CONFLICT ("userId", "tokenSaleId")
                    DO UPDATE SET
                        "referredUsersDirectCount" = "tokensale_userdata"."referredUsersDirectCount" + 1,
                        "updatedAt" = NOW();
                END IF;

                -- Pass 1/10th of the totalTokensBought to the referrer and recursively to the referrer's referrer (and so on)
                IF NEW."referredByUserId" IS NOT NULL
                    AND ((TG_OP= 'INSERT' AND NEW."totalTokensBought" > 0)
                    OR (TG_OP= 'UPDATE' AND NEW."totalTokensBought" != OLD."totalTokensBought"))
                THEN
                    WITH RECURSIVE referral_chain AS (
                        SELECT
                            "userId",
                            "referredByUserId",
                            FLOOR((NEW."totalTokensBought" - (CASE WHEN TG_OP = 'INSERT' THEN 0::NUMERIC ELSE OLD."totalTokensBought" END)) / 10)::NUMERIC(80,0) as "tokensToPass"
                        FROM "tokensale_userdata"
                        WHERE "userId" = NEW."referredByUserId"
                            AND "tokenSaleId" = NEW."tokenSaleId"

                        UNION ALL

                        SELECT
                            tu."userId",
                            tu."referredByUserId",
                            FLOOR(rc."tokensToPass" / 10)::NUMERIC(80,0)
                        FROM referral_chain rc
                        INNER JOIN "tokensale_userdata" tu
                            ON tu."userId" = rc."referredByUserId"
                            AND tu."tokenSaleId" = NEW."tokenSaleId"
                    )
                    UPDATE "tokensale_userdata" tu
                    SET
                        "referralBonus" = tu."referralBonus" + rc."tokensToPass",
                        "updatedAt" = NOW()
                    FROM referral_chain rc
                    WHERE tu."userId" = rc."userId"
                        AND tu."tokenSaleId" = NEW."tokenSaleId";
                END IF;

                -- Clear the flag before returning
                PERFORM set_config('tokensale_userdata_trigger.active', 'false', TRUE);
                
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            -- Make sure the trigger is created/updated
            DROP TRIGGER IF EXISTS tokensale_userdata_after_trigger ON "tokensale_userdata";
            CREATE TRIGGER tokensale_userdata_after_trigger
                AFTER INSERT OR UPDATE ON "tokensale_userdata"
                FOR EACH ROW
                EXECUTE FUNCTION tokensale_userdata_after_insert_update();
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}

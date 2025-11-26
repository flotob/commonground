// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm"

export class TokenSaleCircularReferralCheck1732830634381 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TRIGGER IF EXISTS check_circular_referrals ON "users";`);
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION prevent_circular_referrals()
            RETURNS TRIGGER AS $$
            DECLARE
                circular_count INTEGER;
            BEGIN
                -- Prevent referring to self
                IF NEW."userId" = NEW."referredByUserId" THEN
                    RAISE EXCEPTION 'Cannot refer to self';
                END IF;

                -- Prevent changing referredByUserId
                IF TG_OP = 'UPDATE' AND OLD."referredByUserId" IS NOT NULL AND OLD."referredByUserId" <> NEW."referredByUserId"
                THEN
                    RAISE EXCEPTION 'Cannot change referredByUserId';
                END IF;

                -- Prevent changing tokenSaleId
                IF TG_OP = 'UPDATE' AND OLD."tokenSaleId" <> NEW."tokenSaleId"
                THEN
                    RAISE EXCEPTION 'Cannot change tokenSaleId';
                END IF;

                -- Only check if referredByUserId is being set/updated
                IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD."referredByUserId" IS NULL)) AND NEW."referredByUserId" IS NOT NULL
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
                        RAISE EXCEPTION 'Circular referral detected: User % appears in their own referral chain', NEW.id;
                    END IF;

                    -- Update the referrer's direct referral count
                    INSERT INTO "tokensale_userdata" ("userId", "tokenSaleId", "referredUsersDirectCount")
                    VALUES (NEW."referredByUserId", NEW."tokenSaleId", 1)
                    ON CONFLICT ("userId", "tokenSaleId")
                    DO UPDATE SET
                        "referredUsersDirectCount" = "referredUsersDirectCount" + 1,
                        "updatedAt" = NOW();

                    -- Update indirect referral counts for all users in the chain (depth > 1 since depth = 1 is the immediate referrer)
                    WITH indirect_referrers AS (
                        SELECT DISTINCT "userId"
                        FROM referral_chain
                        WHERE depth > 1
                    )
                    UPDATE "tokensale_userdata" tu
                    SET 
                        "referredUsersIndirectCount" = "referredUsersIndirectCount" + 1,
                        "updatedAt" = NOW()
                    FROM indirect_referrers ir
                    WHERE tu."userId" = ir."userId"
                        AND tu."tokenSaleId" = NEW."tokenSaleId";
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
                            (NEW."totalTokensBought" - (CASE WHEN TG_OP = 'INSERT' THEN 0::NUMERIC ELSE OLD."totalTokensBought" END)) / 10 as "tokensToPass"
                        FROM "tokensale_userdata"
                        WHERE "userId" = NEW."referredByUserId"
                            AND "tokenSaleId" = NEW."tokenSaleId"

                        UNION ALL

                        SELECT
                            tu."userId",
                            tu."referredByUserId",
                            rc."tokensToPass" / 10
                        FROM referral_chain rc
                        INNER JOIN "tokensale_userdata" tu
                            ON tu."userId" = rc."referredByUserId"
                            AND tu."tokenSaleId" = NEW."tokenSaleId"
                    )
                    UPDATE "tokensale_userdata" tu
                    SET
                        "referralBonus" = "referralBonus" + rc."tokensToPass",
                        "updatedAt" = NOW()
                    FROM referral_chain rc
                    WHERE tu."userId" = rc."userId"
                        AND tu."tokenSaleId" = NEW."tokenSaleId";
                END IF;

                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            -- Make sure the trigger is created/updated
            DROP TRIGGER IF EXISTS check_circular_referrals ON "tokensale_userdata";
            CREATE TRIGGER check_circular_referrals
                BEFORE INSERT OR UPDATE ON "tokensale_userdata"
                FOR EACH ROW
                EXECUTE FUNCTION prevent_circular_referrals();
        `);

        await queryRunner.query(`ALTER TABLE "tokensale_userdata" ADD "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokensale_userdata" DROP COLUMN "createdAt"`);
    }

}

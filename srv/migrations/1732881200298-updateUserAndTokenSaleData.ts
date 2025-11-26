// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateUserAndTokenSaleData1732881200298 implements MigrationInterface {
    name = 'UpdateUserAndTokenSaleData1732881200298'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokensales" RENAME COLUMN "chain" TO "saleContractChain"`);
        await queryRunner.query(`ALTER TABLE "tokensales" RENAME COLUMN "address" TO "saleContractAddress"`);
        await queryRunner.query(`ALTER TABLE "tokensales" RENAME COLUMN "contractType" TO "saleContractType"`);
        await queryRunner.query(`ALTER TABLE "tokensales" ADD "targetTokenChain" character varying(64) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tokensales" ADD "targetTokenAddress" character varying(50) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tokensales" ADD "targetTokenDecimals" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "referredBy"`);

        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION notify_tokensale_change() RETURNS trigger AS $$
            DECLARE
            BEGIN
                IF TG_OP = 'INSERT' THEN
                    PERFORM pg_notify('tokensalechange',
                        json_build_object(
                            'type', 'tokensalechange',
                            'id', NEW.id,
                            'saleContractChain', NEW."saleContractChain",
                            'saleContractAddress', NEW."saleContractAddress",
                            'saleContractType', NEW."saleContractType",
                            'targetTokenChain', NEW."targetTokenChain",
                            'targetTokenAddress', NEW."targetTokenAddress",
                            'targetTokenDecimals', NEW."targetTokenDecimals",
                            'recentUpdateBlockNumber', NEW."recentUpdateBlockNumber",
                            'createdAt', NEW."createdAt",
                            'startDate', NEW."startDate",
                            'endDate', NEW."endDate",
                            'action', 'INSERT'
                        )::text
                    );
                END IF;

                IF TG_OP = 'UPDATE' AND (
                    NEW."startDate" != OLD."startDate" OR
                    NEW."endDate" != OLD."endDate" OR
                    NEW."saleContractChain" != OLD."saleContractChain" OR
                    NEW."saleContractAddress" != OLD."saleContractAddress" OR
                    NEW."saleContractType" != OLD."saleContractType" OR
                    NEW."targetTokenChain" != OLD."targetTokenChain" OR
                    NEW."targetTokenAddress" != OLD."targetTokenAddress" OR
                    NEW."targetTokenDecimals" != OLD."targetTokenDecimals"
                ) THEN
                    PERFORM pg_notify('tokensalechange',
                        json_build_object(
                            'type', 'tokensalechange',
                            'id', NEW.id,
                            'saleContractChain', NEW."saleContractChain",
                            'saleContractAddress', NEW."saleContractAddress",
                            'saleContractType', NEW."saleContractType",
                            'targetTokenChain', NEW."targetTokenChain",
                            'targetTokenAddress', NEW."targetTokenAddress",
                            'targetTokenDecimals', NEW."targetTokenDecimals",
                            'recentUpdateBlockNumber', NEW."recentUpdateBlockNumber",
                            'createdAt', NEW."createdAt",
                            'startDate', NEW."startDate",
                            'endDate', NEW."endDate",
                            'action', 'UPDATE'
                        )::text
                    );
                END IF;
      
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql
        `);

        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION prevent_circular_referrals()
            RETURNS TRIGGER AS $$
            DECLARE
                circular_count INTEGER;
                is_trigger_active TEXT;
            BEGIN
                -- Check if we're already inside a trigger-initiated update
                is_trigger_active := current_setting('prevent_circular_referrals.active', TRUE);
                
                RAISE NOTICE 'is_trigger_active: %', is_trigger_active;

                IF is_trigger_active = 'true' THEN
                    -- Skip trigger logic if we're in a recursive call
                    RETURN NEW;
                END IF;

                -- Set the flag to indicate we're in trigger logic
                PERFORM set_config('prevent_circular_referrals.active', 'true', TRUE);

                -- Prevent referring to self
                IF NEW."userId" = NEW."referredByUserId" THEN
                    RAISE EXCEPTION 'Cannot refer to self';
                END IF;

                -- Prevent changing referredByUserId
                IF TG_OP = 'UPDATE' AND OLD."referredByUserId" IS NOT NULL AND OLD."referredByUserId" <> NEW."referredByUserId"
                THEN
                    RAISE EXCEPTION 'Cannot change referredByUserId';
                END IF;

                -- Prevent referring users who already bought tokens
                IF TG_OP = 'UPDATE' AND OLD."referredByUserId" IS NULL AND NEW."referredByUserId" IS NOT NULL AND NEW."totalTokensBought" > 0
                THEN
                    RAISE EXCEPTION 'Cannot refer users who have already bought tokens';
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
                    ),
                    -- Update indirect referral counts for all users in the chain (depth > 1 since depth = 1 is the immediate referrer)
                    indirect_referrers AS (
                        SELECT DISTINCT "userId"
                        FROM referral_chain
                        WHERE depth > 1
                    ),
                    update_indirect_referral_count AS (
                        UPDATE "tokensale_userdata" tu
                        SET 
                            "referredUsersIndirectCount" = tu."referredUsersIndirectCount" + 1,
                            "updatedAt" = NOW()
                        FROM indirect_referrers ir
                        WHERE tu."userId" = ir."userId"
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
                PERFORM set_config('prevent_circular_referrals.active', 'false', TRUE);
                
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            -- Make sure the trigger is created/updated
            DROP TRIGGER IF EXISTS check_circular_referrals ON "tokensale_userdata";
            CREATE TRIGGER check_circular_referrals
                AFTER INSERT OR UPDATE ON "tokensale_userdata"
                FOR EACH ROW
                EXECUTE FUNCTION prevent_circular_referrals();
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokensales" DROP COLUMN "targetTokenDecimals"`);
        await queryRunner.query(`ALTER TABLE "tokensales" DROP COLUMN "targetTokenAddress"`);
        await queryRunner.query(`ALTER TABLE "tokensales" DROP COLUMN "targetTokenChain"`);
        await queryRunner.query(`ALTER TABLE "tokensales" RENAME COLUMN "saleContractType" TO "contractType"`);
        await queryRunner.query(`ALTER TABLE "tokensales" RENAME COLUMN "saleContractAddress" TO "address"`);
        await queryRunner.query(`ALTER TABLE "tokensales" RENAME COLUMN "saleContractChain" TO "chain"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "referredBy" uuid`);
    }

}

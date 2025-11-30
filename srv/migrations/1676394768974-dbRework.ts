// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";
import format from 'pg-format';
import { convertContentToPlainText } from "../common/converters"
import { grantTablePermissions } from "./migrationUtils";

export class dbRework1676394768974 implements MigrationInterface {
    name = 'dbRework1676394768974'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // drop triggers for 'last_update' column and drop set_timestamp_on_update stored function
        await queryRunner.query(`DROP TRIGGER trigger_set_last_update_on_accounts ON "public"."accounts"`);
        await queryRunner.query(`DROP TRIGGER trigger_set_last_update_on_groups ON "public"."groups"`);
        await queryRunner.query(`DROP TRIGGER trigger_set_last_update_on_articles ON "public"."articles"`);
        await queryRunner.query(`DROP TRIGGER trigger_set_last_update_on_areas ON "public"."areas"`);
        await queryRunner.query(`DROP TRIGGER trigger_set_last_update_on_channels ON "public"."channels"`);
        await queryRunner.query(`DROP TRIGGER trigger_set_last_update_on_areaaccess ON "public"."areaaccess"`);
        await queryRunner.query(`DROP TRIGGER trigger_set_last_update_on_followers ON "public"."followers"`);
        await queryRunner.query(`DROP TRIGGER trigger_set_last_update_on_conversations ON "public"."conversations"`);
        await queryRunner.query(`DROP TRIGGER trigger_set_last_update_on_groupaccess ON "public"."groupaccess"`);
        await queryRunner.query(`DROP TRIGGER trigger_set_last_update_on_groupblocks ON "public"."groupblocks"`);
        await queryRunner.query(`DROP TRIGGER trigger_set_last_update_on_messages ON "public"."messages"`);
        await queryRunner.query(`DROP TRIGGER trigger_set_last_update_on_posts ON "public"."posts"`);
        await queryRunner.query(`DROP TRIGGER trigger_set_last_update_on_reactions ON "public"."reactions"`);
        await queryRunner.query(`DROP TRIGGER update_groups_tsvectors ON "public"."groups"`);
        await queryRunner.query(`DROP FUNCTION IF EXISTS public.set_timestamp_on_update()`);

        // fix: delete broken areas (and their channels)
        await queryRunner.query(`DELETE FROM areas WHERE "id" NOT LIKE CONCAT("group_id", '%')`);
        // delete broken accounts without public key
        await queryRunner.query(`DELETE FROM "accounts" WHERE "public_key" IS NULL`);

        await queryRunner.query(`ALTER TABLE "accounts" DROP CONSTRAINT "FK_14160da127fa09244c4efbffc27"`);
        await queryRunner.query(`ALTER TABLE "groups" DROP CONSTRAINT "FK_8d965035a4b4ad05d836ad82770"`);
        await queryRunner.query(`ALTER TABLE "articles" DROP CONSTRAINT "FK_6d0e4d8e4b82ed4ee18ebc01833"`);
        await queryRunner.query(`ALTER TABLE "articles" DROP CONSTRAINT "FK_c670626555952c5baf8dbb30e7b"`);
        await queryRunner.query(`ALTER TABLE "areas" DROP CONSTRAINT "FK_97ab31f05420178a3f0cebb9ffb"`);
        await queryRunner.query(`ALTER TABLE "areaarticles" DROP CONSTRAINT "FK_1f3a7b480209ffd1fa4144708be"`);
        await queryRunner.query(`ALTER TABLE "areaarticles" DROP CONSTRAINT "FK_000d7bfd34ee06528230262769f"`);
        await queryRunner.query(`ALTER TABLE "areaaccess" DROP CONSTRAINT "FK_f26389b6203a831aa5d2e55179b"`);
        await queryRunner.query(`ALTER TABLE "areaaccess" DROP CONSTRAINT "FK_9f55634a12b66b0cbb5fa9d35f6"`);
        await queryRunner.query(`ALTER TABLE "blogs" DROP CONSTRAINT "FK_5802695613d95d4285195ed302c"`);
        await queryRunner.query(`ALTER TABLE "channels" DROP CONSTRAINT "FK_b254f3328915f6e063e49dd513e"`);
        await queryRunner.query(`ALTER TABLE "channelreadstate" DROP CONSTRAINT "FK_9f702b296412b2d0fc69cdedcc8"`);
        await queryRunner.query(`ALTER TABLE "channelreadstate" DROP CONSTRAINT "FK_50bac70cf884a09b6d4791e69fa"`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT "FK_64405a22fa9971f9530d7e474a3"`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT "FK_948676628b2911729a80645685d"`);
        await queryRunner.query(`ALTER TABLE "devices" DROP CONSTRAINT "FK_c26a6d5e10ecd1be5182facadaa"`);
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_49477f556b2fb265e5fb08bcd22"`);
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_d05bc4893a9526dc481435edb86"`);
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_9d5126cf69cc3899bed7f62ba28"`);
        await queryRunner.query(`ALTER TABLE "followers" DROP CONSTRAINT "FK_abe8aebdc163a91f6c2287b43d1"`);
        await queryRunner.query(`ALTER TABLE "followers" DROP CONSTRAINT "FK_b6a72cf7486c31a3e53d7162107"`);
        await queryRunner.query(`ALTER TABLE "groupaccess" DROP CONSTRAINT "FK_43687bdd41c631dc6c9d3b7b88c"`);
        await queryRunner.query(`ALTER TABLE "groupaccess" DROP CONSTRAINT "FK_001365109690d0d573114a9c6d2"`);
        await queryRunner.query(`ALTER TABLE "groupblocks" DROP CONSTRAINT "FK_3f36fbb53a57f3b0a90d728c770"`);
        await queryRunner.query(`ALTER TABLE "groupblocks" DROP CONSTRAINT "FK_b6b5a26a3066c1cf22f364cb5b6"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_72ffa22d68b72a09d5700e4463f"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_d8762108151bf40db7c99a98612"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_ad62e2ac4a556ceaf98330b2910"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_979fb4c9d38af5cb74829ab9a4f"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_e3bab03a7dee745151598930014"`);
        await queryRunner.query(`ALTER TABLE "reactions" DROP CONSTRAINT "FK_024940b15a583bf99ad3a575d68"`);
        await queryRunner.query(`DROP INDEX "public"."idx_accounts_address"`);
        await queryRunner.query(`DROP INDEX "public"."idx_account_referral"`);
        await queryRunner.query(`DROP INDEX "public"."idx_areas_group_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_areaarticles_area_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_channels_area_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_read_state_channel_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_read_state_account_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_event_owner"`);
        await queryRunner.query(`DROP INDEX "public"."idx_followers_account_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_followers_other_account_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_messages_from_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_messages_to_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_posts_accounts"`);
        await queryRunner.query(`DROP INDEX "public"."idx_posts_created"`);
        await queryRunner.query(`DROP INDEX "public"."idx_reactions_item"`);
        await queryRunner.query(`ALTER TABLE "areaarticles" DROP CONSTRAINT "areaarticles_area_id_article_id_key"`);
        await queryRunner.query(`ALTER TABLE "areaaccess" DROP CONSTRAINT "areaaccess_account_id_area_id_key"`);
        await queryRunner.query(`ALTER TABLE "channelreadstate" DROP CONSTRAINT "idx_read_state_channels_unique"`);
        await queryRunner.query(`ALTER TABLE "contracts" DROP CONSTRAINT "contracts_chain_address_key"`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT "conversations_account_id_other_account_id_key"`);
        await queryRunner.query(`ALTER TABLE "followers" DROP CONSTRAINT "followers_account_id_other_account_id_key"`);
        await queryRunner.query(`ALTER TABLE "groupaccess" DROP CONSTRAINT "groupaccess_account_id_group_id_key"`);
        await queryRunner.query(`ALTER TABLE "groupblocks" DROP CONSTRAINT "groupblocks_group_id_account_id_key"`);
        await queryRunner.query(`ALTER TABLE "reactions" DROP CONSTRAINT "reactions_account_id_item_id_key"`);

        // wallets
        await queryRunner.query(`CREATE TYPE "public"."wallets_type_enum" AS ENUM('cg_evm', 'evm')`);
        await queryRunner.query(`CREATE TYPE "public"."wallets_visibility_enum" AS ENUM('private', 'followed', 'public')`);
        await queryRunner.query(`CREATE TABLE "wallets" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "type" "public"."wallets_type_enum" NOT NULL DEFAULT 'evm', "loginEnabled" boolean NOT NULL DEFAULT false, "walletIdentifier" text NOT NULL, "signatureData" jsonb NOT NULL, "visibility" "public"."wallets_visibility_enum" NOT NULL DEFAULT 'private', "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP(3) WITH TIME ZONE, "accountId" uuid, CONSTRAINT "PK_8402e5df5a30a229380e83e4f7e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_b2cb163694d1e180388b6ada46" ON "wallets" ("accountId") `);
        await grantTablePermissions(queryRunner, 'wallets');
        // add grant select / insert for new table
        // also, fill wallets table?

        const linkedAddresses = await queryRunner.query(`SELECT * FROM linkedaddresses`);
        if (!Array.isArray(linkedAddresses)) {
            throw new Error("Error retrieving linkedAddresses");
        } else {
            if (linkedAddresses.length < 1) {
                console.warn("Warning: No linkedAddresses found");
            }
        }
        for (const linkedAddress of linkedAddresses) {
            if (!!linkedAddress.message && !!linkedAddress.message.ownerAddress && !!linkedAddress.message.linkedAddress && !!linkedAddress.signature && !!linkedAddress.visibility && typeof linkedAddress.deleted === 'boolean') {
                const accounts = await queryRunner.query(format(
                    'SELECT * FROM accounts WHERE "address" = %L',
                    linkedAddress.message.ownerAddress
                ));
                if (accounts.length < 1) {
                    console.log(JSON.stringify(linkedAddress));
                    console.warn("Warning: No account for linkedAddress found");
                } else {
                    const account = accounts[0];

                    // store account id for later use (fractalId)
                    linkedAddress.accountId = account.id;
                    const message = linkedAddress.message as {
                        ownerAddress: `0x${string}`;
                        linkedAddress: `0x${string}`;
                        signedChainId: number;
                    };

                    const signatureData = {
                        data: null,
                        legacyData: message,
                        signature: linkedAddress.signature
                    };

                    await queryRunner.query(format(`
                            INSERT INTO wallets ("accountId", "type", "walletIdentifier", "signatureData", "visibility", "deletedAt")
                            VALUES (%L::UUID, %L, %L, %L::JSONB, %L, %s)
                        `,
                        account.id,
                        'evm',
                        linkedAddress.message.linkedAddress,
                        JSON.stringify(signatureData),
                        linkedAddress.visibility,
                        linkedAddress.deleted ? 'now()' : 'NULL'
                    ));
                }

            } else {
                console.log(linkedAddress);
                throw new Error("Error: linkedAddress seems to be broken");
            }
        }

        // drop tables lastblocks, linkedaddresses, referral
        await queryRunner.query(`DROP TABLE "referral"`);
        await queryRunner.query(`DROP TABLE "lastblocks"`);
        await queryRunner.query(`DROP TABLE "linkedaddresses"`);

        // accounts
        // remove unique alias constraint
        await queryRunner.query(`ALTER TABLE "accounts" DROP CONSTRAINT "UQ_a5f4f991f324bd85b79afb8d371"`);

        const accounts = await queryRunner.query(`SELECT "alias", "id", "address" FROM accounts`);
        const aliases = new Set<string>();
        const changeAlias: {id: string, alias: string}[] = [];
        let aliasLower: string;
        let alias: string;
        for (const account of accounts) {
            if (account.alias === null) {
                aliasLower = account.address.toLowerCase();
                alias = account.address;
            } else {
                aliasLower = account.alias.toLowerCase();
                alias = account.alias;
            }
            if (aliases.has(aliasLower)) {
                // exists
                let i = 1;
                while (aliases.has(`${aliasLower}_${i}`)) {
                    i++;
                }
                aliases.add(`${aliasLower}_${i}`);
                changeAlias.push({
                    id: account.id,
                    alias: `${alias}_${i}`
                })
            } else {
                aliases.add(aliasLower);
                if (account.alias === null) {
                    changeAlias.push({
                        id: account.id,
                        alias
                    })
                }
            }

            await queryRunner.query(format(`
                INSERT INTO wallets ("accountId", "type", "loginEnabled", "walletIdentifier", "signatureData", "visibility")
                VALUES (%L, 'cg_evm', TRUE, %L, '{"data": null, "signature": ""}'::JSONB, 'private')
            `, account.id, account.address.toLowerCase()));
        }
        for (const change of changeAlias) {
            await queryRunner.query(format(`
                    UPDATE accounts
                    SET "alias" = %L
                    WHERE "id" = %L::UUID
                `,
                change.alias,
                change.id
            ));
        }

        await queryRunner.query(`ALTER TABLE "accounts" RENAME COLUMN "public_key" TO "publicKey"`);
        await queryRunner.query(`ALTER TABLE "accounts" RENAME COLUMN "key_storage" TO "recoveryStorage"`);
        await queryRunner.query(`ALTER TABLE "accounts" ADD "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "accounts" ADD "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "accounts" ADD "deletedAt" TIMESTAMP(3) WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "accounts" ADD "previewImageId" character varying(64)`);
        await queryRunner.query(`ALTER TABLE "accounts" ADD "verification" jsonb`);
        await queryRunner.query(`ALTER TABLE "accounts" ADD "groupOrder" jsonb NOT NULL DEFAULT '[]'::JSONB`);
        await queryRunner.query(`ALTER TABLE "accounts" ADD "newsletter" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "accounts" ADD "onboardingComplete" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "accounts" ADD "email" character varying(128)`);
        await queryRunner.query(`
            UPDATE "accounts" SET
            "createdAt" = "created",
            "updatedAt" = "last_update",
            "previewImageId" = SUBSTRING("preview_image_id" FROM 1 FOR 64),
            "groupOrder" = COALESCE(("app_data"->'groupOrder'), '[]'::JSONB),
            "newsletter" = COALESCE(("app_data"->'newsletterSubscribed')::boolean, false),
            "onboardingComplete" = COALESCE(("app_data"->'onboardingComplete')::boolean, false),
            "email" = "app_data"->>'newsletterEmail'
        `);
        await queryRunner.query(`UPDATE "accounts" SET "deletedAt" = now() WHERE "deleted" = true`);
        await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "created"`);
        await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "last_update"`);
        await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "deleted"`);
        await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "referral_id"`);
        await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "verified"`);
        await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "preview_image_id"`);
        await queryRunner.query(`ALTER TABLE "accounts" RENAME COLUMN "blog_creator" TO "blogCreator"`);
        await queryRunner.query(`ALTER TABLE "accounts" DROP CONSTRAINT "UQ_48ec5fcf335b99d4792dd5e4537"`);
        await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "address"`);
        await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "public_key_signature"`);
        await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "key_storage_signature"`);
        await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "profile_signature"`);
        await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "app_data"`);
        await queryRunner.query(`ALTER TABLE "accounts" ALTER COLUMN "alias" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "accounts" ALTER COLUMN "imageId" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "accounts" ALTER COLUMN "alias" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "accounts" ALTER COLUMN "publicKey" SET NOT NULL`);

        // create unique index for lower alias
        await queryRunner.query(`CREATE UNIQUE INDEX "unique_account_alias_lower" ON accounts( LOWER("alias") )`);
        // create unique index for fractalId
        await queryRunner.query(`CREATE UNIQUE INDEX "unique_account_fractal_id" ON accounts( (verification->>'fractalId') )`);

        for (const linkedAddress of linkedAddresses) {
            if (!!linkedAddress.fractal_id && linkedAddress.accountId) {
                const verification = {
                    fractalId: linkedAddress.fractal_id
                };

                await queryRunner.query(format(`
                        UPDATE accounts
                        SET "verification" = %L::JSONB
                        WHERE "id" = %L::UUID
                    `,
                    JSON.stringify(verification),
                    linkedAddress.accountId
                ));
            }
        }

        // remove "muted" attribute from appData
        /*await queryRunner.query(`

        `);*/

        // groups
        await queryRunner.query(`ALTER TABLE "groups" ADD "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "groups" ADD "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "groups" ADD "deletedAt" TIMESTAMP(3) WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "groups" ADD "previewImageId" character varying(64)`);
        await queryRunner.query(`UPDATE "groups" SET "createdAt" = "created", "updatedAt" = "last_update", "previewImageId" = SUBSTRING("preview_image_id" FROM 1 FOR 64)`);
        await queryRunner.query(`ALTER TABLE "groups" RENAME COLUMN "nft_data" TO "nftData"`);
        await queryRunner.query(`ALTER TABLE "groups" RENAME COLUMN "nft_admin" TO "nftAdmin"`);
        await queryRunner.query(`ALTER TABLE "groups" RENAME COLUMN "creator" TO "ownerId"`);
        await queryRunner.query(`ALTER TABLE "groups" DROP COLUMN "preview_image_id"`);
        await queryRunner.query(`ALTER TABLE "groups" DROP CONSTRAINT "UQ_1d9173597263b3bd15d15aa8a96"`);
        await queryRunner.query(`ALTER TABLE "groups" RENAME COLUMN "nft_id" TO "nftId"`);
        await queryRunner.query(`ALTER TABLE "groups" ADD CONSTRAINT "UQ_bb8d83bba8b5a3ab5eb00934bc5" UNIQUE ("nftId")`);
        await queryRunner.query(`ALTER TABLE "groups" DROP COLUMN "created"`);
        await queryRunner.query(`ALTER TABLE "groups" DROP COLUMN "last_update"`);
        await queryRunner.query(`ALTER TABLE "groups" DROP COLUMN "deleted"`);
        await queryRunner.query(`ALTER TABLE "groups" ALTER COLUMN "ownerId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "groups" RENAME TO "communities"`);
        
        // articles
        await queryRunner.query(`ALTER TABLE "articles" ADD "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "articles" ADD "communityId" character varying(10)`);
        await queryRunner.query(`ALTER TABLE "articles" ADD "previewText" character varying(80)`);
        await queryRunner.query(`ALTER TABLE "articles" ALTER COLUMN "headerImageId" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "articles" ALTER COLUMN "thumbnailImageId" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "articles" ALTER COLUMN "published" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "articles" RENAME COLUMN "creator" TO "creatorId"`);
        await queryRunner.query(`ALTER TABLE "articles" RENAME COLUMN "updatedAt" TO "updated_at"`);
        await queryRunner.query(`ALTER TABLE "articles" RENAME COLUMN "deletedAt" TO "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "articles" ADD "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "articles" ADD "deletedAt" TIMESTAMP(3) WITH TIME ZONE`);
        await queryRunner.query(`UPDATE "articles" SET "communityId" = SUBSTRING("group_id" FROM 1 FOR 10), "createdAt" = COALESCE("published", "updated_at" AT TIME ZONE 'UTC', now()), "updatedAt" = COALESCE("updated_at" AT TIME ZONE 'UTC', now()), "deletedAt" = "deleted_at" AT TIME ZONE 'UTC'`);
        await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN "group_id"`);
        await queryRunner.query(`ALTER TABLE "articles" ALTER COLUMN "communityId" SET NOT NULL`);
        const articles = await queryRunner.query(`SELECT id, "previewText", content FROM "articles" WHERE "deletedAt" IS NULL`);
        for (const article of articles) {
            if (article.previewText === null) {
                article.previewText = '';
                if (article.content) {
                    if (article.content.version === '1') {
                        article.previewText = article.content.text;
                    } else if (article.content.version === '2') {
                        article.previewText = convertContentToPlainText(article.content.content);
                    }
                }
                if (!!article.previewText) {
                    article.previewText = article.previewText.substring(0, 80);
                    await queryRunner.query(format(`
                            UPDATE articles
                            SET "previewText" = %L
                            WHERE "id" = %L::UUID
                        `,
                        article.previewText,
                        article.id
                    ));
                }
            }
        }

        // areas
        await queryRunner.query(`ALTER TABLE "areas" ADD "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "areas" ADD "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "areas" ADD "deletedAt" TIMESTAMP(3) WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "areas" DROP CONSTRAINT "PK_5110493f6342f34c978c084d0d6"`);
        await queryRunner.query(`ALTER TABLE "areas" RENAME COLUMN "id" TO "old_id"`);
        await queryRunner.query(`ALTER TABLE "areas" ADD "id" character varying(4)`);
        await queryRunner.query(`UPDATE "areas" SET "updatedAt" = COALESCE("last_update", now()), "id" = SUBSTRING("old_id" FROM 11 FOR 4)`);
        await queryRunner.query(`UPDATE "areas" SET "deletedAt" = now() WHERE "deleted" = true`);
        await queryRunner.query(`ALTER TABLE "areas" DROP COLUMN "old_id"`);
        await queryRunner.query(`ALTER TABLE "areas" DROP COLUMN "last_update"`);
        await queryRunner.query(`ALTER TABLE "areas" DROP COLUMN "deleted"`);
        await queryRunner.query(`ALTER TABLE "areas" RENAME COLUMN "writableby" TO "writableBy"`);
        await queryRunner.query(`ALTER TABLE "areas" RENAME COLUMN "group_id" TO "communityId"`);
        await queryRunner.query(`ALTER TABLE "areas" ALTER COLUMN "id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "areas" ADD CONSTRAINT "PK_c2dafe9dd58cb04baf1c89e3428" PRIMARY KEY ("id", "communityId")`);

        // areaarticles
        await queryRunner.query(`ALTER TABLE "areaarticles" RENAME COLUMN "article_id" TO "articleId"`);
        await queryRunner.query(`ALTER TABLE "areaarticles" ADD "communityId" character varying(10)`);
        await queryRunner.query(`ALTER TABLE "areaarticles" ADD "areaId" character varying(4)`);
        await queryRunner.query(`UPDATE "areaarticles" SET "communityId" = SUBSTRING("area_id" FROM 1 FOR 10), "areaId" = SUBSTRING("area_id" FROM 11 FOR 4)`);
        await queryRunner.query(`ALTER TABLE "areaarticles" ALTER COLUMN "communityId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "areaarticles" ALTER COLUMN "areaId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "areaarticles" DROP COLUMN "area_id"`);

        // areaaccess
        await queryRunner.query(`ALTER TABLE "areaaccess" ADD "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "areaaccess" ADD "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "areaaccess" ADD "deletedAt" TIMESTAMP(3) WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "areaaccess" RENAME COLUMN "account_id" TO "accountId"`);
        await queryRunner.query(`ALTER TABLE "areaaccess" ADD "communityId" character varying(10)`);
        await queryRunner.query(`ALTER TABLE "areaaccess" ADD "areaId" character varying(4)`);
        await queryRunner.query(`UPDATE "areaaccess" SET "communityId" = SUBSTRING("area_id" FROM 1 FOR 10), "areaId" = SUBSTRING("area_id" FROM 11 FOR 4)`);
        await queryRunner.query(`UPDATE "areaaccess" SET "deletedAt" = now() WHERE "deleted" = true`);
        await queryRunner.query(`UPDATE "areaaccess" SET "updatedAt" = "last_update" WHERE "last_update" IS NOT NULL`);
        await queryRunner.query(`ALTER TABLE "areaaccess" ALTER COLUMN "communityId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "areaaccess" ALTER COLUMN "areaId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "areaaccess" DROP COLUMN "updated_at_block"`);
        await queryRunner.query(`ALTER TABLE "areaaccess" DROP COLUMN "last_update"`);
        await queryRunner.query(`ALTER TABLE "areaaccess" DROP COLUMN "deleted"`);
        await queryRunner.query(`ALTER TABLE "areaaccess" DROP COLUMN "area_id"`);

        // blogs
        await queryRunner.query(`ALTER TABLE "blogs" RENAME COLUMN "creator" TO "creatorId"`);
        await queryRunner.query(`ALTER TABLE "blogs" RENAME COLUMN "header_image_id" TO "headerImageId"`);
        await queryRunner.query(`ALTER TABLE "blogs" RENAME COLUMN "thumbnail_image_id" TO "thumbnailImageId"`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD "previewText" character varying(80)`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD "deletedAt" TIMESTAMP(3) WITH TIME ZONE`);
        await queryRunner.query(`UPDATE "blogs" SET "updatedAt" = "last_update", "createdAt" = COALESCE("last_update", now())`);
        await queryRunner.query(`UPDATE "blogs" SET "deletedAt" = now() WHERE "deleted" = true`);
        await queryRunner.query(`ALTER TABLE "blogs" DROP COLUMN "last_update"`);
        await queryRunner.query(`ALTER TABLE "blogs" DROP COLUMN "deleted"`);
        await queryRunner.query(`ALTER TABLE "blogs" ALTER COLUMN "published" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "blogs" ALTER COLUMN "headerImageId" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "blogs" ALTER COLUMN "thumbnailImageId" DROP DEFAULT`);
        const blogs = await queryRunner.query(`SELECT id, "previewText", content FROM "blogs" WHERE "deletedAt" IS NULL`);
        for (const blog of blogs) {
            if (blog.previewText === null) {
                blog.previewText = '';
                if (blog.content) {
                    if (blog.content.version === '1') {
                        blog.previewText = blog.content.text;
                    } else if (blog.content.version === '2') {
                        blog.previewText = convertContentToPlainText(blog.content.content);
                    }
                }
                if (!!blog.previewText) {
                    blog.previewText = blog.previewText.substring(0, 80);
                    await queryRunner.query(format(`
                            UPDATE "blogs"
                            SET "previewText" = %L
                            WHERE "id" = %L::UUID
                        `,
                        blog.previewText,
                        blog.id
                    ));
                }
            }
        }

        // channels
        await queryRunner.query(`ALTER TABLE "channels" DROP CONSTRAINT "PK_bc603823f3f741359c2339389f9"`);
        await queryRunner.query(`ALTER TABLE "channels" RENAME COLUMN "id" TO "old_id"`);
        await queryRunner.query(`ALTER TABLE "channels" ADD "id" character varying(4)`);
        await queryRunner.query(`ALTER TABLE "channels" ADD "communityId" character varying(10)`);
        await queryRunner.query(`ALTER TABLE "channels" ADD "areaId" character varying(4)`);
        await queryRunner.query(`ALTER TABLE "channels" ADD "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "channels" ADD "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "channels" ADD "deletedAt" TIMESTAMP(3) WITH TIME ZONE`);
        await queryRunner.query(`UPDATE "channels" SET "communityId" = SUBSTRING("old_id" FROM 1 FOR 10), "areaId" = SUBSTRING("old_id" FROM 11 FOR 4), "id" = SUBSTRING("old_id" FROM 15 FOR 4)`);
        await queryRunner.query(`UPDATE "channels" SET "updatedAt" = COALESCE("last_update", now()), "createdAt" = COALESCE("last_update", now())`);
        await queryRunner.query(`UPDATE "channels" SET "deletedAt" = now() WHERE "deleted" = true`);
        await queryRunner.query(`ALTER TABLE "channels" ALTER COLUMN "id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "channels" ALTER COLUMN "communityId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "channels" ALTER COLUMN "areaId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "channels" DROP COLUMN "last_update"`);
        await queryRunner.query(`ALTER TABLE "channels" DROP COLUMN "deleted"`);
        await queryRunner.query(`ALTER TABLE "channels" DROP COLUMN "area_id"`);
        await queryRunner.query(`ALTER TABLE "channels" DROP COLUMN "old_id"`);
        await queryRunner.query(`ALTER TABLE "channels" ADD CONSTRAINT "PK_9a5679d848f381d108af8b72d53" PRIMARY KEY ("id", "communityId")`);

        // channelreadstate
        await queryRunner.query(`ALTER TABLE "channelreadstate" DROP CONSTRAINT "PK_2e73b023c2abcf7e1242587924c"`);
        await queryRunner.query(`ALTER TABLE "channelreadstate" RENAME COLUMN "account_id" TO "accountId"`);
        await queryRunner.query(`ALTER TABLE "channelreadstate" ADD "channelId" character varying(4)`);
        await queryRunner.query(`ALTER TABLE "channelreadstate" ADD "communityId" character varying(10)`);
        await queryRunner.query(`ALTER TABLE "channelreadstate" ADD "areaId" character varying(4)`);
        await queryRunner.query(`UPDATE "channelreadstate" SET "communityId" = SUBSTRING("channel_id" FROM 1 FOR 10), "areaId" = SUBSTRING("channel_id" FROM 11 FOR 4), "channelId" = SUBSTRING("channel_id" FROM 15 FOR 4)`);
        await queryRunner.query(`ALTER TABLE "channelreadstate" ALTER COLUMN "channelId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "channelreadstate" ALTER COLUMN "communityId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "channelreadstate" ALTER COLUMN "areaId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "channelreadstate" DROP COLUMN "channel_id"`);
        await queryRunner.query(`ALTER TABLE "channelreadstate" ADD CONSTRAINT "PK_93bb04d5f3320003508db39b0db" PRIMARY KEY ("channelId", "accountId", "communityId", "areaId")`);

        // conversations
        await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT "PK_1e7ba28dc287cca6fc04f9c5e00"`);
        await queryRunner.query(`ALTER TABLE "conversations" RENAME COLUMN "account_id" TO "accountId"`);
        await queryRunner.query(`ALTER TABLE "conversations" RENAME COLUMN "other_account_id" TO "otherAccountId"`);
        await queryRunner.query(`ALTER TABLE "conversations" RENAME COLUMN "last_read" TO "lastRead"`);
        await queryRunner.query(`ALTER TABLE "conversations" ALTER COLUMN "lastRead" TYPE TIMESTAMP(3) WITH TIME ZONE USING "lastRead"`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD "deletedAt" TIMESTAMP(3) WITH TIME ZONE`);
        await queryRunner.query(`UPDATE "conversations" SET "updatedAt" = COALESCE("last_update", now()), "createdAt" = COALESCE("last_update", now())`);
        await queryRunner.query(`UPDATE "conversations" SET "deletedAt" = now() WHERE "deleted" = true`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN "last_update"`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN "deleted"`);
        await queryRunner.query(`ALTER TABLE "conversations" ALTER COLUMN "lastRead" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD CONSTRAINT "PK_d3024b353be852d97dd2fd25d80" PRIMARY KEY ("accountId", "otherAccountId")`);

        // devices
        await queryRunner.query(`ALTER TABLE "devices" ADD "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "devices" ADD "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "devices" ADD "deletedAt" TIMESTAMP(3) WITH TIME ZONE`);
        await queryRunner.query(`UPDATE "devices" SET "createdAt" = "created"`);
        await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "created"`);
        await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "lastLogin"`);
        await queryRunner.query(`ALTER TABLE "devices" ALTER COLUMN "accountId" SET NOT NULL`);

        // events
        await queryRunner.query(`ALTER TABLE "events" ADD "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "events" ADD "deletedAt" TIMESTAMP(3) WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "events" RENAME COLUMN "click_data" TO "clickData"`);
        await queryRunner.query(`ALTER TABLE "events" RENAME COLUMN "owner" TO "accountId"`);
        await queryRunner.query(`ALTER TABLE "events" RENAME COLUMN "subject_user" TO "subjectUserId"`);
        await queryRunner.query(`ALTER TABLE "events" RENAME COLUMN "subject_group" TO "subjectCommunityId"`);
        await queryRunner.query(`UPDATE "events" SET "createdAt" = "created"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "created"`);
        await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "text" DROP DEFAULT`);
        
        // followers
        await queryRunner.query(`ALTER TABLE "followers" DROP CONSTRAINT "PK_860aae07a6f1f4af6440e6e8f0f"`);
        await queryRunner.query(`ALTER TABLE "followers" RENAME COLUMN "account_id" TO "accountId"`);
        await queryRunner.query(`ALTER TABLE "followers" RENAME COLUMN "other_account_id" TO "otherAccountId"`);
        await queryRunner.query(`ALTER TABLE "followers" ADD "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "followers" ADD "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "followers" ADD "deletedAt" TIMESTAMP(3) WITH TIME ZONE`);
        await queryRunner.query(`UPDATE "followers" SET "createdAt" = "created", "updatedAt" = "last_update"`);
        await queryRunner.query(`UPDATE "followers" SET "deletedAt" = now() WHERE "deleted" = true`);
        await queryRunner.query(`ALTER TABLE "followers" ADD CONSTRAINT "PK_1b926f716dcae7a42c4f3498890" PRIMARY KEY ("accountId", "otherAccountId")`);       
        await queryRunner.query(`ALTER TABLE "followers" DROP COLUMN "created"`);
        await queryRunner.query(`ALTER TABLE "followers" DROP COLUMN "last_update"`);
        await queryRunner.query(`ALTER TABLE "followers" DROP COLUMN "deleted"`);

        // groupaccess
        await queryRunner.query(`ALTER TABLE "groupaccess" RENAME COLUMN "account_id" TO "accountId"`);
        await queryRunner.query(`ALTER TABLE "groupaccess" RENAME COLUMN "group_id" TO "communityId"`);
        await queryRunner.query(`ALTER TABLE "groupaccess" ADD "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "groupaccess" ADD "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "groupaccess" ADD "deletedAt" TIMESTAMP(3) WITH TIME ZONE`);
        await queryRunner.query(`UPDATE "groupaccess" SET "createdAt" = COALESCE("last_update", now()), "updatedAt" = COALESCE("last_update", now())`);
        await queryRunner.query(`UPDATE "groupaccess" SET "deletedAt" = now() WHERE "deleted" = true`);
        await queryRunner.query(`ALTER TABLE "groupaccess" DROP COLUMN "last_update"`);
        await queryRunner.query(`ALTER TABLE "groupaccess" DROP COLUMN "deleted"`);
        
        // groupblocks
        await queryRunner.query(`ALTER TABLE "groupblocks" DROP CONSTRAINT "PK_46f84a16aaad0486ed2dee63e8e"`);
        await queryRunner.query(`ALTER TABLE "groupblocks" RENAME COLUMN "group_id" TO "communityId"`);
        await queryRunner.query(`ALTER TABLE "groupblocks" RENAME COLUMN "account_id" TO "accountId"`);
        await queryRunner.query(`ALTER TABLE "groupblocks" ADD "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "groupblocks" ADD "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "groupblocks" ADD "deletedAt" TIMESTAMP(3) WITH TIME ZONE`);
        await queryRunner.query(`UPDATE "groupblocks" SET "createdAt" = COALESCE("last_update", now()), "updatedAt" = COALESCE("last_update", now())`);
        await queryRunner.query(`UPDATE "groupblocks" SET "deletedAt" = now() WHERE "deleted" = true`);
        await queryRunner.query(`ALTER TABLE "groupblocks" DROP COLUMN "last_update"`);
        await queryRunner.query(`ALTER TABLE "groupblocks" DROP COLUMN "deleted"`);
        await queryRunner.query(`ALTER TABLE "groupblocks" ADD CONSTRAINT "PK_66be5653dce062e64bc287038df" PRIMARY KEY ("communityId", "accountId")`);
        
        // logging
        await queryRunner.query(`ALTER TABLE "logging" ADD "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "logging" DROP CONSTRAINT "PK_2b6eefd2a39237bdb7e3545fa55"`);
        await queryRunner.query(`ALTER TABLE "logging" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "logging" ADD "id" uuid NOT NULL DEFAULT gen_random_uuid()`);
        await queryRunner.query(`ALTER TABLE "logging" ADD CONSTRAINT "PK_2b6eefd2a39237bdb7e3545fa55" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "logging" ALTER COLUMN "service" TYPE character varying(30)`);
        await queryRunner.query(`UPDATE "logging" SET "createdAt" = "created"`);
        await queryRunner.query(`ALTER TABLE "logging" DROP COLUMN "created"`);

        // messages - delete all old messages
        await queryRunner.query(`TRUNCATE TABLE "messages"`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "body" jsonb NOT NULL`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "deletedAt" TIMESTAMP(3) WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "fromId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "toId" uuid`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "parentMessageId" uuid`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "message"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "created"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "from_id"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "to_id"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "parent_message_id"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "last_update"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "deleted"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "signature"`);

        // posts
        // todo: update tsvector functions
        await queryRunner.query(`ALTER TABLE "posts" RENAME COLUMN "account_id" TO "accountId"`);
        await queryRunner.query(`ALTER TABLE "posts" RENAME COLUMN "parent_post_id" TO "parentPostId"`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "channelId" character varying(4)`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "communityId" character varying(10)`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "areaId" character varying(4)`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "body" jsonb`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "deletedAt" TIMESTAMP(3) WITH TIME ZONE`);
        await queryRunner.query(`UPDATE "posts" SET "createdAt" = "created", "updatedAt" = COALESCE("last_update", now()), "body" = ("message"->'body')::JSONB, "communityId" = SUBSTRING(("message"->>'channelId') FROM 1 FOR 10), "areaId" = SUBSTRING(("message"->>'channelId') FROM 11 FOR 4), "channelId" = SUBSTRING(("message"->>'channelId') FROM 15 FOR 4)`);
        await queryRunner.query(`UPDATE "posts" SET "deletedAt" = now() WHERE "deleted" = true`);
        await queryRunner.query(`ALTER TABLE "posts" ALTER COLUMN "channelId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "posts" ALTER COLUMN "communityId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "posts" ALTER COLUMN "areaId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "posts" ALTER COLUMN "body" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "last_update"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "deleted"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "message"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "created"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "signature"`);
        
        // reactions
        await queryRunner.query(`ALTER TABLE "reactions" DROP CONSTRAINT "PK_bf5236a977d7677bcdaee827531"`);
        await queryRunner.query(`ALTER TABLE "reactions" RENAME COLUMN "account_id" TO "accountId"`);
        await queryRunner.query(`ALTER TABLE "reactions" RENAME COLUMN "item_id" TO "itemId"`);
        await queryRunner.query(`ALTER TABLE "reactions" ADD "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "reactions" ADD "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "reactions" ADD "deletedAt" TIMESTAMP(3) WITH TIME ZONE`);
        await queryRunner.query(`UPDATE "reactions" SET "createdAt" = COALESCE("last_update", now()), "updatedAt" = COALESCE("last_update", now())`);
        await queryRunner.query(`UPDATE "reactions" SET "deletedAt" = now() WHERE "deleted" = true`);    
        await queryRunner.query(`ALTER TABLE "reactions" DROP COLUMN "last_update"`);
        await queryRunner.query(`ALTER TABLE "reactions" DROP COLUMN "deleted"`);
        await queryRunner.query(`ALTER TABLE "reactions" ADD CONSTRAINT "PK_5728e9769987c663d63b547da34" PRIMARY KEY ("accountId", "itemId")`);

        // contracts
        await queryRunner.query(`ALTER TABLE "contracts" ADD "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now()`);

        await queryRunner.query(`CREATE INDEX "IDX_0123adca8c7e5c4f95ee16220d" ON "accounts" ("deletedAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_a0fa79c4b36506ae59e5e2e483" ON "groupaccess" ("communityId") `);
        await queryRunner.query(`CREATE INDEX "IDX_21d389a088a07773deb63bf962" ON "areas" ("communityId") `);
        await queryRunner.query(`CREATE INDEX "IDX_756a562d31b79088db2aa56183" ON "areaarticles" ("communityId") `);
        await queryRunner.query(`CREATE INDEX "IDX_3d96e4202074cfceb6b604849c" ON "areaarticles" ("areaId", "communityId") `);
        await queryRunner.query(`CREATE INDEX "IDX_da0c2bf7114fbe51b06730e770" ON "channelreadstate" ("accountId") `);
        await queryRunner.query(`CREATE INDEX "IDX_a6a98c1583d9dbf027e84a0d16" ON "conversations" ("accountId") `);
        await queryRunner.query(`CREATE INDEX "IDX_b7c95ad4032e20b7d80bcba21b" ON "events" ("accountId") `);
        await queryRunner.query(`CREATE INDEX "IDX_e1ece8c8117db1a9e408d6c742" ON "followers" ("accountId") `);
        await queryRunner.query(`CREATE INDEX "IDX_7fc4cc54501c17bca99a13fae8" ON "followers" ("otherAccountId") `);
        await queryRunner.query(`CREATE INDEX "IDX_627bdb88ff88b446023474e426" ON "messages" ("fromId") `);
        await queryRunner.query(`CREATE INDEX "IDX_4d8b2643c29b31e55b13b9213a" ON "messages" ("toId") `);
        await queryRunner.query(`CREATE INDEX "IDX_6ce6acdb0801254590f8a78c08" ON "messages" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_284257a7a4f1c23a4bda08ecf2" ON "messages" ("updatedAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_26e962f7c89b9f0b5c417b442f" ON "messages" ("deletedAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_46bc204f43827b6f25e0133dbf" ON "posts" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_78e008806ce2d7c53e406e1b0f" ON "posts" ("updatedAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_2fdceba3d316f92cf224ba56fa" ON "posts" ("deletedAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_36a8c0a688f422aa1ede54bb9e" ON "reactions" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_e306f496a8ec906d3240fc14c5" ON "reactions" ("updatedAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_cbbd581cda5c03e2f459fb6b00" ON "reactions" ("deletedAt") `);
        await queryRunner.query(`ALTER TABLE "groupaccess" ADD CONSTRAINT "UQ_e2bbb4c83c97cbf1cfd904644d1" UNIQUE ("accountId", "communityId")`);
        await queryRunner.query(`ALTER TABLE "areaaccess" ADD CONSTRAINT "UQ_36cf950a5bb87c74ddb6bba38f2" UNIQUE ("accountId", "areaId", "communityId")`);
        await queryRunner.query(`ALTER TABLE "areaarticles" ADD CONSTRAINT "UQ_826912dcb0f2598b419740c699a" UNIQUE ("areaId", "articleId", "communityId")`);
        await queryRunner.query(`ALTER TABLE "contracts" ADD CONSTRAINT "UQ_5063b64d6dc7b522359c0d58bf6" UNIQUE ("chain", "address")`);
        await queryRunner.query(`ALTER TABLE "devices" ADD CONSTRAINT "FK_c26a6d5e10ecd1be5182facadaa" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "groupaccess" ADD CONSTRAINT "FK_8fcc9e0bac8de83330fb8bd5c49" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "groupaccess" ADD CONSTRAINT "FK_a0fa79c4b36506ae59e5e2e483f" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "communities" ADD CONSTRAINT "FK_2d9086cef1ffd5148f90a9fab5d" FOREIGN KEY ("ownerId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "areas" ADD CONSTRAINT "FK_21d389a088a07773deb63bf962d" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "areaaccess" ADD CONSTRAINT "FK_a58b5a18834e30316829d3dc620" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "areaaccess" ADD CONSTRAINT "FK_b06e59019da7328ea4c6201dc3e" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "areaaccess" ADD CONSTRAINT "FK_fa2d1e6b519779dffd1aa465ca0" FOREIGN KEY ("areaId", "communityId") REFERENCES "areas"("id","communityId") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "articles" ADD CONSTRAINT "FK_8628beae918a929c34c9fd9bcf5" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "articles" ADD CONSTRAINT "FK_d08fa10065354a4a0192ae5d3db" FOREIGN KEY ("creatorId") REFERENCES "accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "areaarticles" ADD CONSTRAINT "FK_c060a0c1c11dc14076f73b8f7de" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "areaarticles" ADD CONSTRAINT "FK_756a562d31b79088db2aa56183e" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "areaarticles" ADD CONSTRAINT "FK_3d96e4202074cfceb6b604849c2" FOREIGN KEY ("areaId", "communityId") REFERENCES "areas"("id","communityId") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD CONSTRAINT "FK_af5a5654616feb7437a27b0af23" FOREIGN KEY ("creatorId") REFERENCES "accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "channels" ADD CONSTRAINT "FK_9125e4835d18c934051a77c1d85" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "channels" ADD CONSTRAINT "FK_671285a0007508af346c5271394" FOREIGN KEY ("areaId", "communityId") REFERENCES "areas"("id","communityId") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "channelreadstate" ADD CONSTRAINT "FK_4265a32e555eb6a5c40d82a5285" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "channelreadstate" ADD CONSTRAINT "FK_296e773714ff4b39c6ec94becbe" FOREIGN KEY ("areaId", "communityId") REFERENCES "areas"("id","communityId") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "channelreadstate" ADD CONSTRAINT "FK_ae098c148f519ef9609b0f87d6f" FOREIGN KEY ("communityId", "channelId") REFERENCES "channels"("communityId","id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "channelreadstate" ADD CONSTRAINT "FK_da0c2bf7114fbe51b06730e770f" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD CONSTRAINT "FK_a6a98c1583d9dbf027e84a0d16e" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD CONSTRAINT "FK_369486dbdbd81f4f66394a32fb4" FOREIGN KEY ("otherAccountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_b7c95ad4032e20b7d80bcba21b9" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_9afbbcc2e5d68f635d772956e62" FOREIGN KEY ("subjectUserId") REFERENCES "accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_67ad54ff867676b622ae7a32f10" FOREIGN KEY ("subjectCommunityId") REFERENCES "communities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "followers" ADD CONSTRAINT "FK_e1ece8c8117db1a9e408d6c742c" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "followers" ADD CONSTRAINT "FK_7fc4cc54501c17bca99a13fae84" FOREIGN KEY ("otherAccountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "groupblocks" ADD CONSTRAINT "FK_22e78b9caafbc4b6b90c2108560" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "groupblocks" ADD CONSTRAINT "FK_382fdc821095697c152f329ff7d" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_627bdb88ff88b446023474e4261" FOREIGN KEY ("fromId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_4d8b2643c29b31e55b13b9213ab" FOREIGN KEY ("toId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_379d3b2679ddf515e5a90de0153" FOREIGN KEY ("parentMessageId") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_e5f99a0b3edb7e1867f44b2cf4c" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_9b08fdc94a50f52ea49cc29d1bc" FOREIGN KEY ("areaId", "communityId") REFERENCES "areas"("id","communityId") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_1d78febf9d7926dfbdfa89812ad" FOREIGN KEY ("communityId", "channelId") REFERENCES "channels"("communityId","id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_d9ac3ea6a30d3913860fbe5f281" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_aae2a693e9663af83068dfd97d7" FOREIGN KEY ("parentPostId") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reactions" ADD CONSTRAINT "FK_ff49fe8e03f6e7aa4cb4f09f3de" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "wallets" ADD CONSTRAINT "FK_b2cb163694d1e180388b6ada46e" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "wallets" ADD CONSTRAINT "UQ_7e6f9c225f82ece575c20b13223" UNIQUE ("type", "walletIdentifier")`);
        
        // fix stored procedures
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION public.posts_tsvector_update()
                RETURNS trigger
                LANGUAGE plpgsql
            AS $function$
            DECLARE
                new_tags jsonb;
                old_tags jsonb;
            BEGIN
                SELECT INTO new_tags jsonb_build_object('tags', COALESCE(array_agg(message_pieces->>'value'),'{}'))
                FROM (
                    SELECT jsonb_array_elements(NEW.body->'content')
                )_(message_pieces)
                WHERE message_pieces->>'type' = 'tag';

                IF TG_OP = 'INSERT' THEN
                    NEW.tsv_tags = to_tsvector('simple', COALESCE(new_tags->>'tags', '[]'));
                END IF;
                IF TG_OP = 'UPDATE' THEN
                    SELECT INTO old_tags jsonb_build_object('tags', COALESCE(array_agg(old_message_pieces->>'value'),'{}'))
                    FROM (
                        SELECT jsonb_array_elements(OLD.body->'content')
                    )_(old_message_pieces)
                    WHERE old_message_pieces->>'type' = 'tag';

                    IF new_tags->>'tags' <> old_tags->>'tags' THEN
                        NEW.tsv_tags = to_tsvector('simple', COALESCE(new_tags->>'tags', '[]'));
                    END IF;
                END IF;
                RETURN NEW;
            END;
            $function$;
        `);
        await queryRunner.query(`DROP FUNCTION IF EXISTS public.groups_tsvector_update()`);
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION public.communities_tsvector_update()
                RETURNS trigger
                LANGUAGE plpgsql
            AS $function$
            BEGIN
                IF TG_OP = 'INSERT' THEN
                    NEW.tsv_description = to_tsvector('simple', COALESCE(NEW.info->>'description', ''));
                    NEW.tsv_tags = to_tsvector('simple', COALESCE(NEW.info->'tags', '[]'::JSONB));
                END IF;
                IF TG_OP = 'UPDATE' THEN
                    IF NEW.info->>'description' <> OLD.info->>'description' THEN
                        NEW.tsv_description = to_tsvector('simple', COALESCE(NEW.info->>'description', ''));
                    END IF;
                    IF COALESCE(NEW.info->>'tags','[]') <> COALESCE(OLD.info->>'tags','[]') THEN
                        NEW.tsv_tags = to_tsvector('simple', COALESCE(NEW.info->'tags', '[]'::JSONB));
                    END IF;
                END IF;
                RETURN NEW;
            END;
            $function$;
        `);
        await queryRunner.query(`
            CREATE TRIGGER update_community_tsvectors
            BEFORE INSERT OR UPDATE
            ON "public"."communities"
            FOR EACH ROW EXECUTE FUNCTION communities_tsvector_update()
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        throw new Error("This migration cannot be undone")
    }

}

// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import format from "pg-format";
import { MigrationInterface, QueryRunner } from "typeorm";

export class AddContractWallets1709302144464 implements MigrationInterface {
  name = 'AddContractWallets1709302144464'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "wallets" ADD "chain" character varying(64)`);
    await queryRunner.query(`ALTER TABLE "wallets" DROP CONSTRAINT "UQ_7e6f9c225f82ece575c20b13223"`);
    await queryRunner.query(`ALTER TYPE "public"."wallets_type_enum" RENAME TO "wallets_type_enum_old"`);
    await queryRunner.query(`CREATE TYPE "public"."wallets_type_enum" AS ENUM('cg_evm', 'evm', 'fuel', 'aeternity', 'contract_evm')`);
    await queryRunner.query(`ALTER TABLE "wallets" ALTER COLUMN "type" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "wallets" ALTER COLUMN "type" TYPE "public"."wallets_type_enum" USING "type"::"text"::"public"."wallets_type_enum"`);
    await queryRunner.query(`ALTER TABLE "wallets" ALTER COLUMN "type" SET DEFAULT 'evm'`);
    await queryRunner.query(`DROP TYPE "public"."wallets_type_enum_old"`);
    await queryRunner.query(`ALTER TABLE "wallets" ADD CONSTRAINT "UQ_275edb0f56444cba7f583a30387" UNIQUE ("type", "walletIdentifier", "chain")`);
    await queryRunner.query(`ALTER TABLE "wallets" ADD CONSTRAINT "UQ_7e6f9c225f82ece575c20b13223" UNIQUE ("type", "walletIdentifier")`);
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION notify_wallet_change() RETURNS trigger AS $$
      DECLARE
      BEGIN
        PERFORM pg_notify('walletchange',
          json_build_object(
            'type', 'walletchange',
            'id', NEW.id,
            'userId', NEW."userId",
            'chain', NEW."chain",
            'walletIdentifier', NEW."walletIdentifier",
            'walletType', NEW."type",
            'signatureData', NEW."signatureData",
            'updatedAt', NEW."updatedAt",
            'deletedAt', NEW."deletedAt",
            'action', TG_OP
          )::text
        );
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);
    const luksoAccounts: {
      walletIdentifier: Common.Address;
      userId: string;
      createdAt: string;
      updatedAt: string;
      deletedAt: string | null;
    }[] = await queryRunner.query(`
      SELECT
        LOWER(data->>'id') AS "walletIdentifier",
        "userId",
        "createdAt",
        "updatedAt",
        "deletedAt"
      FROM user_accounts
      WHERE type = 'lukso'
        AND "deletedAt" IS NULL
    `);
    const validAccounts = luksoAccounts.filter((account) => {
      if (account.walletIdentifier && account.walletIdentifier.match(/^0x[0-9a-f]{40}$/)) {
        return true;
      }
      else {
        console.error('Invalid lukso account, cannot create wallet for it', account);
        return false;
      }
    });
    if (validAccounts.length > 0) {
      await queryRunner.query(`
        INSERT INTO wallets (
          "userId",
          "type",
          "walletIdentifier",
          "createdAt",
          "updatedAt",
          "deletedAt",
          "signatureData",
          "chain"
        )
        VALUES ${validAccounts.map((account) => format(
          `(%L::uuid, 'contract_evm'::"public"."wallets_type_enum", %L, %L, %L, NULL, %L::jsonb, 'lukso')`,
          account.userId,
          account.walletIdentifier,
          account.createdAt,
          account.updatedAt,
          JSON.stringify({
            data: null,
            signature: "",
            contractData: {
              type: "universal_profile",
            },
          }),
        )).join(',')}
      `);
    }
    await queryRunner.query(`CREATE INDEX "IDX_7d6a57812d5b7afed14f776ecb" ON "wallets" ("chain") `);
    await queryRunner.query(`CREATE INDEX "idx_user_accounts_lower_id" ON "user_accounts" (LOWER(data->>'id'))`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_user_accounts_lower_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_7d6a57812d5b7afed14f776ecb"`);
    await queryRunner.query(`ALTER TABLE "wallets" DROP CONSTRAINT "UQ_275edb0f56444cba7f583a30387"`);
    await queryRunner.query(`ALTER TABLE "wallets" DROP CONSTRAINT "UQ_7e6f9c225f82ece575c20b13223"`);
    await queryRunner.query(`CREATE TYPE "public"."wallets_type_enum_old" AS ENUM('cg_evm', 'evm', 'fuel', 'aeternity')`);
    await queryRunner.query(`ALTER TABLE "wallets" ALTER COLUMN "type" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "wallets" ALTER COLUMN "type" TYPE "public"."wallets_type_enum_old" USING "type"::"text"::"public"."wallets_type_enum_old"`);
    await queryRunner.query(`ALTER TABLE "wallets" ALTER COLUMN "type" SET DEFAULT 'evm'`);
    await queryRunner.query(`DROP TYPE "public"."wallets_type_enum"`);
    await queryRunner.query(`ALTER TYPE "public"."wallets_type_enum_old" RENAME TO "wallets_type_enum"`);
    await queryRunner.query(`ALTER TABLE "wallets" ADD CONSTRAINT "UQ_7e6f9c225f82ece575c20b13223" UNIQUE ("type", "walletIdentifier")`);
    await queryRunner.query(`ALTER TABLE "wallets" DROP COLUMN "chain"`);
  }

}

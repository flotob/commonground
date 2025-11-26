// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAeternityWallet1696007829744 implements MigrationInterface {
    name = 'AddAeternityWallet1696007829744'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "wallets" DROP CONSTRAINT "UQ_7e6f9c225f82ece575c20b13223"`);
        await queryRunner.query(`ALTER TYPE "public"."wallets_type_enum" RENAME TO "wallets_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."wallets_type_enum" AS ENUM('cg_evm', 'evm', 'fuel', 'aeternity')`);
        await queryRunner.query(`ALTER TABLE "wallets" ALTER COLUMN "type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "wallets" ALTER COLUMN "type" TYPE "public"."wallets_type_enum" USING "type"::"text"::"public"."wallets_type_enum"`);
        await queryRunner.query(`ALTER TABLE "wallets" ALTER COLUMN "type" SET DEFAULT 'evm'`);
        await queryRunner.query(`DROP TYPE "public"."wallets_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "wallets" ADD CONSTRAINT "UQ_7e6f9c225f82ece575c20b13223" UNIQUE ("type", "walletIdentifier")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "wallets" DROP CONSTRAINT "UQ_7e6f9c225f82ece575c20b13223"`);
        await queryRunner.query(`CREATE TYPE "public"."wallets_type_enum_old" AS ENUM('cg_evm', 'evm', 'fuel')`);
        await queryRunner.query(`ALTER TABLE "wallets" ALTER COLUMN "type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "wallets" ALTER COLUMN "type" TYPE "public"."wallets_type_enum_old" USING "type"::"text"::"public"."wallets_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "wallets" ALTER COLUMN "type" SET DEFAULT 'evm'`);
        await queryRunner.query(`DROP TYPE "public"."wallets_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."wallets_type_enum_old" RENAME TO "wallets_type_enum"`);
        await queryRunner.query(`ALTER TABLE "wallets" ADD CONSTRAINT "UQ_7e6f9c225f82ece575c20b13223" UNIQUE ("type", "walletIdentifier")`);
    }

}

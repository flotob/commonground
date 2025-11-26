// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm"

export class addUpdateTriggersForContractsAndWallets1688473137703 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION notify_contract_change() RETURNS trigger AS $$
      DECLARE
      BEGIN
        PERFORM pg_notify('contractchange',
          json_build_object(
            'type', 'contractchange',
            'id', NEW.id,
            'address', NEW.address,
            'chain', NEW.chain,
            'data', NEW.data,
            'action', TG_OP
          )::text
        );
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);
    await queryRunner.query(`
      CREATE TRIGGER contract_update_notify
      AFTER INSERT OR UPDATE ON contracts
      FOR EACH ROW EXECUTE FUNCTION notify_contract_change()
    `);
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION notify_wallet_change() RETURNS trigger AS $$
      DECLARE
      BEGIN
        PERFORM pg_notify('walletchange',
          json_build_object(
            'type', 'walletchange',
            'id', NEW.id,
            'userId', NEW."userId",
            'walletIdentifier', NEW."walletIdentifier",
            'action', TG_OP
          )::text
        );
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);
    await queryRunner.query(`
      CREATE TRIGGER wallet_update_notify
      AFTER INSERT OR UPDATE ON wallets
      FOR EACH ROW EXECUTE FUNCTION notify_wallet_change()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TRIGGER wallet_update_notify ON wallets
    `);
    await queryRunner.query(`
      DROP TRIGGER contract_update_notify ON contracts
    `);
    await queryRunner.query(`
      DROP FUNCTION notify_wallet_change
    `);
    await queryRunner.query(`
      DROP FUNCTION notify_contract_change
    `);
  }

}

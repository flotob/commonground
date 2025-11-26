// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTokenSaleModel1732812581096 implements MigrationInterface {
    name = 'AddTokenSaleModel1732812581096'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "tokensales" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" text NOT NULL, "chain" character varying(64) NOT NULL, "address" character varying(50) NOT NULL, "contractType" character varying(50) NOT NULL, "recentUpdateBlockNumber" bigint NOT NULL DEFAULT '0', "startDate" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "endDate" TIMESTAMP(3) WITH TIME ZONE NOT NULL, "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_746c05f55fc2e5db7b456559677" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "tokensale_userdata" ("userId" uuid NOT NULL, "tokenSaleId" uuid NOT NULL, "referredByUserId" uuid, "totalInvested" numeric(80,0) NOT NULL DEFAULT '0', "totalTokensBought" numeric(80,0) NOT NULL DEFAULT '0', "referralBonus" numeric(80,0) NOT NULL DEFAULT '0', "referredUsersDirectCount" integer NOT NULL DEFAULT '0', "referredUsersIndirectCount" integer NOT NULL DEFAULT '0', "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_62d0ecfb8f84ebe9910adaead4a" PRIMARY KEY ("userId", "tokenSaleId"))`);
        await queryRunner.query(`CREATE TABLE "tokensale_investments" ("investmentId" bigint NOT NULL, "tokenSaleId" uuid NOT NULL, "userId" uuid NOT NULL, "event" jsonb NOT NULL, "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_b707dff3f4acd8f4c9711f9a9cd" PRIMARY KEY ("investmentId", "tokenSaleId"))`);
        await queryRunner.query(`ALTER TABLE "tokensale_userdata" ADD CONSTRAINT "FK_5b536a16e69de3e7a8afc6f98fd" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tokensale_userdata" ADD CONSTRAINT "FK_8564c18e99284c698bd5b30c73e" FOREIGN KEY ("tokenSaleId") REFERENCES "tokensales"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tokensale_userdata" ADD CONSTRAINT "FK_704f2cfd87c0e107616646fe8ec" FOREIGN KEY ("referredByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tokensale_investments" ADD CONSTRAINT "FK_c10f599eed262b0d219faf28664" FOREIGN KEY ("tokenSaleId") REFERENCES "tokensales"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tokensale_investments" ADD CONSTRAINT "FK_c02c76539008434166d59113a72" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tokensale_investments" ADD CONSTRAINT "FK_29451e120ad82ae09190c35f1e4" FOREIGN KEY ("tokenSaleId", "userId") REFERENCES "tokensale_userdata"("tokenSaleId","userId") ON DELETE NO ACTION ON UPDATE NO ACTION`);

        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION notify_tokensale_change() RETURNS trigger AS $$
            DECLARE
            BEGIN
                IF TG_OP = 'INSERT' THEN
                    PERFORM pg_notify('tokensalechange',
                        json_build_object(
                            'type', 'tokensalechange',
                            'id', NEW.id,
                            'chain', NEW.chain,
                            'address', NEW."address",
                            'contractType', NEW."contractType",
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
                    NEW."chain" != OLD."chain" OR
                    NEW."address" != OLD."address" OR
                    NEW."contractType" != OLD."contractType"
                ) THEN
                    PERFORM pg_notify('tokensalechange',
                        json_build_object(
                            'type', 'tokensalechange',
                            'id', NEW.id,
                            'chain', NEW.chain,
                            'address', NEW."address",
                            'contractType', NEW."contractType",
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
            CREATE TRIGGER tokensale_change_notify
            AFTER INSERT OR UPDATE ON tokensales
            FOR EACH ROW EXECUTE FUNCTION notify_tokensale_change()
        `);

        await queryRunner.query(`GRANT ALL PRIVILEGES ON "tokensales" TO writer`);
        await queryRunner.query(`GRANT SELECT ON "tokensales" TO reader`);
        await queryRunner.query(`GRANT ALL PRIVILEGES ON "tokensale_userdata" TO writer`);
        await queryRunner.query(`GRANT SELECT ON "tokensale_userdata" TO reader`);
        await queryRunner.query(`GRANT ALL PRIVILEGES ON "tokensale_investments" TO writer`);
        await queryRunner.query(`GRANT SELECT ON "tokensale_investments" TO reader`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokensale_investments" DROP CONSTRAINT "FK_29451e120ad82ae09190c35f1e4"`);
        await queryRunner.query(`ALTER TABLE "tokensale_investments" DROP CONSTRAINT "FK_c02c76539008434166d59113a72"`);
        await queryRunner.query(`ALTER TABLE "tokensale_investments" DROP CONSTRAINT "FK_c10f599eed262b0d219faf28664"`);
        await queryRunner.query(`ALTER TABLE "tokensale_userdata" DROP CONSTRAINT "FK_704f2cfd87c0e107616646fe8ec"`);
        await queryRunner.query(`ALTER TABLE "tokensale_userdata" DROP CONSTRAINT "FK_8564c18e99284c698bd5b30c73e"`);
        await queryRunner.query(`ALTER TABLE "tokensale_userdata" DROP CONSTRAINT "FK_5b536a16e69de3e7a8afc6f98fd"`);
        await queryRunner.query(`DROP TABLE "tokensale_investments"`);
        await queryRunner.query(`DROP TABLE "tokensale_userdata"`);
        await queryRunner.query(`DROP TABLE "tokensales"`);
    }
}

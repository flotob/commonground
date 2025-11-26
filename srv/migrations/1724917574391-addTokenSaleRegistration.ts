// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTokenSaleRegistration1724917574391 implements MigrationInterface {
    name = 'AddTokenSaleRegistration1724917574391'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "tokensale_registrations" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "userId" uuid, "email" character varying NOT NULL, "referredBy" uuid, "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_95d5cb8a67041efbb84a2ccfff3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "users" ADD "referredBy" uuid`);
        await queryRunner.query(`ALTER TABLE "users" ADD "extraData" jsonb NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "tokensale_registrations" ADD CONSTRAINT "FK_b224317cf790dc8487c03e48d71" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tokensale_registrations" ADD CONSTRAINT "FK_86a6db667c9b026d452912bda7e" FOREIGN KEY ("referredBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

        await queryRunner.query(`CREATE UNIQUE INDEX "idx_tokensale_email_lower_unique" ON tokensale_registrations( LOWER(email) )`);

        await queryRunner.query(`GRANT ALL PRIVILEGES ON "tokensale_registrations" TO writer`);
        await queryRunner.query(`GRANT SELECT ON "tokensale_registrations" TO reader`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tokensale_registrations" DROP CONSTRAINT "FK_86a6db667c9b026d452912bda7e"`);
        await queryRunner.query(`ALTER TABLE "tokensale_registrations" DROP CONSTRAINT "FK_b224317cf790dc8487c03e48d71"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "extraData"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "referredBy"`);
        await queryRunner.query(`DROP TABLE "tokensale_registrations"`);
    }

}

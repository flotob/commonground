// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";
import { grantTablePermissions } from "./migrationUtils";

export class AddPasskeysEntity1717010560546 implements MigrationInterface {
    name = 'AddPasskeysEntity1717010560546'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "passkeys" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "userId" uuid, "data" jsonb NOT NULL, "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "counter" bigint NOT NULL DEFAULT 0, "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP(3) WITH TIME ZONE, CONSTRAINT "PK_f78c7964dfa3e33810747ce0797" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "passkeys" ADD CONSTRAINT "FK_6629ffb39461ac3fcc050166695" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_passkeys_data_credentialID_webAuthnUserID" ON "passkeys" ((data->>'credentialID'), (data->>'webAuthnUserID'))`);

        await grantTablePermissions(queryRunner, 'passkeys');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "passkeys" DROP CONSTRAINT "FK_6629ffb39461ac3fcc050166695"`);
        await queryRunner.query(`DROP INDEX "IDX_passkeys_data_credentialID_webAuthnUserID"`);
        await queryRunner.query(`DROP TABLE "passkeys"`);
    }

}

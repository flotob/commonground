// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";
import { grantTablePermissions } from "../util/migrationUtils";

export class AddAssistantDialog1738856821267 implements MigrationInterface {
    name = 'AddAssistantDialog1738856821267'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "assistant_dialogs" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "request" jsonb NOT NULL, "userId" uuid NOT NULL, "communityId" uuid, "title" character varying(255), "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_e51a2b174abf1d88746f414a6b3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_2842388c3bdd5dec94a7e61fd0" ON "assistant_dialogs" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_d12afab5acd2a0a4c87ee1dd72" ON "assistant_dialogs" ("communityId") `);
        await queryRunner.query(`ALTER TABLE "assistant_dialogs" ADD CONSTRAINT "FK_2842388c3bdd5dec94a7e61fd09" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assistant_dialogs" ADD CONSTRAINT "FK_d12afab5acd2a0a4c87ee1dd721" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

        await grantTablePermissions(queryRunner, 'assistant_dialogs');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assistant_dialogs" DROP CONSTRAINT "FK_d12afab5acd2a0a4c87ee1dd721"`);
        await queryRunner.query(`ALTER TABLE "assistant_dialogs" DROP CONSTRAINT "FK_2842388c3bdd5dec94a7e61fd09"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d12afab5acd2a0a4c87ee1dd72"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2842388c3bdd5dec94a7e61fd0"`);
        await queryRunner.query(`DROP TABLE "assistant_dialogs"`);
    }

}

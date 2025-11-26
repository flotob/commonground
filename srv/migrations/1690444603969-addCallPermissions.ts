// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class addCallPermissions1690444603969 implements MigrationInterface {
    name = 'addCallPermissions1690444603969'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."callpermissions_permissions_enum" AS ENUM('CALL_EXISTS', 'CALL_JOIN', 'CALL_MODERATE', 'CHANNEL_READ', 'CHANNEL_WRITE', 'AUDIO_SEND', 'VIDEO_SEND', 'SHARE_SCREEN', 'PIN_FOR_EVERYONE', 'END_CALL_FOR_EVERYONE')`);
        await queryRunner.query(`CREATE TABLE "callpermissions" ("callId" uuid NOT NULL, "roleId" uuid NOT NULL, "permissions" "public"."callpermissions_permissions_enum" array NOT NULL, CONSTRAINT "PK_8a6081ea80c7abe2facfef84f25" PRIMARY KEY ("callId", "roleId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0216955211d539078762325a9f" ON "callpermissions" ("callId") `);
        await queryRunner.query(`CREATE INDEX "IDX_de44d227dabf1973a6af85a9ec" ON "callpermissions" ("roleId") `);
        await queryRunner.query(`ALTER TABLE "callpermissions" ADD CONSTRAINT "FK_0216955211d539078762325a9f5" FOREIGN KEY ("callId") REFERENCES "calls"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "callpermissions" ADD CONSTRAINT "FK_de44d227dabf1973a6af85a9ecd" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

        await queryRunner.query(`GRANT ALL PRIVILEGES ON "callpermissions" TO writer`);
        await queryRunner.query(`GRANT SELECT ON "callpermissions" TO reader`);
        await queryRunner.query(`GRANT SELECT ON "callpermissions" TO mediasoup`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "callpermissions" DROP CONSTRAINT "FK_de44d227dabf1973a6af85a9ecd"`);
        await queryRunner.query(`ALTER TABLE "callpermissions" DROP CONSTRAINT "FK_0216955211d539078762325a9f5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_de44d227dabf1973a6af85a9ec"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0216955211d539078762325a9f"`);
        await queryRunner.query(`DROP TABLE "callpermissions"`);
        await queryRunner.query(`DROP TYPE "public"."callpermissions_permissions_enum"`);
    }

}

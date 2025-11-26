// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class FixConstraintName1717605059426 implements MigrationInterface {
    name = 'FixConstraintName1717605059426'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "passkeys" DROP CONSTRAINT "FK_6629ffb39461ac3fcc050166695"`);
        await queryRunner.query(`ALTER TABLE "passkeys" ADD CONSTRAINT "FK_968841087720e5f58e120ea8262" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "passkeys" DROP CONSTRAINT "FK_968841087720e5f58e120ea8262"`);
        await queryRunner.query(`ALTER TABLE "passkeys" ADD CONSTRAINT "FK_6629ffb39461ac3fcc050166695" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}

// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm"

export class fixMediasoupRole1689184137878 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const permissionExistsResult = await queryRunner.query(`
            SELECT has_table_privilege('mediasoup', 'callmembers', 'SELECT') AS "permissionExists";
        `);
        if (!permissionExistsResult[0].permissionExists) {
            await queryRunner.query(`
                GRANT SELECT ON callmembers TO mediasoup
            `);
            await queryRunner.query(`
                GRANT SELECT ON calls TO mediasoup
            `);
            await queryRunner.query(`
                GRANT SELECT ON callservers TO mediasoup
            `);
        }

        await queryRunner.query(`ALTER TABLE "callservers" ADD CONSTRAINT "UQ_0256d64f28bff3d93aabe775056" UNIQUE ("url")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "callservers" DROP CONSTRAINT "UQ_0256d64f28bff3d93aabe775056"`);
        throw new Error("Cannot be undone");
    }

}

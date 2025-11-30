// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm"

export class fixMediasoupRole1689184137878 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if mediasoup role exists (it won't on managed databases like Railway)
        const mediasoupRoleExists = await queryRunner.query(`SELECT 1 FROM pg_roles WHERE rolname='mediasoup';`);
        
        if (mediasoupRoleExists.length > 0) {
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
        } else {
            console.log('Skipping mediasoup grants - role does not exist (managed database)');
        }

        // This constraint might already exist - wrap in try/catch
        try {
            await queryRunner.query(`ALTER TABLE "callservers" ADD CONSTRAINT "UQ_0256d64f28bff3d93aabe775056" UNIQUE ("url")`);
        } catch (err) {
            console.log('Constraint UQ_0256d64f28bff3d93aabe775056 already exists, skipping...');
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "callservers" DROP CONSTRAINT "UQ_0256d64f28bff3d93aabe775056"`);
        throw new Error("Cannot be undone");
    }

}

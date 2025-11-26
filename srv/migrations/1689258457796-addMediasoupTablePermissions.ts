// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm"

export class addMediasoupTablePermissions1689258457796 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const permissionExistsResult = await queryRunner.query(`
            SELECT has_table_privilege('mediasoup', 'devices', 'SELECT') AS "permissionExists";
        `);
        if (!permissionExistsResult[0].permissionExists) {
            await queryRunner.query(`
                GRANT SELECT ON devices TO mediasoup
            `);
            await queryRunner.query(`
                GRANT SELECT ON roles TO mediasoup
            `);
            await queryRunner.query(`
                GRANT SELECT ON roles_users_users TO mediasoup
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        throw new Error("Cannot be undone");
    }

}

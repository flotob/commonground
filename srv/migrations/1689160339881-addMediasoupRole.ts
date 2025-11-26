// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm"
import { dockerSecret } from "../util"
import format from "pg-format";

const MEDIASOUP_PASSWORD = dockerSecret('pg_mediasoup_password') || process.env.PG_MEDIASOUP_PASSWORD;

export class addMediasoupRole1689160339881 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (!MEDIASOUP_PASSWORD) {
            throw new Error("Mediasoup password is not set");
        }
        // check if role exists
        const roleExistsResult = await queryRunner.query(`
            SELECT 1 FROM pg_roles WHERE rolname='mediasoup';
        `);
        if (roleExistsResult.length === 0) {
            await queryRunner.query(`
                CREATE ROLE mediasoup LOGIN PASSWORD ${format("%L", MEDIASOUP_PASSWORD)}
            `);
        }
        const permissionExistsResult = await queryRunner.query(`
            SELECT has_table_privilege('mediasoup', 'callmembers', 'INSERT') AS "permissionExists";
        `);
        if (!permissionExistsResult[0].permissionExists) {
            await queryRunner.query(`
                GRANT INSERT, UPDATE ON callmembers TO mediasoup
            `);
            await queryRunner.query(`
                GRANT INSERT, UPDATE ON calls TO mediasoup
            `);
            await queryRunner.query(`
                GRANT INSERT, UPDATE ON callservers TO mediasoup
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // If the role should be deleted, it's necessary to
        // use REASSIGN OWNED or DROP OWNED to handle existing
        // db objects created by this role
        throw new Error("Cannot be undone");
    }

}

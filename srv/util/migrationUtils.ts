// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { QueryRunner } from "typeorm";

// Cache for role existence checks (persists within a migration run)
let writerRoleExists: boolean | null = null;
let readerRoleExists: boolean | null = null;

/**
 * Safely grant privileges to writer role.
 * Skips if the role doesn't exist (e.g., on managed databases like Railway).
 */
export async function grantToWriter(queryRunner: QueryRunner, tableName: string, privileges: string = 'ALL PRIVILEGES'): Promise<void> {
    if (writerRoleExists === null) {
        const result = await queryRunner.query(`SELECT 1 FROM pg_roles WHERE rolname = 'writer'`);
        writerRoleExists = result && result.length > 0;
        if (!writerRoleExists) {
            console.log('Note: "writer" role does not exist (managed database) - skipping GRANT statements');
        }
    }
    
    if (writerRoleExists) {
        await queryRunner.query(`GRANT ${privileges} ON "${tableName}" TO writer`);
    }
}

/**
 * Safely grant privileges to reader role.
 * Skips if the role doesn't exist (e.g., on managed databases like Railway).
 */
export async function grantToReader(queryRunner: QueryRunner, tableName: string, privileges: string = 'SELECT'): Promise<void> {
    if (readerRoleExists === null) {
        const result = await queryRunner.query(`SELECT 1 FROM pg_roles WHERE rolname = 'reader'`);
        readerRoleExists = result && result.length > 0;
        if (!readerRoleExists) {
            console.log('Note: "reader" role does not exist (managed database) - skipping GRANT statements');
        }
    }
    
    if (readerRoleExists) {
        await queryRunner.query(`GRANT ${privileges} ON "${tableName}" TO reader`);
    }
}

/**
 * Grant standard permissions (ALL to writer, SELECT to reader).
 * Safe to use on managed databases.
 */
export async function grantTablePermissions(queryRunner: QueryRunner, tableName: string): Promise<void> {
    await grantToWriter(queryRunner, tableName, 'ALL PRIVILEGES');
    await grantToReader(queryRunner, tableName, 'SELECT');
}

/**
 * Reset the role existence cache (for testing).
 */
export function resetRoleCache(): void {
    writerRoleExists = null;
    readerRoleExists = null;
}


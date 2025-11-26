// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm"

export class addDeletedAtToCallServerEvent1689553372817 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION notify_callserver_change() RETURNS trigger AS $$
            DECLARE
            BEGIN
                PERFORM pg_notify('callserverchange',
                json_build_object(
                    'type', 'callserverchange',
                    'id', NEW.id,
                    'status', NEW."status",
                    'url', NEW."url",
                    'updatedAt', NEW."updatedAt",
                    'deletedAt', NEW."deletedAt",
                    'action', TG_OP
                )::text
                );
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}

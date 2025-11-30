// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";
import { grantTablePermissions } from "./migrationUtils";

export class AssistantAvailability1743775203719 implements MigrationInterface {
    name = 'AssistantAvailability1743775203719'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "assistant_availability" ("modelName" character varying(255) NOT NULL, "title" character varying(255) NOT NULL, "isAvailable" boolean NOT NULL DEFAULT false, "domain" character varying(255) NOT NULL, "order" integer NOT NULL DEFAULT '0', "extraData" jsonb, CONSTRAINT "PK_3f2808c2ff179095137103203d2" PRIMARY KEY ("modelName"))`);

        await grantTablePermissions(queryRunner, 'assistant_availability');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "assistant_availability"`);
    }

}

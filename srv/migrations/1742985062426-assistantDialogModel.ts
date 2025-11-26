// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class AssistantDialogModel1742985062426 implements MigrationInterface {
    name = 'AssistantDialogModel1742985062426'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assistant_dialogs" ADD "model" character varying(255) NOT NULL DEFAULT 'qwen2_5-32b-instruct'`);
        await queryRunner.query(`ALTER TABLE "assistant_dialogs" ALTER COLUMN "model" DROP DEFAULT`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assistant_dialogs" DROP COLUMN "model"`);
    }

}

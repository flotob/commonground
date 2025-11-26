// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm"

export class EmptyQuestionnaireCleanup1725982611385 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            update communities
            set "onboardingOptions" = "onboardingOptions" - 'questionnaire'
            where
                ("onboardingOptions"->'questionnaire'->'enabled')::boolean = true and
                jsonb_array_length("onboardingOptions"->'questionnaire'->'questions') = 0`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}

// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm"

export class ReworkKycLevels1731675349991 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE users 
            SET "extraData" = (
                -- First remove all old KYC fields using the - operator
                "extraData" - 'kycBasicSuccess' - 'kycAdvancedSuccess' - 'kycAmericanSuccess' - 'kycFullSuccess'
            ) || 
            CASE
                -- When any full KYC is true, set both full and liveness to true
                WHEN ("extraData"->>'kycFullSuccess')::boolean = true 
                    OR ("extraData"->>'kycAdvancedSuccess')::boolean = true 
                    OR ("extraData"->>'kycAmericanSuccess')::boolean = true 
                THEN jsonb_build_object(
                    'kycFullSuccess', true,
                    'kycLivenessSuccess', true
                )
                -- When only basic KYC is true, set only liveness
                WHEN ("extraData"->>'kycBasicSuccess')::boolean = true 
                THEN jsonb_build_object(
                    'kycLivenessSuccess', true
                )
                -- For all other cases, just add empty object (which will add nothing)
                ELSE '{}'::jsonb
            END
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}

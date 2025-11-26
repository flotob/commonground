// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm"

export class fixArticleTrigger1673893185972 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TRIGGER trigger_set_last_update_on_articles ON articles`);
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION public.set_updatedat_on_update()
                RETURNS trigger
                LANGUAGE plpgsql
            AS $function$
                BEGIN
                    NEW."updatedAt" = NOW();
                    RETURN NEW;
                END;
            $function$;
        `);
        await queryRunner.query(`
            CREATE TRIGGER trigger_set_last_update_on_articles
            BEFORE UPDATE ON public.articles
            FOR EACH ROW EXECUTE FUNCTION set_updatedat_on_update()
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}

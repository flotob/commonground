// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import format from "pg-format";
import { MigrationInterface, QueryRunner } from "typeorm";
import config from "../common/config";
import { randomString } from "../util";

export class minorFixes1691015627059 implements MigrationInterface {
    name = 'minorFixes1691015627059'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const communitiesWithoutUrl: { id: string }[] = await queryRunner.query(`
            SELECT id
            FROM communities
            WHERE url IS NULL
        `);
        for (const data of communitiesWithoutUrl) {
            await queryRunner.query(`
                UPDATE communities
                SET url = ${format("%L", randomString(10))}
                WHERE id = ${format("%L::uuid", data.id)}
            `);
        }

        if (config.DEPLOYMENT !== "prod") {
            // only "required" for dev and staging
            const communitiesWithFailedCreation: { id: string, creatorId: string }[] = await queryRunner.query(`
                SELECT id, "creatorId" FROM communities
                WHERE links::text = '{}'
            `);
            console.log("BROKEN COMMUNITIES:", communitiesWithFailedCreation)
            await queryRunner.query(`
                UPDATE communities
                SET links = '[]'::jsonb
                WHERE id = ANY(ARRAY[${format("%L", communitiesWithFailedCreation.map(data => data.id))}]::uuid[])
            `);
            const usersToUpdate: {
                [userId: string]: string[];
            } = {};
            for (const data of communitiesWithFailedCreation) {
                if (usersToUpdate[data.creatorId] === undefined) {
                    usersToUpdate[data.creatorId] = [data.id];
                }
                else {
                    usersToUpdate[data.creatorId].push(data.id);
                }
            };
            for (const userId of Object.keys(usersToUpdate)) {
                const communityIds = usersToUpdate[userId];
                await queryRunner.query(`
                    UPDATE users u
                    SET "communityOrder" = ARRAY(
                        SELECT DISTINCT e
                        FROM unnest(array_cat(u."communityOrder", ARRAY[${format("%L", communityIds)}]::UUID[]))
                        AS a(e)
                    )
                    WHERE u.id = $1
                `, [userId]);
            }
        }

        await queryRunner.query(`ALTER TABLE "communities" ALTER COLUMN "url" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "UQ_6df0905b0802e8402e6570c6505" UNIQUE ("channelId", "createdAt")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "UQ_6df0905b0802e8402e6570c6505"`);
        await queryRunner.query(`ALTER TABLE "communities" ALTER COLUMN "url" DROP NOT NULL`);
    }

}

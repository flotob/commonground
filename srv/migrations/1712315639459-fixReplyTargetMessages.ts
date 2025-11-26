// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm"

export class FixReplyTargetMessages1712315639459 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            WITH matching_rows AS (
                SELECT
                    n.id AS "notificationId",
                    (
                        SELECT id
                        FROM messages
                        WHERE "parentMessageId" = m.id
                            AND "creatorId" = n."subjectUserId"
                            AND ABS(EXTRACT(EPOCH FROM ("createdAt" - n."createdAt"))) < 2
                        ORDER BY ABS(EXTRACT(EPOCH FROM ("createdAt" - n."createdAt"))) ASC
                        LIMIT 1
                    ) AS "newTargetMessageId"
                FROM notifications n
                INNER JOIN messages m
                    ON n."subjectItemId" = m.id
                WHERE n.type = 'Reply'
                    AND ABS(EXTRACT(EPOCH FROM (n."createdAt" - m."createdAt"))) > 1
            )
            UPDATE notifications n
            SET "subjectItemId" = mr."newTargetMessageId", "updatedAt" = now()
            FROM matching_rows mr
            WHERE n.id = mr."notificationId"
                AND mr."newTargetMessageId" IS NOT NULL       
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}

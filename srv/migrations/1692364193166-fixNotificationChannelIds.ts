// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm"

export class fixNotificationChannelIds1692364193166 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE notifications n
      SET "extraData" =
        CASE
          WHEN n."type" = 'Mention' OR n."type" = 'Reply'
          THEN jsonb_build_object(
            'channelId', (
              SELECT m."channelId"
              FROM messages m
              WHERE m.id = n."subjectItemId"
            )
          )
          ELSE null
        END
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
  }

}

// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class replies1648559991866 implements MigrationInterface {
    name = 'replies1648559991866'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "messages" ADD "parent_message_id" uuid`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "parent_post_id" uuid`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_72ffa22d68b72a09d5700e4463f" FOREIGN KEY ("parent_message_id") REFERENCES "messages"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_979fb4c9d38af5cb74829ab9a4f" FOREIGN KEY ("parent_post_id") REFERENCES "posts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }
}

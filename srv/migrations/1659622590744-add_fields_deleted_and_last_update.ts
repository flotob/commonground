// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class addFieldsDeletedAndLastUpdate1659622590744 implements MigrationInterface {
    name = 'addFieldsDeletedAndLastUpdate1659622590744'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "accounts" ADD "last_update" TIMESTAMP(3) WITH TIME ZONE DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "accounts" ADD "deleted" boolean DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "groups" ADD "last_update" TIMESTAMP(3) WITH TIME ZONE DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "groups" ADD "deleted" boolean DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "articles" ADD "last_update" TIMESTAMP(3) WITH TIME ZONE DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "articles" ADD "deleted" boolean DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "areas" RENAME COLUMN "access_changed" TO "last_update"`);
        await queryRunner.query(`ALTER TABLE "areas" ALTER COLUMN "last_update" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "areas" ADD "deleted" boolean DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "channels" ADD "last_update" TIMESTAMP(3) WITH TIME ZONE DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "channels" ADD "deleted" boolean DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "areaaccess" RENAME COLUMN "updated" TO "last_update"`);
        await queryRunner.query(`ALTER TABLE "areaaccess" ADD "deleted" boolean DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "followers" ADD "last_update" TIMESTAMP(3) WITH TIME ZONE DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "followers" ADD "deleted" boolean DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD "last_update" TIMESTAMP(3) WITH TIME ZONE DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD "deleted" boolean DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "groupaccess" ADD "last_update" TIMESTAMP(3) WITH TIME ZONE DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "groupaccess" ADD "deleted" boolean DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "groupblocks" ADD "last_update" TIMESTAMP(3) WITH TIME ZONE DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "groupblocks" ADD "deleted" boolean DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "last_update" TIMESTAMP(3) WITH TIME ZONE DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "deleted" boolean DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "last_update" TIMESTAMP(3) WITH TIME ZONE DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "posts" ADD "deleted" boolean DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "reactions" ADD "last_update" TIMESTAMP(3) WITH TIME ZONE DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "reactions" ADD "deleted" boolean DEFAULT false`);

        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION set_timestamp_on_update()
                RETURNS TRIGGER
                LANGUAGE 'plpgsql'
            AS $function$
            BEGIN
                NEW.last_update = NOW();
                RETURN NEW;
            END;
            $function$;
        `);

        await queryRunner.query(`CREATE TRIGGER trigger_set_last_update_on_accounts BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION set_timestamp_on_update()`);
        await queryRunner.query(`CREATE TRIGGER trigger_set_last_update_on_groups BEFORE UPDATE ON groups FOR EACH ROW EXECUTE FUNCTION set_timestamp_on_update()`);
        await queryRunner.query(`CREATE TRIGGER trigger_set_last_update_on_articles BEFORE UPDATE ON articles FOR EACH ROW EXECUTE FUNCTION set_timestamp_on_update()`);
        await queryRunner.query(`CREATE TRIGGER trigger_set_last_update_on_areas BEFORE UPDATE ON areas FOR EACH ROW EXECUTE FUNCTION set_timestamp_on_update()`);
        await queryRunner.query(`CREATE TRIGGER trigger_set_last_update_on_channels BEFORE UPDATE ON channels FOR EACH ROW EXECUTE FUNCTION set_timestamp_on_update()`);
        await queryRunner.query(`CREATE TRIGGER trigger_set_last_update_on_areaaccess BEFORE UPDATE ON areaaccess FOR EACH ROW EXECUTE FUNCTION set_timestamp_on_update()`);
        await queryRunner.query(`CREATE TRIGGER trigger_set_last_update_on_followers BEFORE UPDATE ON followers FOR EACH ROW EXECUTE FUNCTION set_timestamp_on_update()`);
        await queryRunner.query(`CREATE TRIGGER trigger_set_last_update_on_conversations BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION set_timestamp_on_update()`);
        await queryRunner.query(`CREATE TRIGGER trigger_set_last_update_on_groupaccess BEFORE UPDATE ON groupaccess FOR EACH ROW EXECUTE FUNCTION set_timestamp_on_update()`);
        await queryRunner.query(`CREATE TRIGGER trigger_set_last_update_on_groupblocks BEFORE UPDATE ON groupblocks FOR EACH ROW EXECUTE FUNCTION set_timestamp_on_update()`);
        await queryRunner.query(`CREATE TRIGGER trigger_set_last_update_on_messages BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION set_timestamp_on_update()`);
        await queryRunner.query(`CREATE TRIGGER trigger_set_last_update_on_posts BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION set_timestamp_on_update()`);
        await queryRunner.query(`CREATE TRIGGER trigger_set_last_update_on_reactions BEFORE UPDATE ON reactions FOR EACH ROW EXECUTE FUNCTION set_timestamp_on_update()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TRIGGER trigger_set_last_update_on_accounts ON "public"."accounts"`);
        await queryRunner.query(`DROP TRIGGER trigger_set_last_update_on_groups ON "public"."groups"`);
        await queryRunner.query(`DROP TRIGGER trigger_set_last_update_on_articles ON "public"."articles"`);
        await queryRunner.query(`DROP TRIGGER trigger_set_last_update_on_areas ON "public"."areas"`);
        await queryRunner.query(`DROP TRIGGER trigger_set_last_update_on_channels ON "public"."channels"`);
        await queryRunner.query(`DROP TRIGGER trigger_set_last_update_on_areaaccess ON "public"."areaaccess"`);
        await queryRunner.query(`DROP TRIGGER trigger_set_last_update_on_followers ON "public"."followers"`);
        await queryRunner.query(`DROP TRIGGER trigger_set_last_update_on_conversations ON "public"."conversations"`);
        await queryRunner.query(`DROP TRIGGER trigger_set_last_update_on_groupaccess ON "public"."groupaccess"`);
        await queryRunner.query(`DROP TRIGGER trigger_set_last_update_on_groupblocks ON "public"."groupblocks"`);
        await queryRunner.query(`DROP TRIGGER trigger_set_last_update_on_messages ON "public"."messages"`);
        await queryRunner.query(`DROP TRIGGER trigger_set_last_update_on_posts ON "public"."posts"`);
        await queryRunner.query(`DROP TRIGGER trigger_set_last_update_on_reactions ON "public"."reactions"`);

        await queryRunner.query(`DROP FUNCTION "public"."set_timestamp_on_update()"`);

        await queryRunner.query(`ALTER TABLE "reactions" DROP COLUMN "deleted"`);
        await queryRunner.query(`ALTER TABLE "reactions" DROP COLUMN "last_update"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "deleted"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "last_update"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "deleted"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "last_update"`);
        await queryRunner.query(`ALTER TABLE "groupblocks" DROP COLUMN "deleted"`);
        await queryRunner.query(`ALTER TABLE "groupblocks" DROP COLUMN "last_update"`);
        await queryRunner.query(`ALTER TABLE "groupaccess" DROP COLUMN "deleted"`);
        await queryRunner.query(`ALTER TABLE "groupaccess" DROP COLUMN "last_update"`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN "deleted"`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN "last_update"`);
        await queryRunner.query(`ALTER TABLE "followers" DROP COLUMN "deleted"`);
        await queryRunner.query(`ALTER TABLE "followers" DROP COLUMN "last_update"`);
        await queryRunner.query(`ALTER TABLE "areaaccess" DROP COLUMN "deleted"`);
        await queryRunner.query(`ALTER TABLE "channels" DROP COLUMN "deleted"`);
        await queryRunner.query(`ALTER TABLE "channels" DROP COLUMN "last_update"`);
        await queryRunner.query(`ALTER TABLE "areas" DROP COLUMN "deleted"`);
        await queryRunner.query(`ALTER TABLE "areas" DROP COLUMN "last_update"`);
        await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN "deleted"`);
        await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN "last_update"`);
        await queryRunner.query(`ALTER TABLE "groups" DROP COLUMN "deleted"`);
        await queryRunner.query(`ALTER TABLE "groups" DROP COLUMN "last_update"`);
        await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "deleted"`);
        await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "last_update"`);
        await queryRunner.query(`ALTER TABLE "areaaccess" RENAME COLUMN "last_update" TO "updated"`);
        await queryRunner.query(`ALTER TABLE "areas" RENAME COLUMN "last_update" TO "access_changed"`);
        await queryRunner.query(`ALTER TABLE "areas" ALTER COLUMN "access_changed" SET DEFAULT NULL`);
    }

}

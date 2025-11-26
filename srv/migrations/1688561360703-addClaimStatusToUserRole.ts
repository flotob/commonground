// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm";

export class addClaimStatusToUserRole1688561360703 implements MigrationInterface {
    name = 'addClaimStatusToUserRole1688561360703'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "roles_users_users" DROP CONSTRAINT "FK_391282056f6da8665b38480a131"`);
        await queryRunner.query(`ALTER TABLE "roles_users_users" DROP CONSTRAINT "FK_6baa1fce24dde516186c4f0269a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6baa1fce24dde516186c4f0269"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_391282056f6da8665b38480a13"`);
        await queryRunner.query(`ALTER TABLE "roles_users_users" DROP CONSTRAINT "PK_d9b9cca39b8cc7e99072274dafa"`);
        await queryRunner.query(`ALTER TABLE "roles_users_users" RENAME COLUMN "usersId" TO "userId"`);
        await queryRunner.query(`ALTER TABLE "roles_users_users" RENAME COLUMN "rolesId" TO "roleId"`);
        await queryRunner.query(`ALTER TABLE "roles_users_users" ADD CONSTRAINT "PK_8ad3a4f60b4ec859a7d14da0536" PRIMARY KEY ("userId", "roleId")`);
        await queryRunner.query(`ALTER TABLE "roles_users_users" ADD "claimed" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "roles_users_users" ADD CONSTRAINT "FK_9e03966e9c69de11373506c8f95" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "roles_users_users" ADD CONSTRAINT "FK_b7bf1b062e2f679df676379f175" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`CREATE INDEX "IDX_09bb2dcbd762ca7d0026077e53" ON "roles_users_users" ("claimed")`);
        await queryRunner.query(`UPDATE roles_users_users SET claimed = TRUE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_09bb2dcbd762ca7d0026077e53"`);
        await queryRunner.query(`ALTER TABLE "roles_users_users" DROP CONSTRAINT "FK_b7bf1b062e2f679df676379f175"`);
        await queryRunner.query(`ALTER TABLE "roles_users_users" DROP CONSTRAINT "FK_9e03966e9c69de11373506c8f95"`);
        await queryRunner.query(`ALTER TABLE "roles_users_users" DROP COLUMN "claimed"`);
        await queryRunner.query(`ALTER TABLE "roles_users_users" DROP CONSTRAINT "PK_8ad3a4f60b4ec859a7d14da0536"`);
        await queryRunner.query(`ALTER TABLE "roles_users_users" RENAME COLUMN "userId" TO "usersId"`);
        await queryRunner.query(`ALTER TABLE "roles_users_users" RENAME COLUMN "roleId" TO "rolesId"`);
        await queryRunner.query(`ALTER TABLE "roles_users_users" ADD CONSTRAINT "PK_d9b9cca39b8cc7e99072274dafa" PRIMARY KEY ("rolesId", "usersId")`);
        await queryRunner.query(`CREATE INDEX "IDX_391282056f6da8665b38480a13" ON "roles_users_users" ("usersId") `);
        await queryRunner.query(`CREATE INDEX "IDX_6baa1fce24dde516186c4f0269" ON "roles_users_users" ("rolesId") `);
        await queryRunner.query(`ALTER TABLE "roles_users_users" ADD CONSTRAINT "FK_6baa1fce24dde516186c4f0269a" FOREIGN KEY ("rolesId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "roles_users_users" ADD CONSTRAINT "FK_391282056f6da8665b38480a131" FOREIGN KEY ("usersId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}

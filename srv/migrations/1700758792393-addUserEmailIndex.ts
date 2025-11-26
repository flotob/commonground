// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { MigrationInterface, QueryRunner } from "typeorm"

export class AddUserEmailIndex1700758792393 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        //get all users with duplacted emails
        const users = await queryRunner.query(`
            SELECT u.id, u.email, u."createdAt",
            ((SELECT "updatedAt" from devices where "userId" = u.id order by "updatedAt" desc limit 1)) as "lastLogin"
            FROM users u
            JOIN (
            SELECT LOWER(email) as lf, COUNT(*)
            FROM users
            GROUP BY lf
            HAVING COUNT(*) > 1
            ) b ON LOWER(u.email) = b.lf`
        );
        const tempObject: any = {};
        const usersToSetEmailToNull: string[] = [];
        for (const user of users) {
            if (tempObject[user.email.toLowerCase()] === undefined){
                tempObject[user.email.toLowerCase()] = [];
            }
            tempObject[user.email.toLowerCase()].push(user);
        }
        for(const email in tempObject) {
            tempObject[email].sort((a: any, b: any) => {
                if (a.lastLogin === null && b.lastLogin === null) {
                    if(a.createdAt > b.createdAt) {
                        return -1;
                    } else return 1;
                } else if (a.lastLogin === null) {
                    return 1;
                } else if (b.lastLogin === null) {
                    return -1;
                }
                return a.lastLogin > b.lastLogin ? -1 : 1;
            });
            for (let i=1; i<tempObject[email].length; i++) {
                usersToSetEmailToNull.push(tempObject[email][i].id);                
            }
        }
        if (usersToSetEmailToNull.length > 0) {
            await queryRunner.query(`UPDATE users SET email = NULL WHERE id IN ('${usersToSetEmailToNull.join("','")}')`);
        }
        await queryRunner.query(`CREATE UNIQUE INDEX idx_users_email ON users(LOWER("email"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_users_email"`);
    }

}

// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { isMainThread } from 'worker_threads';
import pool from '../util/postgres';
import format from 'pg-format';
import { configurableReciprokePriceFn, Decimal } from '../common/tokensale/helper';
import { PoolClient } from 'pg';

if (isMainThread) {
    throw new Error("HandleCommunityAirdrops can only be run as a worker job");
}

async function handleFinishedRoleAirdrops() {
    let client: PoolClient | undefined;
    try {
        client = await pool.connect();
        await client.query('BEGIN');
        const roleAirdrops = await client.query<{
            id: string;
            communityId: string;
            airdropConfig: Models.Community.RoleAirdropConfig;
        }>(`
            SELECT id, "communityId", "airdropConfig"
            FROM roles
            WHERE "airdropConfig"->>'endDate' IS NOT NULL
            AND ("airdropConfig"->>'endDate')::timestamp < now()
            AND ("airdropConfig"->>'airdropExecuted' IS NULL OR "airdropConfig"->>'airdropExecuted' <> 'true')
        `);
        console.log(`HandleCommunityAirdrops: Found ${roleAirdrops.rows.length} roles with unfinished airdrops`);
        for (const roleAirdrop of roleAirdrops.rows) {
            const { id: roleId, airdropConfig, communityId } = roleAirdrop;
            const eligibleMembers = await client.query<{
                userId: string;
                updatedAt: string;
            }>(`
                SELECT "userId", "updatedAt"
                FROM roles_users_users
                WHERE "roleId" = $1 AND "claimed" = true
                ORDER BY "updatedAt" ASC
                LIMIT $2
            `, [roleId, airdropConfig.maximumUsers]);
            const params = airdropConfig.functionParameters;
            const config = {
                a: new Decimal(params.a),
                b: new Decimal(params.b),
                c: new Decimal(params.c),
                k: new Decimal(params.k),
            };
            let bonusFactor = new Decimal(1);
            for (const milestone of airdropConfig.milestones) {
                if (milestone.users <= eligibleMembers.rows.length && milestone.bonusPercent !== undefined) {
                    bonusFactor = new Decimal(100 + milestone.bonusPercent).div(new Decimal(100));
                }
            }
            const values: string[] = [];
            for (const [i, { userId, updatedAt }] of eligibleMembers.rows.entries()) {
                const amount = configurableReciprokePriceFn(new Decimal(i), config).mul(bonusFactor);
                const airdropData: Models.Community.UserAirdropData = {
                    amount: amount.toFixed(2),
                    totalUsers: eligibleMembers.rows.length,
                    position: i + 1,
                    airdropInfo: airdropConfig.airdropInfo,
                    claimedAt: updatedAt,
                };
                values.push(format(
                    `(%L::uuid, %L::uuid, %L::uuid, %L::jsonb, %L::timestamptz)`,
                    communityId,
                    roleId,
                    userId,
                    JSON.stringify(airdropData),
                    airdropConfig.endDate,
                ));
            }
            if (values.length > 0) {
                await client.query(format(`
                    INSERT INTO "user_community_airdrops" ("communityId", "roleId", "userId", "airdropData", "airdropEndDate")
                    VALUES ${values.join(',')}
                `));
                console.log(`HandleCommunityAirdrops: Inserted ${values.length} airdrops for role ${roleId}`);
            }
            await client.query(`
                UPDATE roles
                SET "airdropConfig" = jsonb_set("airdropConfig", '{airdropExecuted}', 'true'::jsonb), "updatedAt" = now()
                WHERE id = $1
            `, [roleId]);
        }
        await client.query('COMMIT');
    } catch (error) {
        console.error(`HandleCommunityAirdrops: Error`, error);
        await client?.query('ROLLBACK');
    }
    finally {
        client?.release();
    }
    setTimeout(handleFinishedRoleAirdrops, 30_000);
}

(async () => {
    handleFinishedRoleAirdrops();
})();
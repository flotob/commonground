// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { isMainThread } from 'worker_threads';
import pool from '../util/postgres';
import format from 'pg-format';
import _Decimal from 'decimal.js';
const Decimal = _Decimal.clone({ precision: 80 });

if (isMainThread) {
  throw new Error("calculateTokenRewardProgramSecond FIX can only be run as a worker job");
}

const ONESHOT_ID = '2024_12_11_calculate_token_reward_program_second_fix';
const TOKENSALE_ID = '5457dbed-9ba4-4ad0-8be5-bc974fd20215';

const oldUsersWithMessageReward = new Decimal(90_000_000);
const oldUsersWithMessageRewardFactorFirstComparedToLast = 5;

const oldUsersWithoutMessageReward = new Decimal(30_000_000);
const oldUsersWithoutMessageRewardFactorFirstComparedToLast = 5;

// firstComparedToLastFactor is a number that determines how much bigger
// the resulting factor for the first in the list will be compared to the last in the list
function assignFactorsByPosition<T extends object>(firstComparedToLastFactor: number, values: T[]): (T & { factor: _Decimal })[] {
    if (values.length === 0) {
        return [];
    }
    if (firstComparedToLastFactor < 1) {
        throw new Error("firstComparedToLastFactor must be greater than or equal to 1");
    }

    const factors: _Decimal[] = [];
    let factorSum = new Decimal(0);

    // loop over the values and assign factors
    for (let i = 0; i < values.length; i++) {
        let currentFactor = new Decimal(firstComparedToLastFactor);

        // value between 0 and 1
        const positionalMinusFactor = new Decimal(i).div(new Decimal(values.length - 1));

        // the first in the list will be firstComparedToLastFactor times bigger
        // than the last in the list, which will be 1
        currentFactor = currentFactor.minus(new Decimal(firstComparedToLastFactor - 1).mul(positionalMinusFactor));

        factorSum = factorSum.plus(currentFactor);
        factors.push(currentFactor);
    }
    
    // now normalize the factors so that the sum of all factors is 1
    const normalizedFactors = factors.map(factor => factor.div(factorSum));

    return values.map((value, index) => ({ ...value, factor: normalizedFactors[index] }));
}

(async () => {
    const result = await pool.query(`
        SELECT id, "createdAt"
        FROM oneshot_jobs
    `);
    const oneshots = result.rows as {
        id: string;
        createdAt: string;
    }[];

    const startTime = Date.now();
    const userRewardsMap: Map<string, Models.TokenSale.UserSaleData['rewardProgram']> = new Map();

    if (!oneshots.find(d => d.id === ONESHOT_ID)) {
        console.log("=== Generating token reward program amounts, second ===");

        // ================================================
        // Old accounts with message
        const oldUsersWithMessage = await pool.query<{
            id: string;
        }>(`
            SELECT u.id
            FROM users u
            WHERE u."createdAt" < '2023-09-01'::timestamp
                AND EXISTS (
                    SELECT 1
                    FROM messages
                    WHERE "creatorId" = u.id
                )
            ORDER BY u."createdAt" ASC
        `);

        const oldUsersWithMessageWithFactors = assignFactorsByPosition(oldUsersWithMessageRewardFactorFirstComparedToLast, oldUsersWithMessage.rows);

        console.log("=== Old account with message rewards ===");
        let oldUsersWithMessageTokenRewardSum = new Decimal(0);
        for (const [i, oldUserWithMessage] of oldUsersWithMessageWithFactors.entries()) {
            const reward = oldUsersWithMessageReward.mul(oldUserWithMessage.factor);
            let rewardEntry = userRewardsMap.get(oldUserWithMessage.id);
            if (!rewardEntry) {
                rewardEntry = {};
                userRewardsMap.set(oldUserWithMessage.id, rewardEntry);
            }
            rewardEntry.oldAccountWithMessageReward = {
                totalUsersRewarded: oldUsersWithMessageWithFactors.length,
                yourPosition: i + 1,
                reward: reward.toFixed(2),
            };
            rewardEntry.totalReward = new Decimal(rewardEntry.totalReward || '0').plus(reward).toFixed(2);

            // console.log(oldUserWithMessage.id, "factor:", oldUserWithMessage.factor.toString(), "reward:", reward.toString());
            oldUsersWithMessageTokenRewardSum = oldUsersWithMessageTokenRewardSum.plus(reward);
        }
        console.log("=== Total account with message rewards ", oldUsersWithMessageTokenRewardSum.toFixed(2), "for", oldUsersWithMessageWithFactors.length, "users ===");


        // ================================================
        // Old accounts without message
        const oldUsersWithoutMessage = await pool.query<{
            id: string;
        }>(`
            SELECT u.id
            FROM users u
            WHERE u."createdAt" < '2023-09-01'::timestamp
                AND NOT EXISTS (
                    SELECT 1
                    FROM messages
                    WHERE "creatorId" = u.id
                )
            ORDER BY u."createdAt" ASC
        `);

        const oldUsersWithoutMessageWithFactors = assignFactorsByPosition(oldUsersWithoutMessageRewardFactorFirstComparedToLast, oldUsersWithoutMessage.rows);

        console.log("=== Old account without message rewards ===");
        let oldUsersWithoutMessageTokenRewardSum = new Decimal(0);
        for (const [i, oldUserWithoutMessage] of oldUsersWithoutMessageWithFactors.entries()) {
            const reward = oldUsersWithoutMessageReward.mul(oldUserWithoutMessage.factor);
            let rewardEntry = userRewardsMap.get(oldUserWithoutMessage.id);
            if (!rewardEntry) {
                rewardEntry = {};
                userRewardsMap.set(oldUserWithoutMessage.id, rewardEntry);
            }
            else {
                throw new Error("Duplicate user id in old users without message");
            }
            rewardEntry.oldAccountWithoutMessageReward = {
                totalUsersRewarded: oldUsersWithoutMessageWithFactors.length,
                yourPosition: i + 1,
                reward: reward.toFixed(2),
            };
            rewardEntry.totalReward = new Decimal(rewardEntry.totalReward || '0').plus(reward).toFixed(2);

            // console.log(oldUserWithoutMessage.id, "factor:", oldUserWithoutMessage.factor.toString(), "reward:", reward.toString());
            oldUsersWithoutMessageTokenRewardSum = oldUsersWithoutMessageTokenRewardSum.plus(reward);
        }
        console.log("=== Total account without message rewards ", oldUsersWithoutMessageTokenRewardSum.toFixed(2), "for", oldUsersWithoutMessageWithFactors.length, "users ===");


        // ================================================
        // persist the rewards to the database
        let updatedUsers = 0;
        for (const [userId, rewardEntry] of userRewardsMap.entries()) {
            if (!!userId) {
                try {
                    const result = await pool.query<{
                        rewardProgram: Models.TokenSale.UserSaleData['rewardProgram'];
                    }>(`
                        SELECT "rewardProgram"
                        FROM tokensale_userdata
                        WHERE "userId" = $1
                            AND "tokenSaleId" = $2
                    `, [userId, TOKENSALE_ID]);
                    if (result.rows.length > 0) {
                        const existingRewardProgram = result.rows[0].rewardProgram;
                        if (!existingRewardProgram) {
                            throw new Error("No existing reward program found for user " + userId);
                        }
                        // only fix if total reward is not set, since for those users it failed in the first run
                        if (!existingRewardProgram.totalReward) {
                            if (rewardEntry.oldAccountWithMessageReward) {
                                existingRewardProgram.oldAccountWithMessageReward = rewardEntry.oldAccountWithMessageReward;
                            }
                            if (rewardEntry.oldAccountWithoutMessageReward) {
                                existingRewardProgram.oldAccountWithoutMessageReward = rewardEntry.oldAccountWithoutMessageReward;
                            }
                            existingRewardProgram.totalReward = new Decimal(rewardEntry.totalReward!).toFixed(2);
                            await pool.query(`
                                UPDATE tokensale_userdata
                                SET "rewardProgram" = ${format("%L::jsonb", JSON.stringify(existingRewardProgram))}
                                WHERE "userId" = ${format("%L", userId)}
                                    AND "tokenSaleId" = ${format("%L", TOKENSALE_ID)}
                            `);
                            updatedUsers++;
                        }
                    }
                }
                catch (error) {
                    console.error("=== Error persisting reward for user", userId, "===", error);
                }
            }
            else {
                console.error("=== Skipping null userId for item ===", rewardEntry);
            }
        }

        await pool.query(`
            INSERT INTO oneshot_jobs (id)
            VALUES (${format("%L", ONESHOT_ID)})
        `);
        const dur = Math.floor((Date.now() - startTime) / 1000);
        console.log(`=== Finished generating second token reward FIX program amounts after ${dur}s ===`);
        console.log("=== Updated", updatedUsers, "users ===");
    }
    else {
        console.log("=== Second token reward program FIX amounts were already generated, nothing to do ===");
    }
})();
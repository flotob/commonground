// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { isMainThread } from 'worker_threads';
import pool from '../util/postgres';
import format from 'pg-format';
import _Decimal from 'decimal.js';
const Decimal = _Decimal.clone({ precision: 80 });

if (isMainThread) {
  throw new Error("calculateTokenRewardProgram can only be run as a worker job");
}

const ONESHOT_ID = '2024_12_09_calculate_token_reward_program';
const TOKENSALE_ID = '5457dbed-9ba4-4ad0-8be5-bc974fd20215';

const messagesWrittenReward = new Decimal(200_000_000);
const messagesWrittenRewardUserLimit = 1000;
const messagesWrittenRewardFactorFirstComparedToLast = 20;

const callsJoinedReward = new Decimal(200_000_000);
const callsJoinedRewardUserLimit = 1000;
const callsJoinedRewardFactorFirstComparedToLast = 20;

const luksoReward = new Decimal(30_000_000);
const fuelReward = new Decimal(5_000_000);

const recentLoginReward = new Decimal(50_000_000);
const recentLoginRewardUserLimit = 1000;
const recentLoginRewardFactorFirstComparedToLast = 5;

const sparkBoughtReward = new Decimal(10_000_000);
const sparkBoughtRewardFactorFirstComparedToLast = 5;

const communitiesJoinedReward = new Decimal(50_000_000);
const communitiesJoinedRewardUserLimit = 1000;
const communitiesJoinedRewardFactorFirstComparedToLast = 5;

const articlesWrittenReward = new Decimal(100_000_000);
const articlesWrittenRewardUserLimit = 500;
const articlesWrittenRewardFactorFirstComparedToLast = 20;

const registrationReward = new Decimal(10_000_000);

// const walletsConnectedReward = onePercentOfOverallTokenReward.mul(5);
// const rolesClaimedReward = onePercentOfOverallTokenReward.mul(10);
// const communitiesCreatedReward = onePercentOfOverallTokenReward.mul(10);

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
        console.log("=== Generating token reward program amounts ===");

        const tokenSale = await pool.query<{
            id: string;
            startDate: string;
        }>(`
            SELECT id
            FROM tokensales
            WHERE id = ${format("%L", TOKENSALE_ID)}
        `);
        if (tokenSale.rows.length === 0) {
            await pool.query(`
                INSERT INTO tokensales ("id", "name", "saleContractChain", "saleContractAddress", "saleContractType", "targetTokenChain", "targetTokenAddress", "targetTokenDecimals", "startDate","endDate")
                VALUES (${format("%L", TOKENSALE_ID)}, 'CG Token Sale', 'eth', '0xAf8734576AC37F45aE2DCce82582456968CD11A2', 'cg_tokensale_v1', 'eth', '0xDdeb1a370A88c5bcB6ec10191C03F8eC1d2Bd6fA', 18, '2024-12-11T18:00:00+01:00', '2024-12-30T18:00:00+01:00')
            `);
        }

        // clear rewards data
        await pool.query(`
            UPDATE tokensale_userdata
            SET "rewardProgram" = jsonb_build_object()
            WHERE "tokenSaleId" = ${format("%L", TOKENSALE_ID)}
        `);

        // ================================================
        // Most active message writers

        // minimum column size for a message to be considered a message,
        // this is to avoid counting too short messages as messages
        const messageMinBodyColumnSize = 120;

        const messageWriters = await pool.query<{
            id: string;
            messageCount: number;
        }>(`
            SELECT u.id, count(m.id)::int as "messageCount"
            FROM users u
            INNER JOIN messages m
                ON m."creatorId" = u.id
                AND m."deletedAt" IS NULL
                AND pg_column_size(m."body") > ${messageMinBodyColumnSize}
            GROUP BY u.id
            ORDER BY "messageCount" DESC
            LIMIT ${messagesWrittenRewardUserLimit}
        `);

        const messageWritersWithFactors = assignFactorsByPosition(messagesWrittenRewardFactorFirstComparedToLast, messageWriters.rows);

        console.log("=== Message writer rewards ===");
        let messageWriterTokenRewardSum = new Decimal(0);
        for (const [i, messageWriter] of messageWritersWithFactors.entries()) {
            const reward = messagesWrittenReward.mul(messageWriter.factor);
            let rewardEntry = userRewardsMap.get(messageWriter.id);
            if (!rewardEntry) {
                rewardEntry = {};
                userRewardsMap.set(messageWriter.id, rewardEntry);
            }
            rewardEntry.messagesWrittenReward = {
                totalUsersRewarded: messageWritersWithFactors.length,
                yourPosition: i + 1,
                reward: reward.toFixed(2),
            };
            rewardEntry.totalReward = new Decimal(rewardEntry.totalReward || '0').plus(reward).toFixed(2);

            console.log(messageWriter.id, messageWriter.messageCount, "factor:", messageWriter.factor.toString(), "reward:", reward.toString());
            messageWriterTokenRewardSum = messageWriterTokenRewardSum.plus(reward);
        }
        console.log("=== Total message writer rewards ===", messageWriterTokenRewardSum.toFixed(2));


        // ================================================
        // most active call joiners
        const callJoiners = await pool.query<{
            id: string;
            callCount: number;
        }>(`
            SELECT u.id, (
                SELECT count(DISTINCT "callId")
                FROM callmembers
                WHERE "userId" = u.id
            ) as "callCount"
            FROM users u
            ORDER BY "callCount" DESC
            LIMIT ${callsJoinedRewardUserLimit}
        `);

        const callJoinersGreaterThanZero = callJoiners.rows.filter(d => d.callCount > 0);
        const callJoinersWithFactors = assignFactorsByPosition(callsJoinedRewardFactorFirstComparedToLast, callJoinersGreaterThanZero);

        console.log("=== Call joiner rewards ===");
        let callJoinerTokenRewardSum = new Decimal(0);
        for (const [i, callJoiner] of callJoinersWithFactors.entries()) {
            const reward = callsJoinedReward.mul(callJoiner.factor);
            let rewardEntry = userRewardsMap.get(callJoiner.id);
            if (!rewardEntry) {
                rewardEntry = {};
                userRewardsMap.set(callJoiner.id, rewardEntry);
            }
            rewardEntry.callsJoinedReward = {
                totalUsersRewarded: callJoinersWithFactors.length,
                yourPosition: i + 1,
                reward: reward.toFixed(2),
            };
            rewardEntry.totalReward = new Decimal(rewardEntry.totalReward || '0').plus(reward).toFixed(2);
            callJoinerTokenRewardSum = callJoinerTokenRewardSum.plus(reward);
        }
        console.log("=== Total call joiner rewards ===", callJoinerTokenRewardSum.toFixed(2));


        // ================================================
        // lukso reward
        const luksoUsers = await pool.query<{
            id: string;
        }>(`
            SELECT DISTINCT u.id, array_length(u."communityOrder", 1) as "communityCount"
            FROM users u
            INNER JOIN user_accounts ua
                ON ua."userId" = u.id
                AND ua."type" = 'lukso'
            WHERE array_length(u."communityOrder", 1) > 2
            ORDER BY array_length(u."communityOrder", 1) DESC
        `);

        // factor 1 means everyone gets the same reward
        const luksoUsersWithFactors = assignFactorsByPosition(1, luksoUsers.rows);

        console.log("=== Lukso rewards ===");
        let luksoTokenRewardSum = new Decimal(0);
        for (const [i, luksoUser] of luksoUsersWithFactors.entries()) {
            const reward = luksoReward.mul(luksoUser.factor);
            let rewardEntry = userRewardsMap.get(luksoUser.id);
            if (!rewardEntry) {
                rewardEntry = {};
                userRewardsMap.set(luksoUser.id, rewardEntry);
            }
            rewardEntry.luksoReward = {
                totalUsersRewarded: luksoUsersWithFactors.length,
                reward: reward.toFixed(2),
            };
            rewardEntry.totalReward = new Decimal(rewardEntry.totalReward || '0').plus(reward).toFixed(2);
            luksoTokenRewardSum = luksoTokenRewardSum.plus(reward);
        }
        console.log("=== Total lukso rewards ===", luksoTokenRewardSum.toFixed(2));


        // ================================================
        // fuel reward

        const fuelTooLowCommunityCount = 2;
        const fuelMinMessageBodySize = 100;

        const fuelUsers = await pool.query<{
            id: string;
        }>(`
            SELECT DISTINCT u.id
            FROM users u
            INNER JOIN wallets w
                ON w."userId" = u.id
                AND w."type" = 'fuel'
            WHERE array_length(u."communityOrder", 1) > ${fuelTooLowCommunityCount}
                AND EXISTS(
                    SELECT 1
                    FROM messages
                    WHERE "creatorId" = u.id
                        AND pg_column_size("body") > ${fuelMinMessageBodySize}
                )
        `);

        /*
            // Alternative query with message count:
            SELECT a.id
            FROM (
                SELECT DISTINCT u.id, count(m.id) as "messageCount"
                FROM users u
                INNER JOIN wallets w
                    ON w."userId" = u.id
                    AND w."type" = 'fuel'
                INNER JOIN messages m
                    ON m."creatorId" = u.id
                GROUP BY u.id
                ORDER BY "messageCount" DESC
            ) a
            WHERE a."messageCount" > 4

            -- alternatively: number of joined communities
            WHERE array_length(u."communityOrder", 1) > 3
        */

        // factor 1 means everyone gets the same reward
        const fuelUsersWithFactors = assignFactorsByPosition(1, fuelUsers.rows);

        console.log("=== Fuel rewards ===");
        let fuelTokenRewardSum = new Decimal(0);
        for (const [i, fuelUser] of fuelUsersWithFactors.entries()) {
            const reward = fuelReward.mul(fuelUser.factor);
            let rewardEntry = userRewardsMap.get(fuelUser.id);
            if (!rewardEntry) {
                rewardEntry = {};
                userRewardsMap.set(fuelUser.id, rewardEntry);
            }
            rewardEntry.fuelReward = {
                totalUsersRewarded: fuelUsersWithFactors.length,
                reward: reward.toFixed(2),
            };
            rewardEntry.totalReward = new Decimal(rewardEntry.totalReward || '0').plus(reward).toFixed(2);
            fuelTokenRewardSum = fuelTokenRewardSum.plus(reward);
        }
        console.log("=== Total fuel rewards ===", fuelTokenRewardSum.toFixed(2));


        // ================================================
        // spark bought reward
        const sparkBoughtUsers = await pool.query<{
            userId: string;
            bought: number;
        }>(`
            SELECT "userId", sum(amount) as "bought"
            FROM point_transactions
            WHERE data->>'type' = 'user-onchain-buy'
            GROUP BY "userId"
            ORDER BY "bought" DESC
        `);

        const sparkBoughtUsersWithFactors = assignFactorsByPosition(sparkBoughtRewardFactorFirstComparedToLast, sparkBoughtUsers.rows);

        console.log("=== Spark bought rewards ===");
        let sparkBoughtTokenRewardSum = new Decimal(0);
        for (const [i, sparkBoughtUser] of sparkBoughtUsersWithFactors.entries()) {
            const reward = sparkBoughtReward.mul(sparkBoughtUser.factor);
            let rewardEntry = userRewardsMap.get(sparkBoughtUser.userId);
            if (!rewardEntry) {
                rewardEntry = {};
                userRewardsMap.set(sparkBoughtUser.userId, rewardEntry);
            }
            rewardEntry.sparkBoughtReward = {
                totalUsersRewarded: sparkBoughtUsersWithFactors.length,
                reward: reward.toFixed(2),
            };
            rewardEntry.totalReward = new Decimal(rewardEntry.totalReward || '0').plus(reward).toFixed(2);
            sparkBoughtTokenRewardSum = sparkBoughtTokenRewardSum.plus(reward);
        }
        console.log("=== Total spark bought rewards ===", sparkBoughtTokenRewardSum.toFixed(2));


        // ================================================
        // recent login reward
        const recentLoginUsers = await pool.query<{
            id: string;
        }>(`
            SELECT u.id
            FROM users u
            ORDER BY u."updatedAt" DESC
            LIMIT ${recentLoginRewardUserLimit}
        `);

        const recentLoginUsersWithFactors = assignFactorsByPosition(recentLoginRewardFactorFirstComparedToLast, recentLoginUsers.rows);

        console.log("=== Recent login rewards ===");
        let recentLoginTokenRewardSum = new Decimal(0);
        for (const [i, recentLoginUser] of recentLoginUsersWithFactors.entries()) {
            const reward = recentLoginReward.mul(recentLoginUser.factor);
            let rewardEntry = userRewardsMap.get(recentLoginUser.id);
            if (!rewardEntry) {
                rewardEntry = {};
                userRewardsMap.set(recentLoginUser.id, rewardEntry);
            }
            rewardEntry.recentLoginReward = {
                totalUsersRewarded: recentLoginUsersWithFactors.length,
                yourPosition: i + 1,
                reward: reward.toFixed(2),
            };
            rewardEntry.totalReward = new Decimal(rewardEntry.totalReward || '0').plus(reward).toFixed(2);
            recentLoginTokenRewardSum = recentLoginTokenRewardSum.plus(reward);
        }
        console.log("=== Total recent login rewards ===", recentLoginTokenRewardSum.toFixed(2));


        // ================================================
        // communities joined reward
        const communitiesJoinedUsers = await pool.query<{
            id: string;
        }>(`
            SELECT u.id
            FROM users u
            WHERE array_length(u."communityOrder", 1) > 0
            ORDER BY array_length(u."communityOrder", 1) DESC
            LIMIT ${communitiesJoinedRewardUserLimit}
        `);

        const communitiesJoinedUsersWithFactors = assignFactorsByPosition(communitiesJoinedRewardFactorFirstComparedToLast, communitiesJoinedUsers.rows);

        console.log("=== Communities joined rewards ===");
        let communitiesJoinedTokenRewardSum = new Decimal(0);
        for (const [i, communitiesJoinedUser] of communitiesJoinedUsersWithFactors.entries()) {
            const reward = communitiesJoinedReward.mul(communitiesJoinedUser.factor);
            let rewardEntry = userRewardsMap.get(communitiesJoinedUser.id);
            if (!rewardEntry) {
                rewardEntry = {};
                userRewardsMap.set(communitiesJoinedUser.id, rewardEntry);
            }
            rewardEntry.communitiesJoinedReward = {
                totalUsersRewarded: communitiesJoinedUsersWithFactors.length,
                yourPosition: i + 1,
                reward: reward.toFixed(2),
            };
            rewardEntry.totalReward = new Decimal(rewardEntry.totalReward || '0').plus(reward).toFixed(2);
            communitiesJoinedTokenRewardSum = communitiesJoinedTokenRewardSum.plus(reward);
        }
        console.log("=== Total communities joined rewards ===", communitiesJoinedTokenRewardSum.toFixed(2));


        // ================================================
        // articles written reward
        const articlesWrittenUsers = await pool.query<{
            id: string;
            articleCount: number;
        }>(`
            SELECT u.id, count(a.id) as "articleCount"
            FROM users u
            INNER JOIN articles a
                ON a."creatorId" = u.id
            GROUP BY u.id
            ORDER BY "articleCount" DESC
            LIMIT ${articlesWrittenRewardUserLimit}
        `);

        const articlesWrittenGreaterThanZero = articlesWrittenUsers.rows.filter(d => d.articleCount > 0);
        const articlesWrittenUsersWithFactors = assignFactorsByPosition(articlesWrittenRewardFactorFirstComparedToLast, articlesWrittenGreaterThanZero);

        console.log("=== Articles written rewards ===");
        let articlesWrittenTokenRewardSum = new Decimal(0);
        for (const [i, articlesWrittenUser] of articlesWrittenUsersWithFactors.entries()) {
            const reward = articlesWrittenReward.mul(articlesWrittenUser.factor);
            let rewardEntry = userRewardsMap.get(articlesWrittenUser.id);
            if (!rewardEntry) {
                rewardEntry = {};
                userRewardsMap.set(articlesWrittenUser.id, rewardEntry);
            }
            rewardEntry.articlesWrittenReward = {
                totalUsersRewarded: articlesWrittenUsersWithFactors.length,
                yourPosition: i + 1,
                reward: reward.toFixed(2),
            };
            rewardEntry.totalReward = new Decimal(rewardEntry.totalReward || '0').plus(reward).toFixed(2);
            articlesWrittenTokenRewardSum = articlesWrittenTokenRewardSum.plus(reward);
        }
        console.log("=== Total articles written rewards ===", articlesWrittenTokenRewardSum.toFixed(2));


        // ================================================
        // registration reward
        const registrations = await pool.query<{
            userId: string;
        }>(`
            SELECT DISTINCT "userId"
            FROM tokensale_registrations
            WHERE "userId" IS NOT NULL
        `);

        const registrationUsersWithFactors = assignFactorsByPosition(1, registrations.rows);

        console.log("=== Registration rewards ===");
        let registrationTokenRewardSum = new Decimal(0);
        for (const [i, registrationUser] of registrationUsersWithFactors.entries()) {
            const reward = registrationReward.mul(registrationUser.factor);
            let rewardEntry = userRewardsMap.get(registrationUser.userId);
            if (!rewardEntry) {
                rewardEntry = {};
                userRewardsMap.set(registrationUser.userId, rewardEntry);
            }
            rewardEntry.registrationReward = {
                totalUsersRewarded: registrationUsersWithFactors.length,
                reward: reward.toFixed(2),
            };
            rewardEntry.totalReward = new Decimal(rewardEntry.totalReward || '0').plus(reward).toFixed(2);
            registrationTokenRewardSum = registrationTokenRewardSum.plus(reward);
        }
        console.log("=== Total registration rewards ===", registrationTokenRewardSum.toFixed(2));


        // ================================================
        // persist the rewards to the database
        for (const [userId, rewardEntry] of userRewardsMap.entries()) {
            if (!!userId) {
                try {
                    await pool.query(`
                        INSERT INTO tokensale_userdata (
                            "userId", "tokenSaleId", "rewardProgram"
                        ) VALUES (
                            ${format("%L", userId)},
                            ${format("%L", TOKENSALE_ID)},
                            ${format("%L::jsonb", JSON.stringify(rewardEntry))}
                        )
                        ON CONFLICT ("userId", "tokenSaleId") DO UPDATE SET
                            "rewardProgram" = EXCLUDED."rewardProgram"
                    `);
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
        console.log(`=== Finished generating token reward program amounts after ${dur}s ===`);
        
    }
    else {
        console.log("=== Token reward program amounts were already generated, nothing to do ===");
    }
})();
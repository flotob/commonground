// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import pool from "../../util/postgres";
import dayjs from "dayjs";

export type MessageData = {
    messageId: string;
    createdAt: string;
    body: Models.Message.Body;
    displayName: string;
}

export const loadMessages = async (userId: string, channelId: string, limit: number) => {
    // Todo: permission check
    if (typeof limit !== 'number') {
        throw new Error('The limit must be a number.');
    }
    else if (limit < 1) {
        throw new Error('The limit must be greater than 0.');
    }
    else if (limit > 1000) {
        throw new Error('The limit must be less or equal to 1000.');
    }
    const result = await pool.query<MessageData>(`
        SELECT
            m.id AS "messageId",
            m."createdAt",
            m.body AS "body",
            ua."displayName"
        FROM messages m
        INNER JOIN users u
            ON u.id = m."creatorId"
        INNER JOIN user_accounts ua
            ON ua."userId" = u.id AND ua."type"::text = u."displayAccount"::text
        WHERE m."channelId" = $1
            AND m."deletedAt" IS NULL
        ORDER BY m."createdAt" DESC
        LIMIT $2
    `, [channelId, limit]);
    return result.rows;
};

export const loadMessageRange = async (userId: string, channelId: string, startDate: string, endDate: string) => {
    // Todo: permission check
    if (typeof startDate !== 'string' || typeof endDate !== 'string') {
        throw new Error('The start and end dates must be strings.');
    }
    let startDateObject: dayjs.Dayjs;
    let endDateObject: dayjs.Dayjs;
    try {
        startDateObject = dayjs(startDate);
        endDateObject = dayjs(endDate);
    }
    catch (e) {
        throw new Error('The start and end dates must be valid dates.');
    }
    if (!startDateObject.isValid() || !endDateObject.isValid()) {
        throw new Error('The start and end dates must be valid dates.');
    }
    const countData = await pool.query<{
        count: number;
    }>(`
        SELECT COUNT(*) FROM messages WHERE "channelId" = $1 AND "createdAt" BETWEEN $2 AND $3
    `, [channelId, startDateObject.toISOString(), endDateObject.toISOString()]);
    const count = countData.rows[0].count;
    if (count > 1000) {
        throw new Error(`The number of messages in the range is too large, maximum is 1000, but got ${count}.`);
    }
    const result = await pool.query<MessageData>(`
        SELECT
            m.id AS "messageId",
            m."createdAt",
            m.body AS "body",
            ua."displayName"
        FROM messages m
        INNER JOIN users u
          ON u.id = m."creatorId"
        INNER JOIN user_accounts ua
          ON ua."userId" = u.id AND ua."type"::text = u."displayAccount"::text
        WHERE m."channelId" = $1
          AND m."createdAt" BETWEEN $2 AND $3
          AND m."deletedAt" IS NULL
        ORDER BY m."createdAt" DESC
    `, [channelId, startDateObject.toISOString(), endDateObject.toISOString()]);
    return result.rows;
};
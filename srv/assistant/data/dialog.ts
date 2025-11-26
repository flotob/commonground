// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import format from "pg-format";
import pool from "../../util/postgres";
import errors from "../../common/errors";

export const createDialogItem = async ({
    userId,
    communityId,
    request,
}: {
    userId: string;
    communityId: string | null;
    request: Assistant.Request;
}) => {
    if (!!communityId && !request.extraData?.community) {
        throw new Error('Community extra data required with communityId present');
    }
    else if (!communityId && request.extraData?.community) {
        throw new Error('Community extra data not allowed without communityId present');
    }
    const result = await pool.query<{
        dialogId: string;
        createdAt: string;
    }>(`
        INSERT INTO assistant_dialogs ("userId", "communityId", request, "model")
        VALUES ($1, $2, $3::jsonb, $4)
        RETURNING id AS "dialogId", "createdAt"
    `, [userId, communityId, JSON.stringify(request), request.model]);
    console.log("Created dialog item", result.rows[0].dialogId, communityId, userId);
    return result.rows[0];
};

export const updateDialogItem = async ({
    userId,
    request,
    dialogId,
}: {
    userId: string;
    request: Assistant.Request;
    dialogId: string;
}) => {
    console.log("Updating dialog item", dialogId, userId);
    const result = await pool.query(`
        UPDATE assistant_dialogs
        SET request = $3::jsonb, "updatedAt" = now()
        WHERE id = $1
            AND "userId" = $2
    `, [dialogId, userId, JSON.stringify(request)]);
    if (result.rowCount === 0) {
        throw new Error('Dialog item not found');
    }
};

export const getDialogItem = async ({
    userId,
    dialogId,
}: {
    userId: string;
    dialogId: string;
}) => {
    const result = await pool.query<{
        id: string,
        communityId: string | null,
        request: Assistant.Request,
        createdAt: Date,
        updatedAt: Date,
        model: Assistant.ModelName
    }>(`
        SELECT id, "communityId", request, "createdAt", "updatedAt", "model"
        FROM assistant_dialogs
        WHERE id = $1
            AND "userId" = $2
    `, [dialogId, userId]);
    if (result.rowCount === 0) {
        throw new Error('Dialog item not found');
    }
    return result.rows[0];
};

export const getDialogList = async ({
    userId,
    communityId,
}: {
    userId: string;
    communityId: string | null;
}) => {
    const result = await pool.query<{
        dialogId: string;
        createdAt: string;
        updatedAt: string;
        model: Assistant.ModelName;
    }>(`
        SELECT id AS "dialogId", "createdAt", "updatedAt", "model"
        FROM assistant_dialogs
        WHERE "userId" = $1
            AND ${!!communityId ? format('"communityId" = %L', communityId) : '"communityId" IS NULL'}
        ORDER BY "createdAt" DESC
    `, [userId]);
    return result.rows;
};

export const deleteDialogItem = async ({
    userId,
    dialogId,
}: {
    userId: string;
    dialogId: string;
}) => {
    const result = await pool.query(`
        DELETE FROM assistant_dialogs
        WHERE id = $1
            AND "userId" = $2
    `, [dialogId, userId]);
    if (result.rowCount === 0) {
        throw new Error(errors.server.NOT_FOUND);
    }
};
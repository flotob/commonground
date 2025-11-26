// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import errors from "../../common/errors";
import pool from "../../util/postgres";

export const userPremiumState: (userId: string) => Promise<'gold' | 'silver' | 'free'> = async (userId: string) => {
    const result = await pool.query<{
        featureName: Models.User.PremiumFeatureName;
        activeUntil: Date;
    }>(`
        SELECT "featureName", "activeUntil"
        FROM users_premium
        WHERE "userId" = $1
          AND "activeUntil" > now()
    `, [userId]);
    if (!!result.rows.find(row => row.featureName === 'SUPPORTER_2')) {
        return 'gold';
    }
    else if (!!result.rows.find(row => row.featureName === 'SUPPORTER_1')) {
        return 'silver';
    }
    return 'free';
};

export const getUserExtraData = async (userId: string) => {
    const result = await pool.query<{
        userId: string;
        displayName: string;
    }>(`
        SELECT
            u."id" AS "userId",
            ua."displayName"
        FROM users u
        INNER JOIN user_accounts ua
            ON ua."userId" = u."id"
            AND ua."type"::text = u."displayAccount"::text
        WHERE u."id" = $1
    `, [userId]);

    const userData = result.rows[0];
    if (!userData) {
        throw new Error(errors.server.NOT_FOUND);
    }
    return userData;
};
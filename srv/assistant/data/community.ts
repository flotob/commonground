// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { ChannelPermission } from "../../common/enums";
import errors from "../../common/errors";
import pool from "../../util/postgres";

export const getCommunityExtraData = async (userId: string, communityId: string) => {
    const result = await pool.query<{
        communityId: string;
        title: string;
        description: string;
        channels: {
            channelId: string;
            emoji: string | null;
            title: string;
        }[];
    }>(`
        WITH channel_ids AS (
            SELECT DISTINCT
                ccrp."channelId"
            FROM communities_channels_roles_permissions ccrp
            INNER JOIN roles_users_users ruu
                ON ruu."roleId" = ccrp."roleId"
                AND ruu."userId" = $1
                AND ruu."claimed" = true
            INNER JOIN roles r
                ON r."id" = ccrp."roleId"
                AND r."deletedAt" IS NULL
                AND r."communityId" = $2
            WHERE ccrp."communityId" = $2
                AND ccrp."permissions" @> '{${ChannelPermission.CHANNEL_READ}}'
        )
        SELECT
            c."id" AS "communityId",
            c."title",
            c."description",
            (
                SELECT array_to_json(array_agg(json_build_object(
                    'channelId', cc."channelId",
                    'emoji', cc."emoji",
                    'title', cc."title"
                )))
                FROM communities_channels cc
                WHERE cc."channelId" = ANY(SELECT "channelId" FROM channel_ids)
                    AND cc."deletedAt" IS NULL
                    AND cc."areaId" IS NOT NULL
            ) AS "channels"
        FROM communities c
        WHERE c.id = $2
    `, [userId, communityId]);

    const communityData = result.rows[0];
    if (!communityData) {
        throw new Error(errors.server.NOT_FOUND);
    }
    return communityData;
};

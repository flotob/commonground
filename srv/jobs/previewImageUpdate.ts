// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { isMainThread } from 'worker_threads';
import pool from '../util/postgres';
import fileHelper from '../repositories/files';
import format from 'pg-format';

if (isMainThread) {
  throw new Error("PreviewImageUpdate can only be run as a worker job");
}

const ONESHOT_ID = '2023_11_18_image_previews';

async function updatePreviewImages() {
    const communitiesResult = await pool.query(`
        SELECT id, "creatorId", "logoSmallId"
        FROM communities
        WHERE "logoSmallId" IS NOT NULL
          AND "previewImageId" IS NULL
    `);
    const communities = communitiesResult.rows as {
        id: string;
        creatorId: string;
        logoSmallId: string;
    }[];
    for (const community of communities) {
        await fileHelper.updateCommunityPreview(community.creatorId, community.id, community.logoSmallId);
    }
    const usersResult = await pool.query(`
        SELECT id, "imageId"
        FROM users
        WHERE "imageId" IS NOT NULL
          AND "previewImageId" IS NULL
    `);
    const users = usersResult.rows as {
        id: string;
        imageId: string;
    }[];
    for (const user of users) {
        await fileHelper.updateUserPreview(user.id, user.imageId);
    }
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

    if (!oneshots.find(d => d.id === ONESHOT_ID)) {
        console.log("=== Updating preview images ===");
        await updatePreviewImages();
        await pool.query(`
            INSERT INTO oneshot_jobs (id)
            VALUES (${format("%L", ONESHOT_ID)})
        `);
    }
    else {
        console.log("=== Preview images were already updated, nothing to do ===");
    }
    
})();
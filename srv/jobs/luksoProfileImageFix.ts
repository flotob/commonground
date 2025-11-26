// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { isMainThread } from 'worker_threads';
import pool from '../util/postgres';
import format from 'pg-format';
import fileHelper from '../repositories/files';
import onchainHelper from '../repositories/onchain';
import axios from '../util/axios';
if (isMainThread) {
  throw new Error("luksoProfileImageFix can only be run as a worker job");
}

const ONESHOT_ID = '2025_10_22__02_lukso_profile_image_fix';

async function getProfilesToFix() {
    const profilesResult = await pool.query<{
        userId: string;
        data: {
            id: string;
            type: "lukso";
        };
    }>(`
        SELECT "data", "userId"
        FROM user_accounts
        WHERE type = 'lukso' AND "imageId" = ''
    `);
    return profilesResult.rows;
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

    if (!oneshots.find(d => d.id === ONESHOT_ID)) {
        console.log("=== Fixing LUKSO profile images ===");

        const profilesToFix = await getProfilesToFix();
        let fixedCount = 0;
        let errorCount = 0;

        for (const profile of profilesToFix) {
            try {
                const upData = await onchainHelper.luksoGetUniversalProfileData(profile.data.id);
                if (upData.profileImageUrl) {
                        const imageUrl =
                            upData.profileImageUrl.startsWith("ipfs://") 
                            ? `https://ipfs.io/ipfs/${upData.profileImageUrl.split('ipfs://').pop()}`
                            : upData.profileImageUrl;
                        const response = await axios.get(imageUrl, { responseType: 'arraybuffer', headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36' } });
                        const buffer = Buffer.from(response.data, "utf-8");
                        const image = await fileHelper.saveImage(null, { type: 'userProfileImage' }, buffer, { width: 110, height: 110 });
                        const luksoImageId = image.fileId;
                        await pool.query(`
                            UPDATE user_accounts
                            SET "imageId" = $1
                            WHERE "userId" = $2 AND "type" = 'lukso'
                        `, [luksoImageId, profile.userId]);
                        fixedCount++;
                }
            } catch (e) {
                // For now just ignore error if this fails, but is this fine for now?
                console.error("Could not download lukso image", e);
                await pool.query(`
                    UPDATE user_accounts
                    SET "imageId" = NULL
                    WHERE "userId" = $1 AND "type" = 'lukso'
                `, [profile.userId]);
                errorCount++;
            }
        }

        await pool.query(`
            INSERT INTO oneshot_jobs (id)
            VALUES (${format("%L", ONESHOT_ID)})
        `);
        const dur = Math.floor((Date.now() - startTime) / 1000);
        console.log(`=== Finished fixing lukso profile images after ${dur}s ===`);
        console.log(`=== ${errorCount} errors ===`);
        console.log(`=== ${fixedCount} profiles fixed ===`);
    }
    else {
        console.log("=== LUKSO profile images were already fixed, nothing to do ===");
    }
    
})();
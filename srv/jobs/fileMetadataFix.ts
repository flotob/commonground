// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { isMainThread } from 'worker_threads';
import pool from '../util/postgres';
import format from 'pg-format';
import fileHelper from '../repositories/files';
import sharp from 'sharp';

if (isMainThread) {
  throw new Error("fileMetadataFix can only be run as a worker job");
}

const ONESHOT_ID = '2024_04_06_file_metadata_fix';

async function getFilesToFix() {
    const fileResult = await pool.query<{
        objectId: string;
    }>(`
        SELECT "objectId"
        FROM files
        WHERE data IS NULL
    `);
    return fileResult.rows;
}

async function getAllMessagesWithImageAttachments() {
    const query = `
        SELECT id, "creatorId", "createdAt", attachments
        FROM messages, jsonb_array_elements(messages.attachments) AS att_arr
        WHERE att_arr @> '{"type": "image"}' OR att_arr @> '{"type": "linkPreview"}'
        ORDER BY "createdAt" DESC
    `;
    const result = await pool.query<{
        id: string;
        creatorId: string;
        createdAt: string;
        attachments: Models.Message.Attachment[];
    }>(query);
    return result.rows;
}

async function fixFile(objectId: string, extraData?: { creatorId: string, uploadOptions: API.Files.UploadOptions }) {
    const fileBuffer = await fileHelper.getFile(objectId);
    if (fileBuffer) {
        const metadata = await sharp(fileBuffer).metadata();
        const fileData: Common.ImageMetadata = {
            mimeType: `image/${metadata.format}`, 
            size: {
                width: metadata.width || 0,
                height: metadata.height || 0,
            },
        };
        let query: string;
        if (extraData) {
            query = `
                INSERT INTO files ("objectId", "creatorId", "uploadOptions", data)
                VALUES ($1, $2, $3::jsonb, $4::jsonb)
                ON CONFLICT ("objectId")
                DO UPDATE SET
                    "data" = EXCLUDED."data",
                    "creatorId" = CASE
                        WHEN "files"."creatorId" IS NULL
                        THEN EXCLUDED."creatorId"
                        ELSE "files"."creatorId"
                    END,
                    "uploadOptions" = CASE
                        WHEN "files"."uploadOptions" IS NULL
                        THEN EXCLUDED."uploadOptions"
                        ELSE "files"."uploadOptions"
                    END
            `;
            await pool.query(query, [
                objectId,
                extraData.creatorId,
                JSON.stringify(extraData.uploadOptions),
                JSON.stringify(fileData)
            ]);
        }
        else {
            query = `
                INSERT INTO files ("objectId", data)
                VALUES ($1, $2::jsonb)
                ON CONFLICT ("objectId")
                DO UPDATE SET "data" = EXCLUDED."data"
            `;
            await pool.query(query, [
                objectId,
                JSON.stringify(fileData)
            ]);
        }
        return fileData;
    }
    else {
        throw new Error("Could not fetch file");
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

    const errorObjectIds = new Set<string>();
    const fixedMetadataByObjectId = new Map<string, Common.ImageMetadata>();
    const startTime = Date.now();

    if (!oneshots.find(d => d.id === ONESHOT_ID)) {
        console.log("=== Fixing files metadata ===");
        let attachmentsFixed = 0;

        const messagesToFix = await getAllMessagesWithImageAttachments();
        for (const [index, message] of messagesToFix.entries()) {
            let changed = false;
            for (const attachment of message.attachments) {
                attachmentsFixed++;
                if (attachment.type === 'image' || attachment.type === 'linkPreview') {
                    let uploadType: API.Files.UploadType;
                    if (attachment.type === 'image') {
                        uploadType = 'channelAttachmentImage';
                    }
                    else {
                        uploadType = 'urlPreviewImage';
                    }
                    try {
                        if (!errorObjectIds.has(attachment.imageId) && attachment.imageData === undefined) {
                            let fileData = fixedMetadataByObjectId.get(attachment.imageId);

                            if (!fileData) {
                                fileData = await fixFile(attachment.imageId, {
                                    creatorId: message.creatorId,
                                    uploadOptions: {
                                        type: uploadType,
                                    },
                                });
                                fixedMetadataByObjectId.set(attachment.imageId, fileData);
                            }
                            attachment.imageData = fileData;
                            changed = true;
                        }
                    }
                    catch (e) {
                        errorObjectIds.add(attachment.imageId);
                    }
                    if (attachment.type === 'image') {
                        try {
                            if (!errorObjectIds.has(attachment.largeImageId) && attachment.largeImageData === undefined) {
                                let fileData = fixedMetadataByObjectId.get(attachment.largeImageId);
                                if (!fileData) {
                                    fileData = await fixFile(attachment.largeImageId, {
                                        creatorId: message.creatorId,
                                        uploadOptions: {
                                            type: 'channelAttachmentImage',
                                        },
                                    });
                                    fixedMetadataByObjectId.set(attachment.imageId, fileData);
                                }
                                attachment.largeImageData = fileData;
                                changed = true;
                            }
                        }
                        catch (e) {
                            errorObjectIds.add(attachment.largeImageId);
                        }
                    }
                }
            }
            if (changed) {
                await pool.query(`
                    UPDATE messages
                    SET
                        attachments = $1::jsonb,
                        "updatedAt" = now()
                    WHERE id = $2
                `, [
                    JSON.stringify(message.attachments),
                    message.id,
                ]);
            }
            if (index % 1000 === 0) {
                console.log(`Fixed ${index} of ${messagesToFix.length} messages (${errorObjectIds.size} errors, ${attachmentsFixed} attachments fixed)`);
            }
        }

        // fix remaining files from db that are not attached to any message
        const filesToFix = await getFilesToFix();
        for (const [index, file] of filesToFix.entries()) {
            // fix file
            if (index % 1000 === 0) {
                console.log(`=== Fixed ${index} of ${filesToFix.length} files (${errorObjectIds.size} errors) ===`);
            }
            if (errorObjectIds.has(file.objectId)) {
                continue;
            }
            try {
                const fileData = await fixFile(file.objectId);
                fixedMetadataByObjectId.set(file.objectId, fileData);
            }
            catch (e) {
                errorObjectIds.add(file.objectId);
            }
        }
        await pool.query(`
            INSERT INTO oneshot_jobs (id)
            VALUES (${format("%L", ONESHOT_ID)})
        `);
        const dur = Math.floor((Date.now() - startTime) / 1000);
        console.log(`=== Finished fixing files metadata after ${dur}s ===`);
        console.log(`=== ${errorObjectIds.size} files could not be fetched ===`);
        console.log(`=== ${messagesToFix.length} messages fixed ===`);
        console.log(`=== ${attachmentsFixed} attachments fixed ===`);
        console.log(`=== ${fixedMetadataByObjectId.size} files metadata fixed ===`)
    }
    else {
        console.log("=== Files metadata was already fixed, nothing to do ===");
    }
    
})();
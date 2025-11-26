// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { isMainThread } from 'worker_threads';
import emailUtils from '../api/emails';
import pool from '../util/postgres';
import format from 'pg-format';
import dayjs from 'dayjs';
import config from '../common/config';

// Types
type TokenSaleSchedulingType = 'oneDay' | 'startsNow';

type TokenSaleEmailReceiver = {
    type: 'user' | 'registration';
    userId: string | null;
    registrationId: string | null;
    email: string;
    schedulingType: TokenSaleSchedulingType;
};

type TokenSalePushNotificationReceiver = {
    userId: string;
    deviceData: {
        webPushSubscription: Models.Notification.PushSubscription;
        deviceId: string;
    }[];
};

if (isMainThread) {
    throw new Error("tokenSaleNotifications can only be run as a worker job");
}

const INTERVAL_MS = 1000 * 60 * 5;

/*
// Todo: Maybe create DM chat with Common Ground user? No notification type fits, not sure how to do it

const __vapidKeyData = dockerSecret('vapid_keys_json');
const vapidKeyData =
    !!__vapidKeyData
        ? JSON.parse(__vapidKeyData) as {
            publicKey: string;
            privateKey: string;
        }
        : undefined;

if (!!vapidKeyData) {
    webPush.setVapidDetails(
        "mailto:ola@dao.cg",
        vapidKeyData.publicKey,
        vapidKeyData.privateKey,
    );
}

async function getPushNotificationUsers(type: TokenSaleSchedulingType): Promise<TokenSalePushNotificationReceiver[]> {
    const result = await pool.query<{
        userId: string;
        deviceData: {
            webPushSubscription: Models.Notification.PushSubscription;
            deviceId: string;
        }[];
    }>(`
        SELECT
            u."id" AS "userId",
            (
                SELECT json_agg(json_build_object(
                    'webPushSubscription', d."webPushSubscription",
                    'deviceId', d."id"
                ))
                FROM (
                    SELECT d."webPushSubscription", d."id"
                    FROM devices d 
                    WHERE d."userId" = u."id"
                        AND d."webPushSubscription" IS NOT NULL
                        AND d."deletedAt" IS NULL
                    ORDER BY d."updatedAt" DESC
                    LIMIT 3
                ) d
            ) AS "deviceData"
        FROM users u
        LEFT JOIN tokensale_userdata tu
            ON tu."userId" = u."id"
        WHERE tu."${type}NotificationSentAt" IS NULL
            AND EXISTS (
                SELECT 1
                FROM devices d
                WHERE d."userId" = u."id"
                AND d."webPushSubscription" IS NOT NULL
                AND d."deletedAt" IS NULL
            )
    `)
    return result.rows;
}

async function sendPushNotifications(data: TokenSalePushNotificationReceiver) {
    const subjectUserId = '00000000-0000-0000-0000-000000000000'; // Create "Common Ground" user
    const event: Models.Notification.ApiNotification = {
        type: 'DM',
        id: 'tokenSale',
        text: 'Token sale is starting soon!',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        read: false,
        subjectItemId: null,
        subjectCommunityId: null,
        subjectUserId: subjectUserId,
        extraData: null,
    };

    const eventString = `Token sale is starting soon!`; // Todo
    for (const item of data.deviceData) {
        await webPush.sendNotification(
            item.webPushSubscription,
            eventString,
            {
                urgency: "high",
            },
        ).catch(e => {
            if (e instanceof WebPushError) {
                if (e.statusCode === 410 || e.statusCode === 404) {
                    // Subscription has been deleted
                    console.log(`Received status 410 or 404 for push, removing webPushSubscription from device ${item.deviceId}`);
                    return pool.query(`
                UPDATE devices
                SET "webPushSubscription" = NULL
                WHERE id = $1::uuid
                `, [item.deviceId]);
                }
                else {
                    console.error(`Received statusCode ${e.statusCode} when trying to send webPush`);
                    console.error(e);
                }
            }
            else {
                console.error("Unknown error received from webPush.sendNotification");
                console.error(e);
            }
        });
    }
}
*/

async function getEmailNotificationUsers(type: TokenSaleSchedulingType): Promise<TokenSaleEmailReceiver[]> {
    const result: TokenSaleEmailReceiver[] = [];
    const userEmailMap = new Map<string, string>();
    const users = await pool.query<{ id: string, email: string }>(`
        SELECT u.id, u.email
        FROM users u
        LEFT JOIN tokensale_userdata tu
            ON tu."userId" = u.id
        WHERE tu."${type}EmailSentAt" IS NULL
          AND u."emailVerified" = true
          AND u.email IS NOT NULL
    `);
    for (const user of users.rows) {
        userEmailMap.set(user.id, user.email);
        result.push({
            type: 'user',
            userId: user.id,
            email: user.email,
            registrationId: null,
            schedulingType: type,
        });
    }
    const registrations = await pool.query<{ id: string, userId: string | null, email: string }>(`
        SELECT r.id, r."userId", r.email
        FROM tokensale_registrations r
        WHERE r."${type}EmailSentAt" IS NULL
          AND r.email IS NOT NULL
    `);
    const doubleRegistrationsToDeactivate: string[] = [];
    for (const registration of registrations.rows) {
        if (registration.userId) {
            const emailFromMap = userEmailMap.get(registration.userId);
            if (!!emailFromMap && emailFromMap.toLowerCase() === registration.email.toLowerCase()) {
                doubleRegistrationsToDeactivate.push(registration.id);
                continue;
            }
        }
        result.push({
            type: 'registration',
            userId: registration.userId,
            email: registration.email,
            registrationId: registration.id,
            schedulingType: type,
        });
    }
    if (doubleRegistrationsToDeactivate.length > 0) {
        await pool.query(`
            UPDATE tokensale_registrations
            SET "${type}EmailSentAt" = ${format("%L", new Date(0).toISOString())}
            WHERE id = ANY(ARRAY[${format("%L", doubleRegistrationsToDeactivate)}]::uuid[])
        `);
    }
    return result;
}

async function sendEmails(tokenSaleId: string, receivers: TokenSaleEmailReceiver[]): Promise<{ errors: number, success: number }> {
    console.log(`Sending token sale emails to ${receivers.length} email addresses`);
    let errors = 0;
    let success = 0;
    let baseUrl: string;
    if (config.DEPLOYMENT === 'dev') {
        baseUrl = `http://localhost:3000`;
    }
    else if (config.DEPLOYMENT === 'staging') {
        baseUrl = `https://staging.app.cg`;
    }
    else {
        baseUrl = `https://app.cg`;
    }
    for (const receiver of receivers) {
        try {
            if (receiver.schedulingType === 'startsNow') {
                await emailUtils.sendTokenSaleImmediateEmail({
                    email: receiver.email,
                    subject: 'The Common Ground Token Sale is starting in less than one hour!',
                    baseUrl,
                });
            }
            else {
                await emailUtils.sendTokenSaleEmail({
                    email: receiver.email,
                    subject: 'The Token Sale for Common Ground is starting soon!',
                    baseUrl,
                    startsIn: 'less than 24 hours',
                });
            }
            if (receiver.type === 'user') {
                await pool.query(`
                    INSERT INTO tokensale_userdata ("userId", "tokenSaleId", "${receiver.schedulingType}EmailSentAt")
                    VALUES ($1::uuid, $2::uuid, now())
                    ON CONFLICT ("userId", "tokenSaleId")
                        DO UPDATE SET "${receiver.schedulingType}EmailSentAt" = EXCLUDED."${receiver.schedulingType}EmailSentAt"
                `, [receiver.userId, tokenSaleId]);
            }
            else if (receiver.type === 'registration') {
                if (receiver.registrationId === null) {
                    console.error('Registration ID is null, cannot update', receiver.email);
                    throw new Error('Registration ID is null, cannot update');
                }
                await pool.query(`
                    UPDATE tokensale_registrations
                    SET "${receiver.schedulingType}EmailSentAt" = now()
                    WHERE id = $1::uuid
                `, [receiver.registrationId]);
            }
            success++;
        }
        catch (error) {
            console.error(`Error sending token sale email to email ${receiver.email}`, error);
            errors++;
        }
    }
    return { errors, success };
}

async function main() {
    try {
        const tokenSales = await pool.query<{
            id: string,
            name: string,
            oneDayEmailSentAt: string | null,
            startsNowEmailSentAt: string | null,
            startDate: string,
            endDate: string
        }>(`
            SELECT
                id,
                name,
                "oneDayEmailSentAt",
                "startsNowEmailSentAt",
                "startDate",
                "endDate"
            FROM tokensales
        `);
        for (const tokenSale of tokenSales.rows) {
            const now = dayjs();
            const startDate = dayjs(tokenSale.startDate);

            if (now.isBefore(startDate)) {
                // hours before start
                const diff = startDate.diff(now, 'minutes');
                if (diff < 60 && !tokenSale.startsNowEmailSentAt) {
                    const receivers = await getEmailNotificationUsers('startsNow');
                    const { errors, success } = await sendEmails(tokenSale.id, receivers);
                    console.log(`Sent ${success} emails, ${errors} errors for token sale ${tokenSale.id}`);
                    await pool.query(`
                        UPDATE tokensales
                        SET "startsNowEmailSentAt" = now()
                        WHERE id = $1::uuid
                    `, [tokenSale.id]);
                }
                else if (diff < (24 * 60) && !tokenSale.oneDayEmailSentAt) {
                    const receivers = await getEmailNotificationUsers('oneDay');
                    const { errors, success } = await sendEmails(tokenSale.id, receivers);
                    console.log(`Sent ${success} emails, ${errors} errors for token sale ${tokenSale.id}`);
                    await pool.query(`
                        UPDATE tokensales
                        SET "oneDayEmailSentAt" = now()
                        WHERE id = $1::uuid
                    `, [tokenSale.id]);
                }
            }
        }
    }
    catch (error) {
        console.error(`Error sending token sale emails`, error);
    }
    setTimeout(main, INTERVAL_MS);
}

main();
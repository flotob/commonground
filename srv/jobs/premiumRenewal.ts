// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { isMainThread } from 'worker_threads';
import pool from '../util/postgres';
import config from '../common/config';
import format from 'pg-format';
import communityHelper from '../repositories/communities';
import eventHelper from '../repositories/event';
import userHelper from '../repositories/users';

if (isMainThread) {
  throw new Error("PremiumRenewal can only be run as a worker job");
}

async function getFeaturesToRenew() {
  const threshold = "3 minutes";
  const communityQuery = `
    SELECT
      c.id,
      c."pointBalance",
      cp."featureName",
      cp."activeUntil",
      cp."autoRenew"
    FROM communities_premium cp
    INNER JOIN communities c
      ON cp."communityId" = c.id
    WHERE cp."activeUntil" < now() + interval '${threshold}'
      AND cp."autoRenew" IS NOT NULL
  `;
  const userQuery = `
    SELECT
      u.id,
      u."pointBalance",
      up."featureName",
      up."activeUntil",
      up."autoRenew"
    FROM users_premium up
    INNER JOIN users u
      ON up."userId" = u.id
    WHERE up."activeUntil" < now() + interval '${threshold}'
      AND up."autoRenew" IS NOT NULL
  `;
  const communityData = await pool.query<{
    id: string;
    pointBalance: number;
    featureName: Models.Community.PremiumName;
    activeUntil: string;
    autoRenew: Common.PremiumRenewal;
  }>(communityQuery);
  const userData = await pool.query<{
    id: string;
    pointBalance: number;
    featureName: Models.User.PremiumFeatureName;
    activeUntil: string;
    autoRenew: Common.PremiumRenewal;
  }>(userQuery);
  return {
    communityFeatures: communityData.rows,
    userFeatures: userData.rows,
  };
}

async function renewFeatures() {
  const startTime = Date.now();
  try {
    const { communityFeatures, userFeatures } = await getFeaturesToRenew();
    for (const communityFeature of communityFeatures) {
      const { id, autoRenew, featureName, pointBalance } = communityFeature;
      let price: number | undefined;
      switch (featureName) {
        case 'BASIC':
          price = config.PREMIUM.COMMUNITY_BASIC.MONTHLY_PRICE;
          break;
        case 'PRO':
          price = config.PREMIUM.COMMUNITY_PRO.MONTHLY_PRICE;
          break;
        case 'ENTERPRISE':
          price = config.PREMIUM.COMMUNITY_ENTERPRISE.MONTHLY_PRICE;
          break;
        default:
          console.warn("Unknown community feature name for renewal: ", featureName);
          continue;
      }
      if (autoRenew === "YEAR") {
        price = Math.round(price * 12 * ((100 - config.PREMIUM.YEARLY_DISCOUNT_PERCENT) / 100));
      }
      if (!price) {
        console.warn("Count not find price or price is 0, skipping", id, featureName, price);
        continue;
      }
      let renewalSuccessful = false;
      let updatedAt: Date | undefined;
      let newPointBalance: number | undefined;
      if (price <= pointBalance) {
        const transactionData: Models.Premium.TransactionData = {
          type: 'community-spend',
          featureName,
          triggeredBy: autoRenew,
        };
        const updateResult = await pool.query(`
          WITH update_community AS (
            UPDATE communities
            SET
              "pointBalance" = "pointBalance" - ${Number(price)},
              "updatedAt" = now()
            WHERE id = ${format("%L::uuid", id)}
              AND "pointBalance" >= ${Number(price)}
            RETURNING "pointBalance"
          ), insert_transaction AS (
            INSERT INTO point_transactions ("communityId", "amount", "data")
            SELECT ${format(
              `%L::uuid, %s, %L::jsonb`,
              id,
              Number(price),
              JSON.stringify(transactionData),
            )}
            WHERE EXISTS (SELECT 1 FROM update_community)
          )
          UPDATE communities_premium
          SET "activeUntil" = "activeUntil" + interval '1 ${autoRenew === "YEAR" ? 'year' : 'month'}'
          WHERE "communityId" = ${format("%L", id)}
            AND "featureName" = ${format("%L", featureName)}
            AND EXISTS (SELECT 1 FROM update_community)
          RETURNING
            now() AS "updatedAt",
            (SELECT "pointBalance" FROM update_community) AS "pointBalance"
        `);
        renewalSuccessful = updateResult.rowCount === 1;
        updatedAt = updateResult.rows[0]?.updatedAt;
        newPointBalance = updateResult.rows[0]?.pointBalance;
      }
      if (renewalSuccessful) {
        console.log(`Success: Renewed ${featureName} for ${autoRenew}, community ${id}, new point balance: ${newPointBalance}`);
        const premiumFeatures = await communityHelper._getCommunityPremiumFeatures(pool, id);
        const premium = premiumFeatures.find(f => f.featureName === 'BASIC' || f.featureName === 'PRO' || f.featureName === 'ENTERPRISE');
        const eventData: Events.Community.Community["data"] = {
          id,
          updatedAt: (updatedAt || new Date()).toISOString(),
          pointBalance: newPointBalance,
          premium,
        };
        const event: Events.Community.Community = {
          type: 'cliCommunityEvent',
          action: 'update',
          data: eventData,
        };
        eventHelper.emit(event, {
          communityIds: [id],
        });
      }
      else {
        console.log(`Failure: Feature ${featureName} for ${autoRenew}, community ${id}: Insufficient balance`);
        await pool.query(`
          UPDATE communities_premium
          SET "autoRenew" = NULL
          WHERE "communityId" = ${format("%L", id)}
            AND "featureName" = ${format("%L", featureName)}
        `);
      }
    }
    for (const userFeature of userFeatures) {
      const { id, autoRenew, featureName, pointBalance } = userFeature;
      let price: number | undefined;
      switch (featureName) {
        case 'SUPPORTER_1':
          price = config.PREMIUM.USER_SUPPORTER_1.MONTHLY_PRICE;
          break;
        case 'SUPPORTER_2':
          price = config.PREMIUM.USER_SUPPORTER_2.MONTHLY_PRICE;
          break;
        default:
          console.warn("Unknown community feature name for renewal: ", featureName);
          continue;
      }
      if (autoRenew === "YEAR") {
        price = Math.round(price * 12 * ((100 - config.PREMIUM.YEARLY_DISCOUNT_PERCENT) / 100));
      }
      if (!price) {
        console.warn("Count not find price or price is 0, skipping", id, featureName, price);
        continue;
      }
      let renewalSuccessful = false;
      let updatedAt: Date | undefined;
      let newPointBalance: number | undefined;
      if (price <= pointBalance) {
        const transactionData: Models.Premium.TransactionData = {
          type: 'user-spend',
          featureName,
          triggeredBy: autoRenew,
        };
        const updateResult = await pool.query(`
          WITH update_user AS (
            UPDATE users
            SET
              "pointBalance" = "pointBalance" - ${Number(price)},
              "updatedAt" = now()
            WHERE id = ${format("%L::uuid", id)}
              AND "pointBalance" >= ${Number(price)}
            RETURNING "pointBalance"
          ), insert_transaction AS (
            INSERT INTO point_transactions ("userId", "amount", "data")
            SELECT ${format(
              `%L::uuid, %s, %L::jsonb`,
              id,
              Number(price),
              JSON.stringify(transactionData),
            )}
            WHERE EXISTS (SELECT 1 FROM update_user)
          )
          UPDATE users_premium
          SET "activeUntil" = "activeUntil" + interval '1 ${autoRenew === "YEAR" ? 'year' : 'month'}'
          WHERE "userId" = ${format("%L", id)}
            AND "featureName" = ${format("%L", featureName)}
            AND EXISTS (SELECT 1 FROM update_user)
          RETURNING
            now() AS "updatedAt",
            (SELECT "pointBalance" FROM update_user) AS "pointBalance"
        `);
        renewalSuccessful = updateResult.rowCount === 1;
        updatedAt = updateResult.rows[0]?.updatedAt;
        newPointBalance = updateResult.rows[0]?.pointBalance;
      }
      if (renewalSuccessful) {
        console.log(`Success: Renewed ${featureName} for ${autoRenew}, user ${id}, new point balance: ${newPointBalance}`);
        const premiumFeatures = await  userHelper._getUserPremiumFeatures(pool, id);
        const event: Events.User.OwnData = {
          type: 'cliUserOwnData',
          data: {
            updatedAt: (updatedAt || new Date()).toISOString(),
            premiumFeatures,
            pointBalance: newPointBalance,
          },
        };
        eventHelper.emit(event, {
          userIds: [id],
        });
      }
      else {
        console.log(`Failure: Feature ${featureName} for ${autoRenew}, user ${id}: Insufficient balance`);
        await pool.query(`
          UPDATE users_premium
          SET "autoRenew" = NULL
          WHERE "userId" = ${format("%L", id)}
            AND "featureName" = ${format("%L", featureName)}
        `);
      }
    }
  }
  catch (e) {
    console.error("Error renewing features", e);
  }
  const duration = Date.now() - startTime;
  const sleepFor = Math.max(0, 60_000 - duration);
  setTimeout(renewFeatures, sleepFor);
}

renewFeatures();
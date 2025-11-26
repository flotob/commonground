// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { isMainThread } from 'worker_threads';
import pool from "../util/postgres";
import config from "../common/config";
import format from "pg-format";

const DEBUG = config.DEPLOYMENT === "dev";

function getMessageValue(ageInDays: number, verified: boolean): number {
  if (ageInDays < 7) {
    return ((14 - ageInDays) / 14) * (verified ? 3 : 1);
  } else {
    return (3.5 / ageInDays) * (verified ? 3 : 1);
  }
}

function getArticleValue(ageInDays: number, verified: boolean): number {
  if (ageInDays < 7) {
    return ((14 - ageInDays) / 14) * (verified ? 15 : 5);
  } else {
    return (3.5 / ageInDays) * (verified ? 15 : 5);
  }
}

export default async function updateActivityScore() {
  const jobStart = Date.now();
  // Update community activity score every full hour
  const communityStats: { id: string, title: string, messages: number, articles: number, score: number }[] = [];

  const communityResult = await pool.query(`
    SELECT
      id,
      title
    FROM communities
  `);
  const communities = communityResult.rows as {
    id: string;
    title: string;
  }[];

  for (const community of communities) {
    let activityScore = 0;

    // Posts
    const messageResult = await pool.query(format(`
      SELECT
        m."createdAt",
        u.id AS "userId",
        ((
          SELECT coalesce(json_agg(up."featureName"), '[]'::json)
          FROM users_premium up
          WHERE up."userId" = u.id
            AND up."activeUntil" > now()
        )) AS "premiumFeatures"
      FROM communities_channels cc
      INNER JOIN messages m
        ON cc."channelId" = m."channelId"
        AND m."deletedAt" IS NULL
      INNER JOIN users u
        ON u.id = m."creatorId"
        AND u."deletedAt" IS NULL
      WHERE cc."communityId" = %L::UUID
        AND cc."deletedAt" IS NULL
      ORDER BY m."createdAt" DESC
      LIMIT 10000
    `, community.id));
    const messages = messageResult.rows as {
      createdAt: string;
      userId: string;
      premiumFeatures: Models.User.PremiumFeatureName[];
    }[];

    const messageDataPerUser: {
      [userId: string]: {
        value: number;
        count: number;
      }
    } = {};
    for (const message of messages) {
      const ageInDays = jobStart - new Date(message.createdAt).getTime();
      if (messageDataPerUser[message.userId] === undefined) {
        messageDataPerUser[message.userId] = { value: 0, count: 0 };
      }
      const divisor = Math.sqrt(++messageDataPerUser[message.userId].count);
      messageDataPerUser[message.userId].value += getMessageValue(ageInDays / (1000*60*60*24), message.premiumFeatures.length > 0) / divisor;
    }
    for (const accountId of Object.keys(messageDataPerUser)) {
      activityScore += messageDataPerUser[accountId].value;
    }

    // Articles
    const articleResult = await pool.query(format(`
      SELECT
        ca.published,
        u."id" as "userId",
        ((
          SELECT coalesce(json_agg(up."featureName"), '[]'::json)
          FROM users_premium up
          WHERE up."userId" = u.id
            AND up."activeUntil" > now()
        )) AS "premiumFeatures"
      FROM communities_articles ca
      INNER JOIN articles a
        ON a.id = ca."articleId"
        AND ca."deletedAt" IS NULL
      INNER JOIN users u
        ON u.id = a."creatorId"
        AND u."deletedAt" IS NULL
      WHERE ca.published <= now()
        AND ca."communityId" = %L::UUID
      ORDER BY ca.published DESC
      LIMIT 100
    `, community.id));
    const articles = articleResult.rows as {
      published: string;
      userId: string;
      premiumFeatures: Models.User.PremiumFeatureName[];
    }[];
    const articleDataPerUser: {
      [userId: string]: {
        value: number;
        count: number;
      }
    } = {};
    for (const article of articles) {
      const ageInDays = jobStart - new Date(article.published).getTime();
      if (articleDataPerUser[article.userId] === undefined) {
        articleDataPerUser[article.userId] = { value: 0, count: 0 };
      }
      const divisor = Math.sqrt(++articleDataPerUser[article.userId].count);
      articleDataPerUser[article.userId].value += getArticleValue(ageInDays / (1000*60*60*24), article.premiumFeatures.length > 0) / divisor;
    }
    for (const accountId of Object.keys(articleDataPerUser)) {
      activityScore += articleDataPerUser[accountId].value;
    }

    await pool.query(format(`
      UPDATE communities
      SET "activityScore" = %s
      WHERE id = %L::UUID
    `, activityScore.toString(), community.id));

    if (DEBUG) {
      communityStats.push({ id: community.id, title: community.title, messages: messages.length, articles: articles.length, score: activityScore });
    }
  }

  if (DEBUG) {
    communityStats.sort((a, b) => a.score - b.score).reverse();
    for (const stat of communityStats) {
      console.log(`${stat.score.toFixed(3)} | ${stat.title} (${stat.id}, ${stat.messages} messages, ${stat.articles} articles)`);
    }
  }
  console.log(`ActivityScore worker finished after ${((Date.now() - jobStart) / 1000).toFixed(2)}s`)
}

if (!isMainThread) {
  // we're in a worker, so we're supposed to run on our own
  (async () => {
    try {
      console.log("Running updateActivityScore job...");
      await updateActivityScore();
      // Todo: do we also need to call globalThis.close?.() here,
      // or does the worker shut down on its own?
    } catch (e) {
      console.error(`Error in ActivityScoreWorker`, e);
      globalThis.close?.();
    }
  })();
}
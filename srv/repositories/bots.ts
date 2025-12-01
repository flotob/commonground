// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import crypto from "crypto";
import * as bcrypt from "bcrypt";
import format from "pg-format";
import errors from "../common/errors";
import pool from "../util/postgres";

// Generate a secure random token
function generateToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

// Generate a webhook secret for HMAC signing
function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString('base64url');
}

// Hash a token using bcrypt
async function hashToken(token: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(token, salt);
}

// Verify a token against a hash
async function verifyToken(token: string, hash: string): Promise<boolean> {
  return bcrypt.compare(token, hash);
}

export type CreateBotData = {
  name: string;
  displayName: string;
  description?: string;
  avatarId?: string;
  webhookUrl?: string;
  permissions?: Record<string, boolean>;
};

export type UpdateBotData = {
  displayName?: string;
  description?: string;
  avatarId?: string;
  webhookUrl?: string;
  permissions?: Record<string, boolean>;
};

export type BotInfo = {
  id: string;
  name: string;
  displayName: string;
  avatarId: string | null;
  description: string | null;
  ownerUserId: string;
  webhookUrl: string | null;
  permissions: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
};

export type BotWithSecrets = BotInfo & {
  webhookSecret: string | null;
  tokenHash: string;
};

class BotHelper {
  /**
   * Create a new bot
   * Returns the bot info along with the plain token (shown once to user)
   */
  public async createBot(
    ownerUserId: string,
    data: CreateBotData
  ): Promise<{ bot: BotInfo; token: string; webhookSecret: string | null }> {
    // Generate token and webhook secret
    const token = generateToken();
    const tokenHash = await hashToken(token);
    const webhookSecret = data.webhookUrl ? generateWebhookSecret() : null;

    const query = `
      INSERT INTO bots (
        "name",
        "displayName",
        "description",
        "avatarId",
        "ownerUserId",
        "webhookUrl",
        "webhookSecret",
        "tokenHash",
        "permissions"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING 
        "id",
        "name",
        "displayName",
        "avatarId",
        "description",
        "ownerUserId",
        "webhookUrl",
        "permissions",
        "createdAt",
        "updatedAt"
    `;

    const result = await pool.query(query, [
      data.name,
      data.displayName,
      data.description || null,
      data.avatarId || null,
      ownerUserId,
      data.webhookUrl || null,
      webhookSecret,
      tokenHash,
      JSON.stringify(data.permissions || {}),
    ]);

    if (result.rowCount === 0) {
      throw new Error(errors.server.INVALID_REQUEST);
    }

    return {
      bot: result.rows[0] as BotInfo,
      token,
      webhookSecret,
    };
  }

  /**
   * Get bot by ID (without secrets)
   */
  public async getBotById(botId: string): Promise<BotInfo | null> {
    const query = `
      SELECT 
        "id",
        "name",
        "displayName",
        "avatarId",
        "description",
        "ownerUserId",
        "webhookUrl",
        "permissions",
        "createdAt",
        "updatedAt"
      FROM bots
      WHERE "id" = $1 AND "deletedAt" IS NULL
    `;

    const result = await pool.query(query, [botId]);
    return result.rows[0] as BotInfo | null;
  }

  /**
   * Get bot by token (for authentication)
   * Returns bot with tokenHash for verification
   */
  public async getBotByTokenHash(tokenHash: string): Promise<BotWithSecrets | null> {
    const query = `
      SELECT 
        "id",
        "name",
        "displayName",
        "avatarId",
        "description",
        "ownerUserId",
        "webhookUrl",
        "webhookSecret",
        "tokenHash",
        "permissions",
        "createdAt",
        "updatedAt"
      FROM bots
      WHERE "tokenHash" = $1 AND "deletedAt" IS NULL
    `;

    const result = await pool.query(query, [tokenHash]);
    return result.rows[0] as BotWithSecrets | null;
  }

  /**
   * Find bot by verifying token against all bots
   * Note: This is O(n) - consider caching in production
   */
  public async authenticateBotByToken(token: string): Promise<BotInfo | null> {
    // Get all active bots with their token hashes
    const query = `
      SELECT 
        "id",
        "name",
        "displayName",
        "avatarId",
        "description",
        "ownerUserId",
        "webhookUrl",
        "permissions",
        "tokenHash",
        "createdAt",
        "updatedAt"
      FROM bots
      WHERE "deletedAt" IS NULL
    `;

    const result = await pool.query(query);

    // Check token against each hash
    for (const row of result.rows) {
      const isValid = await verifyToken(token, row.tokenHash);
      if (isValid) {
        const { tokenHash, ...botInfo } = row;
        return botInfo as BotInfo;
      }
    }

    return null;
  }

  /**
   * Update bot settings
   */
  public async updateBot(
    botId: string,
    ownerUserId: string,
    data: UpdateBotData
  ): Promise<BotInfo> {
    const setClauses: string[] = ['"updatedAt" = NOW()'];
    const params: any[] = [botId, ownerUserId];
    let paramIndex = 3;

    if (data.displayName !== undefined) {
      setClauses.push(`"displayName" = $${paramIndex++}`);
      params.push(data.displayName);
    }
    if (data.description !== undefined) {
      setClauses.push(`"description" = $${paramIndex++}`);
      params.push(data.description);
    }
    if (data.avatarId !== undefined) {
      setClauses.push(`"avatarId" = $${paramIndex++}`);
      params.push(data.avatarId);
    }
    if (data.webhookUrl !== undefined) {
      setClauses.push(`"webhookUrl" = $${paramIndex++}`);
      params.push(data.webhookUrl);
      // Generate new webhook secret if URL is being set
      if (data.webhookUrl) {
        setClauses.push(`"webhookSecret" = $${paramIndex++}`);
        params.push(generateWebhookSecret());
      } else {
        setClauses.push(`"webhookSecret" = NULL`);
      }
    }
    if (data.permissions !== undefined) {
      setClauses.push(`"permissions" = $${paramIndex++}`);
      params.push(JSON.stringify(data.permissions));
    }

    const query = `
      UPDATE bots
      SET ${setClauses.join(', ')}
      WHERE "id" = $1 AND "ownerUserId" = $2 AND "deletedAt" IS NULL
      RETURNING 
        "id",
        "name",
        "displayName",
        "avatarId",
        "description",
        "ownerUserId",
        "webhookUrl",
        "permissions",
        "createdAt",
        "updatedAt"
    `;

    const result = await pool.query(query, params);

    if (result.rowCount === 0) {
      throw new Error(errors.server.NOT_FOUND);
    }

    return result.rows[0] as BotInfo;
  }

  /**
   * Delete bot (soft delete)
   */
  public async deleteBot(botId: string, ownerUserId: string): Promise<void> {
    const query = `
      UPDATE bots
      SET "deletedAt" = NOW(), "updatedAt" = NOW()
      WHERE "id" = $1 AND "ownerUserId" = $2 AND "deletedAt" IS NULL
    `;

    const result = await pool.query(query, [botId, ownerUserId]);

    if (result.rowCount === 0) {
      throw new Error(errors.server.NOT_FOUND);
    }

    // Also remove from all communities
    await pool.query(`
      UPDATE community_bots
      SET "deletedAt" = NOW(), "updatedAt" = NOW()
      WHERE "botId" = $1 AND "deletedAt" IS NULL
    `, [botId]);
  }

  /**
   * Regenerate bot token
   */
  public async regenerateToken(
    botId: string,
    ownerUserId: string
  ): Promise<{ token: string }> {
    const token = generateToken();
    const tokenHash = await hashToken(token);

    const query = `
      UPDATE bots
      SET "tokenHash" = $3, "updatedAt" = NOW()
      WHERE "id" = $1 AND "ownerUserId" = $2 AND "deletedAt" IS NULL
    `;

    const result = await pool.query(query, [botId, ownerUserId, tokenHash]);

    if (result.rowCount === 0) {
      throw new Error(errors.server.NOT_FOUND);
    }

    return { token };
  }

  /**
   * Get all bots owned by a user
   */
  public async getBotsByOwner(ownerUserId: string): Promise<BotInfo[]> {
    const query = `
      SELECT 
        "id",
        "name",
        "displayName",
        "avatarId",
        "description",
        "ownerUserId",
        "webhookUrl",
        "permissions",
        "createdAt",
        "updatedAt"
      FROM bots
      WHERE "ownerUserId" = $1 AND "deletedAt" IS NULL
      ORDER BY "createdAt" DESC
    `;

    const result = await pool.query(query, [ownerUserId]);
    return result.rows as BotInfo[];
  }

  // ============================================
  // Community Bot Functions
  // ============================================

  /**
   * Add bot to a community
   */
  public async addBotToCommunity(
    communityId: string,
    botId: string,
    addedByUserId: string,
    config: Record<string, any> = {},
    enabledChannelIds: string[] | null = null
  ): Promise<void> {
    const query = `
      INSERT INTO community_bots (
        "communityId",
        "botId",
        "addedByUserId",
        "config",
        "enabledChannelIds"
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT ("communityId", "botId") 
      DO UPDATE SET 
        "deletedAt" = NULL,
        "addedByUserId" = EXCLUDED."addedByUserId",
        "config" = EXCLUDED."config",
        "enabledChannelIds" = EXCLUDED."enabledChannelIds",
        "updatedAt" = NOW()
    `;

    await pool.query(query, [
      communityId,
      botId,
      addedByUserId,
      JSON.stringify(config),
      enabledChannelIds,
    ]);
  }

  /**
   * Remove bot from a community
   */
  public async removeBotFromCommunity(
    communityId: string,
    botId: string
  ): Promise<void> {
    const query = `
      UPDATE community_bots
      SET "deletedAt" = NOW(), "updatedAt" = NOW()
      WHERE "communityId" = $1 AND "botId" = $2 AND "deletedAt" IS NULL
    `;

    const result = await pool.query(query, [communityId, botId]);

    if (result.rowCount === 0) {
      throw new Error(errors.server.NOT_FOUND);
    }
  }

  /**
   * Update community bot config
   */
  public async updateCommunityBot(
    communityId: string,
    botId: string,
    config?: Record<string, any>,
    enabledChannelIds?: string[] | null
  ): Promise<void> {
    const setClauses: string[] = ['"updatedAt" = NOW()'];
    const params: any[] = [communityId, botId];
    let paramIndex = 3;

    if (config !== undefined) {
      setClauses.push(`"config" = $${paramIndex++}`);
      params.push(JSON.stringify(config));
    }
    if (enabledChannelIds !== undefined) {
      setClauses.push(`"enabledChannelIds" = $${paramIndex++}`);
      params.push(enabledChannelIds);
    }

    const query = `
      UPDATE community_bots
      SET ${setClauses.join(', ')}
      WHERE "communityId" = $1 AND "botId" = $2 AND "deletedAt" IS NULL
    `;

    const result = await pool.query(query, params);

    if (result.rowCount === 0) {
      throw new Error(errors.server.NOT_FOUND);
    }
  }

  /**
   * Get all bots in a community
   */
  public async getCommunityBots(communityId: string): Promise<(BotInfo & {
    config: Record<string, any>;
    enabledChannelIds: string[] | null;
    addedByUserId: string;
  })[]> {
    const query = `
      SELECT 
        b."id",
        b."name",
        b."displayName",
        b."avatarId",
        b."description",
        b."ownerUserId",
        b."webhookUrl",
        b."permissions",
        b."createdAt",
        b."updatedAt",
        cb."config",
        cb."enabledChannelIds",
        cb."addedByUserId"
      FROM community_bots cb
      JOIN bots b ON b."id" = cb."botId" AND b."deletedAt" IS NULL
      WHERE cb."communityId" = $1 AND cb."deletedAt" IS NULL
      ORDER BY cb."createdAt" DESC
    `;

    const result = await pool.query(query, [communityId]);
    return result.rows;
  }

  /**
   * Check if a bot is in a community
   */
  public async isBotInCommunity(
    botId: string,
    communityId: string
  ): Promise<boolean> {
    const query = `
      SELECT 1 FROM community_bots
      WHERE "botId" = $1 AND "communityId" = $2 AND "deletedAt" IS NULL
    `;

    const result = await pool.query(query, [botId, communityId]);
    return result.rowCount > 0;
  }

  /**
   * Check if bot has access to a specific channel
   */
  public async getBotChannelAccess(
    botId: string,
    communityId: string,
    channelId: string
  ): Promise<{ hasAccess: boolean; bot: BotInfo | null }> {
    const query = `
      SELECT 
        b."id",
        b."name",
        b."displayName",
        b."avatarId",
        b."description",
        b."ownerUserId",
        b."webhookUrl",
        b."permissions",
        b."createdAt",
        b."updatedAt",
        cb."enabledChannelIds"
      FROM community_bots cb
      JOIN bots b ON b."id" = cb."botId" AND b."deletedAt" IS NULL
      WHERE cb."botId" = $1 AND cb."communityId" = $2 AND cb."deletedAt" IS NULL
    `;

    const result = await pool.query(query, [botId, communityId]);

    if (result.rowCount === 0) {
      return { hasAccess: false, bot: null };
    }

    const row = result.rows[0];
    const enabledChannelIds: string[] | null = row.enabledChannelIds;

    // null means all channels are allowed
    // empty array means no channels allowed
    // array with values means only those channels allowed
    const hasAccess = enabledChannelIds === null || enabledChannelIds.includes(channelId);

    const { enabledChannelIds: _, ...botInfo } = row;
    return { hasAccess, bot: botInfo as BotInfo };
  }

  /**
   * Get bot webhook info for sending webhooks
   */
  public async getBotWebhookInfo(botId: string): Promise<{
    webhookUrl: string;
    webhookSecret: string;
  } | null> {
    const query = `
      SELECT "webhookUrl", "webhookSecret"
      FROM bots
      WHERE "id" = $1 AND "deletedAt" IS NULL AND "webhookUrl" IS NOT NULL
    `;

    const result = await pool.query(query, [botId]);
    
    if (result.rowCount === 0 || !result.rows[0].webhookUrl) {
      return null;
    }

    return result.rows[0];
  }

  /**
   * Get all bots in a channel (for webhook delivery)
   */
  public async getBotsInChannel(
    communityId: string,
    channelId: string
  ): Promise<{ id: string; webhookUrl: string; webhookSecret: string }[]> {
    const query = `
      SELECT 
        b."id",
        b."webhookUrl",
        b."webhookSecret"
      FROM community_bots cb
      JOIN bots b ON b."id" = cb."botId" AND b."deletedAt" IS NULL
      WHERE cb."communityId" = $1 
        AND cb."deletedAt" IS NULL
        AND b."webhookUrl" IS NOT NULL
        AND (cb."enabledChannelIds" IS NULL OR $2 = ANY(cb."enabledChannelIds"))
    `;

    const result = await pool.query(query, [communityId, channelId]);
    return result.rows;
  }
}

const botHelper = new BotHelper();
export default botHelper;


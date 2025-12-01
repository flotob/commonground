// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import crypto from "crypto";
import * as bcrypt from "bcrypt";
import format from "pg-format";
import errors from "../common/errors";
import pool from "../util/postgres";
import serverconfig from "../serverconfig";

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
   * channelPermissions: { "channelId": "full_access" | "mentions_only" | "no_access" | "moderator" }
   * Empty object {} means full access to all channels
   */
  public async addBotToCommunity(
    communityId: string,
    botId: string,
    addedByUserId: string,
    config: Record<string, any> = {},
    channelPermissions: Record<string, string> = {}
  ): Promise<void> {
    const query = `
      INSERT INTO community_bots (
        "communityId",
        "botId",
        "addedByUserId",
        "config",
        "channelPermissions"
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT ("communityId", "botId") 
      DO UPDATE SET 
        "deletedAt" = NULL,
        "addedByUserId" = EXCLUDED."addedByUserId",
        "config" = EXCLUDED."config",
        "channelPermissions" = EXCLUDED."channelPermissions",
        "updatedAt" = NOW()
    `;

    await pool.query(query, [
      communityId,
      botId,
      addedByUserId,
      JSON.stringify(config),
      JSON.stringify(channelPermissions),
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
   * Update community bot config or channel permissions
   * channelPermissions: { "channelId": "full_access" | "mentions_only" | "no_access" | "moderator" }
   */
  public async updateCommunityBot(
    communityId: string,
    botId: string,
    config?: Record<string, any>,
    channelPermissions?: Record<string, string>
  ): Promise<void> {
    const setClauses: string[] = ['"updatedAt" = NOW()'];
    const params: any[] = [communityId, botId];
    let paramIndex = 3;

    if (config !== undefined) {
      setClauses.push(`"config" = $${paramIndex++}`);
      params.push(JSON.stringify(config));
    }
    if (channelPermissions !== undefined) {
      setClauses.push(`"channelPermissions" = $${paramIndex++}`);
      params.push(JSON.stringify(channelPermissions));
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
    channelPermissions: Record<string, string>;
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
        cb."channelPermissions",
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
   * Returns the permission level and bot info
   */
  public async getBotChannelAccess(
    botId: string,
    communityId: string,
    channelId: string
  ): Promise<{ hasAccess: boolean; permissionLevel: string; bot: BotInfo | null }> {
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
        cb."channelPermissions"
      FROM community_bots cb
      JOIN bots b ON b."id" = cb."botId" AND b."deletedAt" IS NULL
      WHERE cb."botId" = $1 AND cb."communityId" = $2 AND cb."deletedAt" IS NULL
    `;

    const result = await pool.query(query, [botId, communityId]);

    if (result.rowCount === 0) {
      return { hasAccess: false, permissionLevel: 'no_access', bot: null };
    }

    const row = result.rows[0];
    const channelPermissions: Record<string, string> = row.channelPermissions || {};

    // Get permission for this channel, default to configured default if not specified
    const permissionLevel = channelPermissions[channelId] || serverconfig.BOT_DEFAULT_CHANNEL_PERMISSION;
    const hasAccess = permissionLevel !== 'no_access';

    const { channelPermissions: _, ...botInfo } = row;
    return { hasAccess, permissionLevel, bot: botInfo as BotInfo };
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
   * Returns webhook info for sending events to bots
   * Only returns bots that have access (not 'no_access')
   */
  public async getBotsInChannel(
    communityId: string,
    channelId: string
  ): Promise<{ id: string; webhookUrl: string; webhookSecret: string; permissionLevel: string }[]> {
    // Get all bots in the community with webhooks
    const query = `
      SELECT 
        b."id",
        b."webhookUrl",
        b."webhookSecret",
        cb."channelPermissions"
      FROM community_bots cb
      JOIN bots b ON b."id" = cb."botId" AND b."deletedAt" IS NULL
      WHERE cb."communityId" = $1 
        AND cb."deletedAt" IS NULL
        AND b."webhookUrl" IS NOT NULL
    `;

    const result = await pool.query(query, [communityId]);
    
    // Filter by channel permission in JS (JSONB querying can be tricky)
    return result.rows
      .map(row => {
        const channelPermissions: Record<string, string> = row.channelPermissions || {};
        const permissionLevel = channelPermissions[channelId] || serverconfig.BOT_DEFAULT_CHANNEL_PERMISSION;
        return {
          id: row.id,
          webhookUrl: row.webhookUrl,
          webhookSecret: row.webhookSecret,
          permissionLevel,
        };
      })
      .filter(bot => bot.permissionLevel !== 'no_access');
  }

  /**
   * Get all bots in a channel for UI display (member list, mentions)
   * Returns display info for showing bots to users
   * Only returns bots that have access (not 'no_access')
   */
  public async getChannelBotsForUI(
    communityId: string,
    channelId: string,
    search?: string
  ): Promise<{
    id: string;
    name: string;
    displayName: string;
    avatarId: string | null;
    description: string | null;
    permissionLevel: string;
  }[]> {
    // Get all bots in the community
    let query = `
      SELECT 
        b."id",
        b."name",
        b."displayName",
        b."avatarId",
        b."description",
        cb."channelPermissions"
      FROM community_bots cb
      JOIN bots b ON b."id" = cb."botId" AND b."deletedAt" IS NULL
      WHERE cb."communityId" = $1 
        AND cb."deletedAt" IS NULL
    `;

    const params: string[] = [communityId];

    if (search) {
      query += `
        AND (
          LOWER(b."name") LIKE LOWER($2) || '%'
          OR LOWER(b."displayName") LIKE LOWER($2) || '%'
        )
      `;
      params.push(search);
    }

    query += ` ORDER BY b."displayName" ASC LIMIT 50`;

    const result = await pool.query(query, params);
    
    // Filter by channel permission and map to output format
    return result.rows
      .map(row => {
        const channelPermissions: Record<string, string> = row.channelPermissions || {};
        const permissionLevel = channelPermissions[channelId] || serverconfig.BOT_DEFAULT_CHANNEL_PERMISSION;
        return {
          id: row.id,
          name: row.name,
          displayName: row.displayName,
          avatarId: row.avatarId,
          description: row.description,
          permissionLevel,
        };
      })
      .filter(bot => bot.permissionLevel !== 'no_access');
  }
}

const botHelper = new BotHelper();
export default botHelper;


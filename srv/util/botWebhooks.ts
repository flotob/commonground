// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import crypto from 'crypto';
import pool from './postgres';
import format from 'pg-format';
import urlConfig from './urls';

/**
 * Webhook event types
 */
export type WebhookEventType = 'BOT_MENTIONED';

/**
 * Webhook payload structure
 */
export interface BotWebhookPayload {
  event: WebhookEventType;
  eventId: string;
  timestamp: string;
  apiVersion: '1';
  
  community: {
    id: string;
    name: string;
    url: string;
  };
  
  channel: {
    id: string;
    name: string;
    type: 'text' | 'voice';
    url: string;
  };
  
  message: {
    id: string;
    body: Models.Message.Body;
    attachments: Models.Message.Attachment[];
    createdAt: string;
    replyToMessageId: string | null;
    mentionIndex: number;
  };
  
  sender: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl: string | null;
  };
  
  mentionedBot: {
    id: string;
    name: string;
  };
}

/**
 * Bot mention extracted from message body
 */
export interface ExtractedBotMention {
  botId: string;
  alias?: string;
  index: number;
}

/**
 * Extract all bot mentions from a message body
 */
export function extractBotMentions(body: Models.Message.Body): ExtractedBotMention[] {
  if (!body?.content) return [];
  
  const mentions: ExtractedBotMention[] = [];
  
  body.content.forEach((item, index) => {
    if (item.type === 'botMention') {
      const botMention = item as { type: 'botMention'; botId: string; alias?: string };
      mentions.push({
        botId: botMention.botId,
        alias: botMention.alias,
        index,
      });
    }
  });
  
  return mentions;
}

/**
 * Generate HMAC-SHA256 signature for webhook payload
 */
export function signWebhookPayload(payload: string, timestamp: string, secret: string): string {
  const signatureData = `${timestamp}.${payload}`;
  return crypto
    .createHmac('sha256', secret)
    .update(signatureData)
    .digest('hex');
}

/**
 * Generate a unique event ID
 */
export function generateEventId(): string {
  return `evt_${crypto.randomBytes(16).toString('hex')}`;
}

/**
 * Get bot webhook info by ID
 */
export async function getBotWebhookInfo(botId: string): Promise<{
  id: string;
  name: string;
  displayName: string;
  webhookUrl: string | null;
  webhookSecret: string | null;
} | null> {
  const result = await pool.query(format(`
    SELECT
      id,
      name,
      "displayName",
      "webhookUrl",
      "webhookSecret"
    FROM bots
    WHERE id = %L::UUID
      AND "deletedAt" IS NULL
  `, botId));
  
  return result.rows[0] || null;
}

/**
 * Get channel info for webhook payload
 * Channel data is in communities_channels join table, not channels directly
 */
export async function getChannelInfo(channelId: string): Promise<{
  id: string;
  name: string;
  communityId: string;
} | null> {
  const result = await pool.query(format(`
    SELECT
      cc."channelId" AS id,
      cc."title" AS name,
      cc."communityId"
    FROM communities_channels cc
    WHERE cc."channelId" = %L::UUID
      AND cc."deletedAt" IS NULL
  `, channelId));
  
  const row = result.rows[0];
  if (!row) return null;
  
  return {
    id: row.id,
    name: row.name,
    communityId: row.communityId,
  };
}

/**
 * Get community info for webhook payload
 */
export async function getCommunityInfo(communityId: string): Promise<{
  id: string;
  name: string;
  url: string;
} | null> {
  const result = await pool.query(format(`
    SELECT
      id,
      title AS name,
      url
    FROM communities
    WHERE id = %L::UUID
      AND "deletedAt" IS NULL
  `, communityId));
  
  const row = result.rows[0];
  if (!row) return null;
  
  return {
    id: row.id,
    name: row.name,
    url: `${urlConfig.APP_URL}/c/${row.url}`,
  };
}

/**
 * Get user info for webhook payload
 * User display info is in user_accounts table, linked via displayAccount field
 */
export async function getUserInfo(userId: string): Promise<{
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
} | null> {
  const result = await pool.query(format(`
    SELECT
      u.id,
      ua."displayName",
      ua."imageId"
    FROM users u
    INNER JOIN user_accounts ua
      ON ua."userId" = u.id
      AND ua."type"::text = u."displayAccount"::text
      AND ua."deletedAt" IS NULL
    WHERE u.id = %L::UUID
      AND u."deletedAt" IS NULL
  `, userId));
  
  const row = result.rows[0];
  if (!row) return null;
  
  return {
    id: row.id,
    displayName: row.displayName || 'Anonymous',
    username: row.displayName || '',
    avatarUrl: row.imageId ? `${urlConfig.API_URL}/File/get/${row.imageId}` : null,
  };
}

/**
 * Build the full webhook payload
 */
export async function buildWebhookPayload(
  eventType: WebhookEventType,
  botId: string,
  messageData: {
    id: string;
    body: Models.Message.Body;
    attachments: Models.Message.Attachment[];
    createdAt: string;
    creatorId: string;
    channelId: string;
    communityId: string;
    parentMessageId: string | null;
  },
  mentionIndex: number
): Promise<BotWebhookPayload | null> {
  // Fetch all required data in parallel
  const [bot, community, channel, sender] = await Promise.all([
    getBotWebhookInfo(botId),
    getCommunityInfo(messageData.communityId),
    getChannelInfo(messageData.channelId),
    getUserInfo(messageData.creatorId),
  ]);
  
  if (!bot || !community || !channel || !sender) {
    console.warn('Missing data for webhook payload:', { bot: !!bot, community: !!community, channel: !!channel, sender: !!sender });
    return null;
  }
  
  return {
    event: eventType,
    eventId: generateEventId(),
    timestamp: new Date().toISOString(),
    apiVersion: '1',
    
    community: {
      id: community.id,
      name: community.name,
      url: community.url,
    },
    
    channel: {
      id: channel.id,
      name: channel.name,
      type: 'text', // Bot mentions only work in text channels
      url: `${urlConfig.APP_URL}/c/${community.url.split('/').pop()}/${channel.id}`,
    },
    
    message: {
      id: messageData.id,
      body: messageData.body,
      attachments: messageData.attachments,
      createdAt: messageData.createdAt,
      replyToMessageId: messageData.parentMessageId,
      mentionIndex,
    },
    
    sender: {
      id: sender.id,
      displayName: sender.displayName,
      username: sender.username,
      avatarUrl: sender.avatarUrl,
    },
    
    mentionedBot: {
      id: bot.id,
      name: bot.displayName || bot.name,
    },
  };
}

/**
 * Send webhook to a bot
 * Returns true if successful, false otherwise
 */
export async function sendWebhook(
  webhookUrl: string,
  webhookSecret: string,
  payload: BotWebhookPayload
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  const payloadString = JSON.stringify(payload);
  const timestamp = Date.now().toString();
  const signature = signWebhookPayload(payloadString, timestamp, webhookSecret);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CG-Event': payload.event,
        'X-CG-Signature': `sha256=${signature}`,
        'X-CG-Timestamp': timestamp,
        'X-CG-Event-Id': payload.eventId,
      },
      body: payloadString,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log(`Webhook delivered successfully to ${webhookUrl} (${response.status})`);
      return { success: true, statusCode: response.status };
    } else {
      console.warn(`Webhook delivery failed to ${webhookUrl}: ${response.status}`);
      return { success: false, statusCode: response.status };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Webhook delivery error to ${webhookUrl}:`, errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Process bot mentions in a message and send webhooks
 * This is the main entry point called after message creation
 */
export async function processBotMentionWebhooks(messageData: {
  id: string;
  body: Models.Message.Body;
  attachments: Models.Message.Attachment[];
  createdAt: string;
  creatorId: string;
  channelId: string;
  communityId: string;
  parentMessageId: string | null;
}): Promise<void> {
  const mentions = extractBotMentions(messageData.body);
  
  if (mentions.length === 0) {
    return;
  }
  
  console.log(`Processing ${mentions.length} bot mention(s) in message ${messageData.id}`);
  
  for (const mention of mentions) {
    try {
      // Get bot webhook info
      const bot = await getBotWebhookInfo(mention.botId);
      
      if (!bot) {
        console.warn(`Bot ${mention.botId} not found for webhook delivery`);
        continue;
      }
      
      if (!bot.webhookUrl) {
        console.log(`Bot ${bot.name} has no webhook URL configured, skipping`);
        continue;
      }
      
      if (!bot.webhookSecret) {
        console.warn(`Bot ${bot.name} has no webhook secret, skipping`);
        continue;
      }
      
      // Build payload
      const payload = await buildWebhookPayload(
        'BOT_MENTIONED',
        bot.id,
        messageData,
        mention.index
      );
      
      if (!payload) {
        console.warn(`Failed to build webhook payload for bot ${bot.name}`);
        continue;
      }
      
      // Send webhook (fire and forget for now)
      // In the future, we could queue this for retry on failure
      sendWebhook(bot.webhookUrl, bot.webhookSecret, payload)
        .then(result => {
          if (!result.success) {
            console.warn(`Webhook to ${bot.name} failed:`, result);
            // TODO: Queue for retry
          }
        })
        .catch(err => {
          console.error(`Unexpected error sending webhook to ${bot.name}:`, err);
        });
      
    } catch (error) {
      console.error(`Error processing webhook for bot ${mention.botId}:`, error);
    }
  }
}

export default {
  extractBotMentions,
  signWebhookPayload,
  generateEventId,
  buildWebhookPayload,
  sendWebhook,
  processBotMentionWebhooks,
};


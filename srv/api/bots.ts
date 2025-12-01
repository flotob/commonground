// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import express from "express";
import { registerPostRoute, OK, handleError } from "./util";
import validators from "../validators";
import errors from "../common/errors";
import botHelper, { BotInfo } from "../repositories/bots";
import permissionHelper from "../repositories/permissions";
import userHelper from "../repositories/users";
import messageHelper from "../repositories/messages";
import communityHelper from "../repositories/communities";
import eventHelper from "../repositories/event";
import { CommunityPermission, PredefinedRole } from "../common/enums";
import { authenticateBot } from "../util/botAuth";
import { v4 as uuidv4 } from "uuid";

const botRouter = express.Router();

// ============================================
// Bot Management (requires user session auth)
// ============================================

/**
 * Create a new bot
 * Returns the bot info and token (token shown only once)
 */
registerPostRoute<
  { name: string; displayName: string; description?: string; avatarId?: string; webhookUrl?: string; permissions?: Record<string, boolean> },
  { bot: BotInfo; token: string; webhookSecret: string | null }
>(
  botRouter,
  "/createBot",
  validators.API.Bot.createBot,
  async (request, response, data) => {
    const user = request.session.user;
    if (!user) throw new Error(errors.server.LOGIN_REQUIRED);

    const result = await botHelper.createBot(user.id, {
      name: data.name,
      displayName: data.displayName,
      description: data.description,
      avatarId: data.avatarId,
      webhookUrl: data.webhookUrl,
      permissions: data.permissions,
    });

    return result;
  }
);

/**
 * Get all bots owned by the current user
 */
registerPostRoute<
  {},
  { bots: BotInfo[] }
>(
  botRouter,
  "/getMyBots",
  validators.API.Bot.getMyBots,
  async (request, response, data) => {
    const user = request.session.user;
    if (!user) throw new Error(errors.server.LOGIN_REQUIRED);

    const bots = await botHelper.getBotsByOwner(user.id);
    return { bots };
  }
);

/**
 * Get a specific bot by ID
 */
registerPostRoute<
  { botId: string },
  { bot: BotInfo | null }
>(
  botRouter,
  "/getBotById",
  validators.API.Bot.getBotById,
  async (request, response, data) => {
    const bot = await botHelper.getBotById(data.botId);
    return { bot };
  }
);

/**
 * Update bot settings
 */
registerPostRoute<
  { botId: string; displayName?: string; description?: string; avatarId?: string; webhookUrl?: string; permissions?: Record<string, boolean> },
  { bot: BotInfo }
>(
  botRouter,
  "/updateBot",
  validators.API.Bot.updateBot,
  async (request, response, data) => {
    const user = request.session.user;
    if (!user) throw new Error(errors.server.LOGIN_REQUIRED);

    const bot = await botHelper.updateBot(data.botId, user.id, {
      displayName: data.displayName,
      description: data.description,
      avatarId: data.avatarId,
      webhookUrl: data.webhookUrl,
      permissions: data.permissions,
    });

    return { bot };
  }
);

/**
 * Delete a bot
 */
registerPostRoute<
  { botId: string },
  void
>(
  botRouter,
  "/deleteBot",
  validators.API.Bot.deleteBot,
  async (request, response, data) => {
    const user = request.session.user;
    if (!user) throw new Error(errors.server.LOGIN_REQUIRED);

    await botHelper.deleteBot(data.botId, user.id);
    return;
  }
);

/**
 * Regenerate bot token
 */
registerPostRoute<
  { botId: string },
  { token: string }
>(
  botRouter,
  "/regenerateToken",
  validators.API.Bot.regenerateToken,
  async (request, response, data) => {
    const user = request.session.user;
    if (!user) throw new Error(errors.server.LOGIN_REQUIRED);

    const result = await botHelper.regenerateToken(data.botId, user.id);
    return result;
  }
);

// ============================================
// Community Bot Management (requires admin)
// ============================================

/**
 * Add a bot to a community
 */
registerPostRoute<
  { communityId: string; botId: string; config?: Record<string, any>; channelPermissions?: Record<string, string> },
  void
>(
  botRouter,
  "/addBotToCommunity",
  validators.API.Bot.addBotToCommunity,
  async (request, response, data) => {
    const user = request.session.user;
    if (!user) throw new Error(errors.server.LOGIN_REQUIRED);

    // Check if user has manage channels permission in the community
    await permissionHelper.hasPermissionsOrThrow({
      userId: user.id,
      communityId: data.communityId,
      permissions: [CommunityPermission.COMMUNITY_MANAGE_CHANNELS],
    });

    // Check if bot exists
    const bot = await botHelper.getBotById(data.botId);
    if (!bot) {
      throw new Error(errors.server.NOT_FOUND);
    }

    await botHelper.addBotToCommunity(
      data.communityId,
      data.botId,
      user.id,
      data.config || {},
      data.channelPermissions || {}
    );

    return;
  }
);

/**
 * Remove a bot from a community
 */
registerPostRoute<
  { communityId: string; botId: string },
  void
>(
  botRouter,
  "/removeBotFromCommunity",
  validators.API.Bot.removeBotFromCommunity,
  async (request, response, data) => {
    const user = request.session.user;
    if (!user) throw new Error(errors.server.LOGIN_REQUIRED);

    // Check if user has manage channels permission in the community
    await permissionHelper.hasPermissionsOrThrow({
      userId: user.id,
      communityId: data.communityId,
      permissions: [CommunityPermission.COMMUNITY_MANAGE_CHANNELS],
    });

    await botHelper.removeBotFromCommunity(data.communityId, data.botId);
    return;
  }
);

/**
 * Update a bot's configuration in a community
 */
registerPostRoute<
  { communityId: string; botId: string; config?: Record<string, any>; channelPermissions?: Record<string, string> },
  void
>(
  botRouter,
  "/updateCommunityBot",
  validators.API.Bot.updateCommunityBot,
  async (request, response, data) => {
    const user = request.session.user;
    if (!user) throw new Error(errors.server.LOGIN_REQUIRED);

    // Check if user has manage channels permission in the community
    await permissionHelper.hasPermissionsOrThrow({
      userId: user.id,
      communityId: data.communityId,
      permissions: [CommunityPermission.COMMUNITY_MANAGE_CHANNELS],
    });

    await botHelper.updateCommunityBot(
      data.communityId,
      data.botId,
      data.config,
      data.channelPermissions
    );

    return;
  }
);

/**
 * Get all bots in a community
 */
registerPostRoute<
  { communityId: string },
  { bots: (BotInfo & { config: Record<string, any>; channelPermissions: Record<string, string>; addedByUserId: string })[] }
>(
  botRouter,
  "/getCommunityBots",
  validators.API.Bot.getCommunityBots,
  async (request, response, data) => {
    const user = request.session.user;
    if (!user) throw new Error(errors.server.LOGIN_REQUIRED);

    // Check if user is a member of the community
    const isMember = await userHelper.isUserMemberOfCommunity({
      userId: user.id,
      communityId: data.communityId,
    });
    if (!isMember) {
      throw new Error(errors.server.NOT_ALLOWED);
    }

    const bots = await botHelper.getCommunityBots(data.communityId);
    return { bots };
  }
);

/**
 * Get bots available in a specific channel
 * Used for member list sidebar and mention autocomplete
 * Requires user to be a member of the community
 */
registerPostRoute<
  { communityId: string; channelId: string; search?: string },
  { bots: { id: string; name: string; displayName: string; avatarId: string | null; description: string | null }[] }
>(
  botRouter,
  "/getChannelBots",
  validators.API.Bot.getChannelBots,
  async (request, response, data) => {
    const user = request.session.user;
    if (!user) throw new Error(errors.server.LOGIN_REQUIRED);

    // Check if user is a member of the community
    const isMember = await userHelper.isUserMemberOfCommunity({
      userId: user.id,
      communityId: data.communityId,
    });
    if (!isMember) {
      throw new Error(errors.server.NOT_ALLOWED);
    }

    const bots = await botHelper.getChannelBotsForUI(
      data.communityId,
      data.channelId,
      data.search
    );
    return { bots };
  }
);

// ============================================
// Bot Actions (requires bot auth)
// ============================================

// Helper to emit message events to community channel
async function emitBotMessageEvent(
  event: Events.Message.Message,
  communityId: string,
  channelId: string
) {
  const channelRolePermissions = await communityHelper.getCommunityChannelRolePermissions(communityId, channelId);
  const notifyRoles = channelRolePermissions.filter(d => (
    d.permissions.includes("CHANNEL_EXISTS") &&
    d.permissions.includes("CHANNEL_READ")
  ));
  const publicRole = notifyRoles.find(d => d.roleTitle === PredefinedRole.Public);
  
  if (!!publicRole) {
    eventHelper.emit(event, {
      communityIds: [communityId],
    });
  } else {
    eventHelper.emit(event, {
      roleIds: notifyRoles.map(d => d.roleId),
    });
  }
}

// Bot send message endpoint - handled separately with bot authentication
botRouter.post('/sendMessage', express.json(), authenticateBot, async (request, response) => {
  try {
    const data = await validators.API.Bot.sendMessage.validateAsync(request.body);
    const bot = request.bot!;

    // Check if bot has access to the channel
    const { hasAccess } = await botHelper.getBotChannelAccess(
      bot.id,
      data.communityId,
      data.channelId
    );

    if (!hasAccess) {
      response.status(403).json({
        error: errors.server.NOT_ALLOWED,
        message: 'Bot does not have access to this channel.',
      });
      return;
    }

    // Create the message
    const messageId = uuidv4();
    const { message } = await messageHelper.createBotMessage(bot.id, {
      id: messageId,
      channelId: data.channelId,
      body: data.body,
      attachments: data.attachments || [],
      parentMessageId: data.replyToMessageId || null,
    });

    // Emit WebSocket event so the message appears in real-time
    const event: Events.Message.Message = {
      type: "cliMessageEvent",
      action: "new",
      data: message,
    };
    await emitBotMessageEvent(event, data.communityId, data.channelId);

    response.send({
      ...OK,
      data: {
        message,
      },
    });
  } catch (e) {
    handleError(response, e);
  }
});

// Bot edit message endpoint
botRouter.post('/editMessage', express.json(), authenticateBot, async (request, response) => {
  try {
    const data = await validators.API.Bot.editMessage.validateAsync(request.body);
    const bot = request.bot!;

    // Check if bot has access to the channel
    const { hasAccess } = await botHelper.getBotChannelAccess(
      bot.id,
      data.communityId,
      data.channelId
    );

    if (!hasAccess) {
      response.status(403).json({
        error: errors.server.NOT_ALLOWED,
        message: 'Bot does not have access to this channel.',
      });
      return;
    }

    // TODO: Implement message editing
    response.send({
      ...OK,
      data: {
        message: 'Message editing will be implemented in a future step.',
      },
    });
  } catch (e) {
    handleError(response, e);
  }
});

// Bot delete message endpoint
botRouter.post('/deleteMessage', express.json(), authenticateBot, async (request, response) => {
  try {
    const data = await validators.API.Bot.deleteMessage.validateAsync(request.body);
    const bot = request.bot!;

    // Check if bot has access to the channel
    const { hasAccess } = await botHelper.getBotChannelAccess(
      bot.id,
      data.communityId,
      data.channelId
    );

    if (!hasAccess) {
      response.status(403).json({
        error: errors.server.NOT_ALLOWED,
        message: 'Bot does not have access to this channel.',
      });
      return;
    }

    // TODO: Implement message deletion
    response.send({
      ...OK,
      data: {
        message: 'Message deletion will be implemented in a future step.',
      },
    });
  } catch (e) {
    handleError(response, e);
  }
});

// Bot get messages endpoint
botRouter.post('/getMessages', express.json(), authenticateBot, async (request, response) => {
  try {
    const data = await validators.API.Bot.getMessages.validateAsync(request.body);
    const bot = request.bot!;

    // Check if bot has access to the channel
    const { hasAccess } = await botHelper.getBotChannelAccess(
      bot.id,
      data.communityId,
      data.channelId
    );

    if (!hasAccess) {
      response.status(403).json({
        error: errors.server.NOT_ALLOWED,
        message: 'Bot does not have access to this channel.',
      });
      return;
    }

    // TODO: Implement message retrieval
    response.send({
      ...OK,
      data: {
        messages: [],
        message: 'Message retrieval will be implemented in a future step.',
      },
    });
  } catch (e) {
    handleError(response, e);
  }
});

// Bot get channel info endpoint
botRouter.post('/getChannelInfo', express.json(), authenticateBot, async (request, response) => {
  try {
    const data = await validators.API.Bot.getChannelInfo.validateAsync(request.body);
    const bot = request.bot!;

    // Check if bot has access to the channel
    const { hasAccess } = await botHelper.getBotChannelAccess(
      bot.id,
      data.communityId,
      data.channelId
    );

    if (!hasAccess) {
      response.status(403).json({
        error: errors.server.NOT_ALLOWED,
        message: 'Bot does not have access to this channel.',
      });
      return;
    }

    // TODO: Implement channel info retrieval
    response.send({
      ...OK,
      data: {
        channel: null,
        message: 'Channel info retrieval will be implemented in a future step.',
      },
    });
  } catch (e) {
    handleError(response, e);
  }
});

export default botRouter;


// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import Joi from "joi";
import common from "../common";
import { messageContentV1Validator } from "../content";

// Bot name: alphanumeric, underscores, hyphens, 3-100 chars
const BotName = Joi.string().regex(/^[a-zA-Z0-9_-]{3,100}$/).required();

// Bot display name: 1-100 chars
const BotDisplayName = Joi.string().min(1).max(100).required();

// Bot description: optional, max 1000 chars
const BotDescription = Joi.string().max(1000).allow('', null);

// Webhook URL: required for bot creation, must be valid URL
const WebhookUrl = Joi.string().uri({ scheme: ['https', 'http'] }).max(512);
const WebhookUrlOptional = Joi.string().uri({ scheme: ['https', 'http'] }).max(512).allow(null);

// Bot permissions object
const BotPermissions = Joi.object().pattern(
  Joi.string(),
  Joi.boolean()
).default({});

// Attachment validators (reused from message validator)
const linkPreviewAttachmentValidator = Joi.object({
  type: Joi.equal("linkPreview").required(),
  title: Joi.string().required(),
  description: Joi.string().required().allow(""),
  imageId: Joi.string().required().allow(""),
  url: Joi.string().required(),
}).strict(true);

const imageAttachmentValidator = Joi.object({
  type: Joi.equal("image").required(),
  imageId: common.ImageId.required(),
  largeImageId: common.ImageId.required(),
}).strict(true);

const giphyAttachmentValidator = Joi.object({
  type: Joi.equal("giphy").required(),
  gifId: Joi.string().required(),
  previewWidth: Joi.number().integer().min(50).max(600).required(),
  previewHeight: Joi.number().equal(200).required(),
}).strict(true);

const attachmentValidator = Joi.alternatives().try(
  imageAttachmentValidator,
  linkPreviewAttachmentValidator,
  giphyAttachmentValidator,
);

const botApi = {
  // ==========================================
  // Bot Management (requires user auth)
  // ==========================================

  createBot: Joi.object({
    name: BotName,
    displayName: BotDisplayName,
    description: BotDescription,
    avatarId: Joi.alternatives().try(common.ImageId, Joi.equal(null)),
    webhookUrl: WebhookUrl.required(),  // Required for bot creation
    permissions: BotPermissions,
  }).strict(true).required(),

  updateBot: Joi.object({
    botId: common.Uuid.required(),
    displayName: Joi.string().min(1).max(100),
    description: BotDescription,
    avatarId: Joi.alternatives().try(common.ImageId, Joi.equal(null)),
    webhookUrl: WebhookUrlOptional,  // Optional for updates
    permissions: BotPermissions,
  }).strict(true).required(),

  deleteBot: Joi.object({
    botId: common.Uuid.required(),
  }).strict(true).required(),

  regenerateToken: Joi.object({
    botId: common.Uuid.required(),
  }).strict(true).required(),

  getMyBots: Joi.object({}).strict(true).required(),

  getBotById: Joi.object({
    botId: common.Uuid.required(),
  }).strict(true).required(),

  // ==========================================
  // Community Bot Management (requires admin)
  // ==========================================

  addBotToCommunity: Joi.object({
    communityId: common.Uuid.required(),
    botId: common.Uuid.required(),
    config: Joi.object().default({}),
    // channelPermissions: { "channelId": "full_access" | "mentions_only" | "no_access" | "moderator" }
    // Empty object means full access to all channels
    channelPermissions: Joi.object().pattern(
      common.Uuid,
      Joi.string().valid('no_access', 'mentions_only', 'full_access', 'moderator')
    ).default({}),
  }).strict(true).required(),

  removeBotFromCommunity: Joi.object({
    communityId: common.Uuid.required(),
    botId: common.Uuid.required(),
  }).strict(true).required(),

  updateCommunityBot: Joi.object({
    communityId: common.Uuid.required(),
    botId: common.Uuid.required(),
    config: Joi.object(),
    // channelPermissions: { "channelId": "full_access" | "mentions_only" | "no_access" | "moderator" }
    channelPermissions: Joi.object().pattern(
      common.Uuid,
      Joi.string().valid('no_access', 'mentions_only', 'full_access', 'moderator')
    ),
  }).strict(true).required(),

  getCommunityBots: Joi.object({
    communityId: common.Uuid.required(),
  }).strict(true).required(),

  getChannelBots: Joi.object({
    communityId: common.Uuid.required(),
    channelId: common.Uuid.required(),
    search: Joi.string().max(100),  // Optional: filter by name/displayName
  }).strict(true).required(),

  // ==========================================
  // Bot Actions (requires bot auth)
  // ==========================================

  sendMessage: Joi.object({
    communityId: common.Uuid.required(),
    channelId: common.Uuid.required(),
    body: Joi.object({
      version: Joi.equal('1'),
      content: messageContentV1Validator,
    }).required(),
    attachments: Joi.array().items(attachmentValidator).default([]),
    replyToMessageId: Joi.alternatives().try(common.Uuid, Joi.equal(null)).default(null),
  }).strict(true).required(),

  editMessage: Joi.object({
    communityId: common.Uuid.required(),
    channelId: common.Uuid.required(),
    messageId: common.Uuid.required(),
    body: Joi.object({
      version: Joi.equal('1'),
      content: messageContentV1Validator,
    }),
    attachments: Joi.array().items(attachmentValidator),
  }).strict(true).required(),

  deleteMessage: Joi.object({
    communityId: common.Uuid.required(),
    channelId: common.Uuid.required(),
    messageId: common.Uuid.required(),
  }).strict(true).required(),

  getMessages: Joi.object({
    communityId: common.Uuid.required(),
    channelId: common.Uuid.required(),
    limit: Joi.number().integer().min(1).max(100).default(50),
    before: Joi.alternatives().try(common.Uuid, common.DateString),
    after: Joi.alternatives().try(common.Uuid, common.DateString),
  }).strict(true).required(),

  getChannelInfo: Joi.object({
    communityId: common.Uuid.required(),
    channelId: common.Uuid.required(),
  }).strict(true).required(),
};

export default botApi;


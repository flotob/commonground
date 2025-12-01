// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { Request, Response, NextFunction } from 'express';
import botHelper, { BotInfo } from '../repositories/bots';
import errors from '../common/errors';

// Extend Express Request to include bot info
declare global {
  namespace Express {
    interface Request {
      bot?: BotInfo;
    }
  }
}

/**
 * Extract bot token from Authorization header
 * Format: "Bot <token>"
 */
function extractBotToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bot') {
    return null;
  }
  
  return parts[1];
}

/**
 * Middleware to authenticate bot requests
 * Requires "Authorization: Bot <token>" header
 * Sets req.bot if authentication succeeds
 */
export async function authenticateBot(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractBotToken(req.headers.authorization);
    
    if (!token) {
      res.status(401).json({
        error: errors.server.LOGIN_REQUIRED,
        message: 'Bot authentication required. Use "Authorization: Bot <token>" header.',
      });
      return;
    }
    
    const bot = await botHelper.authenticateBotByToken(token);
    
    if (!bot) {
      res.status(401).json({
        error: errors.server.NOT_ALLOWED,
        message: 'Invalid bot token.',
      });
      return;
    }
    
    // Attach bot to request
    req.bot = bot;
    next();
  } catch (error) {
    console.error('Bot authentication error:', error);
    res.status(500).json({
      error: errors.server.UNKNOWN,
      message: 'Authentication failed.',
    });
  }
}

/**
 * Middleware to optionally authenticate bot requests
 * If Authorization header is present and starts with "Bot ", validates it
 * Otherwise continues without bot context
 */
export async function optionalBotAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    // Only process if it looks like a bot token
    if (authHeader && authHeader.startsWith('Bot ')) {
      const token = extractBotToken(authHeader);
      
      if (token) {
        const bot = await botHelper.authenticateBotByToken(token);
        if (bot) {
          req.bot = bot;
        }
      }
    }
    
    next();
  } catch (error) {
    console.error('Optional bot authentication error:', error);
    // Continue anyway for optional auth
    next();
  }
}

/**
 * Check if the bot has access to a specific community channel
 */
export async function checkBotChannelAccess(
  botId: string,
  communityId: string,
  channelId: string
): Promise<{ hasAccess: boolean; bot: BotInfo | null }> {
  return botHelper.getBotChannelAccess(botId, communityId, channelId);
}

/**
 * Verify bot has access to a channel, throw if not
 */
export async function requireBotChannelAccess(
  botId: string,
  communityId: string,
  channelId: string
): Promise<BotInfo> {
  const { hasAccess, bot } = await botHelper.getBotChannelAccess(
    botId,
    communityId,
    channelId
  );
  
  if (!hasAccess || !bot) {
    throw new Error(errors.server.NOT_ALLOWED);
  }
  
  return bot;
}


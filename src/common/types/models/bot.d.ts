// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

declare namespace Models {
  namespace Bot {
    /**
     * Permission levels for bots in channels
     * - no_access: Bot cannot see or interact with channel
     * - mentions_only: Bot only receives events when mentioned
     * - full_access: Bot receives all message events
     * - moderator: Bot can also moderate (delete messages, ban users)
     */
    type BotChannelPermissionLevel = 
      | 'no_access' 
      | 'mentions_only' 
      | 'full_access' 
      | 'moderator';
    
    /**
     * Per-channel permissions for a bot in a community
     * Key: channelId, Value: permission level
     * Missing channels = no_access (default)
     */
    type ChannelPermissions = Record<string, BotChannelPermissionLevel>;
  }
}


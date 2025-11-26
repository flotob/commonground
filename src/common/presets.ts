// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { ArticlePermission, ChannelPermission, CommunityPermission } from "./enums";

export const rolePermissionPresets = {
    Community: {
        Public: [],
        Member: [
            CommunityPermission.WEBRTC_CREATE,
        ],
        Editor: [
            CommunityPermission.COMMUNITY_MANAGE_ARTICLES,

            CommunityPermission.WEBRTC_CREATE,
        ],
        Moderator: [
            CommunityPermission.COMMUNITY_MODERATE,

            CommunityPermission.WEBRTC_CREATE,
            CommunityPermission.WEBRTC_MODERATE,
        ],
        Admin: [
            CommunityPermission.COMMUNITY_MANAGE_INFO,
            CommunityPermission.COMMUNITY_MANAGE_CHANNELS,
            CommunityPermission.COMMUNITY_MANAGE_ROLES,
            CommunityPermission.COMMUNITY_MANAGE_ARTICLES,
            CommunityPermission.COMMUNITY_MANAGE_USER_APPLICATIONS,
            CommunityPermission.COMMUNITY_MODERATE,
            
            CommunityPermission.WEBRTC_CREATE,
            CommunityPermission.WEBRTC_CREATE_CUSTOM,
            CommunityPermission.WEBRTC_MODERATE,

            CommunityPermission.COMMUNITY_MANAGE_EVENTS,
        ],
    },
    Channel: {
        Public: [
            ChannelPermission.CHANNEL_EXISTS,
            ChannelPermission.CHANNEL_READ,
        ],
        Member: [
            ChannelPermission.CHANNEL_EXISTS,
            ChannelPermission.CHANNEL_READ,
            ChannelPermission.CHANNEL_WRITE,
        ],
        Editor: [
            ChannelPermission.CHANNEL_EXISTS,
            ChannelPermission.CHANNEL_READ,
            ChannelPermission.CHANNEL_WRITE,
        ],
        Moderator: [
            ChannelPermission.CHANNEL_EXISTS,
            ChannelPermission.CHANNEL_READ,
            ChannelPermission.CHANNEL_WRITE,
            ChannelPermission.CHANNEL_MODERATE,
        ],
        Admin: [
            ChannelPermission.CHANNEL_EXISTS,
            ChannelPermission.CHANNEL_READ,
            ChannelPermission.CHANNEL_WRITE,
            ChannelPermission.CHANNEL_MODERATE,
        ],
    },
    Article: {
        Visible: [
            ArticlePermission.ARTICLE_PREVIEW,
            ArticlePermission.ARTICLE_READ,
        ],
    },
};
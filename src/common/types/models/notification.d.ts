// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

declare namespace Models {
  namespace Notification {
    type Type = 'Follower' | 'Mention' | 'Reply' | 'BanState' | 'DM' | 'ChannelMessage' | 'Call' | 'Approval' | 'General'; // | 'Announcement' | 'Airdrop' | 'Article' | 'Event' | 'Reminder'

    type ChannelData = {
      type: 'channelData';
      channelId: string;
    };

    type ChannelDetailData = {
      type: 'channelDetailData';
      channelId: string;
      channelUrl: string;
      channelTitle: string;
      communityId: string;
      communityUrl: string;
      communityTitle: string;
    };

    type ChatData = {
      type: 'chatData';
      chatId: string;
      channelId: string;
    }

    type CallData = {
      type: 'callData';
      callId: string;
      callTitle: string;
      channelId: string;
      communityUrl: string;
      communityTitle: string;
    }

    type ApprovalData = {
      type: 'approvalData';
      communityUrl: string;
      approved: boolean;
      channelId: string;
    }

    type GeneralData = {
      type: 'generalData';
      navUrl: string;
      iconUrlRelative?: string;
      title: string;
      channelId?: string; // only to not break other types
    }

    type ArticleData = {
      type: 'articleData';
      articleId: string;
      articleTitle: string;
      articleOwner: {
        type: 'user';
        userId: string;
      } | {
        type: 'community';
        communityId: string;
      }
      channelId?: string; // only to not break other types
    }

    type ExtraData = {
      userAlias?: string;
    } & (
      ChannelData |
      ChannelDetailData |
      ChatData |
      CallData |
      ApprovalData |
      GeneralData |
      ArticleData
    );

    type PushSubscription = {
      endpoint: string;
      expirationTime?: number | null;
      keys: {
        auth: string;
        p256dh: string;
      };
    }
    
    type Notification = {
      type: Type;
      id: string;
      text: string;
      createdAt: Date;
      updatedAt: Date;
      read: boolean;
      subjectItemId: string | null;
      subjectCommunityId: string | null;
      subjectUserId: string | null;
      subjectArticleId: string | null;
      extraData: ExtraData | null;
    }

    type ApiNotification = Omit<Notification, "createdAt" | "updatedAt"> & {
      createdAt: string;
      updatedAt: string;
    }
  }
}
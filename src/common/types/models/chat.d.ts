// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

declare namespace Models {
  namespace Chat {
    type Chat = {
      id: string;
      channelId: string;
      userIds: string[];
      adminIds: string[];
      createdAt: string;
      updatedAt: string;
      unread?: number;
      lastRead: string;
      lastMessage: Models.Message.Message | null;
    }

    type ChatFromApi = Omit<Chat, "lastMessage"> & {
      lastMessage: Models.Message.ApiMessage | null;
    }
  }
}
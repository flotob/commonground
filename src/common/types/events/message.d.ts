// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

declare namespace Events {
  namespace Message {
    type Message = {
      type: 'cliMessageEvent';
    } & ({
      action: 'new';
      data: Models.Message.ApiMessage;
    } | {
      action: 'update';
      data:
        Pick<Models.Message.ApiMessage, "id" | "channelId" | "updatedAt">
        & Partial<Pick<Models.Message.ApiMessage, "body" | "attachments" | "parentMessageId" | "reactions">>;
    } | {
      action: 'delete';
      data: {
        channelId: string;
        deletedIds: string[];
      };
    });

    type Event = (
      Message
    );
  }
}
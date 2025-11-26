// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

declare global {
    namespace API {
        namespace Messages {
            type MessageAccess = {
                channelId: string;
                communityId: string;
            } | {
                channelId: string;
                chatId: string;
            } | {
                channelId: string;
                callId: string;
            } | {
                channelId: string;
                articleId: string;
                articleCommunityId: string;
            } | {
                channelId: string;
                articleId: string;
                articleUserId: string;
            };

            namespace createMessage {
                type Request = {
                    id: string;
                    access: MessageAccess;
                    body: Models.Message.Body;
                    parentMessageId: string | null;
                    attachments: Models.Message.Attachment[];
                };
                type Response = Models.Message.ApiMessage;
            }

            namespace editMessage {
                type Request = {
                    access: MessageAccess;
                    id: string;
                    body?: Models.Message.Body;
                    attachments?: Models.Message.Attachment[];
                    parentMessageId?: string | null;
                };
                type Response = {
                    editedAt: string;
                    attachments?: Models.Message.Attachment[];
                };
            }

            namespace deleteMessage {
                type Request = {
                    access: MessageAccess;
                    messageId: string;
                    creatorId: string;
                };
                type Response = void;
            }

            namespace deleteAllUserMessages {
                type Request = {
                    access: MessageAccess;
                    creatorId: string;
                }
                type Response = void;
            }

            namespace loadMessages {
                type Request = {
                    access: MessageAccess;
                    order?: 'ASC' | 'DESC';
                    createdBefore?: string;
                    createdAfter?: string;
                };
                type Response = Models.Message.ApiMessage[];
            }

            namespace messagesById {
                type Request = {
                    access: MessageAccess;
                    messageIds: string[];
                };
                type Response = Models.Message.ApiMessage[];
            }

            namespace loadUpdates {
                type Request = {
                    access: MessageAccess;
                    createdStart: string;
                    createdEnd: string;
                    updatedAfter: string;
                };
                type Response = {
                    updated: Models.Message.ApiMessage[];
                    deleted: string[];
                };
            }

            namespace setReaction {
                type Request = {
                    access: MessageAccess;
                    messageId: string;
                    reaction: string;
                }
                type Response = void;
            }

            namespace unsetReaction {
                type Request = {
                    access: MessageAccess;
                    messageId: string;
                }
                type Response = void;
            }

            namespace setChannelLastRead {
                type Request = {
                    access: MessageAccess;
                    lastRead: string;
                }
                type Response = void;
            }

            namespace getUrlPreview {
                type Request = {
                    url: string;
                }
                type Response = {
                    title: string;
                    description: string;
                    imageId: string;
                    url: string;
                }
            }

            namespace joinArticleEventRoom {
                type Request = {
                    access: MessageAccess;
                }
                type Response = void;
            }

            namespace leaveArticleEventRoom {
                type Request = {
                    access: MessageAccess;
                }
                type Response = void;
            }
        }
    }
}

export { };
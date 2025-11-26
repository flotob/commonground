// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

declare global {
    namespace API {
        namespace Notification {
            namespace loadNotifications {
                type Request = {
                    order?: 'ASC' | 'DESC';
                    createdBefore?: string;
                    createdAfter?: string;
                    unreadOnly?: boolean;
                };
                type Response = Models.Notification.ApiNotification[];
            }

            namespace loadUpdates {
                type Request = {
                    createdStart: string;
                    createdEnd: string;
                    updatedAfter: string;
                };
                type Response = {
                    updated: Models.Notification.ApiNotification[];
                    deleted: string[];
                };
            }

            namespace getUnreadCount {
                type Request = undefined;
                type Response = number;
            }

            namespace markAsRead {
                type Request = {
                    notificationId: string;
                };
                type Response = void;
            }

            namespace markAllAsRead {
                type Request = undefined;
                type Response = void;
            }

            namespace getPublicVapidKey {
                type Request = undefined;
                type Response = string;
            }

            namespace registerWebPushSubscription {
                type Request = Models.Notification.PushSubscription;
                type Response = void;
            }

            namespace unregisterWebPushSubscription {
                type Request = undefined;
                type Response = void;
            }

            namespace channelPushNotificationClosed {
                type Request = {
                    channelId: string;
                };
                type Response = void;
            }
        }
    }
}

export { };
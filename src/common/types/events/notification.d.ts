// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

declare namespace Events {
  namespace Notification {
    type Notification = {
      type: 'cliNotificationEvent';
    } & ({
      action: 'new';
      data: Models.Notification.ApiNotification;
    } | {
      action: 'update';
      data: (
        Pick<Models.Notification.ApiNotification, "id" | "updatedAt"> &
        Partial<Omit<Models.Notification.ApiNotification, "createdAt" | "updatedAt">>
      );
    } | {
      action: 'allread';
      data: {
        updatedAt: string;
      };
    } | {
      action: 'delete';
      id: string | string[];
    });

    type Event = (
      Notification
    );
  }
}
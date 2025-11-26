// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import connectionManager from "../appstate/connection";
import notificationsApi from "data/api/notifications";
import ChunkedItemDatabase from "./channel/chunkedDatabase";
import config from "common/config";
import errors from "common/errors";

class NotificationDatabase {
  private db: ChunkedItemDatabase<Models.Notification.Notification>;
  private __unreadCount = 0;

  public get unreadCount() {
    return this.__unreadCount;
  }
  public set unreadCount(value: number) {
    this.__unreadCount = value;
    this.onunreadcountchange(this.__unreadCount);
  }

  public onunreadcountchange: (value: number) => void = () => undefined;

  constructor() {
    connectionManager.registerClientEventHandler(
      "cliConnectionEstablished",
      event => {
        
      }
    );
    connectionManager.registerClientEventHandler(
      "cliConnectionLost",
      event => {
        
      }
    );
    connectionManager.registerClientEventHandler(
      "cliConnectionRestored",
      event => {
        
      }
    );

    const notificationEventHandler = (event: Events.Notification.Notification) => {
      if (event.action === "new") {
        const notification = this.apiNotificationToNotification(event.data);
        this.db.addNewItem(notification);
        this.unreadCount++;
      }
      else if (event.action === "update") {
        const notificationData = event.data;
        if (notificationData.read === true) {
          this.unreadCount--;
        }
        this.db.updateItems([{
          ...notificationData,
          updatedAt: new Date(notificationData.updatedAt),
        }]);
      }
      else if (event.action === "delete") {
        this.db.deleteItems(Array.isArray(event.id) ? event.id : [event.id]);
      }
    };
    connectionManager.registerClientEventHandler(
      "cliNotificationEvent",
      notificationEventHandler,
    );

    this.db = new ChunkedItemDatabase<Models.Notification.Notification>({
      databaseName: 'notifications',
    });
  }

  public async markAsRead(notificationId: string) {
    await this.db.updateItems([{
      id: notificationId,
      read: true,
    }]);
    try {
      await notificationsApi.markAsRead({
        notificationId
      });
    }
    catch (e) {
      console.error("Could not mark notification as read", e);
      await this.db.updateItems([{
        id: notificationId,
        read: false,
      }]);
    }
  }

  protected onConnectionLoss(lastKnownConnectionTime: number): void {
    
  }

  protected onConnectionRestored(): void {

  }

  private apiNotificationToNotification(apiNotification: Models.Notification.ApiNotification): Models.Notification.Notification {
    const { createdAt, updatedAt, ...newItem } = apiNotification;
    return {
      ...newItem,
      createdAt: new Date(createdAt),
      updatedAt: new Date(updatedAt),
    };
  }

  public async loadItems({ order, createdBefore, createdAfter }: { order?: "ASC" | "DESC", createdBefore?: Date, createdAfter?: Date }) {
    if ((order === "ASC" && !!createdBefore) || (order === "DESC" && !!createdAfter)) {
      throw new Error("Invalid parameters");
    }
    const notifications = await notificationsApi.loadNotifications({
      order,
      createdAfter: !!createdAfter ? createdAfter.toISOString() : undefined,
      createdBefore: !!createdBefore ? createdBefore.toISOString() : undefined,
    });

    // if only one of createdBefore or createdAfter is set, we need to set endOfList or startOfList,
    // otherwise ITEMLIST_BATCH_SIZE is not a reliable indicator for start or end of list
    let isStartOfList = false, isEndOfList = false;
    if (!createdBefore && !createdAfter) {
      if (order === "DESC") {
        isEndOfList = true;
        if (notifications.length < config.ITEMLIST_BATCH_SIZE) {
          isStartOfList = true;
        }
      }
      else if (order === "ASC") {
        isStartOfList = true;
        if (notifications.length < config.ITEMLIST_BATCH_SIZE) {
          isEndOfList = true;
        }
      }
    }
    else if (!createdBefore || !createdAfter) {
      if (!!createdBefore && notifications.length < config.ITEMLIST_BATCH_SIZE) {
        isStartOfList = true;
      }
      else if (!!createdAfter && notifications.length < config.ITEMLIST_BATCH_SIZE) {
        isEndOfList = true;
      }
    }
    const dbMessages = notifications.map(this.apiNotificationToNotification);
    
    await this.db.addCompleteItemRange(dbMessages, { isStartOfList, isEndOfList, createdBefore, createdAfter });
  };

  public async loadUpdates({ updatedAfter, createdEnd, createdStart }: { updatedAfter: Date, createdEnd: Date, createdStart: Date }) {
    const result = await notificationsApi.loadUpdates({
      createdEnd: createdEnd.toISOString(),
      createdStart: createdStart.toISOString(),
      updatedAfter: updatedAfter.toISOString(),
    });
    return {
      updates: result.updated.map(this.apiNotificationToNotification),
      deleted: result.deleted,
    };
  };

  // Not yet implemented and not sure if required, but sometimes a push
  // notification can take the user to a item which needs to be loaded,
  // so then we'll need this function.

  // public async loadItemWithNeighbours({ itemId }: { itemId: string }) {
  //   const response = await notificationsApi.notificationById({ notificationIds: [itemId] });
  //   if (response.length !== 1) {
  //     throw new Error(`Item not found`);
  //   }

  //   const [
  //     createdBeforeItems,
  //     createdAfterItems,
  //   ] = await Promise.all([
  //     notificationsApi.loadNotifications({ createdBefore: response[0].createdAt, order: "DESC" }),
  //     notificationsApi.loadNotifications({ createdAfter: response[0].createdAt, order: "ASC" }),
  //   ]);

  //   const isStartOfList = createdBeforeItems.length < config.ITEMLIST_BATCH_SIZE;
  //   const isEndOfList = createdAfterItems.length < config.ITEMLIST_BATCH_SIZE;
  //   const itemRange = [...createdAfterItems, response[0], ...createdBeforeItems]
  //   .map(this.apiNotificationToNotification)
  //   .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  //   await this.db.addCompleteItemRange(itemRange, { isStartOfList, isEndOfList });
  // }

  public createItemList() {
    let timeout: any = null;
    const itemRangeUpdateJobs: Models.ItemList.ItemRangeUpdateJob[] = [];
    const itemList = this.db.createItemList(updateJob => {
      if (!itemRangeUpdateJobs.some(job => job.rangeStart.getTime() === updateJob.rangeStart.getTime() && job.rangeEnd.getTime() === updateJob.rangeEnd.getTime())) {
        itemRangeUpdateJobs.push(updateJob);
      }
      if (timeout === null) {
        timeout = setTimeout(() => {
          const updateJobs = itemRangeUpdateJobs.splice(0);
          Promise.all(updateJobs.map(async job => {
            const result = await this.loadUpdates({
              updatedAfter: job.updatedAfter,
              createdEnd: job.rangeEnd,
              createdStart: job.rangeStart,
            });
            const itemRangeUpdateJob: Models.ItemList.ItemRangeUpdateResult<Models.Notification.Notification> = {
              updated: result.updates,
              deleted: result.deleted,
              job,
            };
            return itemRangeUpdateJob;
          }))
          .then(results => {
            this.db.handleItemRangeUpdates(results);
          })
          .catch(e => {
            console.error("Error updating item range: ", e);
            console.trace();
          });
          timeout = null;
        }, 0);
      }
    });
    itemList.init({ type: 'recent', minimumItemCount: 30 })
      .then(() => {

      })
      .catch(e => {
        if (e instanceof Error && e.message === errors.client.NOT_FOUND) {
          // Todo: handle init error
        }
      });
    return itemList;
  }

  private _setupPromise: Promise<void> | undefined;
  public async setupAfterLogin(unreadCount: number, ownUser: Models.User.OwnData): Promise<void> {
    if (!this._setupPromise) {
      this._setupPromise = new Promise<void>(async (resolve, reject) => {
        let rejected = false;
        const susTimeout = setTimeout(() => {
          console.log("NotificationDatabase.setupAfterLogin is taking longer than 7s, cancelling...");
          rejected = true;
          reject(new Error("NotificationDatabase.setupAfterLogin timed out"));
        }, 7_000);

        try {
          this.unreadCount = unreadCount;

          const createdBefore = new Date();
          const result = await notificationsApi.loadNotifications({
            createdBefore: createdBefore.toISOString(),
          });
          await this.db.addCompleteItemRange(result.map(item => ({
            ...item,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
          })), {
            isEndOfList: true,
            isStartOfList: result.length < config.ITEMLIST_BATCH_SIZE ? true : undefined,
            createdBefore,
          }, true);
        }
        catch (e) {
          clearTimeout(susTimeout);
          rejected = true;
          reject(e);
        }
        finally {
          if (!rejected) {
            clearTimeout(susTimeout);
            resolve();
          }
          delete this._setupPromise;
        }
      });
    }
    return this._setupPromise;
  }

  public async clear() {
    await this.db.clearDatabase();
  }
}

const notificationDatabase = new NotificationDatabase();
export default notificationDatabase;
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import userApi from "../api/user";
import { Dexie } from "dexie";
import AbstractDatabase, { IdbSetupInfo } from "./abstractDatabase";
import chatApi from "../api/chat";
import connectionManager from "../appstate/connection";
import channelDatabaseManager from "./channel";

const NEWMESSAGE_DEBOUNCE_INTERVAL = 500;

class ChatDatabase extends AbstractDatabase<{
  chats: Dexie.Table<Models.Chat.Chat>;
}> {
  constructor() {
    super('chat');

    (async () => {
      // initialize
      try {
        const chats = await this.db.chats.toArray();
        for (const chat of chats) {
          channelDatabaseManager.registerAccessForChannel({
            channelId: chat.channelId,
            chatId: chat.id,
          }, {
            lastRead: chat.lastRead,
          });
        }
      } catch (e) {
        console.error(`Error initializing channel access for chat channels`, e);
      }
    })();
  }

  protected setUpDb(info: IdbSetupInfo): void {
    this.db.version(2).stores({
      chats: '&id,channelId',
    });
  }

  protected setUpHandlers(): void {
    connectionManager.registerClientEventHandler(
      "cliConnectionLost",
      event => {
        this.onConnectionLoss(event.lastKnownConnectionTime);
      }
    );
    connectionManager.registerClientEventHandler(
      "cliConnectionRestored",
      event => {
        this.onConnectionRestored();
      }
    );
    connectionManager.registerClientEventHandler(
      "cliChatEvent",
      async event => {
        if (event.action === "new") {
          channelDatabaseManager.registerAccessForChannel({
            channelId: event.data.channelId,
            chatId: event.data.id,
          }, {
            lastRead: event.data.lastRead,
          });
          await this.db.chats.put({
            ...event.data,
            lastMessage: event.data.lastMessage !== null
              ? {
                ...event.data.lastMessage,
                createdAt: new Date(event.data.lastMessage.createdAt),
                updatedAt: new Date(event.data.lastMessage.updatedAt),
              }
              : null,
          });
        }
        else if (event.action === "delete") {
          const existing = await this.db.chats.get(event.data.id);
          if (existing) {
            await this.db.chats.delete(event.data.id);
            await channelDatabaseManager.deleteChannelDatabase({ channelId: existing.channelId });
          }
        }
        // Todo: update event
      }
    );
  }

  protected onConnectionLoss(lastKnownConnectionTime: number): void {
    this.lastKnownConnectionTime = lastKnownConnectionTime;
  }

  protected onConnectionRestored(): void {

  }

  private _setupPromise: Promise<void> | undefined;
  public async setupAfterLogin(chats: Models.Chat.ChatFromApi[]): Promise<void> {
    if (!this._setupPromise) {
      this._setupPromise = new Promise<void>(async (resolve, reject) => {
        let rejected = false;
        const susTimeout = setTimeout(() => {
          console.log("ChatDatabase.setupAfterLogin is taking longer than 7s, cancelling...");
          rejected = true;
          reject(new Error("ChatDatabase.setupAfterLogin timed out"));
        }, 7_000);
    
        try {
          const newChats = [...chats];
          for (const chat of newChats) {
            channelDatabaseManager.registerAccessForChannel({
              channelId: chat.channelId,
              chatId: chat.id,
            }, {
              lastRead: chat.lastRead,
            });
          }
      
          const oldChats = await this.db.chats.toArray();
          const chatsToUpdate: Models.Chat.Chat[] = [];
      
          for (const newChat of newChats) {
            let oldChat: Models.Chat.Chat | undefined;
            const index = oldChats.findIndex(c => newChat.id === c.id);
            if (index > -1) {
              oldChat = oldChats[index];
              oldChats.splice(index, 1);
            }
            if (
              !oldChat ||
              oldChat.updatedAt !== newChat.updatedAt ||
              oldChat.unread !== newChat.unread ||
              oldChat.lastMessage?.id !== newChat.lastMessage?.id ||
              oldChat.lastMessage?.updatedAt.getTime() !== (newChat.lastMessage ? new Date(newChat.lastMessage.updatedAt).getTime() : undefined)
            ) {
              chatsToUpdate.push({
                ...newChat,
                lastMessage: newChat.lastMessage !== null
                  ? {
                    ...newChat.lastMessage,
                    createdAt: new Date(newChat.lastMessage.createdAt),
                    updatedAt: new Date(newChat.lastMessage.updatedAt),
                  }
                  : null,
              });
            }
          }

          if (!rejected) {
            // remaining chats in oldChats don't have a
            // counterpart in newChats and need to be
            // deleted
            const chatIdsToDelete = oldChats.map(c => c.id);
            const channelIdsToDelete = oldChats.map(c => c.channelId);
        
            console.log(`Updating ${chatsToUpdate.length} chats, deleting ${chatIdsToDelete.length} chats`);
            const [ownDbResult, ...otherResults] = await Dexie.Promise.allSettled([
              this.db.chats.bulkDelete(chatIdsToDelete).then(() => this.db.chats.bulkPut(chatsToUpdate)),
              ...channelIdsToDelete.map(channelId => channelDatabaseManager.deleteChannelDatabase({ channelId })).filter(Boolean),
            ]);
            if (ownDbResult.status === 'rejected') {
              clearTimeout(susTimeout);
              rejected = true;
              reject(ownDbResult.reason);
            }
            for (const result of otherResults) {
              if (result.status === 'rejected') {
                console.error("Error deleting chat database", result.reason);
              }
            }
          }
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

  private nextLastReadByChannelId = new Map<string, Date>();
  private setNextLastReadPromiseByChannelId = new Map<string, Promise<void>>();
  public async setChannelLastRead(channelId: string, lastRead: Date) {
    const nextLastRead = this.nextLastReadByChannelId.get(channelId);
    let setNextLastReadPromise = this.setNextLastReadPromiseByChannelId.get(channelId);
    if (!nextLastRead || nextLastRead.getTime() < lastRead.getTime()) {
      this.nextLastReadByChannelId.set(channelId, lastRead);
      if (!setNextLastReadPromise) {
        setNextLastReadPromise = new Promise<void>((resolve, reject) => {
          setTimeout(() => {
            this.db.transaction(
              'rw',
              ['chats'],
              async tx => {
                const chat = await tx.chats.where('channelId').equals(channelId).first();
                const newLastRead = this.nextLastReadByChannelId.get(channelId)!;
                if (!!chat) {
                  const update: {
                    unread?: number;
                    lastRead?: string;
                  } = {};
                  if (
                    (!chat.lastMessage || chat.lastMessage.createdAt.getTime() <= newLastRead.getTime()) &&
                    chat.unread !== 0
                  ) {
                    update.unread = 0;
                  }
                  if (new Date(chat.lastRead) < newLastRead) {
                    update.lastRead = newLastRead.toISOString();
                  }
                  if (Object.getOwnPropertyNames(update).length > 0) {
                    await tx.chats.update(chat.id, update);
                  }
                }
              }
            )
            .then(() => resolve())
            .catch(reject)
            .finally(() => this.setNextLastReadPromiseByChannelId.delete(channelId));
          }, 500);
        });
        this.setNextLastReadPromiseByChannelId.set(channelId, setNextLastReadPromise);
      }
    }
    if (setNextLastReadPromise) await setNextLastReadPromise;
  }

  private lastMessageReceivedExecution = 0;
  private updateMessageReceivedPromise: Promise<void> | undefined;
  private receivedMessagesByChannelId: Map<string, { message: Models.Message.Message, isOwnMessage: boolean }[]> = new Map();
  public newMessageReceived(channelId: string, message: Models.Message.Message, isOwnMessage: boolean) {
    let receivedMessages = this.receivedMessagesByChannelId.get(channelId);
    if (!receivedMessages) {
      receivedMessages = [];
      this.receivedMessagesByChannelId.set(channelId, receivedMessages);
    }
    receivedMessages.push({ message, isOwnMessage });

    if (!this.updateMessageReceivedPromise) {
      this.updateMessageReceivedPromise = new Promise<void>(async (resolve, reject) => {
        try {
          let finished = false;
          while (!finished) {
            // only execute every DEBOUNCE_CHANNEL_NEWMESSAGE ms
            const lastExecutedTimeDelta = Date.now() - this.lastMessageReceivedExecution;
            if (lastExecutedTimeDelta < NEWMESSAGE_DEBOUNCE_INTERVAL) {
              await new Promise(res => setTimeout(res, NEWMESSAGE_DEBOUNCE_INTERVAL - lastExecutedTimeDelta));
            }
            this.lastMessageReceivedExecution = Date.now();

            await this.db.transaction(
              'rw',
              ['chats'],
              async tx => {
                const receivedMessagesMap = this.receivedMessagesByChannelId;
                this.receivedMessagesByChannelId = new Map();
                const channelIds = Array.from(receivedMessagesMap.keys());
                const chats = await tx.chats.where('channelId').anyOf(channelIds).toArray();
                const chatUpdates: {
                  key: string;
                  changes: {
                    unread?: number;
                    lastMessage?: Models.Message.Message | null;
                  }
                }[] = [];

                for (const chat of chats) {
                  const messageData = receivedMessagesMap.get(chat.channelId);
                  messageData?.sort((a, b) => a.message.createdAt.getTime() - b.message.createdAt.getTime());
                  let unread = chat.unread || 0;
                  let lastMessage = chat.lastMessage;
                  const channelLastRead = new Date(chat.lastRead);
                  for (const { message, isOwnMessage } of messageData || []) {
                    if (message.createdAt > channelLastRead) {
                      if (isOwnMessage) {
                        unread = 0;
                      }
                      else {
                        unread++;
                      }
                    }
                    if (!lastMessage || message.createdAt > lastMessage.createdAt) {
                      lastMessage = message;
                    }
                  }
                  if (
                    unread !== chat.unread ||
                    (lastMessage && (
                      !chat.lastMessage ||
                      chat.lastMessage.createdAt < lastMessage.createdAt // compare against old lastMessageDate
                    ))
                  ) {
                    chatUpdates.push({
                      key: chat.id,
                      changes: {
                        unread,
                        lastMessage,
                      },
                    });
                  }
                }
                if (chatUpdates.length > 0) {
                  tx.chats.bulkUpdate(chatUpdates);
                }
              },
            );
            finished = this.receivedMessagesByChannelId.size === 0;
          }
          resolve();
        }
        catch (e) {
          reject(e);
        }
        finally {
          this.updateMessageReceivedPromise = undefined;
        }
      });
    }
  }

  public async clear() {
    await this.db.chats.clear();
  }

  public async createChat(otherUserId: string) {
    const newChat = await chatApi.startChat({ otherUserId });
    channelDatabaseManager.registerAccessForChannel({
      channelId: newChat.channelId,
      chatId: newChat.id,
    }, {
      lastRead: newChat.lastRead,
    });
    await this.db.chats.put({
      ...newChat,
      lastMessage: newChat.lastMessage !== null
        ? {
          ...newChat.lastMessage,
          createdAt: new Date(newChat.lastMessage.createdAt),
          updatedAt: new Date(newChat.lastMessage.updatedAt),
        }
        : null,
    });
    return newChat;
  }

  public async update(userData: Partial<Omit<Models.User.OwnData, 'id' | 'premiumFeatures'>>) {
    await userApi.updateOwnData(userData);
  }

  public async getAllChats() {
    return await this.db.chats.toArray();
  }

  public async getAllChatsWithLastMessage() {
    const chats = await this.db.chats.toArray();
    // Todo: Add last messages
    return chats;
  }

  public async closeChat(chatId: string) {
    await chatApi.closeChat({ chatId });
    const existing = await this.db.chats.get(chatId);
    if (existing) {
      await this.db.chats.delete(chatId);
      await channelDatabaseManager.deleteChannelDatabase({ channelId: existing.channelId });
    }
  }
}

const chatDatabase = new ChatDatabase();
export default chatDatabase;
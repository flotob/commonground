// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import config from "../../common/config";
import { Dexie } from "dexie"
import AbstractDatabase, { IdbSetupInfo } from "./abstractDatabase"
import messagesApi from '../api/messages';
import connectionManager from "../appstate/connection";

export type ChunkType = {
  id?: number;
  channelId: string;
  lastUpdated: Date;
  start: Date;
  end: Date;
  earliestChunk: boolean;
}

export type BaseDexieMessage = {
  id: string;
  createdAt: string;
  createdDate: Date;
}

export type FetchAccess = {
  accessType: 'community';
  communityId: string;
} | {
  accessType: 'chat';
  chatId: string;
}

type GetLatestArgs = {
  channelId: string;
  limit?: number;
};

type FetchLatestArgs = GetLatestArgs & FetchAccess;

type GetMessagesArgs = {
  channelId: string;
  before: boolean;
  messageId?: string;
  createdDate?: Date;
  limit?: number;
}

type FetchMoreMessagesArgs = {
  channelId: string;
  message: DexieMessage;
  before: boolean;
} & FetchAccess;

export type DexieMessage = Models.Message.ApiMessage & { createdDate: Date };

export class MessageDatabase extends AbstractDatabase<{
  messages: Dexie.Table<DexieMessage>;
  chunks: Dexie.Table<ChunkType>;
}> {
  constructor() {
    super('messages');
  }

  protected upToDateBuckets = new Set<string>();

  protected setUpDb(info: IdbSetupInfo): void {
    this.db.version(1).stores({
      messages: '&id, createdDate', // Primary key and indexed props
      chunks: '++id, channelId'
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
      "cliMessageEvent",
      event => {
        // Todo
      }
    );
  }

  protected onConnectionLoss(lastKnownConnectionTime: number): void {
    this.upToDateBuckets.clear();
    this.lastKnownConnectionTime = lastKnownConnectionTime;
  }

  protected onConnectionRestored(): void {

  }

  public async logout() {
    // Todo: clear databases
  }

  public async setReaction(args: { channelId: string, messageId: string, reaction: string } & FetchAccess) {
    const { channelId, accessType, messageId, reaction } = args;
    const access: API.Messages.MessageAccess = accessType === 'community' ? { channelId, communityId: args.communityId } : { channelId, chatId: args.chatId };
    await messagesApi.setReaction({ messageId, reaction, access });
  }

  public async unsetReaction(args: { channelId: string, messageId: string } & FetchAccess) {
    const { channelId, accessType, messageId } = args;
    const access: API.Messages.MessageAccess = accessType === 'community' ? { channelId, communityId: args.communityId } : { channelId, chatId: args.chatId };
    await messagesApi.unsetReaction({ messageId, access });
  }

  public setBucketAsUpToDate(channelId: string) {
    this.upToDateBuckets.add(channelId);
  }

  public isBucketUpToDate(channelId: string) {
    return this.upToDateBuckets.has(channelId);
  }

  public async getById(id: string): Promise<DexieMessage | undefined> {
    return this.db.messages.get(id);
  }

  public async getLatestMessages(args: GetLatestArgs): Promise<DexieMessage[]> {
    const { channelId } = args;

    const [latestChunk] = await this.db.chunks.where('channelId').equals(channelId).reverse().limit(1).sortBy('end');
    console.log('getLatestM: LatestChunk', latestChunk);
    if (latestChunk) {
      return await this.getMessages({
        ...args,
        before: true,
        createdDate: latestChunk?.end
      });
    }
    
    return [];
  }

  // Tries to fetch next bunch of posts from indexedDB, returns found posts
  // posts will be empty if there are not enough posts or we cannot determine
  // a targetDate to measure with the existing chunks
  public async getMessages(args: GetMessagesArgs): Promise<DexieMessage[]> {
    const { channelId, createdDate, limit = config.ITEMLIST_BATCH_SIZE, messageId, before } = args

    let targetDate = createdDate;
    if (!targetDate && messageId) {
      const fetchedPost = await this.db.messages.get(messageId);
      if (fetchedPost) {
        targetDate = fetchedPost.createdDate;
      }
    }

    console.log(targetDate, createdDate, messageId);
    if (targetDate) {
      // Get current chunk boundaries
      const currentChunkArr = await this.db.chunks.where('channelId').equals(channelId).and(chunk => chunk.start <= targetDate! && targetDate! <= chunk.end).toArray();
      if (currentChunkArr.length > 1) {
        console.error('Found more than 1 chunk for messages, please check consistency');
      }

      const [currentChunk] = currentChunkArr;
      if (currentChunk) {
        // If chunk exists, try fetching next ${number} of messages (limited by chunk date)
        const startDate = !before ? targetDate : currentChunk.start;
        const endDate = before ? targetDate : currentChunk.end;

        let messagesQuery = this.db.messages.where('createdDate').between(startDate, endDate, true, true).and(message => message.channelId === channelId).limit(limit);
        if (before) {
          messagesQuery = messagesQuery.reverse();
        }
        const messages = await messagesQuery.sortBy('createdDate');

        console.log('messagesFromDb', messages);

        if (before) {
          return messages.reverse();          
        } else {
          return messages;
        }
      }
    }

    // We do not have enough info to fetch the messages, return empty
    console.error('Reached end of getMessages without proper parameters');
    return [];
  }

  public async fetchLatest(args: FetchLatestArgs) {
    const { channelId, accessType } = args;
    const access: API.Messages.MessageAccess = accessType === 'community' ? { channelId, communityId: args.communityId } : { channelId, chatId: args.chatId };
    const messagesResult = await messagesApi.loadMessages({ access, createdBefore: new Date().toISOString() });
    console.log('fetchLatest messages result', messagesResult);
    const messages = messagesResult.map(post => ({ ...post, createdDate: new Date(post.createdAt) }));
    await this.storeFetchedMessages(channelId, messages);
  }

  public async fetchMoreMessages(args: FetchMoreMessagesArgs): Promise<{ allRetrieved: boolean }> {
    const { message, channelId, accessType, before } = args;
    const access: API.Messages.MessageAccess = accessType === 'community' ? { channelId, communityId: args.communityId } : { channelId, chatId: args.chatId };
    
    if (before) {
      const [currentChunk] = await this.db.chunks.where('channelId').equals(channelId).and(chunk => chunk.start <= message.createdDate && message.createdDate <= chunk.end).toArray();
      if (currentChunk.earliestChunk) {
        return { allRetrieved: true };
      }
    } else {
      if (this.isBucketUpToDate(channelId)) {
        return { allRetrieved: true };
      }
    }

    let request: API.Messages.loadMessages.Request;
    if (before) {
      request = {
        access,
        createdBefore: message.createdDate.toISOString()
      }
    } else {
      request = {
        access,
        createdAfter: message.createdDate.toISOString()
      }
    }

    const messagesResult = await messagesApi.loadMessages(request);
    const messages = messagesResult.map(post => ({ ...post, createdDate: new Date(post.createdAt) }));
    // Add pivot message to correctly calculate chunk connections
    const messagesWithPivot = before ? [message].concat(messages) : messages.concat([message]);
    console.log('fetched messages with pivot', messagesWithPivot);
    await this.storeFetchedMessages(channelId, messagesWithPivot, before);
    const allRetrieved = messages.length < config.ITEMLIST_BATCH_SIZE;

    return { allRetrieved };
  }

  public async fetchMessageUpdates(args: { channelId: string } & FetchAccess) {
    const { channelId, accessType } = args;
    const access: API.Messages.MessageAccess = accessType === 'community' ? { channelId, communityId: args.communityId } : { channelId, chatId: args.chatId };

    const newLastUpdated = new Date();
    const channelChunks = await this.db.chunks.where('channelId').equals(channelId).toArray();
    const updatedMessages:  DexieMessage[] = [];
    const deletedIds: string[] = [];
    // const replyIds: string[] = [];

    for (const chunk of channelChunks) {
      // const result = await this.__actualFetchUpdates(channelId, chunk.start.toISOString(), chunk.end.toISOString(), chunk.lastUpdated.toISOString());
      const response = await messagesApi.loadUpdates({
        access,
        createdStart: chunk.start.toISOString(),
        createdEnd: chunk.end.toISOString(),
        updatedAfter: chunk.lastUpdated.toISOString(),
      });
      const result = {
        deleted: response.deleted,
        updated: response.updated.map(post => ({ ...post, createdDate: new Date(post.createdAt) }))
      };
      updatedMessages.push(...result.updated);
      deletedIds.push(...result.deleted);
    }

    updatedMessages.map(message => ({...message, createdDate: new Date(message.createdAt)}));
    this.db.messages.bulkPut(updatedMessages);
    this.db.messages.bulkDelete(deletedIds);
    
    for (const chunk of channelChunks) {
      this.db.chunks.update(chunk.id!, { lastUpdated: newLastUpdated });
    }
    
    // FIXME: Add replies to posts
    // for (const post of updatedMessages) {
    //   if (post.parentMessageId) {
    //     replyIds.push(post.parentMessageId);
    //   }
    // }
    // // Loads replies to posts
    // const replyPosts = await this.getPostsByIds(channelId, replyIds);
    // const posts = updatedPosts.map(updatedPost => {
    //   if (!!updatedPost.parentMessageId) {
    //     const foundReply = replyPosts.find(reply => reply.id === updatedPost.parentMessageId);
    //     // ToDo: rework it!
    //     //updatedPost.parentMessage = foundReply!;
    //   }
    //   return updatedPost;
    // });
  }

  private async storeFetchedMessages(channelId: string, messages: DexieMessage[], before: boolean = true) {
    const allRetrieved = messages.length < config.ITEMLIST_BATCH_SIZE;
    const loadedFirstChunk = before && allRetrieved;

    // If needed to fetch messages from api, update message chunks
    if (messages.length > 0) {
      const closestDateString = messages[0].createdAt;
      const furthestDateString = messages[messages.length - 1].createdAt;
      await this.updateMessageChunks(channelId, closestDateString, furthestDateString, loadedFirstChunk);
    }

    // Add fetchedmessages to indexedDB for future use
    this.db.messages.bulkPut(messages.map(message => ({...message, createdDate: new Date(message.createdAt)})));
  }

  private async updateMessageChunks(channelId: string, dateStringOne: string, dateStringTwo: string, loadedFirstChunk: boolean) {
    // Calculate chunk borders for new possible chunk
    const dateOne = new Date(dateStringOne);
    const dateTwo = new Date(dateStringTwo);

    let [newStart, newEnd] = [dateOne, dateTwo].sort((a: Date, b: Date) => a.getTime() - b.getTime());
    let isEarliestChunk = loadedFirstChunk;

    // find all chunks that start or end between the dates
    const targetChunks = await this.db.chunks.where('channelId').equals(channelId).and(chunk => {
      const startBetweenDates = newStart <= chunk.start && chunk.start <= newEnd;
      const endBetweenDates = newStart <= chunk.end && chunk.end <= newEnd;
      return startBetweenDates || endBetweenDates;
    }).toArray();

    // get the earliest start and latest end from these found chunks
    for (const chunk of targetChunks) {
      isEarliestChunk = isEarliestChunk || chunk.earliestChunk;
      if (chunk.start < newStart) {
        newStart = chunk.start
      }
      if (newEnd < chunk.end) {
        newEnd = chunk.end;
      }
    }

    // delete all found chunks and assign the newfound start/end to a new chunk
    // If any chunk is found, delete and reuse id
    if (targetChunks.length > 0) {
      for (const chunk of targetChunks) {
        this.db.chunks.delete(chunk.id!);
      }
  
      const id = targetChunks[0].id;
      return this.db.chunks.add({ id, channelId, start: newStart, end: newEnd, lastUpdated: new Date(), earliestChunk: isEarliestChunk });
    } else {
      return this.db.chunks.add({ channelId, start: newStart, end: newEnd, lastUpdated: new Date(), earliestChunk: isEarliestChunk });
    }
  }

  public async createMessage(data: API.Messages.createMessage.Request) {
    return messagesApi.createMessage(data);
  }
}

const messageDatabase = new MessageDatabase();
export default messageDatabase;
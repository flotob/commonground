// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import config from "common/config";
import Dexie, { liveQuery } from "dexie";
import ItemList from "./itemList";
import connectionManager from "../../appstate/connection";
import dbTracker, { DbStatusObject, chunkedDatabaseName } from "../dbTracker";
import * as helpers from "./chunkedDatabase.helpers";
import errors from "common/errors";

export const CHUNK_SIZE_MIN = 10;
export const CHUNK_SIZE_MAX = 40;
export const CHUNK_SIZE = 30;

type ExtNavigator = Navigator & {
  locks: {
    request(name: string, callback: (lock: any) => void): Promise<void>;
  }
};

type BroadcastChunkUpdate = {
  updatedChunks: Models.ItemList.ChunkFromDb[];
  deletedChunkIds: Set<number>;
  fullDatabaseClear?: boolean;
};

export type UpdateAssemblyObject<T extends Models.ItemList.Item> = {
  database: ChunkedItemDatabase<T>;
  chunksArray: Models.ItemList.Chunk[];
  updates: {
      chunksToUpsert: Set<Models.ItemList.Chunk>;
      chunksToDelete: Set<Models.ItemList.Chunk>;
      itemsToUpsert: Map<string, T>;
      itemIdsToDelete: Set<string>;
  };
};

export type ItemRangeOptions = {
  isStartOfList?: boolean;
  isEndOfList?: boolean;
  createdBefore?: Date;
  createdAfter?: Date;
};

export type PreparedItemRangeInsert = {
  equal: Models.ItemList.Chunk | null;
  next: Models.ItemList.Chunk | null;
  previous: Models.ItemList.Chunk | null;
  containedIn: Models.ItemList.Chunk | null;
};

type Job_addCompleteItemRange<T extends Models.ItemList.Item> = {
  method: "addCompleteItemRange";
  items: T[];
  options: {
    isStartOfList?: boolean;
    isEndOfList?: boolean;
    createdBefore?: Date;
    createdAfter?: Date;
  };
};

type Job_addNewItem<T extends Models.ItemList.Item> = {
  method: "addNewItem";
  item: T;
};

type Job_chunksAccessed = {
  method: "chunksAccessed";
  chunkIds: number[];
};

type Job_deleteItems = {
  method: "deleteItems";
  itemIds: string[];
};

type Job_itemRangeUpdate<T extends Models.ItemList.Item> = {
  method: "itemRangeUpdate";
  updates: Models.ItemList.ItemRangeUpdateResult<T>[];
};

type Job_fullDatabaseClear = {
  method: "fullDatabaseClear";
};

type PendingJob<T extends Models.ItemList.Item> =
  Job_addCompleteItemRange<T> |
  Job_addNewItem<T> |
  Job_chunksAccessed |
  Job_deleteItems |
  Job_itemRangeUpdate<T> |
  Job_fullDatabaseClear;

const logDebug = true;
function debugLog(...values: any[]) {
  if (logDebug) {
    console.log(...values);
  }
};

/**
 * Only call this when all chunks in the chunk list have ids, after all save
 * operations have completed.
 */
function unsafe_serializeChunk(chunk: Models.ItemList.Chunk): Models.ItemList.ChunkFromDb {
  const { nextChunk, previousChunk, ...dbChunk } = chunk;
  const result = dbChunk as typeof dbChunk & {
    nextChunkId: number | null | "end-of-list";
    previousChunkId: number | null | "end-of-list";
  };

  if (result.chunkId === undefined) {
    throw new Error("Chunk to serialize has no id");
  }

  if (nextChunk === null || nextChunk === "end-of-list") {
    result.nextChunkId = nextChunk;
  }
  else if (nextChunk.chunkId !== undefined) {
    result.nextChunkId = nextChunk.chunkId;
  }
  else {
    throw new Error("nextChunk of chunk to serialize has no id");
  }

  if (previousChunk === null || previousChunk === "end-of-list") {
    result.previousChunkId = previousChunk;
  }
  else if (previousChunk.chunkId !== undefined) {
    result.previousChunkId = previousChunk.chunkId;
  }
  else {
    throw new Error("previousChunk of chunk to serialize has no id");
  }

  return result as typeof result & { chunkId: number };
}

const database = new Dexie(chunkedDatabaseName, { cache: 'immutable' }) as Dexie & {
  items: Dexie.Table<Models.ItemList.Item & { __dbName: string }, string>;
  chunks: Dexie.Table<Models.ItemList.ChunkFromDb, number>;
  status: Dexie.Table<DbStatusObject, DbStatusObject["id"]>;
};
database.version(2).stores({
  items: '&id,[__dbName+createdAt]',
  chunks: '++chunkId,[__dbName+startDate]',
  status: '&id',
});
const activeDatabases = new Set<string>();
const databaseReady = new Promise<void>(async (resolve, reject) => {
  const dbInfo = dbTracker.registerDatabase(chunkedDatabaseName);
  if (dbInfo.createdInOldAppVersion) {
    await database.transaction(
      'rw',
      ['items', 'chunks', 'status'],
      async tx => {
        let updateState = await tx.status.get("UpdatedInAppVersion") as DbStatusObject | undefined;
        if (!updateState || updateState.updatedInAppVersion !== config.APP_VERSION) {
          // debugLog("ChunkedItemDatabase (" + this.__dbName + "): Clearing items, chunks table: Cleared.");
          dbTracker.databaseHasBeenUpdated(chunkedDatabaseName);
          if (!updateState) {
            updateState = {
              id: 'UpdatedInAppVersion',
              updatedInAppVersion: config.APP_VERSION,
            };
          }
          updateState.updatedInAppVersion = config.APP_VERSION;
          tx.items.clear();
          tx.chunks.clear();
          tx.status.put(updateState);
        }
        // else {
        //   debugLog("ChunkedItemDatabase (" + this.__dbName + "): Clearing items, chunks table: No action required.");
        // }
      },
    )
    .then(() => resolve())
    .catch(reject);
  }
  else {
    resolve();
  }
});


export default class ChunkedItemDatabase<T extends Models.ItemList.Item> {
  public db: Dexie & {
    items: Dexie.Table<T & { __dbName: string }, string>;
    chunks: Dexie.Table<Models.ItemList.ChunkFromDb, number>;
    status: Dexie.Table<DbStatusObject, DbStatusObject["id"]>;
  };

  private __chunks: Models.ItemList.Chunk[] | undefined = undefined;
  private __itemLists: ItemList<T>[] = [];
  private dbName: string;
  private broadcastChannel: BroadcastChannel;

  public ready: Promise<void>;
  private __isReady: boolean = false;
  private __resolveReady?: () => void;

  private __pendingChunkUpdate: Models.ItemList.Chunk[] | undefined;
  private __pendingChunkUpdateTimestamp: Date | undefined;
  private __pendingBroadcastUpdates: {
    data: BroadcastChunkUpdate;
    timestamp: Date;
  }[] = [];
  private __pendingJobs: {
    job: PendingJob<T>;
    promise: Promise<void>;
    resolve: () => void;
    reject: (error: any) => void;
  }[] = [];
  private isInitialChunkChange = true;
  public alwaysInstantFlush: boolean;

  private flushWaitingForResolve: {
    promise: Promise<void>;
    resolve: () => void;
    resolved: boolean;
  } | undefined;
  private closed = false;

  constructor({ databaseName, alwaysInstantFlush }: {
    databaseName: string;
    alwaysInstantFlush?: boolean;
  }) {
    this.alwaysInstantFlush = alwaysInstantFlush || false;
    this.dbName = databaseName;
    if (!activeDatabases.has(databaseName)) {
      activeDatabases.add(databaseName);
    }
    else {
      throw new Error(`Database ${databaseName} already exists`);
    }
    console.log("New instance of chunked database", this.dbName);
    this.db = database as any;

    this.ready = new Promise(resolve => {
      this.__resolveReady = () => {
        this.__isReady = true;
        resolve();
      };
    });

    this.broadcastChannel = new BroadcastChannel(`chunkedDatabase-${this.dbName}`);
    // register broadcast listener
    this.broadcastChannel.onmessage = (event: MessageEvent<BroadcastChunkUpdate>) => {
      this.__pendingBroadcastUpdates.push({
        data: event.data,
        timestamp: new Date(),
      });
      this.flush(false);
    };

    databaseReady.then(() => {
      // get all chunks from db
      this.db.chunks
        .where('[__dbName+startDate]').between([this.dbName, new Date(-8640000000000000)], [this.dbName, new Date(8640000000000000)], true, true)
        .toArray()
        .then((chunksFromDb) => {
          debugLog(`- ${this.dbName}: Loaded chunks from db`, chunksFromDb);
          const linkHelperMap = helpers.dbArrayToLinkedChunkMap(chunksFromDb);
          const newChunks = Array.from(linkHelperMap.values()).sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
          const chunk = newChunks[0];
          if (
            chunk &&
            chunk.lastUpdate < connectionManager.lastDisconnect &&
            chunk.nextChunk === "end-of-list" &&
            document.visibilityState === "visible"
          ) {
            chunk.nextChunk = null;
          }
          this.__pendingChunkUpdate = newChunks;
          this.__pendingChunkUpdateTimestamp = new Date();
          this.flush(false);
        });
    });
  }

  public logInfo(message: string, ...args: any[]) {
    console.log(`ChunkedItemDatabase (${this.dbName}): ${message}`, ...args);
  }

  public logWarn(message: string, ...args: any[]) {
    console.warn(`ChunkedItemDatabase (${this.dbName}): ${message}`, ...args);
  }

  public logError(message: string, ...args: any[]) {
    console.error(`ChunkedItemDatabase (${this.dbName}): ${message}`, ...args);
  }

  get isReady() {
    return this.__isReady;
  }

  get databaseName() {
    return this.dbName;
  }

  /**
   * A sorted array of all existing chunks in this database, where chunks[0] is the most recent Chunk.
   */
  public get chunks(): Readonly<Models.ItemList.Chunk[] | undefined> {
    return this.__chunks;
  }

  private scheduleJob(job: PendingJob<T>, forceInstantFlush = false): Promise<void> {
    if (this.closed) return Promise.resolve();
    if (forceInstantFlush && !!this.flushWaitingForResolve && !this.flushWaitingForResolve.resolved) {
      this.flushWaitingForResolve.resolve();
    }
    const promise = this.ready.then(() => new Promise<void>((resolve, reject) => {
      this.__pendingJobs.push({ job, promise, resolve, reject });
      this.flush(forceInstantFlush);
    }));
    return promise;
  }

  private inExclusiveLock: boolean = false;
  private nextFlushPromise: Promise<void> | undefined;
  private __JOB_EXECUTION_ORDER: Record<PendingJob<T>["method"], number> = {
    fullDatabaseClear: -10,
    chunksAccessed: 0,
    itemRangeUpdate: 5,
    addCompleteItemRange: 10,
    addNewItem: 20,
    deleteItems: 40,
  };
  private flush(forceInstantFlush: boolean) {
    if (this.closed) return;
    forceInstantFlush = forceInstantFlush || this.alwaysInstantFlush;
    if (!!this.nextFlushPromise && forceInstantFlush && !!this.flushWaitingForResolve && !this.flushWaitingForResolve.resolved) {
      this.flushWaitingForResolve.resolve();
    }
    else if (!this.nextFlushPromise) {
      if (this.__itemLists.length === 0 && !forceInstantFlush && (!this.flushWaitingForResolve || this.flushWaitingForResolve.resolved)) {
        let promiseObject: {
          promise: Promise<void>;
          resolve: () => void;
          resolved: boolean;
        } = {
          resolved: false,
        } as any;
        promiseObject.promise = new Promise<void>((resolve) => {
          promiseObject.resolve = () => {
            promiseObject.resolved = true;
            resolve();
          };
        });
        this.flushWaitingForResolve = promiseObject;
      };

      this.nextFlushPromise = new Promise<void>(async (resolve, reject) => {
        if (this.__itemLists.length === 0 && !forceInstantFlush && this.flushWaitingForResolve && !this.flushWaitingForResolve.resolved) {
          // if there are no ItemLists, wait for 5-10s
          // or until an ItemList is created
          const waitTime = 5_000 + Math.floor(Math.random() * 5_000);
          await Promise.race([
            new Promise(resolve => setTimeout(resolve, waitTime)),
            this.flushWaitingForResolve.promise,
          ]);
        }
        debugLog(`- ${this.dbName}: Awaiting exclusive lock...`);
        if (!("locks" in navigator)) {
          throw new Error("Locks API not available");
        }
        let notifyListeners = false;
        await (navigator as ExtNavigator).locks.request(this.dbName, async lock => {
          try {
            if (!lock) {
              throw new Error("Could not acquire exclusive lock");
            }
            this.inExclusiveLock = true;
            debugLog(`- ${this.dbName}: Running in exclusive lock`);

            const updateData: UpdateAssemblyObject<T> = {
              chunksArray: [],
              database: this,
              updates: {
                chunksToUpsert: new Set(),
                chunksToDelete: new Set(),
                itemsToUpsert: new Map(),
                itemIdsToDelete: new Set(),
              },
            };

            if (this.__pendingChunkUpdate) {
              this.__chunks = this.__pendingChunkUpdate;
              this.__pendingChunkUpdate = undefined;
              notifyListeners = true;
            }
            else {
              debugLog("No pending chunk update");
            }

            if (this.__pendingBroadcastUpdates.length > 0) {
              const broadcastUpdates = this.__pendingBroadcastUpdates.splice(0);
              console.log("Starting chunk update(s) from broadcast", broadcastUpdates);
              let currentChunks = this.__chunks;
              if (!!currentChunks) {
                notifyListeners = true;
                for (const { data, timestamp } of broadcastUpdates) {
                  // only apply updates that are younger than the last pending chunk update, if there is one

                  if (!this.__pendingChunkUpdateTimestamp || timestamp > this.__pendingChunkUpdateTimestamp) {
                    if (data.fullDatabaseClear === true) {
                      console.log("Clearing all chunks");
                      currentChunks = [];
                    }

                    console.log("Applying broadcast update", data, timestamp, this.__pendingChunkUpdateTimestamp, "currentChunks", currentChunks);
                    const nextChunks: Models.ItemList.Chunk[] = currentChunks!.filter(chunk => {
                      if (chunk.chunkId === undefined) {
                        console.error("Encountered chunk without id in currentChunks while applying pending broadcast update", chunk);
                        throw new Error(errors.client.INTEGRITY);
                      }
                      else {
                        return !data.deletedChunkIds.has(chunk.chunkId);
                      }
                    });
                    const nextChunksMap = new Map(nextChunks.map((chunk, index) => [chunk.chunkId!, { chunk, index }]));

                    const newChunks: [number, {
                      chunk: Models.ItemList.Chunk & Models.ItemList.ChunkFromDb;
                      index: number;
                    }][] = data.updatedChunks.map((chunk, index) => {
                      const newChunk = {
                        ...chunk,
                        nextChunk: null as Models.ItemList.Chunk | "end-of-list" | null,
                        previousChunk: null as Models.ItemList.Chunk | "end-of-list" | null,
                      };
                      return [chunk.chunkId, { chunk: newChunk, index }];
                    });
                    const newChunksMap = new Map(newChunks);

                    for (const [chunkId, { chunk, index }] of newChunks) {
                      if (chunk.nextChunkId === null || chunk.nextChunkId === "end-of-list") {
                        chunk.nextChunk = chunk.nextChunkId;
                      }
                      else {
                        const target = newChunksMap.get(chunk.nextChunkId) || nextChunksMap.get(chunk.nextChunkId);
                        if (!target) {
                          console.error("Next chunk not found in current or new chunks", chunk);
                          throw new Error(errors.client.INTEGRITY);
                        }
                        else {
                          chunk.nextChunk = target.chunk;
                          target.chunk.previousChunk = chunk;
                        }
                      }
                      delete (chunk as any).nextChunkId;

                      if (chunk.previousChunkId === null || chunk.previousChunkId === "end-of-list") {
                        chunk.previousChunk = chunk.previousChunkId;
                      }
                      else {
                        const target = newChunksMap.get(chunk.previousChunkId) || nextChunksMap.get(chunk.previousChunkId);
                        if (!target) {
                          console.error("Previous chunk not found in current or new chunks", chunk);
                          throw new Error(errors.client.INTEGRITY);
                        }
                        else {
                          chunk.previousChunk = target.chunk;
                          target.chunk.nextChunk = chunk;
                        }
                      }
                      delete (chunk as any).previousChunkId;
                      const newChunk = chunk as Models.ItemList.Chunk;

                      const existing = nextChunksMap.get(chunkId);
                      if (!!existing) {
                        nextChunks[existing.index] = newChunk;
                        for (const itemList of this.__itemLists) {
                          if (itemList.newestChunk?.chunkId === chunkId) {
                            itemList.newestChunk = newChunk;
                          }
                          if (itemList.oldestChunk?.chunkId === chunkId) {
                            itemList.oldestChunk = newChunk;
                          }
                        }
                      }
                      else {
                        nextChunks.push(newChunk);
                      }
                    }

                    currentChunks = nextChunks;
                  }
                  else {
                    console.log("Skipping stale chunk update", data, timestamp, this.__pendingChunkUpdateTimestamp, "currentChunks", currentChunks);
                  }
                }
                // assign new chunks
                currentChunks.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
                this.__chunks = currentChunks;
              }
            }
            this.__pendingChunkUpdateTimestamp = undefined;

            if (!!this.__chunks) {
              updateData.chunksArray = this.__chunks;
            }

            if (this.__pendingJobs.length > 0 && !!this.__chunks) {
              const jobs = this.__pendingJobs.splice(0).sort((a, b) => this.__JOB_EXECUTION_ORDER[a.job.method] - this.__JOB_EXECUTION_ORDER[b.job.method]);
              try {
                let fullDatabaseClear = false;
                for (const job of jobs) {
                  switch (job.job.method) {
                    case "addCompleteItemRange":
                      debugLog("Executing addCompleteItemRange job", job.job.items, job.job.options, updateData);
                      await this.execute_addCompleteItemRange(job.job.items, updateData, job.job.options);
                      notifyListeners = true;
                      break;
                    case "addNewItem":
                      debugLog("Executing addNewItem job", job.job.item, updateData);
                      helpers.addNewItem<T>(this.dbName, job.job.item, updateData);
                      notifyListeners = true;
                      break;
                    case "chunksAccessed":
                      debugLog("Executing chunksAccessed job", job.job.chunkIds, updateData);
                      const { changed } = helpers.chunksAccessed<T>(job.job.chunkIds, updateData);
                      notifyListeners = notifyListeners || changed;
                      break;
                    case "deleteItems":
                      debugLog("Executing deleteItems job", job.job.itemIds, updateData);
                      await this.execute_deleteItems(job.job.itemIds, updateData);
                      notifyListeners = true; // Todo: check if chunks were changed?
                      break;
                    case "itemRangeUpdate":
                      debugLog("Executing itemRangeUpdate job", job.job.updates);
                      job.job.updates.sort((a, b) => b.job.rangeEnd.getTime() - a.job.rangeEnd.getTime());
                      let currentChunk = updateData.chunksArray[0];
                      for (const update of job.job.updates) {
                        while (currentChunk.endDate > update.job.rangeEnd && currentChunk.previousChunk !== null && currentChunk.previousChunk !== "end-of-list") {
                          currentChunk = currentChunk.previousChunk;
                        }
                        if (
                          currentChunk.startDate.getTime() === update.job.rangeStart.getTime() &&
                          currentChunk.endDate.getTime() === update.job.rangeEnd.getTime()
                        ) {
                          if (connectionManager.webSocketState === "connected") {
                            currentChunk.lastUpdate = connectionManager.lastDisconnect;
                          }
                          else {
                            currentChunk.lastUpdate = new Date(connectionManager.lastDisconnect.getTime() - 1);
                          }
                        }
                        const { updated, deleted } = update;
                        for (const item of updated) {
                          updateData.updates.itemsToUpsert.set(item.id, item);
                        }
                        for (const id of deleted) {
                          updateData.updates.itemIdsToDelete.add(id);
                        }
                      }
                      break;
                    case "fullDatabaseClear":
                      debugLog("Executing fullDatabaseClear job");
                      await this.db.transaction(
                        'rw',
                        ['items', 'chunks'],
                        async tx => {
                          tx.items.where('[__dbName+createdAt]').between([this.dbName, new Date(-8640000000000000)], [this.dbName, new Date(8640000000000000)], true, true).delete();
                          tx.chunks.where('[__dbName+startDate]').between([this.dbName, new Date(-8640000000000000)], [this.dbName, new Date(8640000000000000)], true, true).delete();
                        },
                      );
                      this.__chunks = [];
                      notifyListeners = true;
                      fullDatabaseClear = true;
                      // skip other updates
                      continue;
                    default:
                      throw new Error(`Unknown job method: ${job}`);
                  }
                }

                if (!fullDatabaseClear) {
                  const broadcastUpdate = await this.updateChunksAndItemsInDb(updateData);
                  if (!!broadcastUpdate && (broadcastUpdate.updatedChunks.length > 0 || broadcastUpdate.deletedChunkIds.size > 0)) {
                    this.broadcastChannel?.postMessage(broadcastUpdate);
                  }
                }
                else {
                  this.broadcastChannel?.postMessage({
                    updatedChunks: [],
                    deletedChunkIds: new Set(),
                    fullDatabaseClear: true,
                  });
                }
                await new Promise(resolve => setTimeout(resolve, 20)); // wait 20ms for other tabs to handle the event

                for (const job of jobs) {
                  job.resolve();
                }
              }
              catch (e) {
                for (const job of jobs) {
                  job.reject(e);
                }
              }
            }
            if (notifyListeners) {
              for (const itemList of this.__itemLists) {
                itemList.chunksChangedListener(this.__chunks!);
              }
            }

            resolve();
          }
          catch (e) {
            reject(e);
          }
        })
        .then(() => {
          this.__resolveReady?.();
          delete this.__resolveReady;
        })
        .finally(() => {
          this.inExclusiveLock = false;
          this.nextFlushPromise = undefined;
          this.flushWaitingForResolve = undefined;
          debugLog(`- ${this.dbName}: Finished exclusive lock`);
          if (!!this.__pendingChunkUpdate || this.__pendingJobs.length > 0 || this.__pendingBroadcastUpdates.length > 0) {
            setTimeout(this.flush.bind(this), 0);
          }
        });
      });
    }
  }

  public async putTemporaryItemNoChunkChange(item: T) {
    await this.db.items.put({ ...item, __dbName: this.dbName });
  }

  public observeSingleItemById({ id, onchange, onerror }: {
    id: string;
    onchange: (item: T | undefined) => void;
    onerror: (error: any) => void;
  }) {
    const observable = liveQuery(() => {
      return this.db.items.get(id);
    });
    const subscription = observable.subscribe({
      next: onchange,
      error: onerror,
    });
    return {
      unsubscribe: () => {
        subscription.unsubscribe();
      },
    };
  }

  public createItemList(scheduleItemRangeUpdate: (updateJob: Models.ItemList.ItemRangeUpdateJob) => void): Models.ItemList.ItemList<T> {
    // check if there's a flush waiting
    if (!!this.flushWaitingForResolve) {
      this.flushWaitingForResolve.resolve();
    }
    const that = this;
    const itemList = new ItemList<T>({
      chunkedDatabase: that,
      scheduleItemRangeUpdate,
      ondestroy: () => {
        const index = this.__itemLists.indexOf(itemList);
        if (index !== -1) {
          this.__itemLists.splice(index, 1);
        }
      },
      flushPromise: this.nextFlushPromise,
    });
    this.__itemLists.push(itemList);
    return itemList;
  }

  public async addNewItem(item: T) {
    await this.scheduleJob({
      method: "addNewItem",
      item,
    });
  }

  /**
   * The chunk access date is only updated once per day
   * although the function is called with every access,
   * because it's only meant to keep very rough track
   * so we can delete stale chunks (e.g. > 7 days no access)
   */
  public async chunksAccessed(chunkIds: number[]) {
    await this.scheduleJob({
      method: "chunksAccessed",
      chunkIds,
    });
  }

  public async deleteItems(itemIds: string[]) {
    await this.scheduleJob({
      method: "deleteItems",
      itemIds,
    });
  }

  /**
   * Adds a complete range of items to the database.
   * Complete means that at the moment of adding, the
   * range of items MUST NOT contain gaps in the item
   * history. Creates and updates chunks as required.
   */
  public async addCompleteItemRange(items: T[], options?: ItemRangeOptions, forceInstantFlush = false) {
    if (!options) {
      options = {};
    }
    options.isStartOfList = options.isStartOfList || false;
    options.isEndOfList = options.isEndOfList || false;
    await this.scheduleJob({
      method: "addCompleteItemRange",
      items,
      options,
    }, forceInstantFlush);
  }

  public async handleItemRangeUpdates(updates: Models.ItemList.ItemRangeUpdateResult<T>[]) {
    await this.scheduleJob({
      method: "itemRangeUpdate",
      updates,
    });
  }

  private async execute_deleteItems(itemIds: string[], data: UpdateAssemblyObject<T>) {
    const items = await this.db.items.where('id').anyOf(itemIds).toArray();
    helpers.deleteItemsFromChunks<T>(items, data);
  }

  private async execute_addCompleteItemRange(items: T[], data: UpdateAssemblyObject<T>, options: ItemRangeOptions) {
    const createdBefore = options.createdBefore;
    const createdAfter = options.createdAfter;
    const { chunksArray, updates: { chunksToUpsert, chunksToDelete, itemsToUpsert } } = data;

    // sort desc, most recent item is [0]
    const sortedNewItems = [...items].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    let startDate = sortedNewItems[sortedNewItems.length - 1]?.createdAt || createdAfter;
    let endDate = sortedNewItems[0]?.createdAt || createdBefore;

    if (!startDate) {
      startDate = new Date(0);
    }
    if (!endDate) {
      endDate = new Date(Date.now() - 1000);
    }

    let queryLower = createdAfter || startDate;
    let queryUpper = createdBefore || endDate;
    if (options.isStartOfList) {
      if (createdAfter) console.warn("createdAfter cannot be set together with isStartOfList");
      queryLower = new Date(0);
    }

    const newItemsById = new Map(sortedNewItems.map(d => [d.id, d]));
    const __itemsFromDb = await (this.db.items.where('[__dbName+createdAt]').between([this.dbName, queryLower], [this.dbName, queryUpper], !createdAfter, !createdBefore).reverse().toArray().catch(e => {
      return [];
    }));

    // const sortedItemsFromDb = [...__itemsFromDb].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const itemsToDelete: T[] = [];
    const newItemsNotYetPresentInDb: T[] = [];

    for (const existingItem of __itemsFromDb) {
      if (existingItem.sendStatus !== undefined) {
        // don't touch temporary items
        continue;
      }
      const newItem = newItemsById.get(existingItem.id);
      if (!newItem) {
        // item is not in new items, so it must be deleted
        itemsToDelete.push(existingItem);
        continue;
      }
      else if (existingItem.updatedAt < newItem.updatedAt) {
        itemsToUpsert.set(newItem.id, newItem);
      }
      newItemsById.delete(newItem.id);
    }
    for (const unhandledNewItem of Array.from(newItemsById.values())) {
      itemsToUpsert.set(unhandledNewItem.id, unhandledNewItem);
      newItemsNotYetPresentInDb.push(unhandledNewItem);
    }

    if (itemsToDelete.length > 0) {
      helpers.deleteItemsFromChunks<T>(itemsToDelete, data);
    }

    const preparedInsert = helpers.prepareItemRangeInsert<T>(startDate, endDate, options, data);

    this.logInfo(
      `Equal chunk: ${preparedInsert.equal?.chunkId || 'null'}, ` +
      `Next candidate: ${preparedInsert.next?.chunkId || 'null'}, ` +
      `Previous candidate: ${preparedInsert.previous?.chunkId || 'null'},` +
      `Contained in: ${preparedInsert.containedIn?.chunkId || 'null'}`
    );

    // check if empty
    if (
      items.length === 0 &&
      options.isEndOfList &&
      options.isStartOfList
    ) {
      if (chunksArray.length === 0) {
        const now = new Date();
        const newChunk: Models.ItemList.Chunk = {
          itemCount: 0,
          lastAccessed: now,
          startDate: new Date(0),
          endDate: connectionManager.lastDisconnect,
          lastUpdate: connectionManager.lastDisconnect,
          nextChunk: "end-of-list",
          previousChunk: "end-of-list",
          __dbName: this.dbName,
        };
        if (data.updates.chunksToDelete.size > 0) {
          // Todo: This was buggy before (it didn't remove the delete chunk), did this still work?
          for (const deleteCandidate of Array.from(data.updates.chunksToDelete)) {
            if (deleteCandidate.chunkId !== undefined) {
              data.updates.chunksToDelete.delete(deleteCandidate);
              newChunk.chunkId = deleteCandidate.chunkId;
              break;
            }
          }
        }
        chunksToUpsert.add(newChunk);
        chunksArray.push(newChunk);
      }
      else if (chunksArray.length === 1) {
        const chunk = chunksArray[0];
        if (chunk.itemCount === 0) {
          chunk.nextChunk = "end-of-list";
          chunk.previousChunk = "end-of-list";
          chunk.startDate = new Date(0);
          chunk.endDate = connectionManager.lastDisconnect;
          chunk.lastUpdate = connectionManager.lastDisconnect;
          chunksToUpsert.add(chunk);
        }
        else {
          throw new Error("addCompleteItemRange called with empty items, but leftover chunk with itemCount > 0");
        }
      }
      else {
        throw new Error("addCompleteItemRange called with empty items, but more than one leftover chunk");
      }
      return;
    }

    if (preparedInsert.containedIn !== null) {
      if (options.isEndOfList && preparedInsert.containedIn.nextChunk !== "end-of-list") {
        if (preparedInsert.containedIn.nextChunk !== null) {
          throw new Error("containedIn.nextChunk is not end-of-list but isEndOfList is set");
        }
        preparedInsert.containedIn.nextChunk = "end-of-list";
        chunksToUpsert.add(preparedInsert.containedIn);
      }
    }
    else if (preparedInsert.equal !== null) {
      const chunk = preparedInsert.equal;
      if (chunk.itemCount !== items.length) {
        chunk.itemCount = items.length;
        chunk.lastAccessed = new Date();
        chunksToUpsert.add(chunk);
      }
      if (chunk.lastUpdate < connectionManager.lastDisconnect) {
        chunk.lastUpdate = connectionManager.lastDisconnect;
        chunksToUpsert.add(chunk);
      }

      // set nextChunk
      if (preparedInsert.next !== null) {
        if (chunk.nextChunk !== 'end-of-list' && chunk.nextChunk !== null && !chunksToDelete.has(chunk.nextChunk) && chunk.nextChunk !== preparedInsert.next) {
          this.logWarn(`equalChunk.next is not end-of-list or null but will be set, leaving an orphaned nextChunk.`, chunk, chunk.nextChunk);
        }
        chunk.nextChunk = preparedInsert.next;
        if (preparedInsert.next.previousChunk !== null && preparedInsert.next.previousChunk !== chunk) {
          this.logWarn(`affectedChunks.next has a previousChunk or end-of-list, this is unexpected.`, preparedInsert.next);
        }
        preparedInsert.next.previousChunk = chunk;
        chunksToUpsert.add(chunk);
        chunksToUpsert.add(preparedInsert.next);
      }

      // set previousChunk
      if (preparedInsert.previous !== null) {
        if (chunk.previousChunk !== 'end-of-list' && chunk.previousChunk !== null && !chunksToDelete.has(chunk.previousChunk)) {
          this.logWarn(`equalChunk.previousChunk is not end-of-list or null but will be set, leaving an orphaned previousChunk.`, chunk, chunk.previousChunk);
        }
        if (options.isStartOfList) {
          this.logWarn(`affectedChunks.previous present while isStartOfList is set, this is unexpected. Still linking chunks...`, chunk, preparedInsert.previous);
        }
        chunk.previousChunk = preparedInsert.previous;
        preparedInsert.previous.nextChunk = chunk;
        chunksToUpsert.add(chunk);
        chunksToUpsert.add(preparedInsert.previous);
      }

      if (options.isEndOfList && chunk.nextChunk === null && !!this.chunks && chunk === this.chunks[0]) {
        chunk.nextChunk = "end-of-list";
        chunksToUpsert.add(chunk);
      }
      if (options.isStartOfList && chunk.previousChunk !== "end-of-list") {
        chunk.previousChunk = "end-of-list";
        chunksToUpsert.add(chunk);
      }
    }
    else { // no equal chunk exists
      let remainingInsertItems = [...sortedNewItems];

      if (preparedInsert.previous && remainingInsertItems.length > 0) {
        remainingInsertItems = helpers.fillAndRemoveDuplicateItems<T>(preparedInsert.previous, remainingInsertItems, 'array-end', data);
      }

      if (preparedInsert.next && remainingInsertItems.length > 0) {
        remainingInsertItems = helpers.fillAndRemoveDuplicateItems<T>(preparedInsert.next, remainingInsertItems, 'array-start', data);
      }

      if (remainingInsertItems.length > 0) {
        helpers.createChunksFromSortedItems<T>(remainingInsertItems, {
          dbName: this.dbName,
          isStartOfList: options.isStartOfList,
          isEndOfList: options.isEndOfList,
          nextChunk: preparedInsert.next,
          previousChunk: preparedInsert.previous,
        }, data);
      }
      else if (preparedInsert.next && preparedInsert.previous) {
        if (
          preparedInsert.next.previousChunk !== preparedInsert.previous ||
          preparedInsert.previous.nextChunk !== preparedInsert.next
        ) {
          preparedInsert.next.previousChunk = preparedInsert.previous;
          preparedInsert.previous.nextChunk = preparedInsert.next;
          chunksToUpsert.add(preparedInsert.next);
          chunksToUpsert.add(preparedInsert.previous);
        }
        // Anything else todo here?
      }
      else if (preparedInsert.previous && options.isEndOfList && preparedInsert.previous.nextChunk !== "end-of-list") {
        preparedInsert.previous.nextChunk = "end-of-list";
        chunksToUpsert.add(preparedInsert.previous);
      }
      else if (preparedInsert.next && options.isStartOfList && preparedInsert.next.previousChunk !== "end-of-list") {
        preparedInsert.next.previousChunk = "end-of-list";
        chunksToUpsert.add(preparedInsert.next);
      }
    }
  }

  private async updateChunksAndItemsInDb(data: UpdateAssemblyObject<T>): Promise<BroadcastChunkUpdate | null>{
    const { chunksToUpsert, chunksToDelete, itemsToUpsert, itemIdsToDelete } = data.updates;
    if (chunksToUpsert.size === 0 && chunksToDelete.size === 0 && itemsToUpsert.size === 0 && itemIdsToDelete.size === 0) {
      return null;
    }

    for (const deleteChunk of Array.from(chunksToDelete)) {
      chunksToUpsert.delete(deleteChunk);
    }
    for (const idToDelete of Array.from(itemIdsToDelete)) {
      itemsToUpsert.delete(idToDelete);
    }

    const lastUpdate = connectionManager.lastDisconnect;
    const chunksToUpsertArray = Array.from(chunksToUpsert);

    // both arrays need to have the same length
    const chunksWithoutId = chunksToUpsertArray.filter(chunk => chunk.chunkId === undefined);
    const newChunksWithoutIdForBulkAdd = chunksWithoutId.map(chunk => {
      const { nextChunk, previousChunk, ..._newChunk } = chunk;
      const newChunk = _newChunk as typeof _newChunk & {
        nextChunkId: number | null;
        previousChunkId: number | null;
      };
      newChunk.__dbName = this.dbName;
      newChunk.nextChunkId = null;
      newChunk.previousChunkId = null;
      return newChunk as typeof newChunk & { chunkId: number };
    });

    const chunkIdsToDeleteArray =
      Array.from(chunksToDelete).map(chunk => chunk.chunkId).filter(chunkId => chunkId !== undefined) as number[];

    // update chunks and items
    await this.db.transaction(
      'rw',
      ['chunks', 'items'],
      async (tx) => {
        // chunksWithoutIdArrayForBulkAdd and chunksWithoutId have the same length
        if (newChunksWithoutIdForBulkAdd.length > 0) {
          const chunkIds = await tx.chunks.bulkAdd(newChunksWithoutIdForBulkAdd, { allKeys: true });
          for (let i = 0; i < chunksWithoutId.length; i++) {
            const chunkId = chunkIds[i];
            const chunk = chunksWithoutId[i];
            chunk.chunkId = chunkId;
          }
        }

        // this needs to happen inside the transaction, otherwise some chunkIds might be missing
        const chunksToPutArray = chunksToUpsertArray.map(chunk => {
          const dbChunk: Models.ItemList.ChunkFromDb & Partial<Models.ItemList.Chunk> = {
            ...chunk as typeof chunk & { chunkId: number },
            __dbName: this.dbName,
            lastUpdate,
            nextChunkId: chunk.nextChunk === "end-of-list" ? "end-of-list" : chunk.nextChunk?.chunkId || null,
            previousChunkId: chunk.previousChunk === "end-of-list" ? "end-of-list" : chunk.previousChunk?.chunkId || null,
          };
          delete dbChunk.nextChunk;
          delete dbChunk.previousChunk;
          return dbChunk;
        });

        for (const chunk of chunksToUpsertArray) {
          if (chunk.chunkId === undefined) {
            throw new Error(`All chunks must have chunkIds at this point, something is wrong with adding the chunks before here.`);
          }
        }

        if (itemIdsToDelete.size > 0) {
          tx.items.bulkDelete(Array.from(itemIdsToDelete));
        }
        if (itemsToUpsert.size > 0) {
          tx.items.bulkPut(Array.from(itemsToUpsert.values()).map(item => ({ ...item, __dbName: this.dbName})));
        }

        if (chunkIdsToDeleteArray.length > 0) {
          tx.chunks.bulkDelete(chunkIdsToDeleteArray);
        }
        if (chunksToPutArray.length > 0) {
          tx.chunks.bulkPut(chunksToPutArray);
        }
      }
    );

    return {
      updatedChunks: chunksToUpsertArray.map(chunk => unsafe_serializeChunk({
        ...chunk,
        lastUpdate,
      })).sort((a, b) => b.startDate.getTime() - a.startDate.getTime()),
      deletedChunkIds: new Set(chunkIdsToDeleteArray),
    };
  }

  /**
   * Updates (only already existing) items in database.
   * Partial updates are allowed.
   * WARNING: deletes properties that are explicitly
   * set to undefined.
   * @param items Partial items of subtype of T, even if subtype is not partial
   */
  public async updateItems(items: (Partial<T> & Omit<Models.ItemList.Item, "createdAt" | "updatedAt">)[]) {
    await this.ready;
    await this.db.transaction(
      'rw',
      ['items'],
      async tx => {
        const existingItems = (await tx.items.bulkGet(items.map(item => item.id)))
          .filter(value => value !== undefined) as T[];
        const existingItemsById = new Map(existingItems.map(item => [item.id, item]));
        const itemUpdatesById = new Map(
          items
            .filter(item => existingItemsById.has(item.id))
            .map(item => [item.id, item])
        )
        const actualUpdates = existingItems
          .map(item => ({
            ...(itemUpdatesById.get(item.id) as Omit<T, "createdAt">),
            createdAt: item.createdAt,
          }));

        await this.db.items.bulkUpdate(actualUpdates.map(item => ({
          key: item.id,
          changes: item,
        }) as any));
      }
    )
  }

  public async clearDatabase(options?: { close?: boolean }) {
    if (options?.close === true) {
      this.broadcastChannel.onmessage = () => {};
    }

    await this.scheduleJob({ method: "fullDatabaseClear" }, true);

    if (options?.close === true) {
      this.broadcastChannel.close();
      this.closed = true;
      for (const itemList of this.__itemLists) {
        itemList.destroy();
      }
      this.__itemLists = [];
      activeDatabases.delete(this.dbName);
    }
  }

  public async close(options: { markAsStale: boolean }) {
    this.broadcastChannel.onmessage = () => {};

    for (const itemList of this.__itemLists) {
      itemList.destroy();
    }
    this.__itemLists = [];

    // await all pending actions
    if (!!this.flushWaitingForResolve && !this.flushWaitingForResolve.resolved) {
      this.flushWaitingForResolve.resolve();
    }
    if (this.nextFlushPromise) {
      await Promise.allSettled([this.nextFlushPromise]);
    }
    this.closed = true;

    if (options.markAsStale) {
      const latestChunk = this.__chunks?.[0];
      if (latestChunk?.chunkId) {
        await this.db.chunks.update(latestChunk.chunkId, {
          nextChunkId: null,
          lastUpdate: new Date(connectionManager.lastDisconnect.getTime() - 1),
        });
      }
    }
    this.broadcastChannel.close();
    activeDatabases.delete(this.dbName);
  }
}
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { Observable, Subscription, liveQuery } from "dexie";
import ChunkedItemDatabase from "./chunkedDatabase";
import connectionManager from "../../appstate/connection";
import errors from "common/errors";
import config from "common/config";

export const INFINITE_ENDDATE = new Date("2100-01-01");

type LiveQueryObject<T> = {
  startDate: Date;
  endDate: Date;
  initiallyLoaded: boolean;
  observable: Observable<T[]>;
  subscription: Subscription;
  items: T[];
};

export function logCurrentChunks(chunks: Models.ItemList.Chunk[]) {
  console.log("Current chunks:", JSON.parse(JSON.stringify(chunks.map(chunk => {
    const { nextChunk, previousChunk, ..._chunk } = chunk;
    return {
      ..._chunk,
      nextChunk: nextChunk === "end-of-list" ? "end-of-list" : !nextChunk ? null : nextChunk.chunkId !== undefined ? nextChunk.chunkId : "chunk-no-id",
      previousChunk: previousChunk === "end-of-list" ? "end-of-list" : !previousChunk ? null : previousChunk.chunkId !== undefined ? previousChunk.chunkId : "chunk-no-id",
    }
  }))));
}

export default class ItemList<T extends Models.ItemList.Item> implements Models.ItemList.ItemList<T> {
    private chunkedDatabase: ChunkedItemDatabase<T>;
    public items: T[] = [];
    private allChunks?: Models.ItemList.Chunk[];
    public oldestChunk: Models.ItemList.Chunk | null = null;
    public newestChunk: Models.ItemList.Chunk | null = null;
    private startDate: Date | null = null;
    private endDate: Date | null = null;
    private liveQueryObject: LiveQueryObject<T> | null = null;
    private isDestroyed = false;
    private updateListeners = new Set<Models.ItemList.ItemListUpdateListener<T>>();
    private ondestroy: () => void;
    public ready: Promise<void>;
    private scheduleItemRangeUpdate: (updateJob: Models.ItemList.ItemRangeUpdateJob) => void;
    private waitingForLiveQueryInitialLoad: (() => void)[] = [];
    private dbName: string;

    constructor({
      chunkedDatabase,
      scheduleItemRangeUpdate,
      ondestroy,
      flushPromise,
    }: {
      chunkedDatabase: ChunkedItemDatabase<T>;
      scheduleItemRangeUpdate: (updateJob: Models.ItemList.ItemRangeUpdateJob) => void;
      ondestroy: () => void;
      flushPromise?: Promise<void>;
    }) {
      this.chunkedDatabase = chunkedDatabase;
      this.allChunks = chunkedDatabase.chunks ? [...chunkedDatabase.chunks] : undefined;
      if (flushPromise) {
        this.ready = Promise.allSettled([chunkedDatabase.ready, flushPromise]).then(() => undefined);
      }
      else {
        this.ready = chunkedDatabase.ready;
      }
      this.dbName = chunkedDatabase.databaseName;
      this.ondestroy = ondestroy;
      this.scheduleItemRangeUpdate = scheduleItemRangeUpdate;
      this.chunksAccessed = this.chunksAccessed.bind(this);

      connectionManager.registerClientEventHandler("cliConnectionEstablished", this.chunksAccessed);
      connectionManager.registerClientEventHandler("cliConnectionRestored", this.chunksAccessed);
      document.addEventListener("visibilitychange", this.chunksAccessed);
    }

    private chunksAccessed() {
      if (this.isDestroyed === false && document.visibilityState === 'visible') {
        this.updateStateByChunks(false);
      }
    }

    public get state(): Models.ItemList.ItemListState<T> {
      return {
        items: this.items,
        isDestroyed: this.isDestroyed,
        ready: this.chunkedDatabase.isReady,
        rangeStart: this.startDate,
        rangeEnd: this.endDate,
        hasNextItemsLocally: !!this.newestChunk && this.newestChunk.nextChunk !== "end-of-list" && this.newestChunk.nextChunk !== null,
        hasNextItemsOnRemote: !!this.newestChunk && this.newestChunk.nextChunk === null,
        hasPreviousItemsLocally: !!this.oldestChunk && this.oldestChunk.previousChunk !== "end-of-list" && this.oldestChunk.previousChunk !== null,
        hasPreviousItemsOnRemote: !!this.oldestChunk && this.oldestChunk.previousChunk === null,
        withStartOfList: !!this.oldestChunk && this.oldestChunk.previousChunk === "end-of-list",
        withEndOfList: !!this.newestChunk && this.newestChunk.nextChunk === "end-of-list",
        isEmpty: !!this.newestChunk && this.newestChunk === this.oldestChunk && this.newestChunk.itemCount === 0 && this.newestChunk.nextChunk === "end-of-list" && this.newestChunk.previousChunk === "end-of-list",
      };
    };

    public addUpdateListener(listener: Models.ItemList.ItemListUpdateListener<T>) {
      if (this.isDestroyed) {
        throw new Error("ItemList is destroyed");
      }
      this.updateListeners.add(listener);
    }

    public removeUpdateListener(listener: Models.ItemList.ItemListUpdateListener<T>) {
      this.updateListeners.delete(listener);
    }

    public async init(options: Models.ItemList.ItemListInitOptions) {
      console.log("ItemList init", options);
      if (!options.minimumItemCount) {
        options.minimumItemCount = config.ITEMLIST_BATCH_SIZE;
      }
      if (this.isDestroyed) {
        throw new Error("ItemList is destroyed");
      }
      await this.ready;
      let itemCount = 0;
      switch (options.type) {
        case "atItemId":
        case "atDate": {
          let searchDate: Date;
          if (options.type === "atItemId") {
            const item = await this.chunkedDatabase.db.items.get({ id: options.itemId });
            if (item) {
              searchDate = item.createdAt;
            }
            else {
              throw new Error(errors.client.NOT_FOUND);
            }
          }
          else {
            searchDate = options.date;
          }
          const chunk = this.chunkedDatabase.chunks?.find(chunk => {
            return searchDate >= chunk.startDate && searchDate <= chunk.endDate;
          });
          if (chunk) {
            let added = 0;
            itemCount += chunk.itemCount;
            let currentChunk = chunk;
            this.newestChunk = chunk;
            this.oldestChunk = chunk;

            while (currentChunk.previousChunk !== "end-of-list" && currentChunk.previousChunk !== null && added < options.minimumItemCount) {
              currentChunk = currentChunk.previousChunk;
              added += currentChunk.itemCount;
              itemCount += currentChunk.itemCount;
              this.oldestChunk = currentChunk;
            }
            added = 0;
            currentChunk = chunk;
            while (currentChunk.nextChunk !== "end-of-list" && currentChunk.nextChunk !== null && added < options.minimumItemCount) {
              currentChunk = currentChunk.nextChunk;
              added += currentChunk.itemCount;
              itemCount += currentChunk.itemCount;
              this.newestChunk = currentChunk;
            }
          }
          else {
            throw new Error(`Chunk for searchDate ${searchDate} not found`);
          }
          break;
        }

        case "recent": {
          const chunks = this.chunkedDatabase.chunks;
          if (!!chunks && chunks.length > 0) {
            let currentChunk = chunks[0];
            this.newestChunk = currentChunk;
            let added = currentChunk.itemCount;
            itemCount += currentChunk.itemCount;
            
            while (currentChunk.previousChunk !== "end-of-list" && currentChunk.previousChunk !== null && added < options.minimumItemCount) {
              currentChunk = currentChunk.previousChunk;
              added += currentChunk.itemCount;
              itemCount += currentChunk.itemCount;
            }
            this.oldestChunk = currentChunk;
          }
          break;
        }
      }

      this.updateStateByChunks(true);
      return itemCount;
    }

    private notify() {
      if (this.liveQueryObject && this.liveQueryObject.initiallyLoaded === false) {
        // will be notified on initial load anyway
        return;
      }
      let items: T[] = this.liveQueryObject?.items || [];
      this.items = items;
      const update = this.state;
      for (const listener of Array.from(this.updateListeners)) {
        listener(update);
      }
    }

    public destroy(notify = true) {
      if (!this.isDestroyed) {
        this.isDestroyed = true;
        this.liveQueryObject?.subscription.unsubscribe();
        this.items = [];
        const update: Models.ItemList.ItemListState<T> = {
          items: [],
          isDestroyed: true,
          ready: false,
          rangeStart: null,
          rangeEnd: null,
          hasNextItemsLocally: false,
          hasNextItemsOnRemote: false,
          hasPreviousItemsLocally: false,
          hasPreviousItemsOnRemote: false,
          withStartOfList: false,
          withEndOfList: false,
          isEmpty: false,
        };
        connectionManager.unregisterClientEventHandler("cliConnectionEstablished", this.chunksAccessed);
        connectionManager.unregisterClientEventHandler("cliConnectionRestored", this.chunksAccessed);
        document.removeEventListener("visibilitychange", this.chunksAccessed);
        if (notify) {
          for (const listener of Array.from(this.updateListeners)) {
            listener(update);
          }
        }
        this.updateListeners.clear();
        this.ondestroy();
      }
    }

    public update(options: Models.ItemList.ItemListUpdateOptions): Promise<void> {
      if (this.isDestroyed) return Promise.reject();
      if (!this.newestChunk || !this.oldestChunk) {
        throw new Error(`ItemList is not initialized or without items.`);
      }
      const { growStart, shrinkStart, growEnd, shrinkEnd } = options;
      if ((!!growStart && !!shrinkStart) || (!!growEnd && !!shrinkEnd)) {
        throw new Error("Invalid call: can only have growStart or shrinkStart (same for growEnd and shrinkEnd)");
      }
      if (!growStart && !shrinkStart && !growEnd && !shrinkEnd) {
        throw new Error("No empty options allowed");
      }
      let next_newestChunk = this.newestChunk;
      let next_oldestChunk = this.oldestChunk;
      if (growStart) {
        let count = 0;
        while (count < growStart && next_oldestChunk.previousChunk !== null && next_oldestChunk.previousChunk !== "end-of-list") {
          next_oldestChunk = next_oldestChunk.previousChunk;
          count += next_oldestChunk.itemCount;
        }
      }
      if (growEnd) {
        let count = 0;
        while (count < growEnd && next_newestChunk.nextChunk !== null && next_newestChunk.nextChunk !== "end-of-list") {
          next_newestChunk = next_newestChunk.nextChunk;
          count += next_newestChunk.itemCount;
        }
      }
      if (shrinkStart) {
        let count = 0;
        while (count < shrinkStart && next_oldestChunk.nextChunk !== null && next_oldestChunk.nextChunk !== "end-of-list") {
          if (next_oldestChunk === next_newestChunk) {
            break;
          }
          count += next_oldestChunk.itemCount;
          next_oldestChunk = next_oldestChunk.nextChunk; 
        }
      }
      if (shrinkEnd) {
        let count = 0;
        while (count < shrinkEnd && next_newestChunk.previousChunk !== null && next_newestChunk.previousChunk !== "end-of-list") {
          if (next_newestChunk === next_oldestChunk) {
            break;
          }
          count += next_newestChunk.itemCount;
          next_newestChunk = next_newestChunk.previousChunk;
        }
      }

      if (this.oldestChunk !== next_oldestChunk || this.newestChunk !== next_newestChunk) {
        this.oldestChunk = next_oldestChunk;
        this.newestChunk = next_newestChunk;
        this.updateStateByChunks(true);

        if (this.liveQueryObject?.initiallyLoaded === false) {
          return new Promise(resolve => this.waitingForLiveQueryInitialLoad.push(resolve));
        }
      }
      console.warn("loadPrevious called, but liveQuery did not change");
      return Promise.resolve();
    }

    public chunksChangedListener(allChunks: Models.ItemList.Chunk[]) {
      console.log("ItemList chunksChangedListener");
      logCurrentChunks(allChunks);

      if (this.isDestroyed) return;
      this.allChunks = allChunks;
      let next_newestChunk: Models.ItemList.Chunk | null = null;
      let next_oldestChunk: Models.ItemList.Chunk | null = null;

      if (this.liveQueryObject?.endDate.getTime() === INFINITE_ENDDATE.getTime()) {
        // we're at the most recent items
        next_newestChunk = allChunks[0] || null;
      }

      for (const chunk of allChunks) {
        if (
          chunk &&
          ((
            chunk.previousChunk !== null &&
            chunk.previousChunk !== "end-of-list" &&
            chunk.previousChunk.nextChunk !== chunk
          ) || (
            chunk.nextChunk !== null &&
            chunk.nextChunk !== "end-of-list" &&
            chunk.nextChunk.previousChunk !== chunk
          ))
        ) {
          console.error("Integrity error: Chunks are not linked correctly.", chunk, allChunks);
          throw new Error(errors.client.INTEGRITY);
        }

        // get next_newestChunk
        if (!next_newestChunk && !!this.newestChunk && !!this.endDate) {
          if (
            chunk.chunkId === this.newestChunk.chunkId ||
            chunk.endDate.getTime() === this.newestChunk.endDate.getTime() ||
            chunk.previousChunk === 'end-of-list'
          ) {
            next_newestChunk = chunk;
          }
          else if (chunk.endDate < this.endDate) {
            if (chunk.nextChunk === "end-of-list" || chunk.nextChunk === null) {
              next_newestChunk = chunk;
            }
            else {
              next_newestChunk = chunk.nextChunk;
            }
          }
        }

        // get next_oldestChunk
        if (!next_oldestChunk && !!this.oldestChunk && !!this.startDate) {
          if (
            chunk.chunkId === this.oldestChunk.chunkId ||
            chunk.startDate.getTime() <= this.oldestChunk.startDate.getTime() ||
            chunk.startDate < this.startDate ||
            chunk.previousChunk === 'end-of-list'
          ) {
            next_oldestChunk = chunk;
          }
        }

        if (!!next_newestChunk && !!next_oldestChunk) {
          break;
        }
      }

      if (!next_oldestChunk) {
        if (next_newestChunk) {
          next_oldestChunk = next_newestChunk;
        }
        else if (allChunks.length > 0) {
          next_newestChunk = allChunks[0];
          next_oldestChunk = allChunks[0];
        }
      }

      this.newestChunk = next_newestChunk;
      this.oldestChunk = next_oldestChunk;
      this.updateStateByChunks(true);
    }

    private updateLiveQuery(): void {
      const { startDate, endDate } = this;
      if (!startDate || !endDate) {
        console.log("LiveQuery not updated", startDate, endDate)
        this.liveQueryObject?.subscription.unsubscribe();
        this.liveQueryObject = null;
        return;
      }

      const liveQueryUpdateRequired =
        !this.liveQueryObject ||
        this.liveQueryObject.startDate.getTime() !== startDate.getTime() ||
        this.liveQueryObject.endDate.getTime() !== endDate.getTime();

      if (liveQueryUpdateRequired) {
        console.log("LiveQuery updated", startDate, endDate)
        this.liveQueryObject?.subscription.unsubscribe();
        const result: LiveQueryObject<T> = {
          startDate,
          endDate,
          initiallyLoaded: false,
          items: [],
          observable: undefined as any,
          subscription: undefined as any,
        };
        result.observable = liveQuery(() => {
          return this.chunkedDatabase.db.items
            .where('[__dbName+createdAt]')
            .between([this.dbName, startDate], [this.dbName, endDate], true, true)
            .toArray()
            .catch(e => {
              console.error("Error while loading items", e);
              return [];
            });
        });
        result.subscription = result.observable.subscribe({
          next: (items) => {
            console.log("LiveQuery update", items);
            if (!result.initiallyLoaded) {
              result.initiallyLoaded = true;
              for (const resolve of this.waitingForLiveQueryInitialLoad.splice(0)) {
                resolve();
              }
            }
            result.items = items;
            this.notify();
          },
          error: error => console.log(`Error while loading items`, error),
        });
        this.liveQueryObject = result;
      }
      else {
        console.log("LiveQuery not updated", startDate, endDate)
      }
    }

    private updateStateByChunks(notify: boolean): void {
      const chunksToLoadUpdates: Models.ItemList.Chunk[] = [];
      let { newestChunk, oldestChunk } = this;
      if (!newestChunk || !oldestChunk) {
        this.startDate = null;
        this.endDate = null;
        this.liveQueryObject?.subscription.unsubscribe();
        this.liveQueryObject = null;
        if (notify) {
          this.notify();
        }
      }
      else {
        // check chunks for integrity
        let currentChunk: Models.ItemList.Chunk = newestChunk;
        const accessedChunkIds: number[] = [];

        const visitedChunks: Set<Models.ItemList.Chunk> = new Set();
        while (true) {
          // make sure there are no circular references
          if (visitedChunks.has(currentChunk)) {
            throw new Error("Cannot update ItemList: Circular chunk reference");
          }
          visitedChunks.add(currentChunk);

          // check if chunk needs to be updated
          if (currentChunk.lastUpdate < connectionManager.lastDisconnect && connectionManager.webSocketState === "connected") {
            chunksToLoadUpdates.push(currentChunk);
          }

          if (currentChunk.lastAccessed.getTime() < Date.now() - 60_000 && currentChunk.chunkId !== undefined) {
            // only update chunks that are not marked as accessed within the last 60 seconds
            accessedChunkIds.push(currentChunk.chunkId);
          }
          if (currentChunk.chunkId === oldestChunk.chunkId) {
            if (currentChunk !== oldestChunk) {
              this.oldestChunk = currentChunk;
            }
            break;
          }
          if (currentChunk.endDate <= oldestChunk.startDate) {
            throw new Error("Cannot update ItemList: Newest and oldest chunks are not linked");
          }
          if (currentChunk.previousChunk === "end-of-list" || currentChunk.previousChunk === null) {
            this.oldestChunk = currentChunk;
            break;
          }
          else {
            currentChunk = currentChunk.previousChunk;
          }
        }

        // check if chunk is stale but endOfList, will be fixed by chunkedDatabase.chunksAccessed
        if (
          newestChunk.nextChunk === "end-of-list" && newestChunk.lastUpdate < connectionManager.lastDisconnect &&
          newestChunk.chunkId !== undefined && accessedChunkIds[0] !== newestChunk.chunkId
        ) {
          accessedChunkIds.unshift(newestChunk.chunkId);
        }

        if (accessedChunkIds.length > 0) {
          this.chunkedDatabase.chunksAccessed(accessedChunkIds);
        }

        for (const chunkToUpdate of chunksToLoadUpdates) {
          this.scheduleItemRangeUpdate({
            rangeStart: chunkToUpdate.startDate,
            rangeEnd: chunkToUpdate.endDate,
            updatedAfter: chunkToUpdate.lastUpdate,
          });
        }

        this.startDate = oldestChunk.startDate;
        this.endDate =
          newestChunk.nextChunk === "end-of-list"
          ? INFINITE_ENDDATE
          : newestChunk.endDate;

        this.updateLiveQuery();
        if (notify) {
          this.notify();
        }
      }
    }
  }
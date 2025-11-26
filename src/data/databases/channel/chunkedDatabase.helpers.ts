// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import errors from "common/errors";
import connectionManager from "../../appstate/connection";
import { PreparedItemRangeInsert, type ItemRangeOptions, type UpdateAssemblyObject } from "./chunkedDatabase";
import config from "common/config";

const CHUNK_SIZE_MIN = 10;
const CHUNK_SIZE_MAX = 40;
const CHUNK_SIZE = 30;

const debugOutput = config.DEPLOYMENT !== 'prod';

export function dbArrayToLinkedChunkMap(dbChunks: Models.ItemList.ChunkFromDb[]) {
  if (debugOutput) {
    console.log("CALLING dbArrayToLinkedChunkMap", dbChunks);
  }
  
  const linkHelperMap = new Map<number, Partial<Models.ItemList.ChunkFromDb> & Models.ItemList.Chunk>();
  for (const dbChunk of dbChunks) {
    linkHelperMap.set(dbChunk.chunkId, {
      ...dbChunk,
      nextChunk: null,
      previousChunk: null,
    });
  }
  for (const unfinishedChunk of Array.from(linkHelperMap.values())) {
    if (unfinishedChunk.nextChunkId !== null && unfinishedChunk.nextChunkId !== undefined) {
      if (unfinishedChunk.nextChunkId === "end-of-list") {
        unfinishedChunk.nextChunk = "end-of-list";
      }
      else {
        const nextChunk = linkHelperMap.get(unfinishedChunk.nextChunkId);
        if (
          !nextChunk ||
          (nextChunk.previousChunkId !== unfinishedChunk.chunkId && nextChunk.previousChunk !== unfinishedChunk)
        ) {
          console.error(`IntegrityError: nextChunk with id ${unfinishedChunk.nextChunkId} could not be found, or nextChunk has incorrect previousChunk. current, next`, unfinishedChunk, nextChunk);
          throw new Error(errors.client.INTEGRITY);
        }
        unfinishedChunk.nextChunk = nextChunk;
      }
    }
    delete unfinishedChunk.nextChunkId;

    if (unfinishedChunk.previousChunkId !== null && unfinishedChunk.previousChunkId !== undefined) {
      if (unfinishedChunk.previousChunkId === "end-of-list") {
        unfinishedChunk.previousChunk = "end-of-list";
      }
      else {
        const previousChunk = linkHelperMap.get(unfinishedChunk.previousChunkId);
        if (
          !previousChunk ||
          (previousChunk.nextChunkId !== unfinishedChunk.chunkId && previousChunk.nextChunk !== unfinishedChunk)
        ) {
          console.error(`IntegrityError: previousChunk with id ${unfinishedChunk.previousChunkId} could not be found, or previousChunk has incorrect nextChunk. current, previous`, unfinishedChunk, previousChunk);
          throw new Error(errors.client.INTEGRITY);
        }
        unfinishedChunk.previousChunk = previousChunk;
      }
    }
    delete unfinishedChunk.previousChunkId;
  }
  if (debugOutput) {
    console.log("FINISHED dbArrayToLinkedChunkMap result", linkHelperMap);
  }
  return linkHelperMap as Map<number, Models.ItemList.Chunk>;
}

export function chunksAccessed<T extends Models.ItemList.Item>(chunkIds: number[], data: UpdateAssemblyObject<T>): { changed: boolean } {
  if (debugOutput) {
    console.log("CALLING chunksAccessed", chunkIds, data);
  }
  const { chunksArray, updates: { chunksToUpsert } } = data;
  const lastAccessed = new Date();
  const accessedIdsSet = new Set(chunkIds);

  // changed only becomes true if a change meaningful for the UI occurs
  let changed = false;

  for (const chunk of chunksArray) {
    if (!!chunk.chunkId && accessedIdsSet.has(chunk.chunkId)) {
      accessedIdsSet.delete(chunk.chunkId);
      chunk.lastAccessed = lastAccessed;
      chunksToUpsert.add(chunk);

      if (chunk.nextChunk === "end-of-list" && chunk.lastUpdate < connectionManager.lastDisconnect) {
        changed = true;
        chunk.nextChunk = null;
      }
    }
    if (accessedIdsSet.size === 0) {
      break;
    }
  }

  if (debugOutput) {
    console.log("FINISHED chunksAccessed result", { changed });
  }

  return { changed };
}

function addNewChunkSingleItem<T extends Models.ItemList.Item>(dbName: string, item: T, previousChunk: Models.ItemList.Chunk | null, data: UpdateAssemblyObject<T>) {
  if (debugOutput) {
    console.log("CALLING addNewChunkSingleItem", dbName, item, previousChunk, data);
  }
  const newChunk: Models.ItemList.Chunk = {
    startDate: item.createdAt,
    endDate: item.createdAt,
    itemCount: 1,
    lastAccessed: new Date(),
    lastUpdate: connectionManager.lastDisconnect,
    nextChunk: 'end-of-list',
    previousChunk,
    __dbName: dbName,
  };
  data.updates.chunksToUpsert.add(newChunk);
  // index for adding newChunk in chunksArray
  let index = 0;
  if (!!previousChunk) {
    previousChunk.nextChunk = newChunk as typeof newChunk & { chunkId: number };
    data.updates.chunksToUpsert.add(previousChunk);
    // find index of previousChunk in chunksArray
    // to prepend item there
    index = data.chunksArray.findIndex(chunk => chunk === previousChunk);
    if (index === -1) {
      data.database.logError(`Previous chunk not found in chunksArray`, previousChunk, data.chunksArray);
      throw new Error(`Previous chunk not found in chunksArray`);
    }
  }
  // insert new chunk into chunksArray
  data.chunksArray.splice(index, 0, newChunk);
  if (debugOutput) {
    console.log("FINISHED addNewChunkSingleItem", data.chunksArray);
  }
}

export function addNewItem<T extends Models.ItemList.Item>(dbName: string, item: T, data: UpdateAssemblyObject<T>) {
  if (debugOutput) {
    console.log("CALLING addNewItem", dbName, item, data);
  }
  const { chunksArray, updates: { chunksToUpsert, itemsToUpsert } } = data;
  itemsToUpsert.set(item.id, item);

  const chunk = chunksArray[0] as Models.ItemList.Chunk | undefined;
  if (!!chunk && chunk.nextChunk === "end-of-list") {
    if (chunk.lastUpdate >= connectionManager.lastDisconnect || chunk.itemCount === 0) {
      // if newest chunk is up to date and end-of-list,
      // add item to it or create new chunk if it's full
      if (chunk.itemCount < CHUNK_SIZE) {
        chunk.endDate = chunk.endDate < item.createdAt ? item.createdAt : chunk.endDate;
        chunk.startDate = chunk.startDate > item.createdAt ? item.createdAt : chunk.startDate;
        chunk.lastAccessed = new Date();
        if (chunk.itemCount === 0 && chunk.lastUpdate < connectionManager.lastDisconnect) {
          chunk.lastUpdate = connectionManager.lastDisconnect;
        }
        chunk.itemCount++;
        chunksToUpsert.add(chunk);
      }
      else {
        // link chunk as previousChunk
        addNewChunkSingleItem<T>(dbName, item, chunk, data);
      }
    }
    // if newest chunk it not up to date but still end-of-list,
    // set its nextChunk to null and create new chunk with item
    else {
      chunk.nextChunk = null;
      chunksToUpsert.add(chunk);
      // do not link chunk as previousChunk, since it's not up to date
      addNewChunkSingleItem<T>(dbName, item, null, data);
    }
  }
  else {
    addNewChunkSingleItem<T>(dbName, item, null, data);
  }
  if (debugOutput) {
    console.log("FINISHED addNewItem", data.chunksArray);
  }
}

/**
* Merges two Chunks into targetChunk, removing
* the obsoleteChunk.
* 
* @param targetChunk 
* @param obsoleteChunk 
*/
export function mergeChunks<T extends Models.ItemList.Item>(targetChunk: Models.ItemList.Chunk, obsoleteChunk: Models.ItemList.Chunk, data: UpdateAssemblyObject<T>) {
  if (debugOutput) {
    console.log("CALLING mergeChunks", targetChunk, obsoleteChunk, data);
  }
  const { chunksArray, updates: { chunksToUpsert, chunksToDelete } } = data;
  chunksToDelete.add(obsoleteChunk);
  chunksToUpsert.add(targetChunk);
  chunksToUpsert.delete(obsoleteChunk);

  // remove obsoleteChunk from chunksArray
  const index = chunksArray.findIndex(chunk => chunk === obsoleteChunk);
  if (index === -1) {
    data.database.logError(`obsoleteChunk not found in chunksArray, could not merge`, obsoleteChunk, chunksArray);
    throw new Error(`Chunk not found in chunksArray`);
  }
  chunksArray.splice(index, 1);

  if (
    targetChunk.nextChunk === obsoleteChunk &&
    obsoleteChunk.previousChunk === targetChunk
  ) {
    targetChunk.nextChunk = obsoleteChunk.nextChunk;
    if (targetChunk.nextChunk !== null && targetChunk.nextChunk !== "end-of-list") {
      targetChunk.nextChunk.previousChunk = targetChunk;
      chunksToUpsert.add(targetChunk.nextChunk);
    }
    targetChunk.endDate = obsoleteChunk.endDate;
  }

  else if (
    targetChunk.previousChunk === obsoleteChunk &&
    obsoleteChunk.nextChunk === targetChunk
  ) {
    targetChunk.previousChunk = obsoleteChunk.previousChunk;
    if (targetChunk.previousChunk !== null && targetChunk.previousChunk !== "end-of-list") {
      targetChunk.previousChunk.nextChunk = targetChunk;
      chunksToUpsert.add(targetChunk.previousChunk);
    }
    targetChunk.startDate = obsoleteChunk.startDate;
  }

  else {
    data.database.logError(`Chunks to merge are not connected`, targetChunk, obsoleteChunk);
    throw new Error(errors.client.INTEGRITY);
  }

  targetChunk.itemCount += obsoleteChunk.itemCount;
  targetChunk.lastUpdate =
    obsoleteChunk.lastUpdate < targetChunk.lastUpdate
      ? obsoleteChunk.lastUpdate
      : targetChunk.lastUpdate;
  targetChunk.lastAccessed =
    obsoleteChunk.lastAccessed > targetChunk.lastAccessed
      ? obsoleteChunk.lastAccessed
      : targetChunk.lastAccessed;

  obsoleteChunk.previousChunk = null;
  obsoleteChunk.nextChunk = null;

  if (debugOutput) {
    console.log("FINISHED mergeChunks", data.chunksArray);
  }
}


function optimizeChunks<T extends Models.ItemList.Item>(chunks: Set<Models.ItemList.Chunk>, data: UpdateAssemblyObject<T>) {
  if (debugOutput) {
    console.log("CALLING optimizeChunks", chunks, data);
  }
  // to have stable indices for changes, traverse
  // the updated chunk indices in descending order
  // (from chunks array end to front)
  const chunksToOptimizeArray = Array.from(chunks);
  for (const chunk of chunksToOptimizeArray) {
    // it is possible that the current chunk
    // has already been merged with a previously
    // processed chunk within this loop,
    // so check condition again
    if (chunk.itemCount < CHUNK_SIZE_MIN) {
      if (
        chunk.nextChunk !== null &&
        chunk.nextChunk !== "end-of-list" &&
        chunk.previousChunk !== null &&
        chunk.previousChunk !== "end-of-list"
      ) {
        // chunk has nextChunk and previousChunk
        // merge with the chunk with the better result
        // (i.e. perfer to merge into a chunk with
        // smaller messageCount)
        if (
          chunk.previousChunk.itemCount <= chunk.nextChunk.itemCount &&
          chunk.previousChunk.itemCount + chunk.itemCount <= CHUNK_SIZE_MAX
        ) {
          // merge into previousChunk, if better and possible
          mergeChunks<T>(chunk.previousChunk, chunk, data);
        }

        else if (
          chunk.nextChunk.itemCount + chunk.itemCount <= CHUNK_SIZE_MAX ||
          chunk.itemCount === 0
        ) {
          // merge into nextChunk, if better and possible
          mergeChunks<T>(chunk.nextChunk, chunk, data);
        }
      }

      else if (
        chunk.nextChunk !== null &&
        chunk.nextChunk !== "end-of-list" &&
        (chunk.nextChunk.itemCount + chunk.itemCount <= CHUNK_SIZE_MAX || chunk.itemCount === 0)
      ) {
        mergeChunks<T>(chunk.nextChunk, chunk, data);
      }

      else if (
        chunk.previousChunk !== null &&
        chunk.previousChunk !== "end-of-list" &&
        (chunk.previousChunk.itemCount + chunk.itemCount <= CHUNK_SIZE_MAX || chunk.itemCount === 0)
      ) {
        mergeChunks<T>(chunk.previousChunk, chunk, data);
      }

      else if (chunk.itemCount === 0) {
        // chunk is empty, delete it if it's not the only chunk
        if (data.chunksArray.length > 1) {
          data.updates.chunksToDelete.add(chunk);
          const index = data.chunksArray.findIndex(c => c === chunk);
          if (index === -1) {
            data.database.logError(`Chunk not found in chunksArray, could not delete`, chunk, data.chunksArray);
          }
          else {
            data.chunksArray.splice(index, 1);
          }
          chunk.previousChunk = null;
          chunk.nextChunk = null;
        }
        else {
          // chunk is the only chunk, do nothing
        }
      }
    }
  }
  if (debugOutput) {
    console.log("FINISHED optimizeChunks", data.chunksArray);
  }
}

/**
 * Delete items from the item database, if the ids exist.
 * Also updates and merges chunks, if necessary.
 * @param items
 */
export function deleteItemsFromChunks<T extends Models.ItemList.Item>(items: T[], data: UpdateAssemblyObject<T>) {
  if (debugOutput) {
    console.log("CALLING deleteItemsFromChunks", items, data);
  }
  const { chunksArray, updates: { chunksToUpsert, itemIdsToDelete } } = data;
  /**
   * Since items and chunks are both ordered
   * by date in descending order, we can simply
   * go through both linearly at the same time.
   * Going through them from most recent to oldest
   * makes sense, because old messages are rarely
   * deleted.
   */
  if (items.length > 0) {
    const chunksToOptimize = new Set<Models.ItemList.Chunk>();
    let chunkIndex = 0;
    // sort items, newest first
    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    for (const item of items) {
      itemIdsToDelete.add(item.id);
      // find the matching chunk where the item
      // potentially belongs: The oldest chunk where
      // startDate is <= item.createdAt
      let chunk: Models.ItemList.Chunk | null | undefined = chunksArray[chunkIndex];
      while (!!chunk && chunk.startDate > item.createdAt) {
        if (chunksArray.length > ++chunkIndex) {
          chunk = chunksArray[chunkIndex];
        } else {
          data.database.logError(`Item to delete can't be matched with a chunk`, item, chunksArray);
        }
      }

      // now check if the item really lies within that
      // chunk (there might have been a gap), so check
      // if chunk.endDate >= item.createdAt
      if (!!chunk && chunk.endDate >= item.createdAt) {
        // item exists in chunk
        chunk.itemCount--;
        if (chunk.itemCount < 0) {
          chunk.itemCount = 0;
          data.database.logError(`Chunk Message count can't be below 0`, chunk);
        }
        chunksToUpsert.add(chunk);
        if (chunk.itemCount < CHUNK_SIZE_MIN) {
          chunksToOptimize.add(chunk);
        }
      }
      else {
        data.database.logError(`Item to delete can't be matched with a chunk`, item, chunksArray);
      }
    }

    optimizeChunks<T>(chunksToOptimize, data);
  }
  if (debugOutput) {
    console.log("FINISHED deleteItemsFromChunks", data.chunksArray);
  }
}

export function createChunksFromSortedItems<T extends Models.ItemList.Item>(items: T[], options: {
  dbName: string;
  isStartOfList?: boolean;
  isEndOfList?: boolean;
  nextChunk: Models.ItemList.Chunk | null;
  previousChunk: Models.ItemList.Chunk | null;
}, data: UpdateAssemblyObject<T>) {
  if (debugOutput) {
    console.log("CALLING createChunksFromSortedItems", items, options, data);
  }
  const { chunksArray, updates: { chunksToUpsert } } = data;
  const {
    dbName,
    isStartOfList,
    isEndOfList,
    nextChunk,
    previousChunk,
  } = options;
  const chunksNoId: Models.ItemList.Chunk[] = [];
  const itemsWithoutChunk = [...items];

  if (isEndOfList && !!nextChunk) {
    throw new Error(`Cannot have nextChunk when isEndOfList is true`);
  }
  if (isStartOfList && !!previousChunk) {
    throw new Error(`Cannot have previousChunk when isStartOfList is true`);
  }

  // create initial Chunk objects
  while (itemsWithoutChunk.length > 0) {
    const itemsInNewChunk = itemsWithoutChunk.splice(0, CHUNK_SIZE);
    chunksNoId.push({
      lastAccessed: new Date(),
      lastUpdate: new Date(),
      itemCount: itemsInNewChunk.length,
      startDate: itemsInNewChunk[itemsInNewChunk.length - 1].createdAt,
      endDate: itemsInNewChunk[0].createdAt,
      nextChunk: null,
      previousChunk: null,
      __dbName: dbName,
    });
  }

  for (let i = 0; i < chunksNoId.length; i++) {
    const chunk = chunksNoId[i];
    chunksToUpsert.add(chunk);
    if (i === 0) {
      if (!!nextChunk) {
        chunk.nextChunk = nextChunk;
        nextChunk.previousChunk = chunk;
        chunksToUpsert.add(nextChunk);
      }
      else if (isEndOfList) {
        chunk.nextChunk = 'end-of-list';
      }
    }
    if (i === chunksNoId.length - 1) {
      if (!!previousChunk) {
        chunk.previousChunk = previousChunk;
        previousChunk.nextChunk = chunk;
        chunksToUpsert.add(previousChunk);
      }
      else if (isStartOfList) {
        chunk.previousChunk = 'end-of-list';
      }
    }
    if (i > 0) {
      const nextChunkInList = chunksNoId[i - 1];
      chunk.nextChunk = nextChunkInList;
      nextChunkInList.previousChunk = chunk;
    }
  }

  // insert new chunks into chunkArray
  let insertAt = 0;
  for (let i = 0; i < chunksArray.length; i++) {
    if (
      chunksArray[i].startDate >= chunksNoId[0].endDate && (
        !(chunksArray[i + 1]) ||
        chunksArray[i + 1].endDate <= chunksNoId[chunksNoId.length - 1].startDate
      )
    ) {
      insertAt = i + 1;
      break;
    }
  }
  chunksArray.splice(insertAt, 0, ...chunksNoId);
  if (debugOutput) {
    console.log("FINISHED createChunksFromSortedItems", data.chunksArray);
  }
}

export function prepareItemRangeInsert<T extends Models.ItemList.Item>(startDate: Date, endDate: Date, options: ItemRangeOptions, data: UpdateAssemblyObject<T>): PreparedItemRangeInsert {
  if (debugOutput) {
    console.log("CALLING prepareItemRangeInsert", startDate, endDate, options, data);
  }
  const { chunksArray, updates: { chunksToUpsert, chunksToDelete } } = data;
  const result: PreparedItemRangeInsert = {
    equal: null,
    next: null,
    previous: null,
    containedIn: null,
  };
  const removeChunks: Models.ItemList.Chunk[] = [];

  // understand how item range fits into chunks
  for (const chunk of chunksArray) {
    // if chunk is newer than items and
    // isEndOfList is true, set to false
    if (options.isEndOfList && chunk.endDate > endDate) {
      data.database.logWarn(`prepareItemRangeInsert: isEndOfList is true, but newer chunk exists. Setting isEndOfList to false.`);
      options.isEndOfList = false;
    }

    // case 1: chunk is identical to items
    if (
      endDate.getTime() === chunk.endDate.getTime() &&
      startDate.getTime() === chunk.startDate.getTime()
    ) {
      result.equal = chunk;
    }
    // case 2: chunk is fully contained in items,
    // or in queried item range
    else if (
      (
        endDate >= chunk.endDate ||
        (
          !!options.createdBefore &&
          options.createdBefore > chunk.endDate
        )
      ) && (
        startDate <= chunk.startDate ||
        (
          !!options.createdAfter &&
          options.createdAfter < chunk.startDate
        )
      )
    ) {
      removeChunks.push(chunk);
      continue;
    }
    // case 3: chunk is older but overlaps,
    // or chunk.endDate equals createdAfter
    else if (
      (
        endDate >= chunk.endDate &&
        startDate >= chunk.startDate &&
        startDate <= chunk.endDate
      ) || (
        !!options.createdAfter &&
        chunk.endDate.getTime() === options.createdAfter.getTime()
      )
    ) {
      result.previous = chunk;
      // break, nothing comes after the previous candidate
      break;
    }
    // case 4: chunk is newer but overlaps,
    // or chunk.startDate equals createdBefore
    else if (
      (
        endDate >= chunk.startDate &&
        startDate <= chunk.startDate &&
        endDate <= chunk.endDate
      ) || (
        !!options.createdBefore &&
        chunk.startDate.getTime() === options.createdBefore.getTime()
      )
    ) {
      if (options.isEndOfList) {
        data.database.logWarn(`prepareItemRangeInsert: isEndOfList is true, but nextCandidate exists. Setting isEndOfList to false.`);
        options.isEndOfList = false;
      }
      result.next = chunk;
      continue;
    }
    // case 5: chunk completely contains item range, but is not equal
    else if (
      startDate >= chunk.startDate &&
      endDate <= chunk.endDate
    ) {
      result.containedIn = chunk;
    }
    // case 6: chunk is unconnectable and older
    else if (
      chunk.endDate < startDate
    ) {
      if (chunk.nextChunk === 'end-of-list') {
        // chunk is the former end of list chunk
        chunk.nextChunk = null;
        chunksToUpsert.add(chunk);
      }
      break;
    }
  }

  // handle chunks which need to be removed
  if (removeChunks.length > 0) {
    const newestRemoveChunk = removeChunks[0];
    const oldestRemoveChunk = removeChunks[removeChunks.length - 1];

    if (
      newestRemoveChunk.nextChunk !== null &&
      newestRemoveChunk.nextChunk !== "end-of-list"
    ) {
      // newestRemoveChunk.nextChunk is an actual chunk
      if (!result.next) {
        result.next = newestRemoveChunk.nextChunk;
      }
      else if (result.next !== newestRemoveChunk.nextChunk) {
        throw new Error("Conflicting nextCandidates");
      }
    }
    if (oldestRemoveChunk.previousChunk === "end-of-list") {
      // oldestRemoveChunk.previousChunk is the start of the list
      options.isStartOfList = true;
      if (result.previous) {
        data.database.logError("Conflicting previousCandidates: oldestRemoveChunk.previousChunk === 'end-of-list', but previousCandidate is set", result.previous);
        throw new Error("Conflicting previousCandidates");
      }
    }
    else if (oldestRemoveChunk.previousChunk !== null) {
      // oldestRemoveChunk.previousChunk is an actual chunk
      if (!result.previous) {
        result.previous = oldestRemoveChunk.previousChunk;
      }
      else if (result.previous !== oldestRemoveChunk.previousChunk) {
        throw new Error("Conflicting previousCandidates");
      }
    }

    for (const removedChunk of removeChunks) {
      chunksToDelete.add(removedChunk);
      const index = chunksArray.findIndex(chunk => chunk === removedChunk);
      if (index >= 0) {
        chunksArray.splice(index, 1);
      }
    }
  }
  if (debugOutput) {
    console.log("FINISHED prepareItemRangeInsert", result);
  }
  return result;
}

export function fillAndRemoveDuplicateItems<T extends Models.ItemList.Item>(chunk: Models.ItemList.Chunk, items: T[], fillFrom: 'array-start' | 'array-end', data: UpdateAssemblyObject<T>) {
  if (debugOutput) {
    console.log("CALLING fillAndRemoveDuplicateItems", chunk, items, fillFrom, data);
  }
  const remaining = items.filter(item => item.createdAt > chunk.endDate || item.createdAt < chunk.startDate);
  if (chunk.itemCount < CHUNK_SIZE && remaining.length > 0) {
    if (fillFrom === 'array-start') {
      if (remaining[0].createdAt > chunk.endDate) {
        data.database.logError(`fillAndRemoveDuplicates: remaining[0].createdAt > chunk.endDate`, chunk, remaining);
      }
      else {
        const addedItems = remaining.splice(0, CHUNK_SIZE - chunk.itemCount);
        chunk.itemCount += addedItems.length;
        chunk.startDate = new Date(Math.min(chunk.startDate.getTime(), addedItems[addedItems.length - 1].createdAt.getTime()));
        chunk.lastAccessed = new Date();
        data.updates.chunksToUpsert.add(chunk);
      }
    }
    else if (fillFrom === 'array-end') {
      if (remaining[remaining.length - 1].createdAt < chunk.startDate) {
        data.database.logError(`fillAndRemoveDuplicates: remaining[remaining.length - 1].createdAt < chunk.startDate`, chunk, remaining);
      }
      else {
        const addedItems = remaining.splice(-1 * (CHUNK_SIZE - chunk.itemCount));
        chunk.itemCount += addedItems.length;
        chunk.endDate = new Date(Math.max(chunk.endDate.getTime(), addedItems[0].createdAt.getTime()));
        chunk.lastAccessed = new Date();
        data.updates.chunksToUpsert.add(chunk);
      }
    }
  }
  if (debugOutput) {
    console.log("FINISHED fillAndRemoveDuplicateItems", remaining);
  }
  return remaining;
}
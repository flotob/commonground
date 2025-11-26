// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import config from "common/config";
import { Dexie } from "dexie";
import dbTracker from "./dbTracker";

export type IdbSetupInfo = {
  idbName: string;
  createdAt: Date;
  createdInOldAppVersion: boolean;
  createdInAppVersion: string;
};

export default class AbstractDatabase<T extends {
  [name: string]: Dexie.Table
}, V extends string = ''> {
  protected db: Dexie & T;
  protected lastKnownConnectionTime?: number;
  private retrievalData: {
    [key in V]: {
      valuesForNextRetrieval: Set<string>;
      valuesCurrentlyInRetrieval: Set<string>;
      activeRetrievalTimeout?: any;
      nextRetrieval?: {
        promise: Promise<void>;
        resolve: () => void;
        reject: (e: any) => void;
      };
    }
  } = {} as any;
  protected debounceRetrievalPeriod = 200;

  constructor(dbName: string) {
    const __dbName = `${config.IDB_PREFIX}_${dbName}`;
    this.db = new Dexie(__dbName, { cache: 'immutable' }) as any;
    const registrationData = dbTracker.registerDatabase(__dbName);

    this.setUpDb({ ...registrationData, idbName: __dbName });
    this.setUpHandlers();
  }

  protected setUpDb(info: IdbSetupInfo): void {
    throw new Error('Needs to be implemented by subclass');
  }

  protected setUpHandlers(): void {
    throw new Error('Needs to be implemented by subclass');
  }

  protected onConnectionLoss(lastKnownConnectionTime: number) {
    throw new Error('Needs to be implemented by subclass');
  }

  protected onConnectionRestored() {
    throw new Error('Needs to be implemented by subclass');
  }

  private renewRetrievalPromise(key: V) {
    const o = {} as {
      promise: Promise<void>;
      resolve: () => void;
      reject: (e: any) => void;
    };
    const promise = new Promise<void>((resolve, reject) => {
      o.resolve = resolve;
      o.reject = reject;
    });
    o.promise = promise;
    this.retrievalData[key].nextRetrieval = o;
  }

  protected scheduleRetrieval(key: V, ids: string[]) {
    if (!this.retrievalData[key]) {
      this.retrievalData[key] = {
        valuesForNextRetrieval: new Set<string>(),
        valuesCurrentlyInRetrieval: new Set<string>(),
      }
    }
    const data = this.retrievalData[key];
    for (const id of ids) {
      data.valuesForNextRetrieval.add(id);
    }
    if (!data.activeRetrievalTimeout && data.valuesForNextRetrieval.size > 0) {
      this.renewRetrievalPromise(key);

      const retrieve = async () => {
        const time = Date.now();
        try {
          await this._retrieveMissing(key);
          data.nextRetrieval?.resolve();
        } catch (e) {
          data.nextRetrieval?.reject(e);
          delete data.activeRetrievalTimeout;
          throw e;
        }
        const duration = Date.now() - time;
        if (data.valuesForNextRetrieval.size > 0) {
          this.renewRetrievalPromise(key);
          data.activeRetrievalTimeout = setTimeout(retrieve, Math.max(this.debounceRetrievalPeriod - duration, 0));
        } else {
          delete data.nextRetrieval;
          delete data.activeRetrievalTimeout;
        }
      }
      data.activeRetrievalTimeout = setTimeout(retrieve, this.debounceRetrievalPeriod);
    }
  }

  protected async awaitNextRetrieval(key: V) {
    const data = this.retrievalData[key];
    if (!!data && !!data.nextRetrieval) {
      await data.nextRetrieval;
    }
  }

  private async _retrieveMissing(key: V) {
    const data = this.retrievalData[key];
    const valuesToRetrieve = data.valuesForNextRetrieval;
    data.valuesForNextRetrieval = new Set();
    // only user ids that are not already in retrieval
    const values = Array.from(valuesToRetrieve).filter(v => !data.valuesCurrentlyInRetrieval.has(v));
    for (const v of values) {
      data.valuesCurrentlyInRetrieval.add(v);
    }
    try {
      await this.retrieveMissing(key, values);
    } catch (e) {
      throw e;
    } finally {
      for (const id of values) {
        data.valuesCurrentlyInRetrieval.delete(id);
      }
    }
  }

  /**
   * This function should retrieve the items defined by key + values,
   * e.g. retrieveMissing('signedUrls', [<...values>]), and add them to
   * the correct dexie database.
   * @param key 
   * @param values 
   */
  protected retrieveMissing(key: V, values: string[]): Promise<void> {
    throw new Error('Needs to be implemented by subclass');
  }
}
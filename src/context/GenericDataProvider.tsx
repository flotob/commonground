// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { useLiveQuery } from "dexie-react-hooks";
import React, { ReactNode, useEffect, useState } from "react";

export type DataState<T> = {
    data: {
        [id: string]: T;
    };
}

export class ViewCountManager {
    private updateTimeout: any = undefined;
    private viewCount: {
        [id: string]: number;
    } = {};

    private listeners: Set<(ids: string[]) => void> = new Set();

    private _update() {
        this.updateTimeout = undefined;
        const ids = Object.keys(this.viewCount);
        for (const listener of Array.from(this.listeners)) {
            listener(ids);
        }
    }

    private update() {
        if (this.updateTimeout === undefined) {
            this.updateTimeout = setTimeout(() => {
                this._update();
            }, 100);
        }
    }

    public get ids() {
        return Object.keys(this.viewCount);
    }

    public registerChangeListener(listener: (ids: string[]) => void) {
        this.listeners.add(listener);
    }

    public unregisterChangeListener(listener: (ids: string[]) => void) {
        this.listeners.delete(listener);
    }

    public registerView(id: string) {
        if (this.viewCount[id] === undefined) {
            this.viewCount[id] = 1;
            this.update();
        }
        else {
            this.viewCount[id]++;
        }
    }

    public registerViews(ids: string[]) {
        let doUpdate = false;
        for (const id of ids) {
            if (this.viewCount[id] === undefined) {
                this.viewCount[id] = 1;
                doUpdate = true;
            }
            else {
                this.viewCount[id]++;
            }
        }
        if (doUpdate) {
            this.update();
        }
    }

    public unregisterView(id: string) {
        setTimeout(() => {
            if (this.viewCount[id] === 1) {
                delete this.viewCount[id];
                this.update();
            }
            else {
                this.viewCount[id]--;
                if (this.viewCount[id] < 0) {
                    throw new Error("Invalid: cannot have less than 0 registered user views");
                } 
            }
        }, 1000);
    }

    public unregisterViews(ids: string[]) {
        setTimeout(() => {
            let doUpdate = false;
            for (const id of ids) {
                if (this.viewCount[id] === 1) {
                    delete this.viewCount[id];
                    doUpdate = true;
                }
                else {
                    this.viewCount[id]--;
                    if (this.viewCount[id] < 0) {
                        throw new Error("Invalid: cannot have less than 0 registered user views");
                    } 
                }
            }
            if (doUpdate) {
                this.update();
            }
            
        }, 1000);
    }
}

export function GenericDataProvider<T extends { id: string }>(props: {
  children: ReactNode;
  viewCountManager: ViewCountManager;
  Context: React.Context<DataState<T>>;
  liveQueryRetriever: (ids: string[]) => Promise<T[]>;
}) {
    const {
      children,
      viewCountManager,
      Context,
      liveQueryRetriever,
    } = props;
    const [ ids, setIds ] = useState<string[]>([]);
    
    useEffect(() => {
        setIds(viewCountManager.ids);
        viewCountManager.registerChangeListener(setIds);
        return () => {
            viewCountManager.unregisterChangeListener(setIds);
        };
    }, [viewCountManager]);

    const data = useLiveQuery(() => {
        return liveQueryRetriever(ids);
    }, [ids]);

    return (
        <Context.Provider value={{
            data: !!data
                ? data.reduce<{[id: string]: T}>((agg, item) => {
                    agg[item.id] = item;
                    return agg;
                }, {})
                : {},
        }}>
          {children}
        </Context.Provider>
    );
}
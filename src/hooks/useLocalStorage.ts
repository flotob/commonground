// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React, { useCallback, useEffect, useRef, useState } from "react";

const changeListeners = new Map<string, Set<(key: string, newValue: string) => void>>();

export type ReadArticlesState = {
    [id: string]: boolean;
};

export type ReadLatestArticleCommentsState = {
    [id: string]: string;
};

export type ReadBlogsState = {
    [id: string]: boolean;
};

export type VisitedCommunitiesState = {
    [id: string]: boolean;
};

export type ExpandedAreasState = {
    [id: string]: boolean;
};

function getValue<T>(defaultValue: T, localStorageKey: string): T {
    const localStorageValue = localStorage.getItem(localStorageKey);

    // If no value was returned from local storage, use the default value.
    if (localStorageValue === null) {
        localStorage.setItem(localStorageKey, JSON.stringify(defaultValue));
        return defaultValue;
    }
    
    try {
        return JSON.parse(localStorageValue);
    } catch (err) {
        // If the local storage value was not valid JSON, return the default value.
        localStorage.setItem(localStorageKey, JSON.stringify(defaultValue));
        return defaultValue;
    }
}

export function deleteEntry(localStorageKey: string) {
    localStorage.removeItem(localStorageKey);
}

export default function useLocalStorage<T>(defaultValue: T, localStorageKey: string): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [value, _setValue] = useState<T>(getValue<T>(defaultValue, localStorageKey));
    const skippedOnce = useRef<boolean>(false);
    const defaultValueJsonRef = useRef<string>(JSON.stringify(defaultValue));
    const localStorageKeyRef = useRef<string>(localStorageKey);
    const skipNextStorageEvent = useRef<boolean>(false);

    const changeEventListener = useCallback((key: string, newValue: string | null) => {
        if (skipNextStorageEvent.current === true) {
            skipNextStorageEvent.current = false;
        } else {
            if (key === localStorageKey) {
                _setValue(newValue === null ? defaultValue : JSON.parse(newValue));
            }
        }
    }, [defaultValue, localStorageKey]);

    useEffect(() => {
        const storageListener = (event: StorageEvent) => {
            if (!!event.key) {
                changeEventListener(event.key, event.newValue);
            }
        };
        const listenerSet = changeListeners.get(localStorageKey);
        if (!listenerSet) {
            changeListeners.set(localStorageKey, new Set());
        }
        changeListeners.get(localStorageKey)?.add(changeEventListener);
        window.addEventListener("storage", storageListener);
        return () => {
            changeListeners.get(localStorageKey)?.delete(changeEventListener);
            window.removeEventListener("storage", storageListener);
        };
    }, [localStorageKey, changeEventListener]);

    const setValue = useCallback((valueOrFn: T | ((old: T) => T)) => {
        if (typeof valueOrFn === 'function') {
            valueOrFn = (valueOrFn as Function)(getValue(defaultValue, localStorageKey));
        }
        skipNextStorageEvent.current = true;
        localStorage.setItem(localStorageKey, JSON.stringify(valueOrFn));
        if (typeof valueOrFn === "function") {
            _setValue(old => {
                const newValue = (valueOrFn as any)(old) as T;
                const jsonString = JSON.stringify(newValue);
                changeListeners.get(localStorageKey)?.forEach(fn => {
                    if (fn !== changeEventListener) {
                        fn(localStorageKey, jsonString);
                    }
                });
                return newValue;
            });
        } else {
            const jsonString = JSON.stringify(valueOrFn);
            changeListeners.get(localStorageKey)?.forEach(fn => {
                if (fn !== changeEventListener) {
                    fn(localStorageKey, jsonString);
                }
            });
            _setValue(valueOrFn);
        }
        
    }, [localStorageKey]);

    useEffect(() => {
        const defaultValueJson = JSON.stringify(defaultValue);
        if (
            skippedOnce.current === true &&
            (
                defaultValueJson !== defaultValueJsonRef.current ||
                localStorageKeyRef.current !== localStorageKey
            )
        ) {
            defaultValueJsonRef.current = defaultValueJson;
            localStorageKeyRef.current = localStorageKey;
            _setValue(getValue<T>(defaultValue, localStorageKey));
        } else {
            skippedOnce.current = true;
        }
    }, [defaultValue, localStorageKey]);

    return [value, setValue];
}
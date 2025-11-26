// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { useMemo, useRef } from 'react';
import signedUrls from '../data/databases/signedUrls';
import { useLiveQuery } from 'dexie-react-hooks';

export function useSignedUrl(id: string | null | undefined): string | undefined {
    const fromCache = useMemo(() => {
        if (id) {
            return signedUrls.getFromCache(id);
        }
    }, [id]);

    const url = useLiveQuery(() => {
        if (!id || !!fromCache) return;
        return signedUrls.getSignedUrl(id);
    }, [id, fromCache]);

    return fromCache?.url || url?.url;
}

/**
 * 
 * @param ids Make sure to use a memoized array of ids here that only changes when the underlying data changes
 * @returns 
 */
export function useSignedUrls(ids: string[]): (string | undefined)[] {
    const idsRef = useRef(ids);
    if (idsRef.current !== ids && (idsRef.current.length !== ids.length || idsRef.current.some((id, i) => id !== ids[i]))) {
        idsRef.current = ids;
    }

    const fromCache = useMemo(() => {
        return idsRef.current.map((id) => signedUrls.getFromCache(id)?.url);
    }, [idsRef.current]);

    const urls = useLiveQuery(() => {
        return signedUrls.getSignedUrls(idsRef.current);
    }, [idsRef.current]);

    return urls?.map(url => url?.url) || fromCache;
}
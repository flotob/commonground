// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import data from "data";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useOwnUser, useOwnWallets } from "./OwnDataProvider";
import userApi from "data/api/user";

const userCacheMap = new Map<string, Models.User.Data>();

export function useUserData(userId?: string) {
  const fromCache = userId ? userCacheMap.get(userId) : undefined;

  const fromDb = useLiveQuery(async () => {
    if (!!userId) {
      const result = await data.user.getUserData(userId);
      if (!!result) {
        userCacheMap.set(userId, result);
      }
      return result;
    }
  }, [userId]);

  return fromDb || fromCache;
}

export function useMultipleUserData(userIds: string[]) {
  const idsRef = useRef<string[]>(userIds);
  const ids = useMemo(() => {
    if (idsRef.current.length !== userIds.length || idsRef.current.some((id, i) => id !== userIds[i])) {
      idsRef.current = userIds;
    }
    return idsRef.current;
  }, [userIds]);

  const fromCache = useMemo(() => {
    return ids.reduce<{ [id: string]: Models.User.Data }>((acc, id) => {
      const userData = userCacheMap.get(id);
      if (!!userData) acc[id] = userData;
      return acc;
    }, {});
  }, [ids]);

  const fromDb = useLiveQuery(async () => {
    const result = await data.user.getMultipleUserData(ids);
    return result.reduce<{ [id: string]: Models.User.Data }>((acc, userData) => {
      if (!!userData) {
        acc[userData.id] = userData;
        userCacheMap.set(userData.id, userData);
      }
      return acc;
    }, {});
  }, [ids]);

  return fromDb || fromCache;
}

export function useDetailledUserData(userId: string | undefined) {
  const ownUser = useOwnUser();
  const ownWallets = useOwnWallets();
  let _result: API.User.getUserProfileDetails.Response | undefined;
  const isSelf = !!ownUser && userId === ownUser.id;
  if (isSelf) {
    _result = {
      detailledProfiles: ownUser.accounts,
      wallets: ownWallets || [],
    };
  }
  const [result, setResult] = useState<API.User.getUserProfileDetails.Response | undefined>(_result);
  const userData = useUserData(isSelf ? undefined : userId);

  useEffect(() => {
    let mounted = true;
    if (isSelf) {
      setResult({
        detailledProfiles: ownUser.accounts,
        wallets: ownWallets || [],
      });
    } else if (!!userData) {
      userApi.getUserProfileDetails({ userId: userData.id }).then(response => {
        if (mounted) setResult(response);
      }).catch(e => console.error("Error loading user detailled data", e));
    }
    return () => { mounted = false };
  }, [ownUser?.id, userData?.id, ownUser?.updatedAt, userData?.updatedAt]);

  return result;
}
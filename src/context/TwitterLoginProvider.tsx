// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React, { useCallback, useRef, useState } from "react";
import twitterApi from "data/api/twitter";
import dayjs from "dayjs";

const REFRESH_THRESHOLD_MINUTES = 30;

type TwitterLoginProviderState = {
  loginUrl: string;
  lastFetch: Date;
  refreshUrl: () => void;
}

export const TwitterLoginContext = React.createContext<TwitterLoginProviderState>({
  loginUrl: '',
  lastFetch: new Date(0),
  refreshUrl: () => {}
});

export function TwitterLoginProvider(props: React.PropsWithChildren) {
  const [loginUrl, setLoginUrl] = useState('');
  const [lastFetch, setLastFetch] = useState(new Date(0));
  const isFetching = useRef(false);

  const refreshUrl = useCallback(async () => {
    if (isFetching.current) return;

    isFetching.current = true;
    try {
      const { url } = await twitterApi.startLogin();
      setLastFetch(new Date());
      setLoginUrl(url);
    } catch (e) {
      console.error('failed to update twitter auth login url');
    }
    isFetching.current = false;
  }, []);

  return (
    <TwitterLoginContext.Provider value={{
      loginUrl,
      lastFetch,
      refreshUrl
    }}>
      {props.children}
    </TwitterLoginContext.Provider>
  )
}

export function useTwitterUrl() {
  const context = React.useContext(TwitterLoginContext);
  const lastFetch = dayjs(context.lastFetch);
  const diff = dayjs().diff(lastFetch, 'minutes');
  if (diff > REFRESH_THRESHOLD_MINUTES) {
    context.refreshUrl();
  }
  
  return context.loginUrl;
}


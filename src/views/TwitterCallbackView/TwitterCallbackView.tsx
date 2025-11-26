// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { useSearchParams } from "react-router-dom";
import useLocalStorage from "hooks/useLocalStorage";
import { useState } from "react";
import twitterApi from "data/api/twitter";

export const TWITTER_LOCAL_STORAGE_KEY = 'TWITTER-USERDATA';

type CallbackState = 'Idle' | 'Loading' | 'Error' | 'Success';

export default function TwitterCallbackView() {
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<CallbackState>('Idle');
  const [, setUserData] = useLocalStorage<API.Twitter.finishLogin.Response | undefined>(undefined, TWITTER_LOCAL_STORAGE_KEY);

  if (state === 'Idle') {
    const attemptFinishLogin = async () => {
      setState('Loading');
      try {
        const result = await twitterApi.finishLogin();
        setUserData(result);
        setState('Success');
        window.close();
      } catch (e) {
        console.error(e);
        setState('Error');
      }
    }

    attemptFinishLogin();
  }

  return (<div className='flex items-center justify-center w-screen h-screen cg-text-main cg-heading-2'>
    {state === 'Idle' && <span>Starting request...</span>}
    {state === 'Loading' && <span>Loading...</span>}
    {state === 'Error' && <span>Something went wrong, please close this window and try again.</span>}
    {state === 'Success' && <span>You may now close this window.</span>}
  </div>);
}
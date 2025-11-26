// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { TWITTER_LOCAL_STORAGE_KEY } from "views/TwitterCallbackView/TwitterCallbackView";
import useLocalStorage from "./useLocalStorage";
import { useCallback, useRef, useState } from "react";
import { useWindowSizeContext } from "context/WindowSizeProvider";
import { useTwitterUrl } from "context/TwitterLoginProvider";
import { useSnackbarContext } from "context/SnackbarContext";
import urls from "data/util/urls";

type TwitterAuthCallback = (onAuthSuccess: API.Twitter.finishLogin.Response) => void;

export const useTwitterAuth = (callback: TwitterAuthCallback) => {
  const enableTwitterRedirect = useRef<boolean>(false);
  const twitterUrl = `${urls.API_URL}Twitter/startLogin`;
  const { isMobile } = useWindowSizeContext();
  const [twitterLocalStorage, setTwitterLocalStorage] = useLocalStorage(null, TWITTER_LOCAL_STORAGE_KEY);
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const { showSnackbar } = useSnackbarContext();

  // Execute callback if twitter is connected
  if (enableTwitterRedirect.current && twitterLocalStorage) {
    enableTwitterRedirect.current = false;
    callback(twitterLocalStorage);
    setTwitterLocalStorage(null);
  }

  const attemptConnectTwitter = useCallback(() => {
    enableTwitterRedirect.current = true;
    try {
      if (isMobile) {
        window.open(twitterUrl, 'twitterTab', 'noopener');
      } else {
        window.open(twitterUrl, '_blank', 'noopener,toolbar=no,scrollbars=no,resizable=yes,width=400,height=600');
      }
    } catch (e) {
      console.error(e);
      if (!isMobile){
        try {
          window.open(twitterUrl, 'twitterTab', 'noopener');
        } catch (error) {
          showSnackbar({ type: 'warning', text: 'Cant open X, check browser settings' });
        }
      } else {
        showSnackbar({ type: 'warning', text: 'Cant open X, check browser settings' });
      }
    }

    // Disable button for a while to avoid spamming
    setButtonDisabled(true);
    setTimeout(() => {
      setButtonDisabled(false);
    }, 2000);
  }, [isMobile, showSnackbar, twitterUrl]);

  return { attemptConnectTwitter, buttonDisabled: buttonDisabled || !twitterUrl };
}
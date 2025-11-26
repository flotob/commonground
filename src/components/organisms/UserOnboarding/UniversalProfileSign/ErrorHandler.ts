// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import errors from "common/errors";
import { Dispatch, SetStateAction } from "react";

export function handleLuksoError(error: any, setError: Dispatch<SetStateAction<string | undefined>>) {
  if (!error.message) {
    setError('Login failed.');
    return;
  }

  switch (error.message) {
    case errors.server.LUKSO_USERNAME_NOT_FOUND:
      setError('No username found for this address. Update your profile with a username and try again.');
      break;
    case errors.server.LUKSO_PROFILE_NOT_FOUND:
      setError('No profile found for this address.');
      break;
    case errors.server.INVALID_SIGNATURE:
      setError('Invalid signature, please try again.');
      break;
    case errors.server.LUKSO_FETCH_FAILED:
      setError('Fetching profile failed.');
      break;
    case errors.server.LUKSO_FETCH_TIMEOUT:
      setError('Fetching profile timed out, please try again.');
      break;
    case errors.server.LUKSO_INVALID_FORMAT:
      setError('Invalid profile format, update your profile using official universal profile tools and try again');
      break;
    default:
      setError('Login failed.');
  }
}

export function handleTwitterError(error: any, setError: Dispatch<SetStateAction<string | undefined>>) {
  if (!error.message) {
    setError('Login failed.');
    return;
  }

  switch (error.message) {
    case errors.server.ACCOUNT_DOES_NOT_EXIST:
      setError('Twitter account does not exist.');
      break;
    case errors.server.TWITTER_FETCH_FAILED:
      setError('Fetching profile data failed.');
      break;
    case errors.server.TWITTER_INTERNAL_ERROR:
      setError('Internal error, please try again.');
      break;
    case errors.server.TWITTER_SESSION_EXPIRED:
      setError('Session expired, please try again.');
      break;
    default:
      setError('Login failed.');
  }
}

// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import urlConfig from '../data/util/urls';

export function postEventToOpenerWindow(event: Events.CgId.SignResponse) {
    if (window.opener && typeof window.opener.postMessage === 'function') {
        window.opener.postMessage(event, urlConfig.APP_URL);
    }
    else {
        throw new Error("Window.opener is not set, cannot send result event");
    }
}
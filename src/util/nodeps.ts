// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

export function getCookie(name: string) {
  name += "=";
  let ca = document.cookie.split(';');
  for(let i = 0; i <ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

export function getSessionId() {
  const cookie = getCookie('connect.sid');
  if (cookie) {
    return cookie.slice(4, 36);
  }
}
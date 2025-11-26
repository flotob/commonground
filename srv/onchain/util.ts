// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { TextDecoder } from 'util';
import { requestData, sleep } from '../util';

export async function getData<T>(url: string, retries: number, sleepBetweenRetries: number) {
  while (retries >= 0) {
    try {
      const data = await requestData(url);
      if (data && data.buffer) {
        const value = new TextDecoder().decode(data.buffer);
        const parsed: T = JSON.parse(value);
        return parsed;
      } else {
        throw new Error("No respose buffer available");
      }
    }
    catch (e) {
      if (retries > 0) {
        retries--;
        await sleep(sleepBetweenRetries);
      } else {
        throw e;
      }
    }
  }
  throw new Error("Number of retries cannot be negative");
}

export function getRandomAddress() {
  const a = new Uint8Array(20);
  for (let i = 0; i < a.length; i++) {
    a[i] = Math.floor(Math.random() * 256);
  }
  return `0x${Buffer.from(a.buffer).toString('hex')}`;
}
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import express from 'express';
import ip from 'ip';
import redisManager from '../redis';
import errors from '../common/errors';

const redisClient = redisManager.getClient('data');

export function extractIpFromRequest(req: express.Request) {
  let ipString: string | undefined;
  let ip56String: string | undefined;
  let ip48String: string | undefined;
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (typeof xForwardedFor === 'string') {
    const v4 = xForwardedFor.match(/^(\d{1,3}\.){3}\d{1,3}/);
    const v6 = xForwardedFor.match(/^[0-9a-f:]+/i);
    if (v4 && ip.isV4Format(v4[0])) {
      ipString = v4[0];
    }
    else if (v6 && ip.isV6Format(v6[0])) {
      const buf = ip.toBuffer(v6[0]);
      const array = new Uint8Array(buf);
      const arr48: number[] = [];
      const arr56: number[] = [];
      const arr64: number[] = [];
      for (let i = 0; i < 6; i++) {
        arr48.push(array[i]);
        arr56.push(array[i]);
        arr64.push(array[i]);
      }
      arr56.push(array[6]);
      arr64.push(array[6]);
      arr64.push(array[7]);

      ipString = arr64.map(i => i.toString(16)).join('');
      ip56String = arr56.map(i => i.toString(16)).join('');
      ip48String = arr48.map(i => i.toString(16)).join('');
    }
  }
  return { ipString, ip56String, ip48String };
}

export default function ipRateLimitHandler(options: {
  windowMs: number;
  limit_v4_v6_64: number;
  limit_v6_56: number;
  limit_v6_48: number;
}) {
  const rateLimiter = async (req: express.Request, res: express.Response) => {
    const url = req.originalUrl;
    const { ipString, ip56String, ip48String } = extractIpFromRequest(req);

    const now = Date.now();
    let promises: Promise<boolean>[] = [];
    function addPromise(key: string, limit: number) {
      const randVal = `${now}:${Math.random().toFixed(4)}`;
      promises.push(
        redisClient
          .multi()
          .zAdd(key, { value: randVal, score: now })
          .expire(key, Math.floor(options.windowMs / 1000))
          .zRemRangeByScore(key, 0, now - options.windowMs)
          .zCount(key, now - options.windowMs, now)
          .exec()
          .then((results) => {
            // console.log("RATE LIMIT RESULTS", results, limit)
            const count = (results[3] as number);
            if (count <= limit) {
              return true;
            }
            else {
              return redisClient.zRem(key, randVal).then(() => false);
            }
          })
      );
    }

    if (ipString) {
      const key = `ratelimit:${url}:${ipString}`;
      addPromise(key, options.limit_v4_v6_64);
    }
    else {
      throw new Error(errors.server.INVALID_REQUEST);
    }
    if (ip56String) {
      const key = `ratelimit:${url}:${ip56String}`;
      addPromise(key, options.limit_v6_56);
    }
    if (ip48String) {
      const key = `ratelimit:${url}:${ip48String}`;
      addPromise(key, options.limit_v6_48);
    }
    const promiseResults = await Promise.all(promises);
    if (!promiseResults.every(p => p)) {
      throw new Error(errors.server.RATE_LIMIT_EXCEEDED);
    }
  };
  return rateLimiter;
}
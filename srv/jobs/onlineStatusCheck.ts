// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { isMainThread } from 'worker_threads';
import pool from '../util/postgres';

if (isMainThread) {
  throw new Error("OnlineStatusCheck can only be run as a worker job");
}

async function setStaleUsersToOffline() {
  const result = await pool.query(`
    UPDATE users
    SET
      "onlineStatus" = 'offline',
      "updatedAt" = now(),
      "onlineStatusUpdatedAt" = now()
    WHERE "onlineStatusUpdatedAt" < now() - interval '90s'
      AND "onlineStatus" <> 'offline'
    RETURNING id
  `);
  const updatedUserIds = (result.rows as {
    id: string;
  }[]).map(d => d.id);
  return {
    updatedUserIds,
  };
}

(async () => {
    const { updatedUserIds } = await setStaleUsersToOffline();
    if (updatedUserIds.length > 0) {
        console.log("Setting userIds to offline due to > 90s stale: ", JSON.stringify(updatedUserIds));
    }
})();
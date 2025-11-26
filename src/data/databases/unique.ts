// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { Dexie } from "dexie";
import config from "common/config";
import dbTracker from "./dbTracker";

const __dbName = `${config.IDB_PREFIX}_uniques`;

const uniqueDb: Dexie & {
  uniques: Dexie.Table<Unique.Object, Unique.Object["key"]>
} = new Dexie(__dbName) as any;
const registrationData = dbTracker.registerDatabase(__dbName);

uniqueDb.version(1).stores({
  uniques: '&key'
});

export default uniqueDb;
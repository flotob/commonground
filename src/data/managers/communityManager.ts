// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import communityApi from "data/api/community";
import { Dexie } from "dexie";

class CommunityManager {
  public async getCommunityDetailView(data: API.Community.getCommunityDetailView.Request) {
    return await new Dexie.Promise<API.Community.getCommunityDetailView.Response>((resolve, reject) => {
      communityApi.getCommunityDetailView(data).then(resolve).catch(reject);
    });
  }
};

const communityManager = new CommunityManager();
export default communityManager;
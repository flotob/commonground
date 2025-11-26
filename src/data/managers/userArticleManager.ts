// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import userApi from "data/api/user";
import { Dexie } from "dexie";

class UserArticleManager {
  public async getArticleList(data: API.User.getArticleList.Request) {
    return await new Dexie.Promise<API.User.getArticleList.Response>((resolve, reject) => {
      userApi.getArticleList(data).then(resolve).catch(reject);
    });
  }

  public async getArticle(data: API.User.getArticleDetailView.Request) {
    return await new Dexie.Promise<API.User.getArticleDetailView.Response>((resolve, reject) => {
      userApi.getArticleDetailView(data).then(resolve).catch(reject);
    });
  }
};

const userArticleManager = new UserArticleManager();
export default userArticleManager;
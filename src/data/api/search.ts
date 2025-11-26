// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import BaseApiConnector from "./baseConnector";

class SearchApiConnector extends BaseApiConnector {
  constructor() {
    super('Search');
  }

  public async searchUsers(data: API.Search.searchUsers.Request): Promise<API.Search.searchUsers.Response> {
    return await this.ajax<API.Search.searchUsers.Response>('POST', '/searchUsers', data);
  }

  public async searchArticles(data: API.Search.searchArticles.Request): Promise<API.Search.searchArticles.Response> {
    return await this.ajax<API.Search.searchArticles.Response>('POST', '/searchArticles', data);
  }
}

const searchApi = new SearchApiConnector();
export default searchApi;
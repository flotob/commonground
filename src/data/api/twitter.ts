// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import BaseApiConnector from "./baseConnector";

class TwitterApiConnector extends BaseApiConnector {
  constructor() {
    super('Twitter');
  }
  
  public async startLogin(): Promise<API.Twitter.startLogin.Response> {
    return await this.ajax<API.Twitter.startLogin.Response>(
      "POST",
      '/startLogin',
      undefined
    );
  }

  public async finishLogin(): Promise<API.Twitter.finishLogin.Response> {
    return await this.ajax<API.Twitter.finishLogin.Response>(
      "POST",
      '/finishLogin',
      undefined
    );
  }

  public async shareJoined(): Promise<API.Twitter.shareJoined.Response> {
    return await this.ajax<API.Twitter.shareJoined.Response>(
      "POST",
      '/shareJoined',
      undefined
    );
  }
}

const twitterApi = new TwitterApiConnector();
export default twitterApi;
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import BaseApiConnector from "./baseConnector";

class SumsubApiConnector extends BaseApiConnector {
  constructor() {
    super('Sumsub');
  }

  public async getAccessToken(data: API.Sumsub.getAccessToken.Request): Promise<API.Sumsub.getAccessToken.Response> {
    return await this.ajax<API.Sumsub.getAccessToken.Response>(
      "POST",
      '/getAccessToken',
      data
    );
  }
}

const sumsubApi = new SumsubApiConnector();
export default sumsubApi;
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import BaseApiConnector from "./baseConnector";

class LuksoUniversalProfileApiConnector extends BaseApiConnector {
  constructor() {
    super('Lukso');
  }

  public async prepareLuksoAction(
    data: API.Lukso.PrepareLuksoAction.Request
  ): Promise<API.Lukso.PrepareLuksoAction.Response> {
    return await this.ajax<API.Lukso.PrepareLuksoAction.Response>(
      "POST",
      '/PrepareLuksoAction',
      data
    );
  }
}

const luksoApi = new LuksoUniversalProfileApiConnector();
export default luksoApi;
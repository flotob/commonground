// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import BaseApiConnector from "./baseConnector";

class ContractApiConnector extends BaseApiConnector {
  constructor() {
    super('Contract');
  }

  public async getContractData(
    data: API.Contract.getContractData.Request
  ): Promise<API.Contract.getContractData.Response> {
    return await this.ajax<API.Contract.getContractData.Response>(
      "POST",
      '/getContractData',
      data
    );
  }
  
  public async getContractDataByIds(
    data: API.Contract.getContractDataByIds.Request
  ): Promise<API.Contract.getContractDataByIds.Response> {
    return await this.ajax<API.Contract.getContractDataByIds.Response>(
      "POST",
      '/getContractDataByIds',
      data
    );
  }
}

const contractApi = new ContractApiConnector();
export default contractApi;
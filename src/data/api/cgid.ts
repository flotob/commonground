// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import BaseApiConnector from "./baseConnector";

class CgIdApiConnector extends BaseApiConnector {
  constructor() {
    super('CgId');
  }

  public async ensureSession(): Promise<API.CgId.ensureSession.Response> {
    return await this.ajax<API.CgId.ensureSession.Response>(
      "POST",
      '/ensureSession',
    );
  }

  public async getLoggedInUserData(): Promise<API.CgId.getLoggedInUserData.Response> {
    return await this.ajax<API.CgId.getLoggedInUserData.Response>(
      "POST",
      '/getLoggedInUserData',
    );
  }
  
  public async generateRegistrationOptions(data: API.CgId.generateRegistrationOptions.Request): Promise<API.CgId.generateRegistrationOptions.Response> {
    return await this.ajax<API.CgId.generateRegistrationOptions.Response>(
      "POST",
      '/generateRegistrationOptions',
      data,
    );
  }

  public async generateAuthenticationOptions(
    data: API.CgId.generateAuthenticationOptions.Request
  ): Promise<API.CgId.generateAuthenticationOptions.Response> {
    return await this.ajax<API.CgId.generateAuthenticationOptions.Response>(
      "POST",
      '/generateAuthenticationOptions',
      data,
    );
  }

  public async verifyRegistrationResponse(
    data: API.CgId.verifyRegistrationResponse.Request
  ): Promise<API.CgId.verifyRegistrationResponse.Response> {
    return await this.ajax<API.CgId.verifyRegistrationResponse.Response>(
      "POST",
      '/verifyRegistrationResponse',
      data
    );
  }

  public async verifyAuthenticationResponse(
    data: API.CgId.verifyAuthenticationResponse.Request
  ): Promise<API.CgId.verifyAuthenticationResponse.Response> {
    return await this.ajax<API.CgId.verifyAuthenticationResponse.Response>(
      "POST",
      '/verifyAuthenticationResponse',
      data
    );
  }
}

const cgIdApi = new CgIdApiConnector();
export default cgIdApi;
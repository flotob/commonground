// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import BaseApiConnector from "./baseConnector";
import axios, { type AxiosResponse } from "axios";

class FileApiConnector extends BaseApiConnector {
  constructor() {
    super('File');
  }

  public async uploadImage<T extends API.Files.UploadType>(
    data: API.Files.UploadRequestOptions<T>,
    file: File,
  ): Promise<API.Files.UploadResponse<T>> {
    const form = new FormData();
    form.append('options', JSON.stringify(data));
    form.append('uploaded', file);
    const responseData = await axios.post<FormData, AxiosResponse<API.Files.UploadResponse<T>>>(
      `${this.baseUrl}/uploadImage`,
      form,
      { withCredentials: true },
    );
    return responseData.data;
  }

  public async getSignedUrls(
    data: API.Files.getSignedUrls.Request,
  ): Promise<API.Files.getSignedUrls.Response> {
    const responseData = await this.ajax<API.Files.getSignedUrls.Response>(
      "POST",
      "/getSignedUrls",
      data
    );
    return responseData;
  }
}

const fileApi = new FileApiConnector();
export default fileApi;
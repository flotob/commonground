// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import urlConfig from "../util/urls";
import errors from "common/errors";

export default class BaseApiConnector {
  protected baseUrl: string;

  constructor(baseUri: string) {
    this.baseUrl = `${urlConfig.API_URL}${baseUri}`;
  }

  protected async ajax<T>(method: "GET", uri: string): Promise<T>
  protected async ajax<T>(method: "PUT"|"POST"|"UPDATE", uri: string, data?: any): Promise<T>
  protected async ajax<T>(method: "GET"|"PUT"|"POST"|"UPDATE", uri: string, data?: any): Promise<T> {
    const getData = () => new Promise<API.AjaxResponse<T>>((resolve, reject) => {
      let rejected = false;
      const oReq = new XMLHttpRequest();
      oReq.responseType = "text";
      oReq.onreadystatechange = () => {
        if (oReq.readyState === 4) {
          if (oReq.status === 200) {
            resolve(JSON.parse(oReq.response));
          }
          else {
            console.warn(`Unexpected oReq status: ${oReq.status.toString()}`, oReq);
            if (!rejected) {
              reject(new Error(`Unexpected status: ${oReq.status.toString()}`));
              rejected = true;
            }
          }
        }
      };
      oReq.onerror = (err) => {
        console.warn(`Error occurred in ajax request`, oReq.statusText, err);
        if (!rejected) {
          reject(err);
          rejected = true;
        }
      }
      const sendBuffer = method === 'POST' && !!data && data instanceof ArrayBuffer;
      oReq.open(method, `${this.baseUrl}${uri}`);
      oReq.withCredentials = true;
      oReq.setRequestHeader('Accept', 'application/json');
      if (sendBuffer) {
        oReq.setRequestHeader('Content-Type', 'application/octet-stream');
        oReq.send(data);
      } else {
        oReq.setRequestHeader('Content-Type', 'application/json');
        if (method === "GET" || data === undefined) {
          oReq.send();
        } else {
          oReq.send(JSON.stringify(data));
        }
      }
    });

    const result = await getData();
    if (result && result.status === "OK") {
      if ('data' in result) {
        return result.data as T;
      }
      else {
        return undefined as unknown as T;
      }
    } else if (result && result.status === "ERROR" && result.error) {
      if (result.error === errors.server.LOGIN_REQUIRED) {
        const loginManager = (await import("data/appstate/login")).default;
        await loginManager.loginRequiredErrorHandler();
        const retryResult = await getData();
        if (retryResult && retryResult.status === "OK") {
          if ('data' in retryResult) {
            return retryResult.data as T;
          }
          else {
            return undefined as unknown as T;
          }
        }
        throw new Error(retryResult.error || "Unknown API Retry Response Error");
      }
      throw new Error(result.error || "Unknown API Response Error");
    } else {
      throw new Error("Unknown API Error");
    }
  }
}
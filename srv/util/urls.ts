// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import config from "../common/config";

let APP_URL: string | undefined = process.env.BASE_URL;
let APP_HOSTNAME: string;
let PROTOCOL: 'http' | 'https';
let PORT_SUFFIX: `:${number}` | '';

if (!APP_URL) {
  if (config.DEPLOYMENT === 'prod') {
    APP_URL = 'https://app.cg';
  }
  else if (config.DEPLOYMENT === 'staging') {
    APP_URL = 'https://staging.app.cg';
  }
  else if (config.DEPLOYMENT === 'dev') {
    APP_URL = 'http://localhost:8000';
  }
  else {
    throw new Error('BASE_URL environment variable is not set, and config.DEPLOYMENT is not set to a valid value.');
  }
}

const regexResult = APP_URL?.match(/^(https?):\/\/([^/:]+)(:\d+)?/);
if (regexResult) {
  APP_HOSTNAME = regexResult[2];
  PROTOCOL = regexResult[1] as 'http' | 'https';
  PORT_SUFFIX = regexResult[3] as `:${number}` || '';
}
else {
  throw new Error(`BASE_URL ${APP_URL} does not match the expected format.`);
}
const API_URL = `${APP_URL}/api/v2`;

const urlConfig = {
  APP_URL,
  API_URL,
  APP_HOSTNAME,
  PROTOCOL,
  PORT_SUFFIX,
};

export default Object.freeze(urlConfig);
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import axios from 'axios';
import http from 'http';
import https from 'https';

// This is a workaround for node 20 + axios + keepAlive
// Sources:
// https://github.com/axios/axios/issues/5929 due to https://github.com/nodejs/node/issues/47130
const ax = axios.create({
    httpAgent: new http.Agent({ keepAlive: false }),
    httpsAgent: new https.Agent({ keepAlive: false }),
});
export default ax;
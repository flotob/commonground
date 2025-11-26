// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { ClientConfig, Pool, PoolConfig } from "pg";
import { dockerSecret } from ".";

// SSL config
const ssl_ca = dockerSecret('rootca.crt') || null;
const ssl_key = dockerSecret('appservers.key') || null;
const ssl_cert = dockerSecret('appservers.crt') || null;

const options: PoolConfig = {
  user: process.env.PG_SU_NAME || process.env.DB_TYPE || 'cryptoadmin',
  host: process.env.DB_HOST || 'db',
  database: 'cryptogram',
  password: dockerSecret('pg_su_password') || dockerSecret('pg_password') || process.env.PG_SU_PASSWORD || process.env.PG_PASSWORD,
  port: Number(process.env.DB_PORT) || 5432,
}
if (ssl_ca && ssl_key && ssl_cert) {
  const sslOptions: ClientConfig["ssl"] = {
    requestCert: true,
    rejectUnauthorized: true,
    ca: ssl_ca,
    key: ssl_key,
    cert: ssl_cert
  };
  options.ssl = sslOptions;
}

const pool = new Pool(options);
export default pool;
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import "reflect-metadata"
import { DataSourceOptions } from "typeorm"
import { PostgresConnectionCredentialsOptions } from "typeorm/driver/postgres/PostgresConnectionCredentialsOptions";
import { dockerSecret } from "../util";
import path from "path";

// SSL config
const ssl_ca = dockerSecret('rootca.crt') || null;
const ssl_key = dockerSecret('appservers.key') || null;
const ssl_cert = dockerSecret('appservers.crt') || null;

export const connectionOptions: DataSourceOptions = {
  type: "postgres",
  host: process.env.DB_HOST || 'db',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.PG_SU_NAME || process.env.DB_TYPE || 'cryptoadmin',
  database: 'cgtest',
  schema: 'public',
  password: dockerSecret('pg_su_password') || dockerSecret('pg_password') || process.env.PG_SU_PASSWORD || process.env.PG_PASSWORD,
  entities: [path.join(__dirname, '../entities', '*.js')],
  migrations: [path.join(__dirname, '../migrations', '*.js')],  
  synchronize: true,
  uuidExtension: 'pgcrypto'
};

if (ssl_ca && ssl_key && ssl_cert) {
  const sslOptions: PostgresConnectionCredentialsOptions["ssl"] = {
    requestCert: true,
    rejectUnauthorized: true,
    ca: ssl_ca,
    key: ssl_key,
    cert: ssl_cert
  };
  (connectionOptions as any).ssl = sslOptions;
}
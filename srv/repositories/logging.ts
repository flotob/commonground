// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import pool from "../util/postgres";

class LoggingHelper {
  public async createLogEntry(data: Omit<Models.Logging.Data, "createdAt">): Promise<void> {
    let query = `
    INSERT INTO logging (service, data)
    VALUES ($1, $2);
  `;
    const values = [
      data.service,
      data.data
    ];
    await pool.query(query, values);
  }
}

const loggingHelper = new LoggingHelper();
export default loggingHelper;
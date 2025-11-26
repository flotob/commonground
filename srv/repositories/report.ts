// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import pool from "../util/postgres";
import { ReportType } from "../common/enums";

class ReportHelper {
  public async createReport(data: API.Report.createReport.Request, userId: string) {
    const { reason, message, type, targetId } = data;
    const report = await pool.query(`
      INSERT INTO reports ("reporterId", "reason", "message", "type", "targetId")
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT ("reporterId", "targetId", "type")
      DO UPDATE SET
        "reason" = EXCLUDED."reason",
        "message" = EXCLUDED."message",
        "resolved" = false,
        "updatedAt" = NOW()
      RETURNING "id", "reporterId", "reason", "message", "type", "targetId", "resolved", "createdAt", "updatedAt"
    `, [userId, reason, message, type, targetId]);
    return report.rows[0] as {
      id: string;
      reporterId: string;
      reason: string;
      message: string | null;
      type: ReportType;
      targetId: string;
      createdAt: Date;
      updatedAt: Date;
    };
  }

  public async getReportReasons(data: API.Report.getReportReasons.Request): Promise<API.Report.getReportReasons.Response> {
    const reasons = await pool.query(`
      SELECT DISTINCT reason
      FROM reports
      WHERE type = $1
        AND "targetId" = $2
        AND resolved = false
        AND "deletedAt" IS NULL
    `, [data.type, data.targetId]);
    return reasons.rows.map(row => row.reason) as API.Report.getReportReasons.Response;
  }
}

const reportHelper = new ReportHelper();
export default reportHelper;

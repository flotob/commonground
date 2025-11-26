// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import BaseApiConnector from "./baseConnector";

class ReportApiConnector extends BaseApiConnector {
  constructor() {
    super('Report');
  }

  public async createReport(data: API.Report.createReport.Request) {
    return await this.ajax<API.Report.createReport.Response>('POST', '/createReport', data);
  }

  public async getReportReasons(data: API.Report.getReportReasons.Request) {
    return await this.ajax<API.Report.getReportReasons.Response>('POST', '/getReportReasons', data);
  }
}

const reportApi = new ReportApiConnector();
export default reportApi;
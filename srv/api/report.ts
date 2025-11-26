// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import express from "express";
import { registerPostRoute } from "./util";
import errors from "../common/errors";
import validators from "../validators";
import reportHelper from "../repositories/report";

const reportRouter = express.Router();

registerPostRoute<
  API.Report.createReport.Request,
  API.Report.createReport.Response
>(
  reportRouter,
  '/createReport',
  validators.API.Report.createReport,
  async (request, response, data) => {
    const { user } = request.session;
    if (!user) {
      throw new Error(errors.server.LOGIN_REQUIRED);
    }

    await reportHelper.createReport(data, user.id);
    return;
  }
);

registerPostRoute<
  API.Report.getReportReasons.Request,
  API.Report.getReportReasons.Response
>(
  reportRouter,
  '/getReportReasons',
  validators.API.Report.getReportReasons,
  async (request, response, data) => {
    const { user } = request.session;
    if (!user) {
      throw new Error(errors.server.LOGIN_REQUIRED);
    }

    const reasons = await reportHelper.getReportReasons(data);
    return reasons;
  }
);

export default reportRouter;
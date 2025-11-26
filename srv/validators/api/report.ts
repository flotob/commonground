// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import Joi from "joi";
import common from "../common";

const reportApi = {
  createReport: Joi.object<API.Report.createReport.Request>({
    // You may want to adjust these fields based on your actual API.Report.createReport.Request type
    type: Joi.string()
      .valid('ARTICLE', 'PLUGIN', 'COMMUNITY', 'USER', 'MESSAGE')
      .required(),
    targetId: common.Uuid.required(),
    reason: Joi.string().min(1).max(500).required(),
    message: Joi.string().allow(null, '').max(2000),
  }).strict(true).required(),

  getReportReasons: Joi.object<API.Report.getReportReasons.Request>({
    type: Joi.string()
      .valid('ARTICLE', 'PLUGIN', 'COMMUNITY', 'USER', 'MESSAGE')
      .required(),
    targetId: common.Uuid.required(),
  }).strict(true).required()
};

export default reportApi;
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import Joi from "joi";

const KYC_TYPES: API.Sumsub.KycType[] = ["liveness-only", "full-kyc-level", "cg-tokensale"];

const sumsubApi = {
  getAccesToken: Joi.object({
    type: Joi.string().valid(...KYC_TYPES).required(),
  }).strict(true).required(),
}

export default sumsubApi;
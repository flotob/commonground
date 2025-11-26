// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import Joi from "joi";

const twitterApi = {
  finishLogin: Joi.object({
    code: Joi.string().required(),
    state: Joi.string().required(),
  }).strict(true).required(),
}

export default twitterApi;
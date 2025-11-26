// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import Joi from "joi";

const LuksoApi = {
  PrepareLuksoAction: Joi.object<API.Lukso.PrepareLuksoAction.Request>({
    address: Joi.string().required(),
    signature: Joi.string().required(),
    message: Joi.string().required(),
  }).strict(true).required(),
}

export default LuksoApi;
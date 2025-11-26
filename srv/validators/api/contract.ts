// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import Joi from "joi";
import common from "../common";

const contractApi = {
  getContractData: Joi.object<API.Contract.getContractData.Request>({
    chain: common.ChainIdentifier.required(),
    address: common.Address.required(),
  }).strict(true).required(),

  getContractDataByIds: Joi.object<API.Contract.getContractDataByIds.Request>({
    contractIds: Joi.array().items(common.Uuid).min(1).required().unique(),
  }).strict(true).required(),
}

export default contractApi;
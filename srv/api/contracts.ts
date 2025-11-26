// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import express from "express";
import contractHelper from "../repositories/contracts";
import validators from "../validators";
import { registerPostRoute } from "./util";
import errors from "../common/errors";

const contractRouter = express.Router();

registerPostRoute<
  API.Contract.getContractData.Request,
  API.Contract.getContractData.Response
>(
  contractRouter,
  '/getContractData',
  validators.API.Contract.getContractData,
  async (request, response, data) => {
    const contract = await contractHelper.getContractDataByParams(data.chain, data.address.toLowerCase() as Common.Address);
    if (!!contract) {
      return contract;
    }
    throw new Error(errors.server.NOT_FOUND);
  }
);

registerPostRoute<
  API.Contract.getContractDataByIds.Request,
  API.Contract.getContractDataByIds.Response
>(
  contractRouter,
  '/getContractDataByIds',
  validators.API.Contract.getContractDataByIds,
  async (request, response, data) => {
    return await contractHelper.getContractDataByIds(data.contractIds);
  }
);

export default contractRouter;
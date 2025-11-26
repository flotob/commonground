// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import Joi from "joi";
import common from "../common";

const accountsApi = {
    TokenSale: {
        registerForSale: Joi.object<API.Accounts.TokenSale.registerForSale.Request>({
            email: Joi.string().email().required(),
            referredBy: common.Uuid,
        }).strict(true).required(),
    },

    Farcaster: {
        verifyLogin: Joi.object<API.Accounts.Farcaster.verifyLogin.Request>({
            message: Joi.string().required(),
            signature: Joi.string().required(),
        }).strict(true).required(),
    },
}

export default accountsApi;
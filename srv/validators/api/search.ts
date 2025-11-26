// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import Joi from "joi";
import common from "../common";

const searchApi = {
    searchUsers: Joi.object<API.Search.searchUsers.Request>({
        query: Joi.alternatives().try(Joi.string(), Joi.equal(null)),
        limit: Joi.number().integer().min(1).max(100).default(10),
        offset: Joi.number().integer().min(0).default(0),
        tags: common.Tags,
    }).strict(true).required(),

    searchArticles: Joi.object<API.Search.searchArticles.Request>({
        type: Joi.string().valid('community', 'user', 'all').required(),
        query: Joi.alternatives().try(Joi.string(), Joi.equal(null)),
        limit: Joi.number().integer().min(1).max(100).default(10),
        offset: Joi.number(),
        tags: common.Tags,
    }).strict(true).required(),
}

export default searchApi;
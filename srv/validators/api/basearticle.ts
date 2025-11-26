// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import Joi from "joi";
import common from "../common";
import { articleContentV2Validator } from "../content";

const title = Joi.string();
const imageId = Joi.alternatives().try(
  common.ImageId,
  Joi.equal(null)
);
const content = Joi.alternatives<Models.BaseArticle.Content>().try(
  Joi.object({
    version: Joi.equal('1').required(),
    text: Joi.string().required(),
  }).strict(true).required(),
  Joi.object({
    version: Joi.equal('2').required(),
    content: articleContentV2Validator.required(),
  }).strict(true).required(),
).strict(true);

const baseArticleApi = {
  _createArticle: Joi.object<Omit<Models.BaseArticle.DetailView, "creatorId" | "articleId">>({
    title: title.allow("").required(),
    previewText: Joi.string().allow("").max(150).required(),
    thumbnailImageId: imageId.required(),
    headerImageId: imageId.required(),
    content: content.required(),
    tags: common.Tags.required(),
  }).strict(true),

  _updateArticle: Joi.object<Pick<Models.BaseArticle.DetailView, "articleId"> & Partial<Omit<Models.BaseArticle.DetailView, "creatorId" | "articleId">>>({
    articleId: common.Uuid.required(),
    title: title.allow(""),
    previewText: Joi.string().allow("").max(150),
    thumbnailImageId: imageId,
    headerImageId: imageId,
    content,
    tags: common.Tags,
  }).strict(true),

  _getArticleListRequest: {
    order: Joi.string().valid('ASC', 'DESC'),
    orderBy: Joi.string().valid('updatedAt', 'published'),
    updatedAfter: common.DateString,
    updatedBefore: common.DateString,
    publishedAfter: common.DateString,
    publishedBefore: common.DateString,
    limit: Joi.number().integer().min(1).max(30).required(),
    tags: common.Tags,
    drafts: Joi.equal(true),
    verification: Joi.string().valid('verified', 'unverified', 'both', 'following'),
    ids: Joi.array().items(common.Uuid).unique(),
  },
}

export default baseArticleApi;
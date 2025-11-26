// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import Joi from "joi";
import common from "./common";

const MediaSize = Joi.string().valid('small','medium','large');
const Text = Joi.object({
  type: Joi.equal('text').required(),
  value: Joi.string().required(),
  bold: Joi.equal(true),
  italic: Joi.equal(true),
}).strict(true);
const Tag = Joi.object({
  type: Joi.equal('tag').required(),
  value: Joi.string().required(),
  bold: Joi.equal(true),
  italic: Joi.equal(true),
}).strict(true);
const Ticker = Joi.object({
  type: Joi.equal('ticker').required(),
  value: Joi.string().required(),
  bold: Joi.equal(true),
  italic: Joi.equal(true),
}).strict(true);
const Link = Joi.object({
  type: Joi.equal('link').required(),
  value: Joi.string().required(),
  bold: Joi.equal(true),
  italic: Joi.equal(true),
}).strict(true);
const RichTextLink = Joi.object({
  type: Joi.equal('richTextLink').required(),
  value: Joi.string().required(),
  url: Joi.string().required(),
  bold: Joi.equal(true),
  italic: Joi.equal(true),
}).strict(true);
const Newline = Joi.object({
  type: Joi.equal('newline').required()
}).strict(true);
const Mention = Joi.object({
  type: Joi.equal('mention').required(),
  userId: common.Uuid.required(),
  alias: Joi.string(),
}).strict(true);
const Header = Joi.object({
  type:Joi.equal('header').required(),
  value: Joi.array().items(Text),
}).strict(true);
const ArticleImage = Joi.object({
  type: Joi.equal('articleImage').required(),
  imageId: common.ImageId.required(),
  largeImageId: common.ImageId.required(),
  caption: Joi.string().allow("").required(),
  size: MediaSize.required(),
}).strict(true);
const ArticleEmbed = Joi.object({
  type: Joi.equal('articleEmbed').required(),
  embedId: Joi.string().required(),
  size: MediaSize.required(),
}).strict(true);

export function createContentValidator(allowedTypes: (
  'text'|
  'tag'|
  'ticker'|
  'link'|
  'richTextLink'|
  'newline'|
  'mention'|
  'header'|
  'articleImage'|
  'articleEmbed'
)[]) {
  const allowed = new Set(allowedTypes);
  const checker: { [key: string]: Joi.Schema<any> } = {};
  for (const type of allowedTypes) {
    if (!checker[type]) {
      if (type === 'text') {
        checker[type] = Text.required();
      } else if (type === 'tag') {
        checker[type] = Tag.required();
      } else if (type === 'ticker') {
        checker[type] = Ticker.required();
      } else if (type === 'link') {
        checker[type] = Link.required();
      } else if (type === 'richTextLink') {
        checker[type] = RichTextLink.required();
      } else if (type === 'newline') {
        checker[type] = Newline.required();
      } else if (type === 'mention') {
        checker[type] = Mention.required();
      } else if (type === 'header') {
        checker[type] = Header.required();
      } else if (type === 'articleImage') {
        checker[type] = ArticleImage.required();
      } else if (type === 'articleEmbed') {
        checker[type] = ArticleEmbed.required();
      }
    }
  }
  return Joi.array().items(
    Joi.custom((value, helpers) => {
      if ("type" in value && allowed.has(value.type) && value.type in checker) {
        const validator = checker[value.type];
        const { error, value: validatedValue } = validator.validate(value);
        if (!error) {
          return validatedValue; 
        }
      }
      return helpers.error("any.invalid");
    }
  ));
}

const articleContentV2Validator = createContentValidator([
  'text',
  'newline',
  'link',
  'richTextLink',
  'header',
  'articleImage',
  'articleEmbed',
]);
const messageContentV1Validator = createContentValidator([
  'text',
  'tag',
  'ticker',
  'link',
  'richTextLink',
  'newline',
  'mention'
]);

export {
  articleContentV2Validator,
  messageContentV1Validator
};
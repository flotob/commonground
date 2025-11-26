// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import Joi from "joi";
import { FileUploadType } from "../../common/enums";
import common from "../common";

const fileUploadTypes = Object.values(FileUploadType);

const fileApi = {
  getSignedUrls: Joi.object<API.Files.getSignedUrls.Request>({
    objectIds: Joi.array().items(common.ImageId).min(1).unique().required(),
  }).strict(true).required(),

  uploadOptionsValidator: Joi.object<{ type: API.Files.UploadType, communityId?: string, roleId?: string }>({
    type: Joi.string().valid(...fileUploadTypes).required(),
    communityId: common.Uuid,
    roleId: common.Uuid
  }).custom((value, helpers) => {
    const v = value as { type: API.Files.UploadType, communityId?: string, roleId?: string };
    if ('roleId' in v) {
      if (!('communityId' in v) || v.type !== 'roleImage') {
        return helpers.error('any.invalid');
      }
    } else if ('communityId' in v) {
      if (!(
        v.type === 'communityHeaderImage' ||
        v.type === 'communityLogoSmall' ||
        v.type === 'communityLogoLarge'
      )) {
        return helpers.error('any.invalid');
      }
    }
    return v;
  }).strict(true).required(),
}

export default fileApi;
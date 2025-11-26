// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import Joi from "joi";
import common from "../common";

const socketApi = {
  login: Joi.object<API.Socket.login.Request>({
    secret: common.Secret.required(),
    deviceId: common.Uuid.required(),
    base64Signature: common.Base64DeviceSignature.required(),
  }).required().strict(true),

  joinCommunityVisitorRoom: Joi.object<API.Socket.joinCommunityVisitorRoom.Request>({
    communityId: common.Uuid.required(),
  }).required().strict(true),
}

export default socketApi;
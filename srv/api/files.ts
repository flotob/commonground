// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import express from "express";
import { handleError, registerPostRoute } from "./util";
import validators from "../validators";
import fileHelper from "../repositories/files";
import multer from "multer";
import errors from "../common/errors";
import userHelper from "../repositories/users";
import permissionHelper from "../repositories/permissions";
import { CommunityPermission } from "../common/enums";
import communityHelper from "../repositories/communities";
import bodyParser from "body-parser";
import eventHelper from "../repositories/event";

const fileRouter = express.Router();
const uploadHandler = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8*1024*1024, // 8 mb
  },
});

fileRouter.post(
  '/uploadImage',
  bodyParser.text({ type: '/' }),
  uploadHandler.single('uploaded'),
  async (req, res) => {
    const { user } = req.session;
    const file = req.file;
    if (!file) {
      throw new Error(errors.server.INVALID_REQUEST);
    }
    try {
      const _options = JSON.parse(req.body["options"] || 'null');
      const options = await validators.API.Files.uploadOptionsValidator.validateAsync(_options);

      // check permissions if existing role is being updated
      if ('roleId' in options && !!options.roleId && 'communityId' in options && !!options.communityId) {
        if (!user) {
          throw new Error(errors.server.LOGIN_REQUIRED);
        }
        await permissionHelper.hasPermissionsOrThrow({
          userId: user.id,
          communityId: options.communityId,
          permissions: [ CommunityPermission.COMMUNITY_MANAGE_ROLES ]
        });
      }
      // check permissions if an existing community is being updated
      else if ('communityId' in options && !!options.communityId) {
        if (!user) {
          throw new Error(errors.server.LOGIN_REQUIRED);
        }
        await permissionHelper.hasPermissionsOrThrow({
          userId: user.id,
          communityId: options.communityId,
          permissions: [ CommunityPermission.COMMUNITY_MANAGE_INFO ]
        });
      }

      if (options.type === 'userProfileImage') {
        const image = await fileHelper.saveImage(user?.id || null, options, file.buffer, { width: 110, height: 110 });
        if (!!user) {
          await userHelper.updateCgProfile(user.id, { type: 'cg', imageId: image.fileId });
          // Todo: generate events for user update?
          fileHelper.scheduleUserPreviewUpdate(user.id, file.buffer);
        }
        const result: API.Files.UploadResponse<'userProfileImage'> = {
          imageId: image.fileId,
        };
        res.send(result);
        return;

      } else {
        // other image type uploads are only allowed for registered users
        if (!user) {
          throw new Error(errors.server.LOGIN_REQUIRED);
        }
        if (options.type === 'userBannerImage') {
          const image = await fileHelper.saveImage(user.id, options, file.buffer, { width: 960, height: 384 });
          await userHelper.updateUser(user.id, { bannerImageId: image.fileId });

          const result: API.Files.UploadResponse<'userBannerImage'> = {
            imageId: image.fileId,
          };
          res.send(result);

          const event: Events.User.OwnData = {
            type: 'cliUserOwnData',
            data: {
              id: user.id,
              bannerImageId: image.fileId,
            },
          };
          await eventHelper.emit(event, {
            userIds: [user.id],
          });

          return;
        } else if (options.type === 'communityHeaderImage') {  
          const image = await fileHelper.saveImage(user.id, options, file.buffer, { width: 1022, height: 322 });
          if (!!options.communityId) {
            await communityHelper.updateCommunity({ id: options.communityId, headerImageId: image.fileId });
          }
          const result: API.Files.UploadResponse<'communityHeaderImage'> = {
            imageId: image.fileId,
          };
          res.send(result);
          return;

        } else if (options.type === 'communityLogoLarge') {
          const image = await fileHelper.saveImage(user.id, options, file.buffer, { width: 282, height: 220 });
          if (!!options.communityId) {
            await communityHelper.updateCommunity({ id: options.communityId, logoLargeId: image.fileId });
            fileHelper.scheduleCommunityPreviewUpdate(user.id, options.communityId, file.buffer);
          }
          const result: API.Files.UploadResponse<'communityLogoLarge'> = {
            imageId: image.fileId,
          };
          res.send(result);
          return;

        } else if (options.type === 'communityLogoSmall') {
          const image = await fileHelper.saveImage(user.id, options, file.buffer, { width: 75, height: 75 });
          if (!!options.communityId) {
            await communityHelper.updateCommunity({ id: options.communityId, logoSmallId: image.fileId });
          }
          const result: API.Files.UploadResponse<'communityLogoSmall'> = {
            imageId: image.fileId,
          };
          res.send(result);
          return;

        } else if (options.type === 'articleImage') {
          const [
            image,
            largeImage,
          ] = await Promise.all([
            fileHelper.saveImage(user.id, options, file.buffer, { width: 330, height: 134 }),
            fileHelper.saveImage(user.id, options, file.buffer, { width: 790, height: 322 }),
          ]);
          const result: API.Files.UploadResponse<'articleImage'> = {
            imageId: image.fileId,
            largeImageId: largeImage.fileId,
          };
          res.send(result);
          return;
  
        } else if (options.type === 'articleContentImage') {
          const [
            image,
            largeImage,
          ] = await Promise.all([
            fileHelper.saveImage(user.id, options, file.buffer, { width: 720 }, { withoutEnlargement: true, animated: true }),
            fileHelper.saveImage(user.id, options, file.buffer, { width: 1920 }, { withoutEnlargement: true, animated: true }),
          ]);
          const result: API.Files.UploadResponse<'articleContentImage'> = {
            imageId: image.fileId,
            largeImageId: largeImage.fileId,
          };
          res.send(result);
          return;
  
        } else if (options.type === 'channelAttachmentImage')  {
          const [
            image,
            largeImage,
          ] = await Promise.all([
            fileHelper.saveImage(user.id, options, file.buffer, { height: 150 }, { withoutEnlargement: true, animated: true }),
            fileHelper.saveImage(user.id, options, file.buffer, { width: 1920 }, { withoutEnlargement: true, animated: true }),
          ]);
          const result: API.Files.UploadResponse<'channelAttachmentImage'> = {
            imageId: image.fileId,
            largeImageId: largeImage.fileId,
          };
          res.send(result);
          return;
        } else if (options.type === 'roleImage') {
          const image = await fileHelper.saveImage(user.id, options, file.buffer, { width: 100, height: 100 }, { animated: true });
          const result: API.Files.UploadResponse<'roleImage'> = {
            imageId: image.fileId
          };
          res.send(result);
          return;
        } else if (options.type === 'pluginAppstoreImage') {
          const image = await fileHelper.saveImage(user.id, options, file.buffer, { width: 200, height: 200 });
          const result: API.Files.UploadResponse<'pluginAppstoreImage'> = {
            imageId: image.fileId
          };
          res.send(result);
          return;
        }
      }
      throw new Error(errors.server.INVALID_REQUEST);

    } catch (e) {
      handleError(res, e);
    }
  }
)

registerPostRoute<
  API.Files.getSignedUrls.Request,
  API.Files.getSignedUrls.Response
>(
  fileRouter,
  '/getSignedUrls',
  validators.API.Files.getSignedUrls,
  async (request, response, data) => {
    return await fileHelper.getSignedUrls(data.objectIds);
  }
)

export default fileRouter;
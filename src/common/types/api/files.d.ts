// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

declare global {
    namespace API {
        namespace Files {
            type UploadType =
                'userProfileImage' |
                'userBannerImage' |
                'articleImage' |
                'articleContentImage' |
                'channelAttachmentImage' |
                'communityHeaderImage' |
                'communityLogoSmall' |
                'communityLogoLarge' |
                'urlPreviewImage' |
                'roleImage' |
                'pluginAppstoreImage';

            type UploadOptions = {
                type: UploadType;
            }

            type UploadRequestOptions<T extends UploadType> =
                T extends
                'userProfileImage' |
                'userBannerImage' |
                'articleImage' |
                'articleContentImage' |
                'channelAttachmentImage' |
                'pluginAppstoreImage'
                ? {
                    type: T;
                }
                : T extends
                'communityHeaderImage' |
                'communityLogoSmall' |
                'communityLogoLarge'
                ? {
                    type: T;
                    communityId?: string;
                } : T extends
                'roleImage' ? {
                    type: T;
                    roleId: string;
                    communityId: string;
                }
                : never;

            type UploadResponse<T extends UploadType> =
                T extends
                'articleImage' |
                'articleContentImage' |
                'channelAttachmentImage'
                ? {
                    imageId: string,
                    largeImageId: string,
                }
                : T extends
                'userProfileImage' |
                'userBannerImage' |
                'communityHeaderImage' |
                'communityLogoSmall' |
                'communityLogoLarge' |
                'roleImage' |
                'pluginAppstoreImage'
                ? {
                    imageId: string;
                }
                : never;

            namespace getSignedUrls {
                type Request = {
                    objectIds: string[];
                };
                type Response = {
                    objectId: string;
                    url: string;
                    validUntil: string;
                }[];
            }
        }
    }
}

export { };
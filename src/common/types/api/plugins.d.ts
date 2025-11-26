// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

declare global {
    namespace API {
        namespace Plugins {
            namespace createPlugin {
                type Request = {
                    name: string;
                    url: string;
                    description: string | null;
                    imageId: string | null;
                    communityId: string;
                    config: Models.Plugin.PluginConfig;
                    permissions: Models.Plugin.PluginPermissions;
                    clonable: boolean;
                    requiresIsolationMode: boolean;
                    tags: string[] | null;
                }
                type Response = {
                    id: string;
                    publicKey: string;
                    privateKey: string;
                };
            }

            namespace clonePlugin {
                type Request = {
                    copiedFromCommunityId: string;
                    targetCommunityId: string;
                    pluginId: string;
                }
                type Response = {
                    ok: true;
                };
            }
            namespace updatePlugin {
                type Request = {
                    id: string;
                    communityId: string;
                    name: string;
                    config: Models.Plugin.PluginConfig;
                    // Only community owner below
                    pluginData: {
                        pluginId: string;
                        url: string;
                        description: string | null;
                        imageId: string | null;
                        permissions: Models.Plugin.PluginPermissions;
                        clonable: boolean;
                        requiresIsolationMode: boolean;
                        tags: string[] | null;
                    } | null;
                }

                type Response = {
                    ok: true;
                };
            }

            namespace deletePlugin {
                type Request = {
                    id: string;
                }
                type Response = {
                    ok: true;
                };
            }

            namespace pluginRequest {
                type Request = {
                    request: string; // JSON stringified RequestInner
                    signature: string;
                }

                type RequestInner = {
                    pluginId: string;
                    requestId: string;
                    iframeUid: string;
                } & ({
                    type: 'action';
                    data: {
                        type: 'giveRole';
                        roleId: string;
                        userId: string;
                    }
                } | {
                    type: 'request';
                    data: {
                        type: 'userInfo';
                    } | {
                        type: 'communityInfo';
                    } | {
                        type: 'userFriends';
                        limit: number;
                        offset: number;
                    }
                })

                type Response = {
                    response: string; // JSON stringified ResponseInner
                    signature: string;
                }

                type ResponseInner = {
                    data: {
                        error: string;
                    } | {
                        success: boolean;
                    } | {
                        id: string;
                        name: string;
                        roles: string[];
                        imageUrl: string;
                        premium: 'FREE' | 'SILVER' | 'GOLD';
                        twitter?: {
                            username: string;
                        };
                        lukso?: {
                            username: string;
                            address: string;
                        };
                        farcaster?: {
                            displayName: string;
                            username: string;
                            fid: number;
                        };
                        email?: string;
                    } | {
                        id: string;
                        title: string;
                        url: string;
                        smallLogoUrl: string;
                        largeLogoUrl: string;
                        headerImageUrl: string;
                        official: boolean;
                        premium: Models.Community.PremiumName | 'FREE';
                        roles: {
                            id: string;
                            title: string;
                            type: 'PREDEFINED' | 'CUSTOM_MANUAL_ASSIGN' | 'CUSTOM_AUTO_ASSIGN';
                            permissions: string[];
                            assignmentRules: object | null;
                        }[];
                    } | {
                        friends: {
                            id: string;
                            name: string;
                            imageUrl: string;
                        }[];
                    }
                    pluginId: string;
                    requestId: string;
                }
            }

            namespace acceptPluginPermissions {
                type Request = {
                    pluginId: string;
                    permissions: Models.Plugin.PluginPermission[];
                }
                type Response = {
                    ok: true;
                };
            }

            namespace getAppstorePlugin {
                type Request = {
                    pluginId: string;
                };
                type Response = {
                    pluginId: string;
                    ownerCommunityId: string;
                    url: string;
                    description: string;
                    permissions: Models.Plugin.PluginPermissions;
                    imageId: string;
                    name: string;
                    communityCount: number;
                    appstoreEnabled: boolean;
                    tags: string[] | null;
                };
            }

            namespace getAppstorePlugins {
                type Request = {
                    query?: string;
                    tags?: string[];
                    limit: number;
                    offset: number;
                };
                type Response = {
                    plugins: {
                        pluginId: string;
                        ownerCommunityId: string;
                        url: string;
                        description: string;
                        permissions: Models.Plugin.PluginPermissions;
                        imageId: string;
                        name: string;
                        communityCount: number;
                        appstoreEnabled: boolean;
                        tags: string[] | null;
                    }[];
                };
            }

            namespace getPluginCommunities {
                type Request = {
                    pluginId: string;
                    limit: number;
                    offset: number;
                };
                type Response = {
                    communityIds: string[];
                };
            }
        }
    }
}

export { };
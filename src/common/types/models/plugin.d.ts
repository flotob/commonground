// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

declare namespace Models {
    namespace Plugin {
        type Plugin = {
            id: string;
            communityId: string;
            pluginId: string;
            ownerCommunityId: string;
            name: string;
            description: string | null;
            imageId: string | null;
            config: PluginConfig | null;
            url: string;
            tags: string[] | null;
            permissions: PluginPermissions | null;
            acceptedPermissions?: PluginPermission[];
            clonable: boolean;
            appstoreEnabled: boolean;
            warnAbusive: boolean;
            requiresIsolationMode: boolean;
            reportFlagged: boolean;
        }

        type PluginListView = Pick<API.Plugins.getAppstorePlugins.Response['plugins'][number], 'pluginId' | 'url' | 'permissions' | 'name' | 'description' | 'imageId' | 'ownerCommunityId' | 'tags'>;

        type PluginConfig = {
            canGiveRole?: boolean;
            giveableRoleIds?: string[];
        }

        type PluginPermission = 
            'USER_ACCEPTED' |
            'READ_TWITTER' |
            'READ_LUKSO' |
            'READ_FARCASTER' |
            'READ_EMAIL' |
            'READ_FRIENDS' |
            'ALLOW_CAMERA' |
            'ALLOW_MICROPHONE';

        type PluginPermissions = {
            mandatory: PluginPermission[];
            optional: PluginPermission[];
        }
    }
}

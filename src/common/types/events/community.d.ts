// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

declare namespace Events {
  namespace Community {
    type Community = {
      type: 'cliCommunityEvent';
    } & ({
      action: 'new-or-full-update';
      data: Models.Community.DetailViewFromApi;
    } | {
      action: 'update';
      data: (
        Partial<Models.Community.DetailView>
        & Pick<Models.Community.DetailView, "id" | "updatedAt">
      );
    } | {
      action: 'delete';
      data: Pick<Models.Community.DetailViewFromApi, "id">;
    });

    type Area = {
      type: 'cliAreaEvent';
    } & ({
      action: 'new';
      data: Models.Community.Area;
    } | {
      action: 'update';
      data: (
        Partial<Models.Community.Area> &
        Pick<Models.Community.Area, "id" | "communityId">
      );
    } | {
      action: 'delete';
      data: Pick<Models.Community.Area, "id" | "communityId">;
    });

    type Channel = {
      type: 'cliChannelEvent';
    } & ({
      action: 'new';
      data: Models.Community.Channel;
    } | {
      action: 'update';
      data: (
        Partial<Models.Community.Channel> &
        Pick<Models.Community.Channel, "communityId" | "channelId">
      );
    } | {
      action: 'delete';
      data: Pick<Models.Community.Channel, "communityId" | "channelId">;
    });

    type Role = {
      type: 'cliRoleEvent';
    } & ({
      action: 'new';
      data: Models.Community.Role;
    } | {
      action: 'update';
      data: (
        Partial<Models.Community.Role> &
        Pick<Models.Community.Role, "id" | "communityId">
      );
    } | {
      action: 'delete';
      data: Pick<Models.Community.Role, "id" | "communityId">;
    });

    type Plugin = {
      type: 'cliPluginEvent';
    } & ({
      action: 'new';
      data: Models.Plugin.Plugin;
    } | {
      action: 'update';
      data: (
        Partial<Models.Plugin.Plugin> &
        Pick<Models.Plugin.Plugin, "id" | "communityId">
      );
    } | {
      action: 'dataUpdate';
      data: Partial<Models.Plugin.Plugin> & Pick<Models.Plugin.Plugin, "pluginId">;
    } | {
      action: 'delete';
      data: Pick<Models.Plugin.Plugin, "id" | "communityId">;
    } | {
      action: 'dataDelete';
      data: Pick<Models.Plugin.Plugin, "pluginId">;
    });

    type Membership = {
      type: 'cliMembershipEvent';
    } & ({
      action: 'join';
      data: {
        userId: string;
        communityId: string;
        roleIds: string[];
      };
    } | {
      action: 'roles_added';
      data: {
        userId: string;
        communityId: string;
        roleIds: string[];
      };
    } | {
      action: 'roles_removed';
      data: {
        userId: string;
        communityId: string;
        roleIds: string[];
      };
    } | {
      action: 'leave';
      data: {
        userId: string;
        communityId: string;
      };
    });

    type MyRoles = {
      type: 'cliMyRolesEvent';
      communityId: string;
      rolesGained: string[];
      rolesLost: string[];
    };

    type Event = (
      Community |
      Area |
      Channel |
      Role |
      Plugin |
      Membership |
      MyRoles
    );
  }
}
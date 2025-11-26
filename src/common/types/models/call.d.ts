// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

declare namespace Models {
  namespace Calls {
    type Call = {
      id: string;
      communityId: string;
      channelId: string;
      callServerUrl: string;
      previewUserIds: string[];
      title: string;
      description: string | null;
      callMembers: number;
      slots: number;
      startedAt: string;
      endedAt: string | null;
      updatedAt: string;
      rolePermissions: {
        roleId: string;
        permissions: Common.CallPermission[];
      }[];
      callType: Common.CallType;
      callCreator: string;
      scheduleDate: string | null;
      stageSlots: number;
      highQuality: boolean;
      audioOnly: boolean;
    }
  }
}
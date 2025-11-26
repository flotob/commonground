// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

export const canModerateCalls = (
    myRoles: string[],
    callRoles: { roleId: string; permissions: Common.CallPermission[] }[],
    communityRoles: Models.Community.Role[],
    userId: string,
    callCreatorId: string
) => {
    const isCallCreator = userId === callCreatorId;
    const hasCommunityWidePermission = myRoles?.some((myRole) => {
        // check if my role has CALL_MODERATE permission for this community
        const myCommunityRole = communityRoles.find((r) => r.id === myRole);
        if (myCommunityRole?.permissions.includes("WEBRTC_MODERATE")) {
            return true;
        } else {
            return false;
        }
    });
    const hasCallWidePermission = myRoles?.some((myRole) => {
        // check if my role has CALL_MODERATE permission for this call
        const myCallRole = callRoles.find((r) => r.roleId === myRole);
        if (myCallRole?.permissions.includes("CALL_MODERATE")) {
            return true;
        } else {
            return false;
        }
    });
    return isCallCreator || hasCommunityWidePermission || hasCallWidePermission;
};
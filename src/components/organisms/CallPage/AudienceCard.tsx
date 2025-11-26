// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React, { useMemo, useRef } from "react";
import "./AudienceCard.css";

import { RoomPeer } from "./CallPage.reducer";
import Jdenticon from "components/atoms/Jdenticon/Jdenticon";
import { useCallContext } from "context/CallProvider";
import ScreenAwareDropdown from "components/atoms/ScreenAwareDropdown/ScreenAwareDropdown";
import ListItem from "components/atoms/ListItem/ListItem";
import { HandRaisedIcon } from "@heroicons/react/24/solid";
import { getDisplayName } from "../../../util";
import UserTooltip from "../UserTooltip/UserTooltip";
import { UserTooltipHandle } from "components/atoms/Tooltip/UserProfilePopover";
import { canModerateCalls } from "./HelperFunctions/callHelpers";
import data from "data";
import { useLiveQuery } from "dexie-react-hooks";
import PeerReactionOverlay from "./PeerReactionOverlay/PeerReactionOverlay";
import errors from "common/errors";
import { useSnackbarContext } from "context/SnackbarContext";

interface PeerViewProps {
  user: RoomPeer;
  actualUser: Models.User.Data;
}

const AudienceCard: React.FC<PeerViewProps> = ({ user, actualUser }) => {
  const { me, call, roomClient } = useCallContext();
  const { showSnackbar } = useSnackbarContext();
  const userTooltipRef = useRef<UserTooltipHandle>(null);

  const community = useLiveQuery(() => {
    if (!call) return undefined;
    return data.community.getCommunityDetailView(call.communityId);
  }, [call?.communityId]);

  const roles = useLiveQuery(() => {
    if (!call) return [];
    return data.community.getRoles(call.communityId);
  }, [call?.communityId]);

  const myRoles = useMemo(() => {
    return community?.myRoleIds;
  }, [community?.myRoleIds]);

  const hasModeratePermissions = useMemo(() => {
    if (!call || !community || !myRoles || !me || !roles) return false;
    return canModerateCalls(
      myRoles || [],
      call?.rolePermissions || [],
      roles,
      me.id,
      call.callCreator
    );
  }, [call, me, myRoles, community, roles]);

  const options = useMemo(() => {
    if (hasModeratePermissions) {
      const onPromoteBroadcaster = async () => {
        try {
          await roomClient?.promoteBroadcaster(user.id)
        } catch (error: any) {
          if (error?.message === errors.server.BROADCASTERS_LIMIT_EXCEEDED){
            showSnackbar({type: 'warning', text: 'Broadcasters limit exceeded'})
          }
        }
      };
      return [
        <ListItem
          key="promote-broadcast"
          title="Promote to speaker"
          onClick={onPromoteBroadcaster}
          icon={<HandRaisedIcon className="w-5 h-5" />}
        />,
        <ListItem
          key="view-profile"
          title="View profile"
          onClick={() => userTooltipRef.current?.open()}
        />,
      ];
    }
    else {
      return undefined;
    }
  }, [hasModeratePermissions, roomClient, showSnackbar, user.id]);

  const trigger = useMemo(() => {
    const className = [
      "audience-peer-card flex flex-col p-2 gap-2 items-center justify-center w-full h-full relative cg-border-xxl cursor-pointer overflow-hidden",
      user.isHandRaised ? "hand-raised" : "",
    ]
      .join(" ")
      .trim();

    return (
      <div className={className}>
        {user.isHandRaised && (
          <HandRaisedIcon className="absolute top-2 left-2 w-5 h-5 cg-text-main" />
        )}
        <Jdenticon userId={user.id} predefinedSize="32" hideStatus />
        <span className="cg-text-main max-w-full">
          {getDisplayName(actualUser)}
        </span>
        <div className="w-0 h-0 overflow-hidden absolute">
          <UserTooltip
            userId={actualUser.id}
            ref={userTooltipRef}
            isMessageTooltip={false}
          />
        </div>
        <PeerReactionOverlay reaction={user.reaction} type="audience" />
      </div>
    );
  }, [actualUser, user.id, user.isHandRaised, user.reaction]);

  if (options !== undefined) {
    return (
      <ScreenAwareDropdown
        triggerContent={trigger}
        items={options}
        triggerClassname={"dropdown-options-trigger h-full w-full"}
        closeOnClick={true}
      />
    );
  }
  else {
    return (
      <div onClick={() => userTooltipRef.current?.open()}>
        {trigger}
      </div>
    );
  }
};

export default React.memo(AudienceCard);

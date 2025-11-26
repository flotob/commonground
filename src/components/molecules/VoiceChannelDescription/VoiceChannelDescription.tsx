// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import { useMemo } from "react";
import CommunityPhoto from "../../../components/atoms/CommunityPhoto/CommunityPhoto";
import { useWindowSizeContext } from "../../../context/WindowSizeProvider";
import AudioWaves from "../AudioWidget/AudioWaves";

import "./VoiceChannelDescription.css";
import { useCommunityListView } from "context/CommunityListViewProvider";

type Props = {
  callName: string;
  communityId: string;
  collapsed?: boolean;
};

export default function VoiceChannelDescription(props: Props) {
  const { callName, communityId } = props;
  const { isMobile } = useWindowSizeContext();

  const community = useCommunityListView(communityId);

  return useMemo(() => {
    return (
      <div className={`voice-channel-description${isMobile ? " mobile" : ""}`}>
        <div className="voice-channel-community">
          {community && community.id && <CommunityPhoto community={community} size="tiny" noHover />}
          {!props.collapsed && <span className="voice-channel-community-name">{community?.title}</span>}
          {!isMobile && <AudioWaves />}
        </div>
        {!props.collapsed && <span className="voice-channel-name">{callName}</span>}
      </div>
    );
  }, [community?.id, community?.logoLargeId, community?.logoSmallId, callName, isMobile, props.collapsed]);
}
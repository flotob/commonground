// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import './VoiceChannelTalkers.css';
import { useLiveQuery } from "dexie-react-hooks";
import data from "data";
import MemberPreview2 from "components/atoms/MemberPreview/MemberPreview2";

type Props = {
  callId: string;
  collapsed?: boolean;
  memberLength?: number;
};

export default function VoiceChannelTalkers(props: Props) {
  const { collapsed, callId, memberLength = 4 } = props;

  const call = useLiveQuery(() => {
    return data.community.getCallById(callId);
  }, [callId]);

  return <MemberPreview2
    memberIds={call?.previewUserIds || []}
    memberCount={call?.callMembers || 0}
    limit={memberLength}
    rightElement={!collapsed ? 'on call' : undefined}
    vertical={collapsed}
  />
}
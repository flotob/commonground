// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React from "react";
import Jdenticon from "../Jdenticon/Jdenticon";

import './MemberPreview.css';

type Props = {
  memberIds: string[];
  memberCount: number;
  limit?: number;
  vertical?: boolean;
  hideExtraMembersElement?: boolean;
  hideStatus?: boolean;
};

const MemberPreview: React.FC<Props> = ({ memberIds, memberCount, limit = 3, vertical, hideExtraMembersElement, hideStatus }) => {
  const hasExtraMembers = !hideExtraMembersElement && memberIds.length > limit;
  const filteredMembers = memberIds.slice(0, limit);
  const className = [
    'member-preview-jdenticons',
    vertical ? 'vertical' : ''
  ].join(' ');

  return <div className={className}>
    {filteredMembers.map(memberId => <Jdenticon key={memberId} userId={memberId} hideStatus={hideStatus} />)}
    {hasExtraMembers && <div className="extra-members">
      <span className="text-sm">{`+${memberCount}`}</span>
    </div>}
  </div>;
}

export default React.memo(MemberPreview);
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React from 'react';
import MemberPreview from 'components/atoms/MemberPreview/MemberPreview';

import './MemberListPreview.css';

type Props = {
  onClick: () => void;
  memberList?: Models.Community.ChannelMemberList;
  isExpanded?: boolean;
};

const MemberListPreview: React.FC<Props> = (props) => {
  const { onClick } = props;
  const memberIds = props.memberList?.admin.concat(props.memberList.moderator, props.memberList.writer, props.memberList.reader, props.memberList.offline).map(m => m[0]) || [];

  const handleClickEvent = React.useCallback((ev: React.MouseEvent) => {
    ev.stopPropagation();
    onClick();
  }, [onClick]);

  return <div className={`member-list-preview${props.isExpanded ? ' expanded' : ''}`} onClick={handleClickEvent}>
    <MemberPreview memberIds={memberIds} memberCount={props.memberList?.count || 0} hideExtraMembersElement />
    <span>{props.memberList?.count || 0}</span>
  </div>;
};

export default React.memo(MemberListPreview);
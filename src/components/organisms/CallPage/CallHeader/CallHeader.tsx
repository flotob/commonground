// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React, { useState } from 'react'
import './CallHeader.css';
import ScreenAwarePopover from 'components/atoms/ScreenAwarePopover/ScreenAwarePopover';
import Button from "components/atoms/Button/Button";
import DocumentTextIcon from "@heroicons/react/20/solid/DocumentTextIcon";
import MemberPreview from "components/atoms/MemberPreview/MemberPreview";
import ScreenAwareModal from "components/atoms/ScreenAwareModal/ScreenAwareModal";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import VoiceChatOptionsModal from "components/molecules/VoiceChatOptionsModal/VoiceChatOptionsModal";
import { useWindowSizeContext } from 'context/WindowSizeProvider';
import { CallTimer } from '../CallTimer';
import { useCallContext } from 'context/CallProvider';

type Props = {
  name: string;
  roomId: string;
  description: string | null;
  membersInCall: Models.User.Data[];
  standalone?: boolean;
}

const CallHeader: React.FC<Props> = (props) => {
  const { name, roomId, description, membersInCall, standalone } = props;
  const { startTime } = useCallContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isMobile } = useWindowSizeContext();

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  }

  const className = [
    'call-header',
    standalone ? 'standalone' : ''
  ].join(' ').trim();

  return (<div className={className}>
    <div className="call-info">
      <ScreenAwarePopover
        triggerType='click'
        closeOn='toggle'
        triggerContent={<div className="text-channel-name flex gap-1 items-center cursor-pointer cg-text-lg-500">
          <span>💬</span>
          {name}
          <ChevronDownIcon className='w-5 h-5' />
        </div>}
        tooltipContent={<VoiceChatOptionsModal callId={roomId} />}
        placement='bottom-start'
        tooltipClassName='p-0'
        closeDelay={500}
        offset={8}
      />
      {description && <>
        <Button
          role="chip"
          text='Agenda'
          iconLeft={<DocumentTextIcon className='w-5 h-5' />}
          onClick={toggleModal}
        />
        <ScreenAwareModal closeOnClick title="Agenda" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
          {!isMobile && description}
          {isMobile && <div className='cg-text-main p-4'>
            {description}
          </div>}
        </ScreenAwareModal>
      </>}
    </div>
    {isMobile && <CallTimer startTime={startTime} />}
    {!isMobile && <div className="call-members">
      {membersInCall && <MemberPreview
        memberIds={membersInCall.map(member => member.id)}
        memberCount={membersInCall.length}
        hideStatus
      />}
    </div>}
  </div>);
}

export default React.memo(CallHeader);
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// Additional terms: see LICENSE-ADDITIONAL-TERMS.md

import React, { useState } from "react";
import { CallTimer } from "components/organisms/CallPage/CallTimer";
import { DocumentTextIcon } from "@heroicons/react/20/solid";
import dayjs from "dayjs";

import './CallItem.css';
import AudioWaves from "../AudioWidget/AudioWaves";
import ScreenAwareModal from "components/atoms/ScreenAwareModal/ScreenAwareModal";
import MemberPreview2 from "components/atoms/MemberPreview/MemberPreview2";

interface CallItemProperties {
  call: Models.Calls.Call;
  active: boolean;
  navigateToCall: (call: Models.Calls.Call) => void;
}

const CallItem: React.FC<CallItemProperties> = ({ call, navigateToCall, active }: CallItemProperties) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const className = [
    'call-item',
    active ? 'active' : ''
  ].join(' ').trim();

  return (<>
    <div
      key={call.id}
      className={className}
      onClick={() => navigateToCall(call)}
    >
      <div className="flex items-center gap-2 justify-between overflow-hidden">
        <div className="call-item-title flex items-center gap-1 overflow-hidden">
          <AudioWaves />
          <span className="call-item-title-text">{call.title}</span>
        </div>
        <CallTimer startTime={dayjs(call.startedAt)} noBg />
      </div>
      <div className="flex items-center justify-between">
        <MemberPreview2
          memberIds={call.previewUserIds}
          memberCount={call.callMembers}
          limit={6}
        />
        {!!call.description && <DocumentTextIcon className='cg-text-secondary w-5 h-5' onClick={(ev) => {
          ev.stopPropagation();
          setIsModalOpen(!isModalOpen);
        }} />}
      </div>
    </div>
    {!!call.description && <ScreenAwareModal
      isOpen={isModalOpen}
      title="Agenda"
      children={call.description}
      onClose={() => setIsModalOpen(false)}
      closeOnClick
    />}
  </>)
}

export default React.memo(CallItem);